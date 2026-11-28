"use client";

import { useMemo, useState } from "react";
import { cambiarVehiculo, guardarVehiculo } from "../actions";

type VehiculoItem = {
    id: number;
    placa: string;
    modelo: string;
    capacidad: string;
    estado: boolean;
    _count: {
        hojasDeRuta: number;
    };
};

type Filtro = "TODOS" | "DISPONIBLES" | "NO_DISPONIBLES";

export default function VehiculosClient({
    vehiculos,
    error,
}: {
    vehiculos: VehiculoItem[];
    error: string | null;
}) {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("TODOS");

    const totalVehiculos = vehiculos.length;
    const disponibles = vehiculos.filter((v) => v.estado).length;
    const noDisponibles = totalVehiculos - disponibles;
    const [errorVisible, setErrorVisible] = useState(Boolean(error));

    const vehiculosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return vehiculos.filter((vehiculo) => {
            const coincideBusqueda =
                vehiculo.placa.toLowerCase().includes(termino) ||
                vehiculo.modelo.toLowerCase().includes(termino);

            const coincideFiltro =
                filtro === "TODOS" ||
                (filtro === "DISPONIBLES" && vehiculo.estado) ||
                (filtro === "NO_DISPONIBLES" && !vehiculo.estado);

            return coincideBusqueda && coincideFiltro;
        });
    }, [vehiculos, busqueda, filtro]);

    return (
        <main className="mx-auto max-w-7xl space-y-6 pb-10">
            {/* ENCABEZADO */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Logística / Flota
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#123E70]">
                        Vehículos
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Administra los vehículos y consulta su disponibilidad para las
                        operaciones logísticas.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123E70] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d315a] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                    <span className="text-lg leading-none">+</span>
                    Registrar vehículo
                </button>
            </header>

            {/* ALERTA DE VEHÍCULO CON RUTAS ACTIVAS */}
            {errorVisible && error === "vehiculo-con-rutas-activas" && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        !
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-amber-800">
                            No se puede desactivar el vehículo
                        </h3>

                        <p className="mt-1 text-sm text-amber-700">
                            Este vehículo tiene despachos pendientes o en ruta.
                            Finaliza o reprograma las operaciones activas antes de
                            desactivarlo.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setErrorVisible(false)}
                        aria-label="Cerrar alerta"
                        className="rounded-lg px-2 py-1 text-amber-700 transition hover:bg-amber-100"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* INDICADORES */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Indicador
                    titulo="Total de vehículos"
                    valor={totalVehiculos}
                    descripcion="Vehículos registrados en la flota"
                    icono="🚚"
                />

                <Indicador
                    titulo="Disponibles"
                    valor={disponibles}
                    descripcion="Habilitados para asignar a rutas"
                    icono="✓"
                    color="green"
                />

                <Indicador
                    titulo="No disponibles"
                    valor={noDisponibles}
                    descripcion="Vehículos desactivados"
                    icono="−"
                    color="orange"
                />
            </section>

            {/* LISTADO */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Flota registrada
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Consulta y administra los vehículos de la empresa.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        {/* BUSCADOR */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                ⌕
                            </span>

                            <input
                                type="search"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar placa o modelo..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64"
                            />
                        </div>

                        {/* FILTRO */}
                        <select
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value as Filtro)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            aria-label="Filtrar vehículos por estado"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="DISPONIBLES">Disponibles</option>
                            <option value="NO_DISPONIBLES">No disponibles</option>
                        </select>
                    </div>
                </div>

                {/* TABLA */}
                {vehiculosFiltrados.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Vehículo</th>
                                        <th className="px-6 py-4 font-semibold">Placa</th>
                                        <th className="px-6 py-4 font-semibold">Capacidad</th>
                                        <th className="px-6 py-4 font-semibold">Estado</th>
                                        <th className="px-6 py-4 text-center font-semibold">
                                            Rutas asociadas
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {vehiculosFiltrados.map((vehiculo) => (
                                        <tr
                                            key={vehiculo.id}
                                            className="transition hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                                                        🚚
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {vehiculo.modelo}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            ID #{vehiculo.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold tracking-wide text-slate-700">
                                                    {vehiculo.placa}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {vehiculo.capacidad}
                                            </td>

                                            <td className="px-6 py-4">
                                                {vehiculo.estado ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                        Disponible
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                        No disponible
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="font-semibold text-slate-700">
                                                    {vehiculo._count.hojasDeRuta}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex justify-end">
                                                    <form action={cambiarVehiculo}>
                                                        <input
                                                            type="hidden"
                                                            name="id"
                                                            value={vehiculo.id}
                                                        />

                                                        <button
                                                            type="submit"
                                                            className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${vehiculo.estado
                                                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                                                : "border-green-200 text-green-700 hover:bg-green-50"
                                                                }`}
                                                        >
                                                            {vehiculo.estado ? "Desactivar" : "Activar"}
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                Mostrando {vehiculosFiltrados.length} de {totalVehiculos}{" "}
                                vehículos.
                            </p>
                            <p>Información actual de la flota.</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                            🚚
                        </div>

                        <h3 className="font-semibold text-slate-800">
                            {vehiculos.length === 0
                                ? "Todavía no hay vehículos registrados"
                                : "No se encontraron vehículos"}
                        </h3>

                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {vehiculos.length === 0
                                ? "Registra el primer vehículo para comenzar a administrar tu flota."
                                : "Prueba con otra búsqueda o cambia el filtro seleccionado."}
                        </p>

                        {vehiculos.length === 0 && (
                            <button
                                type="button"
                                onClick={() => setModalAbierto(true)}
                                className="mt-5 rounded-xl bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d315a]"
                            >
                                Registrar primer vehículo
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* MODAL DE REGISTRO */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar modal"
                        onClick={() => setModalAbierto(false)}
                        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
                    />

                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-vehiculo-titulo"
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        {/* CABECERA DEL MODAL */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2
                                    id="modal-vehiculo-titulo"
                                    className="text-xl font-bold text-[#123E70]"
                                >
                                    Registrar vehículo
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Completa los datos para agregar un vehículo a la flota.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                aria-label="Cerrar"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* FORMULARIO */}
                        <form action={guardarVehiculo}>
                            <div className="space-y-5 px-6 py-6">
                                <div>
                                    <label
                                        htmlFor="placa"
                                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                                    >
                                        Placa
                                    </label>

                                    <input
                                        id="placa"
                                        name="placa"
                                        required
                                        maxLength={12}
                                        placeholder="Ej. ABC-123"
                                        autoComplete="off"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Ingresa la placa de identificación del vehículo.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="modelo"
                                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                                    >
                                        Modelo del vehículo
                                    </label>

                                    <input
                                        id="modelo"
                                        name="modelo"
                                        required
                                        maxLength={100}
                                        placeholder="Ej. Renault Kangoo"
                                        autoComplete="off"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="capacidad"
                                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                                    >
                                        Capacidad
                                    </label>

                                    <input
                                        id="capacidad"
                                        name="capacidad"
                                        required
                                        maxLength={80}
                                        placeholder="Ej. 800 kg"
                                        autoComplete="off"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Especifica la capacidad de carga del vehículo.
                                    </p>
                                </div>
                            </div>

                            {/* ACCIONES */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-xl bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d315a]"
                                >
                                    Registrar vehículo
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}

/* INDICADOR REUTILIZABLE */
function Indicador({
    titulo,
    valor,
    descripcion,
    icono,
    color = "blue",
}: {
    titulo: string;
    valor: number;
    descripcion: string;
    icono: string;
    color?: "blue" | "green" | "orange";
}) {
    const colores = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        orange: "bg-orange-50 text-orange-700",
    };

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{titulo}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                        {valor}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold ${colores[color]}`}
                >
                    {icono}
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">{descripcion}</p>
        </article>
    );
}