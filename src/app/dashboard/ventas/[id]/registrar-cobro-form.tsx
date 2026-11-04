"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { registrarCobroVenta } from "../registrar-cobro";

export function RegistrarCobroForm({ ventaId, moneda, saldo }: { ventaId: number; moneda: "PEN" | "USD"; saldo: string }) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(registrarCobroVenta, undefined);
  const [clave, setClave] = useState("");
  useEffect(() => { setClave(crypto.randomUUID()); }, []);
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA">("EFECTIVO");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (estado?.ok) {
      setClave(crypto.randomUUID());
      setMonto("");
      router.refresh();
    }
  }, [estado?.ok, router]);

  if (Number(saldo) <= 0) return <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Venta totalmente pagada.</p>;

  const input = "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500";
  return <form action={accion} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <h3 className="font-bold text-[#123E70]">Registrar cobro</h3>
    <p className="text-xs text-slate-500">El pago se registra en la moneda de la venta ({moneda}). Saldo disponible: {moneda === "USD" ? "$" : "S/"} {saldo}.</p>
    <input type="hidden" name="ventaId" value={ventaId} />
    <input type="hidden" name="claveOperacion" value={clave} />
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Monto *
        <input required type="number" name="monto" step="0.01" min="0.01" max={saldo} value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className={input} />
      </label>
      <label className="text-sm font-semibold text-slate-700">Medio de pago *
        <select name="metodoPago" value={metodo} onChange={e => setMetodo(e.target.value as typeof metodo)} className={input}>
          <option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option>
        </select>
      </label>
    </div>
    <label className="block text-sm font-semibold text-slate-700">Referencia {metodo !== "EFECTIVO" ? "*" : "(opcional)"}
      <input name="referencia" maxLength={120} required={metodo !== "EFECTIVO"} placeholder="N° de operación / comprobante" className={input} />
    </label>
    {estado?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{estado.error}</p>}
    {estado?.ok && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{estado.ok}</p>}
    <div className="flex justify-end"><Button type="submit" disabled={pendiente || !clave}>{pendiente ? "Registrando..." : "Confirmar cobro"}</Button></div>
  </form>;
}
