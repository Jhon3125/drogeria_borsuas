"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

export type EstadoAsignacion = { ok?: string; error?: string } | undefined;

const asignacionSchema = z.object({
  ventaId: z.number().int().positive(),
  detalleVentaId: z.number().int().positive(),
  // Permite [] para retirar una asignación anterior, sin cambiar el stock físico.
  lotes: z.array(z.object({
    loteId: z.number().int().positive(),
    cantidad: z.number().int().positive().max(1_000_000),
  })).max(100),
});

function fechaHoyPeru(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

async function guardarAsignacion(payload: z.infer<typeof asignacionSchema>) {
  return prisma.$transaction(async (tx) => {
    const detalle = await tx.detalleVenta.findUnique({
      where: { id: payload.detalleVentaId },
      include: { venta: { select: { id: true, estado: true } } },
    });
    if (!detalle || detalle.ventaId !== payload.ventaId) {
      throw new Error("Detalle de venta inválido.");
    }
    if (!(["CONFIRMADA", "EN_PREPARACION"] as string[]).includes(detalle.venta.estado)) {
      throw new Error("La venta no admite nuevas asignaciones.");
    }
    if (new Set(payload.lotes.map((x) => x.loteId)).size !== payload.lotes.length) {
      throw new Error("No repitas el mismo lote.");
    }
    const totalAsignado = payload.lotes.reduce((s, x) => s + x.cantidad, 0);
    if (!Number.isSafeInteger(totalAsignado) || totalAsignado > detalle.cantidad) {
      throw new Error("La cantidad asignada supera la cantidad vendida.");
    }

    if (payload.lotes.length > 0) {
      const ids = payload.lotes.map((x) => x.loteId);
      const lotes = await tx.lote.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, productoId: true, cantidadDisponible: true,
          estadoCalidad: true, fechaVencimiento: true,
        },
      });
      if (lotes.length !== ids.length) throw new Error("Uno de los lotes no existe.");
      const hoy = fechaHoyPeru();
      for (const lote of lotes) {
        if (lote.productoId !== detalle.productoId) throw new Error("Un lote pertenece a otro producto.");
        if (lote.estadoCalidad !== "DISPONIBLE") throw new Error("Hay lotes bloqueados o en cuarentena.");
        if (lote.fechaVencimiento.toISOString().slice(0, 10) < hoy) {
          throw new Error("No se pueden asignar lotes vencidos.");
        }
      }

      // No se consideran las asignaciones del detalle actual porque se reemplazarán.
      const [retenciones, asignacionesAjenas] = await Promise.all([
        tx.retencionLote.groupBy({
          by: ["loteId"],
          where: { loteId: { in: ids }, estado: "ACTIVA" },
          _sum: { cantidad: true },
        }),
        tx.asignacionLoteVenta.findMany({
          where: {
            loteId: { in: ids },
            detalleVentaId: { not: detalle.id },
            detalleVenta: { venta: { estado: { in: ["CONFIRMADA", "EN_PREPARACION"] } } },
          },
          select: { loteId: true, cantidad: true },
        }),
      ]);
      const retenido = new Map(retenciones.map((r) => [r.loteId, r._sum.cantidad ?? 0]));
      const comprometido = new Map<number, number>();
      for (const a of asignacionesAjenas) {
        comprometido.set(a.loteId, (comprometido.get(a.loteId) ?? 0) + a.cantidad);
      }
      const porId = new Map(lotes.map((l) => [l.id, l]));
      for (const x of payload.lotes) {
        const lote = porId.get(x.loteId)!;
        const libre = lote.cantidadDisponible - (retenido.get(lote.id) ?? 0) - (comprometido.get(lote.id) ?? 0);
        if (x.cantidad > libre) throw new Error(`Stock libre insuficiente en el lote ${lote.id}.`);
      }
    }

    await tx.asignacionLoteVenta.deleteMany({ where: { detalleVentaId: detalle.id } });
    if (payload.lotes.length) {
      await tx.asignacionLoteVenta.createMany({
        data: payload.lotes.map((x) => ({
          detalleVentaId: detalle.id, loteId: x.loteId, cantidad: x.cantidad,
        })),
      });
    }
    // El estado marca que ya comenzó la preparación. No afecta las existencias físicas.
    if (payload.lotes.length > 0) {
      await tx.venta.updateMany({
        where: { id: detalle.ventaId, estado: "CONFIRMADA" },
        data: { estado: "EN_PREPARACION" },
      });
    }
    return detalle.ventaId;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function asignarLotesVenta(
  _prev: EstadoAsignacion, form: FormData,
): Promise<EstadoAsignacion> {
  await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN"]);
  let payload: unknown;
  try { payload = JSON.parse(String(form.get("payload") ?? "")); }
  catch { return { error: "Datos de asignación inválidos." }; }
  const valid = asignacionSchema.safeParse(payload);
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    const ventaId = await guardarAsignacion(valid.data);
    revalidatePath(`/dashboard/ventas/${ventaId}`);
    revalidatePath("/dashboard/ventas");
    return { ok: valid.data.lotes.length
      ? "Asignación guardada. No se descontó inventario."
      : "Asignaciones retiradas. No se modificó el inventario." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "El stock cambió durante la operación. Actualiza y vuelve a intentar." };
    }
    const mensaje = error instanceof Error ? error.message : "";
    const conocidos = [
      "Detalle de venta inválido.", "La venta no admite nuevas asignaciones.",
      "No repitas el mismo lote.", "La cantidad asignada supera la cantidad vendida.",
      "Uno de los lotes no existe.", "Un lote pertenece a otro producto.",
      "Hay lotes bloqueados o en cuarentena.", "No se pueden asignar lotes vencidos.",
    ];
    return { error: conocidos.includes(mensaje) || mensaje.startsWith("Stock libre insuficiente")
      ? mensaje : "No se pudieron guardar las asignaciones. Verifica stock y vuelve a intentar." };
  }
}
