"use client";

import Link from "next/link";
import { useState } from "react";
import { DetalleCotizacionDrawer, type CotizacionVista } from "@/app/dashboard/ventas/crm/detalle-cotizacion-drawer";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Eye, FilterX, Search } from "lucide-react";
import { EstadoCotizacionBadge } from "./estado-badge";
import { AccionesEstadoCotizacion } from "./acciones-estado";
import { ConvertirCotizacionAVenta } from "./convertir-venta";

export type FilaCotizacion = {
  id: number;
  version: number;
  cliente: string;
  vendedor: string;
  fecha: string;
  estado: "BORRADOR" | "EMITIDA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | "ANULADA";
  moneda: "PEN" | "USD";
  total: number;
  productos: number;
  oportunidadId: number | null;
  etapaOportunidad: string | null;
  cotizacionAnteriorId: number | null;
  revisionSiguienteId: number | null;
  ventaId: number | null;
  detalle: CotizacionVista;
};

type Filtros = { q: string; estado: string; moneda: string; pagina: number; porPagina: number };

const formatoDinero = (n: number, moneda: "PEN" | "USD") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n);
const codigo = (n: number) => `COT-${String(n).padStart(5, "0")}`;

export function TablaCotizaciones({ filas, total, filtros, productos }: { filas: FilaCotizacion[]; total: number; filtros: Filtros; productos: { id: number; codigo: string; nombre: string }[] }) {
  const router = useRouter();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<number | null>(null);
  const filaSeleccionada = filas.find((f) => f.id === cotizacionSeleccionada) ?? null;
  const [busqueda, setBusqueda] = useState(filtros.q);
  const [estado, setEstado] = useState(filtros.estado);
  const [moneda, setMoneda] = useState(filtros.moneda);
  const [porPagina, setPorPagina] = useState(String(filtros.porPagina));
  const paginas = Math.max(1, Math.ceil(total / filtros.porPagina));
  const desde = total ? (filtros.pagina - 1) * filtros.porPagina + 1 : 0;
  const hasta = Math.min(total, filtros.pagina * filtros.porPagina);

  function url(pagina: number, valores: { q: string; estado: string; moneda: string; porPagina: string }) {
    const params = new URLSearchParams();
    if (valores.q.trim()) params.set("q", valores.q.trim());
    if (valores.estado !== "TODOS") params.set("estado", valores.estado);
    if (valores.moneda !== "TODAS") params.set("moneda", valores.moneda);
    params.set("pagina", String(pagina));
    params.set("porPagina", valores.porPagina);
    return `/dashboard/cotizaciones?${params.toString()}`;
  }
  const actuales = { q: filtros.q, estado: filtros.estado, moneda: filtros.moneda, porPagina: String(filtros.porPagina) };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#123E70]">Listado de cotizaciones</h2>
            <p className="mt-1 text-xs text-slate-500">Consulta propuestas, versiones, estados y su documentación comercial.</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{total} resultado(s)</span>
        </div>
        <form className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_170px_130px_125px_auto]" onSubmit={(ev) => {
          ev.preventDefault();
          router.push(url(1, { q: busqueda, estado, moneda, porPagina }));
        }}>
          <label className="relative min-w-0">
            <span className="sr-only">Buscar cotizaciones</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar código, cliente o vendedor..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100" />
          </label>
          <label><span className="sr-only">Filtrar estado</span><select value={estado} onChange={e => setEstado(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="TODOS">Todos los estados</option>
            <option value="BORRADOR">Borrador</option><option value="EMITIDA">Emitida</option>
            <option value="ACEPTADA">Aceptada</option><option value="RECHAZADA">Rechazada</option>
            <option value="VENCIDA">Vencida</option><option value="ANULADA">Anulada</option>
          </select></label>
          <label><span className="sr-only">Filtrar moneda</span><select value={moneda} onChange={e => setMoneda(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="TODAS">Toda moneda</option><option value="PEN">PEN</option><option value="USD">USD</option></select></label>
          <label><span className="sr-only">Filas por página</span><select value={porPagina} onChange={e => setPorPagina(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="10">10 por página</option><option value="20">20 por página</option><option value="50">50 por página</option></select></label>
          <div className="flex gap-2">
            <button type="submit" className="h-10 rounded-lg bg-[#123E70] px-4 text-sm font-semibold text-white hover:bg-[#087EBD]">Filtrar</button>
            <Link title="Limpiar filtros" aria-label="Limpiar filtros" href="/dashboard/cotizaciones" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><FilterX className="h-4 w-4" /></Link>
          </div>
        </form>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>
            <th className="px-4 py-3">Código / versión</th><th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Oportunidad</th><th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Vendedor</th><th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-center">Productos</th><th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
          {filas.map(c => (
            <tr key={c.id} className="align-top hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-4"><div className="font-bold text-[#123E70]">{codigo(c.id)}</div><span className="text-xs text-slate-500">Versión {c.version}</span>{c.cotizacionAnteriorId && <div className="mt-1 text-xs text-sky-700">Revisión de {codigo(c.cotizacionAnteriorId)}</div>}{c.revisionSiguienteId && <div className="mt-1 text-xs text-slate-500">Siguiente: {codigo(c.revisionSiguienteId)}</div>}</td>
              <td className="max-w-[230px] px-4 py-4 font-medium text-slate-700">{c.cliente}</td>
              <td className="whitespace-nowrap px-4 py-4">{c.oportunidadId ? <Link href="/dashboard/ventas/crm" className="font-semibold text-[#087EBD] hover:underline">OP-{String(c.oportunidadId).padStart(4, "0")}</Link> : <span className="text-slate-400">—</span>}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "America/Lima" })}</td>
              <td className="max-w-[160px] px-4 py-4 text-slate-600">{c.vendedor}</td>
              <td className="px-4 py-4"><EstadoCotizacionBadge estado={c.estado} /></td>
              <td className="px-4 py-4 text-center tabular-nums text-slate-700">{c.productos}</td>
              <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-[#123E70]">{formatoDinero(c.total, c.moneda)}</td>
              <td className="px-4 py-3"><div className="flex min-w-[190px] flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setCotizacionSeleccionada(c.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-[#123E70] hover:bg-slate-50" title="Ver detalle de cotización" aria-label={`Ver detalle de ${codigo(c.id)} versión ${c.version}`}><Eye className="h-3.5 w-3.5"/> Ver</button>
                <a href={`/dashboard/cotizaciones/${c.id}/pdf`} download={`${codigo(c.id)}-v${c.version}.pdf`} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-[#123E70] hover:bg-slate-50" title="Descargar PDF"><Download className="h-3.5 w-3.5"/> PDF</a>
                <AccionesEstadoCotizacion cotizacionId={c.id} estado={c.estado} />
                {c.estado === "RECHAZADA" && !c.revisionSiguienteId && (!c.etapaOportunidad || !["GANADA","PERDIDA"].includes(c.etapaOportunidad)) && <Link href={`/dashboard/cotizaciones?revisar=${c.id}`} className="rounded-md bg-sky-50 px-2 py-1.5 text-xs font-semibold text-[#087EBD] hover:bg-sky-100">Crear v{c.version+1}</Link>}
                {c.ventaId ? <Link href={`/dashboard/ventas/${c.ventaId}`} className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Venta #{c.ventaId}</Link> : c.estado === "ACEPTADA" && (!c.oportunidadId || c.etapaOportunidad === "NEGOCIACION") ? <ConvertirCotizacionAVenta cotizacionId={c.id} /> : null}
                {c.estado === "ACEPTADA" && c.etapaOportunidad === "COTIZACION" && !c.ventaId && <span className="text-xs text-amber-700" title="Avanza la oportunidad a Negociación">Pendiente de negociación</span>}
              </div></td>
            </tr>
          ))}
          {!filas.length && <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">No se encontraron cotizaciones con estos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p className="text-xs text-slate-600">Mostrando <strong>{desde}–{hasta}</strong> de <strong>{total}</strong> cotizaciones</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={filtros.pagina <= 1} tabIndex={filtros.pagina <= 1 ? -1 : undefined} href={filtros.pagina <= 1 ? "#" : url(filtros.pagina-1, actuales)} className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold ${filtros.pagina<=1 ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-[#123E70] hover:bg-slate-50"}`}><ChevronLeft className="h-4 w-4"/> Anterior</Link>
          <span className="min-w-[86px] text-center text-xs font-semibold text-slate-700">{filtros.pagina} de {paginas}</span>
          <Link aria-disabled={filtros.pagina >= paginas} tabIndex={filtros.pagina >= paginas ? -1 : undefined} href={filtros.pagina >= paginas ? "#" : url(filtros.pagina+1, actuales)} className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold ${filtros.pagina>=paginas ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-[#123E70] hover:bg-slate-50"}`}>Siguiente <ChevronRight className="h-4 w-4"/></Link>
        </div>
      </div>
      <DetalleCotizacionDrawer
        cotizacion={filaSeleccionada?.detalle ?? null}
        cliente={filaSeleccionada?.cliente ?? ""}
        productos={productos}
        onCerrar={() => setCotizacionSeleccionada(null)}
      />
    </section>
  );
}
