"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_GESTION } from "@/lib/compras-roles";
const schema = z.object({
  razonSocial: z.string().trim().min(3).max(180),
  ruc: z.string().regex(/^\d{11}$/, "El RUC debe contener 11 dígitos"),
  contacto: z.string().trim().max(120), telefono: z.string().trim().max(30),
  correo: z.union([z.literal(""),z.email()]), direccion: z.string().trim().max(300),
});
export type EstadoProveedor = {error?: string; ok?: string} | undefined;
export async function guardarProveedor(_estado: EstadoProveedor, form: FormData): Promise<EstadoProveedor> {
  await exigirRol(ROLES_COMPRAS_GESTION);
  const parsed = schema.safeParse(Object.fromEntries(["razonSocial","ruc","contacto","telefono","correo","direccion"].map(k => [k,String(form.get(k)??"")])));
  if (!parsed.success) return {error:parsed.error.issues[0]?.message ?? "Datos inválidos"};
  const id = Number(form.get("id") || 0);
  if (id && (!Number.isSafeInteger(id) || id < 1)) return {error:"Identificador inválido"};
  const d=parsed.data;
  try {
    const data={...d,contacto:d.contacto||null,telefono:d.telefono||null,correo:d.correo||null,direccion:d.direccion||null};
    if(id){await prisma.proveedor.update({where:{id},data});}
    else {await prisma.proveedor.create({data});}
  }catch{return {error:"No se guardó el proveedor. Comprueba que el RUC no esté registrado."};}
  revalidatePath("/dashboard/proveedores");
  return {ok:id?"Proveedor actualizado":"Proveedor registrado"};
}
export async function cambiarEstadoProveedor(form: FormData) {
  await exigirRol(ROLES_COMPRAS_GESTION);
  const id=Number(form.get("id"));
  if(!Number.isSafeInteger(id)||id<=0)return;
  const actual=await prisma.proveedor.findUnique({where:{id},select:{estado:true}});
  if(!actual)return;
  await prisma.proveedor.update({where:{id},data:{estado:!actual.estado}});
  revalidatePath("/dashboard/proveedores");
}
