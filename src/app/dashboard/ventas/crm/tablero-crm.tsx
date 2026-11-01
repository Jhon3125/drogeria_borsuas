"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarDays, CircleDollarSign, GripVertical, Plus, Search, UserRound, X, Columns3, Pencil, Eye, CheckCircle2, UserPlus, History, PhoneCall, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CotizacionForm } from "@/app/dashboard/cotizaciones/form";
import { AccionesEstadoCotizacion } from "@/app/dashboard/cotizaciones/acciones-estado";
import { crearOportunidad, actualizarOportunidad, cambiarEtapaOportunidad, crearClienteDesdeCRM } from "./actions";

type Etapa = "PROSPECTO" | "CONTACTADO" | "COTIZACION" | "NEGOCIACION" | "GANADA" | "PERDIDA";
type Oportunidad = {
  id: number; titulo: string; clienteId: number; cliente: string; vendedorId: number;
  vendedor: string; etapa: Etapa; montoEstimado: string; moneda: string;
  descripcion: string; proximaActividad: string; fechaSeguimiento: string;
  fechaCreacion: string; motivoPerdida: string;
  cotizaciones: { id: number; estado: "BORRADOR" | "EMITIDA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | "ANULADA"; moneda: string; importeTotal: string; fecha: string; validezHasta: string | null }[];
  historial: { id: number; anterior: string | null; nueva: string; comentario: string; fecha: string; usuario: string }[];
};
type Opcion = { id: number; nombre?: string; razonSocial?: string };
type ProductoCotizacion = { id: number; codigo: string; nombre: string; precioVenta: string; moneda: "PEN" | "USD" };
const COLUMNAS: { id: Etapa; titulo: string; color: string; barra: string }[] = [
  { id: "PROSPECTO", titulo: "Prospecto", color: "bg-slate-100 text-slate-700", barra: "bg-slate-400" },
  { id: "CONTACTADO", titulo: "Contactado", color: "bg-sky-100 text-sky-800", barra: "bg-sky-500" },
  { id: "COTIZACION", titulo: "Cotización", color: "bg-amber-100 text-amber-800", barra: "bg-amber-500" },
  { id: "NEGOCIACION", titulo: "Negociación", color: "bg-violet-100 text-violet-800", barra: "bg-violet-500" },
  { id: "GANADA", titulo: "Ganada", color: "bg-emerald-100 text-emerald-800", barra: "bg-emerald-500" },
  { id: "PERDIDA", titulo: "Perdida", color: "bg-rose-100 text-rose-800", barra: "bg-rose-500" },
];
const SIGUIENTE: Partial<Record<Etapa, { etapa: Etapa; label: string }>> = {
  PROSPECTO: { etapa: "CONTACTADO", label: "Contactar" },
  CONTACTADO: { etapa: "COTIZACION", label: "Cotizar" },
  COTIZACION: { etapa: "NEGOCIACION", label: "Negociar" },
  NEGOCIACION: { etapa: "GANADA", label: "Marcar ganada" },
};
function mostrarMonto(item: Oportunidad) {
  if (!item.montoEstimado) return "Sin importe";
  const n = Number(item.montoEstimado);
  return Number.isFinite(n) ? new Intl.NumberFormat("es-PE", { style: "currency", currency: item.moneda === "USD" ? "USD" : "PEN" }).format(n) : "Sin importe";
}
function etiqueta(etapa: Etapa) { return COLUMNAS.find((col) => col.id === etapa)?.titulo ?? etapa; }

export function TableroCRM({ oportunidades, clientes, vendedores, productosCotizacion, usuarioId, administrador }: {
  oportunidades: Oportunidad[]; clientes: Opcion[]; vendedores: Opcion[];
  productosCotizacion: ProductoCotizacion[]; usuarioId: number; administrador: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [modal, setModal] = useState<"crear" | "editar" | null>(null);
  const [seleccionada, setSeleccionada] = useState<Oportunidad | null>(null);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [cotizarId, setCotizarId] = useState<number | null>(null);
  const [destino, setDestino] = useState<Etapa | null>(null);
  const [motivo, setMotivo] = useState("");
  const [arrastrada, setArrastrada] = useState<number | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, iniciarTransicion] = useTransition();
  const [vistaLocal, setVistaLocal] = useState<Oportunidad[]>(oportunidades);

  useEffect(() => { setVistaLocal(oportunidades); }, [oportunidades]);
  const filtradas = useMemo(() => vistaLocal.filter((o) => {
    const q = busqueda.trim().toLocaleLowerCase("es-PE");
    return (!q || `${o.titulo} ${o.cliente} ${o.vendedor} ${o.id}`.toLocaleLowerCase("es-PE").includes(q)) &&
      (filtroVendedor === "todos" || String(o.vendedorId) === filtroVendedor);
  }), [vistaLocal, busqueda, filtroVendedor]);

  const detalle = vistaLocal.find((x) => x.id === detalleId) ?? null;
  const oportunidadCotizar = vistaLocal.find((x) => x.id === cotizarId) ?? null;
  function abrirCotizacion(item: Oportunidad) {
    if (item.etapa === "PROSPECTO") { setMensaje("Primero registra el contacto y avanza a Contactado para cotizar."); return; }
    if (item.etapa === "GANADA" || item.etapa === "PERDIDA") return;
    setCotizarId(item.id);
    setMensaje(null);
  }
  function cotizacionGuardada() {
    setCotizarId(null);
    setMensaje("Cotización registrada. La etapa de la oportunidad no se modificó.");
    router.refresh();
  }
  const totalAbiertas = vistaLocal.filter((o) => o.etapa !== "GANADA" && o.etapa !== "PERDIDA").length;
  const cerrarModal = () => { setModal(null); setSeleccionada(null); };
  function abrirEditar(o: Oportunidad) { setSeleccionada(o); setModal("editar"); setMensaje(null); }
  function solicitarMovimiento(id: number, etapaNueva: Etapa) {
    if (ocupado) return;
    const item = vistaLocal.find((o) => o.id === id);
    if (!item || item.etapa === etapaNueva || item.etapa === "GANADA" || item.etapa === "PERDIDA") return;
    setMensaje(null);
    if (etapaNueva === "NEGOCIACION" && item.cotizaciones.filter((c) => c.estado !== "ANULADA").length === 0) {
      setMensaje("Registra al menos una cotización antes de pasar a Negociación.");
      return;
    }
    setSeleccionada(item);
    setDestino(etapaNueva);
    setMotivo("");
    // Exigir motivo en PERDIDA; confirmar GANADA para evitar cierres por arrastre accidental.
    if (etapaNueva !== "GANADA" && etapaNueva !== "PERDIDA") realizarMovimiento(item, etapaNueva, "");
  }
  function realizarMovimiento(item: Oportunidad, etapaNueva: Etapa, comentario: string) {
    const anterior = item.etapa;
    setDestino(null);
    setSeleccionada(null);
    setVistaLocal((items) => items.map((o) => o.id === item.id ? { ...o, etapa: etapaNueva } : o));
    iniciarTransicion(async () => {
      const data = new FormData();
      data.set("oportunidadId", String(item.id));
      data.set("etapaEsperada", anterior);
      data.set("etapaNueva", etapaNueva);
      data.set("comentario", comentario);
      try {
        const result = await cambiarEtapaOportunidad(undefined, data);
        if (result?.error) {
          setMensaje(result.error);
          setVistaLocal((items) => items.map((o) => o.id === item.id ? { ...o, etapa: anterior } : o));
        } else {
          setMensaje(`Oportunidad #${item.id}: ${etiqueta(anterior)} → ${etiqueta(etapaNueva)}.`);
        }
        router.refresh();
      } catch {
        setMensaje("No se pudo guardar el movimiento. Actualiza la página e inténtalo de nuevo.");
        setVistaLocal((items) => items.map((o) => o.id === item.id ? { ...o, etapa: anterior } : o));
        router.refresh();
      }
    });
  }
  function soltarEn(etapa: Etapa, ev: React.DragEvent<HTMLElement>) {
    ev.preventDefault(); setSobre(null);
    const id = Number(ev.dataTransfer.getData("text/plain"));
    setArrastrada(null);
    if (Number.isSafeInteger(id) && id > 0) solicitarMovimiento(id, etapa);
  }

  return <main className="mx-auto max-w-[1650px] space-y-6 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">Comercial y ventas <ArrowRight className="h-3 w-3" /> CRM</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#123E70] sm:text-3xl"><Columns3 className="h-7 w-7" /> Pipeline comercial</h1>
        <p className="mt-1 text-sm text-slate-600">Gestiona oportunidades por etapa. Los cambios quedan registrados en el historial comercial.</p>
      </div>
      <Button onClick={() => { setSeleccionada(null); setModal("crear"); setMensaje(null); }}><Plus className="mr-2 h-4 w-4" /> Nueva oportunidad</Button>
    </header>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        ["Oportunidades", vistaLocal.length], ["En seguimiento", totalAbiertas],
        ["Ganadas", vistaLocal.filter((x) => x.etapa === "GANADA").length],
        ["Perdidas", vistaLocal.filter((x) => x.etapa === "PERDIDA").length],
      ].map(([nombre, numero]) => <div key={String(nombre)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{nombre}</p><p className="mt-2 text-2xl font-bold text-[#123E70]">{numero}</p></div>)}
    </div>

    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar oportunidad, cliente o responsable..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#087EBD]" /></label>
      {administrador && <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="todos">Todos los responsables</option>{vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select>}
      <span className="text-xs text-slate-500">{filtradas.length} resultado(s)</span>
    </div>
    {mensaje && <div role="status" className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-[#123E70]">{mensaje} <button onClick={() => setMensaje(null)} className="float-right" aria-label="Descartar mensaje"><X className="h-4 w-4" /></button></div>}

    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1220px] grid-cols-6 gap-3">
        {COLUMNAS.map((col) => {
          const items = filtradas.filter((o) => o.etapa === col.id);
          return <section key={col.id} onDragOver={(ev) => { if (!ocupado && arrastrada !== null) { ev.preventDefault(); setSobre(col.id); } }} onDragLeave={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setSobre(null); }} onDrop={(ev) => soltarEn(col.id, ev)} className={`min-h-[420px] rounded-xl border bg-slate-50/80 p-2 transition ${sobre === col.id ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200"}`}>
            <div className="mb-3 rounded-lg bg-white px-3 py-3 shadow-sm"><div className={`mb-2 h-1.5 rounded-full ${col.barra}`} /><div className="flex items-center justify-between gap-1"><h2 className="text-sm font-semibold text-slate-800">{col.titulo}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${col.color}`}>{items.length}</span></div></div>
            <div className="space-y-2">{items.map((o) => {
              const cerrada = o.etapa === "GANADA" || o.etapa === "PERDIDA";
              return <article key={o.id} draggable={!cerrada && !ocupado} onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", String(o.id)); setArrastrada(o.id); }} onDragEnd={() => { setArrastrada(null); setSobre(null); }} className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${cerrada ? "opacity-90" : "cursor-grab active:cursor-grabbing"} ${arrastrada === o.id ? "opacity-40" : ""}`}>
                <div className="flex items-start gap-1"><GripVertical className={`mt-0.5 h-4 w-4 shrink-0 ${cerrada ? "text-slate-200" : "text-slate-400"}`} /><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-400">OP-{String(o.id).padStart(4, "0")}</p><h3 className="mt-0.5 break-words text-sm font-bold text-[#123E70]">{o.titulo}</h3></div>{!cerrada && <button type="button" onClick={() => abrirEditar(o)} className="rounded p-1 text-slate-500 hover:bg-slate-100" title="Editar oportunidad" aria-label={`Editar ${o.titulo}`}><Pencil className="h-3.5 w-3.5" /></button>}</div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600"><UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />{o.cliente}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CircleDollarSign className="h-3.5 w-3.5" />{mostrarMonto(o)}</p>
                <p className="mt-2 text-xs text-slate-500">Responsable: {o.vendedor}</p>
                {o.cotizaciones.length > 0 && <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-sky-700"><FileText className="h-3.5 w-3.5" /> {o.cotizaciones.length} cotización(es)</p>}
                {o.fechaSeguimiento && <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />Seguimiento: {o.fechaSeguimiento.split("-").reverse().join("/")}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  <button type="button" draggable={false} onClick={() => setDetalleId(o.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#123E70] hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Detalle</button>
                  {!cerrada && o.etapa !== "PROSPECTO" && <button type="button" draggable={false} onClick={() => abrirCotizacion(o)} className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-[11px] font-semibold text-[#123E70] hover:bg-sky-100"><FileText className="h-3.5 w-3.5" /> Cotizar</button>}
                  {!cerrada && SIGUIENTE[o.etapa] && <button type="button" draggable={false} disabled={ocupado} onClick={() => solicitarMovimiento(o.id, SIGUIENTE[o.etapa]!.etapa)} className="inline-flex items-center gap-1 rounded-md bg-[#123E70] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#087EBD] disabled:opacity-50"><ArrowRight className="h-3.5 w-3.5" /> {SIGUIENTE[o.etapa]!.label}</button>}
                </div>
                {o.etapa === "PERDIDA" && o.motivoPerdida && <p className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-800">{o.motivoPerdida}</p>}
              </article>;
            })}
            {items.length === 0 && <p className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">Sin oportunidades</p>}</div>
          </section>;
        })}
      </div>
    </div>
    <p className="text-xs text-slate-500">Arrastra una tarjeta a otra columna o utiliza las acciones rápidas. Para cambios no consecutivos, utiliza el drawer de detalle. Las etapas Ganada y Perdida son definitivas en esta versión. Mover tarjetas no genera ventas, pagos ni movimientos de inventario.</p>

    {detalle && <div className="fixed inset-0 z-[80]" role="presentation" onKeyDown={(ev) => { if (ev.key === "Escape") setDetalleId(null); }}>
      <button type="button" tabIndex={-1} aria-label="Cerrar detalle" onClick={() => setDetalleId(null)} className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px]" />
      <aside role="dialog" aria-modal="true" aria-label={`Detalle de ${detalle.titulo}`} tabIndex={-1} ref={(node) => { if (node && document.activeElement?.tagName !== "BUTTON") node.focus(); }} className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl outline-none">
        <div className="flex items-start justify-between border-b px-5 py-5"><div><p className="text-xs font-semibold text-sky-700">OP-{String(detalle.id).padStart(4, "0")} · {etiqueta(detalle.etapa)}</p><h2 className="mt-1 text-xl font-bold text-[#123E70]">{detalle.titulo}</h2><p className="text-sm text-slate-500">{detalle.cliente}</p></div><button type="button" onClick={() => setDetalleId(null)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><p className="text-xs text-slate-500">Importe estimado</p><p className="font-bold">{mostrarMonto(detalle)}</p></div><div><p className="text-xs text-slate-500">Responsable</p><p className="font-semibold">{detalle.vendedor}</p></div><div><p className="text-xs text-slate-500">Seguimiento</p><p>{detalle.fechaSeguimiento || "No programado"}</p></div><div><p className="text-xs text-slate-500">Creación</p><p>{new Date(detalle.fechaCreacion).toLocaleDateString("es-PE")}</p></div></section>
          <section><h3 className="font-bold text-[#123E70]">Información comercial</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{detalle.descripcion || "Sin descripción."}</p><p className="mt-3 text-sm"><span className="font-semibold">Próxima actividad:</span> {detalle.proximaActividad || "No definida"}</p>{detalle.motivoPerdida && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">Motivo de pérdida: {detalle.motivoPerdida}</p>}</section>
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-[#123E70]"><FileText className="h-4 w-4 text-[#087EBD]" /> Cotizaciones vinculadas</h3>
                <p className="text-xs text-slate-500">{detalle.cotizaciones.length} propuesta(s) registrada(s)</p>
              </div>
              {detalle.etapa !== "PROSPECTO" && detalle.etapa !== "GANADA" && detalle.etapa !== "PERDIDA" && (
                <button type="button" onClick={() => abrirCotizacion(detalle)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#123E70] px-3 py-2 text-xs font-semibold text-white hover:bg-[#087EBD]">
                  <Plus className="h-3.5 w-3.5" /> Nueva cotización
                </button>
              )}
            </div>
            {detalle.cotizaciones.length ? <div className="space-y-2">
              {detalle.cotizaciones.map((c) => <div key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold text-[#123E70]">COT-{String(c.id).padStart(5, "0")}</p><p className="text-xs text-slate-500">{new Date(c.fecha).toLocaleDateString("es-PE")} · {c.estado.replaceAll("_", " ")}</p></div>
                  <span className="text-sm font-bold text-[#123E70]">{new Intl.NumberFormat("es-PE", { style: "currency", currency: c.moneda === "USD" ? "USD" : "PEN" }).format(Number(c.importeTotal))}</span>
                </div>
                <AccionesEstadoCotizacion cotizacionId={c.id} estado={c.estado} compacta />
                <a href={`/dashboard/cotizaciones/${c.id}/pdf`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#087EBD] hover:underline"><FileText className="h-3.5 w-3.5" /> Ver PDF</a>
              </div>)}
            </div> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Aún no existen cotizaciones para esta oportunidad.</p>}
          </section>
          <section><div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-[#087EBD]" /><h3 className="font-bold text-[#123E70]">Historial de etapas</h3></div><div className="space-y-3">{detalle.historial.length ? detalle.historial.map((h) => <div key={h.id} className="border-l-2 border-sky-200 pl-3 text-sm"><p className="font-semibold">{h.anterior ? `${etiqueta(h.anterior as Etapa)} → ` : "Creación → "}{etiqueta(h.nueva as Etapa)}</p><p className="text-xs text-slate-500">{h.usuario} · {new Date(h.fecha).toLocaleString("es-PE")}</p>{h.comentario && <p className="mt-1 text-slate-600">{h.comentario}</p>}</div>) : <p className="text-sm text-slate-500">Sin movimientos registrados.</p>}</div></section>
        </div>
        <div className="flex flex-wrap gap-2 border-t bg-white px-5 py-4"><Button variant="outline" onClick={() => { setDetalleId(null); abrirEditar(detalle); }} disabled={detalle.etapa === "GANADA" || detalle.etapa === "PERDIDA"}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>{SIGUIENTE[detalle.etapa] && <Button disabled={ocupado} onClick={() => { setDetalleId(null); solicitarMovimiento(detalle.id, SIGUIENTE[detalle.etapa]!.etapa); }}><ArrowRight className="mr-1 h-4 w-4" /> {SIGUIENTE[detalle.etapa]!.label}</Button>}{detalle.etapa !== "GANADA" && detalle.etapa !== "PERDIDA" && <Button variant="outline" disabled={ocupado} onClick={() => { setDetalleId(null); solicitarMovimiento(detalle.id, "PERDIDA"); }}>Marcar perdida</Button>}</div>
      </aside>
    </div>}

    {oportunidadCotizar && createPortal(
      <div className="fixed inset-0 z-[120]" role="presentation">
        <button type="button" aria-label="Cerrar nueva cotización" onClick={() => setCotizarId(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-[4px]" />
        <aside role="dialog" aria-modal="true" aria-label={`Nueva cotización para ${oportunidadCotizar.titulo}`} className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-4">
            <div><p className="text-xs font-semibold text-sky-700">OP-{String(oportunidadCotizar.id).padStart(4, "0")} · {etiqueta(oportunidadCotizar.etapa)}</p><h2 className="text-lg font-bold text-[#123E70]">Nueva cotización · {oportunidadCotizar.cliente}</h2></div>
            <button type="button" onClick={() => setCotizarId(null)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Cerrar cotización"><X className="h-5 w-5" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <CotizacionForm
              key={oportunidadCotizar.id}
              clientes={[{ id: oportunidadCotizar.clienteId, razonSocial: oportunidadCotizar.cliente }]}
              productos={productosCotizacion}
              clienteInicial={oportunidadCotizar.clienteId}
              oportunidadId={oportunidadCotizar.id}
              onGuardado={cotizacionGuardada}
            />
          </div>
        </aside>
      </div>, document.body
    )}

    <Dialog open={modal !== null} onOpenChange={(value) => { if (!value) cerrarModal(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader className="space-y-3 pb-2"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><Columns3 className="h-5 w-5" /></div><DialogTitle className="text-xl">{modal === "editar" ? "Editar oportunidad" : "Nueva oportunidad"}</DialogTitle><DialogDescription>Información comercial y próxima actividad de seguimiento.</DialogDescription></DialogHeader>{modal && <FormularioOportunidad key={`${modal}-${seleccionada?.id ?? 0}`} item={modal === "editar" ? seleccionada : null} clientes={clientes} vendedores={vendedores} usuarioId={usuarioId} administrador={administrador} onCerrar={cerrarModal} onGuardado={() => { cerrarModal(); router.refresh(); }} />}</DialogContent></Dialog>

    <Dialog open={destino !== null} onOpenChange={(abierta) => { if (!abierta && !ocupado) { setDestino(null); setSeleccionada(null); } }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Confirmar cambio de etapa</DialogTitle><DialogDescription>{destino === "PERDIDA" ? "Registra el motivo por el que se perdió esta oportunidad." : "Marcar esta oportunidad como ganada cerrará su negociación."}</DialogDescription></DialogHeader>{destino === "PERDIDA" && <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-lg border p-3 text-sm" placeholder="Motivo de pérdida (obligatorio)" />}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={ocupado} onClick={() => { setDestino(null); setSeleccionada(null); }}>Cancelar</Button><Button type="button" disabled={ocupado || !seleccionada || !destino || (destino === "PERDIDA" && !motivo.trim())} onClick={() => { if (seleccionada && destino) realizarMovimiento(seleccionada, destino, motivo.trim()); }}>Confirmar</Button></div></DialogContent></Dialog>
  </main>;
}

function FormularioOportunidad({ item, clientes, vendedores, usuarioId, administrador, onCerrar, onGuardado }: {
  item: Oportunidad | null; clientes: Opcion[]; vendedores: Opcion[]; usuarioId: number;
  administrador: boolean; onCerrar: () => void; onGuardado: () => void;
}) {
  const [estado, accion, pendiente] = useActionState(item ? actualizarOportunidad : crearOportunidad, undefined);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(String(item?.clienteId ?? ""));
  const [clientesLocales, setClientesLocales] = useState(clientes);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  useEffect(() => { if (estado?.ok) onGuardado(); }, [estado?.ok, onGuardado]);
  const clase = "mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100";
  return <form action={accion} className="space-y-4">
    {item && <input type="hidden" name="id" value={item.id} />}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Título de la oportunidad *<input name="titulo" required minLength={3} maxLength={180} defaultValue={item?.titulo ?? ""} placeholder="Ej. Abastecimiento para nueva farmacia" className={clase} /></label>
      <div className="text-sm font-semibold text-slate-700">Cliente *<div className="mt-1 flex gap-2"><select name="clienteId" required value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} className={clase.replace("mt-1 ", "")}><option value="" disabled>Seleccionar cliente</option>{clientesLocales.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}</select><Button type="button" variant="outline" title="Registrar nuevo cliente" aria-label="Registrar nuevo cliente" onClick={() => setNuevoCliente(true)}><UserPlus className="h-4 w-4" /><Plus className="ml-1 h-3 w-3" /></Button></div><p className="mt-1 text-xs font-normal text-slate-500">El cliente nuevo se registra activo. La oportunidad comienza en Prospecto.</p></div>
      <label className="text-sm font-semibold text-slate-700">Responsable *<select name="vendedorId" required defaultValue={item?.vendedorId ?? usuarioId} disabled={!administrador} className={clase}>{vendedores.filter((v) => administrador || v.id === usuarioId).map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select>{!administrador && <input type="hidden" name="vendedorId" value={usuarioId} />}</label>
      <label className="text-sm font-semibold text-slate-700">Moneda<select name="moneda" defaultValue={item?.moneda ?? "PEN"} className={clase}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label>
      <label className="text-sm font-semibold text-slate-700">Monto estimado<input name="montoEstimado" type="number" min="0" step="0.01" defaultValue={item?.montoEstimado ?? ""} placeholder="Opcional" className={clase} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Próxima actividad<input name="proximaActividad" maxLength={300} defaultValue={item?.proximaActividad ?? ""} placeholder="Ej. Llamar para confirmar condiciones" className={clase} /></label>
      <label className="text-sm font-semibold text-slate-700">Fecha de seguimiento<input name="fechaSeguimiento" type="date" defaultValue={item?.fechaSeguimiento ?? ""} className={clase} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Descripción<textarea name="descripcion" defaultValue={item?.descripcion ?? ""} maxLength={5000} rows={3} placeholder="Contexto, necesidades o información comercial" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#087EBD]" /></label>
    </div>
    {nuevoCliente && <NuevoClienteEnCRM onCancelar={() => setNuevoCliente(false)} onCreado={(c) => { setClientesLocales((prev) => [...prev, c].sort((a,b) => (a.razonSocial ?? "").localeCompare(b.razonSocial ?? "", "es"))); setClienteSeleccionado(String(c.id)); setNuevoCliente(false); }} />}
    {estado?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
    <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={pendiente} onClick={onCerrar}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Guardando..." : item ? "Guardar cambios" : "Crear oportunidad"}</Button></div>
  </form>;
}

function NuevoClienteEnCRM({ onCancelar, onCreado }: { onCancelar: () => void; onCreado: (cliente: { id: number; razonSocial: string }) => void }) {
  const [estado, accion, pendiente] = useActionState(crearClienteDesdeCRM, undefined);
  useEffect(() => { if (estado?.cliente) onCreado(estado.cliente); }, [estado?.cliente, onCreado]);
  // Base UI atenúa el backdrop de los diálogos anidados. Esta capa adicional
  // oscurece el modal de Oportunidad sin interferir con el foco ni los clics.
  // Portal separado: evita el stacking context del formulario principal.
  const [portalListo, setPortalListo] = useState(false);
  useEffect(() => { setPortalListo(true); }, []);

  return <>
    {portalListo && createPortal(
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-[4px]" />,
      document.body
    )}
    <Dialog open onOpenChange={(open) => { if (!open && !pendiente) onCancelar(); }}>
    <DialogContent className="z-[110] max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><UserPlus className="h-5 w-5" /></div><DialogTitle>Nuevo cliente</DialogTitle><DialogDescription>Registra un cliente sin salir de la oportunidad. Podrás seleccionarlo automáticamente.</DialogDescription></DialogHeader>
      <form action={accion} className="space-y-3">
        <label className="block text-sm font-semibold">Nombre o razón social *<input name="razonSocial" required minLength={2} maxLength={180} className="mt-1 h-10 w-full rounded-lg border px-3" /></label>
        <label className="block text-sm font-semibold">DNI o RUC *<input name="documento" required minLength={8} maxLength={11} pattern="(?:[0-9]{8}|[0-9]{11})" inputMode="numeric" className="mt-1 h-10 w-full rounded-lg border px-3" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Teléfono<input name="telefono" maxLength={30} className="mt-1 h-10 w-full rounded-lg border px-3" /></label><label className="text-sm font-semibold">Correo electrónico<input name="correo" type="email" className="mt-1 h-10 w-full rounded-lg border px-3" /></label></div>
        <label className="block text-sm font-semibold">Dirección<textarea name="direccion" maxLength={300} rows={2} className="mt-1 w-full rounded-lg border p-3" /></label>
        {estado?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={pendiente} onClick={onCancelar}>Cancelar</Button><Button disabled={pendiente} type="submit">{pendiente ? "Guardando..." : "Crear y seleccionar"}</Button></div>
      </form>
    </DialogContent>
    </Dialog>
  </>;
}
