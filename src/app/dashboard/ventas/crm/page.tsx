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
          select: { id: true, estado: true, moneda: true, importeTotal: true, fecha: true, validezHasta: true, version: true, cotizacionAnteriorId: true, revisionSiguiente: { select: { id: true } }, descuento: true, observaciones: true, condicionPago: true, plazoEntrega: true, clienteId: true, oportunidadId: true, detalles: { select: { productoId: true, cantidad: true, precioUnitario: true, descuento: true } } },
        },
        cliente: { select: { razonSocial: true, estadoRelacionComercial: true, documento: true, telefono: true, correo: true, direccion: true } },
        actividades: { orderBy: { fecha: "desc" }, take: 30, select: {id:true,tipo:true,resultado:true,personaContacto:true,observaciones:true,fecha:true,usuario:{select:{nombre:true}}} },
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
        estadoRelacionComercial: o.cliente.estadoRelacionComercial,
        datosCliente: { razonSocial: o.cliente.razonSocial, documento: o.cliente.documento, telefono: o.cliente.telefono, correo: o.cliente.correo, direccion: o.cliente.direccion },
        actividades: o.actividades.map(a=>({ id:a.id, tipo:a.tipo, resultado:a.resultado, personaContacto:a.personaContacto??"", observaciones:a.observaciones, fecha:a.fecha.toISOString(), usuario:a.usuario.nombre })),
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
          version: c.version, cotizacionAnteriorId: c.cotizacionAnteriorId,
          tieneRevisionPosterior: Boolean(c.revisionSiguiente),
          revision: {
            id: c.id, version: c.version, clienteId: c.clienteId, oportunidadId: c.oportunidadId,
            descuento: c.descuento.toFixed(2), observaciones: c.observaciones ?? "",
            condicionPago: c.condicionPago ?? "", plazoEntrega: c.plazoEntrega ?? "",
            validezHasta: c.validezHasta?.toISOString().slice(0,10) ?? "",
            items: c.detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad, precioUnitario: d.precioUnitario.toFixed(2), descuento: d.descuento.toFixed(2) })),
          },
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
