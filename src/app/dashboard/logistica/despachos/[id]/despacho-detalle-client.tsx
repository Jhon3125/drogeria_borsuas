
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    Image as ImageIcon,
    MapPin,
    Package,
    RefreshCw,
    Truck,
    UserRound,
    X,
} from "lucide-react";
import {
    actualizarDespacho,
    recibirDevolucionDespacho,
} from "../../actions";
import DocumentPreview from "@/components/shared/document-preview";

type Estado =
    | "PENDIENTE"
    | "EN_RUTA"
    | "ENTREGADO"
    | "REPROGRAMADO";

type ModalAccion = "INICIAR" | "ENTREGAR" | "REPROGRAMAR" | "DEVOLVER" | null;

type Despacho = {
    id: number;
    ventaId: number;
    estado: Estado;
    fechaCreacion: string;
    fechaActualizacion: string;
    salidaInventarioEn: string | null;
    entregadoEn: string | null;
    receptor: string | null;
    observacion: string | null;
    devolucionInventarioEn: string | null;
    devolucionMotivo: string | null;
    gestionCompleta: boolean;
    importeTotal: number;
    saldoPendiente: number;
    moneda: string;
    cliente: {
        razonSocial: string;
        direccion: string | null;
    };
    ruta: {
        id: number;
        fecha: string;
        conductor: string;
        vehiculo: string;
        modeloVehiculo: string;
        capacidadVehiculo: string;
    } | null;
    productos: {
        id: number;
        nombre: string;
        codigo: string;
        cantidad: number;
        lotes: {
            loteId: number;
            numero: string;
            cantidad: number;
            vencimiento: string;
            calidad: string;
        }[];
    }[];
    evidencia: {
        fecha: string;
        tipoMime: string;
        nombre: string;
    } | null;
    historial: {
        id: number;
        estadoAnterior: string;
        estadoNuevo: string;
        observacion: string | null;
        fecha: string;
        usuario: string;
    }[];
};

const estados: Record<Estado, { texto: string; clase: string }> = {
    PENDIENTE: {
        texto: "Pendiente",
        clase: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    EN_RUTA: {
        texto: "En ruta",
        clase: "bg-sky-50 text-sky-700 ring-sky-200",
    },
    ENTREGADO: {
        texto: "Entregado",
        clase: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    REPROGRAMADO: {
        texto: "Reprogramado",
        clase: "bg-amber-50 text-amber-800 ring-amber-200",
    },
};

function fecha(valor: string | null) {
    if (!valor) return "—";
    return new Date(valor).toLocaleDateString("es-PE", {
        dateStyle: "medium",
        timeZone: "America/Lima",
    });
}

function fechaHora(valor: string | null) {
    if (!valor) return "Pendiente";
    return new Date(valor).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
    });
}

function dinero(valor: number, moneda: string) {
    try {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: moneda || "PEN",
        }).format(valor);
    } catch {
        return `${moneda} ${valor.toFixed(2)}`;
    }
}

function Seccion({
    titulo,
    descripcion,
    children,
}: {
    titulo: string;
    descripcion?: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold text-slate-900">{titulo}</h2>
                {descripcion && (
                    <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
                )}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Dato({
    icono,
    titulo,
    valor,
}: {
    icono: ReactNode;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4">
            <span className="text-slate-400">{icono}</span>
            <p className="mt-2 text-xs text-slate-500">{titulo}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                {valor}
            </p>
        </div>
    );
}

export default function DespachoDetalleClient({
    despacho,
    esConductor,
    puedeGestionarDevolucion,
}: {
    despacho: Despacho;
    esConductor: boolean;
    puedeGestionarDevolucion: boolean;
}) {
    const [modal, setModal] = useState<ModalAccion>(null);
    const [preview, setPreview] = useState<{
        titulo: string;
        src: string;
        tipo: "image" | "page";
    } | null>(null);

    const estado = estados[despacho.estado];
    const totalProductos = despacho.productos.reduce(
        (total, producto) => total + producto.cantidad,
        0
    );

    const pasos: { estado: Estado; texto: string }[] = [
        { estado: "PENDIENTE", texto: "Pendiente" },
        { estado: "EN_RUTA", texto: "En ruta" },
        {
            estado:
                despacho.estado === "REPROGRAMADO" ? "REPROGRAMADO" : "ENTREGADO",
            texto:
                despacho.estado === "REPROGRAMADO" ? "Reprogramado" : "Entregado",
        },
    ];

    function accionDisponible() {
        if (!despacho.gestionCompleta) return null;

        if (despacho.estado === "PENDIENTE") {
            return (
                <button
                    type="button"
                    onClick={() => setModal("INICIAR")}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D315B]"
                >
                    <Download className="h-4 w-4" />
                    Iniciar despacho
                </button>
            );
        }

        if (despacho.estado === "EN_RUTA") {
            return (
                <>
                    <button
                        type="button"
                        onClick={() => setModal("ENTREGAR")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmar entrega
                    </button>
                    <button
                        type="button"
                        onClick={() => setModal("REPROGRAMAR")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reprogramar
                    </button>
                </>
            );
        }

        if (
            despacho.estado === "REPROGRAMADO" &&
            despacho.salidaInventarioEn &&
            !despacho.devolucionInventarioEn &&
            puedeGestionarDevolucion
        ) {
            return (
                <button
                    type="button"
                    onClick={() => setModal("DEVOLVER")}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                    <Package className="h-4 w-4" />
                    Registrar devolución
                </button>
            );
        }

        return null;
    }

    return (
        <>
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm text-slate-500">Logística / Despachos / Detalle</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#123E70]">
                        Despacho #{despacho.id}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Seguimiento operativo de la venta #{despacho.ventaId}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${estado.clase}`}
                    >
                        {estado.texto}
                    </span>
                    {accionDisponible()}
                </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Dato
                    icono={<Package className="h-5 w-5" />}
                    titulo="Importe de venta"
                    valor={dinero(despacho.importeTotal, despacho.moneda)}
                />
                <Dato
                    icono={<Clock3 className="h-5 w-5" />}
                    titulo="Creado"
                    valor={fechaHora(despacho.fechaCreacion)}
                />
                <Dato
                    icono={<CheckCircle2 className="h-5 w-5" />}
                    titulo="Salida de inventario"
                    valor={fechaHora(despacho.salidaInventarioEn)}
                />
                <Dato
                    icono={<UserRound className="h-5 w-5" />}
                    titulo="Receptor"
                    valor={despacho.receptor || "Pendiente"}
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-slate-900">Progreso del despacho</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Seguimiento de los principales hitos de entrega.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                        {despacho.estado === "ENTREGADO"
                            ? "Proceso completado"
                            : despacho.estado === "REPROGRAMADO"
                                ? "Requiere nueva programación"
                                : "En proceso"}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {pasos.map((paso, indice) => {
                        const completado =
                            paso.estado === "PENDIENTE" ||
                            (paso.estado === "EN_RUTA" &&
                                ["EN_RUTA", "ENTREGADO", "REPROGRAMADO"].includes(
                                    despacho.estado
                                )) ||
                            paso.estado === despacho.estado;

                        return (
                            <div
                                key={`${paso.estado}-${indice}`}
                                className={`rounded-xl p-3 text-center ${completado
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-slate-50 text-slate-400"
                                    }`}
                            >
                                <div className="flex justify-center">
                                    {completado ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <Clock3 className="h-5 w-5" />
                                    )}
                                </div>
                                <p className="mt-2 text-xs font-semibold">{paso.texto}</p>
                            </div>
                        );
                    })}
                </div>

                {despacho.estado === "REPROGRAMADO" && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        El despacho fue reprogramado. La salida de inventario permanece
                        registrada hasta que Almacén confirme la devolución.
                    </p>
                )}
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-2">
                <div className="space-y-5">
                    <Seccion
                        titulo="Cliente y destino"
                        descripcion="Información del destinatario de la entrega."
                    >
                        <div className="space-y-3">
                            <Dato
                                icono={<UserRound className="h-5 w-5" />}
                                titulo="Cliente"
                                valor={despacho.cliente.razonSocial}
                            />
                            <Dato
                                icono={<MapPin className="h-5 w-5" />}
                                titulo="Dirección de entrega"
                                valor={despacho.cliente.direccion || "Sin dirección registrada"}
                            />
                            {despacho.cliente.direccion && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(despacho.cliente.direccion)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#123E70] hover:underline"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Consultar ubicación
                                </a>
                            )}
                        </div>
                    </Seccion>

                    <Seccion
                        titulo="Transporte"
                        descripcion="Recursos asignados a la hoja de ruta."
                    >
                        {despacho.ruta ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Dato
                                    icono={<CalendarDays className="h-5 w-5" />}
                                    titulo="Hoja de ruta"
                                    valor={`Ruta #${despacho.ruta.id} · ${fecha(despacho.ruta.fecha)}`}
                                />
                                <Dato
                                    icono={<UserRound className="h-5 w-5" />}
                                    titulo="Conductor"
                                    valor={despacho.ruta.conductor}
                                />
                                <Dato
                                    icono={<Truck className="h-5 w-5" />}
                                    titulo="Vehículo"
                                    valor={`${despacho.ruta.vehiculo} · ${despacho.ruta.modeloVehiculo}`}
                                />
                                <Dato
                                    icono={<Package className="h-5 w-5" />}
                                    titulo="Capacidad"
                                    valor={despacho.ruta.capacidadVehiculo}
                                />
                                <Link
                                    href={`/dashboard/logistica/rutas`}
                                    className="text-sm font-semibold text-[#123E70] hover:underline sm:col-span-2"
                                >
                                    Consultar hojas de ruta →
                                </Link>
                            </div>
                        ) : (
                            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                Este despacho no tiene una hoja de ruta asociada.
                            </p>
                        )}
                    </Seccion>
                </div>

                <div className="space-y-5">
                    <Seccion
                        titulo="Productos y lotes"
                        descripcion={`${totalProductos} unidades distribuidas en ${despacho.productos.length} productos.`}
                    >
                        <div className="space-y-4">
                            {despacho.productos.map((producto) => (
                                <article
                                    key={producto.id}
                                    className="rounded-xl border border-slate-200 p-4"
                                >
                                    <div className="flex flex-wrap justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {producto.nombre}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Código: {producto.codigo}
                                            </p>
                                        </div>
                                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#123E70]">
                                            × {producto.cantidad}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {producto.lotes.map((lote) => (
                                            <div
                                                key={`${producto.id}-${lote.loteId}`}
                                                className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-3"
                                            >
                                                <div>
                                                    <p className="text-slate-500">Lote</p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {lote.numero}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Cantidad</p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {lote.cantidad} unidades
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Vencimiento</p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {fecha(lote.vencimiento)}
                                                    </p>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600 ring-1 ring-slate-200">
                                                        Calidad: {lote.calidad.replaceAll("_", " ")}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </Seccion>

                    <Seccion
                        titulo="Entrega y evidencias"
                        descripcion="Confirmación de recepción y documentación."
                    >
                        <div className="space-y-3">
                            <Dato
                                icono={<Clock3 className="h-5 w-5" />}
                                titulo="Fecha de entrega"
                                valor={fechaHora(despacho.entregadoEn)}
                            />
                            <Dato
                                icono={<UserRound className="h-5 w-5" />}
                                titulo="Recibido por"
                                valor={despacho.receptor || "No registrado"}
                            />

                            {despacho.observacion && (
                                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                                    <p className="text-xs text-slate-500">Observación</p>
                                    <p className="mt-1 text-slate-800">{despacho.observacion}</p>
                                </div>
                            )}

                            {despacho.devolucionInventarioEn && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                                    <p className="font-semibold">Devolución confirmada</p>
                                    <p className="mt-1">
                                        {fechaHora(despacho.devolucionInventarioEn)}
                                    </p>
                                    {despacho.devolucionMotivo && (
                                        <p className="mt-2">{despacho.devolucionMotivo}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {despacho.evidencia && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPreview({
                                                titulo: `Fotografía del despacho #${despacho.id}`,
                                                src: `/dashboard/logistica/despachos/${despacho.id}/foto`,
                                                tipo: "image",
                                            })
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#123E70]"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        Ver fotografía
                                    </button>
                                )}

                                {despacho.estado === "ENTREGADO" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPreview({
                                                titulo: `Comprobante del despacho #${despacho.id}`,
                                                src: `/documentos/despachos/${despacho.id}`,
                                                tipo: "page",
                                            })
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Ver comprobante
                                    </button>
                                )}
                            </div>
                        </div>
                    </Seccion>
                </div>
            </div>

            <Seccion
                titulo="Historial del despacho"
                descripcion="Registro cronológico de los cambios realizados."
            >
                {despacho.historial.length ? (
                    <ol className="space-y-4">
                        {despacho.historial.map((evento) => (
                            <li key={evento.id} className="flex gap-3">
                                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#123E70]">
                                    <Clock3 className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1 border-b border-slate-100 pb-4">
                                    <p className="font-semibold text-slate-900">
                                        {evento.estadoAnterior.replaceAll("_", " ")} →{" "}
                                        {evento.estadoNuevo.replaceAll("_", " ")}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {fechaHora(evento.fecha)} · {evento.usuario}
                                    </p>
                                    {evento.observacion && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            {evento.observacion}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-sm text-slate-500">
                        Todavía no hay eventos registrados en el historial.
                    </p>
                )}
            </Seccion>

            {!despacho.gestionCompleta && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Este despacho es parcial o no tiene hoja de ruta. Las operaciones
                    físicas deben gestionarse desde su flujo específico.
                </div>
            )}

            {modal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
                    <section
                        role="dialog"
                        aria-modal="true"
                        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500">
                                    Despacho #{despacho.id}
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-[#123E70]">
                                    {modal === "INICIAR"
                                        ? "Iniciar despacho"
                                        : modal === "ENTREGAR"
                                            ? "Confirmar entrega"
                                            : modal === "REPROGRAMAR"
                                                ? "Reprogramar entrega"
                                                : "Registrar devolución"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {modal === "INICIAR" && (
                            <form action={actualizarDespacho} className="space-y-4 p-5">
                                <input
                                    type="hidden"
                                    name="returnTo"
                                    value={`/dashboard/logistica/despachos/${despacho.id}`}
                                />
                                <input type="hidden" name="id" value={despacho.id} />
                                <input type="hidden" name="estado" value="EN_RUTA" />
                                <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                                    Al confirmar, se descontarán las cantidades de sus lotes y
                                    se registrará la salida de inventario. Esta operación solo
                                    se realiza una vez.
                                </p>
                                <button className="w-full rounded-lg bg-[#123E70] px-4 py-3 text-sm font-semibold text-white">
                                    Confirmar salida
                                </button>
                            </form>
                        )}

                        {modal === "ENTREGAR" && (
                            <form action={actualizarDespacho} className="space-y-4 p-5">
                                <input
                                    type="hidden"
                                    name="returnTo"
                                    value={`/dashboard/logistica/despachos/${despacho.id}`}
                                />
                                <input type="hidden" name="id" value={despacho.id} />
                                <input type="hidden" name="estado" value="ENTREGADO" />
                                <label className="block text-sm font-semibold">
                                    Nombre de quien recibe
                                    <input
                                        required
                                        name="receptor"
                                        maxLength={120}
                                        className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal"
                                        placeholder="Nombre y apellido"
                                    />
                                </label>
                                <label className="block text-sm font-semibold">
                                    Fotografía de entrega
                                    <input
                                        required
                                        name="foto"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        capture="environment"
                                        className="mt-1 block w-full rounded-lg border p-2 text-sm font-normal"
                                    />
                                    <span className="mt-1 block text-xs font-normal text-slate-500">
                                        JPG, PNG o WEBP · máximo 3 MB.
                                    </span>
                                </label>
                                <label className="block text-sm font-semibold">
                                    Observación (opcional)
                                    <textarea
                                        name="observacion"
                                        maxLength={500}
                                        rows={3}
                                        className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                                    />
                                </label>
                                <button className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">
                                    Confirmar entrega
                                </button>
                            </form>
                        )}

                        {modal === "REPROGRAMAR" && (
                            <form action={actualizarDespacho} className="space-y-4 p-5">
                                <input
                                    type="hidden"
                                    name="returnTo"
                                    value={`/dashboard/logistica/despachos/${despacho.id}`}
                                />
                                <input type="hidden" name="id" value={despacho.id} />
                                <input type="hidden" name="estado" value="REPROGRAMADO" />
                                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                                    La salida de inventario se mantendrá registrada. Almacén
                                    deberá confirmar la devolución física antes de programar
                                    nuevamente la venta.
                                </p>
                                <label className="block text-sm font-semibold">
                                    Motivo de reprogramación
                                    <textarea
                                        required
                                        name="observacion"
                                        maxLength={500}
                                        rows={4}
                                        className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                                    />
                                </label>
                                <button className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white">
                                    Confirmar reprogramación
                                </button>
                            </form>
                        )}

                        {modal === "DEVOLVER" && (
                            <form action={recibirDevolucionDespacho} className="space-y-4 p-5">
                                <input
                                    type="hidden"
                                    name="returnTo"
                                    value={`/dashboard/logistica/despachos/${despacho.id}`}
                                />
                                <input type="hidden" name="id" value={despacho.id} />
                                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                                    Confirma únicamente después de recibir y revisar físicamente
                                    toda la mercadería.
                                </p>
                                <label className="block text-sm font-semibold">
                                    Motivo y comprobación
                                    <textarea
                                        required
                                        name="motivo"
                                        maxLength={500}
                                        rows={3}
                                        className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                                    />
                                </label>
                                <label className="flex items-start gap-2 text-sm">
                                    <input
                                        required
                                        type="checkbox"
                                        name="inspeccion"
                                        value="confirmada"
                                        className="mt-1 h-4 w-4"
                                    />
                                    Confirmo que se recibió y revisó la totalidad de la
                                    mercadería, sus lotes, cantidades, integridad y vencimiento.
                                </label>
                                <button className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white">
                                    Confirmar reintegro
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}

            <DocumentPreview
                open={preview !== null}
                onClose={() => setPreview(null)}
                title={preview?.titulo ?? ""}
                src={preview?.src ?? ""}
                type={preview?.tipo ?? "image"}
            />
        </>
    );
}
