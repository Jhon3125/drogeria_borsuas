import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { type CotizacionBase } from "./form";
import { CotizacionPanel } from "./cotizacion-panel";
import { FileText, Columns3, CheckCircle2, Clock3, FileClock } from "lucide-react";
import { TablaCotizaciones } from "./tabla-cotizaciones";
import type { Prisma } from "@/generated/prisma/client";

type Props = { searchParams: Promise<{ oportunidadId?: string; revisar?: string; nueva?: string; q?: string; estado?: string; moneda?: string; pagina?: string; porPagina?: string }> };
const idSeguro = (valor?: string) => valor && /^\d+$/.test(valor) && Number.isSafeInteger(Number(valor)) && Number(valor) > 0 ? Number(valor) : null;

export default async function CotizacionesPage({ searchParams }: Props) {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const { oportunidadId: rawId, revisar: rawRevision, nueva, q: rawQ, estado: rawEstado, moneda: rawMoneda, pagina: rawPagina, porPagina: rawPorPagina } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 100);
  const estados = ["BORRADOR", "EMITIDA", "ACEPTADA", "RECHAZADA", "VENCIDA", "ANULADA"] as const;
  const estado = estados.find(e => e === rawEstado) ?? "TODOS";
  const moneda = rawMoneda === "PEN" || rawMoneda === "USD" ? rawMoneda : "TODAS";
  const porPagina = [10, 20, 50].includes(Number(rawPorPagina)) ? Number(rawPorPagina) : 10;
  const paginaSolicitada = Math.max(1, Math.min(100000, Number.isSafeInteger(Number(rawPagina)) ? Number(rawPagina) : 1));
  const oportunidadId = idSeguro(rawId);
  const revisarId = idSeguro(rawRevision);
  const mostrarFormulario = nueva === "1" || oportunidadId !== null || revisarId !== null;
  const filtro = usuario.rol === "COMERCIAL" ? { vendedorId: Number(usuario.id) } : {};
  const busquedaCondiciones: Prisma.CotizacionWhereInput[] = [
    { cliente: { razonSocial: { contains: q, mode: "insensitive" } } },
    { vendedor: { nombre: { contains: q, mode: "insensitive" } } },
  ];
  const referencia = q.match(/^(COT-|OP-)?(\d+)$/i);
  if (referencia && Number.isSafeInteger(Number(referencia[2]))) {
    const numero = Number(referencia[2]);
    if (referencia[1]?.toUpperCase() === "OP-") {
      busquedaCondiciones.push({ oportunidadId: numero });
    } else if (referencia[1]?.toUpperCase() === "COT-") {
      busquedaCondiciones.push({ id: numero });
    } else {
      busquedaCondiciones.push({ id: numero }, { oportunidadId: numero });
    }
  }
  const condiciones: Prisma.CotizacionWhereInput = {
    ...filtro,
    ...(estado !== "TODOS" ? { estado } : {}),
    ...(moneda !== "TODAS" ? { moneda } : {}),
    ...(q ? { OR: busquedaCondiciones } : {}),
  };
  const totalCotizaciones = await prisma.cotizacion.count({ where: condiciones });
  const paginas = Math.max(1, Math.ceil(totalCotizaciones / porPagina));
  const pagina = Math.min(paginaSolicitada, paginas);
  const [clientes, productos, cotizaciones, oportunidad, anterior, agrupacion] = await Promise.all([
    prisma.cliente.findMany({ where: { estado: true, estadoRelacionComercial: "CALIFICADO" }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } }),
    prisma.producto.findMany({ where: { estado: true }, select: { id: true, codigo: true, nombre: true, precioVenta: true, moneda: true }, orderBy: { nombre: "asc" } }),
    prisma.cotizacion.findMany({ where: condiciones, orderBy: [{ fecha: "desc" }, { id: "desc" }], skip: (pagina - 1) * porPagina, take: porPagina, include: {
      cotizacionAnterior: { select: { id: true } }, revisionSiguiente: { select: { id: true } },
      cliente: { select: { razonSocial: true } }, vendedor: { select: { nombre: true } },
      detalles: { include: { producto: { select: { nombre: true, codigo: true } } } },
      oportunidad: { select: { id: true, etapa: true } }, venta: { select: { id: true } },
    } }),
    oportunidadId ? prisma.oportunidadComercial.findUnique({ where: { id: oportunidadId }, select: { id: true, clienteId: true, vendedorId: true, etapa: true } }) : Promise.resolve(null),
    revisarId ? prisma.cotizacion.findUnique({ where: { id: revisarId }, include: { detalles: true, revisionSiguiente: { select: { id: true } }, oportunidad: { select: { etapa: true, vendedorId: true } } } }) : Promise.resolve(null),
    prisma.cotizacion.groupBy({ by: ["estado"], where: filtro, _count: { _all: true } }),
  ]);
  const contar = (estado: string) => agrupacion.find(g => g.estado === estado)?._count._all ?? 0;
  const puedeVincular = oportunidad && !["PROSPECTO", "GANADA", "PERDIDA"].includes(oportunidad.etapa) &&
    (usuario.rol !== "COMERCIAL" || oportunidad.vendedorId === Number(usuario.id));
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
  const permitirFormulario = mostrarFormulario && (revisarId ? Boolean(revision) : (!oportunidadId || Boolean(puedeVincular)));
  const cifras = [
    { etiqueta: "Borradores", numero: contar("BORRADOR"), icono: FileClock, color: "bg-slate-100 text-slate-700" },
    { etiqueta: "Emitidas", numero: contar("EMITIDA"), icono: Clock3, color: "bg-sky-100 text-sky-700" },
    { etiqueta: "Aceptadas", numero: contar("ACEPTADA"), icono: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
    { etiqueta: "Rechazadas", numero: contar("RECHAZADA"), icono: FileText, color: "bg-rose-100 text-rose-700" },
  ];

  return <main className="mx-auto max-w-[1650px] space-y-6 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-1 text-xs font-medium text-slate-500">Comercial y ventas / Propuestas</p>
        <h1 className="text-3xl font-bold text-[#123E70]">Cotizaciones</h1>
        <p className="mt-1 text-sm text-slate-600">Emite, negocia y versiona propuestas; cada nueva propuesta directa genera una oportunidad en Cotización.</p>
      </div>
      <div className="flex gap-2">
        <Link href="/dashboard/ventas/crm" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#123E70] hover:bg-slate-50"><Columns3 className="h-4 w-4" /> Oportunidades</Link>
        <CotizacionPanel
          clientes={clientes}
          productos={productos.map(p => ({ ...p, precioVenta: p.precioVenta.toFixed(2) }))}
          revision={revision}
          clienteInicial={revision?.clienteId ?? (puedeVincular ? oportunidad.clienteId : undefined)}
          oportunidadId={revision?.oportunidadId ?? (puedeVincular ? oportunidad.id : undefined)}
          abrirInicialmente={Boolean(permitirFormulario)}
          titulo={revision ? `Crear versión v${revision.version + 1}` : "Nueva cotización"}
        />
      </div>
    </header>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cifras.map(c => <div key={c.etiqueta} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`rounded-xl p-3 ${c.color}`}><c.icono className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{c.etiqueta}</p><p className="text-2xl font-bold text-[#123E70]">{c.numero}</p></div></div>)}</section>

    {revisarId && !revision && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No se puede revisar la cotización: verifica su estado, los permisos y que no exista una versión posterior.</p>}
    {oportunidadId && !puedeVincular && !revisarId && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">La oportunidad no admite una nueva cotización.</p>}
    {clientes.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No hay clientes calificados. Completa la calificación de un prospecto antes de cotizar.</p>}


    <TablaCotizaciones
      filas={cotizaciones.map(c => ({
        id: c.id, version: c.version, cliente: c.cliente.razonSocial, vendedor: c.vendedor.nombre,
        fecha: c.fecha.toISOString(), estado: c.estado, moneda: c.moneda,
        total: Number(c.importeTotal), productos: c.detalles.length,
        oportunidadId: c.oportunidad?.id ?? null,
        etapaOportunidad: c.oportunidad?.etapa ?? null,
        cotizacionAnteriorId: c.cotizacionAnterior?.id ?? null,
        revisionSiguienteId: c.revisionSiguiente?.id ?? null,
        ventaId: c.venta?.id ?? null,
        detalle: {
          id: c.id,
          version: c.version,
          estado: c.estado,
          moneda: c.moneda,
          importeTotal: c.importeTotal.toFixed(2),
          fecha: c.fecha.toISOString(),
          validezHasta: c.validezHasta?.toISOString() ?? null,
          revision: {
            id: c.id,
            version: c.version,
            clienteId: c.clienteId,
            oportunidadId: c.oportunidadId,
            descuento: c.descuento.toFixed(2),
            observaciones: c.observaciones ?? "",
            condicionPago: c.condicionPago ?? "",
            plazoEntrega: c.plazoEntrega ?? "",
            validezHasta: c.validezHasta?.toISOString().slice(0, 10) ?? "",
            items: c.detalles.map(d => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario.toFixed(2),
              descuento: d.descuento.toFixed(2),
            })),
          },
        },
      }))}
      productos={productos.map(p => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }))}
      total={totalCotizaciones}
      filtros={{ q, estado, moneda, pagina, porPagina }}
    />
  </main>;
}
