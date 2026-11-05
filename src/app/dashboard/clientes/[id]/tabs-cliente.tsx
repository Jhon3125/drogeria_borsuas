"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, FileText, History, ShoppingCart, Wallet, UsersRound } from "lucide-react";

type Moneda = "PEN" | "USD";
export type Cliente360Datos = {
  cliente: { id: number; razonSocial: string; documento: string | null; telefono: string | null; correo: string | null;
    direccion: string | null; estado: boolean; estadoRelacionComercial: string; fechaCalificacion: string | null };
  oportunidades: { id: number; titulo: string; etapa: string; montoEstimado: string | null; moneda: Moneda; fechaCreacion: string; vendedor: string }[];
  cotizaciones: { id: number; version: number; oportunidadId: number | null; estado: string; moneda: Moneda;
    total: string; fecha: string; validezHasta: string | null; vendedor: string; ventaId: number | null }[];
  ventas: { id: number; estado: string; fecha: string; moneda: Moneda; total: string;
    saldo: string; cotizacionId: number | null; vendedor: string }[];
  pagos: { id: number; ventaId: number; monto: string; fecha: string; metodoPago: string; moneda: Moneda }[];
  historial: { id: string; fecha: string; titulo: string; detalle: string; href: string }[];
  registrosLimitados: boolean;
};

type Tab = "resumen" | "oportunidades" | "cotizaciones" | "ventas" | "pagos" | "historial";
const TABS: { id: Tab; titulo: string }[] = [
  { id: "resumen", titulo: "Resumen" }, { id: "oportunidades", titulo: "Oportunidades" },
  { id: "cotizaciones", titulo: "Cotizaciones" }, { id: "ventas", titulo: "Ventas" },
  { id: "pagos", titulo: "Pagos" }, { id: "historial", titulo: "Historial" },
];
const dinero = (valor: string | number, moneda: Moneda = "PEN") => `${moneda === "PEN" ? "S/" : "USD"} ${Number(valor).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (valor: string | null) => valor ? new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(valor)) : "—";
const codigo = (prefijo: string, id: number, largo = 4) => `${prefijo}-${String(id).padStart(largo, "0")}`;

function Etiqueta({ valor }: { valor: string }) {
  const positivo = ["CALIFICADO", "GANADA", "ACEPTADA", "COMPLETADA", "PAGADA"].includes(valor);
  const negativo = ["DESCARTADO", "PERDIDA", "RECHAZADA", "ANULADA"].includes(valor);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${positivo ? "bg-emerald-100 text-emerald-800" : negativo ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{valor.replace(/_/g, " ")}</span>;
}
function Dato({ nombre, valor }: { nombre: string; valor: string | null | undefined }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{nombre}</p><p className="mt-1 break-words text-sm font-medium text-slate-800">{valor || "No registrado"}</p></div>;
}
function Vacio({ texto }: { texto: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">{texto}</div>;
}
function Tabla({ cabeceras, children }: { cabeceras: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{cabeceras.map(c => <th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">{c}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}
const td = "whitespace-nowrap px-4 py-3 text-slate-700";

export function TabsCliente360({ datos }: { datos: Cliente360Datos }) {
  const [actual, setActual] = useState<Tab>("resumen");
  const c = datos.cliente;
  const totalPorMoneda = (moneda: Moneda) => datos.ventas.filter(v => v.moneda === moneda).reduce((s, v) => s + Number(v.total), 0);
  const deudaPorMoneda = (moneda: Moneda) => datos.ventas.filter(v => v.moneda === moneda).reduce((s, v) => s + Number(v.saldo), 0);
  return <div className="space-y-5">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comercial y ventas / Cliente 360°</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-[#123E70] md:text-3xl">{c.razonSocial}</h1><p className="mt-1 text-sm text-slate-500">{c.documento || "Sin documento registrado"} · Cliente #{c.id}</p></div>
        <div className="flex flex-wrap items-center gap-2"><Etiqueta valor={c.estadoRelacionComercial}/><span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.estado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{c.estado ? "Activo" : "Inactivo"}</span></div>
      </div>
    </header>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{ nombre: "Oportunidades", valor: datos.oportunidades.length, icono: UsersRound }, { nombre: "Cotizaciones", valor: datos.cotizaciones.length, icono: FileText }, { nombre: "Ventas", valor: datos.ventas.length, icono: ShoppingCart }].map(k => <div key={k.nombre} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="rounded-lg bg-blue-50 p-3 text-[#087EBD]"><k.icono className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{k.nombre}</p><p className="text-2xl font-bold text-[#123E70]">{k.valor}{datos.registrosLimitados && <span className="text-xs font-normal">*</span>}</p></div></div>)}
    </div>
    <div className="overflow-x-auto border-b border-slate-200"><div role="tablist" aria-label="Vista 360 del cliente" className="flex min-w-max gap-1">{TABS.map(tab => <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={actual === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActual(tab.id)} className={`border-b-[3px] px-4 py-3 text-sm font-semibold transition-colors ${actual === tab.id ? "border-[#087EBD] text-[#123E70]" : "border-transparent text-slate-500 hover:text-[#123E70]"}`}>{tab.titulo}</button>)}</div></div>
    <section role="tabpanel" id={`panel-${actual}`} aria-labelledby={`tab-${actual}`} className="space-y-4">
      {actual === "resumen" && <>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#123E70]"><Building2 className="h-5 w-5"/> Información general</h2><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><Dato nombre="Razón social" valor={c.razonSocial}/><Dato nombre="Documento" valor={c.documento}/><Dato nombre="Teléfono" valor={c.telefono}/><Dato nombre="Correo" valor={c.correo}/><Dato nombre="Dirección" valor={c.direccion}/><Dato nombre="Fecha de calificación" valor={fecha(c.fechaCalificacion)}/></div></div>
        <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-[#123E70]">Ventas acumuladas</h3><p className="mt-2 text-xl font-semibold">{dinero(totalPorMoneda("PEN"))}</p><p className="text-sm text-slate-500">{dinero(totalPorMoneda("USD"), "USD")}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-[#123E70]">Saldo pendiente</h3><p className="mt-2 text-xl font-semibold">{dinero(deudaPorMoneda("PEN"))}</p><p className="text-sm text-slate-500">{dinero(deudaPorMoneda("USD"), "USD")}</p></div></div>
      </>}
      {actual === "oportunidades" && (datos.oportunidades.length ? <Tabla cabeceras={["Oportunidad", "Etapa", "Vendedor", "Monto estimado", "Creada", "Acción"]}>{datos.oportunidades.map(o => <tr key={o.id}><td className={td}><span className="font-semibold text-[#123E70]">{codigo("OP", o.id)}</span><p className="max-w-72 truncate text-xs text-slate-500">{o.titulo}</p></td><td className={td}><Etiqueta valor={o.etapa}/></td><td className={td}>{o.vendedor}</td><td className={td}>{o.montoEstimado ? dinero(o.montoEstimado, o.moneda) : "—"}</td><td className={td}>{fecha(o.fechaCreacion)}</td><td className={td}><Link className="inline-flex items-center gap-1 text-[#087EBD] hover:underline" href="/dashboard/ventas/crm">Ver en Kanban <ArrowUpRight className="h-4 w-4" /></Link></td></tr>)}</Tabla> : <Vacio texto="El cliente todavía no tiene oportunidades comerciales."/>)}
      {actual === "cotizaciones" && (datos.cotizaciones.length ? <Tabla cabeceras={["Código / versión", "Oportunidad", "Fecha", "Vigencia", "Estado", "Importe", "Acciones"]}>{datos.cotizaciones.map(cot => <tr key={cot.id}><td className={td}><strong className="text-[#123E70]">{codigo("COT", cot.id, 5)}</strong><p className="text-xs text-slate-500">Versión {cot.version}</p></td><td className={td}>{cot.oportunidadId ? codigo("OP", cot.oportunidadId) : "—"}</td><td className={td}>{fecha(cot.fecha)}</td><td className={td}>{fecha(cot.validezHasta)}</td><td className={td}><Etiqueta valor={cot.estado}/></td><td className={td}>{dinero(cot.total, cot.moneda)}</td><td className={td}><Link href={`/dashboard/cotizaciones/${cot.id}/pdf`} target="_blank" className="text-[#087EBD] hover:underline">PDF</Link>{cot.ventaId && <Link href={`/dashboard/ventas/${cot.ventaId}`} className="ml-3 text-[#087EBD] hover:underline">Venta #{cot.ventaId}</Link>}</td></tr>)}</Tabla> : <Vacio texto="Todavía no existen cotizaciones para este cliente."/>)}
      {actual === "ventas" && (datos.ventas.length ? <Tabla cabeceras={["Venta", "Fecha", "Vendedor", "Estado", "Importe", "Saldo", "Acción"]}>{datos.ventas.map(v => <tr key={v.id}><td className={td}><strong className="text-[#123E70]">#{v.id}</strong>{v.cotizacionId && <p className="text-xs text-slate-500">{codigo("COT", v.cotizacionId, 5)}</p>}</td><td className={td}>{fecha(v.fecha)}</td><td className={td}>{v.vendedor}</td><td className={td}><Etiqueta valor={v.estado}/></td><td className={td}>{dinero(v.total, v.moneda)}</td><td className={td}>{dinero(v.saldo, v.moneda)}</td><td className={td}><Link href={`/dashboard/ventas/${v.id}`} className="text-[#087EBD] hover:underline">Venta 360°</Link></td></tr>)}</Tabla> : <Vacio texto="El cliente aún no tiene ventas registradas."/>)}
      {actual === "pagos" && (datos.pagos.length ? <Tabla cabeceras={["Cobro", "Fecha", "Venta", "Método", "Importe", "Acción"]}>{datos.pagos.map(p => <tr key={p.id}><td className={td}>#{p.id}</td><td className={td}>{fecha(p.fecha)}</td><td className={td}>Venta #{p.ventaId}</td><td className={td}>{p.metodoPago}</td><td className={td}>{dinero(p.monto, p.moneda)}</td><td className={td}><Link href={`/dashboard/ventas/${p.ventaId}`} className="text-[#087EBD] hover:underline">Ver venta</Link></td></tr>)}</Tabla> : <Vacio texto="Todavía no hay cobros registrados para este cliente."/>)}
      {actual === "historial" && (datos.historial.length ? <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#123E70]"><History className="h-5 w-5"/> Actividad comercial</h2><ol className="space-y-3">{datos.historial.map(h => <li key={h.id} className="border-l-2 border-blue-200 py-2 pl-4"><p className="text-xs text-slate-500">{fecha(h.fecha)}</p><Link href={h.href} className="font-semibold text-[#123E70] hover:underline">{h.titulo}</Link><p className="mt-1 break-words text-sm text-slate-600">{h.detalle}</p></li>)}</ol></div> : <Vacio texto="Aún no hay actividad comercial registrada."/>)}
    </section>
    {datos.registrosLimitados && <p className="text-xs text-amber-700">* Vista limitada a los últimos 100 registros por categoría y 150 eventos de historial. Los acumulados mostrados corresponden a los registros cargados.</p>}
    <p className="text-xs text-slate-500">El historial reúne eventos comerciales existentes; no sustituye un registro de auditoría completo.</p>
  </div>;
}
