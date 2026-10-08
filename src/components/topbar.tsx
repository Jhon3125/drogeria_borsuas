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

import { Button } from "@/components/ui/button";
import { ETIQUETA_ROL } from "@/lib/navegacion";

type Props = {
    nombre: string;
    rol: keyof typeof ETIQUETA_ROL;
};

export function Topbar({ nombre, rol }: Props) {
    const [menuAbierto, setMenuAbierto] = useState(false);

    const iniciales = nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase();

    async function cerrarSesion() {
        await signOut({
            callbackUrl: "/login",
        });
    }

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            {/* Búsqueda */}
            <div className="flex items-center">
                <div className="relative hidden w-80 md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                        type="text"
                        placeholder="Buscar en Borsuas..."
                        className="h-9 w-full rounded-lg border bg-muted/30 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10"
                    />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    type="button"
                >
                    <CircleHelp className="h-4 w-4" />
                    <span className="sr-only">Ayuda</span>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    type="button"
                >
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notificaciones</span>
                </Button>

                <div className="ml-2 h-7 w-px bg-border" />

                {/* Usuario */}
                <div className="relative ml-1">
                    <button
                        type="button"
                        onClick={() => setMenuAbierto((abierto) => !abierto)}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                        aria-expanded={menuAbierto}
                        aria-haspopup="menu"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {iniciales}
                        </div>

                        <div className="hidden text-left sm:block">
                            <p className="max-w-32 truncate text-sm font-medium">
                                {nombre}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {ETIQUETA_ROL[rol]}
                            </p>
                        </div>

                        <ChevronDown
                            className={`hidden h-4 w-4 text-muted-foreground transition-transform sm:block ${menuAbierto ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* Dropdown */}
                    {menuAbierto && (
                        <>
                            {/* Overlay invisible para cerrar el menú */}
                            <button
                                type="button"
                                aria-label="Cerrar menú"
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setMenuAbierto(false)}
                            />

                            <div
                                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-background shadow-lg"
                                role="menu"
                            >
                                {/* Información del usuario */}
                                <div className="border-b px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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

                                {/* Opciones */}
                                <div className="p-1.5">
                                    <button
                                        type="button"
                                        onClick={cerrarSesion}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        role="menuitem"
                                    >
                                        <LogOut className="h-4 w-4" />

                                        <span>Cerrar sesión</span>
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