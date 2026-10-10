"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    crearUsuarioSchema,
    editarUsuarioSchema,
} from "@/lib/validaciones/usuario";

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

export async function crearUsuario(
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    await exigirRol(["SUPER_ADMIN"]);

    const datos = Object.fromEntries(formData) as Record<string, string>;
    const parsed = crearUsuarioSchema.safeParse(datos);

    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: { nombre: datos.nombre, email: datos.email, rol: datos.rol },
        };
    }

    const { nombre, email, password, rol } = parsed.data;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
        return {
            errores: { email: "Ya existe un usuario con este correo" },
            valores: { nombre, email, rol },
        };
    }

    try {
        await prisma.usuario.create({
            data: { nombre, email, rol, passwordHash: await bcrypt.hash(password, 12) },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return { errores: { email: "Ya existe un usuario con este correo" }, valores: { nombre, email, rol } };
        }
        return { error: "No se pudo crear el usuario." };
    }

    revalidatePath("/dashboard/usuarios");
    return { ok: true };
}

export async function actualizarUsuario(
    id: number,
    _prev: EstadoForm,
    formData: FormData
): Promise<EstadoForm> {
    const actual = await exigirRol(["SUPER_ADMIN"]);

    const datos = Object.fromEntries(formData) as Record<string, string>;
    const parsed = editarUsuarioSchema.safeParse(datos);

    if (!parsed.success) {
        return {
            errores: aplanar(parsed.error.issues),
            valores: { nombre: datos.nombre, rol: datos.rol, estado: datos.estado },
        };
    }

    const { nombre, rol, estado, password } = parsed.data;

    if (actual.id === String(id) && (rol !== "SUPER_ADMIN" || estado !== "ACTIVO")) {
        return {
            error: "No puedes quitarte el rol de Super Admin ni desactivar tu propia cuenta.",
            valores: { nombre, rol, estado },
        };
    }

    await prisma.usuario.update({
        where: { id },
        data: {
            nombre,
            rol,
            estado,
            ...(estado === "ACTIVO" ? { intentosFallidos: 0 } : {}),
            ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        },
    });

    revalidatePath("/dashboard/usuarios");
    return { ok: true };
}