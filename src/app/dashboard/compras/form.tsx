"use client";

import { useActionState, useState } from "react";
import { crearCompra } from "./actions";

type Moneda = "PEN" | "USD";
type Item = {
  productoId: number;
  cantidad: number;
  precioUnitario: string;
  numeroLote: string;
  fechaVencimiento: string;
  precioManual: boolean; // solo estado del navegador; NO se guarda en la BD
};
type Opcion = {
  id: number;
  nombre: string;
  codigo: string;
  precioCompra: string;
  moneda: Moneda;
};

const simbolo = (moneda: Moneda) => (moneda === "USD" ? "US$" : "S/");
const vacio = (): Item => ({
  productoId: 0, cantidad: 1, precioUnitario: "", numeroLote: "",
  fechaVencimiento: "", precioManual: false,
});

function sugerirCosto(producto: Opcion | undefined, moneda: Moneda, tc: string) {
  if (!producto) return "";
  const base = Number(producto.precioCompra);
  if (!Number.isFinite(base) || base < 0) return "";
  if (producto.moneda === moneda) return base.toFixed(2);
  const tasa = Number(tc);
  if (!Number.isFinite(tasa) || tasa <= 0) return "";
  const resultado = producto.moneda === "USD" ? base * tasa : base / tasa;
  return Number.isFinite(resultado) && resultado >= 0 ? resultado.toFixed(2) : "";
}

export function CompraForm({
  proveedores,
  productos,
}: {
  proveedores: { id: number; razonSocial: string }[];
  productos: Opcion[];
}) {
  const [proveedorId, setProveedorId] = useState(0);
  const [moneda, setMoneda] = useState<Moneda>("PEN");
  const [tipoCambio, setTipoCambio] = useState("");
  const [items, setItems] = useState<Item[]>([vacio()]);
  const [state, action, pending] = useActionState(crearCompra, undefined);

  const cambiarMoneda = (siguiente: Moneda) => {
    setMoneda(siguiente);
    // Evitamos reutilizar accidentalmente importes digitados en otra moneda.
    setItems(prev => prev.map(item => ({
      ...item,
      precioUnitario: sugerirCosto(productos.find(p => p.id === item.productoId), siguiente, tipoCambio),
      precioManual: false,
    })));
  };

  const cambiarTipoCambio = (valor: string) => {
    setTipoCambio(valor);
    setItems(prev => prev.map(item => item.precioManual ? item : ({
      ...item,
      precioUnitario: sugerirCosto(productos.find(p => p.id === item.productoId), moneda, valor),
    })));
  };

  const seleccionarProducto = (pos: number, id: number) => {
    const producto = productos.find(p => p.id === id);
    setItems(prev => prev.map((item, i) => i === pos ? ({
      ...item,
      productoId: id,
      precioUnitario: sugerirCosto(producto, moneda, tipoCambio),
      precioManual: false,
    }) : item));
  };

  const actualizar = (pos: number, campo: "cantidad" | "numeroLote" | "fechaVencimiento" | "precioUnitario", valor: string) => {
    setItems(prev => prev.map((item, i) => i !== pos ? item : ({
      ...item,
      [campo]: campo === "cantidad" ? Number(valor) : valor,
      precioManual: campo === "precioUnitario" ? true : item.precioManual,
    })));
  };

  const requiereCambio = items.some(item => {
    const producto = productos.find(p => p.id === item.productoId);
    return producto != null && producto.moneda !== moneda;
  });
  const tasaValida = /^\d{1,5}(\.\d{1,6})?$/.test(tipoCambio) && Number(tipoCambio) > 0;
  const itemsInvalidos = items.some(item =>
    !item.productoId || !Number.isSafeInteger(item.cantidad) || item.cantidad < 1 ||
    !/^\d{1,9}(\.\d{1,2})?$/.test(item.precioUnitario) ||
    !item.numeroLote.trim() || !item.fechaVencimiento
  );
  const total = items.reduce((suma, item) => suma + Number(item.precioUnitario || 0) * item.cantidad, 0);
  const payload = JSON.stringify({
    proveedorId,
    moneda,
    tipoCambio: requiereCambio ? tipoCambio : "",
    items: items.map(({ precioManual: _omit, ...item }) => item),
  });

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-[#123E70]">Registrar compra</h2>
      <p className="text-sm text-slate-600">La compra queda pendiente y no aumenta el stock hasta confirmar su recepción.</p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Proveedor
          <select required className="mt-1 block w-full rounded-lg border p-2" value={proveedorId} onChange={e => setProveedorId(Number(e.target.value))}>
            <option value={0}>Seleccionar proveedor</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Moneda de la compra
          <select className="mt-1 block w-full rounded-lg border p-2" value={moneda} onChange={e => cambiarMoneda(e.target.value as Moneda)}>
            <option value="PEN">Soles (PEN · S/)</option>
            <option value="USD">Dólares (USD · US$)</option>
          </select>
        </label>
      </div>

      {requiereCambio && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label className="block text-sm font-semibold text-amber-950">
            Tipo de cambio (1 USD = cuántos soles)
            <input
              type="number" min="0.000001" step="0.000001" inputMode="decimal"
              className="mt-1 block w-full rounded-lg border bg-white p-2 sm:max-w-56"
              placeholder="Ejemplo: 3.750000"
              value={tipoCambio}
              onChange={e => cambiarTipoCambio(e.target.value)}
            />
          </label>
          <p className="mt-1 text-xs text-amber-900">
            Ingresa el tipo de cambio pactado; el sistema no consulta una tasa automática. Los costos convertidos son sugeridos y editables.
          </p>
          {!tasaValida && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">Ingresa un tipo de cambio válido para continuar.</p>}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => {
          const producto = productos.find(p => p.id === item.productoId);
          return (
            <div key={index} className="grid gap-2 rounded-lg border bg-slate-50 p-3 md:grid-cols-5">
              <label className="text-xs">Producto
                <select className="mt-1 w-full rounded border p-2" value={item.productoId} onChange={e => seleccionarProducto(index, Number(e.target.value))}>
                  <option value={0}>Seleccionar</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre} ({simbolo(p.moneda)})</option>)}
                </select>
              </label>
              <label className="text-xs">Cantidad
                <input type="number" min="1" step="1" className="mt-1 w-full rounded border p-2" value={item.cantidad} onChange={e => actualizar(index, "cantidad", e.target.value)} />
              </label>
              <label className="text-xs">Costo unitario ({simbolo(moneda)})
                <input type="number" min="0" step="0.01" className="mt-1 w-full rounded border p-2" placeholder="0.00" value={item.precioUnitario} onChange={e => actualizar(index, "precioUnitario", e.target.value)} />
                {producto && <span className="mt-1 block text-slate-500">Catálogo: {simbolo(producto.moneda)} {Number(producto.precioCompra).toFixed(2)} · sugerido editable</span>}
              </label>
              <label className="text-xs">N.º lote
                <input className="mt-1 w-full rounded border p-2" value={item.numeroLote} onChange={e => actualizar(index, "numeroLote", e.target.value)} />
              </label>
              <label className="text-xs">Vencimiento
                <input type="date" className="mt-1 w-full rounded border p-2" value={item.fechaVencimiento} onChange={e => actualizar(index, "fechaVencimiento", e.target.value)} />
              </label>
              {items.length > 1 && (
                <button type="button" className="text-left text-sm text-red-700 md:col-span-5" onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}>Quitar línea</button>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="rounded-lg border px-4 py-2" onClick={() => setItems(prev => [...prev, vacio()])}>+ Añadir producto</button>
      <div className="text-sm font-semibold text-[#123E70]">Total estimado: {simbolo(moneda)} {Number.isFinite(total) ? total.toFixed(2) : "0.00"}</div>
      <input type="hidden" name="payload" value={payload} />
      <button
        disabled={pending || !proveedorId || itemsInvalidos || (requiereCambio && !tasaValida)}
        className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >{pending ? "Guardando..." : "Registrar compra pendiente"}</button>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
    </form>
  );
}
