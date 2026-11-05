import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { Wallet, Search } from "lucide-react";

const dinero = (moneda: string, monto: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda === "USD" ? "USD" : "PEN" }).format(monto);
const fecha = (valor: Date) => new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(valor);

type Filtros = { q?: string; metodo?: string; pagina?: string };

export default async function CajaPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  void usuario;
  const p = await searchParams;
  const q = (p.q ?? "").trim().slice(0, 100);
  const metodo = ["EFECTIVO", "TRANSFERENCIA", "TARJETA"].includes(p.metodo ?? "") ? p.metodo as "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" : undefined;
  const pagina = Math.max(1, Number.isFinite(Number(p.pagina)) ? Math.floor(Number(p.pagina)) : 1);
  const porPagina = 15;
  const where = {
    ...(metodo ? { metodoPago: metodo } : {}),
    ...(q ? { OR: [
      { venta: { cliente: { razonSocial: { contains: q, mode: "insensitive" as const } } } },
      ...( /^\d+$/.test(q) ? [{ ventaId: Number(q) }] : []),
    ] } : {}),
  };
  const [cantidad, pagos] = await prisma.$transaction([
    prisma.pago.count({ where }),
    prisma.pago.findMany({
      where,
      include: { venta: { select: { id: true, moneda: true, cliente: { select: { razonSocial: true } } } }, registradoPor: { select: { nombre: true } } },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);
  const paginas = Math.max(1, Math.ceil(cantidad / porPagina));
  const totalPEN = pagos.filter(p => p.venta.moneda === "PEN").reduce((sum, p) => sum + Number(p.monto), 0);
  const totalUSD = pagos.filter(p => p.venta.moneda === "USD").reduce((sum, p) => sum + Number(p.monto), 0);
  const enlace = (n: number) => `/dashboard/caja?${new URLSearchParams({ ...(q ? { q } : {}), ...(metodo ? { metodo } : {}), pagina: String(n) }).toString()}`;

  return <main className="mx-auto max-w-[1450px] space-y-6 pb-10">
    <header><p className="text-xs text-slate-500">Finanzas / Caja</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-[#123E70]"><Wallet className="h-7 w-7" /> Caja y cobros</h1><p className="mt-1 text-sm text-slate-600">Cobros asociados a ventas. Este listado no representa una apertura, cierre ni arqueo de caja.</p></header>
    <div className="grid gap-4 sm:grid-cols-3">
      <Resumen titulo="Cobros encontrados" valor={String(cantidad)} />
      <Resumen titulo="Soles en esta página" valor={dinero("PEN", totalPEN)} />
      <Resumen titulo="Dólares en esta página" valor={dinero("USD", totalUSD)} />
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <form className="flex flex-wrap items-end gap-3 border-b p-4" method="get">
        <label className="min-w-[230px] flex-1 text-xs font-semibold text-slate-600">Buscar cliente o número de venta
          <div className="relative mt-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" defaultValue={q} placeholder="Cliente o ID de venta" className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" /></div>
        </label>
        <label className="text-xs font-semibold text-slate-600">Medio
          <select name="metodo" defaultValue={metodo ?? ""} className="mt-1 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select>
        </label>
        <button type="submit" className="h-10 rounded-lg bg-[#123E70] px-5 text-sm font-semibold text-white hover:bg-[#087EBD]">Filtrar</button>
        <Link href="/dashboard/caja" className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-700">Limpiar</Link>
      </form>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Pago", "Fecha", "Venta", "Cliente", "Medio", "Referencia", "Registrado por", "Importe"].map(c => <th key={c} className="px-4 py-3">{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{pagos.map(p => <tr key={p.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-semibold text-[#123E70]">#{p.id}</td><td className="px-4 py-3 whitespace-nowrap">{fecha(p.fecha)}</td>
          <td className="px-4 py-3"><Link href={`/dashboard/ventas/${p.venta.id}`} className="font-semibold text-sky-700 hover:underline">VTA-{String(p.venta.id).padStart(5, "0")}</Link></td>
          <td className="px-4 py-3">{p.venta.cliente.razonSocial}</td><td className="px-4 py-3">{p.metodoPago}</td><td className="px-4 py-3">{p.referencia ?? "—"}</td><td className="px-4 py-3">{p.registradoPor?.nombre ?? "No registrado"}</td>
          <td className="px-4 py-3 text-right font-bold text-[#123E70]">{dinero(p.venta.moneda, Number(p.monto))}</td>
        </tr>)}{pagos.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No hay cobros para estos filtros.</td></tr>}</tbody>
      </table></div>
      <div className="flex items-center justify-between gap-3 border-t p-4 text-sm"><span className="text-slate-500">Página {pagina} de {paginas}</span><div className="flex gap-2"><Link aria-disabled={pagina <= 1} className={`rounded-lg border px-3 py-2 ${pagina <= 1 ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={enlace(Math.max(1, pagina - 1))}>Anterior</Link><Link aria-disabled={pagina >= paginas} className={`rounded-lg border px-3 py-2 ${pagina >= paginas ? "pointer-events-none text-slate-300" : "text-[#123E70]"}`} href={enlace(Math.min(paginas, pagina + 1))}>Siguiente</Link></div></div>
    </section>
  </main>;
}

function Resumen({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{titulo}</p><p className="mt-2 text-xl font-bold text-[#123E70]">{valor}</p></div>;
}
