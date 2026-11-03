"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";
import { EstadoCotizacionBadge } from "@/app/dashboard/cotizaciones/estado-badge";
import type { CotizacionBase } from "@/app/dashboard/cotizaciones/form";

type Estado = "BORRADOR" | "EMITIDA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | "ANULADA";

export type CotizacionVista = {
  id: number;
  version: number;
  estado: Estado;
  moneda: string;
  importeTotal: string;
  fecha: string;
  validezHasta: string | null;
  revision: CotizacionBase;
};

type ProductoVista = { id: number; codigo: string; nombre: string };

function dinero(valor: number, moneda: string) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda === "USD" ? "USD" : "PEN" }).format(valor);
}

function fechaCorta(valor?: string | null) {
  if (!valor) return "Sin fecha definida";
  const f = valor.slice(0, 10);
  const partes = f.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : f;
}

export function DetalleCotizacionDrawer({
  cotizacion,
  cliente,
  productos,
  onCerrar,
}: {
  cotizacion: CotizacionVista | null;
  cliente: string;
  productos: ProductoVista[];
  onCerrar: () => void;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);
  useEffect(() => {
    if (!cotizacion) return;
    const alTeclado = (ev: KeyboardEvent) => { if (ev.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [cotizacion, onCerrar]);

  if (!montado || !cotizacion) return null;

  const x = cotizacion;
  const moneda = x.moneda;
  const listaProductos = new Map(productos.map(p => [p.id, p]));
  const subtotal = x.revision.items.reduce((s, i) => s + i.cantidad * Number(i.precioUnitario), 0);
  const descuentosLinea = x.revision.items.reduce((s, i) => s + Number(i.descuento), 0);
  const descuentoGeneral = Number(x.revision.descuento);

  return createPortal(
    <div className="fixed inset-0 z-[150]" role="presentation">
      <button type="button" tabIndex={-1} aria-label="Cerrar detalle de cotización" onClick={onCerrar} className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px]" />
      <aside role="dialog" aria-modal="true" aria-label={`Detalle de cotización COT-${String(x.id).padStart(5, "0")}`} className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b bg-white px-5 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-700">COT-{String(x.id).padStart(5, "0")} · Versión {x.version}</p>
            <h2 className="text-lg font-bold text-[#123E70]">Detalle de cotización</h2>
            <p className="text-sm text-slate-600">{cliente}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><EstadoCotizacionBadge estado={x.estado} /><p className="text-xl font-bold text-[#123E70]">{dinero(Number(x.importeTotal), moneda)}</p></div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Registrada</p>{fechaCorta(x.fecha)}</div><div><p className="text-xs text-slate-500">Válida hasta</p>{fechaCorta(x.validezHasta)}</div><div><p className="text-xs text-slate-500">Moneda</p>{moneda}</div><div><p className="text-xs text-slate-500">Versión</p>v{x.version}</div></div>
          </section>
          <section className="space-y-3"><h3 className="font-bold text-[#123E70]">Productos cotizados</h3>
            {x.revision.items.map((i, pos) => {
              const producto = listaProductos.get(i.productoId);
              const importe = i.cantidad * Number(i.precioUnitario) - Number(i.descuento);
              return <div key={`${i.productoId}-${pos}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold text-slate-900">{producto ? `${producto.codigo} · ${producto.nombre}` : `Producto #${i.productoId}`}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-4"><span>Cantidad: <strong>{i.cantidad}</strong></span><span>P. unit.: <strong>{dinero(Number(i.precioUnitario), moneda)}</strong></span><span>Descuento: <strong>{dinero(Number(i.descuento), moneda)}</strong></span><span>Importe: <strong>{dinero(importe, moneda)}</strong></span></div>
              </div>;
            })}
          </section>
          <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="mb-2 font-bold text-[#123E70]">Resumen económico</h3>
            <div className="flex justify-between"><span>Subtotal</span><strong>{dinero(subtotal, moneda)}</strong></div>
            <div className="flex justify-between"><span>Descuentos por línea</span><strong>- {dinero(descuentosLinea, moneda)}</strong></div>
            <div className="flex justify-between"><span>Descuento general</span><strong>- {dinero(descuentoGeneral, moneda)}</strong></div>
            <div className="flex justify-between border-t pt-2 font-bold text-[#123E70]"><span>Total</span><span>{dinero(Number(x.importeTotal), moneda)}</span></div>
          </section>
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="font-bold text-[#123E70]">Condiciones comerciales</h3>
            <p><strong>Pago:</strong> {x.revision.condicionPago || "No especificada"}</p>
            <p><strong>Entrega:</strong> {x.revision.plazoEntrega || "No especificado"}</p>
            <p className="whitespace-pre-wrap"><strong>Observaciones:</strong> {x.revision.observaciones || "Sin observaciones"}</p>
          </section>
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t bg-white px-5 py-4">
          <button type="button" onClick={onCerrar} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">Cerrar</button>
          <a target="_blank" rel="noopener noreferrer" href={`/dashboard/cotizaciones/${x.id}/pdf`} className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#087EBD]"><FileText className="h-4 w-4" /> Ver PDF</a>
        </footer>
      </aside>
    </div>, document.body
  );
}
