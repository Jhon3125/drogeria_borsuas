"use server";

import { exigirRol } from "@/lib/guard";
import { ROLES_AJUSTE_INVENTARIO } from "@/lib/permisos";

export type EstadoAjuste = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
} | undefined;

/** La acción histórica permanece exportada para clientes anteriores.
 *  No hay ajustes generales permitidos en inventario por lotes.
 */
export async function registrarAjuste(
  _prev: EstadoAjuste,
  _formData: FormData
): Promise<EstadoAjuste> {
  await exigirRol(ROLES_AJUSTE_INVENTARIO);
  return { error: "Los ajustes generales están deshabilitados. Registra una compra y confirma su recepción por lote. Las existencias heredadas requieren conciliación administrativa." };
}

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

const ajusteLoteSchema = z.object({
  loteId: z.coerce.number<number>().int().positive(),
  tipo: z.enum(["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"]),
  cantidad: z.coerce.number<number>().int().positive().max(1000000),
  motivo: z.string().trim().min(8, "Indica un motivo de al menos 8 caracteres").max(500),
});

/** Ajuste auditado. La recepción es la única vía para dar de alta un lote nuevo. */
export async function registrarAjusteLote(
  _anterior: EstadoAjuste,
  formulario: FormData
): Promise<EstadoAjuste> {
  const responsable = await exigirRol(ROLES_AJUSTE_INVENTARIO);
  const parsed = ajusteLoteSchema.safeParse(Object.fromEntries(formulario.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulario inválido" };
  const { loteId, tipo, cantidad, motivo } = parsed.data;
  const usuarioId = Number(responsable.id);
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) return { error: "Responsable inválido" };
  const incremento = tipo === "AJUSTE_POSITIVO" ? cantidad : -cantidad;

  try {
    await prisma.$transaction(async tx => {
      const lote = await tx.lote.findUnique({
        where: { id: loteId },
        include: {
          producto: { select: { id: true, estado: true, stockActual: true } },
          recepciones: { select: {
            cantidad: true, compraId: true, detalleCompraId: true,
            compra: { select: { estado: true } },
            detalleCompra: { select: { compraId: true, productoId: true, numeroLote: true, fechaVencimiento: true } },
          } },
        },
      });
      if (!lote || !lote.producto.estado) throw new Error("Lote inexistente o producto inactivo");
      const totalRecibido = lote.recepciones.reduce((s, r) => s + r.cantidad, 0);
      const respaldado = lote.recepciones.length > 0 &&
        totalRecibido >= lote.cantidadInicial &&
        lote.recepciones.every(r =>
          ["RECIBIDO", "PARCIAL"].includes(r.compra.estado) &&
          r.detalleCompraId > 0 && r.compraId === r.detalleCompra.compraId &&
          r.detalleCompra.productoId === lote.productoId &&
          r.detalleCompra.numeroLote === lote.numeroLote &&
          r.detalleCompra.fechaVencimiento.getTime() === lote.fechaVencimiento.getTime()
        );
      if (!respaldado || lote.cantidadDisponible < 0 || lote.cantidadDisponible > lote.cantidadInicial) {
        throw new Error("El lote no está conciliado con sus recepciones. Revisa Conciliación antes de ajustarlo.");
      }
      if (incremento < 0 && (cantidad > lote.cantidadDisponible || cantidad > lote.producto.stockActual)) {
        throw new Error("No hay existencias suficientes en el lote o el stock general necesita conciliación.");
      }
      if (incremento > 0 && lote.cantidadDisponible + cantidad > lote.cantidadInicial) {
        throw new Error("El ajuste superaría la cantidad inicial del lote. Una entrada nueva debe registrarse como recepción de compra.");
      }
      // Comprobaciones condicionales + aislamiento serializable para evitar doble descuento.
      const loteCambiado = await tx.lote.updateMany({
        where: {
          id: loteId,
          cantidadDisponible: lote.cantidadDisponible,
        },
        data: { cantidadDisponible: { increment: incremento } },
      });
      if (loteCambiado.count !== 1) throw new Error("El lote cambió; vuelve a cargar la página.");
      const productoCambiado = await tx.producto.updateMany({
        where: {
          id: lote.productoId,
          ...(incremento < 0 ? { stockActual: { gte: cantidad } } : {}),
        },
        data: { stockActual: { increment: incremento } },
      });
      if (productoCambiado.count !== 1) throw new Error("El stock general requiere conciliación antes de ajustar.");
      await tx.movimientoInventario.create({
        data: { productoId: lote.productoId, loteId, usuarioId, tipo, cantidad, motivo: motivo },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "Otra operación modificó el inventario. Actualiza la página e inténtalo de nuevo." };
    }
    return { error: error instanceof Error ? error.message : "No se pudo registrar el ajuste" };
  }
  for (const path of ["/dashboard/inventario", "/dashboard/inventario/conciliacion", "/dashboard/inventario/movimientos", "/dashboard/lotes", "/dashboard"]) {
    revalidatePath(path);
  }
  const productoId = await prisma.lote.findUnique({ where: { id: loteId }, select: { productoId: true } });
  if (productoId) revalidatePath(`/dashboard/inventario/producto/${productoId.productoId}`);
  return { ok: true };
}
