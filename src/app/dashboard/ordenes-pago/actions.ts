
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

import {
    ROLES_OP_SOLICITUD,
    ROLES_OP_AUTORIZACION,
    ROLES_OP_DESEMBOLSO,
} from "@/lib/ordenes-pago/roles";

import { calcularSaldoOrdenCompra } from "@/lib/ordenes-pago/saldos";

export type EstadoCrearOrdenPago =
    | {
        ok?: string;
        error?: string;
        ordenPagoId?: number;
    }
    | undefined;

const esquemaCrearOrdenPago = z.object({
    compraId: z.number().int().positive(),

    montoSolicitado: z
        .string()
        .trim()
        .regex(
            /^\d{1,10}(\.\d{1,2})?$/,
            "Ingresa un importe monetario válido."
        ),

    numeroFactura: z
        .string()
        .trim()
        .max(100)
        .optional()
        .default(""),

    observaciones: z
        .string()
        .trim()
        .max(2000)
        .optional()
        .default(""),
});

class ErrorNegocio extends Error {
    constructor(mensaje: string) {
        super(mensaje);
        this.name = "ErrorNegocio";
    }
}

export async function crearOrdenPago(
    _anterior: EstadoCrearOrdenPago,
    formulario: FormData
): Promise<EstadoCrearOrdenPago> {
    const usuario = await exigirRol(ROLES_OP_SOLICITUD);
    const usuarioId = Number(usuario.id);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return {
            error: "No se pudo identificar al usuario solicitante.",
        };
    }

    const datos = esquemaCrearOrdenPago.safeParse({
        compraId: Number(formulario.get("compraId")),
        montoSolicitado: String(
            formulario.get("montoSolicitado") ?? ""
        ),
        numeroFactura: String(
            formulario.get("numeroFactura") ?? ""
        ),
        observaciones: String(
            formulario.get("observaciones") ?? ""
        ),
    });

    if (!datos.success) {
        return {
            error:
                datos.error.issues[0]?.message ??
                "Los datos ingresados no son válidos.",
        };
    }

    const {
        compraId,
        montoSolicitado,
        numeroFactura,
        observaciones,
    } = datos.data;

    const monto = new Prisma.Decimal(montoSolicitado);

    if (monto.lte(0)) {
        return {
            error: "El importe solicitado debe ser mayor que cero.",
        };
    }

    if (monto.gt("9999999999.99")) {
        return {
            error: "El importe solicitado excede el límite permitido.",
        };
    }

    try {
        const ordenPagoId = await prisma.$transaction(
            async (tx) => {
                /*
                 * Serializamos las solicitudes financieras de una
                 * misma OC mediante un bloqueo de PostgreSQL.
                 *
                 * Todas las futuras operaciones que cambien el
                 * importe comprometido deben respetar este bloqueo.
                 */
                await tx.$queryRaw<{ acquired: number }[]>`
                    SELECT 1 AS acquired
                    FROM pg_advisory_xact_lock(847201, ${compraId})
                `;

                const compra = await tx.compra.findUnique({
                    where: {
                        id: compraId,
                    },
                    select: {
                        id: true,
                        moneda: true,
                        estado: true,
                        detalles: {
                            select: {
                                cantidad: true,
                                precioUnitario: true,
                                recepciones: {
                                    select: {
                                        cantidad: true,
                                    },
                                },
                            },
                        },
                        ordenesPago: {
                            select: {
                                estado: true,
                                montoSolicitado: true,
                            },
                        },
                    },
                });

                if (!compra) {
                    throw new ErrorNegocio(
                        "La Orden de Compra seleccionada no existe."
                    );
                }

                if (
                    !["PARCIAL", "RECIBIDO"].includes(
                        compra.estado
                    )
                ) {
                    throw new ErrorNegocio(
                        "Solo se pueden solicitar pagos por compras con mercadería recibida."
                    );
                }

                const saldos = calcularSaldoOrdenCompra(
                    compra.detalles,
                    compra.ordenesPago
                );

                if (saldos.valorRecibido.lte(0)) {
                    throw new ErrorNegocio(
                        "La Orden de Compra aún no tiene un valor recibido disponible para pago."
                    );
                }

                if (monto.gt(saldos.disponible)) {
                    throw new ErrorNegocio(
                        `El importe solicitado supera el saldo disponible de ${compra.moneda} ${saldos.disponible.toFixed(2)}.`
                    );
                }

                const ordenPago = await tx.ordenPago.create({
                    data: {
                        compraId: compra.id,
                        solicitanteId: usuarioId,
                        moneda: compra.moneda,
                        montoSolicitado: monto,
                        numeroFactura:
                            numeroFactura || null,
                        observaciones:
                            observaciones || null,
                        estado: "SOLICITADA",
                    },
                    select: {
                        id: true,
                    },
                });

                await tx.historialOrdenPago.create({
                    data: {
                        ordenPagoId: ordenPago.id,
                        usuarioId,
                        accion: "CREACION",
                        estadoAnterior: null,
                        estadoNuevo: "SOLICITADA",
                        descripcion:
                            `Solicitud registrada por ` +
                            `${compra.moneda} ${monto.toFixed(2)}.`,
                    },
                });

                return ordenPago.id;
            },
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
                timeout: 20000,
                maxWait: 10000,
            }
        );

        revalidatePath("/dashboard/ordenes-pago");
        revalidatePath("/dashboard/compras");
        revalidatePath(`/dashboard/compras/${compraId}`);

        return {
            ok: "Orden de Pago solicitada correctamente.",
            ordenPagoId,
        };
    } catch (error) {
        if (error instanceof ErrorNegocio) {
            return {
                error: error.message,
            };
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
        ) {
            return {
                error:
                    "Otra operación modificó los datos financieros de esta compra. Actualiza la información e inténtalo nuevamente.",
            };
        }

        console.error("Error al solicitar Orden de Pago:", error);

        return {
            error:
                "No se pudo registrar la solicitud de pago. Inténtalo nuevamente.",
        };
    }
}


const esquemaDecision = z.object({
    ordenPagoId: z.coerce.number().int().positive(),
});

const esquemaRechazo = esquemaDecision.extend({
    motivo: z.string().trim().min(10, {
        message: "El motivo debe tener al menos 10 caracteres.",
    }).max(1000),
});

export type EstadoDecisionOP = {
    ok?: string;
    error?: string;
} | undefined;

async function procesarDecisionOP(
    ordenPagoId: number,
    usuarioId: number,
    decision: "APROBADA" | "RECHAZADA",
    motivo?: string
) {
    await prisma.$transaction(async (tx) => {
        // Usamos el mismo bloqueo por OC que crearOrdenPago().
        // Así el rechazo y las nuevas solicitudes no compiten
        // por el saldo comprometido de la misma compra.
        const referencia = await tx.ordenPago.findUnique({
            where: { id: ordenPagoId },
            select: { compraId: true },
        });

        if (!referencia) {
            throw new ErrorNegocio(
                "La Orden de Pago no existe."
            );
        }

        await tx.$queryRaw<{ acquired: number }[]>`
            SELECT 1 AS acquired
            FROM pg_advisory_xact_lock(
                847201,
                ${referencia.compraId}
            )
        `;

        const orden = await tx.ordenPago.findUnique({
            where: { id: ordenPagoId },
            select: {
                id: true,
                estado: true,
                montoSolicitado: true,
                moneda: true,
                desembolsos: {
                    select: { id: true },
                    take: 1,
                },
            },
        });

        if (!orden) {
            throw new ErrorNegocio(
                "La Orden de Pago no existe."
            );
        }

        if (orden.estado !== "SOLICITADA") {
            throw new ErrorNegocio(
                "Esta Orden de Pago ya fue procesada. Actualiza la página."
            );
        }

        if (orden.desembolsos.length > 0) {
            throw new ErrorNegocio(
                "No es posible modificar una solicitud con desembolsos."
            );
        }

        const actualizacion = await tx.ordenPago.updateMany({
            where: {
                id: ordenPagoId,
                estado: "SOLICITADA",
            },
            data: {
                estado: decision,
                autorizadorId:
                    decision === "APROBADA" ? usuarioId : null,
                fechaAutorizacion:
                    decision === "APROBADA" ? new Date() : null,
                motivoRechazo:
                    decision === "RECHAZADA" ? motivo : null,
            },
        });

        if (actualizacion.count !== 1) {
            throw new ErrorNegocio(
                "La orden cambió de estado. Actualiza la página."
            );
        }

        await tx.historialOrdenPago.create({
            data: {
                ordenPagoId,
                usuarioId,
                accion:
                    decision === "APROBADA"
                        ? "APROBACION"
                        : "RECHAZO",
                estadoAnterior: "SOLICITADA",
                estadoNuevo: decision,
                descripcion:
                    decision === "APROBADA"
                        ? `Solicitud autorizada por ${orden.moneda} ${orden.montoSolicitado.toFixed(2)}.`
                        : `Solicitud rechazada. Motivo: ${motivo}`,
            },
        });
    }, {
        isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
        maxWait: 10000,
    });

    revalidatePath("/dashboard/ordenes-pago");
    revalidatePath(`/dashboard/ordenes-pago/${ordenPagoId}`);
}

function errorDecision(error: unknown): EstadoDecisionOP {
    if (error instanceof ErrorNegocio) {
        return { error: error.message };
    }

    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
    ) {
        return {
            error:
                "La orden fue modificada por otra operación. Actualiza la página e inténtalo nuevamente.",
        };
    }

    console.error("Error al autorizar/rechazar OP:", error);

    return {
        error: "No se pudo procesar la Orden de Pago.",
    };
}

export async function aprobarOrdenPago(
    _anterior: EstadoDecisionOP,
    formulario: FormData
): Promise<EstadoDecisionOP> {
    const usuario = await exigirRol(ROLES_OP_AUTORIZACION);
    const datos = esquemaDecision.safeParse({
        ordenPagoId: formulario.get("ordenPagoId"),
    });

    if (!datos.success) {
        return { error: "La Orden de Pago indicada no es válida." };
    }

    try {
        await procesarDecisionOP(
            datos.data.ordenPagoId,
            Number(usuario.id),
            "APROBADA"
        );

        return { ok: "Orden de Pago aprobada correctamente." };
    } catch (error) {
        return errorDecision(error);
    }
}

export async function rechazarOrdenPago(
    _anterior: EstadoDecisionOP,
    formulario: FormData
): Promise<EstadoDecisionOP> {
    const usuario = await exigirRol(ROLES_OP_AUTORIZACION);

    const datos = esquemaRechazo.safeParse({
        ordenPagoId: formulario.get("ordenPagoId"),
        motivo: formulario.get("motivo"),
    });

    if (!datos.success) {
        return {
            error:
                datos.error.issues[0]?.message ??
                "Revisa el motivo del rechazo.",
        };
    }

    try {
        await procesarDecisionOP(
            datos.data.ordenPagoId,
            Number(usuario.id),
            "RECHAZADA",
            datos.data.motivo
        );

        return { ok: "Orden de Pago rechazada correctamente." };
    } catch (error) {
        return errorDecision(error);
    }
}


export type EstadoRegistrarDesembolso =
    | { ok?: string; error?: string }
    | undefined;

const esquemaDesembolso = z.object({
    ordenPagoId: z.coerce.number().int().positive(),
    monto: z.string().trim().regex(
        /^\d{1,10}(\.\d{1,2})?$/,
        "Ingresa un importe válido, con máximo dos decimales."
    ),
    metodo: z.enum([
        "TRANSFERENCIA",
        "EFECTIVO",
        "CHEQUE",
        "OTRO",
    ]),
    fechaPago: z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Selecciona una fecha válida."
    ),
    referencia: z.string().trim().max(150),
    observaciones: z.string().trim().max(2000),
    claveIdempotencia: z.string().uuid(),
});

function fechaCalendarioUTC(valor: string): Date {
    const fecha = new Date(`${valor}T12:00:00.000Z`);

    if (
        Number.isNaN(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== valor
    ) {
        throw new ErrorNegocio(
            "La fecha de pago no es válida."
        );
    }

    return fecha;
}

function fechaHoyPeru(): string {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const obtener = (tipo: string) =>
        partes.find((p) => p.type === tipo)?.value ?? "";

    return [
        obtener("year"),
        obtener("month"),
        obtener("day"),
    ].join("-");
}

export async function registrarDesembolso(
    _anterior: EstadoRegistrarDesembolso,
    formulario: FormData
): Promise<EstadoRegistrarDesembolso> {
    const usuario = await exigirRol(ROLES_OP_DESEMBOLSO);
    const usuarioId = Number(usuario.id);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return { error: "Responsable no válido." };
    }

    const validacion = esquemaDesembolso.safeParse({
        ordenPagoId: formulario.get("ordenPagoId"),
        monto: String(formulario.get("monto") ?? ""),
        metodo: formulario.get("metodo"),
        fechaPago: formulario.get("fechaPago"),
        referencia: String(formulario.get("referencia") ?? ""),
        observaciones: String(
            formulario.get("observaciones") ?? ""
        ),
        claveIdempotencia: String(
            formulario.get("claveIdempotencia") ?? ""
        ),
    });

    if (!validacion.success) {
        return {
            error:
                validacion.error.issues[0]?.message ??
                "Revisa los datos del desembolso.",
        };
    }

    const datos = validacion.data;

    let fechaPago: Date;

    try {
        fechaPago = fechaCalendarioUTC(datos.fechaPago);

        if (datos.fechaPago > fechaHoyPeru()) {
            throw new ErrorNegocio(
                "No puedes registrar un desembolso futuro."
            );
        }
    } catch (error) {
        return {
            error:
                error instanceof ErrorNegocio
                    ? error.message
                    : "Fecha de pago inválida.",
        };
    }

    const monto = new Prisma.Decimal(datos.monto);

    if (monto.lte(0) || monto.gt("9999999999.99")) {
        return {
            error: "El importe debe ser mayor que cero y estar dentro del límite permitido.",
        };
    }

    if (
        datos.metodo === "TRANSFERENCIA" &&
        !datos.referencia
    ) {
        return {
            error:
                "La referencia bancaria es obligatoria para transferencias.",
        };
    }

    try {
        await prisma.$transaction(
            async (tx) => {
                const referenciaOP = await tx.ordenPago.findUnique({
                    where: { id: datos.ordenPagoId },
                    select: { compraId: true },
                });

                if (!referenciaOP) {
                    throw new ErrorNegocio(
                        "La Orden de Pago no existe."
                    );
                }

                // Mismo bloqueo empleado en solicitudes y
                // autorizaciones de esta OC.
                await tx.$queryRaw<{ acquired: number }[]>`
                    SELECT 1 AS acquired
                    FROM pg_advisory_xact_lock(
                        847201,
                        ${referenciaOP.compraId}
                    )
                `;

                const desembolsoAnterior = await tx.desembolsoPago.findUnique({
                    where: {
                        claveIdempotencia: datos.claveIdempotencia,
                    },
                    select: {
                        ordenPagoId: true,
                        monto: true,
                        metodo: true,
                        fechaPago: true,
                        referencia: true,
                        observaciones: true,
                        responsableId: true,
                    },
                });

                if (desembolsoAnterior) {
                    const mismaOperacion =
                        desembolsoAnterior.ordenPagoId === datos.ordenPagoId &&
                        desembolsoAnterior.responsableId === usuarioId &&
                        desembolsoAnterior.monto.eq(monto) &&
                        desembolsoAnterior.metodo === datos.metodo &&
                        desembolsoAnterior.fechaPago.getTime() === fechaPago.getTime() &&
                        (desembolsoAnterior.referencia ?? "") === datos.referencia &&
                        (desembolsoAnterior.observaciones ?? "") === datos.observaciones;

                    if (!mismaOperacion) {
                        throw new ErrorNegocio(
                            "Este identificador ya fue utilizado para otra operación. Actualiza el formulario antes de continuar."
                        );
                    }

                    // El desembolso ya existe.
                    // No volvemos a actualizar la OP ni a registrar movimientos.
                    return;
                }

                const orden = await tx.ordenPago.findUnique({
                    where: { id: datos.ordenPagoId },
                    select: {
                        id: true,
                        compraId: true,
                        estado: true,
                        moneda: true,
                        montoSolicitado: true,
                        desembolsos: {
                            select: { monto: true },
                        },
                    },
                });

                if (!orden) {
                    throw new ErrorNegocio(
                        "La Orden de Pago no existe."
                    );
                }

                if (
                    !["APROBADA", "PAGO_PARCIAL"].includes(
                        orden.estado
                    )
                ) {
                    throw new ErrorNegocio(
                        "Solo pueden pagarse Órdenes de Pago aprobadas o parcialmente pagadas."
                    );
                }

                const acumulado = orden.desembolsos.reduce(
                    (total, desembolso) =>
                        total.add(desembolso.monto),
                    new Prisma.Decimal(0)
                );

                const saldo = orden.montoSolicitado.sub(acumulado);

                if (saldo.lte(0)) {
                    throw new ErrorNegocio(
                        "Esta orden no tiene saldo por desembolsar."
                    );
                }

                if (monto.gt(saldo)) {
                    throw new ErrorNegocio(
                        `El importe supera el saldo disponible de ${orden.moneda} ${saldo.toFixed(2)}.`
                    );
                }

                const siguienteEstado = monto.eq(saldo)
                    ? "PAGADA"
                    : "PAGO_PARCIAL";

                const actualizado = await tx.ordenPago.updateMany({
                    where: {
                        id: orden.id,
                        estado: orden.estado,
                    },
                    data: {
                        estado: siguienteEstado,
                    },
                });

                if (actualizado.count !== 1) {
                    throw new ErrorNegocio(
                        "La Orden de Pago cambió de estado. Actualiza la página."
                    );
                }

                const desembolso = await tx.desembolsoPago.create({
                    data: {
                        ordenPagoId: orden.id,
                        responsableId: usuarioId,
                        monto,
                        metodo: datos.metodo,
                        fechaPago,
                        referencia: datos.referencia || null,
                        observaciones: datos.observaciones || null,
                        claveIdempotencia: datos.claveIdempotencia,
                    },
                    select: { id: true },
                });

                await tx.historialOrdenPago.create({
                    data: {
                        ordenPagoId: orden.id,
                        usuarioId,
                        accion: "REGISTRO_DESEMBOLSO",
                        estadoAnterior: orden.estado,
                        estadoNuevo: siguienteEstado,
                        descripcion:
                            `Desembolso #${desembolso.id}: ` +
                            `${orden.moneda} ${monto.toFixed(2)} ` +
                            `mediante ${datos.metodo}. ` +
                            `Referencia: ${datos.referencia || "Sin referencia"}.`,
                    },
                });
            },
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
                timeout: 20000,
                maxWait: 10000,
            }
        );

        revalidatePath("/dashboard/ordenes-pago");
        revalidatePath(
            `/dashboard/ordenes-pago/${datos.ordenPagoId}`
        );

        return {
            ok: "Desembolso registrado correctamente.",
        };
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return {
                error:
                    "Se detectó una operación con el mismo identificador. Consulta el historial de desembolsos antes de reintentar.",
            };
        }
        if (error instanceof ErrorNegocio) {
            return { error: error.message };
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
        ) {
            return {
                error:
                    "Otra operación modificó la orden. Actualiza la página antes de volver a intentar.",
            };
        }

        console.error("Error al registrar desembolso:", error);

        return {
            error:
                "No se pudo registrar el desembolso. Verifica la operación antes de intentar nuevamente.",
        };
    }
}
