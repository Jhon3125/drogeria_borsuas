"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_GESTION, ROLES_RECEPCION } from "@/lib/compras-roles";
import { Prisma } from "@/generated/prisma/client";

const itemSchema = z.object({
  productoId: z.number().int().positive(),

  cantidad: z.number()
    .int()
    .positive()
    .max(1000000),

  precioUnitario: z.string()
    .regex(
      /^\d{1,9}(\.\d{1,2})?$/,
      "Costo unitario inválido"
    ),
});

const schema = z.object({
  proveedorId: z.number().int().positive(),

  moneda: z.enum(["PEN", "USD"]),

  tipoCambio: z.string()
    .regex(
      /^(?:|\d{1,5}(?:\.\d{1,6})?)$/,
      "Tipo de cambio inválido"
    )
    .default(""),

  fechaEntregaEstimada: z.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Fecha estimada inválida"
    )
    .nullable()
    .optional(),

  observaciones: z.string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .default(""),

  items: z.array(itemSchema).min(1).max(100),
});

export type EstadoCompra = { ok?: string; error?: string } | undefined;
function dateUTC(s: string) { const date = new Date(`${s}T12:00:00.000Z`); if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== s) throw new Error("Fecha de vencimiento inválida"); return date; }


export async function crearCompra(
  _prev: EstadoCompra,
  form: FormData
): Promise<EstadoCompra> {
  await exigirRol(ROLES_COMPRAS_GESTION);

  let payload: unknown;

  try {
    payload = JSON.parse(
      String(form.get("payload") ?? "")
    );
  } catch {
    return { error: "Solicitud inválida." };
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Orden de compra inválida.",
    };
  }

  const {
    proveedorId,
    moneda,
    tipoCambio,
    fechaEntregaEstimada,
    observaciones,
    items,
  } = parsed.data;

  // La OC identifica productos.
  // Los lotes se registrarán durante la recepción.
  // Validar combinaciones de producto y costo unitario.
  // Usamos Decimal para comparar importes de forma exacta.
  const clavesLineas = items.map((item) => {
    const costoNormalizado = new Prisma.Decimal(
      item.precioUnitario
    ).toFixed(2);

    return `${item.productoId}::${costoNormalizado}`;
  });

  if (new Set(clavesLineas).size !== items.length) {
    return {
      error:
        "No puedes registrar dos líneas con el mismo producto y costo unitario. Agrupa las cantidades o utiliza costos diferentes.",
    };
  }

  let fechaEntrega: Date | null = null;

  if (fechaEntregaEstimada) {
    try {
      fechaEntrega = dateUTC(
        fechaEntregaEstimada
      );
    } catch {
      return {
        error: "La fecha estimada de entrega es inválida.",
      };
    }
  }

  try {
    const total = items.reduce(
      (acumulado, item) =>
        acumulado.plus(
          new Prisma.Decimal(item.precioUnitario)
            .mul(item.cantidad)
        ),
      new Prisma.Decimal(0)
    );

    if (
      !total.isFinite() ||
      total.gt("9999999999.99")
    ) {
      return {
        error: "El importe total supera el máximo permitido.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.findFirst({
        where: {
          id: proveedorId,
          estado: true,
        },
        select: { id: true },
      });

      if (!proveedor) {
        throw new Error(
          "Selecciona un proveedor activo."
        );
      }

      const productos = await tx.producto.findMany({
        where: {
          id: {
            in: items.map(
              (item) => item.productoId
            ),
          },
          estado: true,
        },
        select: {
          id: true,
          moneda: true,
        },
      });

      const productosSolicitados = new Set(
        items.map((item) => item.productoId)
      );

      const productosEncontrados = new Set(
        productos.map((producto) => producto.id)
      );

      const todosExisten = [...productosSolicitados].every(
        (id) => productosEncontrados.has(id)
      );

      if (!todosExisten) {
        throw new Error(
          "Uno o más productos no existen o están inactivos."
        );
      }

      const requiereCambio = productos.some(
        (producto) => producto.moneda !== moneda
      );

      const cambio = tipoCambio
        ? new Prisma.Decimal(tipoCambio)
        : null;

      if (
        requiereCambio &&
        (!cambio ||
          !cambio.isFinite() ||
          cambio.lte(0))
      ) {
        throw new Error(
          "Indica un tipo de cambio válido (soles por dólar)."
        );
      }

      const compra = await tx.compra.create({
        data: {
          proveedorId,
          importeTotal: total,
          moneda,
          tipoCambio: requiereCambio
            ? cambio
            : null,
          fechaEntregaEstimada: fechaEntrega,
          observaciones:
            observaciones || null,
          estado: "PENDIENTE",
        },
      });

      await tx.detalleCompra.createMany({
        data: items.map((item) => ({
          compraId: compra.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: new Prisma.Decimal(
            item.precioUnitario
          ),

          // Se completan en recepción.
          numeroLote: null,
          fechaVencimiento: null,
        })),
      });
    });

    revalidatePath("/dashboard/compras");

    return {
      ok: "Orden de Compra registrada correctamente.",
    };
  } catch (error) {
    console.error("Error al crear Orden de Compra:", error);

    return {
      error: "No se pudo registrar la Orden de Compra. Verifica los datos e intenta nuevamente.",
    };
  }
}

/** Recibe cantidades reales por línea; operación atómica y serializable. */
export async function recibirCompra(form: FormData) {
  const responsable = await exigirRol(ROLES_RECEPCION);
  const usuarioId = Number(responsable.id);
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) throw new Error("Responsable inválido");
  const compraId = Number(form.get("compraId"));
  if (!Number.isSafeInteger(compraId) || compraId <= 0) throw new Error("Compra inválida");
  let cantidades: Record<string, unknown>;
  try {
    cantidades = JSON.parse(String(form.get("cantidades") ?? ""));
    if (!cantidades || typeof cantidades !== "object" || Array.isArray(cantidades)) throw Error();
  } catch { throw new Error("Cantidades de recepción inválidas"); }
  const entradas = Object.entries(cantidades);
  if (entradas.length === 0 || entradas.length > 100) throw new Error("Indica al menos una línea a recibir");
  for (const [id, cantidad] of entradas) {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) ||
      typeof cantidad !== "number" || !Number.isSafeInteger(cantidad) || cantidad < 0) {
      throw new Error("Las cantidades deben ser enteros no negativos");
    }
  }
  if (!entradas.some(([, cantidad]) => Number(cantidad) > 0)) throw new Error("Debes recibir al menos una unidad");
  await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.findUnique({
      where: { id: compraId }, include: {
        detalles: { include: { recepciones: { select: { cantidad: true } } } }
      }
    });
    if (!compra || !["PENDIENTE", "PARCIAL"].includes(compra.estado)) {
      throw new Error("La compra no admite nuevas recepciones");
    }
    const ids = new Set(compra.detalles.map(d => String(d.id)));
    if (entradas.some(([id]) => !ids.has(id))) throw new Error("Detalle de compra no válido");
    const restante = new Map<number, number>();
    for (const detalle of compra.detalles) {
      const recibidas = detalle.recepciones.reduce((total, r) => total + r.cantidad, 0);
      const pendiente = detalle.cantidad - recibidas;
      if (pendiente < 0) throw new Error("La compra contiene cantidades incoherentes");
      const nueva = Number(cantidades[String(detalle.id)] ?? 0);
      if (!Number.isSafeInteger(nueva) || nueva < 0 || nueva > pendiente) {
        throw new Error(`Cantidad supera el pendiente del detalle #${detalle.id}`);
      }
      restante.set(detalle.id, pendiente - nueva);
    }
    // Bloqueo lógico de la compra. Serializable abortará la transacción si hay carreras.
    const siguienteEstado = [...restante.values()].every(x => x === 0) ? "RECIBIDO" : "PARCIAL";
    const cambio = await tx.compra.updateMany({
      where: { id: compraId, estado: compra.estado }, data: { estado: siguienteEstado }
    });
    if (cambio.count !== 1) throw new Error("La compra cambió de estado; actualiza la pantalla");
    for (const detalle of compra.detalles) {
      const cantidad = Number(cantidades[String(detalle.id)] ?? 0);
      if (cantidad === 0) continue;
      // Protección temporal de compatibilidad:
      // las OC nuevas registran lote y vencimiento al recibir,
      // funcionalidad que integraremos en la siguiente etapa.
      if (
        !detalle.numeroLote ||
        !detalle.fechaVencimiento
      ) {
        throw new Error(
          "Esta Orden de Compra requiere el nuevo formulario de recepción con número de lote y vencimiento."
        );
      }
      const producto = await tx.producto.findFirst({ where: { id: detalle.productoId, estado: true }, select: { id: true } });
      if (!producto) throw new Error("Producto inactivo o inexistente");
      const previo = await tx.lote.findUnique({
        where: {
          numeroLote_productoId: { numeroLote: detalle.numeroLote, productoId: detalle.productoId }
        }
      });
      if (previo && previo.fechaVencimiento.getTime() !== detalle.fechaVencimiento.getTime()) {
        throw new Error(`El lote ${detalle.numeroLote} tiene otro vencimiento`);
      }
      const lote = await tx.lote.upsert({
        where: { numeroLote_productoId: { numeroLote: detalle.numeroLote, productoId: detalle.productoId } },
        create: {
          numeroLote: detalle.numeroLote, productoId: detalle.productoId,
          cantidadInicial: cantidad, cantidadDisponible: cantidad, fechaVencimiento: detalle.fechaVencimiento
        },
        update: { cantidadInicial: { increment: cantidad }, cantidadDisponible: { increment: cantidad } }
      });
      await tx.recepcionCompra.create({
        data: {
          compraId, detalleCompraId: detalle.id, loteId: lote.id, usuarioId, cantidad
        }
      });
      await tx.producto.update({ where: { id: detalle.productoId }, data: { stockActual: { increment: cantidad } } });
      await tx.movimientoInventario.create({
        data: {
          productoId: detalle.productoId, loteId: lote.id, usuarioId,
          tipo: "ENTRADA_COMPRA", cantidad,
          motivo: `Recepción compra #${compraId}, detalle #${detalle.id}`
        }
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
  for (const ruta of ["/dashboard/compras", "/dashboard/lotes", "/dashboard/inventario", "/dashboard/inventario/conciliacion", "/dashboard/inventario/movimientos", "/dashboard"]) revalidatePath(ruta);
}
