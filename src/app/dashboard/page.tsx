import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ClipboardList, CreditCard, FileText,
  LayoutDashboard, Package, ShieldCheck, ShoppingCart, Tags, Users,
  Wallet, AlertTriangle, type LucideIcon,
} from "lucide-react";
import { usuarioVigente } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ETIQUETA_ROL, NAVEGACION, type IconoNav } from "@/lib/navegacion";
import type { RolUsuario } from "@/generated/prisma/enums";
import { MetricCard } from "@/components/dashboard/metric-card";
import { GraficoVentas, GraficoCotizaciones } from "@/components/dashboard/grafico-ventas";

const ICONOS: Record<IconoNav, LucideIcon> = {
  dashboard: LayoutDashboard, users: Users, package: Package, tags: Tags,
  boxes: Package, building: Package, "shopping-cart": ShoppingCart,
  "package-search": Package, "users-round": Users, "file-text": FileText,
  wallet: Wallet, "clipboard-check": ClipboardList, columns: ClipboardList,
};
const DESCRIPCIONES: Record<string, string> = {
  "/dashboard/clientes": "Fichas y seguimiento de clientes.",
  "/dashboard/ventas/crm": "Gestiona tu embudo de oportunidades.",
  "/dashboard/cotizaciones": "Cotizaciones, versiones y estados.",
  "/dashboard/ventas": "Ventas y preparación de pedidos.",
  "/dashboard/caja": "Consulta cobros y pagos recibidos.",
  "/dashboard/productos": "Catálogo de productos.",
  "/dashboard/inventario": "Existencias y movimientos de stock.",
  "/dashboard/compras": "Gestión de compras.",
};
const dinero = (n: number, moneda: "PEN" | "USD") => `${moneda === "PEN" ? "S/" : "USD"} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function DashboardPage() {
  const usuario = await usuarioVigente();
  const rol: RolUsuario = usuario.rol;
  const modulos = NAVEGACION.filter((m) => m.href !== "/dashboard" && m.roles.includes(rol));
  const catalogo = (["SUPER_ADMIN", "ADMIN", "COMPRAS", "COMERCIAL"] as RolUsuario[]).includes(rol);
  const comercial = (["SUPER_ADMIN", "ADMIN", "COMERCIAL"] as RolUsuario[]).includes(rol);
  const superAdmin = rol === "SUPER_ADMIN";
  // Se usa UTC para definir intervalos mensuales coherentes en la consulta y el gráfico.
  const ahora = new Date();
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 5, 1));
  const meses = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + i, 1));
    return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth(), etiqueta: fecha.toLocaleDateString("es-PE", { month: "short", timeZone: "UTC" }), soles: 0, dolares: 0, cantidad: 0 };
  });

  const [totalProductos, productosActivos, totalCategorias, totalUsuarios, totalClientes, ventas, cotizaciones, ventaTotales] = await Promise.all([
    catalogo ? prisma.producto.count() : Promise.resolve(null),
    catalogo ? prisma.producto.count({ where: { estado: true } }) : Promise.resolve(null),
    catalogo ? prisma.categoria.count() : Promise.resolve(null),
    superAdmin ? prisma.usuario.count() : Promise.resolve(null),
    comercial ? prisma.cliente.count() : Promise.resolve(null),
    comercial ? prisma.venta.findMany({ where: { fecha: { gte: inicio }, estado: { not: "ANULADA" } }, select: { fecha: true, importeTotal: true, moneda: true } }) : Promise.resolve([]),
    comercial ? prisma.cotizacion.groupBy({ by: ["estado"], _count: { _all: true } }) : Promise.resolve([]),
    comercial ? Promise.all([
      prisma.venta.count({ where: { estado: { not: "ANULADA" } } }),
      prisma.venta.aggregate({ where: { estado: { not: "ANULADA" }, moneda: "PEN" }, _sum: { saldoPendiente: true } }),
      prisma.venta.aggregate({ where: { estado: { not: "ANULADA" }, moneda: "USD" }, _sum: { saldoPendiente: true } }),
      prisma.venta.count({ where: { estado: "EN_PREPARACION" } }),
    ]) : Promise.resolve(null),
  ]);

  for (const v of ventas) {
    const i = (v.fecha.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + v.fecha.getUTCMonth() - inicio.getUTCMonth();
    if (i >= 0 && i < 6) {
      meses[i].cantidad += 1;
      if (v.moneda === "USD") meses[i].dolares += Number(v.importeTotal);
      else meses[i].soles += Number(v.importeTotal);
    }
  }
  const numeroCotizaciones = (estado: string) => cotizaciones.find((c) => c.estado === estado)?._count._all ?? 0;
  const pendientes = numeroCotizaciones("BORRADOR") + numeroCotizaciones("EMITIDA");
  const [totalVentas, saldoPen, saldoUsd, preparando] = ventaTotales ?? [0, null, null, 0];
  const accesos = ["/dashboard/clientes", "/dashboard/ventas/crm", "/dashboard/cotizaciones", "/dashboard/ventas", "/dashboard/caja", "/dashboard/inventario", "/dashboard/compras", "/dashboard/productos"];
  const accesoRapido = accesos.map((ruta) => modulos.find((m) => m.href === ruta)).filter((m): m is (typeof modulos)[number] => !!m);

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8 sm:space-y-9">
      <section className="relative overflow-hidden rounded-2xl bg-[#123E70] p-5 text-white shadow-md sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#087EBD]/35" />
        <div className="pointer-events-none absolute -bottom-24 right-20 h-56 w-56 rounded-full bg-[#238B55]/25" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard empresarial</span>
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Bienvenido, {usuario.name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/85">Resumen actualizado de la actividad comercial y operativa de Droguería Borsuas.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><p className="text-xs text-blue-100/75">Rol de acceso</p><p className="text-sm font-semibold text-white">{ETIQUETA_ROL[rol]}</p></div></div>
        </div>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-lg font-bold text-[#123E70]">Resumen general</h2><p className="text-sm text-slate-500">Indicadores actuales según los permisos de tu rol.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {comercial && <>
            <MetricCard titulo="Ventas registradas" valor={totalVentas} descripcion="Operaciones no anuladas" icono={ShoppingCart} color="blue" href="/dashboard/ventas" />
            <MetricCard titulo="Cotizaciones pendientes" valor={pendientes} descripcion="Borradores y emitidas" icono={FileText} color="violet" href="/dashboard/cotizaciones" />
            <MetricCard titulo="Clientes registrados" valor={totalClientes} descripcion="Fichas comerciales" icono={Users} color="green" href="/dashboard/clientes" />
            <MetricCard titulo="Ventas en preparación" valor={preparando} descripcion="Pendientes de finalizar preparación" icono={Package} color="blue" href="/dashboard/ventas" />
          </>}
          {catalogo && <>
            <MetricCard titulo="Productos registrados" valor={totalProductos} descripcion="Productos en el catálogo" icono={Package} color="blue" href="/dashboard/productos" />
            <MetricCard titulo="Productos activos" valor={productosActivos} descripcion="Productos habilitados" icono={CheckCircle2} color="green" href="/dashboard/productos" />
            <MetricCard titulo="Categorías" valor={totalCategorias} descripcion="Categorías registradas" icono={Tags} color="violet" href="/dashboard/categorias" />
          </>}
          {superAdmin && <MetricCard titulo="Usuarios registrados" valor={totalUsuarios} descripcion="Cuentas del ERP" icono={Users} color="violet" href="/dashboard/usuarios" />}
          {!comercial && !catalogo && <MetricCard titulo="Módulos disponibles" valor={modulos.length} descripcion="Accesos habilitados para tu rol" icono={LayoutDashboard} color="blue" />}
        </div>
      </section>

      {comercial && <>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-2 flex items-center gap-2 text-sm text-slate-500"><CreditCard className="h-4 w-4" /> Cuentas por cobrar · PEN</div><p className="text-2xl font-bold text-[#123E70]">{dinero(Number(saldoPen?._sum.saldoPendiente ?? 0), "PEN")}</p><p className="mt-1 text-xs text-slate-500">Saldo pendiente registrado en ventas no anuladas</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-2 flex items-center gap-2 text-sm text-slate-500"><Wallet className="h-4 w-4" /> Cuentas por cobrar · USD</div><p className="text-2xl font-bold text-[#123E70]">{dinero(Number(saldoUsd?._sum.saldoPendiente ?? 0), "USD")}</p><p className="mt-1 text-xs text-slate-500">Importes en dólares, sin conversión de moneda</p></div>
        </section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <GraficoVentas meses={meses} />
          <GraficoCotizaciones datos={[
            { etiqueta: "Borradores", cantidad: numeroCotizaciones("BORRADOR"), clase: "bg-slate-400" },
            { etiqueta: "Emitidas", cantidad: numeroCotizaciones("EMITIDA"), clase: "bg-sky-500" },
            { etiqueta: "Aceptadas", cantidad: numeroCotizaciones("ACEPTADA"), clase: "bg-emerald-500" },
            { etiqueta: "Rechazadas", cantidad: numeroCotizaciones("RECHAZADA"), clase: "bg-rose-400" },
            { etiqueta: "Vencidas y anuladas", cantidad: numeroCotizaciones("VENCIDA") + numeroCotizaciones("ANULADA"), clase: "bg-amber-400" },
          ]} />
        </div>
      </>}

      <section className="space-y-4">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-sky-50 p-2.5 text-[#087EBD]"><ClipboardList className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-[#123E70]">Accesos rápidos</h2><p className="text-sm text-slate-500">Tus módulos de trabajo más utilizados.</p></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {accesoRapido.map((m) => { const Icono = ICONOS[m.icono] ?? LayoutDashboard; return <Link href={m.href} key={m.href} className="group flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md sm:p-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-[#087EBD]"><Icono className="h-4 w-4" /></div><div className="min-w-0"><h3 className="break-words text-sm font-semibold text-[#123E70]">{m.titulo}</h3><p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{DESCRIPCIONES[m.href] ?? "Accede al módulo."}</p></div><span className="flex items-center gap-1 text-xs font-medium text-[#087EBD]">Abrir <ArrowRight className="h-3.5 w-3.5" /></span></Link>; })}
          {accesoRapido.length === 0 && <p className="col-span-full text-sm text-slate-500">No tienes accesos rápidos adicionales habilitados.</p>}
        </div>
      </section>
      <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>Los gráficos reflejan datos del sistema. Los importes se muestran por moneda; el dashboard no registra salidas de almacén ni reemplaza el módulo Caja.</p></div>
    </div>
  );
}
