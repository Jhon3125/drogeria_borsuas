"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
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

const clienteSchema = z.object({
  oportunidadId: id,
  razonSocial: z.string().trim().min(2).max(180),
  documento: z.string().trim().regex(/^(?:[0-9]{8}|[0-9]{11})$/, "Ingresa un DNI de 8 dígitos o RUC de 11 dígitos."),
  telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""), z.string().trim().email()]),
  direccion: z.string().trim().max(300),
}).refine((x) => Boolean(x.telefono || x.correo), {
  message: "Indica al menos un teléfono o correo para completar la ficha comercial.",
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

function datosCompletos(cliente: {
  razonSocial: string;
  documento: string | null;
  telefono: string | null;
  correo: string | null;
}) {
  return cliente.razonSocial.trim().length >= 2 &&
    /^(?:\d{8}|\d{11})$/.test((cliente.documento ?? "").trim()) &&
    Boolean(cliente.telefono?.trim() || cliente.correo?.trim());
}

export async function completarDatosProspecto(
  _prev: RespuestaProspecto,
  form: FormData,
): Promise<RespuestaProspecto> {
  const u = await actor();
  const valid = clienteSchema.safeParse({
    oportunidadId: form.get("oportunidadId"),
    razonSocial: form.get("razonSocial") ?? "",
    documento: form.get("documento") ?? "",
    telefono: form.get("telefono") ?? "",
    correo: form.get("correo") ?? "",
    direccion: form.get("direccion") ?? "",
  });
  if (!valid.success) return { error: valid.error.issues[0]?.message ?? "Datos inválidos." };
  const x = valid.data;

  try {
    const clienteId = await prisma.$transaction(async (tx) => {
      const oportunidad = await tx.oportunidadComercial.findUnique({
        where: { id: x.oportunidadId },
        select: { clienteId: true, vendedorId: true, etapa: true },
      });
      if (!oportunidad) throw new Error("Oportunidad no encontrada.");
      if (!u.admin && oportunidad.vendedorId !== u.id) throw new Error("No tienes permisos para esta oportunidad.");
      if (oportunidad.etapa !== "PROSPECTO") throw new Error("Solo se completan datos de prospectos abiertos.");

      const duplicado = await tx.cliente.findFirst({
        where: { documento: x.documento, id: { not: oportunidad.clienteId } },
        select: { id: true },
      });
      if (duplicado) throw new Error("El documento ya corresponde a otro cliente.");

      await tx.cliente.update({
        where: { id: oportunidad.clienteId },
        data: {
          razonSocial: x.razonSocial,
          documento: x.documento,
          telefono: x.telefono || null,
          correo: x.correo || null,
          direccion: x.direccion || null,
        },
      });
      return oportunidad.clienteId;
    });
    vistas(clienteId);
    return { ok: "Datos comerciales actualizados. Ahora registra el contacto." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "El documento ya corresponde a otro cliente." };
    }
    const mensaje = error instanceof Error ? error.message : "";
    const conocidos = [
      "Oportunidad no encontrada.",
      "No tienes permisos para esta oportunidad.",
      "Solo se completan datos de prospectos abiertos.",
      "El documento ya corresponde a otro cliente.",
    ];
    return { error: conocidos.includes(mensaje) ? mensaje : "No se pudieron guardar los datos." };
  }
}

export async function registrarActividadProspecto(
  _prev: RespuestaProspecto,
  form: FormData,
): Promise<RespuestaProspecto> {
  const u = await actor();
  const parsed = contactoSchema.safeParse({
    oportunidadId: form.get("oportunidadId"),
    tipo: form.get("tipo"),
    resultado: form.get("resultado"),
    personaContacto: form.get("personaContacto") ?? "",
    observaciones: form.get("observaciones") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const x = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const oportunidad = await tx.oportunidadComercial.findUnique({
        where: { id: x.oportunidadId },
        include: { cliente: true },
      });
      if (!oportunidad) throw new Error("Oportunidad no encontrada.");
      if (!u.admin && oportunidad.vendedorId !== u.id) throw new Error("No tienes permisos para esta oportunidad.");
      if (["GANADA", "PERDIDA"].includes(oportunidad.etapa)) throw new Error("La oportunidad ya está cerrada.");
      if (!oportunidad.cliente.estado) throw new Error("El cliente está inactivo.");

      const primerContactoEfectivo = oportunidad.etapa === "PROSPECTO" && x.resultado === "CONTACTO_EFECTIVO";
      if (primerContactoEfectivo && oportunidad.cliente.estadoRelacionComercial !== "CALIFICADO" &&
          !datosCompletos(oportunidad.cliente)) {
        throw new Error("Completa el DNI/RUC y al menos un teléfono o correo antes de registrar el contacto efectivo.");
      }

      await tx.actividadComercial.create({
        data: {
          oportunidadId: x.oportunidadId,
          usuarioId: u.id,
          tipo: x.tipo,
          resultado: x.resultado,
          personaContacto: x.personaContacto || null,
          observaciones: x.observaciones,
        },
      });

      if (primerContactoEfectivo) {
        if (oportunidad.cliente.estadoRelacionComercial !== "CALIFICADO") {
          await tx.cliente.update({
            where: { id: oportunidad.clienteId },
            data: { estadoRelacionComercial: "CALIFICADO", fechaCalificacion: new Date() },
          });
        }

        const cambio = await tx.oportunidadComercial.updateMany({
          where: { id: oportunidad.id, etapa: "PROSPECTO" },
          data: { etapa: "CONTACTADO" },
        });
        if (cambio.count !== 1) throw new Error("La etapa cambió. Actualiza el tablero.");
        await tx.historialOportunidad.create({
          data: {
            oportunidadId: oportunidad.id,
            usuarioId: u.id,
            etapaAnterior: "PROSPECTO",
            etapaNueva: "CONTACTADO",
            comentario: oportunidad.cliente.estadoRelacionComercial === "CALIFICADO"
              ? "Contacto efectivo registrado. Cliente ya calificado; oportunidad avanzada a Contactado."
              : "Contacto efectivo registrado. Cliente calificado automáticamente y oportunidad avanzada a Contactado.",
          },
        });
      }
      return {
        clienteId: oportunidad.clienteId,
        avanzado: primerContactoEfectivo,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    vistas(resultado.clienteId);
    return { ok: resultado.avanzado
      ? "Contacto efectivo registrado. Cliente calificado y oportunidad movida a Contactado."
      : "Actividad registrada. La etapa de la oportunidad se mantiene." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "Otro usuario actualizó la oportunidad. Actualiza el tablero e inténtalo nuevamente." };
    }
    const mensaje = error instanceof Error ? error.message : "";
    const conocidos = [
      "Oportunidad no encontrada.",
      "No tienes permisos para esta oportunidad.",
      "La oportunidad ya está cerrada.",
      "El cliente está inactivo.",
      "Completa el DNI/RUC y al menos un teléfono o correo antes de registrar el contacto efectivo.",
      "La etapa cambió. Actualiza el tablero.",
    ];
    return { error: conocidos.includes(mensaje) ? mensaje : "No se pudo registrar la actividad." };
  }
}
