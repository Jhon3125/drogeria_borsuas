"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cambiarEstadoCotizacion } from "./actions";

type Estado = "BORRADOR" | "EMITIDA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | "ANULADA";
type Destino = "EMITIDA" | "ACEPTADA" | "RECHAZADA";
const CONFIG: Record<Destino, { titulo: string; descripcion: string; boton: string }> = {
  EMITIDA: {
    titulo: "Emitir cotización",
    descripcion: "¿Confirmas la emisión de esta propuesta? Dejará de ser un borrador y no podrá editarse como tal.",
    boton: "Sí, emitir cotización",
  },
  ACEPTADA: {
    titulo: "Confirmar aceptación",
    descripcion: "Confirma que el cliente ha aceptado la propuesta. Esta acción no generará una venta automáticamente.",
    boton: "Sí, registrar aceptación",
  },
  RECHAZADA: {
    titulo: "Rechazar cotización",
    descripcion: "Confirma que el cliente ha rechazado la propuesta. No podrás volver a emitir esta misma cotización.",
    boton: "Sí, rechazar cotización",
  },
};

export function AccionesEstadoCotizacion({ cotizacionId, estado, compacta = false }: {
  cotizacionId: number;
  estado: Estado;
  compacta?: boolean;
}) {
  const router = useRouter();
  const [destino, setDestino] = useState<Destino | null>(null);
  const [resultado, accion, pendiente] = useActionState(cambiarEstadoCotizacion, undefined);
  const ultimoAviso = useRef<string | null>(null);
  useEffect(() => {
    if (resultado?.ok && ultimoAviso.current !== resultado.ok) {
      ultimoAviso.current = resultado.ok;
      setDestino(null);
      router.refresh();
    }
  }, [resultado?.ok, router]);

  if (estado !== "BORRADOR" && estado !== "EMITIDA") return null;
  const opciones: { value: Destino; label: string }[] = estado === "BORRADOR"
    ? [{ value: "EMITIDA", label: "Emitir" }]
    : [{ value: "ACEPTADA", label: "Aceptar" }, { value: "RECHAZADA", label: "Rechazar" }];
  const config = destino ? CONFIG[destino] : null;

  return (
    <div className={compacta ? "mt-2 flex flex-wrap items-center gap-1.5" : "flex flex-wrap items-center gap-2"}>
      {opciones.map((opcion) => (
        <button
          type="button"
          key={opcion.value}
          disabled={pendiente}
          onClick={() => setDestino(opcion.value)}
          className={opcion.value === "RECHAZADA"
            ? "rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            : "rounded-lg bg-[#123E70] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#087EBD] disabled:opacity-50"}
        >{opcion.label}</button>
      ))}
      {resultado?.error && !destino && <p role="alert" className="w-full text-xs text-rose-700">{resultado.error}</p>}
      {resultado?.ok && <p role="status" className="w-full text-xs text-emerald-700">{resultado.ok}</p>}

      <Dialog open={destino !== null} onOpenChange={(abierta) => { if (!abierta && !pendiente) setDestino(null); }}>
        <DialogContent className="z-[130] w-full sm:max-w-md" overlayClassName="!z-[120] !bg-slate-950/75 backdrop-blur-[4px]">
          <DialogHeader className="gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-[#123E70]">
              {destino === "EMITIDA" ? <FileCheck2 className="size-6" /> : destino === "ACEPTADA" ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6 text-rose-600" />}
            </span>
            <DialogTitle className="text-xl font-bold text-[#123E70]">{config?.titulo}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{config?.descripcion}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <AlertTriangle className="mr-1.5 inline size-4 align-middle" />
            Cotización COT-{String(cotizacionId).padStart(5, "0")}: verifica los datos antes de confirmar.
          </div>
          {resultado?.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{resultado.error}</p>}
          <form action={accion}>
            <input type="hidden" name="cotizacionId" value={cotizacionId} />
            <input type="hidden" name="estadoEsperado" value={estado} />
            <input type="hidden" name="estadoNuevo" value={destino ?? ""} />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" disabled={pendiente} onClick={() => setDestino(null)}>Cancelar</Button>
              <Button type="submit" disabled={pendiente || !destino} className={destino === "RECHAZADA" ? "bg-rose-700 text-white hover:bg-rose-800" : "bg-[#123E70] text-white hover:bg-[#087EBD]"}>
                {pendiente ? "Procesando..." : config?.boton ?? "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
