"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Package, FileText } from "lucide-react";

type VentaVista = {
  id: number; fecha: string; cliente: string; documento: string; vendedor: string;
  estado: string; moneda: string; total: string; saldo: string;
  productos: number; requeridas: number; asignadas: number;
  cotizacionId: number | null; version: number | null; oportunidadId: number | null;
};
const ESTADOS: Record<string, { titulo: string; clase: string }> = {
  CONFIRMADA: { titulo: "Confirmada", clase: "bg-sky-100 text-sky-800" },
  EN_PREPARACION: { titulo: "En preparación", clase: "bg-amber-100 text-amber-800" },
  DESPACHADA: { titulo: "Despachada", clase: "bg-violet-100 text-violet-800" },
  COMPLETADA: { titulo: "Completada", clase: "bg-emerald-100 text-emerald-800" },
  ANULADA: { titulo: "Anulada", clase: "bg-rose-100 text-rose-800" },
};
const moneda = (n: string, m: string) => new Intl.NumberFormat("es-PE", { style: "currency", currency: m === "USD" ? "USD" : "PEN" }).format(Number(n));

export function ListadoVentas({ ventas }: { ventas: VentaVista[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const visibles = useMemo(() => ventas.filter((v) => {
    const q = busqueda.trim().toLocaleLowerCase("es-PE");
    return (estado === "TODOS" || estado === v.estado) &&
      (!q || `${v.id} ${v.cliente} ${v.documento} ${v.vendedor} ${v.cotizacionId ?? ""}`.toLocaleLowerCase("es-PE").includes(q));
  }), [ventas, estado, busqueda]);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><h2 className="font-bold text-[#123E70]">Operaciones comerciales</h2><p className="text-xs text-slate-500">Últimas 150 ventas · {visibles.length} resultado(s)</p></div>
      <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
        <label className="relative min-w-[200px] flex-1 sm:w-72 sm:flex-none"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Cliente, código o cotización..." aria-label="Buscar ventas" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" /></label>
        <select value={estado} onChange={e => setEstado(e.target.value)} aria-label="Filtrar por estado" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <option value="TODOS">Todos los estados</option>{Object.entries(ESTADOS).map(([k, e]) => <option key={k} value={k}>{e.titulo}</option>)}
        </select>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>
      <th className="px-5 py-3">Venta</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Preparación</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Acción</th>
    </tr></thead><tbody className="divide-y divide-slate-100">
      {visibles.map((v) => {
        const status = ESTADOS[v.estado] ?? { titulo: v.estado, clase: "bg-slate-100 text-slate-700" };
        const porcentaje = v.requeridas ? Math.min(100, Math.round(v.asignadas / v.requeridas * 100)) : 0;
        return <tr key={v.id} className="hover:bg-slate-50/70">
          <td className="px-5 py-4"><Link className="font-bold text-[#123E70] hover:underline" href={`/dashboard/ventas/${v.id}`}>VEN-{String(v.id).padStart(5, "0")}</Link><p className="text-xs text-slate-500">{new Date(v.fecha).toLocaleDateString("es-PE", { timeZone: "America/Lima" })}</p></td>
          <td className="px-4 py-4"><p className="font-medium text-slate-800">{v.cliente}</p><p className="text-xs text-slate-500">{v.vendedor}</p></td>
          <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.clase}`}>{status.titulo}</span></td>
          <td className="px-4 py-4"><p className="mb-1 flex items-center gap-1 text-xs text-slate-600"><Package className="h-3.5 w-3.5" />{v.asignadas}/{v.requeridas} uds. · {v.productos} producto(s)</p><div className="h-1.5 w-36 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#238B55]" style={{ width: `${porcentaje}%` }} /></div></td>
          <td className="px-4 py-4 text-xs">{v.cotizacionId ? <Link href={`/dashboard/cotizaciones/${v.cotizacionId}/pdf`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-[#087EBD] hover:underline"><FileText className="h-3.5 w-3.5" /> COT-{String(v.cotizacionId).padStart(5, "0")} · v{v.version}</Link> : "Sin cotización"}{v.oportunidadId && <p className="mt-1 text-slate-500">OP-{String(v.oportunidadId).padStart(4, "0")}</p>}</td>
          <td className="px-4 py-4 text-right"><p className="font-bold text-[#123E70]">{moneda(v.total, v.moneda)}</p><p className="text-xs text-slate-500">Saldo: {moneda(v.saldo, v.moneda)}</p></td>
          <td className="px-5 py-4 text-right"><Link href={`/dashboard/ventas/${v.id}`} className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-[#123E70] hover:bg-sky-100">Ver y preparar <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
        </tr>;
      })}
    </tbody></table></div>
    {!visibles.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No hay ventas que coincidan con los filtros. {ventas.length === 0 && <>Convierte una <Link href="/dashboard/cotizaciones" className="font-semibold text-[#087EBD] underline">cotización aceptada</Link> en venta para comenzar.</>}</div>}
  </section>;
}
