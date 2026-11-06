"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

export type EstadoNuevoProspecto = { ok?: string; error?: string } | undefined;
const schema = z.object({
  razonSocial: z.string().trim().min(2, "Indica el nombre o razón social.").max(180),
  documento: z.union([z.literal(""), z.string().regex(/^(?:\d{8}|\d{11})$/, "DNI/RUC inválido.")]),
  telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""), z.email()]),
  personaContacto: z.string().trim().max(120),
  titulo: z.string().trim().min(3, "Describe la oportunidad.").max(180),
  descripcion: z.string().trim().max(2000),
  vendedorId: z.coerce.number().int().positive(),
});

export async function crearProspectoConOportunidad(_: EstadoNuevoProspecto, form: FormData): Promise<EstadoNuevoProspecto> {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const parsed = schema.safeParse(Object.fromEntries(
    ["razonSocial", "documento", "telefono", "correo", "personaContacto", "titulo", "descripcion", "vendedorId"]
      .map((campo) => [campo, String(form.get(campo) ?? "")])
  ));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const x = parsed.data;
  const actorId = Number(usuario.id);
  const admin = usuario.rol === "ADMIN" || usuario.rol === "SUPER_ADMIN";
  if (!admin && x.vendedorId !== actorId) return { error: "Solo puedes asignarte prospectos a ti mismo." };

  try {
    await prisma.$transaction(async (tx) => {
      const vendedor = await tx.usuario.findFirst({
        where: { id: x.vendedorId, estado: "ACTIVO", rol: { in: ROLES_COMERCIAL } },
        select: { id: true },
      });
      if (!vendedor) throw new Error("El responsable comercial no está disponible.");
      const cliente = await tx.cliente.create({
        data: {
          razonSocial: x.razonSocial,
          documento: x.documento || null,
          telefono: x.telefono || null,
          correo: x.correo || null,
          estado: true,
          estadoRelacionComercial: "PROSPECTO",
        },
        select: { id: true },
      });
      await tx.oportunidadComercial.create({
        data: {
          titulo: x.titulo,
          clienteId: cliente.id,
          vendedorId: x.vendedorId,
          etapa: "PROSPECTO",
          descripcion: [
            x.personaContacto ? `Persona de referencia: ${x.personaContacto}` : "",
            x.descripcion,
          ].filter(Boolean).join("\n") || null,
          historial: { create: { usuarioId: actorId, etapaNueva: "PROSPECTO", comentario: "Prospecto registrado. Primer contacto pendiente." } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ya existe un registro con ese DNI/RUC. Utiliza Nueva oportunidad para ese cliente." };
    }
    return { error: error instanceof Error && error.message === "El responsable comercial no está disponible." ? error.message : "No se pudo registrar el prospecto." };
  }
  revalidatePath("/dashboard/ventas/crm");
  revalidatePath("/dashboard/clientes");
  return { ok: "Prospecto y primera oportunidad registrados. Ya puedes programar el primer contacto." };
}
