import type { RolUsuario } from "@/generated/prisma/enums";

export type IconoNav =
    | "dashboard"
    | "users"
    | "package"
    | "tags"
    | "boxes";

export type GrupoNav = "principal" | "administracion";

export type ItemNav = {
    titulo: string;
    href: string;
    roles: RolUsuario[];
    icono: IconoNav;
    grupo: GrupoNav;
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
    {
        titulo: "Inicio",
        href: "/dashboard",
        roles: TODOS,
        icono: "dashboard",
        grupo: "principal",
    },
    {
        titulo: "Productos",
        href: "/dashboard/productos",
        roles: ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"],
        icono: "package",
        grupo: "principal",
    },
    {
        titulo: "Categorías",
        href: "/dashboard/categorias",
        roles: ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"],
        icono: "tags",
        grupo: "principal",
    },
    {
        titulo: "Inventario",
        href: "/dashboard/inventario",
        roles: ["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL", "ALMACEN"],
        icono: "boxes",
        grupo: "principal",
    },
    {
        titulo: "Usuarios",
        href: "/dashboard/usuarios",
        roles: ["SUPER_ADMIN"],
        icono: "users",
        grupo: "administracion",
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