"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_GESTION, ROLES_RECEPCION } from "@/lib/compras-roles";
import { Prisma } from "@/generated/prisma/client";
const itemSchema=z.object({productoId:z.number().int().positive(),cantidad:z.number().int().positive().max(1000000),precioUnitario:z.string().regex(/^\d{1,9}(\.\d{1,2})?$/),numeroLote:z.string().trim().min(1).max(90),fechaVencimiento:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)});
const schema=z.object({proveedorId:z.number().int().positive(),items:z.array(itemSchema).min(1).max(100)});
export type EstadoCompra={ok?:string;error?:string}|undefined;
function dateUTC(s:string){const date=new Date(`${s}T12:00:00.000Z`);if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==s)throw new Error("Fecha de vencimiento inválida");return date;}
export async function crearCompra(_prev:EstadoCompra,form:FormData):Promise<EstadoCompra>{
 await exigirRol(ROLES_COMPRAS_GESTION);
 let payload:unknown;
 try{payload=JSON.parse(String(form.get("payload")??""));}catch{return {error:"Solicitud inválida"};}
 const parsed=schema.safeParse(payload);
 if(!parsed.success)return {error:parsed.error.issues[0]?.message??"Compra inválida"};
 const {proveedorId,items}=parsed.data;
 if(new Set(items.map(i=>`${i.productoId}::${i.numeroLote.trim()}`)).size!==items.length)return {error:"No repitas producto y lote dentro de la misma compra"};
 try{
  const total=items.reduce((acc,i)=>acc.plus(new Prisma.Decimal(i.precioUnitario).mul(i.cantidad)),new Prisma.Decimal(0));
  await prisma.$transaction(async tx=>{
   const proveedor=await tx.proveedor.findFirst({where:{id:proveedorId,estado:true}});
   if(!proveedor)throw new Error("Selecciona un proveedor activo");
   const productos=await tx.producto.findMany({where:{id:{in:items.map(i=>i.productoId)},estado:true},select:{id:true}});
   if(new Set(productos.map(p=>p.id)).size!==new Set(items.map(i=>i.productoId)).size)throw new Error("Hay productos inexistentes o inactivos");
   const compra=await tx.compra.create({data:{proveedorId,importeTotal:total,estado:"PENDIENTE"}});
   await tx.detalleCompra.createMany({data:items.map(i=>({compraId:compra.id,productoId:i.productoId,cantidad:i.cantidad,precioUnitario:new Prisma.Decimal(i.precioUnitario),numeroLote:i.numeroLote.trim(),fechaVencimiento:dateUTC(i.fechaVencimiento)}))});
  });
 }catch(e){return {error:e instanceof Error?e.message:"No se pudo guardar la compra"};}
 revalidatePath("/dashboard/compras");return {ok:"Compra registrada. Las existencias se actualizarán al confirmar la recepción."};
}
export async function recibirCompra(form:FormData){
 const responsable=await exigirRol(ROLES_RECEPCION);
 const usuarioId=Number(responsable.id);
 if(!Number.isSafeInteger(usuarioId)||usuarioId<=0)throw new Error("Responsable inválido");
 const compraId=Number(form.get("compraId"));
 if(!Number.isSafeInteger(compraId)||compraId<=0)throw new Error("Compra inválida");
 await prisma.$transaction(async tx=>{
  // Actualización condicional impide recibir dos veces una misma compra.
  const marcada=await tx.compra.updateMany({where:{id:compraId,estado:"PENDIENTE"},data:{estado:"RECIBIDO"}});
  if(marcada.count!==1)throw new Error("La compra ya fue recibida o no está pendiente");
  const detalles=await tx.detalleCompra.findMany({where:{compraId},orderBy:{id:"asc"}});
  if(!detalles.length)throw new Error("La compra no tiene detalles");
  for(const d of detalles){
   const producto=await tx.producto.findFirst({where:{id:d.productoId,estado:true},select:{id:true}});
   if(!producto)throw new Error("Producto inexistente o inactivo durante la recepción");
   const previo=await tx.lote.findUnique({where:{numeroLote_productoId:{numeroLote:d.numeroLote,productoId:d.productoId}}});
   if(previo && previo.fechaVencimiento.getTime()!==d.fechaVencimiento.getTime())throw new Error(`El lote ${d.numeroLote} ya existe con otro vencimiento`);
   const lote=await tx.lote.upsert({where:{numeroLote_productoId:{numeroLote:d.numeroLote,productoId:d.productoId}},create:{numeroLote:d.numeroLote,productoId:d.productoId,cantidadInicial:d.cantidad,cantidadDisponible:d.cantidad,fechaVencimiento:d.fechaVencimiento},update:{cantidadInicial:{increment:d.cantidad},cantidadDisponible:{increment:d.cantidad}}});
   await tx.producto.update({where:{id:d.productoId},data:{stockActual:{increment:d.cantidad}}});
   await tx.movimientoInventario.create({data:{productoId:d.productoId,loteId:lote.id,usuarioId,tipo:"ENTRADA_COMPRA",cantidad:d.cantidad,motivo:`Recepción de compra #${compraId}`}});
  }
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:15000});
 revalidatePath("/dashboard/compras");revalidatePath("/dashboard/lotes");revalidatePath("/dashboard/inventario");revalidatePath("/dashboard/inventario/movimientos");revalidatePath("/dashboard");
}
