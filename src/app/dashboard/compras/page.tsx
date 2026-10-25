
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  PackageCheck,
  PackageSearch,
  SearchX,
  Eye,
} from "lucide-react";

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import {
  ROLES_COMPRAS_LECTURA,
  ROLES_COMPRAS_GESTION,
} from "@/lib/compras-roles";

import {
  calcularSituacionEntrega,
  formatearFechaEntrega,
  type SituacionEntrega,
} from "@/lib/compras/seguimiento-entregas";

import type { Prisma } from "@/generated/prisma/client";

import { MetricCard } from "@/components/dashboard/metric-card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CompraDialog } from "./compra-dialog";
import { FiltrosCompras } from "./filtros";

type Filtros = {
  q?: string;
  estado?: string;
};

const ESTADOS = ["PENDIENTE", "PARCIAL", "RECIBIDO"] as const;

function simboloMoneda(moneda: string) {
  return moneda === "USD" ? "US$" : "S/";
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "PARCIAL":
      return "Recepción parcial";
    case "RECIBIDO":
      return "Recibida";
    default:
      return estado;
  }
}

function claseEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-50 text-amber-700";
    case "PARCIAL":
      return "bg-blue-50 text-blue-700";
    case "RECIBIDO":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

const configuracionEntrega: Record<
  SituacionEntrega,
  { texto: string; clase: string }
> = {
  RECIBIDA: {
    texto: "Recibida",
    clase: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  SIN_FECHA: {
    texto: "Sin fecha",
    clase: "bg-slate-50 text-slate-600 border-slate-200",
  },
  ATRASADA: {
    texto: "Atrasada",
    clase: "bg-red-50 text-red-700 border-red-200",
  },
  HOY: {
    texto: "Vence hoy",
    clase: "bg-amber-50 text-amber-800 border-amber-200",
  },
  PROGRAMADA: {
    texto: "Programada",
    clase: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

function IndicadorEntrega({
  estado,
  fecha,
}: {
  estado: string;
  fecha: Date | null;
}) {
  const situacion = calcularSituacionEntrega({
    estado,
    fechaEntregaEstimada: fecha,
  });

  const configuracion = configuracionEntrega[situacion];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-foreground">
        {formatearFechaEntrega(fecha)}
      </span>

      <span
        className={`w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${configuracion.clase}`}
      >
        {configuracion.texto}
      </span>
    </div>
  );
}


export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  const usuario = await exigirRol(ROLES_COMPRAS_LECTURA);

  const puedeGestionar = ROLES_COMPRAS_GESTION.includes(
    usuario.rol
  );

  const params = await searchParams;

  const q = (params.q ?? "").trim();

  const estado = ESTADOS.includes(
    params.estado as (typeof ESTADOS)[number]
  )
    ? params.estado!
    : "TODOS";

  const idBuscado = /^\d+$/.test(q)
    ? Number(q)
    : /^OC-(\d+)$/i.test(q)
      ? Number(q.match(/^OC-(\d+)$/i)?.[1])
      : null;

  const where: Prisma.CompraWhereInput = {
    ...(estado !== "TODOS" ? { estado } : {}),

    ...(q
      ? {
        OR: [
          {
            proveedor: {
              razonSocial: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
          ...(idBuscado !== null &&
            Number.isSafeInteger(idBuscado) &&
            idBuscado > 0
            ? [{ id: idBuscado }]
            : []),
        ],
      }
      : {}),
  };

  const [
    compras,
    totalFiltrado,
    totalOrdenes,
    totalPendientes,
    totalParciales,
    totalRecibidas,
  ] = await Promise.all([
    prisma.compra.findMany({
      where,
      take: 60,
      orderBy: [
        { fecha: "desc" },
        { id: "desc" },
      ],
      include: {
        proveedor: {
          select: {
            razonSocial: true,
          },
        },
        detalles: {
          select: {
            cantidad: true,
            recepciones: {
              select: {
                cantidad: true,
              },
            },
          },
        },
      },
    }),

    prisma.compra.count({ where }),

    prisma.compra.count(),

    prisma.compra.count({
      where: { estado: "PENDIENTE" },
    }),

    prisma.compra.count({
      where: { estado: "PARCIAL" },
    }),

    prisma.compra.count({
      where: { estado: "RECIBIDO" },
    }),
  ]);

  // Los datos para crear órdenes solo se consultan
  // cuando el rol tiene permisos de gestión.
  const [proveedores, productos] = puedeGestionar
    ? await Promise.all([
      prisma.proveedor.findMany({
        where: { estado: true },
        select: {
          id: true,
          razonSocial: true,
        },
        orderBy: { razonSocial: "asc" },
      }),

      prisma.producto.findMany({
        where: { estado: true },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          precioCompra: true,
          moneda: true,
        },
        orderBy: { nombre: "asc" },
      }),
    ])
    : [[], []];

  const hayFiltros = Boolean(q) || estado !== "TODOS";

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-6">
      {/* Encabezado */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Abastecimiento</span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium text-primary">
            Órdenes de Compra
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Órdenes de Compra
            </h1>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Gestiona las órdenes a proveedores y
              supervisa la recepción de mercadería.
            </p>
          </div>

          {puedeGestionar && (
            <CompraDialog
              proveedores={proveedores}
              productos={productos.map((p) => ({
                id: p.id,
                codigo: p.codigo,
                nombre: p.nombre,
                precioCompra:
                  p.precioCompra.toString(),
                moneda: p.moneda,
              }))}
            />
          )}
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Órdenes registradas"
          valor={totalOrdenes}
          descripcion="Total de órdenes generadas"
          icono={ClipboardList}
          color="blue"
        />

        <MetricCard
          titulo="Pendientes"
          valor={totalPendientes}
          descripcion="Aún sin recepción"
          icono={Clock3}
          color="amber"
        />

        <MetricCard
          titulo="Recepción parcial"
          valor={totalParciales}
          descripcion="Con cantidades por recibir"
          icono={PackageSearch}
          color="violet"
        />

        <MetricCard
          titulo="Recibidas"
          valor={totalRecibidas}
          descripcion="Con recepción completada"
          icono={PackageCheck}
          color="green"
        />
      </section>

      {/* Directorio */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="space-y-5 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">
                Directorio de órdenes
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Consulta las órdenes registradas
                y su progreso de recepción.
              </p>
            </div>
          </div>

          <FiltrosCompras q={q} estado={estado} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {totalFiltrado} orden(es) coinciden
              con los criterios actuales
            </p>

            {hayFiltros && (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                Filtros aplicados
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="pl-6">Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Entrega estimada</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="min-w-48">Recepción</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-56 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <SearchX className="h-6 w-6 text-primary" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          No se encontraron órdenes
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {hayFiltros
                            ? "Prueba con otros criterios de búsqueda."
                            : "Todavía no hay órdenes de compra registradas."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => {
                  const solicitado =
                    compra.detalles.reduce(
                      (suma, d) =>
                        suma + d.cantidad,
                      0
                    );

                  const recibido =
                    compra.detalles.reduce(
                      (suma, d) =>
                        suma +
                        d.recepciones.reduce(
                          (sub, r) =>
                            sub + r.cantidad,
                          0
                        ),
                      0
                    );

                  const porcentaje =
                    solicitado > 0
                      ? Math.min(
                        100,
                        Math.round(
                          (recibido /
                            solicitado) *
                          100
                        )
                      )
                      : 0;

                  return (
                    <TableRow
                      key={compra.id}
                      className="hover:bg-secondary/20"
                    >
                      <TableCell className="py-4 pl-6">
                        <p className="font-semibold text-primary">
                          OC-
                          {String(compra.id).padStart(
                            4,
                            "0"
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat(
                            "es-PE",
                            {
                              dateStyle:
                                "medium",
                              timeZone:
                                "America/Lima",
                            }
                          ).format(compra.fecha)}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="max-w-56 truncate text-sm font-medium">
                          {
                            compra.proveedor
                              .razonSocial
                          }
                        </p>
                      </TableCell>
                      
                      <TableCell>
                        <IndicadorEntrega
                          estado={compra.estado}
                          fecha={compra.fechaEntregaEstimada}
                        />
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <p className="font-semibold">
                          {simboloMoneda(
                            compra.moneda
                          )}{" "}
                          {compra.importeTotal.toFixed(
                            2
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {compra.moneda}
                        </p>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                            compra.estado
                          )}`}
                        >
                          {etiquetaEstado(
                            compra.estado
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium">
                              {recibido} /{" "}
                              {solicitado} uds.
                            </span>

                            <span className="text-muted-foreground">
                              {porcentaje}%
                            </span>
                          </div>

                          <div
                            role="progressbar"
                            aria-valuenow={
                              porcentaje
                            }
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Recepción de orden ${compra.id}`}
                            className="h-2 overflow-hidden rounded-full bg-secondary"
                          >
                            <div
                              className={`h-full rounded-full transition-all ${porcentaje ===
                                100
                                ? "bg-emerald-500"
                                : "bg-[#087EBD]"
                                }`}
                              style={{
                                width: `${porcentaje}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <Link
                          href={`/dashboard/compras/${compra.id}`}
                          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-input bg-background px-3 text-sm font-medium text-primary shadow-xs transition-colors hover:bg-secondary"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalle
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border bg-secondary/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {compras.length} de{" "}
            {totalFiltrado} orden(es) encontradas.
            {totalFiltrado > 60 &&
              " Se muestran las 60 órdenes más recientes; la paginación se incorporará posteriormente."}
          </p>
        </div>
      </section>
    </div>
  );
}
