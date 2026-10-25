
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecepcionDialog } from "../recepcion-dialog";
import { ROLES_RECEPCION } from "@/lib/compras-roles";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ClipboardList,
    FileText,
    Package,
    PackageCheck,
    Truck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_LECTURA } from "@/lib/compras-roles";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Props = {
    params: Promise<{ id: string }>;
};

function monedaTexto(moneda: string) {
    return moneda === "USD" ? "US$" : "S/";
}

function estadoTexto(estado: string) {
    switch (estado) {
        case "PENDIENTE":
            return "Pendiente";
        case "PARCIAL":
            return "Recepción parcial";
        case "RECIBIDO":
            return "Recibida";
        default:
            return estado;
    }
}

function estadoClase(estado: string) {
    switch (estado) {
        case "PENDIENTE":
            return "bg-amber-50 text-amber-700";
        case "PARCIAL":
            return "bg-blue-50 text-blue-700";
        case "RECIBIDO":
            return "bg-emerald-50 text-emerald-700";
        default:
            return "bg-secondary text-secondary-foreground";
    }
}

function fechaPeru(fecha: Date | null | undefined) {
    if (!fecha) return "No especificada";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Lima",
    }).format(fecha);
}

function fechaLote(fecha: Date) {
    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(fecha);
}

export default async function OrdenCompraDetallePage({
    params,
}: Props) {
    const usuario = await exigirRol(ROLES_COMPRAS_LECTURA);

    const puedeRecepcionar = ROLES_RECEPCION.includes(usuario.rol);

    const { id } = await params;
    const compraId = Number(id);

    if (
        !/^\d+$/.test(id) ||
        !Number.isSafeInteger(compraId) ||
        compraId <= 0
    ) {
        notFound();
    }

    const compra = await prisma.compra.findUnique({
        where: { id: compraId },
        include: {
            proveedor: {
                select: {
                    razonSocial: true,
                },
            },
            detalles: {
                orderBy: { id: "asc" },
                include: {
                    producto: {
                        select: {
                            codigo: true,
                            nombre: true,
                            unidadMedida: true,
                        },
                    },
                    recepciones: {
                        include: {
                            lote: {
                                select: {
                                    numeroLote: true,
                                    fechaVencimiento: true,
                                },
                            },
                            usuario: {
                                select: {
                                    nombre: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!compra) notFound();

    const detalles = compra.detalles.map((detalle) => {
        const recibido = detalle.recepciones.reduce(
            (total, recepcion) =>
                total + recepcion.cantidad,
            0
        );

        return {
            ...detalle,
            recibido,
            pendiente: Math.max(0, detalle.cantidad - recibido),
        };
    });

    const lineasRecepcion = detalles
        .filter((detalle) => detalle.pendiente > 0)
        .map((detalle) => ({
            id: detalle.id,
            codigo: detalle.producto.codigo,
            nombre: detalle.producto.nombre,
            precioUnitario: `${monedaTexto(compra.moneda)} ${detalle.precioUnitario.toFixed(2)}`,
            pendiente: detalle.pendiente,
        }));

    const totalSolicitado = detalles.reduce(
        (total, detalle) => total + detalle.cantidad,
        0
    );

    const totalRecibido = detalles.reduce(
        (total, detalle) => total + detalle.recibido,
        0
    );

    const totalPendiente = detalles.reduce(
        (total, detalle) => total + detalle.pendiente,
        0
    );

    const porcentaje =
        totalSolicitado > 0
            ? Math.min(
                100,
                Math.round(
                    (totalRecibido / totalSolicitado) * 100
                )
            )
            : 0;

    const recepciones = detalles.flatMap((detalle) =>
        detalle.recepciones.map((recepcion) => ({
            id: recepcion.id,
            detalleId: detalle.id,
            producto: detalle.producto.nombre,
            codigo: detalle.producto.codigo,
            cantidad: recepcion.cantidad,
            lote: recepcion.lote.numeroLote,
            vencimiento:
                recepcion.lote.fechaVencimiento,
            fecha: recepcion.fecha,
            responsable: recepcion.usuario?.nombre ?? "Sin responsable registrado",
        }))
    );

    const simbolo = monedaTexto(compra.moneda);

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-8">
            {/* Navegación */}
            <section className="space-y-4">
                <Link
                    href="/dashboard/compras"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Órdenes de Compra
                </Link>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Abastecimiento</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>Órdenes de Compra</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-primary">
                        OC-{String(compra.id).padStart(4, "0")}
                    </span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                            <ClipboardList className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Orden de Compra #
                                {String(compra.id).padStart(4, "0")}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Detalle de productos solicitados y
                                seguimiento de recepción.
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${estadoClase(compra.estado)}`}
                    >
                        {estadoTexto(compra.estado)}
                    </span>
                </div>
            </section>

            {/* Resumen */}
            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Importe de la orden
                    </div>

                    <p className="mt-4 text-3xl font-bold text-primary">
                        {simbolo}{" "}
                        {compra.importeTotal.toFixed(2)}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                        Moneda: {compra.moneda}
                        {compra.tipoCambio
                            ? ` · Tipo de cambio: ${compra.tipoCambio.toFixed(6)}`
                            : ""}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PackageCheck className="h-4 w-4 text-emerald-600" />
                        Progreso de recepción
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                        <p className="text-3xl font-bold text-primary">
                            {porcentaje}%
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {totalRecibido} de {totalSolicitado} uds.
                        </p>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div
                            className={`h-full rounded-full ${porcentaje === 100
                                ? "bg-emerald-500"
                                : "bg-[#087EBD]"
                                }`}
                            style={{ width: `${porcentaje}%` }}
                        />
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                        {totalPendiente} unidad(es) pendientes
                        de recepción.
                    </p>
                </div>
            </section>

            {/* Información general */}
            <section className="rounded-xl border bg-card shadow-xs">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">
                        Información general
                    </h2>
                </div>

                <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Proveedor
                        </p>
                        <p className="mt-1 font-semibold">
                            {compra.proveedor.razonSocial}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Fecha de emisión
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {fechaPeru(compra.fecha)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Entrega estimada
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {fechaPeru(
                                compra.fechaEntregaEstimada
                            )}
                        </p>
                    </div>
                </div>

                {compra.observaciones && (
                    <div className="border-t px-6 py-5">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold">
                                Observaciones
                            </p>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {compra.observaciones}
                        </p>
                    </div>
                )}
            </section>

            {/* Detalles */}
            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Package className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold">
                                Productos solicitados
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Cantidades solicitadas y
                                efectivamente recibidas.
                            </p>
                        </div>
                    </div>

                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                        {detalles.length} línea(s)
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="pl-6">
                                    Producto
                                </TableHead>
                                <TableHead className="text-right">
                                    Costo unitario
                                </TableHead>
                                <TableHead className="text-center">
                                    Solicitado
                                </TableHead>
                                <TableHead className="text-center">
                                    Recibido
                                </TableHead>
                                <TableHead className="pr-6 text-center">
                                    Pendiente
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {detalles.map((detalle) => (
                                <TableRow key={detalle.id}>
                                    <TableCell className="py-4 pl-6">
                                        <p className="font-semibold">
                                            {detalle.producto.nombre}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {detalle.producto.codigo}
                                            {" · "}
                                            Línea #{detalle.id}
                                        </p>
                                    </TableCell>

                                    <TableCell className="text-right font-medium">
                                        {simbolo}{" "}
                                        {detalle.precioUnitario.toFixed(2)}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        {detalle.cantidad}
                                    </TableCell>

                                    <TableCell className="text-center font-semibold text-emerald-700">
                                        {detalle.recibido}
                                    </TableCell>

                                    <TableCell className="pr-6 text-center">
                                        <span
                                            className={
                                                detalle.pendiente > 0
                                                    ? "font-semibold text-amber-700"
                                                    : "font-semibold text-emerald-700"
                                            }
                                        >
                                            {detalle.pendiente}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* Recepción: próximo incremento */}
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Truck className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold">
                            Recepción de mercadería
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {totalPendiente > 0
                                ? `${totalPendiente} unidad(es) pendientes de recibir.`
                                : "No hay cantidades pendientes de recepción."}
                        </p>
                    </div>
                </div>


                {totalPendiente === 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Recepción completa
                    </span>
                ) : puedeRecepcionar &&
                    ["PENDIENTE", "PARCIAL"].includes(compra.estado) ? (
                    <RecepcionDialog
                        compraId={compra.id}
                        lineas={lineasRecepcion}
                    />
                ) : (
                    <span className="rounded-lg border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                        Recepción no disponible para este usuario o estado
                    </span>
                )}

            </section>

            {/* Historial disponible */}
            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="flex items-center gap-3 border-b px-6 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                        <PackageCheck className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold">
                            Historial de recepciones
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Registros físicos asociados a esta orden.
                        </p>
                    </div>
                </div>

                {recepciones.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <Clock3 className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium">
                            Todavía no hay recepciones
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Los lotes y cantidades recibidas
                            aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                    <TableHead className="pl-6">Fecha de recepción</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead className="pr-6 text-right">Recibido</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {recepciones.map((recepcion) => (
                                    <TableRow key={recepcion.id}>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {new Intl.DateTimeFormat("es-PE", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                                timeZone: "America/Lima",
                                            }).format(recepcion.fecha)}
                                        </TableCell>

                                        <TableCell className="text-sm">
                                            {recepcion.responsable}
                                        </TableCell>
                                        <TableCell className="pl-6">
                                            <p className="font-medium">
                                                {recepcion.producto}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {recepcion.codigo}
                                                {" · "}
                                                Línea #{recepcion.detalleId}
                                            </p>
                                        </TableCell>

                                        <TableCell>
                                            {recepcion.lote}
                                        </TableCell>

                                        <TableCell>
                                            {fechaLote(
                                                recepcion.vencimiento
                                            )}
                                        </TableCell>

                                        <TableCell className="pr-6 text-right font-semibold text-emerald-700">
                                            +{recepcion.cantidad}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </section>
        </div>
    );
}
