
import Link from "next/link";
import { Search, FilterX } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
    q: string;
    estado: string;
};

export function FiltrosCompras({ q, estado }: Props) {
    const hayFiltros = Boolean(q) || estado !== "TODOS";

    return (
        <form
            action="/dashboard/compras"
            method="GET"
            className="flex flex-col gap-3"
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />

                    <input
                        type="search"
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por número de OC o proveedor..."
                        aria-label="Buscar órdenes de compra"
                        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                </div>

                <select
                    name="estado"
                    defaultValue={estado}
                    aria-label="Filtrar por estado de recepción"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                >
                    <option value="TODOS">Todos los estados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="PARCIAL">Recepción parcial</option>
                    <option value="RECIBIDO">Recibidas</option>
                </select>

                <Button type="submit" className="h-10 gap-2">
                    <Search className="h-4 w-4" />
                    Buscar
                </Button>
            </div>

            {hayFiltros && (
                <div className="flex justify-end">
                    <Link
                        href="/dashboard/compras"
                        className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                    >
                        <FilterX className="h-4 w-4" />
                        Limpiar filtros
                    </Link>
                </div>
            )}
        </form>
    );
}
