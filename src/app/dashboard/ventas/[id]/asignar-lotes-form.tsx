"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { asignarLotesVenta } from "./actions";

type LoteDisponible = { id: number; numeroLote: string; libre: number; vencimiento: string };

export function AsignarLotesForm({ ventaId, detalleId, cantidad, lotes, asignaciones }: {
  ventaId: number;
  detalleId: number;
  cantidad: number;
  lotes: LoteDisponible[];
  asignaciones: { loteId: number; cantidad: number }[];
}) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Record<number, string>>(
    () => Object.fromEntries(asignaciones.map((x) => [x.loteId, String(x.cantidad)])),
  );
  const [estado, accion, pendiente] = useActionState(asignarLotesVenta, undefined);
  useEffect(() => { if (estado?.ok) router.refresh(); }, [estado?.ok, router]);

  const filas = Object.entries(seleccion)
    .filter(([, valor]) => valor.trim() !== "")
    .map(([id, valor]) => ({ loteId: Number(id), cantidad: Number(valor) }));
  const total = filas.reduce((s, x) => s + x.cantidad, 0);
  const pendientePorAsignar = Math.max(0, cantidad - total);
  const valido = filas.length <= 100 && filas.every((x) =>
    Number.isSafeInteger(x.loteId) && Number.isSafeInteger(x.cantidad) && x.cantidad > 0 &&
    x.cantidad <= (lotes.find((l) => l.id === x.loteId)?.libre ?? -1),
  ) && Number.isSafeInteger(total) && total <= cantidad &&
    (filas.length > 0 || asignaciones.length > 0);

  return <form action={accion} className="mt-4 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-slate-600">Orden sugerido: <strong>FEFO</strong> (primer lote en vencer, primero en preparar).</p>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pendientePorAsignar === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
        {pendientePorAsignar === 0 ? "Cantidad completamente asignada" : `Pendientes: ${pendientePorAsignar}`}
      </span>
    </div>
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {lotes.map((l, indice) => <label key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-slate-800">Lote {l.numeroLote}</strong>
            {indice === 0 && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">FEFO sugerido</span>}
          </span>
          <span className="block text-xs text-slate-500">Vence: {l.vencimiento.split("-").reverse().join("/")} · Libre para esta línea: {l.libre}</span>
        </span>
        <input type="number" min="0" max={Math.min(cantidad, l.libre)} step="1"
          value={seleccion[l.id] ?? ""}
          onChange={(e) => setSeleccion((prev) => ({ ...prev, [l.id]: e.target.value }))}
          className="w-24 rounded-md border border-slate-300 bg-white px-2 py-2 text-right outline-none focus:border-sky-500"
          aria-label={`Cantidad del lote ${l.numeroLote}`} placeholder="0" />
      </label>)}
      {lotes.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No hay lotes aptos para este producto. Verifica vencimientos, calidad, retenciones y existencias.</p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
      <p className="text-sm text-slate-700">Total asignado: <strong>{total} / {cantidad}</strong></p>
      <div className="flex flex-wrap gap-2">
        {asignaciones.length > 0 && <button type="button" onClick={() => setSeleccion({})} disabled={pendiente}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Quitar todas
        </button>}
        <button type="submit" disabled={!valido || pendiente}
          className="rounded-lg bg-[#123E70] px-3 py-2 text-sm font-semibold text-white hover:bg-[#087EBD] disabled:opacity-50">
          {pendiente ? "Guardando..." : filas.length === 0 ? "Confirmar retiro" : "Guardar asignación"}
        </button>
      </div>
    </div>
    <input type="hidden" name="payload" value={JSON.stringify({ ventaId, detalleVentaId: detalleId, lotes: filas })} />
    <p className="text-xs text-slate-500">Puedes asignar parcialmente. Las cantidades se verifican de nuevo al guardar; aún no se descuenta stock físico.</p>
    {estado?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{estado.error}</p>}
    {estado?.ok && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{estado.ok}</p>}
  </form>;
}
