"use client";

import { useActionState, useEffect } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { guardarProveedor } from "./actions";

type ProveedorEditable = {
  id: number;
  razonSocial: string;
  ruc: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
};

type Props = {
  proveedor?: ProveedorEditable;
  onCancelar: () => void;
  onGuardado: () => void;
};

const campo = "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100";

export function FormularioProveedor({ proveedor, onCancelar, onGuardado }: Props) {
  const [estado, accion, pendiente] = useActionState(guardarProveedor, undefined);

  useEffect(() => {
    if (estado?.ok) onGuardado();
  }, [estado?.ok, onGuardado]);

  return (
    <form action={accion} className="space-y-5" aria-label={proveedor ? "Editar proveedor" : "Registrar proveedor"}>
      <input type="hidden" name="id" value={proveedor?.id ?? ""} />
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Información del proveedor</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Razón social <span className="text-red-600">*</span>
            <input autoFocus required name="razonSocial" minLength={3} maxLength={180} defaultValue={proveedor?.razonSocial ?? ""} placeholder="Ej. Distribuidora Farmacéutica SAC" className={campo} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            RUC <span className="text-red-600">*</span>
            <input required name="ruc" inputMode="numeric" minLength={11} maxLength={11} pattern="[0-9]{11}" title="Ingresa un RUC de 11 dígitos" defaultValue={proveedor?.ruc ?? ""} placeholder="11 dígitos" className={campo} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Persona de contacto
            <input name="contacto" maxLength={120} defaultValue={proveedor?.contacto ?? ""} placeholder="Nombre del representante" className={campo} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Teléfono
            <input name="telefono" type="tel" maxLength={30} defaultValue={proveedor?.telefono ?? ""} placeholder="Número de contacto" className={campo} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Correo electrónico
            <input name="correo" type="email" maxLength={254} defaultValue={proveedor?.correo ?? ""} placeholder="contacto@empresa.com" className={campo} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Dirección
            <textarea name="direccion" maxLength={300} rows={2} defaultValue={proveedor?.direccion ?? ""} placeholder="Dirección fiscal o comercial" className={`${campo} resize-y`} />
          </label>
        </div>
      </section>
      {estado?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" disabled={pendiente} onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={pendiente} className="min-w-36">
          {pendiente && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pendiente ? "Guardando..." : proveedor ? "Guardar cambios" : "Registrar proveedor"}
        </Button>
      </div>
    </form>
  );
}
