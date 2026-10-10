import type { NextAuthConfig } from "next-auth";
import type { RolUsuario } from "@/generated/prisma/enums";

export const authConfig = {
    pages: { signIn: "/login" },
    session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 horas
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const logueado = !!auth?.user;
            const enLogin = nextUrl.pathname.startsWith("/login");

            if (enLogin) {
                return logueado
                    ? Response.redirect(new URL("/dashboard/inicio", nextUrl))
                    : true;
            }
            return logueado;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.rol = user.rol;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            session.user.rol = token.rol as RolUsuario;
            return session;
        },
    },
} satisfies NextAuthConfig;