import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/guard";
import { ROLES_CONSULTA_INVENTARIO } from "@/lib/permisos";
import { consultarInventarioRespaldado } from "@/lib/inventario/lotes-respaldados";

export default async function DetalleInventarioPage({params}: {params: Promise<{id:string}>}) {
  await exigirRol(ROLES_CONSULTA_INVENTARIO);
  const { id } = await params;
  const productoId = Number(id);
  if (!Number.isSafeInteger(productoId) || productoId <= 0) notFound();
  const inventario = await consultarInventarioRespaldado();
  const producto = inventario.find((p) => p.id === productoId);
  if (!producto) notFound();
  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-8">
      <Link href="/dashboard/inventario" className="text-sm font-medium text-primary hover:underline">← Volver al inventario</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{producto.nombre}</h1>
        <p className="text-sm text-muted-foreground">{producto.codigo} · {producto.categoria.nombre}</p>
        <p className="text-sm">Stock respaldado: <strong>{producto.stockLotes}</strong> unidades en {producto.lotes.length} lote(s).</p>
        {producto.diferencia !== 0 && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Diferencia por conciliar: el stock general es {producto.stockActual} y el stock en lotes respaldados es {producto.stockLotes}. No se han modificado datos.
        </div>}
      </header>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[740px] text-left text-sm">
          <thead className="bg-secondary/40"><tr><th className="p-4">Lote</th><th className="p-4">Vencimiento</th><th className="p-4 text-right">Inicial</th><th className="p-4 text-right">Disponible</th><th className="p-4">Compra / proveedor</th></tr></thead>
          <tbody>{producto.lotes.map(lote => <tr className="border-t" key={lote.id}>
            <td className="p-4 font-medium">{lote.numeroLote}</td>
            <td className="p-4">{lote.fechaVencimiento.toLocaleDateString("es-PE", {timeZone:"UTC"})}</td>
            <td className="p-4 text-right">{lote.cantidadInicial}</td>
            <td className="p-4 text-right font-semibold">{lote.cantidadDisponible}</td>
            <td className="p-4">{lote.compras.map((compra, index) => <div key={`${compra.compraId}-${index}`}>#{compra.compraId} · {compra.proveedor} · {compra.cantidadRecibida} recibidas</div>)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">Solo se muestran lotes con compras recibidas coincidentes en producto, código de lote y vencimiento. Los registros sin respaldo o con cantidades incoherentes permanecen en la base para revisión administrativa.</p>
    </main>
  );
}
