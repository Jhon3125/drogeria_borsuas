
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const claseSelect =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export function FiltrosCategorias() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [busqueda, setBusqueda] = useState(searchParams.get("q") ?? "");
    const [uso, setUso] = useState(searchParams.get("uso") ?? "todas");
    const [orden, setOrden] = useState(searchParams.get("orden") ?? "nombre_asc");

    // Sincronización al navegar mediante historial o enlaces externos.
    const queryActual = searchParams.toString();

    useEffect(() => {
        const params = new URLSearchParams(queryActual);

        setBusqueda(params.get("q") ?? "");
        setUso(params.get("uso") ?? "todas");
        setOrden(params.get("orden") ?? "nombre_asc");
    }, [queryActual]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(queryActual);

            if (busqueda.trim()) {
                params.set("q", busqueda.trim());
            } else {
                params.delete("q");
            }

            if (uso !== "todas") {
                params.set("uso", uso);
            } else {
                params.delete("uso");
            }

            if (orden !== "nombre_asc") {
                params.set("orden", orden);
            } else {
                params.delete("orden");
            }

            const siguiente = params.toString();

            if (siguiente !== queryActual) {
                router.replace(
                    siguiente ? `${pathname}?${siguiente}` : pathname,
                    { scroll: false }
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [busqueda, uso, orden, pathname, router, queryActual]);

    const hayFiltros = Boolean(
        busqueda || uso !== "todas" || orden !== "nombre_asc"
    );

    function limpiarFiltros() {
        setBusqueda("");
        setUso("todas");
        setOrden("nombre_asc");
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_200px]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                    <input
                        type="search"
                        aria-label="Buscar categorías"
                        placeholder="Buscar categoría por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={`${claseSelect} pl-9`}
                    />
                </div>

                <select
                    aria-label="Filtrar categorías por uso"
                    value={uso}
                    onChange={(e) => setUso(e.target.value)}
                    className={claseSelect}
                >
                    <option value="todas">Todas las categorías</option>
                    <option value="con_productos">Con productos</option>
                    <option value="sin_productos">Sin productos</option>
                </select>

                <select
                    aria-label="Ordenar categorías"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className={claseSelect}
                >
                    <option value="nombre_asc">Nombre: A - Z</option>
                    <option value="nombre_desc">Nombre: Z - A</option>
                    <option value="productos_desc">Más productos primero</option>
                    <option value="productos_asc">Menos productos primero</option>
                </select>
            </div>

            {hayFiltros && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={limpiarFiltros}
                        className="gap-2 text-primary"
                    >
                        <FilterX className="h-4 w-4" />
                        Limpiar filtros
                    </Button>
                </div>
            )}
        </div>
    );
}
