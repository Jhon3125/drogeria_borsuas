import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
export default async function TrazabilidadPage(){
 await exigirRol(["SUPER_ADMIN","ADMIN"]);
 const [movimientos,estados,pagos]=await Promise.all([
 prisma.movimientoInventario.findMany({take:100,orderBy:{fecha:"desc"},include:{producto:{select:{nombre:true}},lote:{select:{numeroLote:true}},usuario:{select:{nombre:true}}}}),
 prisma.historialDespacho.findMany({take:60,orderBy:{fecha:"desc"},include:{usuario:{select:{nombre:true}}}}),
 prisma.pago.findMany({take:60,orderBy:{fecha:"desc"},include:{registradoPor:{select:{nombre:true}}}}),
 ]);
 return <main className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm text-slate-500">Gestión / Auditoría</p><h1 className="text-3xl font-bold text-[#123E70]">Historial y trazabilidad</h1><p className="text-slate-500">Registros persistentes: movimientos de stock, estados logísticos y pagos.</p></header>
 <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-bold">Inventario · últimos 100</h2>{movimientos.map(m=><p className="border-b py-2 text-sm" key={m.id}>{m.fecha.toLocaleString("es-PE",{timeZone:"America/Lima"})} · {m.tipo.replaceAll("_"," ")} · {m.producto.nombre} · lote {m.lote?.numeroLote??"—"} · {m.cantidad} uds. · {m.usuario?.nombre??"Sistema"} · {m.motivo??""}</p>)}</section>
 <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-bold">Despachos · últimos 60 cambios</h2>{estados.map(h=><p className="border-b py-2 text-sm" key={h.id}>{h.fecha.toLocaleString("es-PE",{timeZone:"America/Lima"})} · Despacho #{h.despachoId} · {h.estadoAnterior} → {h.estadoNuevo} · {h.usuario.nombre}</p>)}</section>
 <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-bold">Pagos · últimos 60</h2>{pagos.map(p=><p className="border-b py-2 text-sm" key={p.id}>{p.fecha.toLocaleString("es-PE",{timeZone:"America/Lima"})} · Venta #{p.ventaId} · {p.metodoPago} · {p.monto.toFixed(2)} · {p.registradoPor?.nombre??"No registrado"}</p>)}</section><Link href="/dashboard/logistica/movimientos" className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#087EBD]">Ver salidas y devoluciones por despacho <span aria-hidden="true">→</span></Link></main>
}
