"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearCotizacion } from "./actions";

type Item = { productoId: number; cantidad: number; precioUnitario: string };
type Producto = { id: number; codigo: string; nombre: string; precioVenta: string; moneda: "PEN" | "USD" };
type Cliente = { id: number; razonSocial: string };
const nuevo = (): Item => ({ productoId: 0, cantidad: 1, precioUnitario: "0.00" });

export function CotizacionForm({ clientes, productos, clienteInicial, oportunidadId, onGuardado }: {
  clientes: Cliente[];
  productos: Producto[];
  clienteInicial?: number;
  oportunidadId?: number;
  onGuardado?: () => void;
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clienteInicial ?? 0);
  const [items, setItems] = useState<Item[]>([nuevo()]);
  const [descuento, setDescuento] = useState("0.00");
  const [observaciones, setObservaciones] = useState("");
  const [estado, accion, pendiente] = useActionState(crearCotizacion, undefined);
  const guardadoNotificado = useRef(false);
  const modificar = (indice: number, cambios: Partial<Item>) => setItems((prev) => prev.map((i, j) => j === indice ? { ...i, ...cambios } : i));
  const moneda = productos.find((p) => p.id === items.find((i) => i.productoId)?.productoId)?.moneda ?? "PEN";
  const simbolo = moneda === "USD" ? "US$" : "S/";
  const productosDisponibles = useMemo(() => productos.filter((p) => p.moneda === moneda || !items.some((i) => i.productoId !== 0)), [productos, moneda, items]);
  const subtotal = items.reduce((s, i) => s + i.cantidad * (Number(i.precioUnitario) || 0), 0);
  const total = subtotal - (Number(descuento) || 0);
  useEffect(() => {
    if (!estado?.ok || guardadoNotificado.current) return;
    guardadoNotificado.current = true;
    if (onGuardado) onGuardado();
    else router.refresh();
  }, [estado?.ok, onGuardado, router]);

  return (
    <form action={accion} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><h2 className="text-xl font-bold text-[#123E70]">Nueva cotización</h2><p className="text-sm text-slate-600">Propuesta comercial sin reserva ni descuento de stock.</p></div>
      {oportunidadId && <p className="rounded-lg bg-sky-50 p-3 text-sm text-[#123E70]">Vinculada a oportunidad OP-{String(oportunidadId).padStart(4, "0")}</p>}
      <label className="block text-sm font-semibold">Cliente *
        <select required value={clienteId} disabled={Boolean(oportunidadId)} onChange={(e) => setClienteId(Number(e.target.value))} className="mt-1 block w-full rounded-lg border p-2">
          <option value={0}>Seleccionar cliente</option>
          {clientes.map((c) => <option value={c.id} key={c.id}>{c.razonSocial}</option>)}
        </select>
      </label>
      <div className="space-y-3">{items.map((item, i) => <div key={i} className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-4">
        <label className="text-sm md:col-span-2">Producto
          <select required value={item.productoId} onChange={(e) => { const id = Number(e.target.value); const p = productos.find((x) => x.id === id); modificar(i, { productoId: id, precioUnitario: p?.precioVenta ?? "0.00" }); }} className="mt-1 w-full rounded border p-2">
            <option value={0}>Seleccionar producto</option>
            {productosDisponibles.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre} ({p.moneda})</option>)}
          </select>
        </label>
        <label className="text-sm">Cantidad<input required type="number" min="1" max="1000000" step="1" value={item.cantidad} onChange={(e) => modificar(i, { cantidad: Number(e.target.value) })} className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm">Precio unitario ({simbolo})<input required type="number" min="0" max="99999999" step="0.01" value={item.precioUnitario} onChange={(e) => modificar(i, { precioUnitario: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
        {items.length > 1 && <button type="button" onClick={() => setItems((prev) => prev.filter((_, j) => i !== j))} className="text-left text-sm text-red-700 md:col-span-4">Quitar producto</button>}
      </div>)}</div>
      <button type="button" onClick={() => setItems((prev) => [...prev, nuevo()])} disabled={items.length >= 50} className="rounded-lg border px-4 py-2 text-sm">+ Añadir producto</button>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">Descuento general ({simbolo})<input type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">Subtotal: <b>{simbolo} {subtotal.toFixed(2)}</b></div>
        <div className="rounded-lg bg-sky-50 p-3 text-sm">Total: <b>{simbolo} {Math.max(0, total).toFixed(2)}</b></div>
      </div>
      <label className="block text-sm">Observaciones<textarea rows={2} maxLength={3000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <input type="hidden" name="payload" value={JSON.stringify({ clienteId, oportunidadId: oportunidadId ?? null, observaciones, items: items.map((i) => ({ ...i, precioUnitario: Number(i.precioUnitario) })), descuento: Number(descuento) })} />
      <button type="submit" disabled={pendiente || !clienteId || !items.length || items.some((i) => !i.productoId || !Number.isInteger(i.cantidad) || i.cantidad <= 0) || !Number.isFinite(total) || total < 0} className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando..." : "Registrar cotización"}</button>
      {estado?.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}
      {estado?.ok && <p role="status" className="text-sm text-emerald-700">{estado.ok}</p>}
    </form>
  );
}
