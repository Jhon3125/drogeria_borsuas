import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { AsignarLotesForm } from "./asignar-lotes-form";
import { VistaVentaTabs } from "./vista-venta-tabs";
import { RegistrarCobroDrawer } from "@/app/dashboard/cuentas-por-cobrar/registrar-cobro-drawer";
import { ArrowLeft, Clock3, FileText, PackageCheck, ShieldAlert, Truck, Wallet, ExternalLink } from "lucide-react";

const fmt = (moneda: string, valor: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: moneda === "USD" ? "USD" : "PEN",
}).format(valor);
const fechaTexto = (d: Date | null | undefined) => d ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Lima" }).format(d) : "—";
const tarjeta = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "COMERCIAL", "ALMACEN"]);
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();

  const venta = await prisma.venta.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: { select: { razonSocial: true, documento: true, telefono: true, correo: true, direccion: true } },
      vendedor: { select: { nombre: true } },
      cotizacion: { select: { id: true, version: true, estado: true, condicionPago: true, plazoEntrega: true } },
      oportunidad: { select: { id: true, titulo: true, etapa: true, historial: { orderBy: { fechaCambio: "desc" }, take: 40, select: { id: true, fechaCambio: true, etapaAnterior: true, etapaNueva: true, comentario: true, usuario: { select: { nombre: true } } } } } },
      detalles: {
        orderBy: { id: "asc" },
        include: {
          producto: { select: { nombre: true, codigo: true } },
          asignacionesLote: { select: { loteId: true, cantidad: true, fechaAsignacion: true, lote: { select: { numeroLote: true, fechaVencimiento: true } } } },
        },
      },
      pagos: {
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          monto: true,
          fecha: true,
          metodoPago: true,
          referencia: true,
          registradoPor: {
            select: {
              nombre: true
            }
          }
        }
      },
      despachos: { orderBy: { id: "desc" }, include: { hojaRuta: { include: { conductor: { select: { nombre: true } }, vehiculo: { select: { placa: true, modelo: true } } } } } },
    },
  });
  if (!venta) notFound();
  if (usuario.rol === "COMERCIAL" && venta.vendedorId !== Number(usuario.id)) notFound();

  const editable = ["SUPER_ADMIN", "ADMIN", "ALMACEN"].includes(usuario.rol) && ["CONFIRMADA", "EN_PREPARACION"].includes(venta.estado);
  const ids = [...new Set(venta.detalles.map((d) => d.productoId))];
  // Los lotes y compromisos solo se necesitan para la preparación, no para cálculos de caja.
  const lotes = ids.length ? await prisma.lote.findMany({
    where: { productoId: { in: ids } },
    select: { id: true, productoId: true, numeroLote: true, cantidadDisponible: true, fechaVencimiento: true, estadoCalidad: true, retenciones: { where: { estado: "ACTIVA" }, select: { cantidad: true } } },
    orderBy: { fechaVencimiento: "asc" },
  }) : [];
  const ocupadas = lotes.length ? await prisma.asignacionLoteVenta.findMany({
    where: { loteId: { in: lotes.map((l) => l.id) }, detalleVenta: { venta: { estado: { in: ["CONFIRMADA", "EN_PREPARACION"] } } } },
    select: { loteId: true, cantidad: true, detalleVentaId: true },
  }) : [];
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const hoyPeru = `${parte("year")}-${parte("month")}-${parte("day")}`;
  const lotesPorProducto = new Map<number, typeof lotes>();
  for (const lote of lotes) lotesPorProducto.set(lote.productoId, [...(lotesPorProducto.get(lote.productoId) ?? []), lote]);

  const cantidadVendida = venta.detalles.reduce((s, d) => s + d.cantidad, 0);
  const cantidadAsignada = venta.detalles.reduce((s, d) => s + d.asignacionesLote.reduce((t, a) => t + a.cantidad, 0), 0);
  const pendientes = Math.max(0, cantidadVendida - cantidadAsignada);
  const pagado = venta.pagos.reduce((s, p) => s + Number(p.monto), 0);
  const saldoCalculado = Math.max(0, Math.round((Number(venta.importeTotal) - pagado) * 100) / 100);
  const estadoCobranza = pagado <= 0 ? "Pendiente" : saldoCalculado <= 0 ? "Pagada" : "Parcial";

  const resumen = <div className="grid gap-5 lg:grid-cols-3">
    <section className={`${tarjeta} space-y-4 lg:col-span-2`}>
      <h2 className="text-base font-bold text-[#123E70]">Información de la operación</h2>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <Campo label="Cliente" valor={venta.cliente.razonSocial} />
        <Campo label="DNI / RUC" valor={venta.cliente.documento ?? "No registrado"} />
        <Campo label="Vendedor" valor={venta.vendedor.nombre} />
        <Campo label="Fecha de venta" valor={fechaTexto(venta.fecha)} />
        <Campo label="Teléfono" valor={venta.cliente.telefono ?? "No registrado"} />
        <Campo label="Correo" valor={venta.cliente.correo ?? "No registrado"} />
        <Campo label="Dirección" valor={venta.cliente.direccion ?? "No registrada"} />
        <Campo label="Condición de pago" valor={venta.cotizacion?.condicionPago ?? "No definida"} />
        <Campo label="Plazo de entrega" valor={venta.cotizacion?.plazoEntrega ?? "No definido"} />
        <Campo label="Método de pago" valor={venta.metodoPago?.replaceAll("_", " ") ?? "No definido"} />
      </div>
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm">
        {venta.cotizacion && <Link className="inline-flex items-center gap-1.5 font-semibold text-[#087EBD] hover:underline" href={`/dashboard/cotizaciones/${venta.cotizacion.id}/pdf`} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /> Cotización COT-{String(venta.cotizacion.id).padStart(5, "0")} · v{venta.cotizacion.version} (PDF)</Link>}
        {venta.oportunidad && <Link className="font-semibold text-[#087EBD] hover:underline" href="/dashboard/ventas/crm">Oportunidad OP-{String(venta.oportunidad.id).padStart(4, "0")}: {venta.oportunidad.titulo}</Link>}
      </div>
    </section>
    <section className={`${tarjeta} space-y-4`}>
      <h2 className="text-base font-bold text-[#123E70]">Resumen financiero</h2>
      <Fila nombre="Subtotal" valor={fmt(venta.moneda, Number(venta.subtotal))} />
      <Fila nombre="Descuento general" valor={`− ${fmt(venta.moneda, Number(venta.descuento))}`} />
      <div className="border-t pt-3"><Fila nombre="Total vendido" valor={fmt(venta.moneda, Number(venta.importeTotal))} destacado /></div>
      <Fila nombre="Pagos registrados" valor={fmt(venta.moneda, pagado)} />
      <Fila nombre="Saldo calculado" valor={fmt(venta.moneda, saldoCalculado)} destacado />
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoCobranza === "Pagada" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>Cobranza: {estadoCobranza}</span>
      <p className="text-xs text-slate-500">El saldo se calcula con los pagos registrados; verifica la conciliación antes de considerarlo definitivo.</p>
    </section>
    <section className={`${tarjeta} lg:col-span-3`}>
      <h2 className="mb-4 text-base font-bold text-[#123E70]">Estado de preparación</h2>
      <div className="flex flex-wrap justify-between gap-2 text-sm"><span>Unidades asignadas a lotes</span><strong>{cantidadAsignada} / {cantidadVendida}</strong></div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#238B55]" style={{ width: `${cantidadVendida ? Math.min(100, (cantidadAsignada / cantidadVendida) * 100) : 0}%` }} /></div>
      <p className="mt-2 text-xs text-slate-500">{pendientes ? `Faltan ${pendientes} unidades por asignar.` : "Todas las unidades están asignadas. Esto aún no confirma la salida física."}</p>
    </section>
  </div>;

  const productos = <div className="space-y-4">
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><span>Asignar lotes no descuenta existencias ni registra salidas. La confirmación física se implementará en Despachos y Almacén.</span></div>
    {venta.detalles.map((d) => {
      const asignaciones = d.asignacionesLote.map((a) => ({ loteId: a.loteId, cantidad: a.cantidad }));
      const asignadas = asignaciones.reduce((s, a) => s + a.cantidad, 0);
      const candidatos = (lotesPorProducto.get(d.productoId) ?? []).filter((l) => l.estadoCalidad === "DISPONIBLE" && l.fechaVencimiento.toISOString().slice(0, 10) >= hoyPeru).map((l) => {
        const retenido = l.retenciones.reduce((s, r) => s + r.cantidad, 0);
        const ajenas = ocupadas.filter((a) => a.loteId === l.id && a.detalleVentaId !== d.id).reduce((s, a) => s + a.cantidad, 0);
        return { id: l.id, numeroLote: l.numeroLote, vencimiento: l.fechaVencimiento.toISOString().slice(0, 10), libre: Math.max(0, l.cantidadDisponible - retenido - ajenas) };
      }).filter((l) => l.libre > 0 || asignaciones.some((a) => a.loteId === l.id));
      return <section key={d.id} className={tarjeta}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold text-[#123E70]">{d.producto.codigo} · {d.producto.nombre}</h2><p className="mt-1 text-sm text-slate-500">Vendidas: {d.cantidad} unidades · Precio: {fmt(venta.moneda, Number(d.precioUnitario))} · Descuento: {fmt(venta.moneda, Number(d.descuento))}</p></div>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${asignadas === d.cantidad ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>Asignadas {asignadas}/{d.cantidad}</span>
        </div>
        {editable ? <AsignarLotesForm ventaId={venta.id} detalleId={d.id} cantidad={d.cantidad} lotes={candidatos} asignaciones={asignaciones} /> : <div className="mt-4 space-y-2 text-sm">{d.asignacionesLote.length ? d.asignacionesLote.map((a) => <div key={a.loteId} className="rounded-lg bg-slate-50 p-3">Lote {a.lote.numeroLote}: <strong>{a.cantidad} uds.</strong> · Vence {fechaTexto(a.lote.fechaVencimiento)}</div>) : <p className="text-slate-500">Sin asignaciones de lotes.</p>}<p className="text-xs text-slate-500">La edición está restringida por el estado de la venta o el rol.</p></div>}
      </section>;
    })}
  </div>;


  const puedeCobrar =
    ["SUPER_ADMIN", "ADMIN"].includes(usuario.rol) &&
    venta.estado !== "ANULADA" &&
    saldoCalculado > 0;

  const pagos = (
    <section className={`${tarjeta} space-y-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-[#123E70]">
            <Wallet className="h-5 w-5" />
            Pagos y cobranza
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Consulta los cobros realizados y el saldo de esta venta.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {estadoCobranza}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniKpi
          nombre="Total de venta"
          valor={fmt(venta.moneda, Number(venta.importeTotal))}
        />
        <MiniKpi
          nombre="Total cobrado"
          valor={fmt(venta.moneda, pagado)}
        />
        <MiniKpi
          nombre="Saldo pendiente"
          valor={fmt(venta.moneda, saldoCalculado)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <h3 className="font-semibold text-[#123E70]">
            Historial de cobros
          </h3>
          <p className="text-xs text-slate-500">
            {venta.pagos.length} operación(es) registrada(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["SUPER_ADMIN", "ADMIN"].includes(usuario.rol) && (
            <Link
              href={`/dashboard/cuentas-por-cobrar?ventaId=${venta.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#123E70] hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Ver en Cuentas por cobrar
            </Link>
          )}

          {puedeCobrar && (
            <RegistrarCobroDrawer
              venta={{
                id: venta.id,
                cliente: venta.cliente.razonSocial,
                moneda: venta.moneda,
                saldo: saldoCalculado.toFixed(2),
                total: Number(venta.importeTotal).toFixed(2),
              }}
            />
          )}
        </div>
      </div>

      {venta.pagos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Pago</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Método</th>
                <th className="px-3 py-3">Referencia</th>
                <th className="px-3 py-3">Registrado por</th>
                <th className="px-3 py-3 text-right">Importe</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {venta.pagos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium">
                    #{p.id}
                  </td>
                  <td className="px-3 py-3">
                    {fechaTexto(p.fecha)}
                  </td>
                  <td className="px-3 py-3">
                    {p.metodoPago.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-3">
                    {p.referencia || "—"}
                  </td>
                  <td className="px-3 py-3">
                    {p.registradoPor?.nombre ?? "No registrado"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {fmt(venta.moneda, Number(p.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Esta venta todavía no tiene cobros registrados.
        </div>
      )}

      <p className="text-xs text-slate-500">
        Los cobros también aparecen como ingresos en Flujo de caja.
        El estado de cobranza es independiente de la preparación y el despacho.
      </p>
    </section>
  );


  const despachos = <section className={`${tarjeta} space-y-4`}>
    <h2 className="flex items-center gap-2 font-bold text-[#123E70]"><Truck className="h-5 w-5" /> Despachos asociados</h2>
    {venta.despachos.length ? venta.despachos.map((d) => (
      <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-[#123E70]">Despacho #{d.id}</strong>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${d.estado === "ENTREGADO" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
            d.estado === "EN_RUTA" ? "border-sky-200 bg-sky-50 text-sky-800" :
              d.estado === "REPROGRAMADO" ? "border-amber-200 bg-amber-50 text-amber-800" :
                "border-slate-200 bg-white text-slate-700"
            }`}>{d.estado.replaceAll("_", " ")}</span>
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Campo label="Conductor" valor={d.hojaRuta?.conductor.nombre ?? "Pendiente de asignación"} />
          <Campo label="Vehículo" valor={d.hojaRuta ? `${d.hojaRuta.vehiculo.placa} · ${d.hojaRuta.vehiculo.modelo}` : "Pendiente de asignación"} />
          <Campo label="Hoja de ruta" valor={d.hojaRutaId ? `#${d.hojaRutaId}` : "Sin programar"} />
          <Campo label="Observación" valor={d.observacion ?? "Sin observaciones"} />
        </div>
      </div>
    )) : (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
        <PackageCheck className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <p className="font-semibold text-slate-700">Sin despachos registrados</p>
        <p className="mt-2 text-sm text-slate-500">La preparación por lotes se realiza en esta venta. Los despachos y la asignación de conductor y vehículo se gestionarán en Logística.</p>
      </div>
    )}
    <p className="text-xs text-slate-500">La programación de rutas, conductores y entregas se gestionará desde Despachos 360°.</p>
  </section>;

  const eventos = [
    { id: "venta", fecha: venta.fecha, titulo: "Venta confirmada", detalle: `Venta #${venta.id} registrada desde cotización aceptada.` },
    ...venta.detalles.flatMap((d) => d.asignacionesLote.map((a) => ({ id: `asig-${d.id}-${a.loteId}`, fecha: a.fechaAsignacion, titulo: "Asignación de lote", detalle: `${d.producto.nombre} · lote ${a.lote.numeroLote} · ${a.cantidad} unidades.` }))),
    ...venta.pagos.map((p) => ({ id: `pago-${p.id}`, fecha: p.fecha, titulo: "Pago registrado", detalle: `${fmt(venta.moneda, Number(p.monto))} · ${p.metodoPago}.` })),
    ...(venta.oportunidad?.historial ?? []).map((h) => ({ id: `etapa-${h.id}`, fecha: h.fechaCambio, titulo: `CRM: ${h.etapaAnterior ?? "Inicio"} → ${h.etapaNueva}`, detalle: `${h.usuario.nombre}${h.comentario ? ` · ${h.comentario}` : ""}` })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  const historial = <section className={`${tarjeta} space-y-4`}><h2 className="flex items-center gap-2 font-bold text-[#123E70]"><Clock3 className="h-5 w-5" /> Historial disponible</h2><p className="text-xs text-slate-500">Incluye cambios de etapa CRM, pagos y las asignaciones de lotes que todavía existen. No sustituye a una auditoría completa de cambios históricos.</p>{eventos.length ? <div className="space-y-4">{eventos.map((ev) => <div key={ev.id} className="border-l-2 border-sky-200 pl-4"><strong className="text-sm text-[#123E70]">{ev.titulo}</strong><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(ev.fecha)}</p><p className="mt-1 text-sm text-slate-600">{ev.detalle}</p></div>)}</div> : <p className="text-sm text-slate-500">No hay eventos registrados.</p>}</section>;

  return <main className="mx-auto max-w-[1350px] space-y-5 pb-12">
    <Link href="/dashboard/ventas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#087EBD] hover:underline"><ArrowLeft className="h-4 w-4" /> Volver a Ventas</Link>
    <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">Comercial y ventas / Venta 360°</p><h1 className="mt-1 text-2xl font-bold text-[#123E70]">Venta #{String(venta.id).padStart(5, "0")}</h1><p className="mt-1 text-sm text-slate-600">{venta.cliente.razonSocial} · {fechaTexto(venta.fecha)}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${venta.estado === "COMPLETADA" ? "bg-emerald-100 text-emerald-800" : venta.estado === "ANULADA" ? "bg-rose-100 text-rose-800" : "bg-sky-100 text-sky-800"}`}>{venta.estado.replaceAll("_", " ")}</span></div>
      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3"><MiniKpi nombre="Importe de venta" valor={fmt(venta.moneda, Number(venta.importeTotal))} /><MiniKpi nombre="Preparación" valor={`${cantidadAsignada} / ${cantidadVendida} uds.`} /><MiniKpi nombre="Cobranza" valor={estadoCobranza} /></div>
    </header>
    <VistaVentaTabs resumen={resumen} lotes={productos} pagos={pagos} despachos={despachos} historial={historial} pendientes={pendientes} />
  </main>;
}

function Campo({ label, valor }: { label: string; valor: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-800">{valor}</p></div>; }
function Fila({ nombre, valor, destacado = false }: { nombre: string; valor: string; destacado?: boolean }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className={destacado ? "font-bold text-[#123E70]" : "text-slate-600"}>{nombre}</span><strong className={destacado ? "text-base text-[#123E70]" : "text-slate-800"}>{valor}</strong></div>; }
function MiniKpi({ nombre, valor }: { nombre: string; valor: string }) { return <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">{nombre}</p><p className="mt-1 text-base font-bold text-[#123E70]">{valor}</p></div>; }
