import type { RolUsuario } from "@/generated/prisma/enums";

export type ItemNav = {
    titulo: string;
    href: string;
    roles: RolUsuario[];
};

const TODOS: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMERCIAL",
    "COMPRAS",
    "ALMACEN",
    "CONDUCTOR",
];

export const NAVEGACION: ItemNav[] = [
    { titulo: "Inicio", href: "/dashboard", roles: TODOS },
    { titulo: "Usuarios", href: "/dashboard/usuarios", roles: ["SUPER_ADMIN"] },
    {
        titulo: "Productos",
        href: "/dashboard/productos",
        roles: ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"],
    },
    {
        titulo: "Inventario",
        href: "/dashboard/inventario",
        roles: ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL", "ALMACEN"],
    },
];

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrador",
    COMERCIAL: "Comercial",
    COMPRAS: "Compras",
    ALMACEN: "Almacén",
    CONDUCTOR: "Conductor",
};