"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

const schema = z.object({
  clienteId: z.number().int().positive(),
  oportunidadId: z.number().int().positive().nullable().optional(),
  descuento: z.number().finite().min(0).max(99999999),
  observaciones: z.string().max(3000).optional(),
  items: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive().max(1000000),
    precioUnitario: z.number().finite().min(0).max(99999999),
  })).min(1).max(50),
});

export type EstadoCotizacion = { ok?: string; error?: string } | undefined;
const centavos = (valor: number) => Math.round((valor + Number.EPSILON) * 100);

export async function crearCotizacion(_: EstadoCotizacion, form: FormData): Promise<EstadoCotizacion> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  let payload: unknown;
  try { payload = JSON.parse(String(form.get("payload") ?? "")); }
  catch { return { error: "Formulario inválido." }; }

  const valid = schema.safeParse(payload);
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos inválidos." };

  const { clienteId, oportunidadId, items, descuento, observaciones } = valid.data;
  const ids = items.map((i) => i.productoId);
  if (new Set(ids).size !== ids.length) return { error: "No repitas el mismo producto." };
  const [cliente, productos, oportunidad] = await Promise.all([
    prisma.cliente.findFirst({ where: { id: clienteId, estado: true }, select: { id: true } }),
    prisma.producto.findMany({ where: { id: { in: ids }, estado: true }, select: { id: true, moneda: true } }),
    oportunidadId ? prisma.oportunidadComercial.findUnique({ where: { id: oportunidadId }, select: { clienteId: true, vendedorId: true, etapa: true } }) : Promise.resolve(null),
  ]);
  if (!cliente || productos.length !== ids.length) return { error: "Cliente o producto inexistente/inactivo." };
  if (oportunidadId) {
    if (!oportunidad || oportunidad.clienteId !== clienteId) return { error: "La oportunidad no corresponde al cliente seleccionado." };
    if (oportunidad.etapa === "GANADA" || oportunidad.etapa === "PERDIDA") return { error: "No se pueden emitir cotizaciones para oportunidades cerradas." };
    if (usuario.rol === "COMERCIAL" && oportunidad.vendedorId !== Number(usuario.id)) return { error: "No tienes permiso sobre esta oportunidad." };
  }
  // En esta versión se permiten propuestas de una sola moneda, sin conversión automática.
  const monedas = new Set(productos.map((p) => p.moneda));
  if (monedas.size !== 1) return { error: "No se pueden mezclar productos PEN y USD en una cotización." };
  const moneda = productos[0]!.moneda;
  if (moneda !== "PEN" && moneda !== "USD") return { error: "Moneda no admitida." };

  const subtotalCent = items.reduce((s, i) => s + centavos(i.precioUnitario) * i.cantidad, 0);
  const descuentoCent = centavos(descuento);
  const totalCent = subtotalCent - descuentoCent;
  if (![subtotalCent, descuentoCent, totalCent].every(Number.isSafeInteger) || subtotalCent > 9999999999) return { error: "Importe demasiado alto." };
  if (totalCent < 0) return { error: "El descuento supera al subtotal." };

  try {
    await prisma.cotizacion.create({
      data: {
        clienteId,
        vendedorId: Number(usuario.id),
        oportunidadId: oportunidadId ?? null,
        estado: "BORRADOR",
        moneda,
        observaciones: observaciones?.trim() || null,
        subtotal: (subtotalCent / 100).toFixed(2),
        descuento: (descuentoCent / 100).toFixed(2),
        importeTotal: (totalCent / 100).toFixed(2),
        detalles: { create: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: (centavos(i.precioUnitario) / 100).toFixed(2),
          descuento: "0.00",
        })) },
      },
    });
  } catch {
    return { error: "No se pudo guardar la cotización. Verifica los datos e inténtalo nuevamente." };
  }
  revalidatePath("/dashboard/cotizaciones");
  revalidatePath("/dashboard/ventas/crm");
  return { ok: "Cotización registrada como borrador. No se reservó ni descontó inventario." };
}
