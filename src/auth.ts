import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const MAX_INTENTOS = 5;

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
                    const intentos = usuario.intentosFallidos + 1;
                    await prisma.usuario.update({
                        where: { id: usuario.id },
                        data: {
                            intentosFallidos: intentos,
                            ...(intentos >= MAX_INTENTOS ? { estado: "BLOQUEADO" } : {}),
                        },
                    });
                    return null;
                }

                if (usuario.intentosFallidos > 0) {
                    await prisma.usuario.update({
                        where: { id: usuario.id },
                        data: { intentosFallidos: 0 },
                    });
                }

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