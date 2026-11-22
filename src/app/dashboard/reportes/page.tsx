import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ArrowDownRight, BarChart3, CalendarDays, CreditCard, Download, FileText, FileSpreadsheet, PackageCheck, ReceiptText, ShoppingCart, TrendingDown, TrendingUp, Truck, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ mes?: string }> };
const pen = (n: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
const entero = (n: number) => new Intl.NumberFormat("es-PE").format(n);
const mesNombre = (d: Date) => new Intl.DateTimeFormat("es-PE", { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
const fechaPE = (d: Date) => d.toLocaleDateString("es-PE", { timeZone: "America/Lima" });
const sumar = (valores: number[]) => valores.reduce((a, b) => a + b, 0);
const pct = (v: number, total: number) => total > 0 ? Math.min(100, Math.max(0, 100 * v / total)) : 0;

function Tarjeta({ titulo, valor, subtitulo, icono: Icono, tono = "blue" }: { titulo: string; valor: string; subtitulo: string; icono: typeof Wallet; tono?: "blue" | "green" | "amber" | "violet" }) {
 const colores = { blue: "bg-sky-50 text-sky-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
 return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-slate-500">{titulo}</p><span className={`rounded-xl p-2.5 ${colores[tono]}`}><Icono className="h-5 w-5"/></span></div>
  <p className="mt-3 text-2xl font-bold tracking-tight text-[#123E70]">{valor}</p><p className="mt-2 text-xs text-slate-500">{subtitulo}</p>
 </article>;
}
function Seccion({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
 return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-[#123E70]">{titulo}</h2>{subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}</div>{children}</section>;
}

export default async function ReportesPage({ searchParams }: Props) {
 await exigirRol(["SUPER_ADMIN", "ADMIN"]);
 const params = await searchParams;
 const ahora = new Date();
 const defecto = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
 const valido = typeof params.mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mes) && Number(params.mes.slice(0,4)) >= 2020 && Number(params.mes.slice(0,4)) <= 2100;
 const mes = valido ? params.mes! : defecto;
 const [y, m] = mes.split("-").map(Number);
 const inicio = new Date(Date.UTC(y, m-1, 1));
 const fin = new Date(Date.UTC(y, m, 1));
 const seisInicio = new Date(Date.UTC(y, m-6, 1));
 const meses = Array.from({length:6}, (_,i)=>new Date(Date.UTC(y, m-6+i, 1)));
 const [ventas, cobros, gastos, despachos, abiertos, productosActivos] = await Promise.all([
  prisma.venta.findMany({where:{fecha:{gte:seisInicio,lt:fin}, estado:{not:"ANULADA"}, moneda:"PEN"},select:{id:true,fecha:true,importeTotal:true,saldoPendiente:true,estado:true,cliente:{select:{razonSocial:true}},detalles:{select:{cantidad:true,precioUnitario:true,descuento:true,producto:{select:{nombre:true,precioCompra:true}}}}}}),
  prisma.pago.findMany({where:{fecha:{gte:seisInicio,lt:fin},venta:{moneda:"PEN",estado:{not:"ANULADA"}}},select:{monto:true,fecha:true,metodoPago:true}}),
  prisma.gasto.findMany({where:{fecha:{gte:seisInicio,lt:fin}},select:{monto:true,fecha:true,tipoGasto:true}}),
  prisma.despacho.findMany({where:{OR:[{hojaRuta:{fecha:{gte:inicio,lt:fin}}},{entregadoEn:{gte:inicio,lt:fin}}]},select:{id:true,estado:true,entregadoEn:true,hojaRuta:{select:{fecha:true}}}}),
  prisma.venta.aggregate({where:{moneda:"PEN",estado:{not:"ANULADA"},saldoPendiente:{gt:0}},_sum:{saldoPendiente:true},_count:{id:true}}),
  prisma.producto.count({where:{estado:true}}),
 ]);
 const dentro = (d:Date)=> d >= inicio && d < fin;
 const ventasMes=ventas.filter(v=>dentro(v.fecha));
 const cobrosMes=cobros.filter(p=>dentro(p.fecha));
 const gastosMes=gastos.filter(g=>dentro(g.fecha));
 const facturado=sumar(ventasMes.map(v=>Number(v.importeTotal)));
 const cobrado=sumar(cobrosMes.map(p=>Number(p.monto)));
 const gastoTotal=sumar(gastosMes.map(g=>Number(g.monto)));
 const saldoVentasMes=sumar(ventasMes.map(v=>Number(v.saldoPendiente)));
 const progreso=pct(cobrado,facturado);
 const entregados=despachos.filter(d=>d.estado==="ENTREGADO" && d.entregadoEn && dentro(d.entregadoEn)).length;
 const rutasMes=despachos.filter(d=>d.hojaRuta && dentro(d.hojaRuta.fecha));
 const programados=rutasMes.filter(d=>d.estado==="PENDIENTE").length;
 const enRuta=rutasMes.filter(d=>d.estado==="EN_RUTA").length;
 const reprogramados=rutasMes.filter(d=>d.estado==="REPROGRAMADO").length;
 const evolucion=meses.map(fecha=>{
  const yy=fecha.getUTCFullYear(), mm=fecha.getUTCMonth();
  const match=(d:Date)=>d.getUTCFullYear()===yy && d.getUTCMonth()===mm;
  return {label:mesNombre(fecha),ventas:sumar(ventas.filter(v=>match(v.fecha)).map(v=>Number(v.importeTotal))),cobros:sumar(cobros.filter(p=>match(p.fecha)).map(p=>Number(p.monto))),gastos:sumar(gastos.filter(g=>match(g.fecha)).map(g=>Number(g.monto)))};
 });
 const maximo=Math.max(1,...evolucion.flatMap(t=>[t.ventas,t.cobros,t.gastos]));
 const cobrosMetodos=new Map<string,number>();
 for(const p of cobrosMes) cobrosMetodos.set(p.metodoPago,(cobrosMetodos.get(p.metodoPago)??0)+Number(p.monto));
 const metodos=[...cobrosMetodos.entries()].sort((a,b)=>b[1]-a[1]);
 const clientes=new Map<string,{total:number,ventas:number}>();
 const productos=new Map<string,{unidades:number,ventas:number}>();
 for(const v of ventasMes){
  const nombre=v.cliente.razonSocial;
  const actual=clientes.get(nombre)??{total:0,ventas:0};actual.total+=Number(v.importeTotal);actual.ventas++;clientes.set(nombre,actual);
  for(const d of v.detalles){const p=productos.get(d.producto.nombre)??{unidades:0,ventas:0};p.unidades+=d.cantidad;p.ventas++;productos.set(d.producto.nombre,p);}
 }
 const mejoresClientes=[...clientes.entries()].sort((a,b)=>b[1].total-a[1].total).slice(0,5);
 const mejoresProductos=[...productos.entries()].sort((a,b)=>b[1].unidades-a[1].unidades).slice(0,5);
 const categorias=new Map<string,number>(); for(const g of gastosMes) categorias.set(g.tipoGasto,(categorias.get(g.tipoGasto)??0)+Number(g.monto));
 const principalesGastos=[...categorias.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
 // Estimación comercial; NO equivale a costo histórico de los lotes despachados.
 // Se distribuye el importe neto de cada venta entre sus líneas proporcionalmente
 // a su valor de lista, evitando contar descuentos globales más de una vez.
 const rentabilidad = new Map<string, { unidades: number; ingresos: number; costo: number; faltanCostos: boolean }>();
 for (const v of ventasMes) {
  const pesos = v.detalles.map(d => Math.max(0, d.cantidad * Number(d.precioUnitario) - Number(d.descuento)));
  const totalPesos = sumar(pesos);
  v.detalles.forEach((d, i) => {
   const nombre = d.producto.nombre;
   const dato = rentabilidad.get(nombre) ?? { unidades: 0, ingresos: 0, costo: 0, faltanCostos: false };
   dato.unidades += d.cantidad;
   dato.ingresos += totalPesos > 0 ? Number(v.importeTotal) * pesos[i] / totalPesos : 0;
   const costoUnit = Number(d.producto.precioCompra);
   if (costoUnit <= 0) dato.faltanCostos = true;
   else dato.costo += costoUnit * d.cantidad;
   rentabilidad.set(nombre, dato);
  });
 }
 const rentables = [...rentabilidad.entries()].sort((a,b)=>b[1].ingresos-a[1].ingresos).slice(0,10);
 const ingresosConCosto = [...rentabilidad.values()].filter(d=>!d.faltanCostos);
 const margenEstimado = sumar(ingresosConCosto.map(x=>x.ingresos-x.costo));
 const productosSinCosto = [...rentabilidad.values()].filter(x=>x.faltanCostos).length;
 const mesAnterior = evolucion[evolucion.length-2];
 const diferencia = (actual:number, anterior:number) => anterior > 0 ? ((actual - anterior) / anterior) * 100 : null;
 const comparativos = [
  {nombre:'Ventas',actual:facturado,anterior:mesAnterior.ventas},
  {nombre:'Cobros',actual:cobrado,anterior:mesAnterior.cobros},
  {nombre:'Gastos',actual:gastoTotal,anterior:mesAnterior.gastos},
 ];

 const recientes=[...ventasMes].sort((a,b)=>b.fecha.getTime()-a.fecha.getTime()).slice(0,10);
 return <main className="mx-auto max-w-7xl space-y-6 pb-12">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Gestión / Analítica</p><h1 className="mt-1 text-3xl font-bold text-[#123E70]">Reportes y BI</h1><p className="mt-1 text-slate-500">Indicadores operativos, tendencias y detalle de actividad de BORSUAS.</p></div>
   <form className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3" method="GET"><label className="text-xs font-semibold text-slate-600"><span className="mb-1 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/> Período del reporte</span><input type="month" name="mes" defaultValue={mes} className="block rounded-lg border border-slate-300 px-3 py-2 text-sm"/></label><button className="rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]">Aplicar filtro</button></form>
   <div className="flex flex-wrap gap-2">
    <Link href={`/dashboard/reportes/exportar?mes=${mes}&formato=csv`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#123E70] hover:bg-slate-50"><Download className="h-4 w-4"/> Exportar a Excel (CSV)</Link>
    <Link href={`/dashboard/reportes/exportar?mes=${mes}&formato=pdf`} className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]"><FileText className="h-4 w-4"/> Descargar PDF</Link>
   </div>
  </header>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Tarjeta titulo="Ventas emitidas · PEN" valor={pen(facturado)} subtitulo={`${entero(ventasMes.length)} venta(s) emitidas en el mes`} icono={ShoppingCart}/>
   <Tarjeta titulo="Cobros registrados · PEN" valor={pen(cobrado)} subtitulo={`${entero(cobrosMes.length)} pago(s) recibidos en el mes`} icono={Wallet} tono="green"/>
   <Tarjeta titulo="Cuentas por cobrar · PEN" valor={pen(Number(abiertos._sum.saldoPendiente??0))} subtitulo={`${entero(abiertos._count.id)} venta(s) con saldo; cartera total`} icono={CreditCard} tono="amber"/>
   <Tarjeta titulo="Gastos operativos · PEN" valor={pen(gastoTotal)} subtitulo={`${entero(gastosMes.length)} gasto(s) registrados en el mes`} icono={ReceiptText} tono="violet"/>
   <Tarjeta titulo="Saldo pendiente de ventas del mes" valor={pen(saldoVentasMes)} subtitulo="Saldo actual de ventas emitidas en el período" icono={ArrowDownRight} tono="amber"/>
   <Tarjeta titulo="Entregas confirmadas" valor={entero(entregados)} subtitulo="Confirmadas durante el mes seleccionado" icono={PackageCheck} tono="green"/>
   <Tarjeta titulo="Despachos activos" valor={entero(programados+enRuta)} subtitulo={`${programados} pendientes · ${enRuta} en ruta (rutas del mes)`} icono={Truck}/>
   <Tarjeta titulo="Productos activos" valor={entero(productosActivos)} subtitulo={`${reprogramados} despacho(s) reprogramados en rutas del mes`} icono={BarChart3} tono="violet"/>
  </div>
  <Seccion titulo="Comparación con el mes anterior" subtitulo={`Período actual: ${mes}. Las variaciones usan totales de períodos completos disponibles y no incluyen USD.`}>
   <div className="grid gap-3 sm:grid-cols-3">{comparativos.map(c => {const cambio=diferencia(c.actual,c.anterior);return <div key={c.nombre} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-600">{c.nombre}</p><p className="mt-2 text-xl font-bold text-[#123E70]">{pen(c.actual)}</p><p className="mt-1 text-xs text-slate-500">Mes anterior: {pen(c.anterior)}</p><div className="mt-2 flex items-center gap-1 text-xs font-semibold">{cambio===null?<span className="text-slate-500">Sin base para calcular variación</span>:<><span className={cambio>=0?"text-emerald-700":"text-rose-700"}>{cambio>=0?<TrendingUp className="inline h-4 w-4"/>:<TrendingDown className="inline h-4 w-4"/>} {cambio>=0?'+':''}{cambio.toFixed(1)} %</span></>}</div></div>})}</div>
  </Seccion>
  <div className="grid gap-5 lg:grid-cols-5">
   <div className="lg:col-span-3"><Seccion titulo="Evolución de los últimos seis meses" subtitulo="Ventas emitidas, pagos recibidos y gastos operativos en PEN.">
    <div className="mb-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#123E70]"/>Ventas</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500"/>Cobros</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-amber-400"/>Gastos</span></div>
    <div className="grid h-56 grid-cols-6 items-end gap-2 border-b border-slate-200 pb-2 sm:gap-4">{evolucion.map(t=><div key={t.label} className="flex h-full min-w-0 items-end justify-center gap-1" title={`${t.label}: ventas ${pen(t.ventas)} · cobros ${pen(t.cobros)} · gastos ${pen(t.gastos)}`}><div className="w-1/3 rounded-t-sm bg-[#123E70]" style={{height:`${Math.max(t.ventas>0?2:0,100*t.ventas/maximo)}%`}}/><div className="w-1/3 rounded-t-sm bg-emerald-500" style={{height:`${Math.max(t.cobros>0?2:0,100*t.cobros/maximo)}%`}}/><div className="w-1/3 rounded-t-sm bg-amber-400" style={{height:`${Math.max(t.gastos>0?2:0,100*t.gastos/maximo)}%`}}/></div>)}</div>
    <div className="mt-2 grid grid-cols-6 gap-2 text-center text-[10px] text-slate-500 sm:text-xs">{evolucion.map(t=><span key={t.label}>{t.label}</span>)}</div><p className="mt-4 text-xs text-slate-500">Pasa el cursor sobre cada grupo para ver los importes. La escala compara los seis meses.</p>
   </Seccion></div>
   <div className="lg:col-span-2"><Seccion titulo="Cobranza del período" subtitulo="Los cobros pueden corresponder a ventas de meses anteriores.">
    <div className="flex items-baseline justify-between gap-2"><span className="text-3xl font-bold text-[#123E70]">{pen(cobrado)}</span><span className="text-sm text-slate-500">{entero(cobrosMes.length)} pagos</span></div>
    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${progreso}%`}}/></div><p className="mt-2 text-xs text-slate-500">Cobros / ventas emitidas del mes: {progreso.toFixed(0)}% (comparación indicativa, no tasa de recuperación de esa cohorte).</p>
    <h3 className="mt-6 mb-3 text-sm font-bold text-[#123E70]">Cobros por medio de pago</h3>{metodos.length?metodos.map(([nombre,valor])=><div key={nombre} className="mb-3"><div className="mb-1 flex justify-between gap-2 text-xs"><span>{nombre.replaceAll("_"," ")}</span><b>{pen(valor)}</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-sky-500" style={{width:`${pct(valor,cobrado)}%`}}/></div></div>):<p className="text-sm text-slate-500">No hay cobros en este período.</p>}
   </Seccion></div>
  </div>
  <div className="grid gap-5 lg:grid-cols-2">
   <Seccion titulo="Clientes con mayor facturación" subtitulo="Ranking por importe de ventas del período (PEN).">{mejoresClientes.length?mejoresClientes.map(([nombre,data],i)=><div key={nombre} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#123E70]">{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{nombre}</p><p className="text-xs text-slate-500">{data.ventas} venta(s)</p></div><b className="text-sm text-[#123E70]">{pen(data.total)}</b></div>):<p className="text-sm text-slate-500">No hay ventas registradas.</p>}</Seccion>
   <Seccion titulo="Productos más vendidos" subtitulo="Unidades facturadas en ventas del mes, no stock físico.">{mejoresProductos.length?mejoresProductos.map(([nombre,data],i)=><div key={nombre} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{nombre}</p><p className="text-xs text-slate-500">{data.ventas} línea(s) de venta</p></div><b className="text-sm text-[#123E70]">{entero(data.unidades)} uds.</b></div>):<p className="text-sm text-slate-500">Sin productos vendidos este mes.</p>}</Seccion>
   <Seccion titulo="Gastos por categoría" subtitulo="Distribución de egresos operativos de este período.">{principalesGastos.length?principalesGastos.map(([nombre,valor])=><div key={nombre} className="mb-4"><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{nombre}</span><b className="text-[#123E70]">{pen(valor)}</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500" style={{width:`${pct(valor,gastoTotal)}%`}}/></div></div>):<p className="text-sm text-slate-500">Sin gastos registrados en este período.</p>}<Link className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#123E70] hover:bg-slate-50" href="/dashboard/gastos"><ReceiptText className="h-4 w-4"/> Ver gastos</Link></Seccion>
   <Seccion titulo="Estado de despachos" subtitulo="Despachos asignados a hojas de ruta del período seleccionado."><div className="grid grid-cols-2 gap-3">{[["Pendientes",programados,"bg-slate-50"],["En ruta",enRuta,"bg-sky-50"],["Reprogramados",reprogramados,"bg-amber-50"],["Entregados del mes",entregados,"bg-emerald-50"]].map(([name,value,bg])=><div key={String(name)} className={`rounded-xl p-4 ${bg}`}><p className="text-xs text-slate-600">{name}</p><p className="mt-1 text-2xl font-bold text-[#123E70]">{value}</p></div>)}</div><Link className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#123E70] hover:bg-slate-50" href="/dashboard/logistica/panel"><Truck className="h-4 w-4"/> Ver panel logístico</Link></Seccion>
  </div>
  <Seccion titulo="Rentabilidad estimada por producto" subtitulo="Ingreso neto distribuido por línea de venta menos costo de referencia actual (Producto.precioCompra). No representa costo histórico de lote ni utilidad contable.">
   <div className="mb-4 flex flex-wrap gap-3 rounded-xl bg-sky-50 p-4 text-sm text-[#123E70]"><span>Margen estimado de productos con costo completo: <b>{pen(margenEstimado)}</b></span><span>Productos sin costo de referencia: <b>{productosSinCosto}</b></span></div>
   <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Producto</th><th className="p-3 text-right">Unidades</th><th className="p-3 text-right">Ingreso asignado</th><th className="p-3 text-right">Costo estimado</th><th className="p-3 text-right">Margen estimado</th></tr></thead><tbody>{rentables.map(([nombre,d])=><tr key={nombre} className="border-t border-slate-100"><td className="p-3 font-semibold text-slate-800">{nombre}</td><td className="p-3 text-right">{d.unidades}</td><td className="p-3 text-right">{pen(d.ingresos)}</td><td className="p-3 text-right">{d.faltanCostos?'No disponible':pen(d.costo)}</td><td className="p-3 text-right font-semibold">{d.faltanCostos?'Sin cálculo':pen(d.ingresos-d.costo)}</td></tr>)}</tbody></table>{rentables.length===0&&<p className="p-4 text-sm text-slate-500">Sin ventas de productos en este período.</p>}</div><p className="mt-3 text-xs text-amber-800">El costo actual puede diferir del costo al vender. No incluye impuestos, fletes, salarios ni gastos indirectos. No usar como utilidad financiera cerrada.</p>
  </Seccion>
  <Seccion titulo="Detalle de ventas recientes" subtitulo="Últimas diez ventas emitidas en el período seleccionado."><div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Venta</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Estado</th><th className="p-3 text-right">Total PEN</th><th className="p-3 text-right">Saldo actual</th><th className="p-3"></th></tr></thead><tbody>{recientes.map(v=><tr key={v.id} className="border-t border-slate-100"><td className="p-3 font-semibold text-[#123E70]">VEN-{String(v.id).padStart(5,"0")}</td><td className="p-3">{fechaPE(v.fecha)}</td><td className="p-3">{v.cliente.razonSocial}</td><td className="p-3 text-xs">{v.estado.replaceAll("_"," ")}</td><td className="p-3 text-right">{pen(Number(v.importeTotal))}</td><td className="p-3 text-right">{pen(Number(v.saldoPendiente))}</td><td className="p-3"><Link className="font-semibold text-[#087EBD] hover:underline" href={`/dashboard/ventas/${v.id}`}>Ver</Link></td></tr>)}</tbody></table>{!recientes.length&&<p className="p-4 text-sm text-slate-500">No hay ventas para el mes seleccionado.</p>}</div></Seccion>
  <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0"/><p><strong>Alcance del reporte:</strong> cifras operativas en soles (PEN), sin convertir USD. Ventas agrupadas por fecha de emisión; cobros y gastos por fecha de registro; cuentas por cobrar es el saldo actual de toda la cartera, no solo del mes. No es utilidad neta ni caja conciliada. No se descuentan costos de mercadería ni pagos de compras.</p></div>
 </main>;
}
