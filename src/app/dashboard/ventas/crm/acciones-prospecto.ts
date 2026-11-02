"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export type RespuestaProspecto = { ok?: string; error?: string } | undefined;
const id = z.coerce.number().int().positive();
const contactoSchema = z.object({
  oportunidadId: id,
  tipo: z.enum(["LLAMADA", "WHATSAPP", "CORREO", "VISITA", "OTRO"]),
  resultado: z.enum(["CONTACTO_EFECTIVO", "SIN_RESPUESTA", "REPROGRAMADO", "SIN_INTERES"]),
  personaContacto: z.string().trim().max(120),
  observaciones: z.string().trim().min(10, "Describe brevemente qué ocurrió (mínimo 10 caracteres).").max(2000),
});
const calificarSchema = z.object({
  oportunidadId: id,
  interesConfirmado: z.literal("si"),
  personaContacto: z.string().trim().min(2).max(120),
  necesidad: z.string().trim().min(10).max(1000),
});

async function actor() {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  return { id: Number(usuario.id), admin: ["ADMIN", "SUPER_ADMIN"].includes(usuario.rol) };
}
function vistas(clienteId: number) {
  revalidatePath("/dashboard/ventas/crm");
  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clienteId}`);
}

const clienteSchema = z.object({
  oportunidadId: id,
  razonSocial: z.string().trim().min(2).max(180),
  documento: z.string().trim().regex(/^(?:[0-9]{8}|[0-9]{11})$/, "Ingresa un DNI de 8 dígitos o RUC de 11 dígitos."),
  telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""), z.string().trim().email()]),
  direccion: z.string().trim().max(300),
}).refine(x => Boolean(x.telefono || x.correo), { message: "Indica al menos un teléfono o correo." });

export async function completarDatosProspecto(_: RespuestaProspecto, form: FormData): Promise<RespuestaProspecto> {
  const u = await actor();
  const valid = clienteSchema.safeParse({
    oportunidadId: form.get("oportunidadId"), razonSocial: form.get("razonSocial") ?? "",
    documento: form.get("documento") ?? "", telefono: form.get("telefono") ?? "",
    correo: form.get("correo") ?? "", direccion: form.get("direccion") ?? "",
  });
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos inválidos." };
  const x = valid.data;
  try {
    const clienteId = await prisma.$transaction(async tx => {
      const o = await tx.oportunidadComercial.findUnique({ where: { id: x.oportunidadId }, select: { clienteId: true, vendedorId: true, etapa: true } });
      if (!o) throw new Error("Oportunidad no encontrada.");
      if (!u.admin && o.vendedorId !== u.id) throw new Error("No tienes permisos para esta oportunidad.");
      if (o.etapa !== "PROSPECTO") throw new Error("Solo se completan datos de prospectos abiertos.");
      const duplicado = await tx.cliente.findFirst({ where: { documento: x.documento, id: { not: o.clienteId } }, select: { id: true } });
      if (duplicado) throw new Error("El documento ya corresponde a otro cliente.");
      await tx.cliente.update({ where: { id: o.clienteId }, data: {
        razonSocial: x.razonSocial, documento: x.documento,
        telefono: x.telefono || null, correo: x.correo || null, direccion: x.direccion || null,
      }});
      return o.clienteId;
    });
    vistas(clienteId);
    return { ok: "Datos del prospecto actualizados." };
  } catch(e) { return { error: e instanceof Error ? e.message : "No se pudieron guardar los datos." }; }
}

export async function registrarActividadProspecto(_: RespuestaProspecto, form: FormData): Promise<RespuestaProspecto> {
  const u = await actor();
  const parsed = contactoSchema.safeParse({
    oportunidadId: form.get("oportunidadId"), tipo: form.get("tipo"), resultado: form.get("resultado"),
    personaContacto: form.get("personaContacto") ?? "", observaciones: form.get("observaciones") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const x = parsed.data;
  try {
    const clienteId = await prisma.$transaction(async (tx) => {
      const o = await tx.oportunidadComercial.findUnique({where:{id:x.oportunidadId}, select:{clienteId:true,vendedorId:true,etapa:true}});
      if (!o) throw new Error("Oportunidad no encontrada.");
      if (!u.admin && o.vendedorId !== u.id) throw new Error("No tienes permisos para esta oportunidad.");
      if (["GANADA", "PERDIDA"].includes(o.etapa)) throw new Error("La oportunidad ya está cerrada.");
      await tx.actividadComercial.create({data:{
        oportunidadId:x.oportunidadId, usuarioId:u.id, tipo:x.tipo, resultado:x.resultado,
        personaContacto:x.personaContacto || null, observaciones:x.observaciones,
      }});
      return o.clienteId;
    });
    vistas(clienteId);
    return {ok: "Actividad registrada. La etapa no ha cambiado."};
  } catch (e) { return {error: e instanceof Error ? e.message : "No se pudo registrar la actividad."}; }
}

export async function calificarClienteDesdeOportunidad(_: RespuestaProspecto, form: FormData): Promise<RespuestaProspecto> {
  const u = await actor();
  const parsed = calificarSchema.safeParse({
    oportunidadId: form.get("oportunidadId"), interesConfirmado:form.get("interesConfirmado"),
    personaContacto:form.get("personaContacto") ?? "", necesidad:form.get("necesidad") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confirma el interés, responsable y necesidad comercial." };
  const x = parsed.data;
  try {
    const clienteId = await prisma.$transaction(async (tx) => {
      const o = await tx.oportunidadComercial.findUnique({where:{id:x.oportunidadId}, include:{cliente:true}});
      if (!o) throw new Error("Oportunidad no encontrada.");
      if (!u.admin && o.vendedorId !== u.id) throw new Error("No tienes permisos para esta oportunidad.");
      if (o.etapa !== "PROSPECTO") throw new Error("Esta calificación se realiza desde Prospecto.");
      if (!o.cliente.estado || !/^(?:\d{8}|\d{11})$/.test(o.cliente.documento ?? "") || (!o.cliente.telefono && !o.cliente.correo)) {
        throw new Error("Completa DNI/RUC y un teléfono o correo válido del cliente antes de calificarlo.");
      }
      const huboContacto = await tx.actividadComercial.count({where:{oportunidadId:o.id,resultado:"CONTACTO_EFECTIVO"}});
      if (!huboContacto) throw new Error("Registra primero un contacto efectivo para esta oportunidad.");
      await tx.cliente.update({where:{id:o.clienteId},data:{estadoRelacionComercial:"CALIFICADO",fechaCalificacion:new Date()}});
      await tx.actividadComercial.create({data:{
        oportunidadId:o.id, usuarioId:u.id, tipo:"CALIFICACION", resultado:"CALIFICADO",
        personaContacto:x.personaContacto, observaciones:`Necesidad: ${x.necesidad}`,
      }});
      const cambio = await tx.oportunidadComercial.updateMany({ where: { id: o.id, etapa: "PROSPECTO" }, data: { etapa: "CONTACTADO" } });
      if (cambio.count !== 1) throw new Error("La etapa cambió. Actualiza el tablero.");
      await tx.historialOportunidad.create({ data: {
        oportunidadId: o.id, usuarioId: u.id, etapaAnterior: "PROSPECTO", etapaNueva: "CONTACTADO",
        comentario: "Primer contacto efectivo y calificación comercial completados.",
      }});
      return o.clienteId;
    });
    vistas(clienteId);
    return {ok:"Cliente calificado y oportunidad movida a Contactado."};
  } catch (e) {return {error:e instanceof Error ? e.message : "No se pudo calificar el cliente."};}
}
