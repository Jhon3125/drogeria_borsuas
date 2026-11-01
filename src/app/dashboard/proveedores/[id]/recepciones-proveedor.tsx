
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = {
    proveedorId: number;
};

function formatearFecha(fecha: Date) {
    return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(fecha);
}

function obtenerEstado(solicitado: number, recibido: number) {
    if (recibido > solicitado) {
        return {
            texto: "Revisar exceso",
            clase: "bg-red-50 text-red-700",
        };
    }

    if (recibido === 0) {
        return {
            texto: "Pendiente",
            clase: "bg-amber-50 text-amber-700",
        };
    }

    if (recibido < solicitado) {
        return {
            texto: "Parcial",
            clase: "bg-blue-50 text-[#087EBD]",
        };
    }

    return {
        texto: "Completa",
        clase: "bg-green-50 text-[#238B55]",
    };
}

export async function RecepcionesProveedor({
    proveedorId,
}: Props) {
    const compras = await prisma.compra.findMany({
        where: {
            proveedorId,
        },
        orderBy: {
            fecha: "desc",
        },
        select: {
            id: true,
            fecha: true,
            detalles: {
                orderBy: {
                    id: "asc",
                },
                select: {
                    id: true,
                    productoId: true,
                    cantidad: true,
                },
            },
            recepciones: {
                orderBy: {
                    fecha: "desc",
                },
                select: {
                    id: true,
                    detalleCompraId: true,
                    loteId: true,
                    cantidad: true,
                    fecha: true,
                },
            },
        },
    });

    if (compras.length === 0) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#123E70]">
                    Detalle de recepciones
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                    Este proveedor todavía no tiene órdenes de compra.
                </p>
            </section>
        );
    }

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-[#123E70]">
                    Detalle de recepciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Seguimiento de los productos solicitados,
                    cantidades recibidas y lotes registrados
                    en cada orden de compra.
                </p>
            </div>

            <div className="divide-y divide-slate-200">
                {compras.map((compra) => {
                    const totalSolicitado = compra.detalles.reduce(
                        (suma, detalle) => suma + detalle.cantidad,
                        0
                    );

                    const totalRecibido = compra.recepciones.reduce(
                        (suma, recepcion) => suma + recepcion.cantidad,
                        0
                    );

                    const totalPendiente = Math.max(
                        0,
                        totalSolicitado - totalRecibido
                    );

                    const porcentaje =
                        totalSolicitado > 0
                            ? Math.min(
                                100,
                                (totalRecibido / totalSolicitado) * 100
                            )
                            : 0;

                    return (
                        <details
                            key={compra.id}
                            className="group"
                        >
                            <summary className="cursor-pointer list-none px-5 py-4 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-[#123E70]">
                                            OC #{compra.id}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatearFecha(compra.fecha)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {totalRecibido} / {totalSolicitado}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Unidades recibidas
                                            </p>
                                        </div>

                                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                            {totalPendiente} pendientes
                                        </span>

                                        <span className="text-lg font-bold text-[#087EBD]">
                                            {porcentaje.toFixed(1)}%
                                        </span>

                                        <span className="text-slate-500 transition group-open:rotate-180">
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-[#238B55]"
                                        style={{
                                            width: `${porcentaje}%`,
                                        }}
                                    />
                                </div>
                            </summary>

                            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5">
                                <div className="space-y-4">
                                    {compra.detalles.map((detalle) => {
                                        const recepciones =
                                            compra.recepciones.filter(
                                                (recepcion) =>
                                                    recepcion.detalleCompraId === detalle.id
                                            );

                                        const recibido = recepciones.reduce(
                                            (suma, recepcion) =>
                                                suma + recepcion.cantidad,
                                            0
                                        );

                                        const pendiente = Math.max(
                                            0,
                                            detalle.cantidad - recibido
                                        );

                                        const estado = obtenerEstado(
                                            detalle.cantidad,
                                            recibido
                                        );

                                        return (
                                            <div
                                                key={detalle.id}
                                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            Producto #{detalle.productoId}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Detalle de OC #{detalle.id}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}
                                                    >
                                                        {estado.texto}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 px-4 py-4 text-center">
                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Solicitadas
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-[#123E70]">
                                                            {detalle.cantidad}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Recibidas
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-[#238B55]">
                                                            {recibido}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Pendientes
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-amber-700">
                                                            {pendiente}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-100 px-4 py-3">
                                                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                        Ingresos registrados
                                                    </p>

                                                    {recepciones.length === 0 ? (
                                                        <p className="text-sm text-slate-500">
                                                            Aún no se registraron recepciones
                                                            para este producto.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {recepciones.map((recepcion) => (
                                                                <div
                                                                    key={recepcion.id}
                                                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                                                                >
                                                                    <div>
                                                                        <p className="font-semibold text-slate-700">
                                                                            {recepcion.cantidad} unidades
                                                                        </p>

                                                                        <p className="text-xs text-slate-500">
                                                                            {formatearFecha(recepcion.fecha)}
                                                                        </p>
                                                                    </div>

                                                                    <Link
                                                                        href={`/dashboard/lotes/${recepcion.loteId}`}
                                                                        className="font-semibold text-[#087EBD] hover:underline"
                                                                    >
                                                                        Ver lote #{recepcion.loteId}
                                                                    </Link>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {compra.detalles.length === 0 && (
                                        <p className="text-sm text-slate-500">
                                            Esta orden no tiene detalles registrados.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 text-right">
                                    <Link
                                        href={`/dashboard/compras/${compra.id}`}
                                        className="text-sm font-semibold text-[#087EBD] hover:underline"
                                    >
                                        Consultar orden de compra
                                    </Link>
                                </div>
                            </div>
                        </details>
                    );
                })}
            </div>
        </section>
    );
}
