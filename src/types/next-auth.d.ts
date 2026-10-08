import type { RolUsuario } from "@/generated/prisma/enums";

declare module "next-auth" {
    interface User {
        rol: RolUsuario;
    }
    interface Session {
        user: {
            id: string;
            rol: RolUsuario;
        } & import("next-auth").DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        rol: RolUsuario;
    }
}