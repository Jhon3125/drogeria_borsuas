import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {exigirRol} from "@/lib/guard";
import {ROLES_COMPRAS_LECTURA,ROLES_COMPRAS_GESTION,ROLES_RECEPCION} from "@/lib/compras-roles";
import {CompraForm} from "./form";
import {recibirCompra} from "./actions";
export default async function ComprasPage(){
 const user=await exigirRol(ROLES_COMPRAS_LECTURA);
 const [proveedores,productos,compras]=await Promise.all([
  prisma.proveedor.findMany({where:{estado:true},select:{id:true,razonSocial:true},orderBy:{razonSocial:"asc"}}),
  prisma.producto.findMany({where:{estado:true},select:{id:true,nombre:true,codigo:true},orderBy:{nombre:"asc"}}),
  prisma.compra.findMany({take:60,orderBy:{fecha:"desc"},include:{proveedor:true,detalles:{include:{producto:{select:{nombre:true,codigo:true}}}}}})
 ]);
 return <main className="space-y-6 p-6"><h1 className="text-3xl font-bold text-[#123E70]">Compras y recepción</h1><div className="flex flex-wrap gap-4 text-sm"><Link className="font-medium text-[#123E70] underline" href="/dashboard/inventario/conciliacion">Conciliar inventario y lotes</Link><Link className="font-medium text-[#123E70] underline" href="/dashboard/inventario/movimientos">Historial de movimientos</Link></div>
 {ROLES_COMPRAS_GESTION.includes(user.rol)&&<CompraForm proveedores={proveedores} productos={productos}/>}
 <section className="space-y-4"><h2 className="text-xl font-bold">Compras recientes</h2>{compras.length===0&&<p>Aún no hay compras registradas.</p>}{compras.map(c=><article key={c.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold">Compra #{c.id} — {c.proveedor.razonSocial}</h3><p className="text-xs text-slate-500">{c.fecha.toLocaleDateString("es-PE",{timeZone:"America/Lima"})} · {c.estado}</p></div><div className="text-right"><p className="font-bold">S/ {c.importeTotal.toFixed(2)}</p>{c.estado==="PENDIENTE"&&ROLES_RECEPCION.includes(user.rol)&&<form action={recibirCompra}><input type="hidden" name="compraId" value={c.id}/><button className="mt-1 rounded-lg bg-[#238B55] px-3 py-2 text-xs font-semibold text-white">Confirmar recepción</button></form>}</div></div><div className="mt-3 space-y-1 text-sm text-slate-600">{c.detalles.map(d=><p key={d.id}>{d.producto.codigo} · {d.producto.nombre} · {d.cantidad} uds. · Lote {d.numeroLote} · Vence {d.fechaVencimiento.toLocaleDateString("es-PE",{timeZone:"UTC"})}</p>)}</div></article>)}</section>
 </main>
}
