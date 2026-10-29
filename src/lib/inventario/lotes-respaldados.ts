
import { prisma } from "@/lib/prisma";

function obtenerHoyPeru(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtenerParte = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return [
    obtenerParte("year"),
    obtenerParte("month"),
    obtenerParte("day"),
  ].join("-");
}

export async function consultarInventarioRespaldado() {
  const hoyISO = obtenerHoyPeru();

  // 1. Consultar productos, lotes y recepciones.
  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      estado: true,
      stockActual: true,
      stockMinimo: true,
      categoriaId: true,

      categoria: {
        select: {
          nombre: true,
        },
      },

      lotes: {
        select: {
          id: true,
          numeroLote: true,
          fechaVencimiento: true,
          cantidadInicial: true,
          cantidadDisponible: true,

          // Nuevo campo de calidad.
          estadoCalidad: true,

          recepciones: {
            select: {
              cantidad: true,
              compraId: true,
              compra: {
                select: {
                  proveedor: {
                    select: {
                      razonSocial: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          fechaVencimiento: "asc",
        },
      },
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // 2. Procesar el inventario respaldado.
  const inventario = productos.map((producto) => {
    const lotes = producto.lotes.flatMap((lote) => {
      const totalRecibido = lote.recepciones.reduce(
        (total, recepcion) =>
          total + recepcion.cantidad,
        0
      );

      // Excluir lotes sin respaldo o con cantidades
      // inconsistentes, conservando la regla original.
      const respaldado =
        lote.recepciones.length > 0 &&
        lote.cantidadInicial <= totalRecibido &&
        lote.cantidadDisponible >= 0 &&
        lote.cantidadDisponible <= lote.cantidadInicial;

      if (!respaldado) {
        return [];
      }

      const { recepciones, ...datosLote } = lote;

      return [
        {
          ...datosLote,
          compras: recepciones.map((recepcion) => ({
            compraId: recepcion.compraId,
            proveedor:
              recepcion.compra.proveedor.razonSocial,
            cantidadRecibida: recepcion.cantidad,
            origen: "Recepción registrada",
          })),
        },
      ];
    });

    // 3. Stock físico respaldado por lotes.
    const stockLotes = lotes.reduce(
      (total, lote) =>
        total + lote.cantidadDisponible,
      0
    );

    // 4. Stock apto para venta.
    const stockAptoVenta = lotes.reduce(
      (total, lote) => {
        const vencimientoISO = lote.fechaVencimiento
          .toISOString()
          .slice(0, 10);

        const apto =
          lote.estadoCalidad === "DISPONIBLE" &&
          vencimientoISO >= hoyISO;

        return total + (
          apto ? lote.cantidadDisponible : 0
        );
      },
      0
    );

    // 5. Retornar información del producto.
    return {
      ...producto,
      lotes,
      stockLotes,
      stockAptoVenta,
      diferencia: producto.stockActual - stockLotes,
    };
  });

  // 6. Conservar únicamente productos con lotes respaldados.
  return inventario.filter(
    (producto) => producto.lotes.length > 0
  );
}
