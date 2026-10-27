import Link from "next/link";
import { notFound } from "next/navigation";

import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    FileText,
    History,
    ShieldCheck,
    Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
    ROLES_OP_LECTURA,
    ROLES_OP_AUTORIZACION,
} from "@/lib/ordenes-pago/roles";

import { DesembolsoDialog } from "../desembolso-dialog";
import { ROLES_OP_DESEMBOLSO } from "@/lib/ordenes-pago/roles";

import { DecisionOrdenPago } from "../decision-orden-pago";
import { Prisma } from "@/generated/prisma/client";

type Props = {
    params: Promise<{ id: string }>;
};

const estados: Record<string, {
    texto: string;
    clase: string;
}> = {
    SOLICITADA: {
        texto: "Solicitada",
        clase: "bg-amber-50 text-amber-700",
    },
    APROBADA: {
        texto: "Aprobada",
        clase: "bg-blue-50 text-blue-700",
    },
    RECHAZADA: {
        texto: "Rechazada",
        clase: "bg-red-50 text-red-700",
    },
    PAGO_PARCIAL: {
        texto: "Pago parcial",
        clase: "bg-violet-50 text-violet-700",
    },
    PAGADA: {
        texto: "Pagada",
        clase: "bg-emerald-50 text-emerald-700",
    },
};

function importe(moneda: string, valor: Prisma.Decimal) {
    return `${moneda === "USD" ? "US$" : "S/"} ${valor.toFixed(2)}`;
}

function fecha(fecha: Date | null) {
    if (!fecha) return "No registrada";

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
    }).format(fecha);
}

export default async function OrdenPagoDetallePage({
    params,
}: Props) {
    const usuario = await exigirRol(ROLES_OP_LECTURA);
    const { id } = await params;
    const ordenPagoId = Number(id);

    if (
        !/^\d+$/.test(id) ||
        !Number.isSafeInteger(ordenPagoId) ||
        ordenPagoId <= 0
    ) {
        notFound();
    }

    const orden = await prisma.ordenPago.findUnique({
        where: { id: ordenPagoId },
        include: {
            compra: {
                include: {
                    proveedor: {
                        select: {
                            razonSocial: true,
                        },
                    },
                },
            },
            solicitante: {
                select: { nombre: true },
            },
            autorizador: {
                select: { nombre: true },
            },
            desembolsos: {
                orderBy: [
                    { fechaRegistro: "desc" },
                    { id: "desc" },
                ],
                include: {
                    responsable: {
                        select: { nombre: true },
                    },
                },
            },
            historial: {
                orderBy: [
                    { fecha: "desc" },
                    { id: "desc" },
                ],
                include: {
                    usuario: {
                        select: { nombre: true },
                    },
                },
            },
        },
    });

    if (!orden) notFound();

    const montoPagado = orden.desembolsos.reduce(
        (total, desembolso) => total.add(desembolso.monto),
        new Prisma.Decimal(0)
    );

    const saldo = orden.montoSolicitado.sub(montoPagado);
    const progreso = orden.montoSolicitado.gt(0)
        ? Math.min(
            100,
            Math.max(
                0,
                montoPagado
                    .div(orden.montoSolicitado)
                    .mul(100)
                    .toNumber()
            )
        )
        : 0;

    const puedeAutorizar =
        orden.estado === "SOLICITADA" &&
        ROLES_OP_AUTORIZACION.includes(usuario.rol);

    const puedeDesembolsar =
        ROLES_OP_DESEMBOLSO.includes(usuario.rol) &&
        ["APROBADA", "PAGO_PARCIAL"].includes(orden.estado) &&
        saldo.gt(0);

    const estadoVisual = estados[orden.estado] ?? {
        texto: orden.estado,
        clase: "bg-secondary text-muted-foreground",
    };

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-8">
            <section className="space-y-4">
                <Link
                    href="/dashboard/ordenes-pago"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Órdenes de Pago
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-secondary p-3 text-primary">
                            <Wallet className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Orden de Pago #
                                {String(orden.id).padStart(4, "0")}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Solicitud financiera asociada a{" "}
                                <Link
                                    href={`/dashboard/compras/${orden.compraId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    OC-
                                    {String(orden.compraId).padStart(4, "0")}
                                </Link>
                            </p>
                        </div>
                    </div>

                    <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${estadoVisual.clase}`}
                    >
                        {estadoVisual.texto}
                    </span>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Importe solicitado
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {importe(orden.moneda, orden.montoSolicitado)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Moneda: {orden.moneda}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Avance de desembolsos
                    </p>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                        <p className="text-3xl font-bold text-primary">
                            {Math.round(progreso)}%
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Pagado: {importe(orden.moneda, montoPagado)}
                        </p>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${progreso}%` }}
                        />
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                        {orden.estado === "RECHAZADA"
                            ? "Solicitud rechazada; no corresponde realizar pagos."
                            : `Saldo por desembolsar: ${importe(orden.moneda, saldo)}`}
                    </p>
                </div>
            </section>

            <section className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Información de la solicitud</h2>
                </div>

                <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Proveedor</p>
                        <p className="mt-1 font-medium">
                            {orden.compra.proveedor.razonSocial}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Solicitante</p>
                        <p className="mt-1 font-medium">
                            {orden.solicitante.nombre}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Fecha de solicitud
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {fecha(orden.fechaSolicitud)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Número de factura
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {orden.numeroFactura || "No especificado"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Autorizado por
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {orden.autorizador?.nombre ?? "No autorizado"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Fecha de autorización
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {fecha(orden.fechaAutorizacion)}
                        </p>
                    </div>
                </div>

                {orden.observaciones && (
                    <div className="border-t px-6 py-5">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold">Observaciones</p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {orden.observaciones}
                        </p>
                    </div>
                )}

                {orden.motivoRechazo && (
                    <div className="border-t bg-red-50/60 px-6 py-5">
                        <p className="text-sm font-semibold text-red-700">
                            Motivo del rechazo
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-red-800">
                            {orden.motivoRechazo}
                        </p>
                    </div>
                )}
            </section>

            {puedeAutorizar && (
                <DecisionOrdenPago ordenPagoId={orden.id} />
            )}

            <section className="rounded-xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">
                            Desembolsos
                        </h2>
                    </div>

                    {puedeDesembolsar && (
                        <DesembolsoDialog
                            ordenPagoId={orden.id}
                            moneda={orden.moneda}
                            saldo={saldo.toFixed(2)}
                        />
                    )}
                </div>

                {orden.desembolsos.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                        Todavía no se han registrado desembolsos.
                        {orden.estado === "APROBADA" &&
                            " La orden está autorizada para su pago."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/40 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3">Fecha de pago</th>
                                    <th className="px-4 py-3">Método</th>
                                    <th className="px-4 py-3">Referencia</th>
                                    <th className="px-4 py-3">Responsable</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orden.desembolsos.map((pago) => (
                                    <tr key={pago.id}>
                                        <td className="px-6 py-4">
                                            {fecha(pago.fechaPago)}
                                        </td>
                                        <td className="px-4 py-4">{pago.metodo}</td>
                                        <td className="px-4 py-4">
                                            {pago.referencia ?? "—"}
                                        </td>
                                        <td className="px-4 py-4">
                                            {pago.responsable.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold">
                                            {importe(orden.moneda, pago.monto)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <History className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Historial de la Orden de Pago</h2>
                </div>

                {orden.historial.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">
                        Sin eventos registrados.
                    </p>
                ) : (
                    <div className="divide-y">
                        {orden.historial.map((evento) => (
                            <div
                                key={evento.id}
                                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4"
                            >
                                <div>
                                    <p className="text-sm font-semibold">
                                        {evento.accion.replaceAll("_", " ")}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {evento.descripcion ??
                                            `Estado: ${evento.estadoNuevo}`}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Responsable: {evento.usuario.nombre}
                                    </p>
                                </div>

                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {fecha(evento.fecha)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
