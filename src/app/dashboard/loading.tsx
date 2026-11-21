/** Se muestra mientras Next.js obtiene los datos de la sección. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Cargando sección" className="mx-auto w-full max-w-7xl animate-pulse space-y-6 pb-8">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-slate-200" />
        <div className="h-9 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-6 h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-100" />
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando información...</span>
    </div>
  );
}
