"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { crearProspectoConOportunidad } from "./crear-prospecto";

type Vendedor = { id: number; nombre?: string; razonSocial?: string };

export function FormularioNuevoProspecto({ abierto, onCerrar, vendedores, usuarioId, administrador }: {
  abierto: boolean; onCerrar: () => void; vendedores: Vendedor[]; usuarioId: number; administrador: boolean;
}) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(crearProspectoConOportunidad, undefined);
  useEffect(() => {
    if (estado?.ok) {
      onCerrar();
      router.refresh();
    }
  }, [estado?.ok, onCerrar, router]);
  const input = "mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100";
  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open && !pendiente) onCerrar(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" overlayClassName="!bg-slate-950/70 backdrop-blur-[4px]">
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#123E70]"><UserPlus className="h-5 w-5" /></div>
          <DialogTitle className="text-xl">Nuevo prospecto</DialogTitle>
          <DialogDescription>Registra datos iniciales y crea una oportunidad en Prospecto. No se genera una cotización ni se marca como contactado.</DialogDescription>
        </DialogHeader>
        <form action={accion} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Empresa o persona *<input name="razonSocial" required minLength={2} maxLength={180} className={input} placeholder="Ej. Farmacia San José" /></label>
            <label className="text-sm font-semibold text-slate-700">Teléfono<input name="telefono" maxLength={30} className={input} placeholder="Número de contacto" /></label>
            <label className="text-sm font-semibold text-slate-700">Correo<input name="correo" type="email" className={input} placeholder="correo@ejemplo.com" /></label>
            <label className="text-sm font-semibold text-slate-700">Persona de referencia<input name="personaContacto" maxLength={120} className={input} placeholder="Opcional" /></label>
            <label className="text-sm font-semibold text-slate-700">DNI / RUC<input name="documento" inputMode="numeric" pattern="(?:[0-9]{8}|[0-9]{11})" className={input} placeholder="Opcional en prospectos" /></label>
          </div>
          <p className="text-xs text-slate-500">Se requiere al menos un teléfono o correo. El documento se completará antes de la calificación.</p>
          <div className="border-t border-slate-200 pt-3">
            <h3 className="mb-3 text-sm font-bold text-[#123E70]">Primera oportunidad</h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Título *<input name="titulo" required minLength={3} maxLength={180} className={input} placeholder="Ej. Posible abastecimiento de medicamentos" /></label>
              <label className="block text-sm font-semibold text-slate-700">Responsable comercial
                <select name="vendedorId" defaultValue={usuarioId} disabled={!administrador} className={input}>
                  {vendedores.filter((v) => administrador || v.id === usuarioId).map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
                {!administrador && <input type="hidden" name="vendedorId" value={usuarioId} />}
              </label>
              <label className="block text-sm font-semibold text-slate-700">Información inicial<textarea name="descripcion" rows={3} maxLength={2000} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="Origen del prospecto o posible necesidad" /></label>
            </div>
          </div>
          {estado?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
          <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={pendiente} onClick={onCerrar}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Registrando..." : "Registrar prospecto"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
