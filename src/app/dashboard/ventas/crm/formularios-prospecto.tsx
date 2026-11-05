"use client";

import { createPortal } from "react-dom";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { registrarActividadProspecto, calificarClienteDesdeOportunidad, completarDatosProspecto } from "./acciones-prospecto";

// Portal fuera del drawer: impide que sus capas/overflow oculten el formulario.
function PortalFormulario({ titulo, descripcion, children, onCerrar, pendiente = false }: {
  titulo: string; descripcion: string; children: ReactNode; onCerrar: () => void; pendiente?: boolean;
}) {
  const [montado, setMontado] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setMontado(true); }, []);
  useEffect(() => {
    if (!montado) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); if (!pendiente) onCerrar(); }
      if (e.key === "Tab" && panelRef.current) {
        const elementos = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')].filter(e => e.getClientRects().length > 0);
        if (!elementos.length) { e.preventDefault(); return; }
        const primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (e.shiftKey && (document.activeElement === primero || document.activeElement === panelRef.current)) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    }
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("keydown", tecla); anterior?.focus(); };
  }, [montado, pendiente, onCerrar]);
  if (!montado) return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar formulario" tabIndex={-1} disabled={pendiente} onClick={onCerrar} className="absolute inset-0 bg-slate-950/75 backdrop-blur-[4px]" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_28px_90px_rgba(2,6,23,0.4)] outline-none">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold text-[#123E70]">{titulo}</h2><p className="mt-1 text-sm text-slate-500">{descripcion}</p></div>
          <button type="button" disabled={pendiente} onClick={onCerrar} className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

export function FormularioContacto({ oportunidadId, abierto, onCerrar, onGuardado }: {
  oportunidadId: number; abierto: boolean; onCerrar: () => void; onGuardado?: (efectivo: boolean) => void;
}) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(registrarActividadProspecto, undefined);
  const [resultado, setResultado] = useState("CONTACTO_EFECTIVO");
  const enviado = useRef(false);
  useEffect(() => {
    if (estado?.ok && !enviado.current) {
      enviado.current = true;
      router.refresh();
      if (onGuardado) onGuardado(resultado === "CONTACTO_EFECTIVO"); else onCerrar();
    }
  }, [estado?.ok, router, onCerrar, onGuardado, resultado]);
  if (!abierto) return null;
  return <PortalFormulario titulo="Registrar contacto comercial" descripcion="Una llamada sin respuesta no cambia la etapa de la oportunidad." onCerrar={onCerrar} pendiente={pendiente}>
    <form action={accion} className="space-y-4">
      <input name="oportunidadId" type="hidden" value={oportunidadId} />
      <label className="block text-sm font-semibold">Medio de contacto<select name="tipo" className="mt-1 w-full rounded-lg border p-2" defaultValue="LLAMADA"><option value="LLAMADA">Llamada</option><option value="WHATSAPP">WhatsApp</option><option value="CORREO">Correo</option><option value="VISITA">Visita</option><option value="OTRO">Otro</option></select></label>
      <label className="block text-sm font-semibold">Resultado<select name="resultado" className="mt-1 w-full rounded-lg border p-2" value={resultado} onChange={e => setResultado(e.target.value)}><option value="CONTACTO_EFECTIVO">Contacto efectivo</option><option value="SIN_RESPUESTA">Sin respuesta</option><option value="REPROGRAMADO">Solicitó reprogramar</option><option value="SIN_INTERES">Sin interés</option></select></label>
      <label className="block text-sm font-semibold">Persona contactada<input name="personaContacto" maxLength={120} className="mt-1 w-full rounded-lg border p-2" placeholder="Nombre del encargado" /></label>
      <label className="block text-sm font-semibold">Observaciones<textarea name="observaciones" required minLength={10} maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border p-2" placeholder="Describe el contacto y sus resultados" /></label>
      {estado?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pendiente} onClick={onCerrar}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Guardando..." : "Registrar actividad"}</Button></div>
    </form>
  </PortalFormulario>;
}

export function FormularioCalificacion({ oportunidadId, abierto, onCerrar }: {
  oportunidadId: number; abierto: boolean; onCerrar: () => void;
}) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(calificarClienteDesdeOportunidad, undefined);
  const enviado = useRef(false);
  useEffect(() => { if (estado?.ok && !enviado.current) { enviado.current = true; router.refresh(); onCerrar(); } }, [estado?.ok, router, onCerrar]);
  if (!abierto) return null;
  return <PortalFormulario titulo="Calificar cliente" descripcion="Requiere contacto efectivo y datos comerciales completos. Al aprobar, la oportunidad avanzará a Contactado." onCerrar={onCerrar} pendiente={pendiente}>
    <form action={accion} className="space-y-4">
      <input type="hidden" name="oportunidadId" value={oportunidadId} />
      <label className="block text-sm font-semibold">Persona responsable<input name="personaContacto" required minLength={2} maxLength={120} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-semibold">Necesidad identificada<textarea name="necesidad" required minLength={10} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="interesConfirmado" value="si" required className="mt-1" /><span>Confirmo que el cliente manifestó interés y sus datos fueron verificados.</span></label>
      {estado?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pendiente} onClick={onCerrar}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Validando..." : "Calificar cliente"}</Button></div>
    </form>
  </PortalFormulario>;
}

export type DatosProspecto = { razonSocial: string; documento: string | null; telefono: string | null; correo: string | null; direccion: string | null };
export function FormularioDatosProspecto({ oportunidadId, datos, onCerrar, onGuardado }: {
  oportunidadId: number; datos: DatosProspecto; onCerrar: () => void; onGuardado: () => void;
}) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(completarDatosProspecto, undefined);
  const enviado = useRef(false);
  useEffect(() => { if (estado?.ok && !enviado.current) { enviado.current = true; router.refresh(); onGuardado(); } }, [estado?.ok, router, onGuardado]);
  const campo = "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200";
  return <PortalFormulario titulo="Convertir a cliente" descripcion="Completa los datos comerciales necesarios para continuar con el contacto y la calificación." onCerrar={onCerrar} pendiente={pendiente}>
    <form action={accion} className="space-y-4">
      <input type="hidden" name="oportunidadId" value={oportunidadId} />
      <label className="block text-sm font-semibold">Razón social o nombre *<input required name="razonSocial" defaultValue={datos.razonSocial} minLength={2} maxLength={180} className={campo} /></label>
      <label className="block text-sm font-semibold">DNI o RUC *<input required name="documento" defaultValue={datos.documento ?? ""} pattern="(?:[0-9]{8}|[0-9]{11})" inputMode="numeric" className={campo} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Teléfono<input name="telefono" defaultValue={datos.telefono ?? ""} maxLength={30} className={campo} /></label><label className="block text-sm font-semibold">Correo<input type="email" name="correo" defaultValue={datos.correo ?? ""} className={campo} /></label></div>
      <label className="block text-sm font-semibold">Dirección<textarea name="direccion" defaultValue={datos.direccion ?? ""} maxLength={300} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
      <p className="text-xs text-slate-500">Se exige documento válido y al menos un teléfono o correo. La calificación se realiza en el siguiente paso.</p>
      {estado?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pendiente} onClick={onCerrar}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Guardando..." : "Guardar y continuar"}</Button></div>
    </form>
  </PortalFormulario>;
}
