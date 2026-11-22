import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
export default async function AlertasPage(){
 await exigirRol(["SUPER_ADMIN","ADMIN"]);
 const config=await prisma.configuracionSistema.findUnique({where:{id:1}});
 const dias=config?.diasAlertaVencimiento??90;
 const ahora=new Date();const limite=new Date(ahora.getTime()+dias*86400000);
 const [lotes,productos,despachos]=await Promise.all([
 prisma.lote.findMany({where:{cantidadDisponible:{gt:0},fechaVencimiento:{lte:limite}},orderBy:{fechaVencimiento:"asc"},take:150,include:{producto:{select:{nombre:true}}}}),
 prisma.producto.findMany({where:{estado:true},select:{id:true,nombre:true,stockActual:true,stockMinimo:true},take:500}),
 prisma.despacho.count({where:{estado:"REPROGRAMADO",salidaInventarioEn:{not:null},devolucionInventarioEn:null}}),
 ]);
 const bajo=productos.filter(p=>p.stockActual<=p.stockMinimo);
 return <main className="mx-auto max-w-6xl space-y-5"><header><p className="text-sm text-slate-500">Gestión / Seguimiento</p><h1 className="text-3xl font-bold text-[#123E70]">Alertas</h1><p className="text-slate-500">Datos reales de inventario, vencimiento y devoluciones pendientes. Ventana: {dias} días.</p></header>
 <div className="grid gap-3 sm:grid-cols-3">{[["Lotes por vencer o vencidos",lotes.length],["Productos bajo mínimo",bajo.length],["Devoluciones por recibir",despachos]].map(([t,n])=><div key={String(t)} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{t}</p><p className="text-3xl font-bold">{n}</p></div>)}</div>
 <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 text-lg font-bold">Vencimientos</h2>{lotes.map(l=><p key={l.id} className="border-b py-2 text-sm">{l.fechaVencimiento<ahora?"🔴 Vencido":"🟠 Por vencer"} · {l.producto.nombre} · Lote {l.numeroLote} · {l.cantidadDisponible} unidades · {l.fechaVencimiento.toLocaleDateString("es-PE",{timeZone:"UTC"})}</p>)}{!lotes.length&&<p className="text-sm text-slate-500">Sin alertas de vencimiento.</p>}</section>
 <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 text-lg font-bold">Stock bajo</h2>{bajo.map(p=><p key={p.id} className="border-b py-2 text-sm">{p.nombre} · Stock {p.stockActual} / mínimo {p.stockMinimo}</p>)}{!bajo.length&&<p className="text-sm text-slate-500">Sin productos bajo mínimo.</p>}</section><Link className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#087EBD]" href="/dashboard/logistica/despachos">Revisar despachos y devoluciones <span aria-hidden="true">→</span></Link></main>
}
