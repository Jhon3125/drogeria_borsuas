"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Wallet, X } from "lucide-react";
import { RegistrarCobroForm } from "@/app/dashboard/ventas/[id]/registrar-cobro-form";

type VentaCobro = {
  id: number;
  cliente: string;
  moneda: "PEN" | "USD";
  saldo: string;
  total: string;
};

export function RegistrarCobroDrawer({ venta }: { venta: VentaCobro }) {
  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (!abierto) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", cerrar);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", cerrar); };
  }, [abierto]);

  if (Number(venta.saldo) <= 0) return <span className="text-xs font-medium text-emerald-700">Pagada</span>;

  return <>
    <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#123E70] px-3 py-2 text-xs font-semibold text-white hover:bg-[#087EBD]">
      <Wallet className="h-3.5 w-3.5" /> Registrar cobro
    </button>
    {montado && abierto && createPortal(
      <div className="fixed inset-0 z-[300] flex justify-end">
        <button type="button" aria-label="Cerrar panel" onClick={() => setAbierto(false)} className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
        <section role="dialog" aria-modal="true" aria-label={`Cobrar venta ${venta.id}`} className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-semibold text-sky-700">Finanzas / Cuentas por cobrar</p>
              <h2 className="mt-1 text-xl font-bold text-[#123E70]">Cobrar venta #{venta.id}</h2>
              <p className="mt-1 text-sm text-slate-600">{venta.cliente}</p>
            </div>
            <button aria-label="Cerrar" type="button" onClick={() => setAbierto(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total vendido</p><p className="mt-1 font-bold text-[#123E70]">{venta.moneda} {venta.total}</p></div>
              <div className="rounded-xl bg-sky-50 p-4"><p className="text-xs text-sky-700">Saldo por cobrar</p><p className="mt-1 font-bold text-[#123E70]">{venta.moneda} {venta.saldo}</p></div>
            </div>
            <RegistrarCobroForm ventaId={venta.id} moneda={venta.moneda} saldo={venta.saldo} />
            <p className="text-xs leading-5 text-slate-500">El cobro se registra en la moneda original de la venta. No se permite superar el saldo pendiente; la transacción del servidor evita cobros duplicados.</p>
          </div>
        </section>
      </div>, document.body
    )}
  </>;
}
