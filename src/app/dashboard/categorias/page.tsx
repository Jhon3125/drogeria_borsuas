
import Link from "next/link";
import {
    ArrowRight,
    FolderOpen,
    PackageCheck,
    SearchX,
    Tags,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    ROLES_CONSULTA_CATALOGO,
    ROLES_GESTION_CATALOGO,
} from "@/lib/permisos";

import { MetricCard } from "@/components/dashboard/metric-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { CategoriaDialog } from "./categoria-dialog";
import { EliminarCategoria } from "./eliminar-categoria";
import { FiltrosCategorias } from "./filtros";

type Filtros = {
    q?: string;
    uso?: string;
    orden?: string;
    page?: string;
};

export default async function CategoriasPage({
    searchParams,
}: {
    searchParams: Promise<Filtros>;
}) {
    const usuario = await exigirRol(ROLES_CONSULTA_CATALOGO);
    const puedeGestionar = ROLES_GESTION_CATALOGO.includes(usuario.rol);

    const filtros = await searchParams;

    const busqueda = (filtros.q ?? "").trim();

    const uso = ["con_productos", "sin_productos"].includes(
        filtros.uso ?? ""
    )
        ? (filtros.uso ?? "todas")
        : "todas";

    const orden = [
        "nombre_asc",
        "nombre_desc",
        "productos_asc",
        "productos_desc",
    ].includes(filtros.orden ?? "")
        ? (filtros.orden ?? "nombre_asc")
        : "nombre_asc";

    const whereCondition = {
        ...(busqueda
            ? {
                nombre: {
                    contains: busqueda,
                    mode: "insensitive" as const,
                },
            }
            : {}),

        ...(uso === "con_productos"
            ? { productos: { some: {} } }
            : uso === "sin_productos"
                ? { productos: { none: {} } }
                : {}),
    };

    const [
        categorias,
        totalCategorias,
        categoriasEnUso,
        categoriasVacias,
    ] = await Promise.all([
        prisma.categoria.findMany({
            where: whereCondition,
            orderBy: { nombre: "asc" },
            include: {
                _count: {
                    select: {
                        productos: true,
                    },
                },
            },
        }),

        prisma.categoria.count(),

        prisma.categoria.count({
            where: {
                productos: { some: {} },
            },
        }),

        prisma.categoria.count({
            where: {
                productos: { none: {} },
            },
        }),
    ]);

    // Ordenar los resultados completos, sin paginación.
    const categoriasOrdenadas = [...categorias].sort((a, b) => {
        switch (orden) {
            case "nombre_desc":
                return b.nombre.localeCompare(a.nombre, "es");

            case "productos_desc":
                return (
                    b._count.productos - a._count.productos ||
                    a.nombre.localeCompare(b.nombre, "es")
                );

            case "productos_asc":
                return (
                    a._count.productos - b._count.productos ||
                    a.nombre.localeCompare(b.nombre, "es")
                );

            default:
                return a.nombre.localeCompare(b.nombre, "es");
        }
    });

    const numeroPagina = /^\d+$/.test(filtros.page ?? "") ? Number(filtros.page) : 1;
    const paginaPedida = Number.isSafeInteger(numeroPagina) && numeroPagina > 0 ? numeroPagina : 1;
    const TAMANIO = 25;
    const totalFiltradas = categoriasOrdenadas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalFiltradas / TAMANIO));
    const pagina = Math.min(paginaPedida, totalPaginas);
    const categoriasPagina = categoriasOrdenadas.slice((pagina - 1) * TAMANIO, pagina * TAMANIO);
    const urlPagina = (n: number) => {
        const params = new URLSearchParams();
        if (busqueda) params.set("q", busqueda);
        if (uso !== "todas") params.set("uso", uso);
        if (orden !== "nombre_asc") params.set("orden", orden);
        if (n > 1) params.set("page", String(n));
        const query = params.toString();
        return `/dashboard/categorias${query ? `?${query}` : ""}`;
    };

    const hayFiltros =
        Boolean(busqueda) ||
        uso !== "todas" ||
        orden !== "nombre_asc";

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-6">
            {/* Encabezado */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Catálogo</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-primary">
                        Categorías
                    </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Gestión de Categorías
                        </h1>

                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Organiza y clasifica los productos del
                            catálogo de Droguería Borsuas.
                        </p>
                    </div>

                    {puedeGestionar && (
                        <div className="shrink-0">
                            <CategoriaDialog />
                        </div>
                    )}
                </div>
            </section>

            {/* Indicadores */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                    titulo="Total de categorías"
                    valor={totalCategorias}
                    descripcion="Categorías registradas"
                    icono={Tags}
                    color="blue"
                />

                <MetricCard
                    titulo="Categorías en uso"
                    valor={categoriasEnUso}
                    descripcion="Con productos asociados"
                    icono={PackageCheck}
                    color="green"
                />

                <MetricCard
                    titulo="Categorías vacías"
                    valor={categoriasVacias}
                    descripcion="Sin productos asociados"
                    icono={FolderOpen}
                    color="amber"
                />
            </section>

            {/* Directorio */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="border-b border-border px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Tags className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold">
                                Directorio de categorías
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Consulta, busca y administra las categorías.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <FiltrosCategorias />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {totalFiltradas} categoría(s)
                            coinciden con los criterios actuales
                        </p>

                        {hayFiltros && (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                Filtros aplicados
                            </span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="min-w-52 pl-6">
                                    Categoría
                                </TableHead>
                                <TableHead className="min-w-56">
                                    Descripción
                                </TableHead>
                                <TableHead className="text-center">
                                    Productos
                                </TableHead>
                                {puedeGestionar && (
                                    <TableHead className="pr-6 text-right">
                                        Acciones
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {categoriasOrdenadas.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={puedeGestionar ? 4 : 3}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                                                <SearchX className="h-6 w-6 text-primary" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold">
                                                    No se encontraron categorías
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {hayFiltros
                                                        ? "Prueba con otros criterios de búsqueda."
                                                        : "Todavía no hay categorías registradas."}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categoriasPagina.map((categoria) => {
                                    const cantidad =
                                        categoria._count.productos;

                                    return (
                                        <TableRow
                                            key={categoria.id}
                                            className="hover:bg-secondary/20"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                                                        <Tags className="h-5 w-5" />
                                                    </div>

                                                    <p className="font-semibold text-foreground">
                                                        {categoria.nombre}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            <TableCell className="max-w-80">
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {categoria.descripcion ||
                                                        "Sin descripción"}
                                                </p>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span
                                                    className={
                                                        cantidad > 0
                                                            ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                                            : "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                                                    }
                                                >
                                                    {cantidad} producto(s)
                                                </span>
                                            </TableCell>

                                            {puedeGestionar && (
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <CategoriaDialog
                                                            categoria={{
                                                                id: categoria.id,
                                                                nombre: categoria.nombre,
                                                                descripcion:
                                                                    categoria.descripcion ??
                                                                    "",
                                                            }}
                                                        />

                                                        <EliminarCategoria
                                                            id={categoria.id}
                                                            nombre={categoria.nombre}
                                                            cantidadProductos={
                                                                cantidad
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/20 px-6 py-3">
                    <p className="text-xs text-muted-foreground">
                        Mostrando {categoriasPagina.length} de {totalFiltradas} categoría(s) coincidentes ({totalCategorias} registradas). Página {pagina} de {totalPaginas}.
                    </p>
                    <nav aria-label="Páginas de categorías" className="flex gap-2 text-sm">
                        {pagina > 1 && <Link className="rounded-lg border bg-white px-3 py-1.5" href={urlPagina(pagina - 1)}>Anterior</Link>}
                        {pagina < totalPaginas && <Link className="rounded-lg border bg-white px-3 py-1.5" href={urlPagina(pagina + 1)}>Siguiente</Link>}
                    </nav>
                </div>
            </section>
        </div>
    );
}
