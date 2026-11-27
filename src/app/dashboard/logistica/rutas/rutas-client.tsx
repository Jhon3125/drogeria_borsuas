
"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Package,
    Plus,
    RotateCcw,
    Search,
    Truck,
    UserRound,
} from "lucide-react";

import { crearRuta } from "../actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type EstadoDespacho =
    | "PENDIENTE"
    | "EN_RUTA"
    | "ENTREGADO"
    | "REPROGRAMADO";

type VentaOption = {
    id: number;
    cliente: string;
    moneda: string;
    importeTotal: string;
};

type RutaItem = {
    id: number;
    fecha: string;
    conductor: string;
    placa: string;
    despachos: {
        id: number;
        ventaId: number;
        cliente: string;
        estado: EstadoDespacho;
        moneda: string;
        importeTotal: string;
    }[];
};

type Props = {
    rutas: RutaItem[];
    conductores: { id: number; nombre: string }[];
    vehiculos: { id: number; placa: string; modelo: string }[];
    ventas: VentaOption[];
    puedeCrear: boolean;
    fechaInicial: string;
    preseleccionada: number | null;
};

const ESTADOS = {
    PROGRAMADA: {
        label: "Programada",
        className: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    EN_CURSO: {
        label: "En curso",
        className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    ENTREGADA: {
        label: "Entregada",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    REPROGRAMADA: {
        label: "Reprogramada",
        className: "bg-violet-50 text-violet-700 ring-violet-200",
    },
    MIXTA: {
        label: "Mixta",
        className: "bg-slate-100 text-slate-700 ring-slate-200",
    },
    SIN_PEDIDOS: {
        label: "Sin pedidos",
        className: "bg-slate-100 text-slate-600 ring-slate-200",
    },
} as const;

type EstadoRuta = keyof typeof ESTADOS;

function estadoRuta(ruta: RutaItem): EstadoRuta {
    const estados = ruta.despachos.map((d) => d.estado);

    if (!estados.length) return "SIN_PEDIDOS";
    if (estados.includes("EN_RUTA")) return "EN_CURSO";
    if (estados.every((e) => e === "ENTREGADO")) return "ENTREGADA";
    if (estados.every((e) => e === "REPROGRAMADO")) return "REPROGRAMADA";
    if (estados.includes("PENDIENTE")) return "PROGRAMADA";

    return "MIXTA";
}

function fechaTexto(fecha: string) {
    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(fecha));
}

function monedaTexto(moneda: string, importe: string) {
    try {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: moneda || "PEN",
        }).format(Number(importe));
    } catch {
        return `${moneda} ${Number(importe).toFixed(2)}`;
    }
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={disabled || pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#123E70] px-5 text-sm font-semibold text-white transition hover:bg-[#0D315B] disabled:cursor-not-allowed disabled:opacity-50"
        >
            {pending ? "Programando..." : "Crear y programar ruta"}
        </button>
    );
}

function Metric({
    title,
    value,
    description,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    description: string;
    icon: typeof Truck;
    color: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-1 ${color}`} />
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-[#123E70]">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-[#123E70]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export function RutasClient({
    rutas,
    conductores,
    vehiculos,
    ventas,
    puedeCrear,
    fechaInicial,
    preseleccionada,
}: Props) {
    const [modalAbierto, setModalAbierto] = useState(
        Boolean(puedeCrear && preseleccionada)
    );
    const [rutaSeleccionada, setRutaSeleccionada] =
        useState<RutaItem | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");
    const [filtroFecha, setFiltroFecha] = useState("");

    const [busquedaVenta, setBusquedaVenta] = useState("");
    const [ventasSeleccionadas, setVentasSeleccionadas] = useState<number[]>(
        preseleccionada && ventas.some((venta) => venta.id === preseleccionada)
            ? [preseleccionada]
            : []
    );

    const metricas = useMemo(() => {
        const despachos = rutas.flatMap((ruta) => ruta.despachos);

        return {
            pendientes: despachos.filter((d) => d.estado === "PENDIENTE").length,
            enRuta: despachos.filter((d) => d.estado === "EN_RUTA").length,
            entregados: despachos.filter((d) => d.estado === "ENTREGADO").length,
            reprogramados: despachos.filter((d) => d.estado === "REPROGRAMADO").length,
        };
    }, [rutas]);

    const rutasFiltradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return rutas.filter((ruta) => {
            const estado = estadoRuta(ruta);
            const coincideEstado =
                filtroEstado === "TODOS" || estado === filtroEstado;

            const coincideFecha =
                !filtroFecha || ruta.fecha.slice(0, 10) === filtroFecha;

            const textoRuta = [
                String(ruta.id),
                ruta.conductor,
                ruta.placa,
                ...ruta.despachos.flatMap((d) => [
                    String(d.ventaId),
                    d.cliente,
                ]),
            ]
                .join(" ")
                .toLowerCase();

            return (
                coincideEstado &&
                coincideFecha &&
                (!termino || textoRuta.includes(termino))
            );
        });
    }, [rutas, busqueda, filtroEstado, filtroFecha]);

    const ventasFiltradas = useMemo(() => {
        const termino = busquedaVenta.trim().toLowerCase();

        return ventas.filter((venta) =>
            `${venta.id} ${venta.cliente}`.toLowerCase().includes(termino)
        );
    }, [ventas, busquedaVenta]);

    const ventasImportesSeleccionadas = ventas.filter((venta) =>
        ventasSeleccionadas.includes(venta.id)
    );

    const totalSeleccionado = ventasImportesSeleccionadas.reduce(
        (total, venta) => total + Number(venta.importeTotal),
        0
    );

    const monedasSeleccionadas = new Set(
        ventasImportesSeleccionadas.map((venta) => venta.moneda)
    );

    const monedaSeleccionada = [...monedasSeleccionadas][0] ?? "PEN";
    const monedaUnica = monedasSeleccionadas.size <= 1;

    function alternarVenta(id: number) {
        setVentasSeleccionadas((actuales) =>
            actuales.includes(id)
                ? actuales.filter((ventaId) => ventaId !== id)
                : [...actuales, id]
        );
    }

    function alternarTodasLasVisibles() {
        const idsVisibles = ventasFiltradas.map((venta) => venta.id);
        const todasSeleccionadas =
            idsVisibles.length > 0 &&
            idsVisibles.every((id) => ventasSeleccionadas.includes(id));

        setVentasSeleccionadas((actuales) =>
            todasSeleccionadas
                ? actuales.filter((id) => !idsVisibles.includes(id))
                : [...new Set([...actuales, ...idsVisibles])]
        );
    }

    return (
        <main className="mx-auto max-w-[1500px] space-y-6 pb-8">
            {/* Encabezado */}
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm text-slate-500">Logística / Programación</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#123E70]">
                        Hojas de ruta
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Planifica y administra las entregas de tus pedidos.
                    </p>
                </div>

                {puedeCrear && (
                    <button
                        type="button"
                        onClick={() => setModalAbierto(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#123E70] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D315B]"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva hoja de ruta
                    </button>
                )}
            </header>

            {/* Indicadores */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                    title="Pedidos pendientes"
                    value={metricas.pendientes}
                    description="Esperando salida a ruta"
                    icon={Clock3}
                    color="bg-blue-500"
                />
                <Metric
                    title="En ruta"
                    value={metricas.enRuta}
                    description="Pedidos en distribución"
                    icon={Truck}
                    color="bg-amber-500"
                />
                <Metric
                    title="Entregados"
                    value={metricas.entregados}
                    description="Entregas completadas"
                    icon={CheckCircle2}
                    color="bg-emerald-500"
                />
                <Metric
                    title="Reprogramados"
                    value={metricas.reprogramados}
                    description="Pendientes de nueva programación"
                    icon={RotateCcw}
                    color="bg-violet-500"
                />
            </section>

            {/* Listado */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Rutas registradas
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Consulta las rutas y el progreso de sus entregas.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar ruta, cliente..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <input
                            type="date"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            aria-label="Filtrar por fecha"
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />

                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            aria-label="Filtrar por estado"
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="PROGRAMADA">Programadas</option>
                            <option value="EN_CURSO">En curso</option>
                            <option value="ENTREGADA">Entregadas</option>
                            <option value="REPROGRAMADA">Reprogramadas</option>
                            <option value="MIXTA">Mixtas</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Ruta</th>
                                <th className="px-5 py-4 font-semibold">Fecha</th>
                                <th className="px-5 py-4 font-semibold">Conductor</th>
                                <th className="px-5 py-4 font-semibold">Vehículo</th>
                                <th className="px-5 py-4 font-semibold">Pedidos</th>
                                <th className="px-5 py-4 font-semibold">Progreso</th>
                                <th className="px-5 py-4 font-semibold">Estado</th>
                                <th className="px-5 py-4 text-right font-semibold">Acción</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {rutasFiltradas.map((ruta) => {
                                const estado = estadoRuta(ruta);
                                const entregados = ruta.despachos.filter(
                                    (d) => d.estado === "ENTREGADO"
                                ).length;
                                const total = ruta.despachos.length;
                                const progreso = total
                                    ? Math.round((entregados / total) * 100)
                                    : 0;

                                return (
                                    <tr
                                        key={ruta.id}
                                        className="transition-colors hover:bg-slate-50/80"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-[#123E70]">
                                                Ruta #{ruta.id}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                                            {fechaTexto(ruta.fecha)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <UserRound className="h-4 w-4 text-slate-400" />
                                                <span className="text-slate-700">
                                                    {ruta.conductor}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">
                                                    {ruta.placa}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-medium text-slate-700">
                                            {total}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="w-32">
                                                <div className="mb-1 flex justify-between text-xs">
                                                    <span className="text-slate-500">
                                                        {entregados}/{total} entregados
                                                    </span>
                                                    <span className="font-semibold text-slate-700">
                                                        {progreso}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                                        style={{ width: `${progreso}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ESTADOS[estado].className}`}
                                            >
                                                {ESTADOS[estado].label}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setRutaSeleccionada(ruta)}
                                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#123E70] transition hover:border-blue-300 hover:bg-blue-50"
                                            >
                                                Ver detalle
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!rutasFiltradas.length && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="mx-auto flex max-w-sm flex-col items-center">
                                            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                                                <Package className="h-7 w-7" />
                                            </div>
                                            <p className="mt-3 font-semibold text-slate-800">
                                                No se encontraron rutas
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Prueba cambiando los filtros o registra una nueva hoja
                                                de ruta.
                                            </p>
                                            {(busqueda || filtroFecha || filtroEstado !== "TODOS") && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBusqueda("");
                                                        setFiltroFecha("");
                                                        setFiltroEstado("TODOS");
                                                    }}
                                                    className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
                                                >
                                                    Limpiar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                    Mostrando {rutasFiltradas.length} de {rutas.length} rutas recientes.
                </div>
            </section>

            {/* Modal de creación */}
            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#123E70]">
                            Nueva hoja de ruta
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona la fecha, los recursos y los pedidos que formarán
                            parte de esta ruta.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={crearRuta} className="space-y-6">
                        {/* Programación */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-[#123E70]" />
                                <h3 className="font-semibold text-slate-900">
                                    1. Programación
                                </h3>
                            </div>

                            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                                Fecha de ruta
                                <input
                                    name="fecha"
                                    type="date"
                                    required
                                    defaultValue={fechaInicial}
                                    className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </section>

                        {/* Recursos */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-[#123E70]" />
                                <h3 className="font-semibold text-slate-900">
                                    2. Asignación de recursos
                                </h3>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                                    Conductor
                                    <select
                                        name="conductorId"
                                        required
                                        defaultValue=""
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="" disabled>
                                            Seleccionar conductor
                                        </option>
                                        {conductores.map((conductor) => (
                                            <option key={conductor.id} value={conductor.id}>
                                                {conductor.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                                    Vehículo
                                    <select
                                        name="vehiculoId"
                                        required
                                        defaultValue=""
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="" disabled>
                                            Seleccionar vehículo
                                        </option>
                                        {vehiculos.map((vehiculo) => (
                                            <option key={vehiculo.id} value={vehiculo.id}>
                                                {vehiculo.placa} · {vehiculo.modelo}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {(!conductores.length || !vehiculos.length) && (
                                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                    Para programar una ruta necesitas al menos un conductor
                                    activo y un vehículo disponible.
                                </p>
                            )}
                        </section>

                        {/* Pedidos */}
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-[#123E70]" />
                                    <h3 className="font-semibold text-slate-900">
                                        3. Pedidos disponibles
                                    </h3>
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                        {ventasSeleccionadas.length} seleccionados
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={alternarTodasLasVisibles}
                                    disabled={!ventasFiltradas.length}
                                    className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-40"
                                >
                                    {ventasFiltradas.length > 0 &&
                                        ventasFiltradas.every((v) =>
                                            ventasSeleccionadas.includes(v.id)
                                        )
                                        ? "Quitar selección"
                                        : "Seleccionar visibles"}
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={busquedaVenta}
                                    onChange={(e) => setBusquedaVenta(e.target.value)}
                                    placeholder="Buscar por número de venta o cliente..."
                                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                                {ventasFiltradas.map((venta) => (
                                    <label
                                        key={venta.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${ventasSeleccionadas.includes(venta.id)
                                            ? "border-blue-300 bg-blue-50/70"
                                            : "border-transparent hover:bg-slate-50"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            name="ventaIds"
                                            value={venta.id}
                                            checked={ventasSeleccionadas.includes(venta.id)}
                                            onChange={() => alternarVenta(venta.id)}
                                            className="h-4 w-4 accent-[#123E70]"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800">
                                                Venta #{venta.id}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {venta.cliente}
                                            </p>
                                        </div>

                                        <span className="text-sm font-semibold text-slate-700">
                                            {monedaTexto(venta.moneda, venta.importeTotal)}
                                        </span>
                                    </label>
                                ))}

                                {!ventasFiltradas.length && (
                                    <div className="px-3 py-8 text-center">
                                        <Package className="mx-auto h-6 w-6 text-slate-300" />
                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                            No hay pedidos disponibles
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Verifica que las ventas estén pagadas, preparadas y
                                            tengan sus lotes asignados.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Total de pedidos seleccionados
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        {ventasSeleccionadas.length}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">
                                        Importe referencial
                                    </p>
                                    <p className="font-bold text-[#123E70]">
                                        {monedaUnica
                                            ? monedaTexto(monedaSeleccionada, String(totalSeleccionado))
                                            : "Montos en distintas monedas"}
                                    </p>
                                </div>
                            </div>

                            {ventasSeleccionadas.length > 50 && (
                                <p className="text-xs text-red-600">
                                    Puedes seleccionar como máximo 50 pedidos por ruta.
                                </p>
                            )}
                        </section>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <SubmitButton
                                disabled={
                                    ventasSeleccionadas.length === 0 ||
                                    ventasSeleccionadas.length > 50 ||
                                    !conductores.length ||
                                    !vehiculos.length
                                }
                            />
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Drawer de detalle */}
            <Dialog
                open={Boolean(rutaSeleccionada)}
                onOpenChange={(open) => {
                    if (!open) setRutaSeleccionada(null);
                }}
            >
                <DialogContent className="fixed inset-y-0 right-0 left-auto top-0 h-dvh w-[min(560px,100vw)] max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-l-2xl rounded-r-none p-0 sm:max-w-none">
                    {rutaSeleccionada && (
                        <>
                            <div className="border-b border-slate-200 p-6 pr-14">
                                <p className="text-sm text-slate-500">
                                    Logística / Hojas de ruta
                                </p>
                                <DialogHeader className="mt-1">
                                    <DialogTitle className="text-2xl font-bold text-[#123E70]">
                                        Ruta #{rutaSeleccionada.id}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Consulta la programación y los pedidos asociados.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="mt-4">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ESTADOS[estadoRuta(rutaSeleccionada)].className
                                            }`}
                                    >
                                        {ESTADOS[estadoRuta(rutaSeleccionada)].label}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 p-6">
                                <section className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <CalendarDays className="h-5 w-5 text-slate-400" />
                                        <p className="mt-3 text-xs text-slate-500">
                                            Fecha programada
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-800">
                                            {fechaTexto(rutaSeleccionada.fecha)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <Truck className="h-5 w-5 text-slate-400" />
                                        <p className="mt-3 text-xs text-slate-500">Vehículo</p>
                                        <p className="mt-1 font-semibold text-slate-800">
                                            {rutaSeleccionada.placa}
                                        </p>
                                    </div>

                                    <div className="col-span-2 rounded-xl bg-slate-50 p-4">
                                        <UserRound className="h-5 w-5 text-slate-400" />
                                        <p className="mt-3 text-xs text-slate-500">Conductor</p>
                                        <p className="mt-1 font-semibold text-slate-800">
                                            {rutaSeleccionada.conductor}
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">
                                            Pedidos de la ruta
                                        </h3>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                            {rutaSeleccionada.despachos.length} pedidos
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {rutaSeleccionada.despachos.map((despacho) => (
                                            <div
                                                key={despacho.id}
                                                className="rounded-xl border border-slate-200 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[#123E70]">
                                                            Venta #{despacho.ventaId}
                                                        </p>
                                                        <p className="mt-1 truncate text-sm text-slate-600">
                                                            {despacho.cliente}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${despacho.estado === "ENTREGADO"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : despacho.estado === "EN_RUTA"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : despacho.estado === "REPROGRAMADO"
                                                                    ? "bg-violet-50 text-violet-700"
                                                                    : "bg-blue-50 text-blue-700"
                                                            }`}
                                                    >
                                                        {despacho.estado.replaceAll("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                                                    <span className="text-slate-500">Importe: </span>
                                                    <span className="font-semibold text-slate-800">
                                                        {monedaTexto(
                                                            despacho.moneda,
                                                            despacho.importeTotal
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <p className="text-sm font-semibold text-blue-900">
                                        Gestión de despachos
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-blue-800">
                                        Para actualizar el estado de los pedidos, registrar
                                        entregas o gestionar reprogramaciones, ingresa al módulo
                                        de Despachos.
                                    </p>
                                    <Link
                                        href="/dashboard/logistica/despachos"
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:underline"
                                    >
                                        Ir a Despachos
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}
