import type { RolUsuario } from "@/generated/prisma/enums";

export const ROLES_CONSULTA_CATALOGO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
    "COMERCIAL",
];

export const ROLES_GESTION_CATALOGO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
];