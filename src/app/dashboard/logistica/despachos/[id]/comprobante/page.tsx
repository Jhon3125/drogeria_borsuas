import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import Imprimir from "./imprimir";

export default async function Comprobante({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const d = await prisma.despacho.findUnique({
    where: { id: Number(id) },
    include: {
      hojaRuta: { include: {
        conductor: { select: { nombre: true } },
        vehiculo: { select: { placa: true, modelo: true } },
      } },
      venta: { include: {
        cliente: { select: { razonSocial: true, direccion: true } },
        detalles: { include: {
          producto: { select: { nombre: true } },
          asignacionesLote: { include: { lote: { select: { numeroLote: true } } } },
        } },
      } },
      evidencia: { select: { id: true } },
    },
  });
  if (!d || d.estado !== "ENTREGADO" || (usuario.rol === "CONDUCTOR" && d.hojaRuta.conductorId !== Number(usuario.id))) notFound();
  return <main className="mx-auto max-w-3xl space-y-6 bg-white p-8 text-slate-900 print:max-w-none print:p-0">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold tracking-widest">BORSUAS ERP</p><h1 className="text-2xl font-bold">Comprobante de entrega #{d.id}</h1><p className="text-sm text-slate-500">Documento operativo, no es comprobante tributario SUNAT.</p></div><Imprimir/></div>
    <section className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2"><p><strong>Venta:</strong> VEN-{String(d.ventaId).padStart(5,"0")}</p><p><strong>Ruta:</strong> #{d.hojaRutaId}</p><p><strong>Cliente:</strong> {d.venta.cliente.razonSocial}</p><p><strong>Destino:</strong> {d.venta.cliente.direccion || "No especificado"}</p><p><strong>Conductor:</strong> {d.hojaRuta.conductor.nombre}</p><p><strong>Vehículo:</strong> {d.hojaRuta.vehiculo.placa} · {d.hojaRuta.vehiculo.modelo}</p><p><strong>Receptor:</strong> {d.receptor || "No registrado"}</p><p><strong>Entrega:</strong> {d.entregadoEn?.toLocaleString("es-PE", { timeZone: "America/Lima" }) || "No registrada"}</p></section>
    <section><h2 className="mb-2 font-bold">Productos entregados</h2><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-2">Producto</th><th className="p-2">Cantidad</th><th className="p-2">Lotes</th></tr></thead><tbody>{d.venta.detalles.map(x => <tr className="border-b" key={x.id}><td className="p-2">{x.producto.nombre}</td><td className="p-2">{x.cantidad}</td><td className="p-2">{x.asignacionesLote.map(a => `${a.lote.numeroLote} (${a.cantidad})`).join(", ")}</td></tr>)}</tbody></table></section>
    {d.observacion && <p className="text-sm"><strong>Observaciones:</strong> {d.observacion}</p>}
    {d.evidencia && <section><h2 className="mb-2 font-bold">Fotografía de entrega</h2>{/* La imagen se sirve por la ruta privada autorizada del ERP. */}<img className="max-h-96 max-w-full rounded-lg border object-contain" alt="Evidencia fotográfica de entrega" src={`/dashboard/logistica/despachos/${d.id}/foto`}/></section>}
    <p className="border-t pt-3 text-xs text-slate-500">Generado desde la información registrada en BORSUAS ERP.</p>
  </main>;
}
