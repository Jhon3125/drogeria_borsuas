
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";

import {
    BellRing,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    Boxes,
    Building2,
    CalendarClock,
    CarFront,
    ChartNoAxesCombined,
    CreditCard,
    FileText,
    History,
    LayoutDashboard,
    LockKeyhole,
    Package,
    PackageSearch,
    Pill,
    Receipt,
    Route,
    Settings,
    ShoppingCart,
    Sparkles,
    Tags,
    Truck,
    Users,
    UsersRound,
    Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
    IconoNav,
    ItemNav,
    IconoFuturo,
    ItemNavFuturo,
    GrupoFuturo,
} from "@/lib/navegacion";

type Props = {
    items: ItemNav[];
    futuros: ItemNavFuturo[];
};

type IconoComponente = ComponentType<{
    className?: string;
}>;

const ICONOS: Record<IconoNav, IconoComponente> = {
    dashboard: LayoutDashboard,
    users: Users,
    package: Package,
    tags: Tags,
    boxes: Boxes,
    building: Building2,
    "shopping-cart": ShoppingCart,
    "package-search": PackageSearch,
};

const ICONOS_FUTUROS: Record<
    IconoFuturo,
    IconoComponente
> = {
    truck: Truck,
    "shopping-cart": ShoppingCart,
    building: Building2,
    "users-round": UsersRound,
    "file-text": FileText,
    wallet: Wallet,
    receipt: Receipt,
    "credit-card": CreditCard,
    route: Route,
    car: CarFront,
    "calendar-clock": CalendarClock,
    "bell-ring": BellRing,
    chart: ChartNoAxesCombined,
    sparkles: Sparkles,
    settings: Settings,
    history: History,
    "package-search": PackageSearch,
};

const GRUPOS_FUTUROS: {
    clave: GrupoFuturo;
    titulo: string;
}[] = [
        {
            clave: "compras",
            titulo: "Compras y abastecimiento",
        },
        {
            clave: "comercial",
            titulo: "Comercial y ventas",
        },
        {
            clave: "finanzas",
            titulo: "Finanzas",
        },
        {
            clave: "logistica",
            titulo: "Logística",
        },
        {
            clave: "analitica",
            titulo: "Análisis y seguimiento",
        },
        {
            clave: "administracion",
            titulo: "Administración",
        },
    ];

function TituloGrupo({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-blue-200/70">
            {children}
        </p>
    );
}

export function Sidebar({
    items,
    futuros,
}: Props) {
    const pathname = usePathname();

    const [mostrarFuturos, setMostrarFuturos] = useState(false);

    const principales = items.filter(
        (item) => item.grupo === "principal"
    );

    const administracion = items.filter(
        (item) => item.grupo === "administracion"
    );

    function renderItem(item: ItemNav) {
        const Icono = ICONOS[item.icono];

        const activo =
            item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

        return (
            <Link
                key={item.href}
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    activo
                        ? "bg-white/15 text-white ring-1 ring-white/15"
                        : "text-sidebar-foreground/75 hover:bg-white/10 hover:text-white"
                )}
            >
                {activo && (
                    <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-emerald-400" />
                )}

                <Icono
                    className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        activo
                            ? "text-emerald-300"
                            : "text-sidebar-foreground/70 group-hover:text-white"
                    )}
                />

                <span>{item.titulo}</span>
            </Link>
        );
    }

    function renderFuturo(item: ItemNavFuturo) {
        const Icono = ICONOS_FUTUROS[item.icono];

        return (
            <div
                key={`${item.grupo}-${item.titulo}`}
                aria-disabled="true"
                title="Módulo en desarrollo"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-200/45"
            >
                <Icono className="h-[18px] w-[18px] shrink-0" />

                <span className="min-w-0 flex-1">
                    {item.titulo}
                </span>

                <LockKeyhole
                    aria-label="No disponible"
                    className="h-3.5 w-3.5 shrink-0"
                />
            </div>
        );
    }

    return (
        <aside className="flex h-full min-h-0 w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            {/* Marca fija */}
            <div className="shrink-0 border-b border-white/15 px-5 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#238B55] shadow-md">
                        <Pill className="h-6 w-6 text-white" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-base font-extrabold tracking-wide text-white">
                            BORSUAS
                        </p>

                        <p className="mt-0.5 truncate text-xs text-blue-100/75">
                            ERP Farmacéutico
                        </p>
                    </div>
                </div>
            </div>

            {/* Navegación con scroll propio */}
            <nav
                aria-label="Navegación principal"
                className="borsuas-sidebar-scroll min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-3 py-6"
            >
                {principales.length > 0 && (
                    <section>
                        <TituloGrupo>
                            Módulos principales
                        </TituloGrupo>

                        <div className="space-y-1">
                            {principales.map(renderItem)}
                        </div>
                    </section>
                )}

                {administracion.length > 0 && (
                    <section>
                        <TituloGrupo>
                            Administración
                        </TituloGrupo>

                        <div className="space-y-1">
                            {administracion.map(renderItem)}
                        </div>
                    </section>
                )}

                {/* Módulos futuros */}

                {/* Control de módulos futuros */}
                {futuros.length > 0 && (
                    <section className="space-y-4">
                        <button
                            type="button"
                            onClick={() =>
                                setMostrarFuturos((anterior) => !anterior)
                            }
                            aria-expanded={mostrarFuturos}
                            aria-controls="sidebar-modulos-futuros"
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-left text-xs font-medium text-white transition-colors hover:bg-white/15"
                        >
                            <span className="flex items-center gap-2">
                                {mostrarFuturos ? (
                                    <EyeOff className="h-4 w-4 text-blue-200" />
                                ) : (
                                    <Eye className="h-4 w-4 text-blue-200" />
                                )}

                                {mostrarFuturos
                                    ? "Ocultar módulos futuros (No definitivo)"
                                    : "Mostrar módulos futuros (No definitivo)"}
                            </span>

                            {mostrarFuturos ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-blue-200" />
                            ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-blue-200" />
                            )}
                        </button>

                        <div
                            id="sidebar-modulos-futuros"
                            hidden={!mostrarFuturos}
                        >
                            {mostrarFuturos && (
                                <div className="space-y-7 pt-2">
                                    {GRUPOS_FUTUROS.map((grupo) => {
                                        const delGrupo = futuros.filter(
                                            (item) =>
                                                item.grupo === grupo.clave
                                        );

                                        if (delGrupo.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <section key={grupo.clave}>
                                                <TituloGrupo>
                                                    {grupo.titulo}
                                                </TituloGrupo>

                                                <div className="space-y-1">
                                                    {delGrupo.map(renderFuturo)}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            </nav>

            {/* Pie fijo */}
            <div className="shrink-0 border-t border-white/15 p-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20">
                        <Pill className="h-4 w-4 text-emerald-300" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">
                            Borsuas ERP
                        </p>

                        <p className="text-[11px] text-blue-100/70">
                            Gestión empresarial
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
