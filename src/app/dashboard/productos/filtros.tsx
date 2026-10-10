
"use client";

import { useEffect, useState } from "react";
import {
    FilterX,
    Search,
} from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
    categorias: {
        id: number;
        nombre: string;
    }[];
};

const claseSelect =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export function FiltrosProductos({
    categorias,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [busqueda, setBusqueda] = useState(
        searchParams.get("q") ?? ""
    );
    const [categoria, setCategoria] = useState(
        searchParams.get("cat") ?? ""
    );
    const [moneda, setMoneda] = useState(
        searchParams.get("mon") ?? ""
    );
    const [estado, setEstado] = useState(
        searchParams.get("est") ?? "activos"
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();

            if (busqueda.trim()) {
                params.set("q", busqueda.trim());
            }

            if (categoria) {
                params.set("cat", categoria);
            }

            if (moneda) {
                params.set("mon", moneda);
            }

            if (estado !== "activos") {
                params.set("est", estado);
            }

            const nuevaQuery = params.toString();
            const actual = searchParams.toString();

            const actualSinPagina = new URLSearchParams(actual);
            actualSinPagina.delete("page");
            if (nuevaQuery !== actualSinPagina.toString()) {
                router.replace(
                    nuevaQuery
                        ? `${pathname}?${nuevaQuery}`
                        : pathname,
                    { scroll: false }
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [
        busqueda,
        categoria,
        moneda,
        estado,
        pathname,
        router,
        searchParams,
    ]);

    const hayFiltros = Boolean(
        busqueda ||
        categoria ||
        moneda ||
        estado !== "activos"
    );

    function limpiarFiltros() {
        setBusqueda("");
        setCategoria("");
        setMoneda("");
        setEstado("activos");
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_160px_160px]">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />

                    <input
                        type="search"
                        aria-label="Buscar productos"
                        placeholder="Buscar por código o nombre..."
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(e.target.value)
                        }
                        className={`${claseSelect} pl-9`}
                    />
                </div>

                {/* Categoría */}
                <select
                    aria-label="Filtrar por categoría"
                    value={categoria}
                    onChange={(e) =>
                        setCategoria(e.target.value)
                    }
                    className={claseSelect}
                >
                    <option value="">
                        Todas las categorías
                    </option>

                    {categorias.map((cat) => (
                        <option
                            key={cat.id}
                            value={String(cat.id)}
                        >
                            {cat.nombre}
                        </option>
                    ))}
                </select>

                {/* Moneda */}
                <select
                    aria-label="Filtrar por moneda"
                    value={moneda}
                    onChange={(e) =>
                        setMoneda(e.target.value)
                    }
                    className={claseSelect}
                >
                    <option value="">
                        Todas las monedas
                    </option>
                    <option value="PEN">
                        Soles (S/)
                    </option>
                    <option value="USD">
                        Dólares (USD)
                    </option>
                </select>

                {/* Estado */}
                <select
                    aria-label="Filtrar por estado"
                    value={estado}
                    onChange={(e) =>
                        setEstado(e.target.value)
                    }
                    className={claseSelect}
                >
                    <option value="activos">
                        Solo activos
                    </option>
                    <option value="inactivos">
                        Solo inactivos
                    </option>
                    <option value="todos">
                        Todos los estados
                    </option>
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
