import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

export default async function MovimientosLogisticos() {
  await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN"]);
  const movimientos = await prisma.movimientoInventario.findMany({
    where: { OR: [{ tipo: "SALIDA_VENTA", motivo: { startsWith: "Salida despacho #" } }, { tipo: "ENTRADA_DEVOLUCION", motivo: { startsWith: "Devolución despacho #" } }] },
    orderBy: { fecha: "desc" }, take: 150,
    include: { lote: { select: { numeroLote: true } }, producto: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
  });
  return <main className="mx-auto max-w-6xl space-y-6 pb-10"><header><p className="text-sm text-slate-500">Logística / Trazabilidad</p><h1 className="text-3xl font-bold text-[#123E70]">Movimientos por despacho y lote</h1><p className="text-sm text-slate-500">Últimos 150 movimientos de salida y devolución asociados a despachos.</p></header>
    <Link className="inline-block rounded-lg border bg-white px-4 py-2 text-sm" href="/dashboard/logistica/panel">Volver al panel</Link>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["Fecha", "Movimiento", "Producto", "Lote", "Unidades", "Responsable", "Despacho"].map(x => <th className="px-3 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{movimientos.map(m => { const numero = m.motivo?.match(/despacho #(\d+)/)?.[1];return <tr key={m.id} className="border-t"><td className="px-3 py-3">{m.fecha.toLocaleString("es-PE", { timeZone: "America/Lima" })}</td><td className="px-3 py-3">{m.tipo === "SALIDA_VENTA" ? "Salida" : "Reintegro"}</td><td className="px-3 py-3">{m.producto.nombre}</td><td className="px-3 py-3">{m.lote?.numeroLote ?? "—"}</td><td className="px-3 py-3 font-semibold">{m.tipo === "SALIDA_VENTA" ? "−" : "+"}{m.cantidad}</td><td className="px-3 py-3">{m.usuario?.nombre ?? "—"}</td><td className="px-3 py-3">{numero ? <Link className="font-semibold text-[#123E70] underline" href="/dashboard/logistica/despachos">#{numero}</Link> : "—"}</td></tr>;})}</tbody></table>{!movimientos.length && <p className="p-6 text-sm text-slate-500">Todavía no hay movimientos logísticos.</p>}</div>
  </main>;
}
