
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { exigirRol } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

type EstadoAccion = {
    ok?: string;
    error?: string;
} | undefined;

const ROLES_CALIDAD: (
    "SUPER_ADMIN" | "ADMIN"
)[] = ["SUPER_ADMIN", "ADMIN"];

const esquemaRegistro = z.object({
    loteId: z.coerce.number<number>().int().positive(),
    cantidad: z.coerce.number<number>().int().positive().max(1000000),
    motivo: z.string().trim().min(10).max(500),
});

const esquemaLiberacion = z.object({
    retencionId: z.coerce.number<number>().int().positive(),
    motivoLiberacion: z.string().trim().min(10).max(500),
});

function errorAccion(error: unknown): EstadoAccion {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
    ) {
        return {
            error: "Otra operación modificó el lote. Actualiza la página e inténtalo nuevamente.",
        };
    }

    if (error instanceof Error) {
        return { error: error.message };
    }

    return { error: "No se pudo completar la operación." };
}

function actualizarVistas(loteId: number, productoId: number) {
    revalidatePath("/dashboard/lotes");
    revalidatePath(`/dashboard/lotes/${loteId}`);
    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/producto/${productoId}`);
    revalidatePath("/dashboard");
}

/**
 * Bloqueo transaccional por lote.
 * Debe usarse también en los ajustes físicos de este lote.
 */
async function bloquearLote(
    tx: Prisma.TransactionClient,
    loteId: number
) {
    await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(847202, ${loteId})
    `;
}

export async function registrarRetencionLote(
    _anterior: EstadoAccion,
    formulario: FormData
): Promise<EstadoAccion> {
    const usuario = await exigirRol(ROLES_CALIDAD);
    const datos = esquemaRegistro.safeParse({
        loteId: formulario.get("loteId"),
        cantidad: formulario.get("cantidad"),
        motivo: formulario.get("motivo"),
    });

    if (!datos.success) {
        return {
            error: datos.error.issues[0]?.message ??
                "Datos de retención inválidos.",
        };
    }

    const usuarioId = Number(usuario.id);
    const { loteId, cantidad, motivo } = datos.data;

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return { error: "Responsable inválido." };
    }

    let productoId = 0;

    try {
        await prisma.$transaction(async (tx) => {
            await bloquearLote(tx, loteId);

            const lote = await tx.lote.findUnique({
                where: { id: loteId },
                select: {
                    productoId: true,
                    cantidadInicial: true,
                    cantidadDisponible: true,
                    recepciones: {
                        select: { cantidad: true },
                    },
                    retenciones: {
                        where: { estado: "ACTIVA" },
                        select: { cantidad: true },
                    },
                },
            });

            if (!lote) {
                throw new Error("El lote no existe.");
            }

            productoId = lote.productoId;

            const recibido = lote.recepciones.reduce(
                (total, r) => total + r.cantidad,
                0
            );

            const respaldado =
                lote.recepciones.length > 0 &&
                lote.cantidadInicial <= recibido &&
                lote.cantidadDisponible >= 0 &&
                lote.cantidadDisponible <= lote.cantidadInicial;

            if (!respaldado) {
                throw new Error(
                    "El lote no tiene respaldo válido de recepciones."
                );
            }

            const retenido = lote.retenciones.reduce(
                (total, r) => total + r.cantidad,
                0
            );

            if (retenido + cantidad > lote.cantidadDisponible) {
                throw new Error(
                    `No hay suficientes unidades libres. Disponibles para retener: ${Math.max(0, lote.cantidadDisponible - retenido)}.`
                );
            }

            await tx.retencionLote.create({
                data: {
                    loteId,
                    cantidad,
                    motivo,
                    estado: "ACTIVA",
                    registradoPorId: usuarioId,
                },
            });
        }, {
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            timeout: 20000,
            maxWait: 10000,
        });
    } catch (error) {
        return errorAccion(error);
    }

    actualizarVistas(loteId, productoId);

    return {
        ok: "Retención registrada correctamente.",
    };
}

export async function liberarRetencionLote(
    _anterior: EstadoAccion,
    formulario: FormData
): Promise<EstadoAccion> {
    const usuario = await exigirRol(ROLES_CALIDAD);
    const datos = esquemaLiberacion.safeParse({
        retencionId: formulario.get("retencionId"),
        motivoLiberacion: formulario.get("motivoLiberacion"),
    });

    if (!datos.success) {
        return {
            error: datos.error.issues[0]?.message ??
                "Indica un motivo válido de liberación (10 a 500 caracteres).",
        };
    }

    const usuarioId = Number(usuario.id);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return { error: "Responsable inválido." };
    }

    let loteId = 0;
    let productoId = 0;

    try {
        await prisma.$transaction(async (tx) => {
            const referencia = await tx.retencionLote.findUnique({
                where: {
                    id: datos.data.retencionId,
                },
                select: {
                    loteId: true,
                },
            });

            if (!referencia) {
                throw new Error("La retención no existe.");
            }

            loteId = referencia.loteId;

            await bloquearLote(tx, loteId);

            const retencion = await tx.retencionLote.findUnique({
                where: { id: datos.data.retencionId },
                select: {
                    estado: true,
                    lote: {
                        select: { productoId: true },
                    },
                },
            });

            if (!retencion) {
                throw new Error("La retención no existe.");
            }

            if (retencion.estado !== "ACTIVA") {
                throw new Error(
                    "Esta retención ya fue liberada."
                );
            }

            productoId = retencion.lote.productoId;

            const resultado = await tx.retencionLote.updateMany({
                where: {
                    id: datos.data.retencionId,
                    estado: "ACTIVA",
                },
                data: {
                    estado: "LIBERADA",
                    liberadoPorId: usuarioId,
                    fechaLiberacion: new Date(),
                    motivoLiberacion:
                        datos.data.motivoLiberacion,
                },
            });

            if (resultado.count !== 1) {
                throw new Error(
                    "La retención cambió de estado. Actualiza la página."
                );
            }
        }, {
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            timeout: 20000,
            maxWait: 10000,
        });
    } catch (error) {
        return errorAccion(error);
    }

    actualizarVistas(loteId, productoId);

    return {
        ok: "Retención liberada correctamente.",
    };
}
