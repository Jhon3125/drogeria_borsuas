import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { TableroCRM } from "./tablero-crm";

export default async function CRMPage() {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const usuarioId = Number(usuario.id);
  const puedeVerTodas = usuario.rol === "SUPER_ADMIN" || usuario.rol === "ADMIN";

  const [oportunidades, clientes, vendedores, productosCotizacion] = await Promise.all([
    prisma.oportunidadComercial.findMany({
      where: puedeVerTodas ? {} : { vendedorId: usuarioId },
      select: {
        id: true, titulo: true, clienteId: true, vendedorId: true, etapa: true,
        montoEstimado: true, moneda: true, descripcion: true, proximaActividad: true,
        fechaSeguimiento: true, fechaCreacion: true, motivoPerdida: true,
        historial: { orderBy: { fechaCambio: "desc" }, take: 40, select: { id: true, etapaAnterior: true, etapaNueva: true, comentario: true, fechaCambio: true, usuario: { select: { nombre: true } } } },
        cotizaciones: {
          orderBy: [{ fecha: "desc" }, { id: "desc" }],
          select: { id: true, estado: true, moneda: true, importeTotal: true, fecha: true, validezHasta: true },
        },
        cliente: { select: { razonSocial: true } },
        vendedor: { select: { nombre: true } },
      },
      orderBy: [{ fechaActualizacion: "desc" }, { id: "desc" }],
    }),
    prisma.cliente.findMany({
      where: { estado: true }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" },
    }),
    prisma.usuario.findMany({
      where: { estado: "ACTIVO", rol: { in: ROLES_COMERCIAL } },
      select: { id: true, nombre: true }, orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: { estado: true, moneda: { in: ["PEN", "USD"] } },
      select: { id: true, codigo: true, nombre: true, moneda: true, precioVenta: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <TableroCRM
      oportunidades={oportunidades.map((o) => ({
        id: o.id,
        titulo: o.titulo,
        clienteId: o.clienteId,
        cliente: o.cliente.razonSocial,
        vendedorId: o.vendedorId,
        vendedor: o.vendedor.nombre,
        etapa: o.etapa,
        montoEstimado: o.montoEstimado?.toString() ?? "",
        moneda: o.moneda,
        descripcion: o.descripcion ?? "",
        proximaActividad: o.proximaActividad ?? "",
        fechaSeguimiento: o.fechaSeguimiento ? o.fechaSeguimiento.toISOString().slice(0, 10) : "",
        fechaCreacion: o.fechaCreacion.toISOString(),
        motivoPerdida: o.motivoPerdida ?? "",
        cotizaciones: o.cotizaciones.map((c) => ({
          id: c.id, estado: c.estado, moneda: c.moneda,
          importeTotal: c.importeTotal.toFixed(2),
          fecha: c.fecha.toISOString(),
          validezHasta: c.validezHasta?.toISOString() ?? null,
        })),
        historial: o.historial.map((h) => ({ id: h.id, anterior: h.etapaAnterior, nueva: h.etapaNueva, comentario: h.comentario ?? "", fecha: h.fechaCambio.toISOString(), usuario: h.usuario.nombre })),
      }))}
      clientes={clientes}
      productosCotizacion={productosCotizacion.map((p) => ({
        id: p.id, codigo: p.codigo, nombre: p.nombre, moneda: p.moneda,
        precioVenta: p.precioVenta.toFixed(2),
      }))}
      vendedores={vendedores}
      usuarioId={usuarioId}
      administrador={puedeVerTodas}
    />
  );
}
