
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { exigirRol } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

const ROLES_GESTION_CALIDAD = [
    "SUPER_ADMIN",
    "ADMIN",
] as const;

const esquemaCalidad = z.object({
    loteId: z.coerce.number<number>().int().positive(),
    estadoCalidad: z.enum([
        "DISPONIBLE",
        "CUARENTENA",
        "BLOQUEADO",
    ]),
    motivo: z.string()
        .trim()
        .min(10, "Indica un motivo de al menos 10 caracteres.")
        .max(500, "El motivo no debe superar 500 caracteres."),
});

export type EstadoCambioCalidad =
    | { ok?: string; error?: string }
    | undefined;

export async function cambiarEstadoCalidadLote(
    _anterior: EstadoCambioCalidad,
    formulario: FormData
): Promise<EstadoCambioCalidad> {
    const usuario = await exigirRol([
        ...ROLES_GESTION_CALIDAD,
    ]);

    const validacion = esquemaCalidad.safeParse({
        loteId: formulario.get("loteId"),
        estadoCalidad: formulario.get("estadoCalidad"),
        motivo: formulario.get("motivo"),
    });

    if (!validacion.success) {
        return {
            error:
                validacion.error.issues[0]?.message ??
                "Datos inválidos.",
        };
    }

    const { loteId, estadoCalidad, motivo } = validacion.data;
    const usuarioId = Number(usuario.id);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return { error: "Responsable inválido." };
    }

    try {
        await prisma.$transaction(
            async (tx) => {
                const lote = await tx.lote.findUnique({
                    where: { id: loteId },
                    select: {
                        id: true,
                        productoId: true,
                        estadoCalidad: true,
                        cantidadInicial: true,
                        cantidadDisponible: true,
                        recepciones: {
                            select: { cantidad: true },
                        },
                    },
                });

                if (!lote) {
                    throw new Error("El lote no existe.");
                }

                if (lote.estadoCalidad === estadoCalidad) {
                    throw new Error(
                        "El lote ya tiene ese estado de calidad."
                    );
                }

                // Validamos que la administración de calidad no
                // se utilice para liberar inventario no conciliado.
                if (estadoCalidad === "DISPONIBLE") {
                    const totalRecibido =
                        lote.recepciones.reduce(
                            (total, recepcion) =>
                                total + recepcion.cantidad,
                            0
                        );

                    if (
                        lote.recepciones.length === 0 ||
                        totalRecibido < lote.cantidadInicial ||
                        lote.cantidadDisponible < 0 ||
                        lote.cantidadDisponible >
                        lote.cantidadInicial
                    ) {
                        throw new Error(
                            "No se puede liberar un lote sin respaldo válido de recepciones."
                        );
                    }

                    // La liberación no debe volver apto
                    // para venta a un lote ya vencido.
                    const hoyPeru = new Intl.DateTimeFormat(
                        "en-CA",
                        {
                            timeZone: "America/Lima",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        }
                    ).format(new Date());

                    const vencimiento = await tx.lote.findUnique({
                        where: { id: loteId },
                        select: { fechaVencimiento: true },
                    });

                    const fechaISO = vencimiento?.fechaVencimiento
                        .toISOString()
                        .slice(0, 10);

                    if (fechaISO && fechaISO < hoyPeru) {
                        throw new Error(
                            "No se puede liberar un lote vencido."
                        );
                    }
                }

                const actualizado = await tx.lote.updateMany({
                    where: {
                        id: loteId,
                        estadoCalidad: lote.estadoCalidad,
                    },
                    data: {
                        estadoCalidad,
                    },
                });

                if (actualizado.count !== 1) {
                    throw new Error(
                        "El estado del lote cambió. Actualiza la página."
                    );
                }

                await tx.historialCalidadLote.create({
                    data: {
                        loteId,
                        usuarioId,
                        accion: "CAMBIO_ESTADO",
                        estadoAnterior: lote.estadoCalidad,
                        estadoNuevo: estadoCalidad,
                        motivo,
                    },
                });
            },
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
                timeout: 20000,
            }
        );
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
        ) {
            return {
                error:
                    "El lote fue modificado por otra operación. Actualiza la página.",
            };
        }

        return {
            error:
                error instanceof Error
                    ? error.message
                    : "No se pudo cambiar el estado del lote.",
        };
    }

    const lote = await prisma.lote.findUnique({
        where: { id: loteId },
        select: { productoId: true },
    });

    revalidatePath("/dashboard/lotes");
    revalidatePath(`/dashboard/lotes/${loteId}`);
    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard");

    if (lote) {
        revalidatePath(
            `/dashboard/inventario/producto/${lote.productoId}`
        );
    }

    return { ok: "Estado de calidad actualizado correctamente." };
}
