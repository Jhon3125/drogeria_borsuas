
import Link from "next/link";
import {
    ArrowLeft,
    ArrowDownCircle,
    ArrowUpCircle,
    History,
    UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_CONSULTA_INVENTARIO } from "@/lib/permisos";
import { ETIQUETA_ROL } from "@/lib/navegacion";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function MovimientosPage() {
    await exigirRol(ROLES_CONSULTA_INVENTARIO);

    const movimientos = await prisma.movimientoInventario.findMany({
        take: 50,
        orderBy: [
            { fecha: "desc" },
            { id: "desc" },
        ],
        select: {
            id: true,
            tipo: true,
            cantidad: true,
            fecha: true,
            motivo: true,
            producto: {
                select: {
                    codigo: true,
                    nombre: true,
                },
            },
            usuario: {
                select: {
                    id: true,
                    nombre: true,
                    rol: true,
                },
            },
        },
    });

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-6">
            {/* Encabezado */}
            <section className="space-y-3">
                <Link
                    href="/dashboard/inventario"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inventario
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Historial de Movimientos
                    </h1>

                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Consulta las entradas, salidas, responsables
                        y motivos de los movimientos de inventario.
                    </p>
                </div>
            </section>

            {/* Historial */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                        <History className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold">
                            Registro de movimientos
                        </h2>

                        <p className="text-xs text-muted-foreground">
                            Últimos 50 movimientos registrados
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="min-w-40 pl-6">
                                    Fecha
                                </TableHead>
                                <TableHead className="min-w-48">
                                    Producto
                                </TableHead>
                                <TableHead>
                                    Tipo
                                </TableHead>
                                <TableHead className="text-right">
                                    Cantidad
                                </TableHead>
                                <TableHead className="min-w-48">
                                    Responsable
                                </TableHead>
                                <TableHead className="min-w-52 pr-6">
                                    Motivo
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {movimientos.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-48 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                                                <History className="h-6 w-6 text-primary" />
                                            </div>

                                            <p className="text-sm font-semibold">
                                                No hay movimientos registrados
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Los ajustes aparecerán aquí
                                                cuando se registren.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movimientos.map((movimiento) => {
                                    const entrada =
                                        movimiento.tipo === "AJUSTE_POSITIVO" ||
                                        movimiento.tipo === "ENTRADA_COMPRA";

                                    const responsable = movimiento.usuario;

                                    const iniciales = responsable?.nombre
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((parte) => parte[0])
                                        .join("")
                                        .toUpperCase() || "?";

                                    const etiquetaTipo: Record<string, string> = {
                                        AJUSTE_POSITIVO: "Ajuste positivo",
                                        AJUSTE_NEGATIVO: "Ajuste negativo",
                                        ENTRADA_COMPRA: "Entrada por compra",
                                        SALIDA_VENTA: "Salida por venta",
                                    };

                                    return (
                                        <TableRow
                                            key={movimiento.id}
                                            className="hover:bg-secondary/20"
                                        >
                                            <TableCell className="whitespace-nowrap pl-6 text-sm">
                                                {new Intl.DateTimeFormat(
                                                    "es-PE",
                                                    {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                        timeZone: "America/Lima",
                                                    }
                                                ).format(movimiento.fecha)}
                                            </TableCell>

                                            <TableCell>
                                                <p className="font-semibold">
                                                    {movimiento.producto.nombre}
                                                </p>

                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {movimiento.producto.codigo}
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${entrada
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-amber-50 text-amber-700"
                                                        }`}
                                                >
                                                    {entrada ? (
                                                        <ArrowUpCircle className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowDownCircle className="h-3.5 w-3.5" />
                                                    )}

                                                    {etiquetaTipo[movimiento.tipo] ??
                                                        movimiento.tipo}
                                                </span>
                                            </TableCell>

                                            <TableCell
                                                className={`text-right font-semibold ${entrada
                                                        ? "text-emerald-700"
                                                        : "text-amber-700"
                                                    }`}
                                            >
                                                {entrada ? "+" : "-"}
                                                {movimiento.cantidad}
                                            </TableCell>

                                            {/* Responsable */}
                                            <TableCell>
                                                {responsable ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                            {iniciales}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {responsable.nombre}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                {ETIQUETA_ROL[responsable.rol]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <UserRound className="h-4 w-4" />
                                                        <span>Sin responsable registrado</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell className="max-w-80 pr-6 text-sm text-muted-foreground">
                                                {movimiento.motivo || "Sin observación"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="border-t border-border bg-secondary/20 px-6 py-3">
                    <p className="text-xs text-muted-foreground">
                        Mostrando {movimientos.length} movimiento(s) recientes.
                    </p>
                </div>
            </section>
        </div>
    );
}
