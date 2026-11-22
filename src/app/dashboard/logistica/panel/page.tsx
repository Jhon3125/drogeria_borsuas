import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

export default async function PanelLogistico() {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"]);
  const conductor = usuario.rol === "CONDUCTOR";
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const fechaInicio = new Date(`${hoy}T00:00:00.000Z`);
  const fechaFin = new Date(fechaInicio.getTime() + 86400000);
  const filtro = conductor ? { hojaRuta: { conductorId: Number(usuario.id) } } : {};
  const filtroHoy = conductor ? { hojaRuta: { conductorId: Number(usuario.id), fecha: { gte: fechaInicio, lt: fechaFin } } } : { hojaRuta: { fecha: { gte: fechaInicio, lt: fechaFin } } };
  const [hoyDespachos, pendientes, enRuta, entregados, reprogramados, vehiculos, conductores] = await Promise.all([
    prisma.despacho.findMany({ where: filtroHoy, include: { venta: { include: { cliente: { select: { razonSocial: true } } } }, hojaRuta: { include: { conductor: { select: { nombre: true } }, vehiculo: { select: { placa: true } } } } }, orderBy: { id: "desc" }, take: 80 }),
    prisma.despacho.count({ where: { ...filtro, estado: "PENDIENTE" } }),
    prisma.despacho.count({ where: { ...filtro, estado: "EN_RUTA" } }),
    prisma.despacho.count({ where: { ...filtro, estado: "ENTREGADO", entregadoEn: { gte: new Date(`${hoy}T05:00:00Z`), lt: new Date(new Date(`${hoy}T05:00:00Z`).getTime() + 86400000) } } }),
    prisma.despacho.count({ where: { ...filtro, estado: "REPROGRAMADO" } }),
    conductor ? Promise.resolve(0) : prisma.vehiculo.count({ where: { estado: true } }),
    conductor ? Promise.resolve(0) : prisma.usuario.count({ where: { rol: "CONDUCTOR", estado: "ACTIVO" } }),
  ]);
  const resumen = [["Pendientes", pendientes], ["En ruta", enRuta], ["Entregados hoy", entregados], ["Reprogramados", reprogramados], ["Vehículos disponibles", vehiculos], ["Conductores activos", conductores]];
  return <main className="mx-auto max-w-6xl space-y-6 pb-10">
    <header><p className="text-sm text-slate-500">Logística / Seguimiento</p><h1 className="text-3xl font-bold text-[#123E70]">Panel logístico</h1><p className="text-sm text-slate-500">Situación operativa de las entregas y recursos registrados.</p></header>
    <div className="flex flex-wrap gap-3"><Link className="rounded-lg bg-[#123E70] px-4 py-2 text-sm text-white" href="/dashboard/logistica/despachos">Ver despachos</Link><Link className="rounded-lg border bg-white px-4 py-2 text-sm" href="/dashboard/logistica/movimientos">Ver movimientos por lote</Link></div>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{resumen.filter((_, i) => !conductor || i < 4).map(([nombre, cantidad]) => <article key={nombre} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{nombre}</p><p className="mt-2 text-3xl font-bold text-[#123E70]">{cantidad}</p></article>)}</section>
    <section className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-lg font-bold">Rutas programadas hoy ({hoyDespachos.length})</h2><div className="space-y-3">{hoyDespachos.map(d => <div key={d.id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"><div><strong>Despacho #{d.id} · Venta #{d.ventaId}</strong><p>{d.venta.cliente.razonSocial} · {d.hojaRuta ? `${d.hojaRuta.conductor.nombre} · ${d.hojaRuta.vehiculo.placa}` : "Sin ruta asignada"}</p></div><div className="font-semibold">{d.estado.replaceAll("_", " ")}</div></div>)}{!hoyDespachos.length && <p className="text-sm text-slate-500">Sin rutas programadas para hoy.</p>}</div></section>
    <p className="text-xs text-slate-500">Pendientes, en ruta y reprogramados muestran el total histórico abierto; entregados muestra los confirmados hoy en horario de Lima.</p>
  </main>;
}
