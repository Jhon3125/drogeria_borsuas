import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export default async function VentasPage() {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const ventas = await prisma.venta.findMany({
    where: usuario.rol === "COMERCIAL" ? { vendedorId: Number(usuario.id) } : {},
    orderBy: { fecha: "desc" }, take: 100,
    include: { cliente: { select: { razonSocial: true } }, vendedor: { select: { nombre: true } }, _count: { select: { detalles: true } } },
  });
  const resumen = ventas.reduce((acc, v) => { acc[v.estado] = (acc[v.estado] || 0) + 1; return acc; }, {} as Record<string, number>);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold text-[#123E70]">Ventas</h1><p className="text-slate-600">Operaciones comerciales confirmadas, separadas del seguimiento de oportunidades.</p></header>
    <div className="grid gap-3 sm:grid-cols-3">{[["Confirmadas", resumen.CONFIRMADA || 0], ["En preparación", resumen.EN_PREPARACION || 0], ["Completadas", resumen.COMPLETADA || 0]].map(([label, n]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-[#123E70]">{n}</p></div>)}</div>
    <div className="overflow-x-auto rounded-xl border bg-white p-5"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Código</th><th>Cliente</th><th>Estado</th><th>Vendedor</th><th>Productos</th><th>Total</th></tr></thead>
      <tbody>{ventas.map((v) => <tr key={v.id} className="border-b"><td className="p-3 font-semibold">#{v.id}</td><td>{v.cliente.razonSocial}</td><td>{v.estado.replaceAll("_", " ")}</td><td>{v.vendedor.nombre}</td><td>{v._count.detalles}</td><td>{v.moneda === "USD" ? "US$" : "S/"} {v.importeTotal.toFixed(2)}</td></tr>)}</tbody></table>
      {ventas.length === 0 && <p className="py-8 text-center text-slate-500">Sin ventas confirmadas. <Link className="underline" href="/dashboard/cotizaciones">Ir a cotizaciones</Link>.</p>}
    </div>
  </div>;
}
