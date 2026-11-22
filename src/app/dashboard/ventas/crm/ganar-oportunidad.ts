"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export type ResultadoGanarOportunidad =
  | { ok?: string; error?: string; ventaId?: number }
  | undefined;

/** Solo el servidor elige la última cotización. Nunca se acepta un ID enviado por la interfaz. */
export async function ganarOportunidadYCrearVenta(
  oportunidadId: number,
): Promise<ResultadoGanarOportunidad> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  if (!Number.isSafeInteger(oportunidadId) || oportunidadId <= 0) {
    return { error: "Oportunidad inválida." };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const oportunidad = await tx.oportunidadComercial.findUnique({
        where: { id: oportunidadId },
        include: {
          cliente: { select: { estado: true, estadoRelacionComercial: true } },
          cotizaciones: {
            include: {
              venta: { select: { id: true } },
              detalles: {
                select: {
                  productoId: true,
                  cantidad: true,
                  precioUnitario: true,
                  descuento: true,
                },
              },
            },
          },
        },
      });

      if (!oportunidad) throw new Error("Oportunidad no encontrada.");
      if (oportunidad.etapa !== "NEGOCIACION") {
        throw new Error("Solo se puede ganar una oportunidad en Negociación.");
      }
      if (usuario.rol === "COMERCIAL" && Number(usuario.id) !== oportunidad.vendedorId) {
        throw new Error("No tienes permisos para esta oportunidad.");
      }
      if (!oportunidad.cliente.estado || oportunidad.cliente.estadoRelacionComercial !== "CALIFICADO") {
        throw new Error("El cliente debe estar activo y calificado.");
      }
      const existente = await tx.venta.findFirst({
        where: { oportunidadId },
        select: { id: true },
      });
      if (existente) throw new Error("Esta oportunidad ya tiene una venta registrada.");

      // Una revisión posterior invalida cualquier versión anterior, incluso si está ACEPTADA.
      const idsRevisados = new Set(
        oportunidad.cotizaciones
          .map((c) => c.cotizacionAnteriorId)
          .filter((id): id is number => id !== null),
      );
      const ultimas = oportunidad.cotizaciones
        .filter((c) => !idsRevisados.has(c.id))
        .sort((a, b) => b.id - a.id);
      const cotizacion = ultimas[0];
      if (!cotizacion) throw new Error("La oportunidad no tiene cotizaciones.");
      if (cotizacion.estado !== "EMITIDA" && cotizacion.estado !== "ACEPTADA") {
        throw new Error("La última cotización debe estar Emitida o Aceptada para ganar la oportunidad.");
      }
      // La vigencia se interpreta al cierre del día en Perú (UTC-5).
      const venceFinDia = cotizacion.validezHasta
        ? Date.UTC(
            cotizacion.validezHasta.getUTCFullYear(),
            cotizacion.validezHasta.getUTCMonth(),
            cotizacion.validezHasta.getUTCDate() + 1,
            4, 59, 59, 999,
          )
        : null;
      if (cotizacion.estado === "EMITIDA" && venceFinDia !== null && venceFinDia < Date.now()) {
        throw new Error("La última cotización está vencida. Emite una revisión vigente.");
      }
      if (cotizacion.clienteId !== oportunidad.clienteId || cotizacion.vendedorId !== oportunidad.vendedorId) {
        throw new Error("La cotización no coincide con el cliente o responsable de la oportunidad.");
      }
      if (cotizacion.venta) throw new Error("La última cotización ya tiene una venta.");
      if (!cotizacion.detalles.length) throw new Error("La cotización no tiene productos.");
      if (cotizacion.importeTotal.lessThanOrEqualTo(0)) {
        throw new Error("La cotización debe tener un importe total positivo.");
      }
      if (cotizacion.detalles.some((d) => d.cantidad <= 0)) {
        throw new Error("La cotización contiene cantidades inválidas.");
      }

      if (cotizacion.estado === "EMITIDA") {
        const aceptada = await tx.cotizacion.updateMany({
          where: { id: cotizacion.id, estado: "EMITIDA" },
          data: { estado: "ACEPTADA" },
        });
        if (aceptada.count !== 1) throw new Error("La cotización cambió. Actualiza la página.");
      }

      const venta = await tx.venta.create({
        data: {
          cotizacionId: cotizacion.id,
          oportunidadId,
          clienteId: oportunidad.clienteId,
          vendedorId: oportunidad.vendedorId,
          moneda: cotizacion.moneda,
          subtotal: cotizacion.subtotal,
          descuento: cotizacion.descuento,
          importeTotal: cotizacion.importeTotal,
          saldoPendiente: cotizacion.importeTotal,
          estado: "CONFIRMADA",
          detalles: {
            create: cotizacion.detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              descuento: d.descuento,
            })),
          },
        },
        select: { id: true },
      });

      const actualizada = await tx.oportunidadComercial.updateMany({
        where: { id: oportunidadId, etapa: "NEGOCIACION" },
        data: { etapa: "GANADA", fechaCierre: new Date(), motivoPerdida: null },
      });
      if (actualizada.count !== 1) throw new Error("La oportunidad cambió. Actualiza la página.");
      await tx.historialOportunidad.create({
        data: {
          oportunidadId,
          usuarioId: Number(usuario.id),
          etapaAnterior: "NEGOCIACION",
          etapaNueva: "GANADA",
          comentario: `Última cotización COT-${String(cotizacion.id).padStart(5, "0")} · v${cotizacion.version} aceptada. Venta #${venta.id} creada.`,
        },
      });
      return { ventaId: venta.id, clienteId: oportunidad.clienteId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/dashboard/ventas/crm");
    revalidatePath("/dashboard/cotizaciones");
    revalidatePath("/dashboard/ventas");
    revalidatePath(`/dashboard/ventas/${resultado.ventaId}`);
    revalidatePath(`/dashboard/clientes/${resultado.clienteId}`);
    return { ok: `Oportunidad ganada y venta #${resultado.ventaId} creada.`, ventaId: resultado.ventaId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { error: "Esta cotización ya fue convertida. Actualiza la página." };
      if (error.code === "P2034") return { error: "Se produjo un cambio simultáneo. Actualiza e intenta otra vez." };
    }
    const permitidos = [
      "Oportunidad no encontrada.",
      "Solo se puede ganar una oportunidad en Negociación.",
      "No tienes permisos para esta oportunidad.",
      "El cliente debe estar activo y calificado.",
      "Esta oportunidad ya tiene una venta registrada.",
      "La oportunidad no tiene cotizaciones.",
      "La última cotización debe estar Emitida o Aceptada para ganar la oportunidad.",
      "La última cotización está vencida. Emite una revisión vigente.",
      "La cotización no coincide con el cliente o responsable de la oportunidad.",
      "La última cotización ya tiene una venta.",
      "La cotización no tiene productos.",
      "La cotización debe tener un importe total positivo.",
      "La cotización contiene cantidades inválidas.",
      "La cotización cambió. Actualiza la página.",
      "La oportunidad cambió. Actualiza la página.",
    ];
    const mensaje = error instanceof Error ? error.message : "";
    return { error: permitidos.includes(mensaje) ? mensaje : "No se pudo confirmar la venta. Actualiza y vuelve a intentar." };
  }
}
