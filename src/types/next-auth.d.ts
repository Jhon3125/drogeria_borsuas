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

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        rol: RolUsuario;
    }
}