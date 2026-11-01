
"use client";

import { useState, type ReactNode } from "react";

type Tab = "general" | "compras" | "recepciones" | "finanzas";

type Props = {
    general: ReactNode;
    compras: ReactNode;
    recepciones: ReactNode;
    finanzas?: ReactNode;
};

export function TabsProveedor({
    general,
    compras,
    recepciones,
    finanzas,
}: Props) {
    const [tabActivo, setTabActivo] = useState<Tab>("general");

    const tabs: {
        id: Tab;
        titulo: string;
    }[] = [
            { id: "general", titulo: "General" },
            { id: "compras", titulo: "Compras" },
            { id: "recepciones", titulo: "Recepciones" },
            ...(finanzas
                ? [{ id: "finanzas" as const, titulo: "Finanzas" }]
                : []),
        ];

    const contenido = {
        general,
        compras,
        recepciones,
        finanzas,
    };

    return (
        <div className="space-y-5">
            <div className="overflow-x-auto border-b border-slate-200">
                <div
                    role="tablist"
                    aria-label="Secciones del proveedor"
                    className="flex min-w-max gap-2"
                >
                    {tabs.map((tab) => {
                        const activo = tabActivo === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`tab-${tab.id}`}
                                aria-selected={activo}
                                aria-controls={`panel-${tab.id}`}
                                onClick={() => setTabActivo(tab.id)}
                                className={`border-b-[3px] px-5 py-3 text-sm font-semibold transition ${activo
                                        ? "border-[#087EBD] text-[#123E70]"
                                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-[#123E70]"
                                    }`}
                            >
                                {tab.titulo}
                            </button>
                        );
                    })}
                </div>
            </div>

            {tabs.map((tab) => (
                <section
                    key={tab.id}
                    id={`panel-${tab.id}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${tab.id}`}
                    hidden={tabActivo !== tab.id}
                    className="space-y-6"
                >
                    {contenido[tab.id]}
                </section>
            ))}
        </div>
    );
}
