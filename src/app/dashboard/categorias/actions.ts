"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_GESTION_CATALOGO } from "@/lib/permisos";
import { categoriaSchema } from "@/lib/validaciones/categoria";

export type EstadoForm =
    | {
        ok?: boolean;
        error?: string;
        errores?: Record<string, string>;
        valores?: Record<string, string>;
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

async function nombreDuplicado(nombre: string, excluirId?: number) {
    const existe = await prisma.categoria.findFirst({
        where: {
            nombre: { equals: nombre, mode: "insensitive" },
            ...(excluirId ? { NOT: { id: excluirId } } : {}),
        },
        select: { id: true },
    });
    return !!existe;
}

export async function crearCategoria(
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    await exigirRol(ROLES_GESTION_CATALOGO);

    const datos = Object.fromEntries(formData) as Record<string, string>;
    const parsed = categoriaSchema.safeParse(datos);
    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: { nombre: datos.nombre, descripcion: datos.descripcion },
        };
    }

    const { nombre, descripcion } = parsed.data;

    if (await nombreDuplicado(nombre)) {
        return {
            errores: { nombre: "Ya existe una categoría con ese nombre" },
            valores: { nombre, descripcion },
        };
    }

    await prisma.categoria.create({
        data: { nombre, descripcion: descripcion || null },
    });

    revalidatePath("/dashboard/categorias");
    return { ok: true };
}

export async function actualizarCategoria(
    id: number,
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    await exigirRol(ROLES_GESTION_CATALOGO);

    const datos = Object.fromEntries(formData) as Record<string, string>;
    const parsed = categoriaSchema.safeParse(datos);
    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: { nombre: datos.nombre, descripcion: datos.descripcion },
        };
    }

    const { nombre, descripcion } = parsed.data;

    if (await nombreDuplicado(nombre, id)) {
        return {
            errores: { nombre: "Ya existe una categoría con ese nombre" },
            valores: { nombre, descripcion },
        };
    }

    await prisma.categoria.update({
        where: { id },
        data: { nombre, descripcion: descripcion || null },
    });

    revalidatePath("/dashboard/categorias");
    return { ok: true };
}

export async function eliminarCategoria(id: number): Promise<EstadoForm> {
    await exigirRol(ROLES_GESTION_CATALOGO);

    const productos = await prisma.producto.count({ where: { categoriaId: id } });
    if (productos > 0) {
        return {
            error: `No se puede eliminar: tiene ${productos} producto(s) asociado(s).`,
        };
    }

    try {
        await prisma.categoria.delete({ where: { id } });
    } catch {
        return { error: "No se pudo eliminar la categoría. Intenta nuevamente." };
    }

    revalidatePath("/dashboard/categorias");
    return { ok: true };
}