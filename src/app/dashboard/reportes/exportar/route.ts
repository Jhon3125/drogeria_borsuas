import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

export const dynamic = "force-dynamic";
const dinero = (n: number) => `S/ ${n.toFixed(2)}`;
const total = (n: number[]) => n.reduce((a,b)=>a+b,0);
const limpio = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ");
const campo = (v: unknown) => {
  const raw = String(v ?? "");
  const seguro = /^[\s]*[=+@-]/.test(raw) && !/^-?\d+(?:\.\d+)?$/.test(raw.trim()) ? `'${raw}` : raw;
  return `"${seguro.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  const mes = req.nextUrl.searchParams.get("mes") ?? "";
  const formato = req.nextUrl.searchParams.get("formato");
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(mes) || !["csv", "pdf"].includes(formato ?? "")) {
    return new Response("Parámetros inválidos", {status: 400});
  }
  const [y,m] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(y,m-1,1));
  const fin = new Date(Date.UTC(y,m,1));
  const anterior = new Date(Date.UTC(y,m-2,1));
  const [ventas,pagos,gastos,despachos] = await Promise.all([
    prisma.venta.findMany({where:{fecha:{gte:anterior,lt:fin},moneda:"PEN",estado:{not:"ANULADA"}},orderBy:{fecha:"asc"},select:{id:true,fecha:true,estado:true,importeTotal:true,saldoPendiente:true,cliente:{select:{razonSocial:true}},detalles:{select:{cantidad:true,precioUnitario:true,descuento:true,producto:{select:{nombre:true,precioCompra:true}}}}}}),
    prisma.pago.findMany({where:{fecha:{gte:anterior,lt:fin},venta:{moneda:"PEN",estado:{not:"ANULADA"}}},select:{monto:true,fecha:true,metodoPago:true}}),
    prisma.gasto.findMany({where:{fecha:{gte:anterior,lt:fin}},select:{monto:true,fecha:true,tipoGasto:true}}),
    prisma.despacho.findMany({where:{entregadoEn:{gte:inicio,lt:fin}},select:{id:true,estado:true,entregadoEn:true}}),
  ]);
  const dentro=(d:Date,a:Date,b:Date)=>d>=a&&d<b;
  const vm=ventas.filter(v=>dentro(v.fecha,inicio,fin));
  const va=ventas.filter(v=>dentro(v.fecha,anterior,inicio));
  const pm=pagos.filter(p=>dentro(p.fecha,inicio,fin));
  const pa=pagos.filter(p=>dentro(p.fecha,anterior,inicio));
  const gm=gastos.filter(g=>dentro(g.fecha,inicio,fin));
  const ga=gastos.filter(g=>dentro(g.fecha,anterior,inicio));
  const ventasMes=total(vm.map(v=>Number(v.importeTotal)));
  const cobrosMes=total(pm.map(p=>Number(p.monto)));
  const gastosMes=total(gm.map(g=>Number(g.monto)));
  const comparativo=[
    ["Ventas",ventasMes,total(va.map(v=>Number(v.importeTotal)))],
    ["Cobros",cobrosMes,total(pa.map(p=>Number(p.monto)))],
    ["Gastos",gastosMes,total(ga.map(g=>Number(g.monto)))],
  ] as const;
  const productos = new Map<string,{cantidad:number,ingreso:number,costo:number,sinCosto:boolean}>();
  for (const v of vm) {
    const pesos=v.detalles.map(d=>Math.max(0,d.cantidad*Number(d.precioUnitario)-Number(d.descuento)));
    const pesoTotal=total(pesos);
    v.detalles.forEach((d,i)=>{
      const nombre=d.producto.nombre;
      const dato=productos.get(nombre)??{cantidad:0,ingreso:0,costo:0,sinCosto:false};
      dato.cantidad+=d.cantidad;
      dato.ingreso+=pesoTotal>0?Number(v.importeTotal)*pesos[i]/pesoTotal:0;
      const costo=Number(d.producto.precioCompra);
      if(costo<=0)dato.sinCosto=true; else dato.costo+=costo*d.cantidad;
      productos.set(nombre,dato);
    });
  }
  const rentables=[...productos.entries()].sort((a,b)=>b[1].ingreso-a[1].ingreso);
  const variacion=(a:number,b:number)=>b>0?`${((a-b)/b*100).toFixed(1)}%`:"Sin base";
  if (formato==="csv") {
    const rows:unknown[][]=[
      ["BORSUAS ERP - REPORTE OPERATIVO",mes],
      ["Moneda", "PEN"],
      ["Advertencia", "Margen estimado usando precioCompra actual; no es utilidad contable ni costo historico"],
      [],["COMPARATIVO","Mes actual","Mes anterior","Variacion"],
      ...comparativo.map(([n,a,b])=>[n,a.toFixed(2),b.toFixed(2),variacion(a,b)]),
      [],["PRODUCTO","Unidades","Ingreso asignado PEN","Costo estimado PEN","Margen estimado PEN"],
      ...rentables.map(([n,d])=>[n,d.cantidad,d.ingreso.toFixed(2),d.sinCosto?"No disponible":d.costo.toFixed(2),d.sinCosto?"Sin calculo":(d.ingreso-d.costo).toFixed(2)]),
      [],["VENTA","Fecha UTC","Cliente","Estado","Total PEN","Saldo actual PEN"],
      ...vm.map(v=>[`VEN-${String(v.id).padStart(5,"0")}`,v.fecha.toISOString().slice(0,10),v.cliente.razonSocial,v.estado,Number(v.importeTotal).toFixed(2),Number(v.saldoPendiente).toFixed(2)]),
    ];
    const contenido="\uFEFF"+rows.map(r=>r.map(campo).join(";")).join("\r\n");
    return new Response(contenido,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="BORSUAS-reporte-${mes}.csv"`,"Cache-Control":"private, no-store"}});
  }
  const pdf=await PDFDocument.create();
  const normal=await pdf.embedFont(StandardFonts.Helvetica);
  const negrita=await pdf.embedFont(StandardFonts.HelveticaBold);
  let pagina=pdf.addPage([595,842]);let pos=795;
  const linea=(texto:string,negritaActiva=false,tamano=10)=>{
    if(pos<65){pagina=pdf.addPage([595,842]);pos=795;}
    const contenido=limpio(texto).slice(0,108);
    pagina.drawText(contenido,{x:42,y:pos,size:tamano,font:negritaActiva?negrita:normal,color:rgb(0.09,0.24,0.44)});
    pos-=tamano+9;
  };
  linea(`BORSUAS ERP - Reporte operativo ${mes}`,true,17);pos-=8;
  linea("Moneda: PEN. Datos emitidos al momento de la descarga.");pos-=10;
  linea("Comparativo mensual",true,13);
  for(const [n,a,b] of comparativo)linea(`${n}: ${dinero(a)} | anterior ${dinero(b)} | ${variacion(a,b)}`);
  pos-=10;linea(`Entregas confirmadas: ${despachos.filter(d=>d.estado==="ENTREGADO").length}`,true);
  pos-=10;linea("Rentabilidad por producto (ESTIMADA)",true,13);
  for(const [nombre,d] of rentables){
    linea(`${nombre} | ${d.cantidad} uds | Ingreso ${dinero(d.ingreso)}`,true);
    linea(d.sinCosto?"Costo no disponible; margen no calculado":`Costo actual ${dinero(d.costo)} | margen ${dinero(d.ingreso-d.costo)}`);
  }
  pos-=10;linea("Ventas emitidas en el mes",true,13);
  for(const v of vm)linea(`VEN-${String(v.id).padStart(5,"0")} ${v.cliente.razonSocial} - ${dinero(Number(v.importeTotal))}`);
  pos-=10;linea("Nota: no incluye costo historico por lote, impuestos ni gastos indirectos.");
  linea("No representa utilidad neta o caja conciliada.");
  const bytes=await pdf.save();
  const buffer=new Uint8Array<ArrayBuffer>(new ArrayBuffer(bytes.length));buffer.set(bytes);
  return new Response(buffer,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="BORSUAS-reporte-${mes}.pdf"`,"Cache-Control":"private, no-store"}});
}
