"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_GESTION } from "@/lib/compras-roles";
const schema = z.object({
  razonSocial: z.string().trim().min(3).max(180),

  ruc: z.string()
    .trim()
    .regex(/^\d{11}$/, "El RUC debe contener 11 dígitos"),

  contacto: z.string().trim().max(120),

  telefono: z.string().trim().max(30),

  correo: z.string()
    .trim()
    .max(254, "El correo no puede superar los 254 caracteres")
    .refine(
      (correo) =>
        correo === "" ||
        z.email().safeParse(correo).success,
      "El correo electrónico no es válido"
    ),

  direccion: z.string().trim().max(300),
});
export type EstadoProveedor = { error?: string; ok?: string } | undefined;
export async function guardarProveedor(
  _estado: EstadoProveedor,
  form: FormData
): Promise<EstadoProveedor> {
  await exigirRol(ROLES_COMPRAS_GESTION);

  const parsed = schema.safeParse(
    Object.fromEntries(
      [
        "razonSocial",
        "ruc",
        "contacto",
        "telefono",
        "correo",
        "direccion",
      ].map((k) => [
        k,
        String(form.get(k) ?? ""),
      ])
    )
  );

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Datos inválidos",
    };
  }

  // Validación estricta del identificador.
  const rawId = String(form.get("id") ?? "").trim();

  let id: number | null = null;

  if (rawId !== "") {
    if (!/^[1-9]\d*$/.test(rawId)) {
      return { error: "Identificador inválido" };
    }

    const parsedId = Number(rawId);

    if (!Number.isSafeInteger(parsedId)) {
      return { error: "Identificador inválido" };
    }

    id = parsedId;
  }

  const d = parsed.data;

  const data = {
    ...d,
    contacto: d.contacto || null,
    telefono: d.telefono || null,
    correo: d.correo || null,
    direccion: d.direccion || null,
  };

  try {
    if (id !== null) {
      await prisma.proveedor.update({
        where: { id },
        data,
      });
    } else {
      await prisma.proveedor.create({
        data,
      });
    }
  } catch (error) {
    const codigo =
      typeof error === "object" &&
        error !== null &&
        "code" in error
        ? error.code
        : undefined;

    if (codigo === "P2002") {
      return {
        error: "Ya existe un proveedor registrado con ese RUC.",
      };
    }

    if (codigo === "P2025") {
      return {
        error: "El proveedor que intentas actualizar ya no existe.",
      };
    }

    console.error("Error al guardar proveedor:", error);

    return {
      error: "No se pudo guardar el proveedor. Verifica los datos e intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard/proveedores");

  return {
    ok:
      id !== null
        ? "Proveedor actualizado"
        : "Proveedor registrado",
  };
}
export async function cambiarEstadoProveedor(
  form: FormData
) {
  await exigirRol(ROLES_COMPRAS_GESTION);

  const rawId = String(form.get("id") ?? "").trim();

  if (!/^[1-9]\d*$/.test(rawId)) return;

  const id = Number(rawId);

  if (!Number.isSafeInteger(id)) return;

  const accion = String(form.get("accion") ?? "");

  if (
    accion !== "ACTIVAR" &&
    accion !== "DESACTIVAR"
  ) {
    return;
  }

  const nuevoEstado = accion === "ACTIVAR";

  await prisma.proveedor.updateMany({
    where: {
      id,
      estado: !nuevoEstado,
    },
    data: {
      estado: nuevoEstado,
    },
  });

  revalidatePath("/dashboard/proveedores");
}
