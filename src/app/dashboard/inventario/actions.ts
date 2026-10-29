"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { exigirRol } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ROLES_AJUSTE_INVENTARIO } from "@/lib/permisos";

// ============================================================
// 1. TIPOS Y VALIDACIONES
// ============================================================

export type EstadoAjuste =
  | {
    ok?: boolean;
    error?: string;
    errores?: Record<string, string>;
  }
  | undefined;

const ajusteLoteSchema = z.object({
  loteId: z.coerce.number<number>().int().positive(),

  tipo: z.enum([
    "AJUSTE_POSITIVO",
    "AJUSTE_NEGATIVO",
  ]),

  cantidad: z.coerce
    .number<number>()
    .int()
    .positive()
    .max(1000000),

  motivo: z.string()
    .trim()
    .min(8, "Indica un motivo de al menos 8 caracteres.")
    .max(500, "El motivo no puede superar 500 caracteres."),
});

// ============================================================
// 2. AJUSTES GENERALES (DESHABILITADOS)
// ============================================================

/**
 * Se conserva esta acción por compatibilidad histórica.
 *
 * Los ajustes generales no están permitidos porque el
 * inventario operativo se administra por lotes respaldados.
 */
export async function registrarAjuste(
  _prev: EstadoAjuste,
  _formData: FormData
): Promise<EstadoAjuste> {
  await exigirRol(ROLES_AJUSTE_INVENTARIO);

  return {
    error:
      "Los ajustes generales están deshabilitados. " +
      "Registra una compra y confirma su recepción por lote. " +
      "Las existencias heredadas requieren conciliación administrativa.",
  };
}

// ============================================================
// 3. BLOQUEO TRANSACCIONAL POR LOTE
// ============================================================

/**
 * Coordina los ajustes de Inventario con las operaciones
 * de retención de calidad.
 *
 * Utiliza exactamente la misma clave que:
 * src/app/dashboard/lotes/retenciones-actions.ts
 *
 * Evita que una retención y un ajuste negativo consulten
 * simultáneamente existencias desactualizadas.
 */
async function bloquearLote(
  tx: Prisma.TransactionClient,
  loteId: number
) {
  await tx.$queryRaw<{ adquirido: number }[]>`
        SELECT 1::integer AS adquirido
        FROM pg_advisory_xact_lock(847202, ${loteId})
    `;
}

// ============================================================
// 4. AJUSTES DE INVENTARIO POR LOTE
// ============================================================

/**
 * Ajuste auditado de existencias físicas.
 *
 * Reglas:
 * - El lote debe tener respaldo de recepciones.
 * - No se permite crear stock por encima de cantidadInicial.
 * - No se permiten existencias negativas.
 * - No se pueden consumir unidades retenidas.
 * - No se modifica el estado general de calidad del lote.
 * - Cada ajuste genera un movimiento de Inventario.
 */
export async function registrarAjusteLote(
  _anterior: EstadoAjuste,
  formulario: FormData
): Promise<EstadoAjuste> {
  // --------------------------------------------------------
  // 4.1. Validar permisos y formulario
  // --------------------------------------------------------

  const responsable = await exigirRol(
    ROLES_AJUSTE_INVENTARIO
  );

  const parsed = ajusteLoteSchema.safeParse(
    Object.fromEntries(formulario.entries())
  );

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Formulario inválido.",
    };
  }

  const { loteId, tipo, cantidad, motivo } = parsed.data;
  const usuarioId = Number(responsable.id);

  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return { error: "Responsable inválido." };
  }

  const incremento =
    tipo === "AJUSTE_POSITIVO"
      ? cantidad
      : -cantidad;

  // --------------------------------------------------------
  // 4.2. Ejecutar ajuste de forma transaccional
  // --------------------------------------------------------

  try {
    await prisma.$transaction(
      async (tx) => {
        // NUEVO: sincronizar con retenciones parciales.
        await bloquearLote(tx, loteId);

        // Consultar lote, producto, recepciones
        // y retenciones activas.
        const lote = await tx.lote.findUnique({
          where: {
            id: loteId,
          },
          include: {
            producto: {
              select: {
                id: true,
                estado: true,
                stockActual: true,
              },
            },

            recepciones: {
              select: {
                cantidad: true,
                compraId: true,
                detalleCompraId: true,

                compra: {
                  select: {
                    estado: true,
                  },
                },

                detalleCompra: {
                  select: {
                    compraId: true,
                    productoId: true,
                    numeroLote: true,
                    fechaVencimiento: true,
                  },
                },
              },
            },

            // NUEVO: considerar únicamente
            // retenciones todavía activas.
            retenciones: {
              where: {
                estado: "ACTIVA",
              },
              select: {
                cantidad: true,
              },
            },
          },
        });

        if (!lote || !lote.producto.estado) {
          throw new Error(
            "Lote inexistente o producto inactivo."
          );
        }

        // ------------------------------------------------
        // 4.3. Validar respaldo de recepciones
        // ------------------------------------------------

        const totalRecibido = lote.recepciones.reduce(
          (total, recepcion) =>
            total + recepcion.cantidad,
          0
        );

        const respaldado =
          lote.recepciones.length > 0 &&
          totalRecibido >= lote.cantidadInicial &&
          lote.recepciones.every((recepcion) => {
            const detalle = recepcion.detalleCompra;

            const relacionValida =
              ["RECIBIDO", "PARCIAL"].includes(
                recepcion.compra.estado
              ) &&
              recepcion.detalleCompraId > 0 &&
              recepcion.compraId ===
              detalle.compraId &&
              detalle.productoId ===
              lote.productoId;

            // Compatibilidad con compras antiguas:
            // algunos detalles almacenaban directamente
            // número de lote y vencimiento.
            const loteHistoricoValido =
              (!detalle.numeroLote ||
                detalle.numeroLote ===
                lote.numeroLote) &&
              (!detalle.fechaVencimiento ||
                detalle.fechaVencimiento.getTime() ===
                lote.fechaVencimiento.getTime());

            return (
              relacionValida &&
              loteHistoricoValido
            );
          });

        if (
          !respaldado ||
          lote.cantidadDisponible < 0 ||
          lote.cantidadDisponible > lote.cantidadInicial
        ) {
          throw new Error(
            "El lote no está conciliado con sus recepciones. " +
            "Revisa Conciliación antes de ajustarlo."
          );
        }

        // ------------------------------------------------
        // 4.4. Validar retenciones parciales
        // ------------------------------------------------

        // NUEVO: total de unidades inmovilizadas.
        const totalRetenido = lote.retenciones.reduce(
          (total, retencion) =>
            total + retencion.cantidad,
          0
        );

        if (
          totalRetenido < 0 ||
          totalRetenido > lote.cantidadDisponible
        ) {
          throw new Error(
            "Las retenciones activas no coinciden con " +
            "las existencias del lote. Revisa su situación " +
            "de calidad antes de realizar ajustes."
          );
        }

        // NUEVO: impedir que un ajuste negativo
        // consuma unidades actualmente retenidas.
        if (
          incremento < 0 &&
          lote.cantidadDisponible - cantidad <
          totalRetenido
        ) {
          const unidadesLibres =
            lote.cantidadDisponible - totalRetenido;

          throw new Error(
            `No puedes descontar ${cantidad} unidades. ` +
            `Hay ${totalRetenido} unidades retenidas ` +
            `y solo ${unidadesLibres} unidades libres ` +
            "para ajustar."
          );
        }

        // ------------------------------------------------
        // 4.5. Validaciones físicas existentes
        // ------------------------------------------------

        if (
          incremento < 0 &&
          (
            cantidad > lote.cantidadDisponible ||
            cantidad > lote.producto.stockActual
          )
        ) {
          throw new Error(
            "No hay existencias suficientes en el lote " +
            "o el stock general necesita conciliación."
          );
        }

        if (
          incremento > 0 &&
          lote.cantidadDisponible + cantidad >
          lote.cantidadInicial
        ) {
          throw new Error(
            "El ajuste superaría la cantidad inicial " +
            "del lote. Una entrada nueva debe " +
            "registrarse como recepción de compra."
          );
        }

        // ------------------------------------------------
        // 4.6. Actualizar el lote
        // ------------------------------------------------

        const loteCambiado = await tx.lote.updateMany({
          where: {
            id: loteId,
            cantidadDisponible:
              lote.cantidadDisponible,
          },
          data: {
            cantidadDisponible: {
              increment: incremento,
            },
          },
        });

        if (loteCambiado.count !== 1) {
          throw new Error(
            "El lote cambió. Vuelve a cargar la página."
          );
        }

        // ------------------------------------------------
        // 4.7. Actualizar stock general del producto
        // ------------------------------------------------

        const productoCambiado =
          await tx.producto.updateMany({
            where: {
              id: lote.productoId,

              ...(incremento < 0
                ? {
                  stockActual: {
                    gte: cantidad,
                  },
                }
                : {}),
            },

            data: {
              stockActual: {
                increment: incremento,
              },
            },
          });

        if (productoCambiado.count !== 1) {
          throw new Error(
            "El stock general requiere conciliación " +
            "antes de ajustar."
          );
        }

        // ------------------------------------------------
        // 4.8. Registrar movimiento de Inventario
        // ------------------------------------------------

        await tx.movimientoInventario.create({
          data: {
            productoId: lote.productoId,
            loteId,
            usuarioId,
            tipo,
            cantidad,
            motivo,
          },
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
      }
    );
  } catch (error) {
    // ----------------------------------------------------
    // 4.9. Controlar errores de concurrencia
    // ----------------------------------------------------

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        error:
          "Otra operación modificó el inventario. " +
          "Actualiza la página e inténtalo de nuevo.",
      };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo registrar el ajuste.",
    };
  }

  // --------------------------------------------------------
  // 4.10. Actualizar las vistas relacionadas
  // --------------------------------------------------------

  const rutas = [
    "/dashboard/inventario",
    "/dashboard/inventario/conciliacion",
    "/dashboard/inventario/movimientos",
    "/dashboard/lotes",
    `/dashboard/lotes/${loteId}`,
    "/dashboard",
  ];

  for (const ruta of rutas) {
    revalidatePath(ruta);
  }

  const loteActualizado = await prisma.lote.findUnique({
    where: {
      id: loteId,
    },
    select: {
      productoId: true,
    },
  });

  if (loteActualizado) {
    revalidatePath(
      `/dashboard/inventario/producto/${loteActualizado.productoId}`
    );
  }

  return { ok: true };
}
