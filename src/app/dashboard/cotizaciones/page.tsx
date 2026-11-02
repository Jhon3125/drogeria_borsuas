import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { CotizacionForm, type CotizacionBase } from "./form";
import { AccionesEstadoCotizacion } from "./acciones-estado";
import { EstadoCotizacionBadge } from "./estado-badge";

type Props = { searchParams: Promise<{ oportunidadId?: string; revisar?: string }> };
export default async function CotizacionesPage({ searchParams }: Props) {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const { oportunidadId: rawId, revisar: rawRevision } = await searchParams;
  const revisarId = rawRevision && /^\d+$/.test(rawRevision) && Number.isSafeInteger(Number(rawRevision)) ? Number(rawRevision) : null;
  const oportunidadId = rawId && /^\d+$/.test(rawId) && Number.isSafeInteger(Number(rawId)) ? Number(rawId) : null;
  const [clientes, productos, cotizaciones, oportunidad, anterior] = await Promise.all([
    prisma.cliente.findMany({ where: { estado: true }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } }),
    prisma.producto.findMany({ where: { estado: true }, select: { id: true, codigo: true, nombre: true, precioVenta: true, moneda: true }, orderBy: { nombre: "asc" } }),
    prisma.cotizacion.findMany({ where: usuario.rol === "COMERCIAL" ? { vendedorId: Number(usuario.id) } : {}, orderBy: { fecha: "desc" }, take: 50, include: { cotizacionAnterior: { select: { id: true } }, revisionSiguiente: { select: { id: true } }, cliente: { select: { razonSocial: true } }, detalles: { include: { producto: { select: { nombre: true } } } }, oportunidad: { select: { id: true } } } }),
    oportunidadId ? prisma.oportunidadComercial.findUnique({ where: { id: oportunidadId }, select: { id: true, clienteId: true, vendedorId: true, etapa: true } }) : Promise.resolve(null),
    revisarId ? prisma.cotizacion.findUnique({ where: { id: revisarId }, include: { detalles: true, revisionSiguiente: { select: { id: true } }, oportunidad: { select: { etapa: true, vendedorId: true } } } }) : Promise.resolve(null),
  ]);
  const puedeVincular = oportunidad && oportunidad.etapa !== "PROSPECTO" && oportunidad.etapa !== "GANADA" && oportunidad.etapa !== "PERDIDA" && (usuario.rol !== "COMERCIAL" || oportunidad.vendedorId === Number(usuario.id));
  const idInicial = puedeVincular ? oportunidad.clienteId : undefined;
  const revisionValida = anterior && anterior.estado === "RECHAZADA" && !anterior.revisionSiguiente &&
    (usuario.rol !== "COMERCIAL" || (anterior.vendedorId === Number(usuario.id) && (!anterior.oportunidad || anterior.oportunidad.vendedorId === Number(usuario.id)))) &&
    (!anterior.oportunidad || !["PROSPECTO", "GANADA", "PERDIDA"].includes(anterior.oportunidad.etapa));
  const revision: CotizacionBase | undefined = revisionValida ? {
    id: anterior.id, version: anterior.version, clienteId: anterior.clienteId,
    oportunidadId: anterior.oportunidadId, descuento: anterior.descuento.toFixed(2),
    observaciones: anterior.observaciones ?? "", condicionPago: anterior.condicionPago ?? "",
    plazoEntrega: anterior.plazoEntrega ?? "", validezHasta: anterior.validezHasta?.toISOString().slice(0, 10) ?? "",
    items: anterior.detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad,
      precioUnitario: d.precioUnitario.toFixed(2), descuento: d.descuento.toFixed(2) })),
  } : undefined;
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold text-[#123E70]">Cotizaciones</h1><p className="text-slate-600">Propuestas comerciales independientes de las ventas.</p></header>
    {revisarId && !revision && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">La propuesta no se puede revisar: verifica el estado, los permisos o si ya tiene una versión posterior.</p>}
    {!revisarId && oportunidadId && !puedeVincular && <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">No se puede vincular una cotización a esa oportunidad.</p>}
    {clientes.length === 0 && <p className="rounded-lg border bg-amber-50 p-4">Registra primero un cliente en <Link href="/dashboard/clientes" className="underline">Clientes</Link>.</p>}
    {(!revisarId && (!oportunidadId || puedeVincular) || Boolean(revision)) && <CotizacionForm key={revision?.id ?? "nueva"} revision={revision} clientes={clientes} productos={productos.map((p) => ({ ...p, precioVenta: p.precioVenta.toFixed(2) }))} clienteInicial={revision?.clienteId ?? idInicial} oportunidadId={revision?.oportunidadId ?? (puedeVincular ? oportunidad.id : undefined)} />}
    <section className="space-y-3"><h2 className="text-xl font-bold text-[#123E70]">Cotizaciones recientes</h2>
      {cotizaciones.map((c) => <article key={c.id} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">COT-{String(c.id).padStart(5, "0")} · {c.cliente.razonSocial}</h3><p className="text-sm text-slate-500">{c.fecha.toLocaleDateString("es-PE")} · v{c.version}{c.oportunidad && ` · OP-${String(c.oportunidad.id).padStart(4, "0")}`}</p><div className="mt-2"><EstadoCotizacionBadge estado={c.estado} /></div></div>
          <div className="flex flex-wrap items-center gap-3"><AccionesEstadoCotizacion cotizacionId={c.id} estado={c.estado} />{c.estado === "RECHAZADA" && !c.revisionSiguiente && <Link href={`/dashboard/cotizaciones?revisar=${c.id}`} className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-[#123E70] hover:bg-sky-100">Crear versión v{c.version + 1}</Link>}<b className="text-[#123E70]">{c.moneda === "USD" ? "US$" : "S/"} {c.importeTotal.toFixed(2)}</b><a href={`/dashboard/cotizaciones/${c.id}/pdf`} className="rounded-lg border border-[#123E70] px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-blue-50">Descargar PDF</a></div></div>
        {c.cotizacionAnterior && <p className="mt-2 text-xs text-sky-700">Revisión de COT-{String(c.cotizacionAnterior.id).padStart(5, "0")}</p>}{c.revisionSiguiente && <p className="mt-2 text-xs text-slate-600">Tiene una revisión posterior: COT-{String(c.revisionSiguiente.id).padStart(5, "0")}</p>}
        <ul className="mt-3 space-y-1 text-sm text-slate-600">{c.detalles.map((d) => <li key={d.id}>{d.producto.nombre} · {d.cantidad} × {c.moneda === "USD" ? "US$" : "S/"} {d.precioUnitario.toFixed(2)}</li>)}</ul>
      </article>)}
      {cotizaciones.length === 0 && <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Todavía no hay cotizaciones.</div>}
    </section>
  </div>;
}
