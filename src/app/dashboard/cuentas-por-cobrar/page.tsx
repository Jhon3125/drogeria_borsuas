import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { HandCoins, Search } from "lucide-react";
import { RegistrarCobroDrawer } from "./registrar-cobro-drawer";

type Filtros = { q?: string; estado?: string; moneda?: string; desde?: string; hasta?: string; pagina?: string };
const dinero = (moneda: "PEN" | "USD", cantidad: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(cantidad);
const fecha = (d: Date) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "short" }).format(d);
const numero = (x?: string) => { const n = Number(x); return Number.isSafeInteger(n) && n > 0 ? n : 1; };
const dia = (valor?: string, fin = false) => {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
  const d = new Date(`${valor}T${fin ? "23:59:59.999" : "00:00:00.000"}-05:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

type Fila = {
  id: number; cliente: string; fecha: Date; moneda: "PEN" | "USD"; total: number;
  cobrado: number; saldo: number; estado: "PENDIENTE" | "PARCIAL" | "PAGADA" | "ANULADA";
};

export default async function CuentasPorCobrar({ searchParams }: { searchParams: Promise<Filtros> }) {
  await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  const p = await searchParams;
  const q = (p.q ?? "").trim().slice(0, 100);
  const moneda = p.moneda === "USD" || p.moneda === "PEN" ? p.moneda : "";
  const estado = ["PENDIENTE", "PARCIAL", "PAGADA", "ANULADA"].includes(p.estado ?? "") ? p.estado : "";
  const desde = dia(p.desde), hasta = dia(p.hasta, true);
  const pagina = numero(p.pagina);
  const porPagina = 15;

  // Se calculan los saldos a partir de pagos reales, no de un campo posiblemente desactualizado.
  const ventas = await prisma.venta.findMany({
    where: {
      ...(moneda ? { moneda } : {}),
      ...(desde || hasta ? { fecha: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } } : {}),
      ...(q ? { OR: [
        { cliente: { razonSocial: { contains: q, mode: "insensitive" } } },
        ...(/^\d+$/.test(q) && Number.isSafeInteger(Number(q)) ? [{ id: Number(q) }] : []),
      ] } : {}),
    },
    select: { id: true, fecha: true, moneda: true, estado: true, importeTotal: true, cliente: { select: { razonSocial: true } }, pagos: { select: { monto: true } } },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const filas: Fila[] = ventas.map((v) => {
    const total = Number(v.importeTotal);
    const cobrado = v.pagos.reduce((a, pago) => a + Number(pago.monto), 0);
    const saldo = Math.max(0, Math.round((total - cobrado) * 100) / 100);
    const situacion: Fila["estado"] = v.estado === "ANULADA" ? "ANULADA" : saldo <= 0 ? "PAGADA" : cobrado > 0 ? "PARCIAL" : "PENDIENTE";
    return { id: v.id, cliente: v.cliente.razonSocial, fecha: v.fecha, moneda: v.moneda, total, cobrado, saldo, estado: situacion };
  }).filter((v) => !estado || v.estado === estado);

  const totales = (tipo: "PEN" | "USD") => filas.filter(v => v.moneda === tipo && v.estado !== "ANULADA").reduce((a, v) => ({ facturado: a.facturado + v.total, cobrado: a.cobrado + v.cobrado, pendiente: a.pendiente + v.saldo }), { facturado: 0, cobrado: 0, pendiente: 0 });
  const pen = totales("PEN"), usd = totales("USD");
  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const lista = filas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
  const href = (n: number) => `/dashboard/cuentas-por-cobrar?${new URLSearchParams({ ...(q ? { q } : {}), ...(estado ? { estado } : {}), ...(moneda ? { moneda } : {}), ...(p.desde ? { desde: p.desde } : {}), ...(p.hasta ? { hasta: p.hasta } : {}), pagina: String(n) })}`;

  return <main className="mx-auto max-w-[1550px] space-y-6 pb-10">
    <header><p className="text-xs text-slate-500">Finanzas / Cobranza</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#123E70] sm:text-3xl"><HandCoins className="h-7 w-7" /> Cuentas por cobrar</h1><p className="mt-1 text-sm text-slate-600">Control de saldos de todas las ventas. Registra cobros sin salir del listado.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta label="Saldo pendiente · PEN" valor={dinero("PEN", pen.pendiente)} />
      <Tarjeta label="Saldo pendiente · USD" valor={dinero("USD", usd.pendiente)} />
      <Tarjeta label="Cobrado · PEN" valor={dinero("PEN", pen.cobrado)} />
      <Tarjeta label="Cobrado · USD" valor={dinero("USD", usd.cobrado)} />
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b p-4"><h2 className="font-bold text-[#123E70]">Estado de cobranza</h2><p className="text-xs text-slate-500">{filas.length} venta(s) según los filtros. Los importes se calculan a partir de pagos registrados.</p></div>
      <form action="/dashboard/cuentas-por-cobrar" method="get" className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_130px_155px_155px_auto] xl:items-end">
        <label className="text-xs font-semibold text-slate-600">Cliente o venta<div className="relative mt-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input name="q" defaultValue={q} placeholder="Buscar..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" /></div></label>
        <label className="text-xs font-semibold text-slate-600">Estado<select name="estado" defaultValue={estado} className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Todos</option><option value="PENDIENTE">Pendiente</option><option value="PARCIAL">Parcial</option><option value="PAGADA">Pagada</option><option value="ANULADA">Anulada</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Moneda<select name="moneda" defaultValue={moneda} className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Todas</option><option value="PEN">Soles</option><option value="USD">Dólares</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Desde<input type="date" name="desde" defaultValue={p.desde ?? ""} className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">Hasta<input type="date" name="hasta" defaultValue={p.hasta ?? ""} className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" /></label>
        <div className="flex gap-2"><button type="submit" className="h-10 rounded-lg bg-[#123E70] px-4 text-sm font-semibold text-white">Filtrar</button><Link href="/dashboard/cuentas-por-cobrar" className="inline-flex h-10 items-center rounded-lg border px-3 text-sm">Limpiar</Link></div>
      </form>
      <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Venta", "Cliente", "Fecha", "Moneda", "Total", "Cobrado", "Saldo", "Estado", "Acciones"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{lista.map(v => <tr key={v.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold text-sky-700">VTA-{String(v.id).padStart(5, "0")}</td><td className="px-4 py-3">{v.cliente}</td><td className="whitespace-nowrap px-4 py-3">{fecha(v.fecha)}</td><td className="px-4 py-3">{v.moneda}</td><td className="px-4 py-3 text-right">{dinero(v.moneda, v.total)}</td><td className="px-4 py-3 text-right">{dinero(v.moneda, v.cobrado)}</td><td className="px-4 py-3 text-right font-semibold">{dinero(v.moneda, v.saldo)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${v.estado === "PAGADA" ? "bg-emerald-100 text-emerald-700" : v.estado === "PARCIAL" ? "bg-amber-100 text-amber-800" : v.estado === "ANULADA" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"}`}>{v.estado}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={`/dashboard/ventas/${v.id}`} className="whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold text-[#123E70]">Ver venta</Link>{v.estado !== "ANULADA" && v.saldo > 0 && <RegistrarCobroDrawer venta={{ id: v.id, cliente: v.cliente, moneda: v.moneda, saldo: v.saldo.toFixed(2), total: v.total.toFixed(2) }} />}</div></td></tr>)}{lista.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No hay ventas con esos filtros.</td></tr>}</tbody>
      </table></div>
      <footer className="flex items-center justify-between gap-3 border-t p-4 text-sm"><span className="text-slate-500">Página {paginaActual} de {totalPaginas}</span><div className="flex gap-2"><Link aria-disabled={paginaActual <= 1} className={`rounded-lg border px-3 py-2 ${paginaActual <= 1 ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={href(Math.max(1, paginaActual - 1))}>Anterior</Link><Link aria-disabled={paginaActual >= totalPaginas} className={`rounded-lg border px-3 py-2 ${paginaActual >= totalPaginas ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={href(Math.min(totalPaginas, paginaActual + 1))}>Siguiente</Link></div></footer>
    </section>
  </main>;
}
function Tarjeta({ label, valor }: { label: string; valor: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-[#123E70]">{valor}</p></div>; }
