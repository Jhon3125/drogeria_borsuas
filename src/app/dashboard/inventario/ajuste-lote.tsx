"use client";

import { useActionState } from "react";
import { registrarAjusteLote, type EstadoAjuste } from "./actions";

type Props = { loteId: number; disponible: number };

export function AjusteLote({ loteId, disponible }: Props) {
  const [estado, accion, pendiente] = useActionState<EstadoAjuste, FormData>(registrarAjusteLote, undefined);
  return (
    <form action={accion} className="mt-3 space-y-2 rounded-lg border bg-secondary/20 p-3">
      <input type="hidden" name="loteId" value={loteId} />
      <label className="block text-xs font-medium" htmlFor={`tipo-${loteId}`}>Tipo de ajuste</label>
      <select id={`tipo-${loteId}`} name="tipo" className="w-full rounded-md border bg-background p-2 text-sm" disabled={pendiente}>
        <option value="AJUSTE_NEGATIVO">Descontar (rotura, pérdida, conteo)</option>
        <option value="AJUSTE_POSITIVO">Agregar (corrección de conteo)</option>
      </select>
      <label className="block text-xs font-medium" htmlFor={`cantidad-${loteId}`}>Cantidad (disponible: {disponible})</label>
      <input id={`cantidad-${loteId}`} name="cantidad" type="number" min="1" max="1000000" step="1" required disabled={pendiente} className="w-full rounded-md border bg-background p-2 text-sm" />
      <label className="block text-xs font-medium" htmlFor={`motivo-${loteId}`}>Motivo obligatorio</label>
      <textarea id={`motivo-${loteId}`} name="motivo" minLength={8} maxLength={500} required disabled={pendiente} placeholder="Describe el conteo físico o la incidencia..." className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" />
      {estado?.error && <p role="alert" className="text-xs text-destructive">{estado.error}</p>}
      {estado?.ok && <p role="status" className="text-xs text-emerald-700">{estado.ok}</p>}
      <button disabled={pendiente} type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pendiente ? "Guardando..." : "Registrar ajuste"}</button>
    </form>
  );
}
