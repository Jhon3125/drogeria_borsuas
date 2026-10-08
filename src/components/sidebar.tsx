
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Boxes,
    LayoutDashboard,
    Package,
    Tags,
    Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import type { IconoNav, ItemNav } from "@/lib/navegacion";

type Props = {
    items: ItemNav[];
};

const ICONOS: Record<
    IconoNav,
    ComponentType<{ className?: string }>
> = {
    dashboard: LayoutDashboard,
    users: Users,
    package: Package,
    tags: Tags,
    boxes: Boxes,
};

export function Sidebar({ items }: Props) {
    const pathname = usePathname();

    const principales = items.filter(
        (item) => item.grupo === "principal"
    );

    const administracion = items.filter(
        (item) => item.grupo === "administracion"
    );

    const renderItem = (item: ItemNav) => {
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
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activo
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <Icono
                    className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        activo
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                    )}
                />
                <span>{item.titulo}</span>
            </Link>
        );
    };

    return (
        <aside className="flex h-full min-h-0 w-64 flex-col overflow-hidden border-r bg-background">
            {/* Marca: permanece arriba */}
            <div className="shrink-0 border-b px-5 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        B
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-wide">
                            BORSUAS
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            ERP Farmacéutico
                        </p>
                    </div>
                </div>
            </div>

            {/* Navegación con scroll independiente */}
            <nav
                aria-label="Navegación principal"
                className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5"
            >
                {principales.length > 0 && (
                    <div>
                        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Módulos principales
                        </p>

                        <div className="space-y-1">
                            {principales.map(renderItem)}
                        </div>
                    </div>
                )}

                {administracion.length > 0 && (
                    <div>
                        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Administración
                        </p>

                        <div className="space-y-1">
                            {administracion.map(renderItem)}
                        </div>
                    </div>
                )}
            </nav>

            {/* Pie fijo en el sidebar */}
            <div className="shrink-0 border-t p-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                    <div className="min-w-0">
                        <p className="text-xs font-medium">
                            Sistema operativo
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            Todos los servicios activos
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
