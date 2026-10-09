import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {exigirRol} from "@/lib/guard";
import {ROLES_COMERCIAL} from "@/lib/comercial-roles";
import {CotizacionForm} from "./form";
export default async function CotizacionesPage(){
 await exigirRol(ROLES_COMERCIAL);
 const [clientes,productos,cotizaciones]=await Promise.all([
   prisma.cliente.findMany({where:{estado:true},select:{id:true,razonSocial:true},orderBy:{razonSocial:"asc"}}),
   prisma.producto.findMany({where:{estado:true,moneda:"PEN"},select:{id:true,codigo:true,nombre:true,precioVenta:true},orderBy:{nombre:"asc"}}),
   prisma.venta.findMany({where:{etapa:"COTIZACION"},orderBy:{fecha:"desc"},take:50,include:{cliente:{select:{razonSocial:true}},detalles:{include:{producto:{select:{nombre:true}}}}}}),
 ]);
 return <div className="space-y-6"><header><h1 className="text-3xl font-bold text-[#123E70]">Cotizaciones</h1><p className="text-slate-600">Propuestas comerciales vinculadas con clientes y productos.</p></header>
 {clientes.length===0&&<p className="rounded-lg border bg-amber-50 p-4">Registra primero un cliente en <Link href="/dashboard/clientes" className="underline">Clientes</Link>.</p>}
 <CotizacionForm clientes={clientes} productos={productos.map(p=>({...p,precioVenta:p.precioVenta.toFixed(2)}))}/>
 <section className="space-y-3"><h2 className="text-xl font-bold">Cotizaciones recientes</h2>{cotizaciones.map(c=><article key={c.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">COT-{String(c.id).padStart(5,"0")} · {c.cliente.razonSocial}</h3><p className="text-sm text-slate-500">{c.fecha.toLocaleDateString("es-PE")} · Cotización</p></div><div className="flex items-center gap-3"><b className="text-[#123E70]">S/ {c.importeTotal.toFixed(2)}</b><a href={`/dashboard/cotizaciones/${c.id}/pdf`} className="rounded-lg border border-[#123E70] px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-blue-50">Descargar PDF</a></div></div><ul className="mt-3 space-y-1 text-sm text-slate-600">{c.detalles.map(d=><li key={d.id}>{d.producto.nombre} · {d.cantidad} × S/ {d.precioUnitario.toFixed(2)}</li>)}</ul></article>)}{cotizaciones.length===0&&<div className="rounded-lg border bg-white p-8 text-center text-slate-500">Todavía no hay cotizaciones.</div>}</section>
 </div>;
}
