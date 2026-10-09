import type { RolUsuario } from "@/generated/prisma/enums";

export type IconoNav =
    | "dashboard"
    | "users"
    | "package"
    | "tags"
    | "boxes"
    | "building"
    | "shopping-cart"
    | "package-search";

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
        titulo: "Dashboard",
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
    { titulo: "Proveedores", href: "/dashboard/proveedores", roles: ["SUPER_ADMIN","ADMIN","COMPRAS","ALMACEN"], icono: "building", grupo: "principal" },
    { titulo: "Compras", href: "/dashboard/compras", roles: ["SUPER_ADMIN","ADMIN","COMPRAS","ALMACEN"], icono: "shopping-cart", grupo: "principal" },
    { titulo: "Lotes y vencimientos", href: "/dashboard/lotes", roles: ["SUPER_ADMIN","ADMIN","COMPRAS","ALMACEN"], icono: "package-search", grupo: "principal" },
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


export type GrupoFuturo =
    | "compras"
    | "comercial"
    | "finanzas"
    | "logistica"
    | "analitica"
    | "administracion";

export type IconoFuturo =
    | "truck"
    | "shopping-cart"
    | "building"
    | "users-round"
    | "file-text"
    | "wallet"
    | "receipt"
    | "credit-card"
    | "route"
    | "car"
    | "calendar-clock"
    | "bell-ring"
    | "chart"
    | "sparkles"
    | "settings"
    | "history"
    | "package-search";

export type ItemNavFuturo = {
    titulo: string;
    roles: RolUsuario[];
    grupo: GrupoFuturo;
    icono: IconoFuturo;
};

const GERENCIA: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
];

const ABASTECIMIENTO: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMPRAS",
    "ALMACEN",
];

const COMERCIALES: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMERCIAL",
];

const LOGISTICA: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "ALMACEN",
    "CONDUCTOR",
];

export const NAVEGACION_FUTURA: ItemNavFuturo[] = [
    // Comercial y ventas
    {
        titulo: "Clientes",
        roles: COMERCIALES,
        grupo: "comercial",
        icono: "users-round",
    },
    {
        titulo: "Cotizaciones",
        roles: COMERCIALES,
        grupo: "comercial",
        icono: "file-text",
    },
    {
        titulo: "Ventas y CRM",
        roles: COMERCIALES,
        grupo: "comercial",
        icono: "shopping-cart",
    },

    // Finanzas
    {
        titulo: "Caja y movimientos",
        roles: COMERCIALES,
        grupo: "finanzas",
        icono: "wallet",
    },
    {
        titulo: "Gastos",
        roles: GERENCIA,
        grupo: "finanzas",
        icono: "receipt",
    },
    {
        titulo: "Cuentas por cobrar",
        roles: COMERCIALES,
        grupo: "finanzas",
        icono: "credit-card",
    },

    // Logística
    {
        titulo: "Despachos",
        roles: LOGISTICA,
        grupo: "logistica",
        icono: "truck",
    },
    {
        titulo: "Hojas de ruta",
        roles: LOGISTICA,
        grupo: "logistica",
        icono: "route",
    },
    {
        titulo: "Vehículos",
        roles: GERENCIA,
        grupo: "logistica",
        icono: "car",
    },

    // Análisis y seguimiento
    {
        titulo: "Alertas",
        roles: GERENCIA,
        grupo: "analitica",
        icono: "bell-ring",
    },
    {
        titulo: "Reportes y BI",
        roles: GERENCIA,
        grupo: "analitica",
        icono: "chart",
    },
    {
        titulo: "Asistente IA",
        roles: GERENCIA,
        grupo: "analitica",
        icono: "sparkles",
    },
    {
        titulo: "Historial y trazabilidad",
        roles: GERENCIA,
        grupo: "analitica",
        icono: "history",
    },

    // Administración
    {
        titulo: "Configuración",
        roles: GERENCIA,
        grupo: "administracion",
        icono: "settings",
    },
];
