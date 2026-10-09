import type { RolUsuario } from "@/generated/prisma/enums";
export const ROLES_COMPRAS_LECTURA: RolUsuario[] = ["SUPER_ADMIN", "ADMIN", "COMPRAS", "ALMACEN"];
export const ROLES_COMPRAS_GESTION: RolUsuario[] = ["SUPER_ADMIN", "ADMIN", "COMPRAS"];
export const ROLES_RECEPCION: RolUsuario[] = ["SUPER_ADMIN", "ADMIN", "ALMACEN"];
