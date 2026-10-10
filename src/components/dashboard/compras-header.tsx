
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  History,
  PackagePlus,
  Scale,
} from "lucide-react";

export function ComprasHeader() {
  return (
    <header className="space-y-5">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <span>Operaciones</span>
        <ArrowRight
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        <span className="font-medium text-[#123E70]">
          Compras
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-[#E1F0FC] text-[#087EBD]">
            <PackagePlus
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#123E70] sm:text-3xl">
              Compras y recepción
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Registra compras a proveedores, controla las
              recepciones y mantén la trazabilidad de los
              lotes.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ClipboardCheck
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
          Control de abastecimiento
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/inventario/conciliacion"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#123E70] shadow-sm transition hover:border-blue-200 hover:bg-[#F0F7FF]"
        >
          <Scale className="h-4 w-4" />
          Conciliar inventario y lotes
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          href="/dashboard/inventario/movimientos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#123E70] shadow-sm transition hover:border-blue-200 hover:bg-[#F0F7FF]"
        >
          <History className="h-4 w-4" />
          Historial de movimientos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
