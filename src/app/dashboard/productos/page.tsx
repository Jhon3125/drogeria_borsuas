
import {
    ArrowRight,
    Boxes,
    CheckCircle2,
    Package,
    PackageX,
    SearchX,
    Tags,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { formatoMoneda } from "@/lib/formato";

import { MetricCard } from "@/components/dashboard/metric-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { ProductoDialog } from "./producto-dialog";
import { FiltrosProductos } from "./filtros";
import { BotonCambiarEstado } from "./cambiar-estado";

type Filtros = {
    q?: string;
    cat?: string;
    mon?: string;
    est?: string;
    page?: string;
};

export default async function ProductosPage({
    searchParams,
}: {
    searchParams: Promise<Filtros>;
}) {
    const usuario = await exigirRol([
        "SUPER_ADMIN",
        "ADMIN",
        "COMPRAS",
        "COMERCIAL",
    ]);

    const puedeGestionar = [
        "SUPER_ADMIN",
        "ADMIN",
        "COMPRAS",
    ].includes(usuario.rol);

    const puedeVerCostos = puedeGestionar;

    const filtros = await searchParams;

    const query = (filtros.q ?? "").trim();
    const categoriaId = filtros.cat
        ? Number(filtros.cat)
        : undefined;
    const monedaFiltro = filtros.mon ?? "";
    const filtroEstado = filtros.est ?? "activos";

    const whereCondition: any = {};

    if (query) {
        whereCondition.OR = [
            {
                nombre: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            {
                codigo: {
                    contains: query,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (categoriaId && Number.isInteger(categoriaId)) {
        whereCondition.categoriaId = categoriaId;
    }

    if (monedaFiltro === "PEN" || monedaFiltro === "USD") {
        whereCondition.moneda = monedaFiltro;
    }

    if (filtroEstado === "activos") {
        whereCondition.estado = true;
    } else if (filtroEstado === "inactivos") {
        whereCondition.estado = false;
    }

    const [
        categorias,
        productos,
        totalFiltrados,
        totalProductos,
        productosActivos,
        productosInactivos,
        categoriasUtilizadas,
    ] = await Promise.all([
        prisma.categoria.findMany({
            orderBy: { nombre: "asc" },
            select: { id: true, nombre: true },
        }),

        prisma.producto.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            take: 15,
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                categoriaId: true,
                categoria: {
                    select: { nombre: true },
                },
                unidadMedida: true,
                moneda: true,
                precioVenta: true,
                estado: true,
                stockMinimo: true,
                ...(puedeVerCostos
                    ? { precioCompra: true }
                    : {}),
            },
        }),

        prisma.producto.count({
            where: whereCondition,
        }),

        prisma.producto.count(),

        prisma.producto.count({
            where: { estado: true },
        }),

        prisma.producto.count({
            where: { estado: false },
        }),

        prisma.categoria.count({
            where: {
                productos: { some: {} },
            },
        }),
    ]);

    const hayFiltros =
        Boolean(query || filtros.cat || monedaFiltro) ||
        filtroEstado !== "activos";

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-6">
            {/* Encabezado */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Catálogo</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-primary">
                        Productos
                    </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Catálogo de Productos
                        </h1>

                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Administra la información, clasificación
                            y precios de los productos comercializados.
                        </p>
                    </div>

                    {puedeGestionar && (
                        <div className="shrink-0">
                            <ProductoDialog
                                categorias={categorias}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Indicadores generales */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    titulo="Productos registrados"
                    valor={totalProductos}
                    descripcion="Total de productos en el catálogo"
                    icono={Package}
                    color="blue"
                />

                <MetricCard
                    titulo="Productos activos"
                    valor={productosActivos}
                    descripcion="Habilitados para operaciones"
                    icono={CheckCircle2}
                    color="green"
                />

                <MetricCard
                    titulo="Productos inactivos"
                    valor={productosInactivos}
                    descripcion="Productos deshabilitados"
                    icono={PackageX}
                    color="amber"
                />

                <MetricCard
                    titulo="Categorías utilizadas"
                    valor={categoriasUtilizadas}
                    descripcion="Categorías con productos asociados"
                    icono={Tags}
                    color="violet"
                />
            </section>

            {/* Directorio */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="border-b border-border px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Boxes className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold">
                                Directorio de productos
                            </h2>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Consulta y filtra los productos registrados.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <FiltrosProductos
                            categorias={categorias}
                        />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {totalFiltrados} producto(s) coinciden con
                            los criterios actuales
                        </p>

                        {hayFiltros && (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                Filtros aplicados
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="pl-6">
                                    Código
                                </TableHead>
                                <TableHead className="min-w-55">
                                    Producto
                                </TableHead>
                                <TableHead className="min-w-40">
                                    Categoría / Unidad
                                </TableHead>
                                {puedeVerCostos && (
                                    <TableHead className="text-right">
                                        Costo
                                    </TableHead>
                                )}
                                <TableHead className="text-right">
                                    Precio venta
                                </TableHead>
                                <TableHead className="text-center">
                                    Estado
                                </TableHead>
                                {puedeGestionar && (
                                    <TableHead className="pr-6 text-right">
                                        Acciones
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {productos.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            5 +
                                            Number(puedeVerCostos) +
                                            Number(puedeGestionar)
                                        }
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                                                <SearchX className="h-6 w-6 text-primary" />
                                            </div>

                                            <p className="text-sm font-semibold">
                                                No se encontraron productos
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Prueba con otros criterios
                                                o registra un producto nuevo.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                productos.map((producto) => {
                                    const compra =
                                        "precioCompra" in producto
                                            ? Number(producto.precioCompra)
                                            : null;

                                    const venta = Number(
                                        producto.precioVenta
                                    );

                                    const bajoCosto =
                                        puedeVerCostos &&
                                        compra !== null &&
                                        Number.isFinite(compra) &&
                                        Number.isFinite(venta) &&
                                        venta < compra;

                                    // Convertimos Decimal a valores serializables.
                                    const productoPlano = {
                                        id: producto.id,
                                        codigo: producto.codigo,
                                        nombre: producto.nombre,
                                        descripcion:
                                            producto.descripcion,
                                        categoriaId:
                                            producto.categoriaId,
                                        unidadMedida:
                                            producto.unidadMedida,
                                        moneda: producto.moneda,
                                        stockMinimo:
                                            producto.stockMinimo,
                                        precioCompra:
                                            "precioCompra" in producto
                                                ? String(
                                                    producto.precioCompra
                                                )
                                                : "0",
                                        precioVenta:
                                            producto.precioVenta.toString(),
                                    };

                                    return (
                                        <TableRow
                                            key={producto.id}
                                            className="hover:bg-secondary/20"
                                        >
                                            <TableCell className="pl-6 font-medium text-primary">
                                                {producto.codigo}
                                            </TableCell>

                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                                                        <Package className="h-5 w-5" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground">
                                                            {producto.nombre}
                                                        </p>

                                                        {producto.descripcion && (
                                                            <p className="mt-0.5 max-w-55 truncate text-xs text-muted-foreground">
                                                                {producto.descripcion}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <p className="text-sm font-medium">
                                                    {producto.categoria.nombre}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {producto.unidadMedida}
                                                </p>
                                            </TableCell>

                                            {puedeVerCostos && (
                                                <TableCell className="whitespace-nowrap text-right text-sm">
                                                    {compra !== null
                                                        ? formatoMoneda(
                                                            compra,
                                                            producto.moneda
                                                        )
                                                        : "—"}
                                                </TableCell>
                                            )}

                                            <TableCell className="whitespace-nowrap text-right">
                                                <span className="inline-flex items-center gap-2 font-semibold">
                                                    {bajoCosto && (
                                                        <span
                                                            title="Precio de venta inferior al costo"
                                                            className="h-2 w-2 rounded-full bg-amber-500"
                                                        />
                                                    )}

                                                    {formatoMoneda(
                                                        producto.precioVenta,
                                                        producto.moneda
                                                    )}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span
                                                    className={
                                                        producto.estado
                                                            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                            : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            producto.estado
                                                                ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                                                                : "h-1.5 w-1.5 rounded-full bg-slate-400"
                                                        }
                                                    />
                                                    {producto.estado
                                                        ? "Activo"
                                                        : "Inactivo"}
                                                </span>
                                            </TableCell>

                                            {puedeGestionar && (
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ProductoDialog
                                                            producto={
                                                                productoPlano
                                                            }
                                                            categorias={
                                                                categorias
                                                            }
                                                        />

                                                        <BotonCambiarEstado
                                                            id={producto.id}
                                                            estadoActual={
                                                                producto.estado
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

                <div className="border-t border-border bg-secondary/20 px-6 py-3">
                    <p className="text-xs text-muted-foreground">
                        Mostrando {productos.length} de{" "}
                        {totalFiltrados} resultado(s).
                        {totalFiltrados > 15 &&
                            " La vista actual muestra los primeros 15 registros."}
                    </p>
                </div>
            </section>
        </div>
    );
}
