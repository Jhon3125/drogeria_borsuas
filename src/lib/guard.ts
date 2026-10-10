import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RolUsuario } from "@/generated/prisma/enums";

/** Consulta el estado/rol vigente: revoca permisos incluso con JWT previo. */
export async function usuarioVigente() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const id = Number(session.user.id);
    if (!Number.isSafeInteger(id) || id <= 0) redirect("/cuenta-sin-acceso");
    const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: { id: true, nombre: true, email: true, estado: true, rol: true },
    });
    if (!usuario || usuario.estado !== "ACTIVO") redirect("/cuenta-sin-acceso");
    return { id: String(usuario.id), name: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

export async function exigirRol(rolesPermitidos: RolUsuario[]) {
    const usuario = await usuarioVigente();
    if (!rolesPermitidos.includes(usuario.rol)) redirect("/dashboard");
    return usuario;
}
