"use server";
import { exigirRol } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function guardarConfiguracion(data: FormData) {
 await exigirRol(["SUPER_ADMIN", "ADMIN"]);
 const dias = Number(data.get("diasAlertaVencimiento"));
 if (!Number.isInteger(dias) || dias < 1 || dias > 365) throw new Error("El rango permitido es de 1 a 365 días.");
 await prisma.configuracionSistema.upsert({where:{id:1},create:{id:1,diasAlertaVencimiento:dias},update:{diasAlertaVencimiento:dias}});
 revalidatePath("/dashboard/alertas"); revalidatePath("/dashboard/configuracion");
 redirect("/dashboard/configuracion?ok=guardado");
}
