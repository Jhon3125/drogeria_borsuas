import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ArrowDownLeft, ArrowUpRight, Landmark, Search } from "lucide-react";

type Filtros = { q?: string; tipo?: string; moneda?: string; desde?: string; hasta?: string; pagina?: string };
type Divisa = "PEN" | "USD" | null;
type Movimiento = {
  clave: string; fecha: Date; tipo: "INGRESO" | "EGRESO";
  fuente: "COBRO" | "PROVEEDOR" | "GASTO"; concepto: string;
  referencia: string; responsable: string; moneda: Divisa; importe: number; href?: string;
};
const formatDinero = (moneda: "PEN" | "USD", n: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n);
const formatFecha = (d: Date) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" }).format(d);
const paginaValida = (s?: string) => { const n = Number(s); return Number.isSafeInteger(n) && n > 0 ? n : 1; };
function fechaLima(v?: string, fin = false): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T${fin ? "23:59:59.999" : "00:00:00.000"}-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function fechaInput(d: Date) {
  const parts = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const v = (tipo: string) => parts.find(p => p.type === tipo)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}
function tarjetas(movs: Movimiento[], moneda: "PEN" | "USD") {
  return movs.filter(m => m.moneda === moneda).reduce((x, m) => {
    if (m.tipo === "INGRESO") x.ingresos += m.importe; else x.egresos += m.importe;
    return x;
  }, { ingresos: 0, egresos: 0 });
}

export default async function FlujoCaja({ searchParams }: { searchParams: Promise<Filtros> }) {
  await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  const p = await searchParams;
  const hoy = new Date();
  const inicioPredeterminado = new Date(hoy.getTime() - 29 * 86_400_000);
  const desdeTexto = p.desde ?? fechaInput(inicioPredeterminado);
  const hastaTexto = p.hasta ?? fechaInput(hoy);
  const desde = fechaLima(desdeTexto), hasta = fechaLima(hastaTexto, true);
  const q = (p.q ?? "").trim().slice(0, 100).toLocaleLowerCase("es-PE");
  const tipo = p.tipo === "INGRESO" || p.tipo === "EGRESO" ? p.tipo : "";
  const moneda = p.moneda === "PEN" || p.moneda === "USD" || p.moneda === "SIN_MONEDA" ? p.moneda : "";
  const pagina = paginaValida(p.pagina);
  const porPagina = 20;

  // Evitar consultas históricas ilimitadas. Si se requiere un rango mayor,
  // conviene crear una vista SQL UNION ALL con paginación a nivel PostgreSQL.
  const rangoValido = Boolean(desde && hasta && desde <= hasta && hasta.getTime() - desde.getTime() <= 93 * 86_400_000);
  const movs: Movimiento[] = [];
  if (rangoValido && desde && hasta) {
    const [pagos, desembolsos, gastos] = await Promise.all([
      tipo === "EGRESO" || moneda === "SIN_MONEDA" ? Promise.resolve([]) : prisma.pago.findMany({
        where: { fecha: { gte: desde, lte: hasta }, metodoPago: { not: "CREDITO" }, ...(moneda ? { venta: { moneda: moneda as "PEN" | "USD" } } : {}) },
        select: { id: true, fecha: true, monto: true, metodoPago: true, referencia: true,
          venta: { select: { id: true, moneda: true, cliente: { select: { razonSocial: true } } } },
          registradoPor: { select: { nombre: true } } },
      }),
      tipo === "INGRESO" || moneda === "SIN_MONEDA" ? Promise.resolve([]) : prisma.desembolsoPago.findMany({
        where: { fechaPago: { gte: desde, lte: hasta }, ...(moneda ? { ordenPago: { moneda: moneda as "PEN" | "USD" } } : {}) },
        select: { id: true, fechaPago: true, monto: true, metodo: true, referencia: true,
          ordenPago: { select: { id: true, moneda: true, compra: { select: { proveedor: { select: { razonSocial: true } } } } } },
          responsable: { select: { nombre: true } } },
      }),
      tipo === "INGRESO" || (moneda !== "" && moneda !== "SIN_MONEDA") ? Promise.resolve([]) : prisma.gasto.findMany({
        where: { fecha: { gte: desde, lte: hasta }, medioPago: { not: "CREDITO" } },
        select: { id: true, fecha: true, monto: true, tipoGasto: true, descripcion: true,
          medioPago: true, responsable: { select: { nombre: true } } },
      }),
    ]);
    for (const pago of pagos) movs.push({ clave: `COB-${pago.id}`, fecha: pago.fecha, tipo: "INGRESO", fuente: "COBRO", concepto: `${pago.venta.cliente.razonSocial} · Venta #${pago.venta.id}`, referencia: pago.referencia || pago.metodoPago, responsable: pago.registradoPor?.nombre ?? "No registrado", moneda: pago.venta.moneda, importe: Number(pago.monto), href: `/dashboard/ventas/${pago.venta.id}` });
    for (const d of desembolsos) movs.push({ clave: `DES-${d.id}`, fecha: d.fechaPago, tipo: "EGRESO", fuente: "PROVEEDOR", concepto: `${d.ordenPago.compra.proveedor.razonSocial} · OP #${d.ordenPago.id}`, referencia: d.referencia || d.metodo, responsable: d.responsable.nombre, moneda: d.ordenPago.moneda, importe: Number(d.monto), href: `/dashboard/ordenes-pago` });
    for (const g of gastos) movs.push({ clave: `GAS-${g.id}`, fecha: g.fecha, tipo: "EGRESO", fuente: "GASTO", concepto: `${g.tipoGasto}${g.descripcion ? ` · ${g.descripcion}` : ""}`, referencia: g.medioPago, responsable: g.responsable.nombre, moneda: null, importe: Number(g.monto) });
  }
  // El filtro de texto se aplica de manera uniforme a las tres fuentes.
  const movimientos = movs.filter(m => !q || `${m.clave} ${m.concepto} ${m.referencia} ${m.responsable}`.toLocaleLowerCase("es-PE").includes(q))
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || a.clave.localeCompare(b.clave));
  const pen = tarjetas(movimientos, "PEN"), usd = tarjetas(movimientos, "USD");
  const sinMoneda = movimientos.filter(m => m.moneda === null).length;
  const paginas = Math.max(1, Math.ceil(movimientos.length / porPagina));
  const paginaActual = Math.min(pagina, paginas);
  const lista = movimientos.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
  const hrefPagina = (n: number) => `/dashboard/caja?${new URLSearchParams({ desde: desdeTexto, hasta: hastaTexto, ...(q ? { q } : {}), ...(tipo ? { tipo } : {}), ...(moneda ? { moneda } : {}), pagina: String(n) })}`;
  const punto = (d: Date) => fechaInput(d);
  const series = [...new Set(movimientos.filter(m => m.moneda === "PEN").map(m => punto(m.fecha)))].sort().slice(-8).map(d => ({
    dia: d.slice(5),
    ingresos: movimientos.filter(m => m.moneda === "PEN" && punto(m.fecha) === d && m.tipo === "INGRESO").reduce((a, m) => a + m.importe, 0),
    egresos: movimientos.filter(m => m.moneda === "PEN" && punto(m.fecha) === d && m.tipo === "EGRESO").reduce((a, m) => a + m.importe, 0),
  }));
  const max = Math.max(1, ...series.flatMap(s => [s.ingresos, s.egresos]));

  return <main className="mx-auto max-w-[1550px] space-y-6 pb-10">
    <header><p className="text-xs text-slate-500">Finanzas / Movimientos</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#123E70] sm:text-3xl"><Landmark className="h-7 w-7" /> Flujo de caja</h1><p className="mt-1 text-sm text-slate-600">Ingresos y egresos realmente registrados. Las ventas pendientes y las órdenes solicitadas no se consideran efectivo.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta titulo="Ingresos · PEN" valor={formatDinero("PEN", pen.ingresos)} />
      <Tarjeta titulo="Egresos · PEN" valor={formatDinero("PEN", pen.egresos)} />
      <Tarjeta titulo="Saldo neto · PEN" valor={formatDinero("PEN", pen.ingresos - pen.egresos)} destacado />
      <Tarjeta titulo="Saldo neto · USD" valor={formatDinero("USD", usd.ingresos - usd.egresos)} destacado />
    </section>
    <section className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      Dólares: ingresos {formatDinero("USD", usd.ingresos)} · egresos {formatDinero("USD", usd.egresos)}. Se calculan por separado de los soles.
      {sinMoneda > 0 && <p className="mt-1 text-amber-800"><strong>{sinMoneda} gasto(s) operativo(s)</strong> no tienen moneda en el esquema actual. Se muestran en el detalle como «Sin clasificar», pero no se incluyen en los saldos para evitar asignarlos incorrectamente.</p>}
      <p className="mt-1 text-xs">El saldo neto representa el flujo del período filtrado, no el saldo de una cuenta bancaria ni un arqueo físico.</p>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b p-4"><h2 className="font-bold text-[#123E70]">Movimientos financieros</h2><p className="text-xs text-slate-500">Cobros de ventas, desembolsos a proveedores y gastos operativos.</p></div>
      <form action="/dashboard/caja" method="get" className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(210px,1fr)_125px_145px_155px_155px_auto] xl:items-end">
        <label className="text-xs font-semibold text-slate-600">Buscar movimiento<div className="relative mt-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input name="q" defaultValue={p.q ?? ""} placeholder="Cliente, referencia, responsable..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" /></div></label>
        <label className="text-xs font-semibold text-slate-600">Tipo<select name="tipo" defaultValue={tipo} className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Todos</option><option value="INGRESO">Ingresos</option><option value="EGRESO">Egresos</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Moneda<select name="moneda" defaultValue={moneda} className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Todas</option><option value="PEN">PEN</option><option value="USD">USD</option><option value="SIN_MONEDA">Sin clasificar</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Desde<input type="date" name="desde" defaultValue={desdeTexto} className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">Hasta<input type="date" name="hasta" defaultValue={hastaTexto} className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" /></label>
        <div className="flex gap-2"><button type="submit" className="h-10 rounded-lg bg-[#123E70] px-4 text-sm font-semibold text-white">Filtrar</button><Link href="/dashboard/caja" className="inline-flex h-10 items-center rounded-lg border px-3 text-sm">Limpiar</Link></div>
      </form>
      {!rangoValido && <div role="alert" className="p-5 text-sm text-rose-700">Selecciona un rango de fechas válido de hasta 93 días.</div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Movimiento", "Fecha", "Tipo", "Origen", "Concepto", "Referencia", "Responsable", "Moneda", "Importe"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{lista.map(m => <tr key={m.clave} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold text-[#123E70]">{m.clave}</td><td className="whitespace-nowrap px-4 py-3">{formatFecha(m.fecha)}</td><td className="px-4 py-3">{m.tipo === "INGRESO" ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"><ArrowDownLeft className="h-3 w-3"/>Ingreso</span> : <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800"><ArrowUpRight className="h-3 w-3"/>Egreso</span>}</td><td className="px-4 py-3">{m.fuente === "COBRO" ? "Cobro de venta" : m.fuente === "PROVEEDOR" ? "Pago a proveedor" : "Gasto operativo"}</td><td className="px-4 py-3">{m.href ? <Link href={m.href} className="font-medium text-sky-700 hover:underline">{m.concepto}</Link> : m.concepto}</td><td className="px-4 py-3">{m.referencia}</td><td className="px-4 py-3">{m.responsable}</td><td className="px-4 py-3">{m.moneda || <span className="text-amber-700">Sin clasificar</span>}</td><td className="whitespace-nowrap px-4 py-3 text-right font-bold">{m.moneda ? formatDinero(m.moneda, m.importe) : `${m.importe.toFixed(2)} (sin moneda)`}</td></tr>)}{lista.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No hay movimientos para estos filtros.</td></tr>}</tbody></table></div>
      <footer className="flex items-center justify-between gap-3 border-t p-4 text-sm"><span className="text-slate-500">Mostrando {lista.length} de {movimientos.length} · Página {paginaActual} de {paginas}</span><div className="flex gap-2"><Link aria-disabled={paginaActual <= 1} className={`rounded-lg border px-3 py-2 ${paginaActual <= 1 ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={hrefPagina(Math.max(1, paginaActual - 1))}>Anterior</Link><Link aria-disabled={paginaActual >= paginas} className={`rounded-lg border px-3 py-2 ${paginaActual >= paginas ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={hrefPagina(Math.min(paginas, paginaActual + 1))}>Siguiente</Link></div></footer>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-[#123E70]">Movimientos diarios en soles</h2><p className="text-xs text-slate-500">Últimos ocho días con movimientos, dentro del período filtrado. Gastos sin moneda excluidos.</p></div><div className="flex h-48 items-end gap-3 overflow-x-auto border-b border-slate-200 pb-2">{series.length ? series.map(s => <div key={s.dia} className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-1"><div className="flex h-[85%] w-full items-end justify-center gap-1"><div title={`Ingreso: ${formatDinero("PEN",s.ingresos)}`} className="w-4 rounded-t bg-emerald-500" style={{height: `${Math.max(s.ingresos ? 3 : 0, s.ingresos / max * 100)}%`}}/><div title={`Egreso: ${formatDinero("PEN",s.egresos)}`} className="w-4 rounded-t bg-rose-400" style={{height: `${Math.max(s.egresos ? 3 : 0, s.egresos / max * 100)}%`}}/></div><span className="text-[11px] text-slate-500">{s.dia}</span></div>) : <div className="m-auto text-sm text-slate-500">Sin datos suficientes para graficar.</div>}</div><div className="mt-3 flex gap-5 text-xs text-slate-600"><span>🟩 Ingresos</span><span>🟥 Egresos</span></div></section>
  </main>;
}
function Tarjeta({ titulo, valor, destacado = false }: { titulo: string; valor: string; destacado?: boolean }) { return <div className={`rounded-xl border p-4 shadow-sm ${destacado ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white"}`}><p className="text-xs text-slate-600">{titulo}</p><p className="mt-2 text-xl font-bold text-[#123E70]">{valor}</p></div>; }
