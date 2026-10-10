import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const MAX_INTENTOS = 3;

class CuentaBloqueada extends CredentialsSignin {
    code = "bloqueado";
}
class CuentaInactiva extends CredentialsSignin {
    code = "inactivo";
}

const esquema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsed = esquema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;
                const usuario = await prisma.usuario.findUnique({
                    where: { email: email.toLowerCase() },
                });
                if (!usuario) return null;

                if (usuario.estado === "BLOQUEADO") throw new CuentaBloqueada();
                if (usuario.estado === "INACTIVO") throw new CuentaInactiva();

                const correcta = await bcrypt.compare(password, usuario.passwordHash);

                if (!correcta) {
                    // Incrementos condicionados y atómicos: dos intentos simultáneos
                    // no sobrescriben el contador ni evitan el bloqueo del tercero.
                    const incremento = await prisma.usuario.updateMany({
                        where: {
                            id: usuario.id,
                            estado: "ACTIVO",
                            intentosFallidos: { lt: MAX_INTENTOS - 1 },
                        },
                        data: { intentosFallidos: { increment: 1 } },
                    });
                    if (incremento.count === 0) {
                        await prisma.usuario.updateMany({
                            where: {
                                id: usuario.id,
                                estado: "ACTIVO",
                                intentosFallidos: { gte: MAX_INTENTOS - 1 },
                            },
                            data: {
                                estado: "BLOQUEADO",
                                intentosFallidos: { increment: 1 },
                            },
                        });
                    }
                    return null;
                }

                // Si cambió el estado durante bcrypt.compare, ya no autorizar.
                const reinicio = await prisma.usuario.updateMany({
                    where: { id: usuario.id, estado: "ACTIVO" },
                    data: { intentosFallidos: 0 },
                });
                if (reinicio.count === 0) throw new CuentaBloqueada();

                return {
                    id: String(usuario.id),
                    name: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol,
                };
            },
        }),
    ],
});