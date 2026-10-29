
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Package,
  Search,
  TriangleAlert,
} from "lucide-react";

import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_LECTURA } from "@/lib/compras-roles";
import { consultarInventarioRespaldado } from "@/lib/inventario/lotes-respaldados";

type Props = {
  searchParams: Promise<{
    q?: string;
    estado?: string;
  }>;
};

type EstadoLote =
  | "VENCIDO"
  | "PROXIMO"
  | "VIGENTE"
  | "AGOTADO";

const ESTADOS: EstadoLote[] = [
  "VENCIDO",
  "PROXIMO",
  "VIGENTE",
  "AGOTADO",
];

function fechaHoyPeru() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

function diasHastaVencimiento(
  vencimiento: Date,
  hoyISO: string
) {
  // Comparamos días calendario, no horas transcurridas.
  // Los vencimientos se interpretan como fechas UTC.
  const hoyUTC = new Date(`${hoyISO}T00:00:00.000Z`);
  const fechaUTC = Date.UTC(
    vencimiento.getUTCFullYear(),
    vencimiento.getUTCMonth(),
    vencimiento.getUTCDate()
  );

  return Math.round(
    (fechaUTC - hoyUTC.getTime()) / 86400000
  );
}

function obtenerEstado(
  cantidadDisponible: number,
  dias: number
): EstadoLote {
  if (cantidadDisponible <= 0) return "AGOTADO";
  if (dias < 0) return "VENCIDO";
  if (dias <= 30) return "PROXIMO";
  return "VIGENTE";
}

function estiloEstado(estado: EstadoLote) {
  switch (estado) {
    case "VENCIDO":
      return {
        texto: "Vencido",
        clase: "bg-red-50 text-red-700",
      };
    case "PROXIMO":
      return {
        texto: "Próximo a vencer",
        clase: "bg-amber-50 text-amber-700",
      };
    case "AGOTADO":
      return {
        texto: "Agotado",
        clase: "bg-slate-100 text-slate-600",
      };
    default:
      return {
        texto: "Vigente",
        clase: "bg-emerald-50 text-emerald-700",
      };
  }
}

function detalleVencimiento(
  estado: EstadoLote,
  dias: number
) {
  if (estado === "AGOTADO") return "Sin existencias";
  if (dias < 0) return `Venció hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return "Vence hoy";
  return `Faltan ${dias} día(s)`;
}

export default async function LotesPage({
  searchParams,
}: Props) {
  await exigirRol(ROLES_COMPRAS_LECTURA);

  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const estadoSeleccionado = ESTADOS.find(
    (item) => item === params.estado
  );

  const productos = await consultarInventarioRespaldado();
  const hoyISO = fechaHoyPeru();

  const lotes = productos
    .flatMap((producto) =>
      producto.lotes.map((lote) => {
        const dias = diasHastaVencimiento(
          lote.fechaVencimiento,
          hoyISO
        );

        return {
          ...lote,
          productoId: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          dias,
          estado: obtenerEstado(
            lote.cantidadDisponible,
            dias
          ),
        };
      })
    )
    .sort(
      (a, b) =>
        a.fechaVencimiento.getTime() -
        b.fechaVencimiento.getTime()
    );

  // Los indicadores muestran el universo completo,
  // independientemente de los filtros de la tabla.
  const vencidos = lotes.filter(
    (lote) => lote.estado === "VENCIDO"
  ).length;

  const proximos = lotes.filter(
    (lote) => lote.estado === "PROXIMO"
  ).length;

  const vigentes = lotes.filter(
    (lote) => lote.estado === "VIGENTE"
  ).length;

  const agotados = lotes.filter(
    (lote) => lote.estado === "AGOTADO"
  ).length;

  const lotesFiltrados = lotes.filter((lote) => {
    const texto = [
      lote.nombre,
      lote.codigo,
      lote.numeroLote,
    ]
      .join(" ")
      .toLocaleLowerCase("es-PE");

    const coincideBusqueda =
      !q || texto.includes(q.toLocaleLowerCase("es-PE"));

    const coincideEstado =
      !estadoSeleccionado ||
      lote.estado === estadoSeleccionado;

    return coincideBusqueda && coincideEstado;
  });

  const indicadores = [
    {
      titulo: "Lotes vencidos",
      valor: vencidos,
      icono: TriangleAlert,
      color: "text-red-700",
    },
    {
      titulo: "Vencen en 30 días",
      valor: proximos,
      icono: Clock3,
      color: "text-amber-700",
    },
    {
      titulo: "Lotes vigentes",
      valor: vigentes,
      icono: CheckCircle2,
      color: "text-emerald-700",
    },
    {
      titulo: "Lotes agotados",
      valor: agotados,
      icono: Package,
      color: "text-slate-600",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-secondary p-3 text-primary">
          <CalendarClock className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123E70] sm:text-3xl">
            Lotes y vencimientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de fechas y existencias de lotes
            respaldados por compras recibidas.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => {
          const Icono = indicador.icono;

          return (
            <div
              key={indicador.titulo}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-center gap-2">
                <Icono
                  className={`h-4 w-4 ${indicador.color}`}
                />
                <p className="text-sm text-muted-foreground">
                  {indicador.titulo}
                </p>
              </div>

              <p
                className={`mt-3 text-3xl font-bold ${indicador.color}`}
              >
                {indicador.valor}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="space-y-4 border-b px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-semibold">
              Directorio de lotes
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ordenados por fecha de vencimiento,
              priorizando los más próximos.
            </p>
          </div>

          <form
            method="get"
            className="flex flex-wrap gap-3"
          >
            <div className="relative min-w-52 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                name="q"
                defaultValue={q}
                placeholder="Producto, código o número de lote..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              name="estado"
              defaultValue={
                estadoSeleccionado ?? "TODOS"
              }
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="TODOS">
                Todos los estados
              </option>
              <option value="VENCIDO">
                Vencidos
              </option>
              <option value="PROXIMO">
                Próximos a vencer
              </option>
              <option value="VIGENTE">
                Vigentes
              </option>
              <option value="AGOTADO">
                Agotados
              </option>
            </select>

            <button
              type="submit"
              className="h-10 rounded-lg bg-[#123E70] px-4 text-sm font-medium text-white hover:bg-[#0c315b]"
            >
              Buscar
            </button>

            {(q || estadoSeleccionado) && (
              <Link
                href="/dashboard/lotes"
                className="self-center text-sm text-primary hover:underline"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-4 py-4">N.º lote</th>
                <th className="px-4 py-4">Vencimiento</th>
                <th className="px-4 py-4 text-right">
                  Existencias
                </th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-6 py-4">
                  Compras de origen
                </th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {lotesFiltrados.map((lote) => {
                const visual = estiloEstado(
                  lote.estado
                );

                return (
                  <tr
                    key={lote.id}
                    className="hover:bg-secondary/20"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/inventario/producto/${lote.productoId}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {lote.nombre}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lote.codigo}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-medium">
                      {lote.numeroLote}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {lote.fechaVencimiento.toLocaleDateString(
                          "es-PE",
                          { timeZone: "UTC" }
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {detalleVencimiento(
                          lote.estado,
                          lote.dias
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-right font-semibold">
                      {lote.cantidadDisponible}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${visual.clase}`}
                      >
                        {visual.texto}
                      </span>
                    </td>

                    <td className="px-12 py-4">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {lote.compras.map((compra) => (
                          <Link
                            key={compra.compraId}
                            href={`/dashboard/compras/${compra.compraId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            OC-
                            {String(
                              compra.compraId
                            ).padStart(4, "0")}
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/lotes/${lote.id}`}
                        className="inline-flex items-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium text-primary hover:bg-secondary"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {lotesFiltrados.length === 0 && (
            <div className="px-6 py-14 text-center">
              <Package className="mx-auto h-9 w-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-semibold">
                No se encontraron lotes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prueba con otro producto, lote o estado.
              </p>
            </div>
          )}
        </div>

        <div className="border-t bg-secondary/20 px-6 py-3 text-xs text-muted-foreground">
          Mostrando {lotesFiltrados.length} de{" "}
          {lotes.length} lotes respaldados.
          Los registros de inventario no conciliados
          no se incluyen.
        </div>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Las existencias mostradas son cantidades físicas
        registradas por lote. Un lote vencido puede tener
        existencias, pero no debe considerarse apto para
        despacho o venta. La aplicación del criterio FEFO
        deberá validarse también en las operaciones de salida.
      </p>
    </main>
  );
}
