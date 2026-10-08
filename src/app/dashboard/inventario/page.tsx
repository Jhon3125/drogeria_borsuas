
import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    History,
    Package,
    PackageX,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    ROLES_AJUSTE_INVENTARIO,
    ROLES_CONSULTA_INVENTARIO,
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

import { AjusteDialog } from "./ajuste-dialog";
import { FiltrosInventario } from "./filtros";

type EstadoStock = "disponible" | "bajo" | "agotado";

function obtenerEstado(stock: number, minimo: number): EstadoStock {
    if (stock === 0) return "agotado";
    if (minimo > 0 && stock <= minimo) return "bajo";
    return "disponible";
}

export default async function InventarioPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        estado?: string;
    }>;
}) {
    const usuario = await exigirRol(ROLES_CONSULTA_INVENTARIO);

    const puedeAjustar = ROLES_AJUSTE_INVENTARIO.includes(
        usuario.rol
    );

    const filtros = await searchParams;
    const q = (filtros.q ?? "").trim();
    const estado = ["todos", "disponible", "bajo", "agotado"].includes(
        filtros.estado ?? ""
    )
        ? (filtros.estado ?? "todos")
        : "todos";

    // Se consultan todos los productos para calcular correctamente
    // las métricas y filtros en este primer incremento.
    const productos = await prisma.producto.findMany({
        select: {
            id: true,
            codigo: true,
            nombre: true,
            estado: true,
            stockActual: true,
            stockMinimo: true,
            categoria: {
                select: { nombre: true },
            },
        },
        orderBy: { nombre: "asc" },
    });

    const activos = productos.filter((p) => p.estado);

    const productosConStock = activos.filter(
        (p) => p.stockActual > 0
    ).length;

    const stockBajo = activos.filter(
        (p) => obtenerEstado(p.stockActual, p.stockMinimo) === "bajo"
    ).length;

    const agotados = activos.filter(
        (p) => obtenerEstado(p.stockActual, p.stockMinimo) === "agotado"
    ).length;

    const unidadesTotales = activos.reduce(
        (total, p) => total + p.stockActual,
        0
    );

    const filtrados = productos.filter((p) => {
        const coincideBusqueda =
            p.nombre.toLowerCase().includes(q.toLowerCase()) ||
            p.codigo.toLowerCase().includes(q.toLowerCase());

        const coincideEstado =
            estado === "todos" ||
            obtenerEstado(p.stockActual, p.stockMinimo) === estado;

        return coincideBusqueda && coincideEstado;
    });

    const opcionesAjuste = activos.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stockActual: p.stockActual,
    }));

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-6">
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Operaciones</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-primary">
                        Inventario
                    </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Inventario y Stock
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Consulta existencias y registra movimientos
                            manuales del almacén.
                        </p>
                    </div>

                    {puedeAjustar && (
                        <AjusteDialog productos={opcionesAjuste} />
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    titulo="Unidades disponibles"
                    valor={unidadesTotales}
                    descripcion="Total de unidades de productos activos"
                    icono={Boxes}
                    color="blue"
                />
                <MetricCard
                    titulo="Productos con stock"
                    valor={productosConStock}
                    descripcion="Productos activos con existencias"
                    icono={Package}
                    color="green"
                />
                <MetricCard
                    titulo="Stock bajo"
                    valor={stockBajo}
                    descripcion="Productos por debajo de su umbral"
                    icono={AlertTriangle}
                    color="amber"
                />
                <MetricCard
                    titulo="Agotados"
                    valor={agotados}
                    descripcion="Productos activos sin existencias"
                    icono={PackageX}
                    color="red"
                />
            </section>

            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="space-y-5 border-b px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Boxes className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">
                                    Existencias por producto
                                </h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Stock actual y mínimo configurado.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/inventario/movimientos"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <History className="h-4 w-4" />
                            Historial de movimientos
                        </Link>
                    </div>

                    <FiltrosInventario q={q} estado={estado} />

                    <p className="text-xs text-muted-foreground">
                        {filtrados.length} producto(s) encontrados
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="pl-6">Producto</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-center">
                                    Stock actual
                                </TableHead>
                                <TableHead className="text-center">
                                    Mínimo
                                </TableHead>
                                <TableHead>Estado</TableHead>
                                {puedeAjustar && (
                                    <TableHead className="pr-6 text-right">
                                        Acciones
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtrados.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={puedeAjustar ? 6 : 5}
                                        className="h-40 text-center text-sm text-muted-foreground"
                                    >
                                        No se encontraron productos con esos criterios.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtrados.map((p) => {
                                    const estadoStock = obtenerEstado(
                                        p.stockActual,
                                        p.stockMinimo
                                    );

                                    const estilo =
                                        estadoStock === "agotado"
                                            ? "bg-red-50 text-red-700"
                                            : estadoStock === "bajo"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-emerald-50 text-emerald-700";

                                    return (
                                        <TableRow
                                            key={p.id}
                                            className="hover:bg-secondary/20"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <p className="font-semibold">
                                                    {p.nombre}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {p.codigo}
                                                    {!p.estado && " · Inactivo"}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {p.categoria.nombre}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-primary">
                                                {p.stockActual}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.stockMinimo}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}>
                                                    {estadoStock === "agotado"
                                                        ? "Agotado"
                                                        : estadoStock === "bajo"
                                                            ? "Stock bajo"
                                                            : "Disponible"}
                                                </span>
                                            </TableCell>
                                            {puedeAjustar && (
                                                <TableCell className="pr-6 text-right">
                                                    {p.estado ? (
                                                        <AjusteDialog
                                                            productos={opcionesAjuste}
                                                            productoId={p.id}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            No disponible
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="border-t bg-secondary/20 px-6 py-3 text-xs text-muted-foreground">
                    Mostrando {filtrados.length} de {productos.length} productos.
                </div>
            </section>
        </div>
    );
}
