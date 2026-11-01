
"use client";

import { useEffect, useMemo, useState } from "react";
import { FormularioProveedor } from "./form";
import { cambiarEstadoProveedor } from "./actions";
import Link from "next/link";

type Proveedor = {
    id: number;
    razonSocial: string;
    ruc: string;
    contacto: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    estado: boolean;
    _count: {
        compras: number;
    };
};

type Props = {
    proveedores: Proveedor[];
    puedeGestionar: boolean;
};

type FiltroEstado = "TODOS" | "ACTIVOS" | "INACTIVOS";

export function DirectorioProveedores({
    proveedores,
    puedeGestionar,
}: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] =
        useState<FiltroEstado>("TODOS");

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [proveedorEditar, setProveedorEditar] =
        useState<Proveedor | null>(null);

    const total = proveedores.length;

    const activos = proveedores.filter(
        (proveedor) => proveedor.estado
    ).length;

    const inactivos = total - activos;

    const compras = proveedores.reduce(
        (acumulado, proveedor) =>
            acumulado + proveedor._count.compras,
        0
    );

    const proveedoresFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return proveedores.filter((proveedor) => {
            const coincideBusqueda =
                !termino ||
                proveedor.razonSocial.toLowerCase().includes(termino) ||
                proveedor.ruc.includes(termino) ||
                (proveedor.contacto ?? "")
                    .toLowerCase()
                    .includes(termino) ||
                (proveedor.correo ?? "")
                    .toLowerCase()
                    .includes(termino) ||
                (proveedor.telefono ?? "").includes(termino);

            const coincideEstado =
                filtroEstado === "TODOS" ||
                (filtroEstado === "ACTIVOS" && proveedor.estado) ||
                (filtroEstado === "INACTIVOS" && !proveedor.estado);

            return coincideBusqueda && coincideEstado;
        });
    }, [proveedores, busqueda, filtroEstado]);

    function abrirNuevo() {
        setProveedorEditar(null);
        setMostrarFormulario(true);
    }

    function abrirEdicion(proveedor: Proveedor) {
        setProveedorEditar(proveedor);
        setMostrarFormulario(true);
    }

    function cerrarFormulario() {
        setProveedorEditar(null);
        setMostrarFormulario(false);
    }


    useEffect(() => {
        if (!mostrarFormulario) return;

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function manejarEscape(evento: KeyboardEvent) {
            if (evento.key === "Escape") {
                cerrarFormulario();
            }
        }

        document.addEventListener("keydown", manejarEscape);

        return () => {
            document.body.style.overflow = overflowAnterior;
            document.removeEventListener("keydown", manejarEscape);
        };
    }, [mostrarFormulario]);


    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#123E70]">
                        Proveedores
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Administración y seguimiento de proveedores
                        de Droguería Borsuas.
                    </p>
                </div>

                {puedeGestionar && (
                    <button
                        type="button"
                        onClick={abrirNuevo}
                        className="rounded-lg bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087EBD]"
                    >
                        + Nuevo proveedor
                    </button>
                )}
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <TarjetaIndicador
                    titulo="Total de proveedores"
                    valor={total}
                    detalle="Registrados"
                    color="azul"
                />

                <TarjetaIndicador
                    titulo="Proveedores activos"
                    valor={activos}
                    detalle="Disponibles para compras"
                    color="verde"
                />

                <TarjetaIndicador
                    titulo="Proveedores inactivos"
                    valor={inactivos}
                    detalle="Deshabilitados"
                    color="gris"
                />

                <TarjetaIndicador
                    titulo="Órdenes de compra"
                    valor={compras}
                    detalle="Total de OC vinculadas"
                    color="celeste"
                />
            </div>

            {/* Formulario de registro / edición */}

            {/* Modal de registro y edición */}
            {mostrarFormulario && puedeGestionar && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) {
                            cerrarFormulario();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-proveedor-titulo"
                        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2
                                    id="modal-proveedor-titulo"
                                    className="text-lg font-bold text-[#123E70]"
                                >
                                    {proveedorEditar
                                        ? "Editar proveedor"
                                        : "Nuevo proveedor"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {proveedorEditar
                                        ? "Modifica la información del proveedor."
                                        : "Registra una nueva empresa proveedora."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarFormulario}
                                aria-label="Cerrar modal"
                                className="rounded-lg p-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            >
                                ×
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 sm:p-5">
                            <FormularioProveedor
                                key={proveedorEditar?.id ?? "nuevo"}
                                proveedor={proveedorEditar ?? undefined}
                                onCancelar={cerrarFormulario}
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Directorio */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#123E70]">
                                Directorio de proveedores
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Consulta los datos y el estado de cada
                                proveedor registrado.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                            <div className="w-full sm:w-72">
                                <label
                                    htmlFor="buscar-proveedor"
                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                >
                                    Buscar proveedor
                                </label>

                                <input
                                    id="buscar-proveedor"
                                    type="search"
                                    value={busqueda}
                                    onChange={(evento) =>
                                        setBusqueda(evento.target.value)
                                    }
                                    placeholder="Razón social, RUC, contacto..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="w-full sm:w-44">
                                <label
                                    htmlFor="estado-proveedor"
                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                >
                                    Estado
                                </label>

                                <select
                                    id="estado-proveedor"
                                    value={filtroEstado}
                                    onChange={(evento) =>
                                        setFiltroEstado(
                                            evento.target.value as FiltroEstado
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#087EBD]"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="ACTIVOS">Activos</option>
                                    <option value="INACTIVOS">Inactivos</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <p className="text-sm text-slate-600">
                        Mostrando{" "}
                        <span className="font-bold text-[#123E70]">
                            {proveedoresFiltrados.length}
                        </span>{" "}
                        de {total} proveedores
                    </p>

                    {(busqueda || filtroEstado !== "TODOS") && (
                        <button
                            type="button"
                            onClick={() => {
                                setBusqueda("");
                                setFiltroEstado("TODOS");
                            }}
                            className="text-sm font-medium text-[#087EBD] hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">
                                    Proveedor
                                </th>
                                <th className="px-4 py-4 font-semibold">
                                    Contacto
                                </th>
                                <th className="px-4 py-4 text-center font-semibold">
                                    Compras
                                </th>
                                <th className="px-4 py-4 text-center font-semibold">
                                    Estado
                                </th>
                                {puedeGestionar && (
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {proveedoresFiltrados.map((proveedor) => (
                                <tr
                                    key={proveedor.id}
                                    className="transition hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-slate-800">
                                            {proveedor.razonSocial}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            RUC: {proveedor.ruc}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <p className="font-medium text-slate-700">
                                                {proveedor.contacto || "Sin contacto"}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {proveedor.telefono || "Sin teléfono"}
                                            </p>

                                            {proveedor.correo && (
                                                <p className="max-w-[230px] truncate text-xs text-slate-500">
                                                    {proveedor.correo}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex min-w-9 justify-center rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#123E70]">
                                            {proveedor._count.compras}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        {proveedor.estado ? (
                                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#238B55]">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>

                                    {puedeGestionar && (
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        abrirEdicion(proveedor)
                                                    }
                                                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#087EBD] hover:bg-blue-50"
                                                >
                                                    Editar
                                                </button>

                                                <form
                                                    action={cambiarEstadoProveedor}
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="id"
                                                        value={proveedor.id}
                                                    />

                                                    <button
                                                        type="submit"
                                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${proveedor.estado
                                                            ? "border-red-200 text-red-700 hover:bg-red-50"
                                                            : "border-green-200 text-[#238B55] hover:bg-green-50"
                                                            }`}
                                                    >
                                                        {proveedor.estado
                                                            ? "Desactivar"
                                                            : "Activar"}
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/proveedores/${proveedor.id}`}
                                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#123E70] hover:bg-slate-50"
                                                    >
                                                        Ver detalle
                                                    </Link>
                                                </form>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {proveedoresFiltrados.length === 0 && (
                    <div className="px-5 py-14 text-center">
                        <p className="font-semibold text-slate-700">
                            No se encontraron proveedores
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Prueba con otro término o cambia los filtros.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

type TarjetaIndicadorProps = {
    titulo: string;
    valor: number;
    detalle: string;
    color: "azul" | "verde" | "gris" | "celeste";
};

function TarjetaIndicador({
    titulo,
    valor,
    detalle,
    color,
}: TarjetaIndicadorProps) {
    const colores = {
        azul: "text-[#123E70]",
        verde: "text-[#238B55]",
        gris: "text-slate-600",
        celeste: "text-[#087EBD]",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                {titulo}
            </p>

            <p
                className={`mt-3 text-3xl font-bold ${colores[color]}`}
            >
                {valor.toLocaleString("es-PE")}
            </p>

            <p className="mt-2 text-xs text-slate-500">
                {detalle}
            </p>
        </div>
    );
}
