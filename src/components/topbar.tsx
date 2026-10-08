
"use client";

import { useState } from "react";
import {
    Bell,
    ChevronDown,
    CircleHelp,
    LogOut,
    Search,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { ETIQUETA_ROL } from "@/lib/navegacion";

type Props = {
    nombre: string;
    rol: keyof typeof ETIQUETA_ROL;
};

export function Topbar({ nombre, rol }: Props) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [cerrandoSesion, setCerrandoSesion] = useState(false);

    const iniciales =
        nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((parte) => parte[0])
            .join("")
            .toUpperCase() || "U";

    async function cerrarSesion() {
        if (cerrandoSesion) return;

        setCerrandoSesion(true);

        try {
            await signOut({
                callbackUrl: "/login",
            });
        } catch {
            setCerrandoSesion(false);
        }
    }

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-xs sm:px-6">
            {/* Búsqueda global: presentación visual */}
            <div className="flex min-w-0 items-center">
                <div className="hidden h-10 w-80 items-center gap-3 rounded-xl border border-border bg-[#F0F5FA] px-3 text-sm text-muted-foreground md:flex">
                    <Search className="h-4 w-4 shrink-0 text-primary" />
                    <span>Buscar en Borsuas...</span>
                </div>

                <span className="text-sm font-bold tracking-wide text-primary md:hidden">
                    BORSUAS
                </span>
            </div>

            {/* Controles e identidad */}
            <div className="flex items-center gap-2">
                <span
                    title="Ayuda próximamente"
                    className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground sm:flex"
                >
                    <CircleHelp className="h-[18px] w-[18px]" />
                </span>

                <span
                    title="Notificaciones próximamente"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
                >
                    <Bell className="h-[18px] w-[18px]" />
                </span>

                <div className="mx-1 h-8 w-px bg-border" />

                {/* Dropdown de usuario */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setMenuAbierto((anterior) => !anterior)
                        }
                        aria-expanded={menuAbierto}
                        aria-haspopup="menu"
                        aria-label="Abrir menú de usuario"
                        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/10">
                            {iniciales}
                        </div>

                        <div className="hidden max-w-36 text-left sm:block">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {nombre}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                                {ETIQUETA_ROL[rol]}
                            </p>
                        </div>

                        <ChevronDown
                            className={`hidden h-4 w-4 text-primary transition-transform sm:block ${menuAbierto ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {menuAbierto && (
                        <>
                            <button
                                type="button"
                                aria-label="Cerrar menú de usuario"
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setMenuAbierto(false)}
                            />

                            <div
                                role="menu"
                                aria-label="Opciones de usuario"
                                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
                            >
                                <div className="border-b border-border bg-secondary/60 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                            {iniciales}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {nombre}
                                            </p>

                                            <p className="truncate text-xs text-muted-foreground">
                                                {ETIQUETA_ROL[rol]}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={cerrandoSesion}
                                        onClick={cerrarSesion}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary disabled:cursor-wait disabled:opacity-60"
                                    >
                                        <LogOut className="h-4 w-4 text-primary" />
                                        {cerrandoSesion
                                            ? "Cerrando sesión..."
                                            : "Cerrar sesión"}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
