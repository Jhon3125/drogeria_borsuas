import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { TabsCliente360, type Cliente360Datos } from "./tabs-cliente";

type Props = { params: Promise<{ id: string }> };
const fecha = (valor: Date | null | undefined) => valor?.toISOString() ?? null;
const monto = (valor: { toString(): string }) => valor.toString();

export default async function DetalleClientePage({ params }: Props) {
  await exigirRol(["SUPER_ADMIN", "ADMIN", "COMERCIAL"]);
  const { id } = await params;
  const clienteId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(clienteId) || clienteId <= 0) notFound();

  const [cliente, oportunidades, cotizaciones, ventas, pagos] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: clienteId }, select: {
        id: true, razonSocial: true, documento: true, telefono: true, correo: true,
        direccion: true, estado: true, estadoRelacionComercial: true, fechaCalificacion: true,
      }
    }),
    prisma.oportunidadComercial.findMany({
      where: { clienteId }, orderBy: { fechaCreacion: "desc" }, take: 100,
      select: {
        id: true, titulo: true, etapa: true, montoEstimado: true, moneda: true, fechaCreacion: true,
        fechaActualizacion: true, vendedor: { select: { nombre: true } },
        historial: { orderBy: { fechaCambio: "desc" }, take: 30, select: { id: true, fechaCambio: true, etapaNueva: true, comentario: true } },
        actividades: { orderBy: { fecha: "desc" }, take: 30, select: { id: true, fecha: true, tipo: true, resultado: true, observaciones: true } },
      }
    }),
    prisma.cotizacion.findMany({
      where: { clienteId }, orderBy: { fecha: "desc" }, take: 100,
      select: {
        id: true, version: true, oportunidadId: true, estado: true, moneda: true, importeTotal: true,
        fecha: true, validezHasta: true, vendedor: { select: { nombre: true } }, venta: { select: { id: true } },
      }
    }),
    prisma.venta.findMany({
      where: { clienteId }, orderBy: { fecha: "desc" }, take: 100,
      select: {
        id: true, fecha: true, estado: true, moneda: true, importeTotal: true, saldoPendiente: true,
        cotizacionId: true, vendedor: { select: { nombre: true } },
      }
    }),
    prisma.pago.findMany({
      where: { venta: { clienteId } }, orderBy: { fecha: "desc" }, take: 100,
      select: {
        id: true, fecha: true, ventaId: true, monto: true, metodoPago: true,
        venta: { select: { moneda: true } },
      }
    }),
  ]);
  if (!cliente) notFound();

  const datos: Cliente360Datos = {
    cliente: { ...cliente, fechaCalificacion: fecha(cliente.fechaCalificacion) },
    oportunidades: oportunidades.map((o) => ({
      id: o.id, titulo: o.titulo, etapa: o.etapa, montoEstimado: o.montoEstimado ? monto(o.montoEstimado) : null,
      moneda: o.moneda, fechaCreacion: fecha(o.fechaCreacion)!, vendedor: o.vendedor.nombre,
    })),
    cotizaciones: cotizaciones.map((c) => ({
      id: c.id, version: c.version, oportunidadId: c.oportunidadId, estado: c.estado,
      moneda: c.moneda, total: monto(c.importeTotal), fecha: fecha(c.fecha)!,
      validezHasta: fecha(c.validezHasta), vendedor: c.vendedor.nombre, ventaId: c.venta?.id ?? null,
    })),
    ventas: ventas.map((v) => ({
      id: v.id, estado: v.estado, fecha: fecha(v.fecha)!, moneda: v.moneda,
      total: monto(v.importeTotal), saldo: monto(v.saldoPendiente),
      cotizacionId: v.cotizacionId, vendedor: v.vendedor.nombre,
    })),
    pagos: pagos.map((p) => ({
      id: p.id, ventaId: p.ventaId, monto: monto(p.monto), fecha: fecha(p.fecha)!,
      metodoPago: p.metodoPago, moneda: p.venta.moneda,
    })),
    historial: [
      ...oportunidades.flatMap((o) => [
        ...o.historial.map((h) => ({
          id: `h-${h.id}`, fecha: fecha(h.fechaCambio)!,
          titulo: `Oportunidad OP-${String(o.id).padStart(4, "0")} · ${h.etapaNueva}`,
          detalle: h.comentario ?? "Cambio de etapa", href: "/dashboard/ventas/crm"
        })),
        ...o.actividades.map((a) => ({
          id: `a-${a.id}`, fecha: fecha(a.fecha)!,
          titulo: `Actividad ${a.tipo} · ${a.resultado}`,
          detalle: a.observaciones, href: "/dashboard/ventas/crm"
        })),
      ]),
      ...cotizaciones.map((c) => ({
        id: `c-${c.id}`, fecha: fecha(c.fecha)!,
        titulo: `Cotización COT-${String(c.id).padStart(5, "0")} · v${c.version}`,
        detalle: `Estado: ${c.estado}`, href: "/dashboard/cotizaciones"
      })),
      ...ventas.map((v) => ({
        id: `v-${v.id}`, fecha: fecha(v.fecha)!,
        titulo: `Venta #${v.id}`, detalle: `Estado: ${v.estado}`,
        href: `/dashboard/ventas/${v.id}`
      })),
      ...pagos.map((p) => ({
        id: `p-${p.id}`, fecha: fecha(p.fecha)!,
        titulo: `Cobro #${p.id}`,
        detalle: `${p.venta.moneda} ${monto(p.monto)} · ${p.metodoPago}`,
        href: `/dashboard/ventas/${p.ventaId}`
      })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 150),
    registrosLimitados: oportunidades.length === 100 || cotizaciones.length === 100 || ventas.length === 100 || pagos.length === 100,
  };

  return (
    <main className="space-y-5 p-4 md:p-6">
      <Link href="/dashboard/clientes" className="text-sm font-semibold text-[#087EBD] hover:underline">← Volver a clientes</Link>
      <TabsCliente360 datos={datos} />
    </main>
  );
}
