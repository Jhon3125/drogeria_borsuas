import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_CONSULTA_INVENTARIO } from "@/lib/permisos";

export default async function ConciliacionPage() {
  await exigirRol(ROLES_CONSULTA_INVENTARIO);
  const productos = await prisma.producto.findMany({
    select: {
      id: true, codigo: true, nombre: true, stockActual: true, estado: true,
      lotes: { select: { id: true, numeroLote: true, cantidadDisponible: true, fechaVencimiento: true } },
    },
    orderBy: { nombre: "asc" },
  });

  const filas = productos.map((producto) => {
    const enLotes = producto.lotes.reduce((n, l) => n + l.cantidadDisponible, 0);
    const diferencia = producto.stockActual - enLotes;
    return { ...producto, enLotes, diferencia, conciliado: producto.lotes.length > 0 && diferencia === 0 };
  });
  const conLotes = filas.filter((p) => p.lotes.length > 0);
  const diferencias = conLotes.filter((p) => !p.conciliado);
  const sinLotesConStock = filas.filter((p) => p.lotes.length === 0 && p.stockActual > 0);

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="space-y-2">
        <Link href="/dashboard/inventario" className="text-sm font-medium text-[#123E70] hover:underline">← Volver al inventario</Link>
        <h1 className="text-3xl font-bold text-[#123E70]">Conciliación de existencias y lotes</h1>
        <p className="text-sm text-slate-600">Comparación de Producto.stockActual contra las cantidades disponibles de cada lote. Reporte de solo lectura; no modifica datos.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {[["Productos con lotes", conLotes.length], ["Con diferencia", diferencias.length], ["Stock sin lote asignado", sinLotesConStock.length]].map(([titulo, valor]) => (
          <div key={titulo} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{titulo}</p><p className="mt-3 text-3xl font-bold text-[#123E70]">{valor}</p></div>
        ))}
      </section>
      {diferencias.length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Hay diferencias que requieren revisión del historial, conteo físico y lotes. No ajustes las cantidades automáticamente.</div>}
      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-700"><tr><th className="p-4">Producto</th><th className="p-4 text-right">Stock general</th><th className="p-4 text-right">En lotes</th><th className="p-4 text-right">Diferencia</th><th className="p-4">Situación</th></tr></thead>
          <tbody>{filas.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-4"><div className="font-semibold">{p.nombre}</div><div className="text-xs text-slate-500">{p.codigo} · {p.lotes.length} lote(s){!p.estado ? " · Inactivo" : ""}</div></td>
              <td className="p-4 text-right">{p.stockActual}</td><td className="p-4 text-right">{p.enLotes}</td><td className="p-4 text-right font-semibold">{p.lotes.length ? p.diferencia : "—"}</td>
              <td className="p-4">{p.lotes.length === 0 ? (p.stockActual > 0 ? "Stock heredado sin asignación de lote" : "Sin existencias/lotes") : p.conciliado ? "Conciliado" : "Diferencia por investigar"}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      <p className="text-sm text-slate-600">Nota: el stock heredado sin lotes no se puede atribuir a un lote ni vencimiento automáticamente. La recepción de compras crea lotes; los ajustes generales de productos con lotes están deshabilitados hasta implementar un ajuste por lote auditado.</p>
    </main>
  );
}
