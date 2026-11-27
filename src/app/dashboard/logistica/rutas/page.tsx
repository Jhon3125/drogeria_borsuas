
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { RutasClient } from "./rutas-client";

type SearchParams = Promise<{
  ventaId?: string | string[];
}>;

export default async function RutasPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const usuario = await exigirRol([
    "SUPER_ADMIN",
    "ADMIN",
    "ALMACEN",
    "CONDUCTOR",
  ]);

  const conductor = usuario.rol === "CONDUCTOR";
  const params = searchParams ? await searchParams : {};
  const ventaParam = Array.isArray(params.ventaId)
    ? params.ventaId[0]
    : params.ventaId;

  const ventaId = Number(ventaParam);
  const preseleccionada =
    Number.isSafeInteger(ventaId) && ventaId > 0 ? ventaId : null;

  const [rutas, conductores, vehiculos, ventas] = await Promise.all([
    prisma.hojaRuta.findMany({
      where: conductor
        ? { conductorId: Number(usuario.id) }
        : {},
      orderBy: { fecha: "desc" },
      take: 100,
      include: {
        conductor: {
          select: { nombre: true },
        },
        vehiculo: {
          select: { placa: true },
        },
        despachos: {
          include: {
            venta: {
              include: {
                cliente: {
                  select: { razonSocial: true },
                },
              },
            },
          },
        },
      },
    }),

    conductor
      ? Promise.resolve([])
      : prisma.usuario.findMany({
        where: {
          rol: "CONDUCTOR",
          estado: "ACTIVO",
        },
        select: {
          id: true,
          nombre: true,
        },
        orderBy: { nombre: "asc" },
      }),

    conductor
      ? Promise.resolve([])
      : prisma.vehiculo.findMany({
        where: { estado: true },
        select: {
          id: true,
          placa: true,
          modelo: true,
        },
        orderBy: { placa: "asc" },
      }),

    conductor
      ? Promise.resolve([])
      : prisma.venta.findMany({
        where: {
          estado: { not: "ANULADA" },
          saldoPendiente: { lte: 0 },
          importeTotal: { gt: 0 },
          despachos: {
            every: {
              estado: "REPROGRAMADO",
              devolucionInventarioEn: { not: null },
            },
          },
          detalles: { some: {} },
        },
        take: 100,
        orderBy: { fecha: "asc" },
        include: {
          cliente: {
            select: { razonSocial: true },
          },
          detalles: {
            select: {
              cantidad: true,
              asignacionesLote: {
                select: { cantidad: true },
              },
            },
          },
        },
      }),
  ]);


  const ventaSolicitada = preseleccionada && !conductor
    ? await prisma.venta.findMany({
      where: {
        id: preseleccionada,
        estado: { not: "ANULADA" },
        saldoPendiente: { lte: 0 },
        importeTotal: { gt: 0 },
        despachos: {
          every: {
            estado: "REPROGRAMADO",
            devolucionInventarioEn: { not: null },
          },
        },
        detalles: { some: {} },
      },
      include: {
        cliente: {
          select: { razonSocial: true },
        },
        detalles: {
          select: {
            cantidad: true,
            asignacionesLote: {
              select: { cantidad: true },
            },
          },
        },
      },
    })
    : [];

  const ventasCandidatas = [
    ...ventas,
    ...ventaSolicitada.filter(
      (solicitada) => !ventas.some((venta) => venta.id === solicitada.id)
    ),
  ];


  const elegibles = ventasCandidatas
    .filter((venta) =>
      venta.detalles.every(
        (detalle) =>
          detalle.asignacionesLote.reduce(
            (total, asignacion) => total + asignacion.cantidad,
            0
          ) >= detalle.cantidad
      )
    )
    .map((venta) => ({
      id: venta.id,
      cliente: venta.cliente.razonSocial,
      moneda: venta.moneda,
      importeTotal: venta.importeTotal.toString(),
    }));

  const rutasDTO = rutas.map((ruta) => ({
    id: ruta.id,
    fecha: ruta.fecha.toISOString(),
    conductor: ruta.conductor.nombre,
    placa: ruta.vehiculo.placa,
    despachos: ruta.despachos.map((despacho) => ({
      id: despacho.id,
      ventaId: despacho.ventaId,
      cliente: despacho.venta.cliente.razonSocial,
      estado: despacho.estado,
      moneda: despacho.venta.moneda,
      importeTotal: despacho.venta.importeTotal.toString(),
    })),
  }));

  return (
    <RutasClient
      rutas={rutasDTO}
      conductores={conductores}
      vehiculos={vehiculos}
      ventas={elegibles}
      puedeCrear={!conductor}
      fechaInicial={new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Lima",
      })}
      preseleccionada={preseleccionada}
    />
  );
}
