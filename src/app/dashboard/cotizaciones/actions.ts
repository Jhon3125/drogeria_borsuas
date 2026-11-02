"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

const importe = z.number().finite().min(0).max(99999999);
// Rechaza importes con precisión mayor a centavos, incluso si se omite el formulario.
const importeDosDecimales = importe.refine(
  (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001,
  { message: "Los importes y descuentos admiten como máximo dos decimales." }
);
const schema = z.object({
  clienteId: z.number().int().positive(),
  oportunidadId: z.number().int().positive().nullable().optional(),
  revisarCotizacionId: z.number().int().positive().nullable().optional(),
  descuento: importeDosDecimales,
  observaciones: z.string().max(3000).optional(),
  condicionPago: z.string().max(100).optional(),
  plazoEntrega: z.string().max(150).optional(),
  validezHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  items: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive().max(1000000),
    precioUnitario: importeDosDecimales,
    descuento: importeDosDecimales,
  })).min(1).max(50),
});
export type EstadoCotizacion = { ok?: string; error?: string } | undefined;
const centavos = (n: number) => Math.round((n + Number.EPSILON) * 100);

export async function crearCotizacion(_: EstadoCotizacion, form: FormData): Promise<EstadoCotizacion> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  let payload: unknown;
  try { payload = JSON.parse(String(form.get("payload") ?? "")); }
  catch { return { error: "Formulario inválido." }; }
  const valid = schema.safeParse(payload);
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos inválidos." };
  const { clienteId, oportunidadId, revisarCotizacionId, items, descuento, observaciones, condicionPago, plazoEntrega, validezHasta } = valid.data;
  // La revisión debe ser una nueva cotización, no la modificación del documento histórico.
  // La validación definitiva y la creación se efectúan en la misma transacción.
  const ids = items.map((i) => i.productoId);
  if (new Set(ids).size !== ids.length) return { error: "No se puede repetir el mismo producto." };

  const [cliente, productos, oportunidad] = await Promise.all([
    prisma.cliente.findFirst({
      where: {
        id: clienteId,
        estado: true,
      },
      select: {
        id: true,
        estadoRelacionComercial: true,
      },
    }),
    prisma.producto.findMany({ where: { id: { in: ids }, estado: true }, select: { id: true, moneda: true } }),
    oportunidadId ? prisma.oportunidadComercial.findUnique({ where: { id: oportunidadId }, select: { clienteId: true, vendedorId: true, etapa: true } }) : Promise.resolve(null),
  ]);
  if (!cliente || productos.length !== ids.length) return { error: "Cliente o producto inexistente o inactivo." };
  if (cliente.estadoRelacionComercial !== "CALIFICADO") {
    return { error: "Registra el primer contacto y completa la calificación comercial del cliente antes de cotizar." };
  }
  if (oportunidadId) {
    if (!oportunidad || oportunidad.clienteId !== clienteId) return { error: "La oportunidad no corresponde al cliente." };
    if (oportunidad.etapa === "PROSPECTO") return { error: "Registra el primer contacto y avanza a Contactado antes de cotizar." };
    if (["GANADA", "PERDIDA"].includes(oportunidad.etapa)) return { error: "No se pueden cotizar oportunidades cerradas." };
    if (usuario.rol === "COMERCIAL" && oportunidad.vendedorId !== Number(usuario.id)) return { error: "No tienes permisos sobre esta oportunidad." };
  }
  const monedas = new Set(productos.map((p) => p.moneda));
  if (monedas.size !== 1) return { error: "No se pueden mezclar PEN y USD en una cotización." };
  const moneda = productos[0]?.moneda;
  if (moneda !== "PEN" && moneda !== "USD") return { error: "Moneda no admitida." };
  const subtotalCent = items.reduce((s, i) => s + centavos(i.precioUnitario) * i.cantidad, 0);
  const descuentoLineasCent = items.reduce((s, i) => s + centavos(i.descuento), 0);
  const descuentoGeneralCent = centavos(descuento);
  const totalCent = subtotalCent - descuentoLineasCent - descuentoGeneralCent;
  if (items.some((i) => centavos(i.descuento) > centavos(i.precioUnitario) * i.cantidad)) return { error: "El descuento de una línea supera su importe." };
  if (![subtotalCent, descuentoLineasCent, descuentoGeneralCent, totalCent].every(Number.isSafeInteger) || subtotalCent > 9999999999 || totalCent < 0) return { error: "Importes inválidos o descuentos superiores al subtotal." };

  let fechaValidez: Date | null = null;
  if (validezHasta) {
    fechaValidez = new Date(`${validezHasta}T12:00:00.000Z`);
    if (Number.isNaN(fechaValidez.getTime())) return { error: "Fecha de validez inválida." };
    const hoy = new Date();
    const fechaHoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
    if (fechaValidez.getTime() < fechaHoyUTC) return { error: "La validez no puede ser una fecha anterior a hoy." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const clienteActual = await tx.cliente.findUnique({
        where: { id: clienteId },
        select: { estado: true, estadoRelacionComercial: true },
      });
      if (!clienteActual?.estado || clienteActual.estadoRelacionComercial !== "CALIFICADO") {
        throw new Error("El cliente debe estar activo y calificado para registrar cotizaciones.");
      }
      let version = 1;
      let cotizacionAnteriorId: number | null = null;
      if (revisarCotizacionId) {
        const anterior = await tx.cotizacion.findUnique({
          where: { id: revisarCotizacionId },
          select: {
            id: true, version: true, estado: true, clienteId: true,
            oportunidadId: true, vendedorId: true, moneda: true,
            revisionSiguiente: { select: { id: true } }
          },
        });
        if (!anterior) throw new Error("La cotización de origen no existe.");
        if (anterior.estado !== "RECHAZADA") throw new Error("Solo se pueden revisar cotizaciones rechazadas.");
        if (anterior.revisionSiguiente) throw new Error("Esta cotización ya tiene una revisión. Continúa desde la última versión.");
        if (usuario.rol === "COMERCIAL" && anterior.vendedorId !== Number(usuario.id)) throw new Error("Sin permisos para revisar la cotización.");
        if (anterior.clienteId !== clienteId || anterior.oportunidadId !== (oportunidadId ?? null) || anterior.moneda !== moneda) {
          throw new Error("La revisión debe conservar el cliente, la oportunidad y la moneda de origen.");
        }
        version = anterior.version + 1;
        cotizacionAnteriorId = anterior.id;
      }
      await tx.cotizacion.create({
        data: {
          clienteId, vendedorId: Number(usuario.id), oportunidadId: oportunidadId ?? null,
          version, cotizacionAnteriorId,
          estado: "BORRADOR", moneda, validezHasta: fechaValidez,
          condicionPago: condicionPago?.trim() || null,
          plazoEntrega: plazoEntrega?.trim() || null,
          observaciones: observaciones?.trim() || null,
          subtotal: (subtotalCent / 100).toFixed(2),
          descuento: (descuentoGeneralCent / 100).toFixed(2),
          importeTotal: (totalCent / 100).toFixed(2),
          detalles: {
            create: items.map((i) => ({
              productoId: i.productoId,
              cantidad: i.cantidad,
              precioUnitario: (centavos(i.precioUnitario) / 100).toFixed(2),
              descuento: (centavos(i.descuento) / 100).toFixed(2),
            }))
          },
        },
      });
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";
    const permitidos = [
      "La cotización de origen no existe.",
      "Solo se pueden revisar cotizaciones rechazadas.",
      "Esta cotización ya tiene una revisión. Continúa desde la última versión.",
      "Sin permisos para revisar la cotización.",
      "La revisión debe conservar el cliente, la oportunidad y la moneda de origen.",
      "El cliente debe estar activo y calificado para registrar cotizaciones.",
    ];
    return { error: permitidos.includes(mensaje) ? mensaje : "No se pudo registrar la nueva versión. Actualiza la página e inténtalo otra vez." };
  }
  revalidatePath("/dashboard/cotizaciones");
  revalidatePath("/dashboard/ventas/crm");
  return { ok: revisarCotizacionId ? "Nueva versión guardada como borrador. La propuesta original se conserva." : "Cotización guardada como borrador. No se reservó ni descontó stock." };
}

// Transiciones formales de la propuesta. No crean venta ni modifican inventario.
const estadosDestino = ["EMITIDA", "ACEPTADA", "RECHAZADA"] as const;
export type EstadoCambioCotizacion = { ok?: string; error?: string } | undefined;
const cambioEstadoSchema = z.object({
  cotizacionId: z.coerce.number().int().positive(),
  estadoEsperado: z.enum(["BORRADOR", "EMITIDA"]),
  estadoNuevo: z.enum(estadosDestino),
});

export async function cambiarEstadoCotizacion(
  _prev: EstadoCambioCotizacion, form: FormData
): Promise<EstadoCambioCotizacion> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const valid = cambioEstadoSchema.safeParse({
    cotizacionId: form.get("cotizacionId"),
    estadoEsperado: form.get("estadoEsperado"),
    estadoNuevo: form.get("estadoNuevo"),
  });
  if (!valid.success) return { error: "Solicitud de cambio inválida." };
  const { cotizacionId, estadoEsperado, estadoNuevo } = valid.data;
  if (!(
    (estadoEsperado === "BORRADOR" && estadoNuevo === "EMITIDA") ||
    (estadoEsperado === "EMITIDA" && (estadoNuevo === "ACEPTADA" || estadoNuevo === "RECHAZADA"))
  )) return { error: "Transición de estado no permitida." };

  try {
    const mensaje = await prisma.$transaction(async (tx) => {
      const cotizacion = await tx.cotizacion.findUnique({
        where: { id: cotizacionId },
        select: {
          id: true, estado: true, vendedorId: true, validezHasta: true,
          oportunidadId: true, oportunidad: { select: { etapa: true, vendedorId: true } },
          cliente: { select: { estado: true, estadoRelacionComercial: true } },
          detalles: { select: { id: true }, take: 1 },
        },
      });
      if (!cotizacion) throw new Error("Cotización no encontrada.");
      if (!cotizacion.cliente.estado || cotizacion.cliente.estadoRelacionComercial !== "CALIFICADO") {
        throw new Error("El cliente debe estar activo y calificado para gestionar esta cotización.");
      }
      if (usuario.rol === "COMERCIAL" && (
        cotizacion.vendedorId !== Number(usuario.id) ||
        (cotizacion.oportunidad && cotizacion.oportunidad.vendedorId !== Number(usuario.id))
      )) throw new Error("No tienes permisos sobre esta cotización.");
      if (cotizacion.estado !== estadoEsperado) throw new Error("La cotización cambió de estado. Actualiza la página.");
      if (cotizacion.oportunidad && ["PROSPECTO", "GANADA", "PERDIDA"].includes(cotizacion.oportunidad.etapa)) {
        throw new Error("La oportunidad vinculada no admite esta operación.");
      }
      if (cotizacion.detalles.length === 0) throw new Error("No se puede emitir una cotización sin productos.");
      if (cotizacion.validezHasta) {
        // La fecha se almacena a mediodía UTC para evitar desplazamientos de fecha en Perú.
        const fechaValidez = cotizacion.validezHasta.toISOString().slice(0, 10);
        const hoyPeru = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        if (fechaValidez < hoyPeru) throw new Error("La cotización ha vencido. Debes preparar una nueva propuesta.");
      }
      const actualizada = await tx.cotizacion.updateMany({
        where: { id: cotizacionId, estado: estadoEsperado },
        data: { estado: estadoNuevo },
      });
      if (actualizada.count !== 1) throw new Error("La cotización fue modificada por otro usuario.");
      return estadoNuevo === "EMITIDA" ? "Cotización emitida correctamente." :
        estadoNuevo === "ACEPTADA" ? "Cotización aceptada. La venta todavía no se ha generado." :
          "Cotización rechazada correctamente.";
    });
    revalidatePath("/dashboard/cotizaciones");
    revalidatePath("/dashboard/ventas/crm");
    return { ok: mensaje };
  } catch (error) {
    const permitidos = [
      "Cotización no encontrada.", "No tienes permisos sobre esta cotización.",
      "El cliente debe estar activo y calificado para gestionar esta cotización.",
      "La cotización cambió de estado. Actualiza la página.",
      "La oportunidad vinculada no admite esta operación.",
      "No se puede emitir una cotización sin productos.",
      "La cotización ha vencido. Debes preparar una nueva propuesta.",
      "La cotización fue modificada por otro usuario.",
    ];
    return { error: error instanceof Error && permitidos.includes(error.message) ? error.message : "No se pudo actualizar el estado de la cotización." };
  }
}
