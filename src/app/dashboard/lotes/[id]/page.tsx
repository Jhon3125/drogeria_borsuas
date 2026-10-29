
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    CalendarClock,
    ClipboardList,
    History,
    Package,
    ShieldCheck,
    Truck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_LECTURA } from "@/lib/compras-roles";
import { consultarInventarioRespaldado } from "@/lib/inventario/lotes-respaldados";
import { EstadoCalidadForm } from "../estado-calidad-form";
import { RetencionesPanel } from "../retenciones-panel";

type Props = {
    params: Promise<{ id: string }>;
};

function fechaPeru(valor: Date) {
    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
    }).format(valor);
}

function fechaVencimiento(valor: Date) {
    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeZone: "UTC",
    }).format(valor);
}

function hoyCalendarioPeru() {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const obtener = (tipo: string) =>
        partes.find((parte) => parte.type === tipo)?.value ?? "";

    return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

function diasVencimiento(fecha: Date) {
    const hoy = Date.parse(`${hoyCalendarioPeru()}T00:00:00Z`);
    const vencimiento = Date.UTC(
        fecha.getUTCFullYear(),
        fecha.getUTCMonth(),
        fecha.getUTCDate()
    );

    return Math.round((vencimiento - hoy) / 86400000);
}

export default async function DetalleLotePage({
    params,
}: Props) {
    const usuario = await exigirRol(ROLES_COMPRAS_LECTURA);

    const puedeGestionarCalidad = [
        "SUPER_ADMIN",
        "ADMIN",
    ].includes(usuario.rol);

    const { id } = await params;
    const loteId = Number(id);

    if (
        !/^\d+$/.test(id) ||
        !Number.isSafeInteger(loteId) ||
        loteId <= 0
    ) {
        notFound();
    }

    // Validar el mismo respaldo que exige el inventario operativo.
    const inventario = await consultarInventarioRespaldado();

    const loteRespaldado = inventario
        .flatMap((producto) => producto.lotes)
        .find((lote) => lote.id === loteId);

    if (!loteRespaldado) notFound();

    const lote = await prisma.lote.findUnique({
        where: { id: loteId },
        include: {
            producto: {
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    unidadMedida: true,
                    categoria: {
                        select: { nombre: true },
                    },
                },
            },
            recepciones: {
                orderBy: [
                    { fecha: "desc" },
                    { id: "desc" },
                ],
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
                    usuario: {
                        select: { nombre: true },
                    },
                },
            },
            movimientos: {
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
            historialCalidad: {
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
            retenciones: {
                orderBy: [
                    { fechaRegistro: "desc" },
                    { id: "desc" },
                ],
                include: {
                    registradoPor: {
                        select: { nombre: true },
                    },
                    liberadoPor: {
                        select: { nombre: true },
                    },
                },
            },
        },
    });

    if (!lote) notFound();

    const totalRecibido = lote.recepciones.reduce(
        (total, recepcion) => total + recepcion.cantidad,
        0
    );

    const dias = diasVencimiento(lote.fechaVencimiento);

    const estado =
        lote.cantidadDisponible === 0
            ? "AGOTADO"
            : dias < 0
                ? "VENCIDO"
                : dias <= 30
                    ? "PROXIMO"
                    : "VIGENTE";

    const estados = {
        AGOTADO: {
            texto: "Agotado",
            clase: "bg-slate-100 text-slate-700",
        },
        VENCIDO: {
            texto: "Vencido",
            clase: "bg-red-50 text-red-700",
        },
        PROXIMO: {
            texto: "Próximo a vencer",
            clase: "bg-amber-50 text-amber-700",
        },
        VIGENTE: {
            texto: "Vigente",
            clase: "bg-emerald-50 text-emerald-700",
        },
    }[estado];

    return (
        <main className="mx-auto max-w-7xl space-y-6 pb-8">
            <header className="space-y-4">
                <Link
                    href="/dashboard/lotes"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Lotes y vencimientos
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-secondary p-3 text-primary">
                            <Package className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#123E70] sm:text-3xl">
                                Lote {lote.numeroLote}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {lote.producto.codigo} · {lote.producto.nombre}
                            </p>
                        </div>
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${estados.clase}`}>
                        {estados.texto}
                    </span>
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Total recibido
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {totalRecibido}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {lote.producto.unidadMedida}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Existencias actuales
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {lote.cantidadDisponible}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Cantidad física registrada
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Fecha de vencimiento
                    </p>
                    <p className="mt-3 text-lg font-bold text-primary">
                        {fechaVencimiento(lote.fechaVencimiento)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {dias < 0
                            ? `Venció hace ${Math.abs(dias)} día(s)`
                            : dias === 0
                                ? "Vence hoy"
                                : `Faltan ${dias} día(s)`}
                    </p>
                </div>
            </section>

            <section className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">
                        Información y trazabilidad
                    </h2>
                </div>

                <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Producto</p>
                        <Link
                            href={`/dashboard/inventario/producto/${lote.producto.id}`}
                            className="mt-1 inline-block font-medium text-primary hover:underline"
                        >
                            {lote.producto.nombre}
                        </Link>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Categoría</p>
                        <p className="mt-1 font-medium">
                            {lote.producto.categoria.nombre}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Número de lote</p>
                        <p className="mt-1 font-medium">{lote.numeroLote}</p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Fecha de primer ingreso registrada
                        </p>
                        <p className="mt-1 font-medium">
                            {fechaPeru(lote.fechaIngreso)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Cantidad inicial registrada
                        </p>
                        <p className="mt-1 font-medium">
                            {lote.cantidadInicial}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Recepciones asociadas
                        </p>
                        <p className="mt-1 font-medium">
                            {lote.recepciones.length}
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">
                    Condición de calidad
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                        {lote.estadoCalidad}
                    </span>

                    <p className="text-sm text-muted-foreground">
                        {lote.estadoCalidad === "DISPONIBLE"
                            ? "Liberado administrativamente, sujeto a vencimiento."
                            : "No apto para operaciones comerciales."}
                    </p>
                </div>

                {puedeGestionarCalidad && (
                    <div className="mt-5">
                        <EstadoCalidadForm
                            loteId={lote.id}
                            estadoActual={lote.estadoCalidad}
                        />
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b px-6 py-5">
                    <h2 className="font-semibold">
                        Historial de calidad
                    </h2>
                </div>

                {lote.historialCalidad.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">
                        No se han registrado cambios de calidad.
                        El estado inicial proviene de la configuración del sistema.
                    </p>
                ) : (
                    <div className="divide-y">
                        {lote.historialCalidad.map((evento) => (
                            <div key={evento.id} className="px-6 py-4">
                                <p className="text-sm font-semibold">
                                    {evento.estadoAnterior} → {evento.estadoNuevo}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {evento.motivo}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {evento.usuario.nombre} ·{" "}
                                    {fechaPeru(evento.fecha)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <RetencionesPanel
                loteId={lote.id}
                stockFisico={lote.cantidadDisponible}
                puedeGestionar={puedeGestionarCalidad}
                retenciones={lote.retenciones.map((retencion) => ({
                    id: retencion.id,
                    cantidad: retencion.cantidad,
                    motivo: retencion.motivo,
                    estado: retencion.estado,
                    fechaRegistro: retencion.fechaRegistro.toISOString(),
                    registradoPor: retencion.registradoPor.nombre,
                    fechaLiberacion:
                        retencion.fechaLiberacion?.toISOString() ?? null,
                    liberadoPor:
                        retencion.liberadoPor?.nombre ?? null,
                    motivoLiberacion: retencion.motivoLiberacion,
                }))}
            />

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <Truck className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">
                        Historial de recepciones
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-secondary/40 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-4 py-4">Orden de Compra</th>
                                <th className="px-4 py-4">Proveedor</th>
                                <th className="px-4 py-4">Responsable</th>
                                <th className="px-6 py-4 text-right">Cantidad</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {lote.recepciones.map((recepcion) => (
                                <tr key={recepcion.id}>
                                    <td className="px-6 py-4">
                                        {fechaPeru(recepcion.fecha)}
                                    </td>

                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/dashboard/compras/${recepcion.compraId}`}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            OC-{String(recepcion.compraId).padStart(4, "0")}
                                        </Link>
                                    </td>

                                    <td className="px-4 py-4">
                                        {recepcion.compra.proveedor.razonSocial}
                                    </td>

                                    <td className="px-4 py-4">
                                        {recepcion.usuario?.nombre ?? "No registrado"}
                                    </td>

                                    <td className="px-6 py-4 text-right font-semibold">
                                        +{recepcion.cantidad}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-5">
                    <History className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">
                        Movimientos de inventario
                    </h2>
                </div>

                {lote.movimientos.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">
                        No se encontraron movimientos asociados directamente a este lote.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left text-sm">
                            <thead className="bg-secondary/40 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-4 py-4">Tipo</th>
                                    <th className="px-4 py-4 text-right">Cantidad</th>
                                    <th className="px-4 py-4">Responsable</th>
                                    <th className="px-6 py-4">Motivo</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {lote.movimientos.map((movimiento) => (
                                    <tr key={movimiento.id}>
                                        <td className="px-6 py-4">
                                            {fechaPeru(movimiento.fecha)}
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {movimiento.tipo}
                                        </td>

                                        <td className="px-4 py-4 text-right font-semibold">
                                            {movimiento.cantidad}
                                        </td>

                                        <td className="px-4 py-4">
                                            {movimiento.usuario?.nombre ?? "No registrado"}
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {movimiento.motivo ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <div className="flex items-start gap-2 rounded-xl border bg-secondary/30 p-4">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-muted-foreground">
                    La información de este lote está respaldada por
                    recepciones registradas. Las existencias son físicas,
                    no necesariamente aptas para venta o despacho.
                    Los movimientos se presentan con el tipo y la
                    cantidad registrados originalmente.
                </p>
            </div>
        </main>
    );
}
