"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, FileText, Plus, Search, Trash2, Package, ReceiptText, ClipboardList, CheckCircle2 } from "lucide-react";
import { crearCotizacion } from "./actions";

type Item = { key: number; productoId: number; cantidad: number; precioUnitario: string; descuento: string };
type Producto = { id: number; codigo: string; nombre: string; precioVenta: string; moneda: "PEN" | "USD" };
type Cliente = { id: number; razonSocial: string };
const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
const money = (n: number, moneda: "PEN" | "USD") => `${moneda === "USD" ? "US$" : "S/"} ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
const parse = (s: string) => Number(s) || 0;

// Acepta 0, 13, 13.4 y 13.45; nunca más de dos decimales.
const entradaMonetariaValida = (valor: string) => /^\d*(?:[.,]\d{0,2})?$/.test(valor);
const normalizarMoneda = (valor: string) => {
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero.toFixed(2) : "0.00";
};
const hastaDosDecimales = (valor: string) => /^\d+(?:\.\d{1,2})?$/.test(valor);



function SelectorProducto({
  productos, seleccion, onSeleccionar, deshabilitado = false,
}: {
  productos: Producto[];
  seleccion: number;
  onSeleccionar: (producto: Producto) => void;
  deshabilitado?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const productoActual = productos.find((p) => p.id === seleccion);
  const coincidencias = productos.filter((p) =>
    `${p.codigo} ${p.nombre}`.toLocaleLowerCase("es-PE")
      .includes(texto.trim().toLocaleLowerCase("es-PE"))
  ).slice(0, 70);

  useEffect(() => {
    function fuera(evento: PointerEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    }
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, []);

  function elegir(producto: Producto) {
    onSeleccionar(producto);
    setTexto("");
    setIndice(0);
    setAbierto(false);
  }

  return (
    <div ref={contenedor} className="relative mt-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={campo}
          type="text"
          role="combobox"
          aria-label="Buscar producto por código o nombre"
          aria-expanded={abierto}
          aria-autocomplete="list"
          disabled={deshabilitado}
          value={abierto ? texto : productoActual ? `${productoActual.codigo} · ${productoActual.nombre}` : ""}
          placeholder="Buscar por nombre o código..."
          autoComplete="off"
          className={`${input} mt-0 pr-10 pl-9`}
          onFocus={() => { setAbierto(true); setIndice(0); }}
          onChange={(e) => { setTexto(e.target.value); setIndice(0); setAbierto(true); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setAbierto(false); setTexto(""); return; }
            if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setIndice((n) => Math.min(n + 1, coincidencias.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIndice((n) => Math.max(0, n - 1)); }
            if (e.key === "Enter" && abierto) { e.preventDefault(); if (coincidencias[indice]) elegir(coincidencias[indice]); }
          }}
        />
        <button
          type="button"
          disabled={deshabilitado}
          aria-label={abierto ? "Cerrar opciones" : "Mostrar productos"}
          onClick={() => { setAbierto((v) => !v); setIndice(0); campo.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
        ><ChevronDown className="h-4 w-4" /></button>
      </div>
      {abierto && (
        <div role="listbox" className="absolute z-[120] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {coincidencias.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">No se encontraron productos.</div>
          ) : coincidencias.map((p, i) => (
            <button
              type="button"
              role="option"
              aria-selected={p.id === seleccion}
              key={p.id}
              onMouseEnter={() => setIndice(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(p)}
              className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm ${i === indice ? "bg-sky-50 text-[#123E70]" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span className="font-semibold">{p.nombre}</span>
              <span className="text-xs text-slate-500">{p.codigo} · {p.moneda} · {money(Number(p.precioVenta), p.moneda)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type CotizacionBase = {
  id: number;
  version: number;
  clienteId: number;
  oportunidadId: number | null;
  descuento: string;
  observaciones: string;
  validezHasta: string;
  condicionPago: string;
  plazoEntrega: string;
  items: { productoId: number; cantidad: number; precioUnitario: string; descuento: string }[];
};

export function CotizacionForm({ clientes, productos, clienteInicial, oportunidadId, onGuardado, onCancelar, revision }: {
  clientes: Cliente[];
  productos: Producto[];
  clienteInicial?: number;
  oportunidadId?: number;
  onGuardado?: () => void;
  onCancelar?: () => void;
  revision?: CotizacionBase;
}) {
  const router = useRouter();
  const nextKey = useRef((revision?.items.length ?? 1) + 1);
  const nuevaLinea = (): Item => ({ key: nextKey.current++, productoId: 0, cantidad: 1, precioUnitario: "0.00", descuento: "0.00" });
  const [clienteId, setClienteId] = useState(revision?.clienteId ?? clienteInicial ?? 0);
  const [items, setItems] = useState<Item[]>(() => revision ? revision.items.map((it, i) => ({ ...it, key: i })) : [{ key: 0, productoId: 0, cantidad: 1, precioUnitario: "0.00", descuento: "0.00" }]);
  const [descuento, setDescuento] = useState(revision?.descuento ?? "0.00");
  const [observaciones, setObservaciones] = useState(revision?.observaciones ?? "");
  const [validezHasta, setValidezHasta] = useState(revision?.validezHasta ?? "");
  const [condicionPago, setCondicionPago] = useState(revision?.condicionPago ?? "");
  const [plazoEntrega, setPlazoEntrega] = useState(revision?.plazoEntrega ?? "");
  const [estado, accion, pendiente] = useActionState(crearCotizacion, undefined);
  const notificado = useRef(false);

  const oportunidadVinculada = revision?.oportunidadId ?? oportunidadId;
  const primeraLinea = items.find((it) => it.productoId !== 0);
  const moneda: "PEN" | "USD" = productos.find((p) => p.id === primeraLinea?.productoId)?.moneda ?? "PEN";
  const productosDisponibles = productos.filter((p) => !primeraLinea || p.moneda === moneda);
  const modificar = (key: number, cambios: Partial<Item>) => setItems((prev) => prev.map((it) => it.key === key ? { ...it, ...cambios } : it));
  const subtotalCent = items.reduce((s, it) => s + Math.round(parse(it.precioUnitario) * 100) * it.cantidad, 0);
  const descuentoLineasCent = items.reduce((s, it) => s + Math.round(parse(it.descuento) * 100), 0);
  const descuentoGeneralCent = Math.round(parse(descuento) * 100);
  const totalCent = subtotalCent - descuentoLineasCent - descuentoGeneralCent;
  const ids = items.map((it) => it.productoId);
  const duplicados = new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length;
  const lineasInvalidas = items.some((it) => !hastaDosDecimales(it.precioUnitario) || !hastaDosDecimales(it.descuento) || !it.productoId || !Number.isInteger(it.cantidad) || it.cantidad <= 0 || it.cantidad > 1000000 || !Number.isFinite(Number(it.precioUnitario)) || parse(it.precioUnitario) < 0 || !Number.isFinite(Number(it.descuento)) || parse(it.descuento) < 0 || Math.round(parse(it.descuento) * 100) > Math.round(parse(it.precioUnitario) * 100) * it.cantidad);
  const invalido = !hastaDosDecimales(descuento) || !clienteId || lineasInvalidas || duplicados || !Number.isFinite(totalCent) || totalCent < 0 || !Number.isSafeInteger(subtotalCent) || !Number.isSafeInteger(totalCent) || parse(descuento) < 0;

  useEffect(() => {
    if (!estado?.ok || notificado.current) return;
    notificado.current = true;
    if (onGuardado) onGuardado(); else router.refresh();
  }, [estado?.ok, onGuardado, router]);

  return <form action={accion} className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-sky-50 p-2.5 text-[#123E70]"><FileText className="h-5 w-5" /></span><div><h2 className="text-xl font-bold text-[#123E70]">{revision ? `Revisión v${revision.version + 1} de COT-${String(revision.id).padStart(5, "0")}` : "Nueva cotización"}</h2><p className="mt-1 text-sm text-slate-500">Prepara una propuesta comercial sin afectar inventario.</p></div></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><CheckCircle2 className="h-3.5 w-3.5" /> Borrador</span>
      </div>
      {oportunidadVinculada && <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-[#123E70]">Vinculada a oportunidad OP-{String(oportunidadVinculada).padStart(4, "0")}. Crear esta propuesta no modifica su etapa.</div>}

      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-bold text-[#123E70]"><CalendarDays className="h-4 w-4" /> Datos comerciales</h3>
        <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Cliente *<select required value={clienteId} disabled={Boolean(oportunidadId || revision)} onChange={(e) => setClienteId(Number(e.target.value))} className={input}><option value={0}>Seleccionar cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}</select></label>
          <div className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-xs text-slate-500">Moneda</p><p className="mt-1 text-sm font-semibold">{moneda === "USD" ? "USD · Dólares" : "PEN · Soles"}</p></div>
          <label className="text-xs font-semibold text-slate-700">Validez hasta<input type="date" value={validezHasta} onChange={(e) => setValidezHasta(e.target.value)} className={input}/></label>
        </div>
      </section>

      <section className="space-y-3"><div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-bold text-[#123E70]"><Package className="h-4 w-4" /> Productos cotizados</h3><span className="text-xs text-slate-500">{items.length}/50 productos</span></div>
        <div className="space-y-3">{items.map((it, i) => {
          const importeCent = Math.round(parse(it.precioUnitario) * 100) * it.cantidad - Math.round(parse(it.descuento) * 100);
          const opciones = productosDisponibles.some((p) => p.id === it.productoId) ? productosDisponibles : [...productosDisponibles, ...productos.filter((p) => p.id === it.productoId)];
          return <div key={it.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Producto {i + 1}</span>{items.length > 1 && <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.key !== it.key))} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800"><Trash2 className="h-3.5 w-3.5"/> Quitar</button>}</div>
            <div className="block text-xs font-semibold text-slate-700">Producto *<SelectorProducto productos={opciones} seleccion={it.productoId} onSeleccionar={(p) => modificar(it.key, { productoId: p.id, precioUnitario: p.precioVenta, descuento: "0.00" })} /></div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-700">Cantidad<input required type="number" min={1} max={1000000} step={1} value={it.cantidad} onChange={(e) => modificar(it.key, { cantidad: Number(e.target.value) })} className={input}/></label><label className="text-xs font-semibold text-slate-700">Precio unit. ({moneda})<input required type="number" min={0} step="0.01" value={it.precioUnitario} onChange={(e) => modificar(it.key, { precioUnitario: e.target.value })} className={input}/></label><label className="text-xs font-semibold text-slate-700">Descuento línea ({moneda})<input type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={it.descuento} onChange={(e) => { const v = e.target.value.replace(",", "."); if (entradaMonetariaValida(v)) modificar(it.key, { descuento: v }); }} onBlur={() => modificar(it.key, { descuento: normalizarMoneda(it.descuento) })} className={input}/></label></div>
            <div className="mt-3 text-right text-sm text-slate-600">Importe de línea: <strong className="text-[#123E70]">{money(importeCent / 100, moneda)}</strong></div>
          </div>;
        })}</div>
        <button type="button" disabled={items.length >= 50} onClick={() => setItems((prev) => [...prev, nuevaLinea()])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-slate-50 disabled:opacity-50"><Plus className="h-4 w-4"/> Añadir producto</button>
        {duplicados && <p className="text-xs text-rose-700">Cada producto solo puede aparecer una vez.</p>}
      </section>

      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-bold text-[#123E70]"><ReceiptText className="h-4 w-4"/> Resumen económico</h3><div className="rounded-xl border border-slate-200 p-4"><label className="block text-xs font-semibold text-slate-700">Descuento general ({moneda})<input type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={descuento} onChange={(e) => { const v = e.target.value.replace(",", "."); if (entradaMonetariaValida(v)) setDescuento(v); }} onBlur={() => setDescuento(normalizarMoneda(descuento))} className={`${input} max-w-52`}/></label><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money(subtotalCent / 100, moneda)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Descuentos por línea</span><strong>- {money(descuentoLineasCent / 100, moneda)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Descuento general</span><strong>- {money(descuentoGeneralCent / 100, moneda)}</strong></div><div className="flex justify-between border-t pt-3 text-base font-bold text-[#123E70]"><span>Total cotizado</span><span>{money(Math.max(0, totalCent) / 100, moneda)}</span></div></div></div></section>

      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-bold text-[#123E70]"><ClipboardList className="h-4 w-4"/> Condiciones comerciales</h3><div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Condición de pago<input maxLength={100} placeholder="Ej. Contado o crédito a 30 días" value={condicionPago} onChange={(e) => setCondicionPago(e.target.value)} className={input}/></label><label className="text-xs font-semibold text-slate-700">Plazo de entrega<input maxLength={150} placeholder="Ej. 3 días hábiles" value={plazoEntrega} onChange={(e) => setPlazoEntrega(e.target.value)} className={input}/></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Observaciones<textarea rows={3} maxLength={3000} placeholder="Detalles y condiciones adicionales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={input}/></label></div></section>
    </div>
    <input type="hidden" name="payload" value={JSON.stringify({ clienteId, oportunidadId: revision ? revision.oportunidadId : oportunidadId ?? null, revisarCotizacionId: revision?.id ?? null, descuento: parse(descuento), observaciones, validezHasta: validezHasta || null, condicionPago, plazoEntrega, items: items.map(({ productoId, cantidad, precioUnitario, descuento: d }) => ({ productoId, cantidad, precioUnitario: parse(precioUnitario), descuento: parse(d) })) })}/>
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-6"><div className="text-sm"><span className="text-slate-500">Total</span><p className="text-lg font-bold text-[#123E70]">{money(Math.max(0, totalCent) / 100, moneda)}</p></div><div className="flex gap-2">{onCancelar && <button type="button" onClick={onCancelar} disabled={pendiente} className="rounded-lg border px-4 py-2.5 text-sm font-medium">Cancelar</button>}<button type="submit" disabled={pendiente || invalido} className="rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD] disabled:cursor-not-allowed disabled:opacity-50">{pendiente ? "Guardando..." : "Guardar borrador"}</button></div></div>
    {(estado?.error || estado?.ok) && <p role={estado.error ? "alert" : "status"} className={`px-5 pb-4 text-sm ${estado.error ? "text-rose-700" : "text-emerald-700"}`}>{estado.error ?? estado.ok}</p>}
  </form>;
}
