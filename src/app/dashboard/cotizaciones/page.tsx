import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { CotizacionForm } from "./form";
import { AccionesEstadoCotizacion } from "./acciones-estado";

type Props = { searchParams: Promise<{ oportunidadId?: string }> };
export default async function CotizacionesPage({ searchParams }: Props) {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const { oportunidadId: rawId } = await searchParams;
  const oportunidadId = rawId && /^\d+$/.test(rawId) && Number.isSafeInteger(Number(rawId)) ? Number(rawId) : null;
  const [clientes, productos, cotizaciones, oportunidad] = await Promise.all([
    prisma.cliente.findMany({ where: { estado: true }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } }),
    prisma.producto.findMany({ where: { estado: true }, select: { id: true, codigo: true, nombre: true, precioVenta: true, moneda: true }, orderBy: { nombre: "asc" } }),
    prisma.cotizacion.findMany({ where: usuario.rol === "COMERCIAL" ? { vendedorId: Number(usuario.id) } : {}, orderBy: { fecha: "desc" }, take: 50, include: { cliente: { select: { razonSocial: true } }, detalles: { include: { producto: { select: { nombre: true } } } }, oportunidad: { select: { id: true } } } }),
    oportunidadId ? prisma.oportunidadComercial.findUnique({ where: { id: oportunidadId }, select: { id: true, clienteId: true, vendedorId: true, etapa: true } }) : Promise.resolve(null),
  ]);
  const puedeVincular = oportunidad && oportunidad.etapa !== "PROSPECTO" && oportunidad.etapa !== "GANADA" && oportunidad.etapa !== "PERDIDA" && (usuario.rol !== "COMERCIAL" || oportunidad.vendedorId === Number(usuario.id));
  const idInicial = puedeVincular ? oportunidad.clienteId : undefined;
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold text-[#123E70]">Cotizaciones</h1><p className="text-slate-600">Propuestas comerciales independientes de las ventas.</p></header>
    {oportunidadId && !puedeVincular && <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">No se puede vincular una cotización a esa oportunidad.</p>}
    {clientes.length === 0 && <p className="rounded-lg border bg-amber-50 p-4">Registra primero un cliente en <Link href="/dashboard/clientes" className="underline">Clientes</Link>.</p>}
    {(!oportunidadId || puedeVincular) && <CotizacionForm clientes={clientes} productos={productos.map((p) => ({ ...p, precioVenta: p.precioVenta.toFixed(2) }))} clienteInicial={idInicial} oportunidadId={puedeVincular ? oportunidad.id : undefined} />}
    <section className="space-y-3"><h2 className="text-xl font-bold text-[#123E70]">Cotizaciones recientes</h2>
      {cotizaciones.map((c) => <article key={c.id} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">COT-{String(c.id).padStart(5, "0")} · {c.cliente.razonSocial}</h3><p className="text-sm text-slate-500">{c.fecha.toLocaleDateString("es-PE")} · {c.estado.replaceAll("_", " ")}{c.oportunidad && ` · OP-${String(c.oportunidad.id).padStart(4, "0")}`}</p></div>
          <div className="flex flex-wrap items-center gap-3"><AccionesEstadoCotizacion cotizacionId={c.id} estado={c.estado} /><b className="text-[#123E70]">{c.moneda === "USD" ? "US$" : "S/"} {c.importeTotal.toFixed(2)}</b><a href={`/dashboard/cotizaciones/${c.id}/pdf`} className="rounded-lg border border-[#123E70] px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-blue-50">Descargar PDF</a></div></div>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">{c.detalles.map((d) => <li key={d.id}>{d.producto.nombre} · {d.cantidad} × {c.moneda === "USD" ? "US$" : "S/"} {d.precioUnitario.toFixed(2)}</li>)}</ul>
      </article>)}
      {cotizaciones.length === 0 && <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Todavía no hay cotizaciones.</div>}
    </section>
  </div>;
}
