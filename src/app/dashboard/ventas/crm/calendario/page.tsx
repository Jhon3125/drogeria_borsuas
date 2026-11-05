import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, ArrowLeft, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";

type Props = { searchParams: Promise<{ mes?: string }> };
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function mesValido(v?: string) {
  if (!v || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return null;
  const y = Number(v.slice(0, 4));
  if (y < 2000 || y > 2100) return null;
  return { y, m: Number(v.slice(5, 7)) - 1 };
}
function rutaMes(y: number, m: number) {
  return `/dashboard/ventas/crm/calendario?mes=${new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7)}`;
}
function fechaClave(d: Date) { return d.toISOString().slice(0, 10); }

export default async function CalendarioSeguimientos({ searchParams }: Props) {
  const usuario = await exigirRol(ROLES_COMERCIAL);
  const rol = usuario.rol;
  const esAdministrador = rol === "SUPER_ADMIN" || rol === "ADMIN";
  const params = await searchParams;
  const hoy = new Date();
  const fechaMes = mesValido(params.mes);
  const y = fechaMes?.y ?? hoy.getUTCFullYear();
  const m = fechaMes?.m ?? hoy.getUTCMonth();
  const comienzo = new Date(Date.UTC(y, m, 1));
  const final = new Date(Date.UTC(y, m + 1, 1));
  const registros = await prisma.oportunidadComercial.findMany({
    where: {
      ...(esAdministrador ? {} : { vendedorId: Number(usuario.id) }),
      etapa: { notIn: ["GANADA", "PERDIDA"] },
      fechaSeguimiento: { gte: comienzo, lt: final },
    },
    orderBy: [{ fechaSeguimiento: "asc" }, { id: "asc" }],
    select: {
      id: true, titulo: true, etapa: true, fechaSeguimiento: true,
      proximaActividad: true, cliente: { select: { razonSocial: true } },
      vendedor: { select: { nombre: true } },
    },
  });
  const agrupados = new Map<string, typeof registros>();
  for (const registro of registros) {
    if (!registro.fechaSeguimiento) continue;
    const clave = fechaClave(registro.fechaSeguimiento);
    agrupados.set(clave, [...(agrupados.get(clave) ?? []), registro]);
  }
  const cantidadDias = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const desplazamiento = (comienzo.getUTCDay() + 6) % 7;
  const celdas = [...Array.from({ length: desplazamiento }, () => null), ...Array.from({ length: cantidadDias }, (_, i) => i + 1)];
  const hoyClave = fechaClave(hoy);

  return <div className="mx-auto max-w-7xl space-y-5 pb-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link href="/dashboard/ventas/crm" className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4"/> Volver a Oportunidades</Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#123E70]"><CalendarDays className="h-6 w-6"/> Calendario de seguimientos</h1>
        <p className="mt-1 text-sm text-slate-600">Próximas actividades comerciales de oportunidades abiertas.</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={rutaMes(y, m - 1)} aria-label="Mes anterior" className="rounded-lg border bg-white p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4"/></Link>
        <span className="min-w-32 text-center text-sm font-semibold capitalize text-[#123E70]">{MESES[m]} {y}</span>
        <Link href={rutaMes(y, m + 1)} aria-label="Mes siguiente" className="rounded-lg border bg-white p-2 hover:bg-slate-50"><ChevronRight className="h-4 w-4"/></Link>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Seguimientos este mes</p><p className="mt-2 text-2xl font-bold text-[#123E70]">{registros.length}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Días con actividades</p><p className="mt-2 text-2xl font-bold text-[#123E70]">{agrupados.size}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Pendientes anteriores a hoy</p><p className="mt-2 text-2xl font-bold text-amber-700">{registros.filter(r => r.fechaSeguimiento && fechaClave(r.fechaSeguimiento) < hoyClave).length}</p></div>
    </div>
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50">{DIAS.map(d => <div key={d} className="border-b px-1 py-3 text-center text-xs font-semibold text-slate-600">{d}</div>)}</div>
      <div className="grid grid-cols-7">{celdas.map((dia, i) => {
        const clave = dia ? `${y}-${String(m + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}` : "";
        const actividades = agrupados.get(clave) ?? [];
        return <div key={i} className={`min-h-20 border-b border-r p-1.5 sm:min-h-32 sm:p-2 ${dia ? "" : "bg-slate-50"} ${clave === hoyClave ? "bg-sky-50" : ""}`}>
          {dia && <><div className="mb-1 flex justify-between"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${clave === hoyClave ? "bg-[#123E70] text-white" : "text-slate-700"}`}>{dia}</span>{actividades.length > 0 && <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-sky-800">{actividades.length}</span>}</div>
          {actividades.slice(0, 2).map(a => <Link key={a.id} href="/dashboard/ventas/crm" title={`${a.titulo} · ${a.cliente.razonSocial}`} className="mb-1 block truncate rounded bg-sky-100 px-1 py-1 text-[10px] font-medium text-[#123E70] hover:bg-sky-200">{a.cliente.razonSocial}</Link>)}
          {actividades.length > 2 && <p className="text-[10px] text-slate-500">+{actividades.length-2} más</p>}</>}
        </div>;
      })}</div>
    </section>
    <section className="rounded-xl border bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#123E70]">Actividades del mes</h2>
      {registros.length === 0 ? <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No hay seguimientos programados para este mes.</p> : <div className="space-y-2">{registros.map(r => <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
        <div><p className="text-sm font-semibold text-[#123E70]">{r.cliente.razonSocial} · OP-{String(r.id).padStart(4,"0")}</p><p className="mt-1 text-sm text-slate-700">{r.titulo}</p><p className="mt-1 text-xs text-slate-500">{r.proximaActividad || "Seguimiento comercial"} · {r.vendedor.nombre}</p></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"><Clock3 className="h-3 w-3"/>{r.fechaSeguimiento ? fechaClave(r.fechaSeguimiento).split("-").reverse().join("/") : ""}</span>
      </div>)}</div>}
    </section>
    <p className="text-xs text-slate-500">Este calendario muestra las fechas de seguimiento de las oportunidades abiertas. La hora, recordatorios automáticos y el cierre individual de tareas requieren funcionalidades adicionales.</p>
  </div>;
}
