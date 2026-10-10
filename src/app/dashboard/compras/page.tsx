import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
  ROLES_COMPRAS_LECTURA,
  ROLES_COMPRAS_GESTION,
  ROLES_RECEPCION,
} from "@/lib/compras-roles";
import { ComprasHeader } from "@/components/dashboard/compras-header";
import { CompraForm } from "./form";
import { RecepcionForm } from "./recepcion-form";

const simbolo = (moneda: "PEN" | "USD") => (moneda === "USD" ? "US$" : "S/");

export default async function ComprasPage() {
  const user = await exigirRol(ROLES_COMPRAS_LECTURA);
  const [proveedores, productos, compras] = await Promise.all([
    prisma.proveedor.findMany({
      where: { estado: true }, select: { id: true, razonSocial: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.producto.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, codigo: true, precioCompra: true, moneda: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.compra.findMany({
      take: 60,
      orderBy: { fecha: "desc" },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: { select: { nombre: true, codigo: true } },
            recepciones: { select: { cantidad: true } },
          },
        },
      },
    }),
  ]);

  return (
    <main className="space-y-6 p-6">
      <ComprasHeader />
      {ROLES_COMPRAS_GESTION.includes(user.rol) && (
        <CompraForm
          proveedores={proveedores}
          productos={productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo,
            precioCompra: p.precioCompra.toString(),
            moneda: p.moneda,
          }))}
        />
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#123E70]">Compras recientes</h2>
        {compras.length === 0 && <p>Aún no hay compras registradas.</p>}
        {compras.map(c => (
          <article key={c.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-[#123E70]">Compra #{c.id} — {c.proveedor.razonSocial}</h3>
                <p className="text-xs text-slate-500">
                  {c.fecha.toLocaleDateString("es-PE", { timeZone: "America/Lima" })} · {c.estado}
                </p>
              </div>
              <p className="font-bold">{simbolo(c.moneda)} {c.importeTotal.toFixed(2)}</p>
            </div>
            {c.tipoCambio && (
              <p className="mt-1 text-xs text-slate-500">
                Tipo de cambio aplicado: 1 USD = S/ {c.tipoCambio.toFixed(6)}
              </p>
            )}
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              {c.detalles.map(d => (
                <p key={d.id}>
                  {d.producto.codigo} · {d.producto.nombre} · {d.cantidad} uds. · {simbolo(c.moneda)} {d.precioUnitario.toFixed(2)} por unidad · Lote {d.numeroLote} · Vence {d.fechaVencimiento.toLocaleDateString("es-PE", { timeZone: "UTC" })}
                </p>
              ))}
            </div>
            {["PENDIENTE", "PARCIAL"].includes(c.estado) && ROLES_RECEPCION.includes(user.rol) && (
              <RecepcionForm compraId={c.id} lineas={c.detalles.map(d => ({
                id: d.id,
                nombre: d.producto.nombre,
                pedido: d.cantidad,
                recibido: d.recepciones.reduce((sum, r) => sum + r.cantidad, 0),
              }))} />
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
