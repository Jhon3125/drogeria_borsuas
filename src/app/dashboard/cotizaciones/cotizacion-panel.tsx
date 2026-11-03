"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, UserPlus, AlertCircle } from "lucide-react";
import { CotizacionForm, type CotizacionBase } from "./form";
import { crearClienteDesdeCRM } from "@/app/dashboard/ventas/crm/actions";

type Cliente = { id: number; razonSocial: string };
type Producto = { id: number; codigo: string; nombre: string; precioVenta: string; moneda: "PEN" | "USD" };

export function CotizacionPanel({
  clientes, productos, revision, clienteInicial, oportunidadId, abrirInicialmente = false, titulo = "Nueva cotización",
}: {
  clientes: Cliente[];
  productos: Producto[];
  revision?: CotizacionBase;
  clienteInicial?: number;
  oportunidadId?: number;
  abrirInicialmente?: boolean;
  titulo?: string;
}) {
  const router = useRouter();
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(abrirInicialmente);
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [clienteCreado, setClienteCreado] = useState<Cliente | null>(null);
  const [claveFormulario, setClaveFormulario] = useState(0);
  useEffect(() => setMontado(true), []);

  function cerrar() {
    setCreandoCliente(false);
    setAbierto(false);
    if (abrirInicialmente) router.replace("/dashboard/cotizaciones", { scroll: false });
  }

  return <>
    <button type="button" onClick={() => { setClienteCreado(null); setClaveFormulario(k => k + 1); setAbierto(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]">
      <Plus className="h-4 w-4" /> Nueva cotización
    </button>
    {montado && abierto && createPortal(
      <div className="fixed inset-0 z-[120]" role="presentation" onKeyDown={e => { if (e.key === "Escape" && !creandoCliente) cerrar(); }}>
        <button type="button" aria-label="Cerrar formulario de cotización" onClick={cerrar} className="absolute inset-0 bg-slate-950/70 backdrop-blur-[4px]" />
        <aside role="dialog" aria-modal="true" aria-label={titulo} className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
          <header className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-4">
            <div><p className="text-xs font-semibold text-sky-700">Comercial y ventas / Cotizaciones</p><h2 className="text-lg font-bold text-[#123E70]">{titulo}</h2></div>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {clienteCreado && <div role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">{clienteCreado.razonSocial} se registró como prospecto.</p>
              <p className="mt-1">Para poder cotizar, completa el primer contacto y la calificación comercial en Oportunidades. El registro no se seleccionará hasta entonces.</p>
              <Link href="/dashboard/ventas/crm" className="mt-2 inline-block font-semibold underline">Ir al CRM</Link>
            </div>}
            <CotizacionForm key={`${revision?.id ?? "nueva"}-${claveFormulario}`} clientes={clientes} productos={productos} revision={revision}
              clienteInicial={clienteInicial} oportunidadId={oportunidadId} onCrearCliente={() => setCreandoCliente(true)} onCancelar={cerrar}
              onGuardado={() => { cerrar(); router.refresh(); }} />
          </div>
        </aside>
        {creandoCliente && <NuevoClienteCotizacion onCerrar={() => setCreandoCliente(false)} onCreado={cliente => { setCreandoCliente(false); setClienteCreado(cliente); router.refresh(); }} />}
      </div>, document.body
    )}
  </>;
}

function NuevoClienteCotizacion({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: (cliente: Cliente) => void }) {
  const [estado, accion, pendiente] = useActionState(crearClienteDesdeCRM, undefined);
  const notificado = useRef(false);
  useEffect(() => {
    if (estado?.cliente && !notificado.current) {
      notificado.current = true;
      onCreado(estado.cliente);
    }
  }, [estado?.cliente, onCreado]);
  const campo = "mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200";
  return <div className="fixed inset-0 z-[180] flex items-center justify-center p-4" role="presentation">
    <button type="button" aria-label="Cerrar registro de cliente" onClick={onCerrar} className="absolute inset-0 bg-slate-950/70 backdrop-blur-[4px]" />
    <section role="dialog" aria-modal="true" aria-label="Nuevo cliente" className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-2"><div><h3 className="flex items-center gap-2 text-lg font-bold text-[#123E70]"><UserPlus className="h-5 w-5"/> Nuevo cliente</h3><p className="mt-1 text-sm text-slate-500">Registra el cliente sin salir de la cotización.</p></div><button onClick={onCerrar} aria-label="Cerrar" type="button"><X className="h-5 w-5"/></button></div>
      <div className="mb-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle className="h-4 w-4 shrink-0"/><span>Se registrará como prospecto. La cotización requerirá primer contacto y calificación comercial previos.</span></div>
      <form action={accion} className="space-y-3">
        <label className="block text-sm font-semibold">Nombre o razón social *<input required name="razonSocial" minLength={2} maxLength={180} className={campo}/></label>
        <label className="block text-sm font-semibold">DNI o RUC *<input required name="documento" pattern="(?:[0-9]{8}|[0-9]{11})" inputMode="numeric" className={campo}/></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Teléfono<input name="telefono" maxLength={30} className={campo}/></label><label className="block text-sm font-semibold">Correo<input name="correo" type="email" className={campo}/></label></div>
        <label className="block text-sm font-semibold">Dirección<textarea name="direccion" maxLength={300} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"/></label>
        {estado?.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{estado.error}</p>}
        <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={onCerrar} disabled={pendiente} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button><button type="submit" disabled={pendiente} className="rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Registrando..." : "Crear cliente"}</button></div>
      </form>
    </section>
  </div>;
}
