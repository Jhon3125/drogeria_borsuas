"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { convertirCotizacionAVenta } from "@/app/dashboard/ventas/actions";

export function ConvertirCotizacionAVenta({ cotizacionId }: { cotizacionId: number }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState(convertirCotizacionAVenta, undefined);
  const router = useRouter();

  useEffect(() => {
    if (estado?.ventaId) {
      setAbierto(false);
      router.refresh();
    }
  }, [estado?.ventaId, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!estado?.ventaId && (
        <Button type="button" size="sm" onClick={() => setAbierto(true)}>
          <FileCheck2 className="mr-1 h-4 w-4" /> Convertir a venta
        </Button>
      )}
      {estado?.ventaId && (
        <Link href={`/dashboard/ventas/${estado.ventaId}`} className="text-sm font-semibold text-[#087EBD] underline">
          Abrir venta #{estado.ventaId}
        </Link>
      )}
      {estado?.error && !abierto && <span role="alert" className="text-xs text-red-700">{estado.error}</span>}
      <Dialog open={abierto} onOpenChange={(v) => { if (!pendiente) setAbierto(v); }}>
        <DialogContent className="sm:max-w-md" overlayClassName="!bg-slate-950/70 backdrop-blur-[4px]">
          <DialogHeader>
            <DialogTitle>Confirmar conversión a venta</DialogTitle>
            <DialogDescription>
              Se registrará una venta confirmada a partir de COT-{String(cotizacionId).padStart(5,"0")},
              con los importes originales. Si pertenece a una oportunidad en Negociación, se marcará como Ganada.
              Todavía no se descontará inventario.
            </DialogDescription>
          </DialogHeader>
          <form action={accion} className="space-y-4">
            <input type="hidden" name="cotizacionId" value={cotizacionId}/>
            {estado?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={pendiente} onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={pendiente}>{pendiente ? "Confirmando..." : "Confirmar venta"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
