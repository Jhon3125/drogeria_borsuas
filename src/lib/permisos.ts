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

export const ROLES_CONSULTA_INVENTARIO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
    "COMERCIAL",
    "ALMACEN",
];

export const ROLES_AJUSTE_INVENTARIO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "ALMACEN",
];