import type { NextAuthConfig } from "next-auth";

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
                    ? Response.redirect(new URL("/dashboard", nextUrl))
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
            session.user.id = token.id;
            session.user.rol = token.rol;
            return session;
        },
    },
} satisfies NextAuthConfig;