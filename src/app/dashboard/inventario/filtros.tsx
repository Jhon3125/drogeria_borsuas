
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FiltrosInventario({
    q,
    estado,
    categoriaId,
    categorias,
}: {
    q: string;
    estado: string;
    categoriaId?: number;
    categorias: { id: number; nombre: string }[];
}) {
    return (
        <form
            action="/dashboard/inventario"
            method="GET"
            className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_190px_auto]"
        >
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar código o nombre..."
                    aria-label="Buscar productos"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            <select
                name="estado"
                defaultValue={estado}
                aria-label="Filtrar por estado de stock"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="bajo">Stock bajo</option>
                <option value="agotado">Agotado</option>
            </select>

            <select
                name="categoriaId"
                defaultValue={categoriaId ? String(categoriaId) : ""}
                aria-label="Filtrar por categoría"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
            </select>

            <Button type="submit" className="h-10">
                <Search className="mr-2 h-4 w-4" />
                Buscar
            </Button>
        </form>
    );
}
