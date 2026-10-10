"use client";

import { useActionState, useState } from "react";
import { crearCompra } from "./actions";

type Item = {
  productoId: number;
  cantidad: number;
  precioUnitario: string;
  numeroLote: string;
  fechaVencimiento: string;
};

type Opcion = {
  id: number;
  nombre: string;
  codigo: string;
  precioCompra: string | number;
  moneda: "PEN" | "USD";
};

const vacio = (): Item => ({
  productoId: 0,
  cantidad: 1,
  precioUnitario: "0.00",
  numeroLote: "",
  fechaVencimiento: "",
});

function costoInicial(precio: string | number): string {
  const numero = Number(precio);
  return Number.isFinite(numero) && numero >= 0 ? numero.toFixed(2) : "0.00";
}

export function CompraForm({
  proveedores,
  productos,
}: {
  proveedores: { id: number; razonSocial: string }[];
  productos: Opcion[];
}) {
  const [items, setItems] = useState<Item[]>([vacio()]);
  const [proveedorId, setProveedorId] = useState(0);
  const [state, action, pending] = useActionState(crearCompra, undefined);

  const seleccionarProducto = (pos: number, productoId: number) => {
    const producto = productos.find((p) => p.id === productoId);
    setItems((prev) =>
      prev.map((item, index) =>
        index === pos
          ? {
              ...item,
              productoId,
              precioUnitario: producto ? costoInicial(producto.precioCompra) : "0.00",
            }
          : item
      )
    );
  };

  const actualizar = (pos: number, campo: Exclude<keyof Item, "productoId">, valor: string) => {
    setItems((prev) =>
      prev.map((item, index) =>
        index === pos
          ? { ...item, [campo]: campo === "cantidad" ? Number(valor) : valor }
          : item
      )
    );
  };

  const monedasElegidas = new Set(
    items.map((item) => productos.find((p) => p.id === item.productoId)?.moneda).filter(Boolean)
  );
  const monedasMezcladas = monedasElegidas.size > 1;
  const contieneUSD = monedasElegidas.has("USD");
  const subtotal = items.reduce((total, item) => {
    const linea = item.cantidad * Number(item.precioUnitario);
    return total + (Number.isFinite(linea) ? linea : 0);
  }, 0);
  const payload = JSON.stringify({ proveedorId, items });
  const itemsInvalidos = items.some(
    (item) =>
      !item.productoId ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad <= 0 ||
      !/^\d{1,9}(\.\d{1,2})?$/.test(item.precioUnitario) ||
      !item.numeroLote.trim() ||
      !item.fechaVencimiento
  );

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Registrar compra</h2>
      <p className="text-sm text-slate-600">
        La compra queda pendiente. No modifica stock hasta confirmar la recepción.
      </p>
      <label className="block text-sm font-semibold">
        Proveedor
        <select
          required
          className="mt-1 block w-full rounded-lg border p-2"
          value={proveedorId}
          onChange={(e) => setProveedorId(Number(e.target.value))}
        >
          <option value={0}>Seleccionar proveedor</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.razonSocial}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-3">
        {items.map((item, index) => {
          const producto = productos.find((p) => p.id === item.productoId);
          return (
            <div key={index} className="grid gap-2 rounded-lg border bg-slate-50 p-3 md:grid-cols-5">
              <label className="text-xs">
                Producto
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={item.productoId}
                  onChange={(e) => seleccionarProducto(index, Number(e.target.value))}
                >
                  <option value={0}>Seleccionar</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} — {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="mt-1 w-full rounded border p-2"
                  value={item.cantidad}
                  onChange={(e) => actualizar(index, "cantidad", e.target.value)}
                />
              </label>
              <label className="text-xs">
                Costo unitario {producto ? `(${producto.moneda === "USD" ? "US$" : "S/"})` : ""}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded border p-2"
                  value={item.precioUnitario}
                  onChange={(e) => actualizar(index, "precioUnitario", e.target.value)}
                />
                {producto && <span className="mt-1 block text-slate-500">Sugerido desde Productos; editable.</span>}
              </label>
              <label className="text-xs">
                N.º lote
                <input
                  className="mt-1 w-full rounded border p-2"
                  value={item.numeroLote}
                  onChange={(e) => actualizar(index, "numeroLote", e.target.value)}
                />
              </label>
              <label className="text-xs">
                Vencimiento
                <input
                  type="date"
                  className="mt-1 w-full rounded border p-2"
                  value={item.fechaVencimiento}
                  onChange={(e) => actualizar(index, "fechaVencimiento", e.target.value)}
                />
              </label>
              {items.length > 1 && (
                <button
                  type="button"
                  className="text-left text-sm text-red-700 md:col-span-5"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  Quitar línea
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="rounded-lg border px-4 py-2"
        onClick={() => setItems((prev) => [...prev, vacio()])}
      >
        + Añadir producto
      </button>
      {monedasMezcladas && (
        <p role="alert" className="text-sm text-red-700">
          Esta compra mezcla PEN y USD. Se necesita definir la moneda de compra y tipo de cambio antes de continuar.
        </p>
      )}
      {contieneUSD && !monedasMezcladas && (
        <p role="alert" className="text-sm text-amber-800">
          Este producto está en USD. El modelo actual de Compra no registra la moneda de operación; no se debe guardar como soles.
        </p>
      )}
      {!monedasMezcladas && !contieneUSD && (
        <p className="text-sm font-semibold text-slate-700">Total estimado: S/ {subtotal.toFixed(2)}</p>
      )}
      <input type="hidden" name="payload" value={payload} />
      <button
        disabled={pending || !proveedorId || itemsInvalidos || monedasMezcladas || contieneUSD}
        className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Registrar compra pendiente"}
      </button>
      {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-green-700">{state.ok}</p>}
    </form>
  );
}
