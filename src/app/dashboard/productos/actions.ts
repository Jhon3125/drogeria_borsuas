"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { productoSchema } from "@/lib/validaciones/producto";

export type EstadoForm =
    | {
        ok?: boolean;
        error?: string;
        errores?: Record<string, string>;
        valores?: Record<string, any>;
    }
    | undefined;

function aplanar(issues: { path: PropertyKey[]; message: string }[]) {
    const errores: Record<string, string> = {};
    for (const i of issues) {
        const campo = String(i.path[0]);
        if (!errores[campo]) errores[campo] = i.message;
    }
    return errores;
}

export async function crearProducto(
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    // Permisos según el plan 4B
    await exigirRol(["SUPER_ADMIN", "ADMIN", "COMPRAS"]);

    const datos = Object.fromEntries(formData);
    const parsed = productoSchema.safeParse(datos);

    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: datos,
        };
    }

    try {
        await prisma.producto.create({
            data: {
                codigo: parsed.data.codigo,
                nombre: parsed.data.nombre,
                descripcion: parsed.data.descripcion,
                categoriaId: parsed.data.categoriaId,
                unidadMedida: parsed.data.unidadMedida,
                moneda: parsed.data.moneda,
                precioCompra: new Prisma.Decimal(parsed.data.precioCompra),
                precioVenta: new Prisma.Decimal(parsed.data.precioVenta),
                stockMinimo: parsed.data.stockMinimo,
                estado: true, // Siempre activo al crear
            },
        });

        revalidatePath("/dashboard/productos");
        return { ok: true };
    } catch (error: any) {
        if (error.code === "P2002") {
            return {
                error: "El código SKU ya existe en el sistema.",
                valores: datos,
            };
        }
        return { error: "Ocurrió un error al crear el producto.", valores: datos };
    }
}

export async function actualizarProducto(
    id: number,
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    await exigirRol(["SUPER_ADMIN", "ADMIN", "COMPRAS"]);

    const datos = Object.fromEntries(formData);
    const parsed = productoSchema.safeParse(datos);

    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: datos,
        };
    }

    try {
        await prisma.producto.update({
            where: { id },
            data: {
                // No actualizamos el código SKU por seguridad e integridad de lotes
                nombre: parsed.data.nombre,
                descripcion: parsed.data.descripcion,
                categoriaId: parsed.data.categoriaId,
                unidadMedida: parsed.data.unidadMedida,
                moneda: parsed.data.moneda,
                precioCompra: new Prisma.Decimal(parsed.data.precioCompra),
                precioVenta: new Prisma.Decimal(parsed.data.precioVenta),
                stockMinimo: parsed.data.stockMinimo,
            },
        });

        revalidatePath("/dashboard/productos");
        return { ok: true };
    } catch (error) {
        return { error: "Ocurrió un error al actualizar el producto.", valores: datos };
    }
}

export async function cambiarEstadoProducto(id: number, nuevoEstado: boolean) {
    await exigirRol(["SUPER_ADMIN", "ADMIN", "COMPRAS"]);
    try {
        await prisma.producto.update({
            where: { id },
            data: { estado: nuevoEstado },
        });
        revalidatePath("/dashboard/productos");
        return { ok: true };
    } catch (error) {
        return { error: "No se pudo cambiar el estado." };
    }
}