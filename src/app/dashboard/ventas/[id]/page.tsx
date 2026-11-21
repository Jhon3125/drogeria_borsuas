import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { AsignarLotesForm } from "./asignar-lotes-form";
import { RegistrarPagoForm } from "./registrar-pago-form";

const fmt = (moneda: string, n: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda === "USD" ? "USD" : "PEN" }).format(n);

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "COMERCIAL", "ALMACEN"]);
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const venta = await prisma.venta.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: { select: { razonSocial: true } },
      cotizacion: { select: { id: true, version: true } },
      pagos: { orderBy: { fecha: "desc" }, include: { registradoPor: { select: { nombre: true } } } },
      detalles: {
        include: {
          producto: { select: { nombre: true, codigo: true } },
          asignacionesLote: { select: { loteId: true, cantidad: true, lote: { select: { numeroLote: true } } } },
        },
      },
    },
  });
  if (!venta) notFound();
  if (usuario.rol === "COMERCIAL" && venta.vendedorId !== Number(usuario.id)) notFound();
  const editable = (usuario.rol === "SUPER_ADMIN" || usuario.rol === "ADMIN" || usuario.rol === "ALMACEN") && (venta.estado === "CONFIRMADA" || venta.estado === "EN_PREPARACION");
  const ids = venta.detalles.map((d) => d.productoId);
  const lotes = await prisma.lote.findMany({
    where: { productoId: { in: ids } },
    select: {
      id: true, productoId: true, numeroLote: true, cantidadDisponible: true, fechaVencimiento: true, estadoCalidad: true,
      retenciones: { where: { estado: "ACTIVA" }, select: { cantidad: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  });
  const ocupadas = await prisma.asignacionLoteVenta.findMany({
    where: { loteId: { in: lotes.map((l) => l.id) }, detalleVenta: { venta: { estado: { in: ["CONFIRMADA", "EN_PREPARACION"] } } } },
    select: { loteId: true, cantidad: true, detalleVentaId: true },
  });
  const partesHoy = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valorHoy = (tipo: string) => partesHoy.find((p) => p.type === tipo)?.value ?? "";
  const hoyPeru = `${valorHoy("year")}-${valorHoy("month")}-${valorHoy("day")}`;
  const porProducto = new Map<number, typeof lotes>();
  for (const l of lotes) porProducto.set(l.productoId, [...(porProducto.get(l.productoId) ?? []), l]);
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Link href="/dashboard/ventas" className="text-sm text-[#087EBD] hover:underline">Volver a Ventas</Link>
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-[#123E70]">Venta #{venta.id} · {venta.estado.replaceAll("_", " ")}</h1>
        <p className="mt-1 text-sm text-slate-600">{venta.cliente.razonSocial} · {fmt(venta.moneda, Number(venta.importeTotal))}</p>
        {venta.cotizacion && <Link href={`/dashboard/cotizaciones/${venta.cotizacion.id}/pdf`} className="mt-2 inline-block text-sm text-[#087EBD] hover:underline">Cotización COT-{String(venta.cotizacion.id).padStart(5, "0")} · v{venta.cotizacion.version} (PDF)</Link>}
        <p className="mt-3 text-xs text-amber-800">La asignación de lotes reserva existencias; Logística registra la salida física una sola vez al marcar EN RUTA.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-[#123E70]">Pagos de la venta</h2>
        <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">Total: <strong>{fmt(venta.moneda, Number(venta.importeTotal))}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3">Cobrado: <strong>{fmt(venta.moneda, Number(venta.importeTotal.minus(venta.saldoPendiente)))}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3">Pendiente: <strong>{fmt(venta.moneda, Number(venta.saldoPendiente))}</strong></div>
        </div>
        {(["SUPER_ADMIN", "ADMIN"] as string[]).includes(usuario.rol) && venta.estado !== "ANULADA" && venta.saldoPendiente.gt(0) ?
          <RegistrarPagoForm key={`${venta.id}-${venta.saldoPendiente.toString()}`} ventaId={venta.id} saldo={venta.saldoPendiente.toFixed(2)} moneda={venta.moneda} /> :
          <p className="text-sm text-slate-500">{venta.saldoPendiente.lte(0) ? "Venta pagada por completo." : "Solo administración puede registrar pagos."}</p>}
        <h3 className="mt-5 mb-2 font-semibold">Historial de cobros</h3>
        {venta.pagos.length ? <ul className="divide-y divide-slate-100 text-sm">{venta.pagos.map(p => <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{p.fecha.toLocaleString("es-PE", { timeZone: "America/Lima" })} · {p.metodoPago.replaceAll("_", " ")} · {p.registradoPor?.nombre ?? "Registro anterior"}</span><strong>{fmt(venta.moneda, Number(p.monto))}</strong></li>)}</ul> : <p className="text-sm text-slate-500">Sin pagos individuales registrados.</p>}
      </section>
      <div className="space-y-4">
        {venta.detalles.map((d) => {
          const anteriores = d.asignacionesLote.map((a) => ({ loteId: a.loteId, cantidad: a.cantidad }));
          const asignadas = anteriores.reduce((s, a) => s + a.cantidad, 0);
          const candidatos = (porProducto.get(d.productoId) ?? []).filter((l) => {
            return l.estadoCalidad === "DISPONIBLE" && l.fechaVencimiento.toISOString().slice(0, 10) >= hoyPeru;
          }).map((l) => {
            const retenido = l.retenciones.reduce((s, x) => s + x.cantidad, 0);
            const otras = ocupadas.filter((a) => a.loteId === l.id && a.detalleVentaId !== d.id).reduce((s, a) => s + a.cantidad, 0);
            return { id: l.id, numeroLote: l.numeroLote, vencimiento: l.fechaVencimiento.toISOString().slice(0, 10), libre: Math.max(0, l.cantidadDisponible - retenido - otras) };
          }).filter((l) => l.libre > 0 || anteriores.some((a) => a.loteId === l.id));
          return <section key={d.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold text-[#123E70]">{d.producto.codigo} · {d.producto.nombre}</h2><p className="text-sm text-slate-500">Cantidad vendida: {d.cantidad} · Precio: {fmt(venta.moneda, Number(d.precioUnitario))}</p></div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">Asignadas {asignadas}/{d.cantidad}</span>
            </div>
            {editable ? <AsignarLotesForm ventaId={venta.id} detalleId={d.id} cantidad={d.cantidad} lotes={candidatos} asignaciones={anteriores} /> : <p className="mt-3 text-sm text-slate-500">Asignación bloqueada por el estado de la venta.</p>}
          </section>;
        })}
      </div>
    </div>
  );
}
