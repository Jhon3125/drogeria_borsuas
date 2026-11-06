"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Boxes, Wallet, Truck, History } from "lucide-react";

type Clave = "resumen" | "lotes" | "pagos" | "despachos" | "historial";
type Props = {
  resumen: ReactNode;
  lotes: ReactNode;
  pagos: ReactNode;
  despachos: ReactNode;
  historial: ReactNode;
  pendientes: number;
};

const pestanas = [
  { id: "resumen", nombre: "Resumen", icono: ClipboardList },
  { id: "lotes", nombre: "Productos y lotes", icono: Boxes },
  { id: "pagos", nombre: "Pagos y cobranza", icono: Wallet },
  { id: "despachos", nombre: "Despachos", icono: Truck },
  { id: "historial", nombre: "Historial", icono: History },
] as const;

export function VistaVentaTabs(props: Props) {
  const [activa, setActiva] = useState<Clave>("resumen");
  const contenido: Record<Clave, ReactNode> = {
    resumen: props.resumen,
    lotes: props.lotes,
    pagos: props.pagos,
    despachos: props.despachos,
    historial: props.historial,
  };

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-2 shadow-sm">
        <div role="tablist" aria-label="Secciones de la venta" className="flex min-w-max items-center gap-1">
          {pestanas.map((tab) => {
            const Icono = tab.icono;
            const seleccionada = activa === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-venta-${tab.id}`}
                aria-selected={seleccionada}
                aria-controls="panel-venta"
                onClick={() => setActiva(tab.id)}
                className={`relative inline-flex min-h-14 items-center gap-2 px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${seleccionada ? "text-[#123E70]" : "text-slate-500 hover:text-[#123E70]"}`}
              >
                <Icono className="h-4 w-4" /> {tab.nombre}
                {tab.id === "lotes" && props.pendientes > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-800">{props.pendientes} pendiente(s)</span>}
                {seleccionada && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#087EBD]" />}
              </button>
            );
          })}
        </div>
      </div>
      <div id="panel-venta" role="tabpanel" aria-labelledby={`tab-venta-${activa}`}>
        {contenido[activa]}
      </div>
    </div>
  );
}
