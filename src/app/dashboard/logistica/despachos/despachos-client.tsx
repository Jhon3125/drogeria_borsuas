"use client";

import { useMemo, useState, type ReactNode } from "react";
import DocumentPreview from "@/components/shared/document-preview";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { actualizarDespacho, recibirDevolucionDespacho } from "../actions";

type EstadoDespacho = "PENDIENTE" | "EN_RUTA" | "ENTREGADO" | "REPROGRAMADO" | string;

type DespachoListado = {
  id: number;
  ventaId: number;
  estado: EstadoDespacho;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaRuta: string | null;
  importeTotal: number;
  moneda: string;
  cliente: string;
  direccion: string | null;
  rutaId: number | null;
  conductor: string | null;
  vehiculo: string | null;
  productos: { id: number; nombre: string; cantidad: number }[];
  detallesCount: number;
  gestionCompleta: boolean;
  salidaInventarioEn: string | null;
  entregadoEn: string | null;
  receptor: string | null;
  observacion: string | null;
  devolucionInventarioEn: string | null;
  devolucionMotivo: string | null;
  evidencia: boolean;
};

type Resumen = {
  pendientes: number;
  enRuta: number;
  entregados: number;
  reprogramados: number;
};

type ModalAccion = "INICIAR" | "ENTREGAR" | "REPROGRAMAR" | "DEVOLVER" | null;

type TipoPreview = {
  titulo: string;
  src: string;
  tipo: "image" | "page";
};

const estadoConfig: Record<string, { label: string; clase: string }> = {
  PENDIENTE: { label: "Pendiente", clase: "bg-blue-50 text-blue-700 ring-blue-200" },
  EN_RUTA: { label: "En ruta", clase: "bg-sky-50 text-sky-700 ring-sky-200" },
  ENTREGADO: { label: "Entregado", clase: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REPROGRAMADO: { label: "Reprogramado", clase: "bg-amber-50 text-amber-800 ring-amber-200" },
};

function fechaLima(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

function fechaHoraLima(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function fechaFiltroLima(valor: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date(valor));
}

function importe(valor: number, moneda: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda || "PEN",
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    return `${moneda || "PEN"} ${valor.toFixed(2)}`;
  }
}

function BadgeEstado({ estado }: { estado: string }) {
  const config = estadoConfig[estado] ?? {
    label: estado.replaceAll("_", " "),
    clase: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.clase}`}>
      {config.label}
    </span>
  );
}

function BotonAccion({
  children,
  onClick,
  tono = "azul",
}: {
  children: ReactNode;
  onClick: () => void;
  tono?: "azul" | "verde" | "ambar";
}) {
  const tonos = {
    azul: "border-blue-200 bg-blue-50 text-[#123E70] hover:bg-blue-100",
    verde: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    ambar: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  };
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${tonos[tono]}`}>
      {children}
    </button>
  );
}

export default function DespachosClient({
  despachos,
  resumen,
}: {
  despachos: DespachoListado[];
  resumen: Resumen;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [detalle, setDetalle] = useState<DespachoListado | null>(null);
  const [seleccionado, setSeleccionado] = useState<DespachoListado | null>(null);
  const [modal, setModal] = useState<ModalAccion>(null);
  const [preview, setPreview] = useState<TipoPreview | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es-PE");
    return despachos.filter((d) => {
      const coincideTexto = !q || [
        String(d.id),
        String(d.ventaId),
        d.cliente,
        d.conductor ?? "",
        d.vehiculo ?? "",
      ].some((v) => v.toLocaleLowerCase("es-PE").includes(q));
      const coincideEstado = estadoFiltro === "TODOS" || d.estado === estadoFiltro;
      const fechaBase = d.fechaRuta ?? d.fechaCreacion;
      const coincideFecha = !fechaFiltro || fechaFiltroLima(fechaBase) === fechaFiltro;
      return coincideTexto && coincideEstado && coincideFecha;
    });
  }, [despachos, busqueda, estadoFiltro, fechaFiltro]);

  function abrirModal(accion: Exclude<ModalAccion, null>, despacho: DespachoListado) {
    setSeleccionado(despacho);
    setDetalle(null);
    setModal(accion);
  }

  function cerrarModal() {
    setModal(null);
    setSeleccionado(null);
  }

  function acciones(d: DespachoListado) {
    if (!d.gestionCompleta) return null;
    if (d.estado === "PENDIENTE") {
      return <BotonAccion onClick={() => abrirModal("INICIAR", d)}><ArrowDownToLine className="h-3.5 w-3.5" /> Iniciar salida</BotonAccion>;
    }
    if (d.estado === "EN_RUTA") {
      return (
        <div className="flex flex-wrap gap-2">
          <BotonAccion tono="verde" onClick={() => abrirModal("ENTREGAR", d)}><CheckCircle2 className="h-3.5 w-3.5" /> Entregar</BotonAccion>
          <BotonAccion tono="ambar" onClick={() => abrirModal("REPROGRAMAR", d)}><RefreshCw className="h-3.5 w-3.5" /> Reprogramar</BotonAccion>
        </div>
      );
    }
    if (d.estado === "REPROGRAMADO" && d.salidaInventarioEn && !d.devolucionInventarioEn) {
      return <BotonAccion tono="ambar" onClick={() => abrirModal("DEVOLVER", d)}><Package className="h-3.5 w-3.5" /> Registrar devolución</BotonAccion>;
    }
    return null;
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">Logística / Entregas</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#123E70]">Despachos</h1>
          <p className="mt-1 text-sm text-slate-500">Supervisa las entregas, controla sus estados y consulta la trazabilidad de cada pedido.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/logistica/panel" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Panel logístico <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/logistica/movimientos" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Salidas por lote <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="Pendientes" valor={resumen.pendientes} nota="Esperando salida a ruta" icono={<Clock3 className="h-5 w-5" />} color="border-t-blue-500" />
        <Kpi titulo="En ruta" valor={resumen.enRuta} nota="Pedidos en distribución" icono={<Truck className="h-5 w-5" />} color="border-t-sky-500" />
        <Kpi titulo="Entregados" valor={resumen.entregados} nota="Entregas completadas" icono={<CheckCircle2 className="h-5 w-5" />} color="border-t-emerald-500" />
        <Kpi titulo="Reprogramados" valor={resumen.reprogramados} nota="Pendientes de nueva programación" icono={<RefreshCw className="h-5 w-5" />} color="border-t-amber-500" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registro de despachos</h2>
            <p className="mt-1 text-sm text-slate-500">Consulta y administra los despachos registrados.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:flex">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar despacho, venta o cliente..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:w-72" />
            </label>
            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-label="Filtrar por fecha de ruta" />
            </label>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-label="Filtrar por estado">
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EN_RUTA">En ruta</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="REPROGRAMADO">Reprogramados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Despacho / venta</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Conductor / vehículo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((d) => (
                <tr key={d.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#123E70]">Despacho #{d.id}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Venta #{d.ventaId}{d.rutaId ? ` · Ruta #${d.rutaId}` : " · Sin ruta"}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-4">
                    <p className="truncate font-semibold text-slate-800">{d.cliente}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{d.direccion || "Sin dirección registrada"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="flex items-center gap-1.5 text-slate-700"><UserRound className="h-3.5 w-3.5 text-slate-400" />{d.conductor || "Sin asignar"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Truck className="h-3.5 w-3.5 text-slate-400" />{d.vehiculo || "Sin vehículo"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{fechaLima(d.fechaRuta ?? d.fechaCreacion)}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-slate-800">{importe(d.importeTotal, d.moneda)}</td>
                  <td className="px-4 py-4"><BadgeEstado estado={d.estado} /></td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/logistica/despachos/${d.id}`}
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#123E70] hover:bg-blue-50"
                    >
                      Ver despacho <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!filtrados.length && (
                <tr><td colSpan={7} className="px-6 py-14 text-center">
                  <Package className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">No se encontraron despachos</p>
                  <p className="mt-1 text-sm text-slate-500">Prueba cambiando los filtros o el término de búsqueda.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {filtrados.length} de {despachos.length} despachos recientes.</span>
          <span>Los indicadores muestran el total de registros por estado, no solo los visibles.</span>
        </div>
      </section>

      {detalle && (
        <>
          <button type="button" aria-label="Cerrar resumen" onClick={() => setDetalle(null)} className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-[2px]" />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Logística / Despachos</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#123E70]">Despacho #{detalle.id}</h2>
                  <p className="mt-1 text-sm text-slate-500">Venta #{detalle.ventaId}</p>
                </div>
                <button type="button" onClick={() => setDetalle(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-3"><BadgeEstado estado={detalle.estado} /></div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <Dato icono={<CalendarDays />} etiqueta="Fecha programada" valor={fechaLima(detalle.fechaRuta)} />
                <Dato icono={<Truck />} etiqueta="Vehículo" valor={detalle.vehiculo || "Sin asignar"} />
                <Dato icono={<UserRound />} etiqueta="Conductor" valor={detalle.conductor || "Sin asignar"} ancho />
              </div>
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Cliente y destino</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{detalle.cliente}</p>
                  <p className="mt-2 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{detalle.direccion || "No se registró una dirección de entrega."}</p>
                </div>
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Productos del pedido</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{detalle.productos.length} productos</span></div>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {detalle.productos.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="font-medium text-slate-700">{p.nombre}</span><span className="shrink-0 font-bold text-slate-900">× {p.cantidad}</span></div>)}
                </div>
                <p className="mt-2 text-right text-sm font-bold text-[#123E70]">Total: {importe(detalle.importeTotal, detalle.moneda)}</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Trazabilidad</h3>
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p><span className="text-slate-500">Salida de inventario:</span> <strong>{fechaHoraLima(detalle.salidaInventarioEn)}</strong></p>
                  <p className="mt-2"><span className="text-slate-500">Entregado:</span> <strong>{fechaHoraLima(detalle.entregadoEn)}</strong></p>
                  {detalle.receptor && <p className="mt-2"><span className="text-slate-500">Recibido por:</span> <strong>{detalle.receptor}</strong></p>}
                  {detalle.observacion && <p className="mt-2"><span className="text-slate-500">Observación:</span> {detalle.observacion}</p>}
                  {detalle.devolucionInventarioEn && <p className="mt-2 text-emerald-700"><strong>Devolución recibida:</strong> {fechaHoraLima(detalle.devolucionInventarioEn)}{detalle.devolucionMotivo ? ` · ${detalle.devolucionMotivo}` : ""}</p>}
                </div>
              </section>
              <div className="flex flex-wrap gap-2">
                {detalle.evidencia && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({
                        titulo: `Fotografía del despacho #${detalle.id}`,
                        src: `/dashboard/logistica/despachos/${detalle.id}/foto`,
                        tipo: "image",
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-blue-100"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Ver fotografía
                  </button>
                )}

                {detalle.estado === "ENTREGADO" && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({
                        titulo: `Comprobante del despacho #${detalle.id}`,
                        src: `/documentos/despachos/${detalle.id}`,
                        tipo: "page",
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Comprobante
                  </button>
                )}
              </div>
              {!detalle.gestionCompleta && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Este despacho es parcial o no tiene hoja de ruta. Su gestión continúa en el flujo específico correspondiente.</p>}
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="flex flex-wrap gap-2">{acciones(detalle)}</div>
            </div>
          </aside>
        </>
      )}

      {modal && seleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px]">
          <section role="dialog" aria-modal="true" aria-labelledby="modal-despacho-titulo" className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Despacho #{seleccionado.id}</p>
                <h2 id="modal-despacho-titulo" className="mt-1 text-xl font-bold text-[#123E70]">{tituloModal(modal)}</h2>
                <p className="mt-1 text-sm text-slate-500">{seleccionado.cliente} · Venta #{seleccionado.ventaId}</p>
              </div>
              <button type="button" onClick={cerrarModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </div>

            {modal === "INICIAR" && (
              <form action={actualizarDespacho} className="space-y-4 p-5">
                <input type="hidden" name="id" value={seleccionado.id} />
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">Confirmar salida a ruta</p>
                  <p className="mt-1">Al continuar se descontarán las cantidades asignadas de sus lotes y se registrará el movimiento de salida. Esta operación se realiza una sola vez.</p>
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={cerrarModal} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button name="estado" value="EN_RUTA" className="rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white">Confirmar salida</button></div>
              </form>
            )}

            {modal === "ENTREGAR" && (
              <form action={actualizarDespacho} className="space-y-4 p-5">
                <input type="hidden" name="id" value={seleccionado.id} />
                <label className="block text-sm font-semibold text-slate-700">Nombre de quien recibe<input required name="receptor" maxLength={120} placeholder="Nombre y apellido" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                <label className="block text-sm font-semibold text-slate-700">Fotografía de entrega<input required name="foto" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#123E70]" /><span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG o WEBP · máximo 3 MB.</span></label>
                <label className="block text-sm font-semibold text-slate-700">Observación (opcional)<textarea name="observacion" maxLength={500} rows={3} placeholder="Observación de la entrega" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                <div className="flex justify-end gap-2"><button type="button" onClick={cerrarModal} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button name="estado" value="ENTREGADO" className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">Confirmar entrega</button></div>
              </form>
            )}

            {modal === "REPROGRAMAR" && (
              <form action={actualizarDespacho} className="space-y-4 p-5">
                <input type="hidden" name="id" value={seleccionado.id} /><input type="hidden" name="estado" value="REPROGRAMADO" />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">La salida de inventario se mantendrá registrada. Almacén deberá confirmar la recepción física antes de volver a programar esta venta.</div>
                <label className="block text-sm font-semibold text-slate-700">Motivo de reprogramación<textarea required name="observacion" maxLength={500} rows={4} placeholder="Describe por qué no se pudo completar la entrega" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label>
                <div className="flex justify-end gap-2"><button type="button" onClick={cerrarModal} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white">Confirmar reprogramación</button></div>
              </form>
            )}

            {modal === "DEVOLVER" && (
              <form action={recibirDevolucionDespacho} className="space-y-4 p-5">
                <input type="hidden" name="id" value={seleccionado.id} />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Esta operación reintegrará las unidades al mismo lote. Confirma únicamente después de recibir y revisar físicamente toda la mercadería.</div>
                <label className="block text-sm font-semibold text-slate-700">Motivo y comprobación de devolución<textarea required name="motivo" maxLength={500} rows={3} placeholder="Describe la recepción y revisión de los productos" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label>
                <label className="flex items-start gap-2 text-sm text-slate-700"><input required type="checkbox" name="inspeccion" value="confirmada" className="mt-0.5 h-4 w-4 rounded border-slate-300" /><span>Confirmo que Almacén recibió la totalidad y verificó lote, cantidad, integridad, conservación y vencimiento.</span></label>
                <div className="flex justify-end gap-2"><button type="button" onClick={cerrarModal} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white">Confirmar reintegro</button></div>
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

    </main>
  );
}

function Kpi({
  titulo,
  valor,
  nota,
  icono,
  color,
}: {
  titulo: string;
  valor: number;
  nota: string;
  icono: ReactNode;
  color: string;
}) {
  return (
    <article className={`rounded-xl border border-slate-200 border-t-4 ${color} bg-white p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-slate-500">{titulo}</p><p className="mt-2 text-3xl font-bold tabular-nums text-[#123E70]">{valor}</p><p className="mt-1 text-xs text-slate-500">{nota}</p></div>
        <span className="rounded-xl bg-slate-50 p-3 text-[#123E70]">{icono}</span>
      </div>
    </article>
  );
}

function Dato({
  icono,
  etiqueta,
  valor,
  ancho = false,
}: {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
  ancho?: boolean;
}) {
  return (
    <div className={`rounded-xl bg-slate-50 p-3 ${ancho ? "col-span-2" : ""}`}>
      <span className="text-slate-400">{icono}</span><p className="mt-2 text-xs text-slate-500">{etiqueta}</p><p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{valor}</p>
    </div>
  );
}

function tituloModal(modal: Exclude<ModalAccion, null>) {
  const titulos = {
    INICIAR: "Iniciar despacho",
    ENTREGAR: "Confirmar entrega",
    REPROGRAMAR: "Reprogramar entrega",
    DEVOLVER: "Registrar devolución",
  };
  return titulos[modal];
}
