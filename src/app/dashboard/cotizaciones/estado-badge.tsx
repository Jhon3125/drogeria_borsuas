import type { EstadoCotizacion } from "@/generated/prisma/enums";

const CLASES: Record<EstadoCotizacion, string> = {
  BORRADOR: "border-slate-200 bg-slate-100 text-slate-700",
  EMITIDA: "border-sky-200 bg-sky-100 text-sky-800",
  ACEPTADA: "border-emerald-200 bg-emerald-100 text-emerald-800",
  RECHAZADA: "border-rose-200 bg-rose-100 text-rose-800",
  VENCIDA: "border-amber-200 bg-amber-100 text-amber-800",
  ANULADA: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function EstadoCotizacionBadge({ estado }: { estado: EstadoCotizacion }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${CLASES[estado]}`}>{estado.replaceAll("_", " ")}</span>;
}
