"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

const clienteSchema = z.object({
  razonSocial: z.string().trim().min(2).max(180),
  documento: z.string().regex(/^(?:\d{8}|\d{11})$/, "Documento: DNI de 8 o RUC de 11 dígitos"),
  telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""), z.email()]),
  direccion: z.string().trim().max(300),
});
export type EstadoCliente = { error?: string; ok?: string } | undefined;
export async function guardarCliente(_: EstadoCliente, form: FormData): Promise<EstadoCliente> {
  await exigirRol(ROLES_COMERCIAL);
  const parsed = clienteSchema.safeParse(Object.fromEntries(["razonSocial","documento","telefono","correo","direccion"].map(k=>[k,String(form.get(k)??"")])));
  if (!parsed.success) return {error: parsed.error.issues[0]?.message || "Cliente inválido"};
  const id = Number(form.get("id") || 0);
  if (!Number.isSafeInteger(id) || id < 0) return {error:"Identificador inválido"};
  const x=parsed.data;
  try {
    const data = {...x, telefono:x.telefono||null, correo:x.correo||null, direccion:x.direccion||null};
    if (id) await prisma.cliente.update({where:{id},data});
    else await prisma.cliente.create({data});
  } catch { return {error:"No se pudo guardar. Verifica que el DNI o RUC no esté registrado."}; }
  revalidatePath("/dashboard/clientes");
  return {ok:id?"Cliente actualizado":"Cliente registrado"};
}
export async function alternarCliente(form: FormData) {
  await exigirRol(ROLES_COMERCIAL);
  const id=Number(form.get("id"));
  if(!Number.isSafeInteger(id)||id<=0)return;
  const cliente=await prisma.cliente.findUnique({where:{id},select:{estado:true}});
  if(!cliente)return;
  await prisma.cliente.update({where:{id},data:{estado:!cliente.estado}});
  revalidatePath("/dashboard/clientes");
}
