"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { EtapaOportunidad } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export type EstadoAccionCRM = { ok?: string; error?: string } | undefined;

const ETAPAS = ["PROSPECTO", "CONTACTADO", "COTIZACION", "NEGOCIACION", "GANADA", "PERDIDA"] as const;
const etapaSchema = z.enum(ETAPAS);

const oportunidadSchema = z.object({
  titulo: z.string().trim().min(3, "El título debe tener al menos 3 caracteres.").max(180),
  clienteId: z.coerce.number().int().positive(),
  vendedorId: z.coerce.number().int().positive(),
  moneda: z.enum(["PEN", "USD"]),
  montoEstimado: z.string().trim().refine(
    (s) => s === "" || /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(s),
    "El monto debe ser positivo y tener máximo dos decimales."
  ),
  descripcion: z.string().trim().max(5000),
  proximaActividad: z.string().trim().max(300),
  fechaSeguimiento: z.string().trim().refine(
    (s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s),
    "La fecha de seguimiento no es válida."
  ),
});

const cambioEtapaSchema = z.object({
  oportunidadId: z.coerce.number().int().positive(),
  etapaNueva: etapaSchema,
  etapaEsperada: etapaSchema,
  comentario: z.string().trim().max(2000),
});

const rutas = ["/dashboard/ventas", "/dashboard/ventas/crm", "/dashboard/clientes"];
function actualizarVistas(clienteId?: number) {
  for (const ruta of rutas) revalidatePath(ruta);
  if (clienteId) revalidatePath(`/dashboard/clientes/${clienteId}`);
}

function fechaLocal(fecha: string): Date | null {
  if (!fecha) return null;
  // Medio día UTC evita que la fecha del seguimiento cambie al mostrarse en Perú.
  const d = new Date(`${fecha}T12:00:00.000Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === fecha ? d : null;
}

function puedeGestionarVendedor(rol: string, usuarioId: number, vendedorId: number) {
  return rol === "SUPER_ADMIN" || rol === "ADMIN" || usuarioId === vendedorId;
}

function obtenerCampos(form: FormData) {
  return {
    titulo: String(form.get("titulo") ?? ""),
    clienteId: form.get("clienteId") ?? "",
    vendedorId: form.get("vendedorId") ?? "",
    moneda: String(form.get("moneda") ?? "PEN"),
    montoEstimado: String(form.get("montoEstimado") ?? ""),
    descripcion: String(form.get("descripcion") ?? ""),
    proximaActividad: String(form.get("proximaActividad") ?? ""),
    fechaSeguimiento: String(form.get("fechaSeguimiento") ?? ""),
  };
}

async function obtenerUsuario() {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const id = Number(usuario.id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Sesión inválida.");
  return { id, rol: usuario.rol };
}

export async function crearOportunidad(
  _prev: EstadoAccionCRM,
  form: FormData
): Promise<EstadoAccionCRM> {
  const usuario = await obtenerUsuario();
  const resultado = oportunidadSchema.safeParse(obtenerCampos(form));
  if (!resultado.success) return { error: resultado.error.issues[0]?.message ?? "Datos inválidos." };
  const x = resultado.data;
  if (!puedeGestionarVendedor(usuario.rol, usuario.id, x.vendedorId)) {
    return { error: "No puedes asignar oportunidades a otros vendedores." };
  }
  const fecha = fechaLocal(x.fechaSeguimiento);
  if (x.fechaSeguimiento && !fecha) return { error: "Fecha de seguimiento inválida." };

  try {
    const creada = await prisma.$transaction(async (tx) => {
      const [cliente, vendedor] = await Promise.all([
        tx.cliente.findFirst({ where: { id: x.clienteId, estado: true }, select: { id: true } }),
        tx.usuario.findFirst({
          where: { id: x.vendedorId, estado: "ACTIVO", rol: { in: ROLES_COMERCIAL } },
          select: { id: true },
        }),
      ]);
      if (!cliente || !vendedor) throw new Error("El cliente o vendedor no está activo.");
      return tx.oportunidadComercial.create({
        data: {
          titulo: x.titulo,
          clienteId: x.clienteId,
          vendedorId: x.vendedorId,
          moneda: x.moneda,
          montoEstimado: x.montoEstimado ? new Prisma.Decimal(x.montoEstimado) : null,
          descripcion: x.descripcion || null,
          proximaActividad: x.proximaActividad || null,
          fechaSeguimiento: fecha,
          historial: {
            create: {
              usuarioId: usuario.id,
              etapaAnterior: null,
              etapaNueva: "PROSPECTO",
              comentario: "Oportunidad creada.",
            },
          },
        },
        select: { id: true, clienteId: true },
      });
    });
    actualizarVistas(creada.clienteId);
    return { ok: `Oportunidad #${creada.id} creada correctamente.` };
  } catch (error) {
    return { error: error instanceof Error && error.message === "El cliente o vendedor no está activo."
      ? error.message : "No se pudo crear la oportunidad." };
  }
}

export async function actualizarOportunidad(
  _prev: EstadoAccionCRM,
  form: FormData
): Promise<EstadoAccionCRM> {
  const usuario = await obtenerUsuario();
  const id = Number(form.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return { error: "Oportunidad inválida." };
  const resultado = oportunidadSchema.safeParse(obtenerCampos(form));
  if (!resultado.success) return { error: resultado.error.issues[0]?.message ?? "Datos inválidos." };
  const x = resultado.data;
  const fecha = fechaLocal(x.fechaSeguimiento);
  if (x.fechaSeguimiento && !fecha) return { error: "Fecha de seguimiento inválida." };

  try {
    await prisma.$transaction(async (tx) => {
      const anterior = await tx.oportunidadComercial.findUnique({ where: { id } });
      if (!anterior) throw new Error("Oportunidad no encontrada.");
      if (!puedeGestionarVendedor(usuario.rol, usuario.id, anterior.vendedorId) ||
          !puedeGestionarVendedor(usuario.rol, usuario.id, x.vendedorId)) {
        throw new Error("No tienes permisos para reasignar esta oportunidad.");
      }
      if (anterior.etapa === "GANADA" || anterior.etapa === "PERDIDA") {
        throw new Error("Una oportunidad cerrada no puede editarse.");
      }
      const [cliente, vendedor] = await Promise.all([
        tx.cliente.findFirst({ where: { id: x.clienteId, estado: true }, select: { id: true } }),
        tx.usuario.findFirst({
          where: { id: x.vendedorId, estado: "ACTIVO", rol: { in: ROLES_COMERCIAL } },
          select: { id: true },
        }),
      ]);
      if (!cliente || !vendedor) throw new Error("El cliente o vendedor no está activo.");
      await tx.oportunidadComercial.update({
        where: { id },
        data: {
          titulo: x.titulo, clienteId: x.clienteId, vendedorId: x.vendedorId,
          moneda: x.moneda,
          montoEstimado: x.montoEstimado ? new Prisma.Decimal(x.montoEstimado) : null,
          descripcion: x.descripcion || null, proximaActividad: x.proximaActividad || null,
          fechaSeguimiento: fecha,
        },
      });
    });
    actualizarVistas(x.clienteId);
    return { ok: "Oportunidad actualizada." };
  } catch (error) {
    return { error: error instanceof Error && [
      "Oportunidad no encontrada.", "No tienes permisos para reasignar esta oportunidad.",
      "Una oportunidad cerrada no puede editarse.", "El cliente o vendedor no está activo.",
    ].includes(error.message) ? error.message : "No se pudo actualizar la oportunidad." };
  }
}

export async function cambiarEtapaOportunidad(
  _prev: EstadoAccionCRM,
  form: FormData
): Promise<EstadoAccionCRM> {
  const usuario = await obtenerUsuario();
  const resultado = cambioEtapaSchema.safeParse({
    oportunidadId: form.get("oportunidadId") ?? "",
    etapaNueva: form.get("etapaNueva") ?? "",
    etapaEsperada: form.get("etapaEsperada") ?? "",
    comentario: String(form.get("comentario") ?? ""),
  });
  if (!resultado.success) return { error: resultado.error.issues[0]?.message ?? "Cambio inválido." };
  const x = resultado.data;
  if (x.etapaNueva === x.etapaEsperada) return { error: "Selecciona una etapa diferente." };
  if (x.etapaEsperada === "GANADA" || x.etapaEsperada === "PERDIDA") {
    return { error: "Las oportunidades cerradas no pueden moverse." };
  }
  if (x.etapaNueva === "PERDIDA" && !x.comentario) {
    return { error: "Indica el motivo por el que se perdió la oportunidad." };
  }

  try {
    const clienteId = await prisma.$transaction(async (tx) => {
      const oportunidad = await tx.oportunidadComercial.findUnique({
        where: { id: x.oportunidadId },
        select: { clienteId: true, vendedorId: true, etapa: true },
      });
      if (!oportunidad) throw new Error("Oportunidad no encontrada.");
      if (!puedeGestionarVendedor(usuario.rol, usuario.id, oportunidad.vendedorId)) {
        throw new Error("No tienes permisos para esta oportunidad.");
      }
      if (oportunidad.etapa !== x.etapaEsperada) {
        throw new Error("La etapa cambió desde que abriste el tablero. Actualiza la página.");
      }
      // Regla de negocio: para comenzar Negociación debe existir una propuesta
      // vinculada a la oportunidad. Se comprueba en el servidor (también para drag & drop).
      if (x.etapaNueva === "NEGOCIACION") {
        const propuestas = await tx.cotizacion.count({
          where: { oportunidadId: x.oportunidadId, estado: { not: "ANULADA" } },
        });
        if (propuestas === 0) {
          throw new Error("Registra al menos una cotización antes de pasar a Negociación.");
        }
      }
      // Actualización condicional: impide registrar dos movimientos simultáneos sobre la misma etapa.
      const resultadoUpdate = await tx.oportunidadComercial.updateMany({
        where: { id: x.oportunidadId, etapa: x.etapaEsperada },
        data: {
          etapa: x.etapaNueva,
          fechaCierre: x.etapaNueva === "GANADA" || x.etapaNueva === "PERDIDA" ? new Date() : null,
          motivoPerdida: x.etapaNueva === "PERDIDA" ? x.comentario : null,
        },
      });
      if (resultadoUpdate.count !== 1) throw new Error("La oportunidad cambió. Actualiza la página.");
      await tx.historialOportunidad.create({
        data: {
          oportunidadId: x.oportunidadId,
          usuarioId: usuario.id,
          etapaAnterior: x.etapaEsperada as EtapaOportunidad,
          etapaNueva: x.etapaNueva,
          comentario: x.comentario || null,
        },
      });
      return oportunidad.clienteId;
    });
    actualizarVistas(clienteId);
    return { ok: "Etapa actualizada y movimiento registrado." };
  } catch (error) {
    return { error: error instanceof Error && [
      "Oportunidad no encontrada.", "No tienes permisos para esta oportunidad.",
      "La etapa cambió desde que abriste el tablero. Actualiza la página.",
      "La oportunidad cambió. Actualiza la página.",
      "Registra al menos una cotización antes de pasar a Negociación.",
    ].includes(error.message) ? error.message : "No se pudo cambiar la etapa." };
  }
}


// Registro rápido de clientes desde el CRM. No modifica el estado de la oportunidad.
export type EstadoClienteCRM = { error?: string; cliente?: { id: number; razonSocial: string } } | undefined;
const clienteCRM = z.object({
  razonSocial: z.string().trim().min(2).max(180),
  documento: z.string().regex(/^(?:\d{8}|\d{11})$/, "Ingresa un DNI de 8 dígitos o RUC de 11."),
  telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""), z.email()]),
  direccion: z.string().trim().max(300),
});
export async function crearClienteDesdeCRM(_prev: EstadoClienteCRM, form: FormData): Promise<EstadoClienteCRM> {
  await obtenerUsuario();
  const valid = clienteCRM.safeParse(Object.fromEntries(["razonSocial", "documento", "telefono", "correo", "direccion"].map((k) => [k, String(form.get(k) ?? "")])));
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos del cliente inválidos." };
  const x = valid.data;
  try {
    const cliente = await prisma.cliente.create({ data: {
      razonSocial: x.razonSocial, documento: x.documento,
      telefono: x.telefono || null, correo: x.correo || null,
      direccion: x.direccion || null, estado: true,
    }, select: { id: true, razonSocial: true } });
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/ventas/crm");
    return { cliente };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya existe un cliente con ese DNI o RUC." };
    return { error: "No se pudo crear el cliente." };
  }
}
