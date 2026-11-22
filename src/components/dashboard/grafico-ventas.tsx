import { BarChart3 } from "lucide-react";

type Mes = { etiqueta: string; soles: number; dolares: number; cantidad: number };
const soles = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dolares = (n: number) => `USD ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function GraficoVentas({ meses }: { meses: Mes[] }) {
  const max = Math.max(1, ...meses.map((m) => m.soles));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-base font-bold text-[#123E70]">Evolución de ventas</h2><p className="text-xs text-slate-500">Últimos 6 meses · Importes en soles (PEN)</p></div>
        <div className="rounded-xl bg-sky-50 p-2 text-[#087EBD]"><BarChart3 className="h-5 w-5" /></div>
      </div>
      <div className="grid h-52 grid-cols-6 items-end gap-2 border-b border-slate-200 pb-1 sm:gap-4" role="img" aria-label="Gráfico de columnas: ventas mensuales en soles">
        {meses.map((mes, i) => (
          <div key={i} className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5" title={`${mes.etiqueta}: ${soles(mes.soles)} en ${mes.cantidad} ventas; ${dolares(mes.dolares)} en dólares`}>
            <span className="max-w-full truncate text-[10px] font-semibold text-slate-600">{mes.soles > 0 ? mes.soles.toLocaleString("es-PE", { notation: "compact", maximumFractionDigits: 1 }) : "0"}</span>
            <div className="flex h-[165px] w-full items-end justify-center">
              <div className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-[#123E70] to-[#087EBD] transition-all" style={{ height: `${mes.soles ? Math.max(4, (mes.soles / max) * 100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2 text-center text-[11px] text-slate-500">{meses.map((m, i) => <span key={i}>{m.etiqueta}</span>)}</div>
      <p className="mt-4 text-xs text-slate-500">Las ventas en USD no se suman a las de PEN. Pasa el cursor sobre una barra para ver ambas monedas.</p>
    </section>
  );
}

export function GraficoCotizaciones({ datos }: { datos: { etiqueta: string; cantidad: number; clase: string }[] }) {
  const total = datos.reduce((s, d) => s + d.cantidad, 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-[#123E70]">Estado de cotizaciones</h2>
      <p className="mb-5 text-xs text-slate-500">Distribución actual de propuestas y versiones</p>
      <div className="space-y-4">
        {datos.map((d) => (
          <div key={d.etiqueta} className="space-y-1.5">
            <div className="flex justify-between gap-2 text-xs"><span className="text-slate-600">{d.etiqueta}</span><span className="font-semibold text-[#123E70]">{d.cantidad}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${d.clase}`} style={{ width: `${total ? d.cantidad * 100 / total : 0}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-500">Total de cotizaciones registradas: {total}</p>
    </section>
  );
}
