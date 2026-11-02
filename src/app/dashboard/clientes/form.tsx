"use client";

import { useActionState, useEffect } from "react";
import { guardarCliente } from "./actions";
import { UserRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClienteEditable = {
  id: number;
  razonSocial: string;
  documento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
};

type Props = {
  cliente?: ClienteEditable;
  onCancelar: () => void;
  onGuardado: () => void;
};

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100";

export function ClienteForm({ cliente, onCancelar, onGuardado }: Props) {
  const [estado, accion, pendiente] = useActionState(guardarCliente, undefined);

  useEffect(() => {
    if (estado?.ok) onGuardado();
  }, [estado?.ok, onGuardado]);

  return (
    <form action={accion} className="space-y-5" aria-label={cliente ? "Editar cliente" : "Registrar cliente"}>
      <input type="hidden" name="id" value={cliente?.id ?? ""} />

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <UserRound className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Información del cliente</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Nombre o razón social <span className="text-red-600">*</span>
            <input
              autoFocus
              required
              name="razonSocial"
              defaultValue={cliente?.razonSocial ?? ""}
              maxLength={180}
              placeholder="Nombre completo o razón social"
              className={inputClass}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            DNI o RUC <span className="text-red-600">*</span>
            <input
              required
              name="documento"
              defaultValue={cliente?.documento ?? ""}
              minLength={8}
              maxLength={11}
              pattern="(?:[0-9]{8}|[0-9]{11})"
              title="Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos"
              inputMode="numeric"
              placeholder="8 u 11 dígitos"
              className={inputClass}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Teléfono
            <input
              name="telefono"
              type="tel"
              defaultValue={cliente?.telefono ?? ""}
              maxLength={30}
              placeholder="Teléfono de contacto"
              className={inputClass}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Correo electrónico
            <input
              name="correo"
              type="email"
              defaultValue={cliente?.correo ?? ""}
              placeholder="cliente@correo.com"
              className={inputClass}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 md:col-span-2">
            Dirección
            <textarea
              name="direccion"
              defaultValue={cliente?.direccion ?? ""}
              maxLength={300}
              rows={2}
              placeholder="Dirección comercial o domicilio"
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>
      </section>

      {estado?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" disabled={pendiente} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendiente} className="min-w-36">
          {pendiente && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pendiente ? "Guardando..." : cliente ? "Guardar cambios" : "Registrar cliente"}
        </Button>
      </div>
    </form>
  );
}
