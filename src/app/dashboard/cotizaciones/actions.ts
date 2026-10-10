"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

const schema = z.object({
  clienteId: z.number().int().positive(),
  descuento: z.number().finite().min(0).max(99999999),
  items: z.array(z.object({productoId:z.number().int().positive(),cantidad:z.number().int().positive().max(1000000),precioUnitario:z.number().finite().min(0).max(99999999)})).min(1).max(50),
});
export type EstadoCotizacion={ok?:string;error?:string}|undefined;
const aCentavos=(n:number)=>Math.round((n+Number.EPSILON)*100);
export async function crearCotizacion(_:EstadoCotizacion,form:FormData):Promise<EstadoCotizacion>{
 const usuario=await exigirRol(ROLES_COMERCIAL);
 let payload:unknown;
 try {payload=JSON.parse(String(form.get("payload")??""));} catch{return {error:"Formulario inválido"};}
 const valid=schema.safeParse(payload);
 if(!valid.success)return {error:valid.error.issues[0]?.message??"Datos inválidos"};
 const {clienteId,items,descuento}=valid.data;
 const ids=items.map(x=>x.productoId);
 if(new Set(ids).size!==ids.length)return {error:"Cada producto debe aparecer una sola vez"};
 const [cliente,productos]=await Promise.all([
   prisma.cliente.findFirst({where:{id:clienteId,estado:true},select:{id:true}}),
   prisma.producto.findMany({where:{id:{in:ids},estado:true},select:{id:true,moneda:true}}),
 ]);
 if(!cliente || productos.length!==ids.length)return {error:"Cliente o producto inactivo/inexistente"};
 // El modelo de Venta no tiene moneda; por seguridad este primer incremento solo cotiza PEN.
 if(productos.some(p=>p.moneda!=="PEN"))return {error:"Por ahora solo se admiten productos en soles (PEN)"};
 const subtotalCent=items.reduce((sum,x)=>sum+aCentavos(x.precioUnitario)*x.cantidad,0);
 const descuentoCent=aCentavos(descuento);
 if(!Number.isSafeInteger(subtotalCent)||subtotalCent>9999999999)return {error:"Importe demasiado alto"};
 if(descuentoCent>subtotalCent)return {error:"El descuento supera al subtotal"};
 try {
   await prisma.venta.create({data:{
     clienteId,vendedorId:Number(usuario.id),etapa:"COTIZACION",subtotal:(subtotalCent/100).toFixed(2),
     descuento:(descuentoCent/100).toFixed(2),importeTotal:((subtotalCent-descuentoCent)/100).toFixed(2),
     detalles:{create:items.map(x=>({productoId:x.productoId,cantidad:x.cantidad,precioUnitario:(aCentavos(x.precioUnitario)/100).toFixed(2),descuento:"0.00"}))},
   }});
 }catch{return {error:"No se pudo guardar la cotización. Revisa los datos e intenta nuevamente."};}
 revalidatePath("/dashboard/cotizaciones");revalidatePath("/dashboard/ventas");
 return {ok:"Cotización registrada. No se descontó inventario."};
}
