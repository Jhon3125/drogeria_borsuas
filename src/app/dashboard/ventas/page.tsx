import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ListadoVentas } from "./listado-ventas";
import { ShoppingCart, PackageCheck, ClipboardList, Truck } from "lucide-react";
import { Prisma } from "@/generated/prisma/client";

export default async function VentasPage() {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "COMERCIAL", "ALMACEN"]);
  const where = usuario.rol === "COMERCIAL" ? { vendedorId: Number(usuario.id) } : {};
  const [ventas, conteos] = await Promise.all([
    prisma.venta.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 150,
      include: {
        cliente: { select: { razonSocial: true, documento: true } },
        vendedor: { select: { nombre: true } },
        cotizacion: { select: { id: true, version: true } },
        oportunidad: { select: { id: true } },
        detalles: { select: { cantidad: true, asignacionesLote: { select: { cantidad: true } } } },
        despachos: {
          select: { estado: true },
          orderBy: { id: "desc" },
          take: 1,
        },
        pagos: {
          select: { monto: true },
        },
      },
    }),
    prisma.venta.groupBy({ by: ["estado"], where, _count: { _all: true } }),
  ]);
  const contar = (estado: string) => conteos.find((item) => item.estado === estado)?._count._all ?? 0;
  const registros = ventas.map((v) => {
    const requeridas = v.detalles.reduce((total, d) => total + d.cantidad, 0);
    const asignadas = v.detalles.reduce((total, d) => total + d.asignacionesLote.reduce((n, a) => n + a.cantidad, 0), 0);
    const pagado = v.pagos.reduce(
      (total, pago) => total.add(pago.monto),
      new Prisma.Decimal(0)
    );

    const saldoReal = v.importeTotal.minus(pagado);
    const saldoPendienteReal = saldoReal.greaterThan(0)
      ? saldoReal
      : new Prisma.Decimal(0);
    return {
      id: v.id,
      fecha: v.fecha.toISOString(),
      cliente: v.cliente.razonSocial,
      documento: v.cliente.documento ?? "",
      vendedor: v.vendedor.nombre,
      estado: v.estado,
      estadoVisual: v.despachos[0] ? (v.despachos[0].estado === "PENDIENTE" ? "PROGRAMADO" : v.despachos[0].estado === "EN_RUTA" ? "EN_RUTA" : v.despachos[0].estado === "REPROGRAMADO" ? "REPROGRAMADO" : "COMPLETADA") : (v.detalles.length && v.detalles.every(d => d.asignacionesLote.reduce((n, a) => n + a.cantidad, 0) === d.cantidad) && saldoPendienteReal.lte(0) && v.estado !== "ANULADA" ? "LISTO_PARA_DESPACHO" : v.estado),
      moneda: v.moneda,
      total: v.importeTotal.toFixed(2),
      saldo: saldoPendienteReal.toFixed(2),
      productos: v.detalles.length,
      requeridas,
      asignadas,
      cotizacionId: v.cotizacion?.id ?? null,
      version: v.cotizacion?.version ?? null,
      oportunidadId: v.oportunidad?.id ?? null,
    };
  });
  const kpis = [
    { label: "Confirmadas", valor: contar("CONFIRMADA"), icono: ShoppingCart, fondo: "bg-sky-50", color: "text-sky-700" },
    { label: "En preparación", valor: contar("EN_PREPARACION"), icono: ClipboardList, fondo: "bg-amber-50", color: "text-amber-700" },
    { label: "Despachadas", valor: contar("DESPACHADA"), icono: Truck, fondo: "bg-violet-50", color: "text-violet-700" },
    { label: "Completadas", valor: contar("COMPLETADA"), icono: PackageCheck, fondo: "bg-emerald-50", color: "text-emerald-700" },
  ];
  return (
    <main className="mx-auto max-w-[1650px] space-y-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Comercial y ventas / Operaciones</p>
          <h1 className="text-3xl font-bold text-[#123E70]">Ventas</h1>
          <p className="mt-1 text-sm text-slate-600">Ventas confirmadas y preparación de pedidos mediante lotes trazables.</p>
        </div>
        <Link href="/dashboard/cotizaciones" className="inline-flex items-center rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]">Ir a Cotizaciones</Link>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => <div key={k.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className={`rounded-xl p-3 ${k.fondo} ${k.color}`}><k.icono className="h-5 w-5" /></span>
          <div><p className="text-xs text-slate-500">{k.label}</p><p className="text-2xl font-bold text-[#123E70]">{k.valor}</p></div>
        </div>)}
      </section>
      <ListadoVentas ventas={registros} />
      <p className="text-xs text-slate-500">La asignación de lotes reserva stock. La salida física se registra una sola vez al iniciar la ruta en Logística.</p>
    </main>
  );
}
