"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export type ResultadoVenta = { ok?: string; error?: string; ventaId?: number } | undefined;
const schema = z.object({ cotizacionId: z.coerce.number().int().positive() });

export async function convertirCotizacionAVenta(
  _prev: ResultadoVenta,
  data: FormData
): Promise<ResultadoVenta> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const valido = schema.safeParse({ cotizacionId: data.get("cotizacionId") });
  if (!valido.success) return { error: "Cotización inválida." };
  const cotizacionId = valido.data.cotizacionId;

  try {
    const venta = await prisma.$transaction(async (tx) => {
      const cotizacion = await tx.cotizacion.findUnique({
        where: { id: cotizacionId },
        include: {
          cliente: { select: { estado: true, estadoRelacionComercial: true } },
          oportunidad: { select: { etapa: true, clienteId: true, vendedorId: true } },
          detalles: { select: { productoId: true, cantidad: true, precioUnitario: true, descuento: true } },
          venta: { select: { id: true } },
        },
      });
      if (!cotizacion) throw new Error("La cotización no existe.");
      if (cotizacion.estado !== "ACEPTADA") throw new Error("Solo puedes convertir una cotización aceptada.");
      if (cotizacion.venta) throw new Error("Esta cotización ya tiene una venta registrada.");
      if (!cotizacion.cliente.estado || cotizacion.cliente.estadoRelacionComercial !== "CALIFICADO") {
        throw new Error("El cliente no está activo o calificado.");
      }
      if (usuario.rol === "COMERCIAL" && Number(usuario.id) !== cotizacion.vendedorId) {
        throw new Error("No tienes permisos para esta cotización.");
      }
      if (cotizacion.oportunidad) {
        if (cotizacion.oportunidad.clienteId !== cotizacion.clienteId ||
            cotizacion.oportunidad.vendedorId !== cotizacion.vendedorId) {
          throw new Error("La cotización no coincide con su oportunidad.");
        }
        if (["PROSPECTO", "CONTACTADO", "COTIZACION", "GANADA", "PERDIDA"].includes(cotizacion.oportunidad.etapa)) {
          throw new Error("La oportunidad debe estar en Negociación antes de confirmar la venta.");
        }
      }
      // Una misma oportunidad no debe originar dos ventas distintas,
      // aunque tenga varias cotizaciones/versiones aceptadas.
      if (cotizacion.oportunidadId !== null) {
        const ventaExistente = await tx.venta.findFirst({
          where: { oportunidadId: cotizacion.oportunidadId },
          select: { id: true },
        });
        if (ventaExistente) throw new Error("Esta oportunidad ya tiene una venta registrada.");
      }
      if (!cotizacion.detalles.length) throw new Error("La cotización no tiene productos.");
      if (cotizacion.importeTotal.lessThan(0)) throw new Error("Importe de cotización inválido.");

      // Una operación atómica crea la venta y, si existe, cierra la oportunidad.
      // @unique(cotizacionId) impide ventas duplicadas incluso ante solicitudes concurrentes.
      const creada = await tx.venta.create({
        data: {
          cotizacionId: cotizacion.id,
          oportunidadId: cotizacion.oportunidadId,
          clienteId: cotizacion.clienteId,
          vendedorId: cotizacion.vendedorId,
          moneda: cotizacion.moneda,
          subtotal: cotizacion.subtotal,
          descuento: cotizacion.descuento,
          importeTotal: cotizacion.importeTotal,
          saldoPendiente: cotizacion.importeTotal,
          estado: "CONFIRMADA",
          detalles: { create: cotizacion.detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento,
          })) },
        },
        select: { id: true },
      });

      if (cotizacion.oportunidadId && cotizacion.oportunidad?.etapa === "NEGOCIACION") {
        const updated = await tx.oportunidadComercial.updateMany({
          where: { id: cotizacion.oportunidadId, etapa: "NEGOCIACION" },
          data: { etapa: "GANADA", fechaCierre: new Date(), motivoPerdida: null },
        });
        if (updated.count !== 1) throw new Error("La oportunidad fue modificada. Actualiza la página.");
        await tx.historialOportunidad.create({
          data: {
            oportunidadId: cotizacion.oportunidadId,
            usuarioId: Number(usuario.id),
            etapaAnterior: "NEGOCIACION",
            etapaNueva: "GANADA",
            comentario: `Venta #${creada.id} confirmada desde cotización COT-${cotizacion.id}.`,
          },
        });
      }
      return creada;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    for (const ruta of ["/dashboard/ventas", `/dashboard/ventas/${venta.id}`, "/dashboard/cotizaciones", "/dashboard/ventas/crm"]) revalidatePath(ruta);
    return { ok: `Venta #${venta.id} creada. Aún no se ha descontado inventario.`, ventaId: venta.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Esta cotización ya fue convertida en venta." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "Se modificó la oportunidad durante la confirmación. Actualiza e intenta nuevamente." };
    }
    const allow = [
      "La cotización no existe.", "Solo puedes convertir una cotización aceptada.",
      "Esta cotización ya tiene una venta registrada.", "El cliente no está activo o calificado.",
      "No tienes permisos para esta cotización.", "La cotización no coincide con su oportunidad.",
      "La oportunidad debe estar en Negociación antes de confirmar la venta.",
      "La cotización no tiene productos.", "Importe de cotización inválido.",
      "La oportunidad fue modificada. Actualiza la página.",
      "Esta oportunidad ya tiene una venta registrada.",
    ];
    return { error: error instanceof Error && allow.includes(error.message) ? error.message : "No se pudo confirmar la venta. Verifica el estado y vuelve a intentarlo." };
  }
}
