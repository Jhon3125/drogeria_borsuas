
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_AJUSTE_INVENTARIO } from "@/lib/permisos";

export type EstadoAjuste = {
    ok?: boolean;
    error?: string;
    errores?: Record<string, string>;
} | undefined;

const ajusteSchema = z.object({
    productoId: z.coerce.number<number>().int().positive(),
    tipo: z.enum(["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"]),
    cantidad: z.coerce.number<number>()
        .int("La cantidad debe ser un número entero")
        .positive("La cantidad debe ser mayor que cero")
        .max(1000000, "La cantidad es demasiado grande"),
    motivo: z.string()
        .trim()
        .min(5, "Explica el motivo del ajuste (mínimo 5 caracteres)")
        .max(500, "El motivo es demasiado largo"),
});

export async function registrarAjuste(
    _prev: EstadoAjuste,
    formData: FormData
): Promise<EstadoAjuste> {
    const responsable = await exigirRol(ROLES_AJUSTE_INVENTARIO);

    const usuarioId = Number(responsable.id);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return {
            error: "No se pudo identificar al usuario responsable. Vuelve a iniciar sesión.",
        };
    }

    const parsed = ajusteSchema.safeParse({
        productoId: formData.get("productoId"),
        tipo: formData.get("tipo"),
        cantidad: formData.get("cantidad"),
        motivo: formData.get("motivo"),
    });

    if (!parsed.success) {
        const errores: Record<string, string> = {};

        for (const issue of parsed.error.issues) {
            const campo = String(issue.path[0]);
            if (!errores[campo]) {
                errores[campo] = issue.message;
            }
        }

        return { errores };
    }

    const { productoId, tipo, cantidad, motivo } = parsed.data;

    try {
        await prisma.$transaction(async (tx) => {
            const producto = await tx.producto.findUnique({
                where: { id: productoId },
                select: {
                    id: true,
                    estado: true,
                },
            });

            if (!producto || !producto.estado) {
                throw new Error(
                    "El producto no existe o está inactivo."
                );
            }

            if (tipo === "AJUSTE_NEGATIVO") {
                const actualizado = await tx.producto.updateMany({
                    where: {
                        id: productoId,
                        estado: true,
                        stockActual: { gte: cantidad },
                    },
                    data: {
                        stockActual: {
                            decrement: cantidad,
                        },
                    },
                });

                if (actualizado.count !== 1) {
                    throw new Error(
                        "No hay existencias suficientes para realizar la salida."
                    );
                }
            } else {
                const actualizado = await tx.producto.updateMany({
                    where: {
                        id: productoId,
                        estado: true,
                    },
                    data: {
                        stockActual: {
                            increment: cantidad,
                        },
                    },
                });

                if (actualizado.count !== 1) {
                    throw new Error(
                        "No se pudo actualizar el producto."
                    );
                }
            }

            await tx.movimientoInventario.create({
                data: {
                    productoId,
                    usuarioId,
                    tipo,
                    cantidad,
                    motivo,
                    loteId: null,
                },
            });
        });

        revalidatePath("/dashboard/inventario");
        revalidatePath("/dashboard/inventario/movimientos");
        revalidatePath("/dashboard");

        return { ok: true };
    } catch (error) {
        return {
            error:
                error instanceof Error &&
                    error.message.startsWith("No ")
                    ? error.message
                    : error instanceof Error &&
                        error.message ===
                        "El producto no existe o está inactivo."
                        ? error.message
                        : "No se pudo registrar el ajuste. Intenta nuevamente.",
        };
    }
}
