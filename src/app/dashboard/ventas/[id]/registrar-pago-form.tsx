"use client";

import { useState } from "react";
import { registrarPagoVenta } from "./actions";

export function RegistrarPagoForm({ ventaId, saldo, moneda }: { ventaId: number; saldo: string; moneda: string }) {
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const formateado = new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda === "USD" ? "USD" : "PEN" }).format(Number(saldo));
  return <form action={async form => {
    setEnviando(true); setError("");
    try {
      await registrarPagoVenta(form);
      setClave(crypto.randomUUID());
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo registrar el pago."); }
    finally { setEnviando(false); }
  }} className="grid gap-3 sm:grid-cols-3">
    <input type="hidden" name="ventaId" value={ventaId}/>
    <input type="hidden" name="claveIdempotencia" value={clave}/>
    <label className="space-y-1 text-sm font-medium">Monto recibido ({moneda})<input name="monto" required type="number" min="0.01" step="0.01" max={saldo} defaultValue={saldo} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <label className="space-y-1 text-sm font-medium">Método de cobro<select name="metodoPago" className="w-full rounded-lg border border-slate-300 px-3 py-2" required><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia (incluye billeteras)</option><option value="TARJETA">Tarjeta</option></select></label>
    <div className="flex items-end"><button type="submit" disabled={enviando} className="w-full rounded-lg bg-[#123E70] px-4 py-2 font-semibold text-white disabled:opacity-50">{enviando ? "Registrando..." : "Registrar pago"}</button></div>
    {error && <p role="alert" className="sm:col-span-3 text-sm text-red-700">{error}</p>}
    <p className="text-xs text-slate-500 sm:col-span-3">Saldo actual: {formateado}. Registra solo dinero realmente recibido. Para pagos de prueba, usa una base de datos de pruebas.</p>
  </form>;
}
