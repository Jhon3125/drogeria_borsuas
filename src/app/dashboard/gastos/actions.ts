"use server";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MetodoPago } from "@/generated/prisma/enums";

export async function registrarGasto(data: FormData) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  const tipoGasto = String(data.get("tipoGasto") ?? "").trim();
  const descripcion = String(data.get("descripcion") ?? "").trim();
  const montoRaw = String(data.get("monto") ?? "").trim();
  const metodo = String(data.get("medioPago") ?? "");
  if (!tipoGasto || tipoGasto.length > 90 || descripcion.length > 400) throw new Error("Categoría o descripción inválida.");
  if (!/^(?:\d{1,9})(?:\.\d{1,2})?$/.test(montoRaw) || Number(montoRaw) <= 0) throw new Error("Monto inválido.");
  if (!["EFECTIVO", "TRANSFERENCIA", "TARJETA"].includes(metodo)) throw new Error("Método inválido.");
  await prisma.gasto.create({data: {tipoGasto, descripcion: descripcion || null, monto: montoRaw, medioPago: metodo as MetodoPago, responsableId: Number(usuario.id)}});
  revalidatePath("/dashboard/gastos");
  redirect("/dashboard/gastos?ok=registrado");
}
