"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  BellRing, Boxes, Building2, CalendarClock, CarFront, ChartNoAxesCombined,
  ChevronDown, ChevronRight, ClipboardCheck, Columns3, CreditCard, FileText,
  History, LayoutDashboard, LockKeyhole, Package, PackageSearch, Pill,
  Receipt, Route, Settings, ShoppingCart, Sparkles, Tags, Truck, Users,
  UsersRound, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconoNav, ItemNav, IconoFuturo, ItemNavFuturo } from "@/lib/navegacion";

type Props = { items: ItemNav[]; futuros: ItemNavFuturo[] };
type IconType = ComponentType<{ className?: string }>;

const ICONOS: Record<IconoNav, IconType> = {
  dashboard: LayoutDashboard, users: Users, package: Package, tags: Tags,
  boxes: Boxes, building: Building2, "shopping-cart": ShoppingCart,
  "package-search": PackageSearch, "users-round": UsersRound,
  "file-text": FileText, wallet: Wallet, "clipboard-check": ClipboardCheck,
  columns: Columns3,
};
const FUTUROS: Record<IconoFuturo, IconType> = {
  truck: Truck, "shopping-cart": ShoppingCart, building: Building2,
  "users-round": UsersRound, "file-text": FileText, wallet: Wallet,
  receipt: Receipt, "credit-card": CreditCard, route: Route,
  car: CarFront, "calendar-clock": CalendarClock, "bell-ring": BellRing,
  chart: ChartNoAxesCombined, sparkles: Sparkles, settings: Settings,
  history: History, "package-search": PackageSearch,
};

const SECCIONES = [
  { id: "comercial", titulo: "Comercial y ventas", rutas: ["/dashboard/clientes", "/dashboard/ventas/crm", "/dashboard/cotizaciones", "/dashboard/ventas"] },
  { id: "inventario", titulo: "Inventario y compras", rutas: ["/dashboard/productos", "/dashboard/categorias", "/dashboard/inventario", "/dashboard/proveedores", "/dashboard/compras", "/dashboard/lotes"] },
  { id: "finanzas", titulo: "Finanzas", rutas: ["/dashboard/caja", "/dashboard/ordenes-pago", "/dashboard/ordenes-pago/conciliacion"] },
  { id: "administracion", titulo: "Administración", rutas: ["/dashboard/usuarios"] },
] as const;

function rutaActiva(path: string, href: string) {
  return href === "/dashboard" ? path === href : path === href || path.startsWith(href + "/");
}

export function Sidebar({ items, futuros }: Props) {
  const pathname = usePathname();
  const [abiertas, setAbiertas] = useState<string[]>(["comercial", "inventario", "finanzas", "administracion"]);
  const [mostrarFuturos, setMostrarFuturos] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const guardadas = window.localStorage.getItem("borsuas-sidebar-grupos-v1");
      if (guardadas !== null) {
        const valores: unknown = JSON.parse(guardadas);
        if (Array.isArray(valores)) setAbiertas(valores.filter((v): v is string => typeof v === "string"));
      }
    } catch { /* Preferencia opcional */ }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    const seccionActiva = SECCIONES.find((seccion) => seccion.rutas.some((ruta) => rutaActiva(pathname, ruta)));
    if (!seccionActiva) return;
    setAbiertas((anterior) => anterior.includes(seccionActiva.id) ? anterior : [...anterior, seccionActiva.id]);
  }, [pathname, cargado]);

  function alternar(id: string) {
    setAbiertas((anterior) => {
      const siguiente = anterior.includes(id) ? anterior.filter((x) => x !== id) : [...anterior, id];
      try { window.localStorage.setItem("borsuas-sidebar-grupos-v1", JSON.stringify(siguiente)); } catch { /* noop */ }
      return siguiente;
    });
  }

  const itemPorRuta = new Map(items.map((item) => [item.href, item]));
  const dashboard = itemPorRuta.get("/dashboard");

  function renderItem(item: ItemNav) {
    const Icon = ICONOS[item.icono] ?? FileText;
    const activo = rutaActiva(pathname, item.href) &&
      // En una ruta anidada, la coincidencia más específica debe prevalecer.
      !items.some((otro) => otro.href !== item.href && otro.href.startsWith(item.href + "/") && rutaActiva(pathname, otro.href));
    return (
      <Link key={item.href} href={item.href} aria-current={activo ? "page" : undefined}
        className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          activo ? "bg-white/15 text-white ring-1 ring-white/10" : "text-blue-100/80 hover:bg-white/10 hover:text-white")}
      >
        {activo && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-emerald-400" />}
        <Icon className={cn("h-[18px] w-[18px] shrink-0", activo ? "text-emerald-300" : "text-blue-100/70")} />
        <span>{item.titulo}</span>
      </Link>
    );
  }

  // Mostrar solo módulos realmente pendientes, sin incluir duplicados implementados.
  const pendientes = futuros.filter((f) => !items.some((i) => i.titulo.toLowerCase() === f.titulo.toLowerCase()));
  const futurosLogistica = pendientes.filter((f) => f.grupo === "logistica");
  const otrosFuturos = pendientes.filter((f) => f.grupo !== "logistica");

  function renderPendiente(f: ItemNavFuturo) {
    const Icon = FUTUROS[f.icono] ?? FileText;
    return (
      <div key={`${f.grupo}-${f.titulo}`} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-blue-100/45" title="Módulo todavía no habilitado">
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{f.titulo}</span>
        <LockKeyhole className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <aside className="flex h-full min-h-0 w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-white/15 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#238B55]"><Pill className="h-6 w-6 text-white" /></div>
          <div className="min-w-0"><p className="truncate text-base font-extrabold tracking-wide text-white">BORSUAS</p><p className="text-xs text-blue-100/75">ERP Farmacéutico</p></div>
        </div>
      </div>
      <nav aria-label="Navegación principal" className="borsuas-sidebar-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-5">
        {dashboard && <div className="pb-2">{renderItem(dashboard)}</div>}
        {SECCIONES.map((seccion) => {
          const disponibles = seccion.rutas.map((ruta) => itemPorRuta.get(ruta)).filter((i): i is ItemNav => Boolean(i));
          if (!disponibles.length) return null;
          const abierta = abiertas.includes(seccion.id);
          return (
            <section key={seccion.id}>
              <button type="button" onClick={() => alternar(seccion.id)} aria-expanded={abierta} aria-controls={`nav-${seccion.id}`}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-blue-200/80 hover:bg-white/10 hover:text-white">
                <span>{seccion.titulo}</span><ChevronDown className={cn("h-4 w-4 transition-transform", !abierta && "-rotate-90")} />
              </button>
              {abierta && <div id={`nav-${seccion.id}`} className="mt-1 space-y-1">{disponibles.map(renderItem)}</div>}
            </section>
          );
        })}
        {mostrarFuturos && futurosLogistica.length > 0 && (
          <section><p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">Logística · Próximamente</p>{futurosLogistica.map(renderPendiente)}</section>
        )}
        {mostrarFuturos && otrosFuturos.length > 0 && (
          <section><p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">Otros módulos futuros</p>{otrosFuturos.map(renderPendiente)}</section>
        )}
        {pendientes.length > 0 && <button type="button" onClick={() => setMostrarFuturos((v) => !v)} aria-expanded={mostrarFuturos}
          className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-left text-xs text-white hover:bg-white/15">
          <span>{mostrarFuturos ? "Ocultar módulos futuros" : "Mostrar módulos futuros"}</span>
          {mostrarFuturos ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>}
      </nav>
      <div className="shrink-0 border-t border-white/15 p-4"><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/20"><Pill className="h-4 w-4 text-emerald-300" /></div><div><p className="text-xs font-semibold text-white">Borsuas ERP</p><p className="text-[11px] text-blue-100/70">Gestión empresarial</p></div></div></div>
    </aside>
  );
}
