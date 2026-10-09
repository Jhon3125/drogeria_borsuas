import { prisma } from "@/lib/prisma";

/**
 * Inventario operativo de solo lectura. La procedencia se valida contra un
 * detalle de una compra RECIBIDO de mismo producto, lote y vencimiento.
 * Las cantidades incongruentes quedan fuera de la vista operativa; se revisan
 * en conciliación, sin alteración automática de datos.
 */
export async function consultarInventarioRespaldado() {
  const [productos, detalles] = await Promise.all([
    prisma.producto.findMany({
      select: {
        id: true, codigo: true, nombre: true, estado: true,
        stockActual: true, stockMinimo: true,
        categoria: { select: { nombre: true } },
        lotes: { select: {
          id: true, numeroLote: true, fechaVencimiento: true,
          cantidadInicial: true, cantidadDisponible: true,
        }, orderBy: { fechaVencimiento: "asc" } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.detalleCompra.findMany({
      where: { compra: { estado: "RECIBIDO" } },
      select: {
        productoId: true, numeroLote: true, fechaVencimiento: true,
        cantidad: true, compraId: true,
        compra: { select: { proveedor: { select: { razonSocial: true } } } },
      },
    }),
  ]);

  type Detalle = (typeof detalles)[number];
  const clave = (productoId: number, numeroLote: string, fecha: Date) =>
    JSON.stringify([productoId, numeroLote, fecha.getTime()]);
  const comprasPorLote = new Map<string, Detalle[]>();
  for (const detalle of detalles) {
    const key = clave(detalle.productoId, detalle.numeroLote, detalle.fechaVencimiento);
    const anteriores = comprasPorLote.get(key) ?? [];
    anteriores.push(detalle);
    comprasPorLote.set(key, anteriores);
  }

  const inventario = productos.map((producto) => {
    const lotes = producto.lotes.flatMap((lote) => {
      const respaldo = comprasPorLote.get(clave(producto.id, lote.numeroLote, lote.fechaVencimiento)) ?? [];
      const recibido = respaldo.reduce((suma, detalle) => suma + detalle.cantidad, 0);
      // No exponer como disponible un lote sin compra, con valores negativos
      // o con cantidades que no pueden justificarse con las recepciones.
      if (!respaldo.length || lote.cantidadDisponible < 0 ||
          lote.cantidadInicial < lote.cantidadDisponible ||
          lote.cantidadInicial > recibido) return [];
      return [{ ...lote, compras: respaldo.map((d) => ({
        compraId: d.compraId, proveedor: d.compra.proveedor.razonSocial, cantidadRecibida: d.cantidad,
      })) }];
    });
    const stockLotes = lotes.reduce((suma, lote) => suma + lote.cantidadDisponible, 0);
    return { ...producto, lotes, stockLotes,
      diferencia: producto.stockActual - stockLotes,
    };
  });
  return inventario.filter((p) => p.lotes.length > 0);
}
