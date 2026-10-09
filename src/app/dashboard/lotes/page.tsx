import Link from "next/link";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_LECTURA } from "@/lib/compras-roles";
import { consultarInventarioRespaldado } from "@/lib/inventario/lotes-respaldados";

export default async function LotesPage() {
  await exigirRol(ROLES_COMPRAS_LECTURA);
  const productos = await consultarInventarioRespaldado();
  const lotes = productos.flatMap((producto) => producto.lotes.map((lote) => ({
    ...lote, productoId: producto.id, nombre: producto.nombre, codigo: producto.codigo,
  }))).sort((a,b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());
  const hoy = new Date();
  const dias = (fecha: Date) => Math.ceil((fecha.getTime() - hoy.getTime()) / 86400000);
  return <main className="mx-auto max-w-7xl space-y-5 pb-8">
    <header><h1 className="text-3xl font-bold text-[#123E70]">Lotes y vencimientos</h1>
      <p className="text-sm text-muted-foreground">Solo lotes respaldados por compras recibidas. Registros no conciliados fuera de esta vista.</p>
    </header>
    <div className="grid gap-3 sm:grid-cols-3">{[
      ["Vencidos", lotes.filter(l=>l.cantidadDisponible>0 && dias(l.fechaVencimiento)<0).length],
      ["Vencen en 30 días", lotes.filter(l=>l.cantidadDisponible>0 && dias(l.fechaVencimiento)>=0 && dias(l.fechaVencimiento)<=30).length],
      ["Unidades en lotes", lotes.reduce((n,l)=>n+l.cantidadDisponible,0)],
    ].map(([titulo,valor])=><div key={titulo} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">{titulo}</p><p className="mt-2 text-3xl font-bold text-[#123E70]">{valor}</p></div>)}</div>
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Producto</th><th className="p-4">Lote</th><th className="p-4">Vencimiento</th><th className="p-4 text-right">Disponible</th><th className="p-4">Compra recibida</th><th className="p-4">Estado</th></tr></thead>
      <tbody>{lotes.map(l=><tr key={l.id} className="border-t"><td className="p-4"><Link className="font-semibold text-primary hover:underline" href={`/dashboard/inventario/producto/${l.productoId}`}>{l.codigo} · {l.nombre}</Link></td><td className="p-4">{l.numeroLote}</td><td className="p-4">{l.fechaVencimiento.toLocaleDateString("es-PE", {timeZone:"UTC"})}</td><td className="p-4 text-right">{l.cantidadDisponible}</td><td className="p-4">{l.compras.map(c=>`#${c.compraId}`).join(", ")}</td><td className="p-4">{l.cantidadDisponible===0 ? "Agotado" : dias(l.fechaVencimiento)<0 ? "Vencido" : dias(l.fechaVencimiento)<=30 ? "Próximo a vencer" : "Vigente"}</td></tr>)}</tbody>
      </table>
      {lotes.length===0 && <p className="p-8 text-center text-sm text-muted-foreground">No hay lotes respaldados por compras recibidas.</p>}
    </div>
  </main>;
}
