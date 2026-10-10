import { prisma } from "@/lib/prisma";

/** Inventario operativo: únicamente lotes con recepción registrada de forma directa. */
export async function consultarInventarioRespaldado() {
  const productos = await prisma.producto.findMany({
    select: {
      id: true, codigo: true, nombre: true, estado: true,
      stockActual: true, stockMinimo: true, categoriaId: true,
      categoria: {select: {nombre: true}},
      lotes: {select: {
        id: true, numeroLote: true, fechaVencimiento: true,
        cantidadInicial: true, cantidadDisponible: true,
        recepciones: {select: {
          cantidad: true, compraId: true,
          compra: {select: {proveedor: {select: {razonSocial: true}}}},
        }},
      }, orderBy: {fechaVencimiento: "asc"}},
    },
    orderBy: {nombre: "asc"},
  });
  const inventario = productos.map(producto => {
    const lotes = producto.lotes.flatMap(lote => {
      const recibido = lote.recepciones.reduce((n, r) => n + r.cantidad, 0);
      // No mezclar existencias históricas sin procedencia explícita.
      if (!lote.recepciones.length || lote.cantidadInicial > recibido ||
          lote.cantidadDisponible < 0 || lote.cantidadDisponible > lote.cantidadInicial) return [];
      const {recepciones, ...datosLote} = lote;
      return [{...datosLote, compras: recepciones.map(r => ({
        compraId: r.compraId, proveedor: r.compra.proveedor.razonSocial,
        cantidadRecibida: r.cantidad, origen: "Recepción registrada",
      }))}];
    });
    const stockLotes = lotes.reduce((n, l) => n + l.cantidadDisponible, 0);
    return {...producto, lotes, stockLotes, diferencia: producto.stockActual - stockLotes};
  });
  return inventario.filter(p => p.lotes.length > 0);
}
