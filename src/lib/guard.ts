import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { RolUsuario } from "@/generated/prisma/enums";

export async function exigirRol(rolesPermitidos: RolUsuario[]) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!rolesPermitidos.includes(session.user.rol)) redirect("/dashboard");
    return session.user;
}