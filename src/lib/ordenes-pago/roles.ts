
import type { RolUsuario } from "@/generated/prisma/enums";

export const ROLES_OP_LECTURA: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
];

export const ROLES_OP_SOLICITUD: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
];

export const ROLES_OP_AUTORIZACION: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
];

export const ROLES_OP_DESEMBOLSO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
];
