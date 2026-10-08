"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

type Props = {
    categorias: { id: number; nombre: string }[];
};

export function FiltrosProductos({ categorias }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Estados locales para los filtros
    const [busqueda, setBusqueda] = useState(searchParams.get("q") || "");
    const [categoria, setCategoria] = useState(searchParams.get("cat") || "");
    const [moneda, setMoneda] = useState(searchParams.get("mon") || "");
    const [estado, setEstado] = useState(searchParams.get("est") || "activos");

    // Búsqueda incremental con Debounce (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();

            if (busqueda) params.set("q", busqueda);
            if (categoria) params.set("cat", categoria);
            if (moneda) params.set("mon", moneda);
            if (estado && estado !== "activos") params.set("est", estado);

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }, 100);

        return () => clearTimeout(timer);
    }, [busqueda, categoria, moneda, estado, pathname, router]);

    const claseSelect = "border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex-1 max-w-sm">
                <Input
                    placeholder="Búsqueda incremental por código o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Filtro por Categoría */}
                <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={claseSelect}
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>

                {/* Filtro por Moneda */}
                <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className={claseSelect}
                >
                    <option value="">Todas las monedas</option>
                    <option value="PEN">Soles (S/)</option>
                    <option value="USD">Dólares ($)</option>
                </select>

                {/* Filtro por Estado */}
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className={claseSelect}
                >
                    <option value="activos">Solo activos</option>
                    <option value="inactivos">Solo inactivos</option>
                    <option value="todos">Todos</option>
                </select>
            </div>
        </div>
    );
}