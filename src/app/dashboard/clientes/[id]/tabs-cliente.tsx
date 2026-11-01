"use client";

import { useState, type ReactNode } from "react";

type Tab = "general" | "oportunidades" | "cotizaciones" | "ventas" | "cobranza";
const tabs: { id: Tab; titulo: string }[] = [
  { id: "general", titulo: "General" },
  { id: "oportunidades", titulo: "Oportunidades" },
  { id: "cotizaciones", titulo: "Cotizaciones" },
  { id: "ventas", titulo: "Ventas" },
  { id: "cobranza", titulo: "Cobranza" },
];

export function TabsCliente({ general }: { general: ReactNode }) {
  const [actual, setActual] = useState<Tab>("general");
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto border-b border-slate-200">
        <div role="tablist" aria-label="Secciones de cliente" className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`cliente-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={actual === tab.id}
              aria-controls={`cliente-panel-${tab.id}`}
              onClick={() => setActual(tab.id)}
              className={`border-b-[3px] px-4 py-3 text-sm font-semibold transition ${actual === tab.id ? "border-[#087EBD] text-[#123E70]" : "border-transparent text-slate-500 hover:text-[#123E70]"}`}
            >
              {tab.titulo}
            </button>
          ))}
        </div>
      </div>
      <section role="tabpanel" id={`cliente-panel-${actual}`} aria-labelledby={`cliente-tab-${actual}`}>
        {actual === "general" ? (
          general
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-[#123E70]">{tabs.find((t) => t.id === actual)?.titulo}</h2>
            <p className="mt-2 text-sm text-slate-500">Sección pendiente de implementación durante el Sprint 3. Se integrará cuando definamos la estructura comercial y sus permisos.</p>
          </div>
        )}
      </section>
    </div>
  );
}
