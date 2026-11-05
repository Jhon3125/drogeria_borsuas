"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Pill } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import type { ItemNav, ItemNavFuturo } from "@/lib/navegacion";

/** Mismo Sidebar y mismos permisos que la versión de escritorio. */
export function SidebarMobile({ items, futuros }: { items: ItemNav[]; futuros: ItemNavFuturo[] }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("keydown", cerrar);
    return () => { document.body.style.overflow = anterior; document.removeEventListener("keydown", cerrar); };
  }, [abierto]);

  return (
    <>
      {/* Se superpone a la marca anterior del header móvil. No aparece en escritorio. */}
      <button type="button" aria-label="Abrir menú de navegación" aria-expanded={abierto} aria-controls="borsuas-menu-movil"
        onClick={() => setAbierto(true)}
        className="fixed left-0 top-0 z-[61] flex h-[56px] items-center gap-2 bg-white pl-3 pr-4 text-[#123E70] md:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
        <span className="text-sm font-extrabold tracking-wide">BORSUAS</span>
      </button>
      {abierto && (
        <div className="fixed inset-0 z-[100] md:hidden" role="presentation">
          <button type="button" aria-label="Cerrar menú" onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
          <div id="borsuas-menu-movil" role="dialog" aria-modal="true" aria-label="Navegación" className="absolute inset-y-0 left-0 flex w-[min(85vw,320px)] flex-col bg-[#123E70] shadow-2xl">
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar menú"
              className="absolute right-3 top-4 z-10 rounded-md bg-white/15 p-1.5 text-white hover:bg-white/25">
              <X className="h-5 w-5" />
            </button>
            <div className="min-h-0 flex-1 [&>aside]:w-full">
              <Sidebar items={items} futuros={futuros} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
