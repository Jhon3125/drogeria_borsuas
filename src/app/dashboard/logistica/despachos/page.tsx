import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { actualizarDespacho, recibirDevolucionDespacho } from "../actions";

export default async function DespachosPage() {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"]);
  const conductor = usuario.rol === "CONDUCTOR";
  const despachos = await prisma.despacho.findMany({
    where: conductor ? { hojaRuta: { conductorId: Number(usuario.id) } } : {},
    orderBy: { hojaRuta: { fecha: "desc" } }, take: 150,
    include: {
      hojaRuta: { include: { conductor: { select: { nombre: true } }, vehiculo: { select: { placa: true } } } },
      venta: { include: { cliente: { select: { razonSocial: true, direccion: true } }, detalles: { include: { producto: { select: { nombre: true } } } } } },
      evidencia: { select: { id: true, fecha: true } },
      historial: { include: { usuario: { select: { nombre: true } } }, orderBy: { fecha: "desc" }, take: 10 },
    },
  });
  const ordenados = conductor ? despachos.filter(d => d.hojaRuta.fecha.toLocaleDateString("en-CA", { timeZone: "UTC" }) === new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" })) : despachos;
  return <main className="mx-auto max-w-6xl space-y-6 pb-10">
    <header><p className="text-sm text-slate-500">Logística / Entregas</p><h1 className="text-3xl font-bold text-[#123E70]">Despachos</h1><p className="text-slate-500">{conductor ? "Mis entregas asignadas para hoy" : "Seguimiento de pedidos, trazabilidad y comprobantes de entrega"}</p></header>
    <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[#123E70]"><Link href="/dashboard/logistica/panel" className="rounded-lg border bg-white p-3">Panel logístico</Link><Link href="/dashboard/logistica/movimientos" className="rounded-lg border bg-white p-3">Salidas por lote</Link></nav>
    <div className="grid gap-4 sm:grid-cols-3">{["PENDIENTE", "EN_RUTA", "ENTREGADO"].map(e => <div key={e} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{e.replaceAll("_", " ")}</p><p className="text-3xl font-bold text-[#123E70]">{ordenados.filter(d => d.estado === e).length}</p></div>)}</div>
    <section className="grid items-start gap-4 lg:grid-cols-2">{ordenados.map(d => <article key={d.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2"><strong className="text-[#123E70]">Despacho #{d.id} · Venta #{d.ventaId}</strong><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{d.estado.replaceAll("_", " ")}</span></div>
      <div><p className="font-semibold">{d.venta.cliente.razonSocial}</p>{d.venta.cliente.direccion && <p className="text-sm text-slate-600">Destino: {d.venta.cliente.direccion}</p>}<p className="text-sm text-slate-500">Ruta #{d.hojaRutaId} · {d.hojaRuta.conductor.nombre} · {d.hojaRuta.vehiculo.placa} · {d.hojaRuta.fecha.toLocaleDateString("es-PE", { timeZone: "UTC" })}</p></div>
      <ul className="space-y-1 text-sm text-slate-600">{d.venta.detalles.map(det => <li key={det.id}>• {det.producto.nombre} × {det.cantidad}</li>)}</ul>
      {d.salidaInventarioEn && <p className="text-xs text-emerald-700">✓ Salida de inventario registrada el {d.salidaInventarioEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}</p>}
      {d.receptor && <p className="text-sm"><strong>Recibido por:</strong> {d.receptor}</p>}
      {d.entregadoEn && <p className="text-xs text-slate-500">Entrega: {d.entregadoEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}</p>}
      {d.estado === "ENTREGADO" && <Link href={`/dashboard/logistica/despachos/${d.id}/comprobante`} className="inline-block rounded-lg border px-3 py-2 text-sm font-semibold text-[#123E70]">Comprobante imprimible</Link>}
      {d.evidencia && <Link href={`/dashboard/logistica/despachos/${d.id}/foto`} className="inline-block rounded-md bg-sky-50 px-3 py-2 text-sm font-semibold text-[#123E70] hover:underline">Ver fotografía de entrega</Link>}
      {d.observacion && <p className="text-sm">Observación: {d.observacion}</p>}
      {["PENDIENTE", "EN_RUTA"].includes(d.estado) && <form action={actualizarDespacho} className="space-y-3 border-t pt-4"><input type="hidden" name="id" value={d.id}/>
        {d.estado === "EN_RUTA" && <><label className="block text-sm font-medium">Nombre de quien recibe<input name="receptor" maxLength={120} placeholder="Nombre y apellido" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label><label className="block text-sm font-medium">Foto de entrega (JPG, PNG o WEBP · máximo 3 MB)<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full rounded-lg border p-2 text-sm"/></label><textarea name="observacion" maxLength={500} placeholder="Observación o motivo de reprogramación" className="w-full rounded-lg border p-2 text-sm" rows={2}/><p className="text-xs text-slate-500">Para confirmar ENTREGADO se requiere nombre y foto; para REPROGRAMADO, motivo.</p></>}
        {d.estado === "PENDIENTE" && <p className="text-xs text-amber-700">Al marcar EN RUTA se descontarán las existencias por lote (una sola vez) y la venta pasará a DESPACHADA.</p>}
        <div className="flex flex-wrap gap-2">{(d.estado === "PENDIENTE" ? ["EN_RUTA"] : ["ENTREGADO", "REPROGRAMADO"]).map(estado => <button key={estado} name="estado" value={estado} className="rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#087EBD]">{estado.replaceAll("_", " ")}</button>)}</div>
      </form>}
      {d.estado === "REPROGRAMADO" && d.salidaInventarioEn && !d.devolucionInventarioEn && !conductor && <form action={recibirDevolucionDespacho} className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
        <p className="text-sm font-semibold">Recepción física de devolución</p>
        <p className="text-xs text-slate-600">Reintegrará todas las unidades del despacho al mismo lote, únicamente si están físicamente recibidas y aptas. No genera una ruta nueva.</p>
        <input type="hidden" name="id" value={d.id}/>
        <textarea required name="motivo" maxLength={500} placeholder="Motivo y comprobación de devolución" rows={2} className="w-full rounded-lg border p-2 text-sm" />
        <label className="flex items-start gap-2 text-xs"><input required type="checkbox" name="inspeccion" value="confirmada"/>Confirmo que almacén recibió la totalidad, verificó lote, cantidad, integridad, conservación y vencimiento.</label>
        <button className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white">Confirmar reintegro al inventario</button>
      </form>}
      {d.devolucionInventarioEn && <p className="text-sm font-semibold text-emerald-700">✓ Reintegrado al almacén el {d.devolucionInventarioEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}. {d.devolucionMotivo}</p>}
      {d.historial.length > 0 && <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold text-[#123E70]">Historial ({d.historial.length})</summary><ol className="mt-2 space-y-2 text-xs text-slate-600">{d.historial.map(h => <li key={h.id}>{h.fecha.toLocaleString("es-PE", { timeZone: "America/Lima" })} · {h.usuario.nombre} · {h.estadoAnterior.replaceAll("_", " ")} → {h.estadoNuevo.replaceAll("_", " ")}{h.observacion && ` · ${h.observacion}`}</li>)}</ol></details>}
    </article>)}{!ordenados.length && <p className="rounded-xl border bg-white p-6 text-slate-500">No hay despachos asignados.</p>}</section>
    <p className="text-xs text-slate-500">Las reprogramaciones conservan la salida hasta que almacén confirme la recepción de las unidades. Una devolución no crea por sí sola otra ruta.</p>
  </main>;
}
