import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { actualizarDespacho, recibirDevolucionDespacho } from "../actions";

type Props = {
  searchParams?: Promise<{ vista?: string | string[] }>;
};

function fechaActualLima() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function rangoDelDiaLima() {
  // Lima usa UTC-5. La medianoche local corresponde a las 05:00 UTC.
  const dia = fechaActualLima();
  const inicio = new Date(`${dia}T05:00:00.000Z`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

function formatoFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

function formatoFechaHora(fecha: Date) {
  return fecha.toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function estadoVisual(estado: string) {
  if (estado === "ENTREGADO") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (estado === "EN_RUTA") {
    return "bg-sky-100 text-sky-800";
  }
  if (estado === "REPROGRAMADO") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
}

function etiquetaEstado(estado: string) {
  return estado.replaceAll("_", " ");
}

async function VistaConductor({
  usuario,
  vista,
}: {
  usuario: { id: string; name: string; email: string; rol: string };
  vista: string;
}) {
  const conductorId = Number(usuario.id);
  const { inicio, fin } = rangoDelDiaLima();
  const esHistorial = vista === "historial";
  const esPerfil = vista === "perfil";

  const whereDespachos: Prisma.DespachoWhereInput = esHistorial
  ? {
      hojaRuta: {
        is: { conductorId },
      },
      estado: {
        in: ["ENTREGADO", "REPROGRAMADO"],
      },
    }
  : {
      hojaRuta: {
        is: {
          conductorId,
          fecha: {
            gte: inicio,
            lt: fin,
          },
        },
      },
    };

  const [despachos, rutaHoy] = await Promise.all([
    prisma.despacho.findMany({
      where: whereDespachos,
      orderBy: esHistorial
        ? { fechaActualizacion: "desc" }
        : { fechaCreacion: "asc" },
      take: esHistorial ? 100 : 100,
      include: {
        detalles: { select: { id: true } },
        hojaRuta: {
          include: {
            vehiculo: {
              select: { placa: true, modelo: true, capacidad: true },
            },
          },
        },
        venta: {
          include: {
            cliente: {
              select: { razonSocial: true, direccion: true },
            },
            detalles: {
              include: {
                producto: { select: { nombre: true } },
              },
            },
          },
        },
        evidencia: { select: { id: true, fecha: true } },
        historial: {
          include: { usuario: { select: { nombre: true } } },
          orderBy: { fecha: "desc" },
          take: 10,
        },
      },
    }),
    prisma.hojaRuta.findFirst({
      where: {
        conductorId,
        fecha: { gte: inicio, lt: fin },
      },
      orderBy: { fecha: "desc" },
      include: {
        vehiculo: {
          select: { placa: true, modelo: true, capacidad: true },
        },
      },
    }),
  ]);

  const totalAsignadas = despachos.length;
  const pendientes = despachos.filter((d) => d.estado === "PENDIENTE").length;
  const enRuta = despachos.filter((d) => d.estado === "EN_RUTA").length;
  const entregadas = despachos.filter((d) => d.estado === "ENTREGADO").length;

  if (esPerfil) {
    return (
      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mi cuenta</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#123E70]">Mi perfil</h1>
          <p className="mt-1 text-sm text-slate-500">Información de tu cuenta y asignación actual.</p>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-[#123E70]">
              {usuario.name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">{usuario.name}</h2>
              <p className="text-sm text-slate-500">Conductor Borsuas</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Correo electrónico</p>
              <p className="break-all text-sm font-medium text-slate-800">{usuario.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rol</p>
              <p className="text-sm font-medium text-slate-800">Conductor</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Vehículo de hoy</h2>
          {rutaHoy ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#123E70]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" />
                  <circle cx="7.5" cy="18" r="2" />
                  <circle cx="17.5" cy="18" r="2" />
                </svg>
              </span>
              <div>
                <p className="font-bold text-slate-900">{rutaHoy.vehiculo.placa}</p>
                <p className="text-sm text-slate-500">{rutaHoy.vehiculo.modelo}</p>
                <p className="text-xs text-slate-500">Ruta #{rutaHoy.id}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No tienes un vehículo asignado para hoy.</p>
          )}
        </article>
      </section>
    );
  }

  if (esHistorial) {
    return (
      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tus actividades</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#123E70]">Historial de entregas</h1>
          <p className="mt-1 text-sm text-slate-500">Tus entregas completadas y reprogramadas recientemente.</p>
        </div>

        {despachos.length ? (
          <div className="space-y-3">
            {despachos.map((d) => (
              <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#123E70]">Despacho #{d.id}</p>
                    <p className="mt-1 font-semibold text-slate-900">{d.venta.cliente.razonSocial}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${estadoVisual(d.estado)}`}>
                    {etiquetaEstado(d.estado)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Venta #{d.ventaId} · {formatoFecha(d.fechaActualizacion)}</p>
                {d.observacion && <p className="mt-2 text-sm text-slate-600">Observación: {d.observacion}</p>}
                {d.receptor && <p className="mt-2 text-sm text-slate-600">Recibido por: <strong>{d.receptor}</strong></p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.evidencia && (
                    <Link href={`/dashboard/logistica/despachos/${d.id}/foto`} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-[#123E70]">
                      Ver fotografía
                    </Link>
                  )}
                  {d.estado === "ENTREGADO" && (
                    <Link href={`/dashboard/logistica/despachos/${d.id}/comprobante`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#123E70]">
                      Comprobante
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">Todavía no hay entregas en tu historial.</p>
            <p className="mt-1 text-sm text-slate-500">Aquí aparecerán tus entregas completadas y reprogramadas.</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del conductor</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#123E70]">Mis entregas</h1>
        <p className="mt-1 text-sm text-slate-500">Buenos días, {usuario.name.split(" ")[0]}. Aquí tienes tu actividad de hoy.</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          {formatoFecha(new Date(`${fechaActualLima()}T12:00:00-05:00`))}
        </p>
      </header>

      <article className="rounded-2xl bg-gradient-to-br from-[#123E70] to-[#075985] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-blue-100">Resumen de hoy</h2>
          <span className="rounded-lg bg-white/10 p-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" />
              <circle cx="7.5" cy="18" r="2" />
              <circle cx="17.5" cy="18" r="2" />
            </svg>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 text-center">
          <div className="px-1">
            <p className="text-3xl font-extrabold tabular-nums">{totalAsignadas}</p>
            <p className="mt-1 text-[11px] text-blue-100">Asignadas</p>
          </div>
          <div className="px-1">
            <p className="text-3xl font-extrabold tabular-nums">{pendientes + enRuta}</p>
            <p className="mt-1 text-[11px] text-blue-100">Pendientes</p>
          </div>
          <div className="px-1">
            <p className="text-3xl font-extrabold tabular-nums">{entregadas}</p>
            <p className="mt-1 text-[11px] text-blue-100">Entregadas</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123E70]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" />
                <circle cx="7.5" cy="18" r="2" />
                <circle cx="17.5" cy="18" r="2" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Vehículo asignado</p>
              <p className="truncate font-bold text-slate-900">{rutaHoy?.vehiculo.placa ?? "Sin vehículo"}</p>
              <p className="truncate text-xs text-slate-500">{rutaHoy?.vehiculo.modelo ?? "No tienes una ruta asignada hoy"}</p>
            </div>
          </div>
          {rutaHoy && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Ruta #{rutaHoy.id}
            </span>
          )}
        </div>
      </article>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Despachos de hoy</h2>
          <p className="text-xs text-slate-500">Pedidos asignados a tu usuario.</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{totalAsignadas} en total</span>
      </div>

      {despachos.length ? (
        <div className="space-y-3">
          {despachos.map((d) => {
            const direccion = d.venta.cliente.direccion;
            const puedeActualizar = d.hojaRuta && d.detalles.length === 0 && ["PENDIENTE", "EN_RUTA"].includes(d.estado);
            const mapsUrl = direccion
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
              : null;

            return (
              <article key={d.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#123E70]">Despacho #{d.id}</p>
                      <p className="mt-1 text-xs text-slate-500">Venta #{d.ventaId}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${estadoVisual(d.estado)}`}>
                      {etiquetaEstado(d.estado)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123E70]">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M3 21V8l9-5 9 5v13zM8 21v-8h8v8M7 9h.01M12 9h.01M17 9h.01" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{d.venta.cliente.razonSocial}</h3>
                      <p className="mt-1 text-sm text-slate-600">{direccion || "Dirección no registrada"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">Productos</p>
                    <ul className="mt-1 space-y-1">
                      {d.venta.detalles.map((detalle) => (
                        <li key={detalle.id} className="text-sm text-slate-700">
                          {detalle.producto.nombre} <span className="font-semibold">× {detalle.cantidad}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {d.salidaInventarioEn && (
                    <p className="text-xs text-emerald-700">Salida registrada: {formatoFechaHora(d.salidaInventarioEn)}</p>
                  )}
                  {d.observacion && <p className="text-sm text-slate-600">Observación: {d.observacion}</p>}
                  {d.receptor && <p className="text-sm text-slate-600">Recibido por: <strong>{d.receptor}</strong></p>}

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#123E70]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      Cómo llegar
                    </a>
                  )}

                  {d.estado === "PENDIENTE" && puedeActualizar && (
                    <form action={actualizarDespacho} className="space-y-3 border-t border-slate-100 pt-3">
                      <input type="hidden" name="id" value={d.id} />
                      <p className="text-xs leading-relaxed text-slate-500">
                        Al iniciar la ruta se registrará la salida del inventario. Esta operación se realiza una sola vez.
                      </p>
                      <button
                        name="estado"
                        value="EN_RUTA"
                        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#123E70] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0D315A]"
                      >
                        Iniciar entrega
                      </button>
                    </form>
                  )}

                  {d.estado === "EN_RUTA" && puedeActualizar && (
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <form action={actualizarDespacho} className="space-y-3">
                        <input type="hidden" name="id" value={d.id} />
                        <label className="block text-sm font-semibold text-slate-700">
                          Nombre de quien recibe
                          <input
                            required
                            name="receptor"
                            maxLength={120}
                            placeholder="Nombre y apellido"
                            className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                          Fotografía de entrega
                          <input
                            required
                            name="foto"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            className="mt-1 block min-h-12 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#123E70]"
                          />
                          <span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG o WEBP · máximo 3 MB.</span>
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                          Observación (opcional)
                          <textarea
                            name="observacion"
                            maxLength={500}
                            rows={2}
                            placeholder="Observación de la entrega"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <button
                          name="estado"
                          value="ENTREGADO"
                          className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
                        >
                          Confirmar entrega
                        </button>
                      </form>

                      <form action={actualizarDespacho} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="estado" value="REPROGRAMADO" />
                        <label className="block text-sm font-semibold text-amber-900">
                          Motivo de reprogramación
                          <textarea
                            required
                            name="observacion"
                            maxLength={500}
                            rows={2}
                            placeholder="Describe por qué no se pudo entregar"
                            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-normal text-slate-800"
                          />
                        </label>
                        <button className="mt-2 min-h-11 w-full rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-900">
                          Reprogramar entrega
                        </button>
                      </form>
                    </div>
                  )}

                  {d.estado === "ENTREGADO" && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {d.evidencia && (
                        <Link href={`/dashboard/logistica/despachos/${d.id}/foto`} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-[#123E70]">
                          Ver fotografía
                        </Link>
                      )}
                      <Link href={`/dashboard/logistica/despachos/${d.id}/comprobante`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#123E70]">
                        Comprobante
                      </Link>
                    </div>
                  )}

                  {d.estado === "REPROGRAMADO" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Entrega reprogramada. {d.observacion || "Consulta con logística para conocer la siguiente asignación."}
                    </div>
                  )}

                  {(!d.hojaRuta || d.detalles.length > 0) && (
                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      Este despacho requiere gestión desde el flujo correspondiente. Contacta con logística.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#123E70]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" />
              <circle cx="7.5" cy="18" r="2" />
              <circle cx="17.5" cy="18" r="2" />
            </svg>
          </span>
          <h3 className="mt-4 font-bold text-slate-800">No tienes despachos asignados para hoy</h3>
          <p className="mt-1 text-sm text-slate-500">Cuando logística te asigne una ruta, tus entregas aparecerán aquí.</p>
        </div>
      )}
    </section>
  );
}

export default async function DespachosPage({ searchParams }: Props) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"]);
  const conductor = usuario.rol === "CONDUCTOR";

  if (conductor) {
    const params = searchParams ? await searchParams : {};
    const valorVista = Array.isArray(params.vista) ? params.vista[0] : params.vista;
    const vista = ["historial", "perfil"].includes(valorVista ?? "") ? valorVista! : "entregas";
    return <VistaConductor usuario={usuario} vista={vista} />;
  }

  // Vista administrativa conservada para SUPER_ADMIN, ADMIN y ALMACEN.
  const despachos = await prisma.despacho.findMany({
    where: {},
    orderBy: { hojaRuta: { fecha: "desc" } },
    take: 150,
    include: {
      detalles: { select: { id: true } },
      hojaRuta: { include: { conductor: { select: { nombre: true } }, vehiculo: { select: { placa: true } } } },
      venta: { include: { cliente: { select: { razonSocial: true, direccion: true } }, detalles: { include: { producto: { select: { nombre: true } } } } } },
      evidencia: { select: { id: true, fecha: true } },
      historial: { include: { usuario: { select: { nombre: true } } }, orderBy: { fecha: "desc" }, take: 10 },
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-10">
      <header>
        <p className="text-sm text-slate-500">Logística / Entregas</p>
        <h1 className="text-3xl font-bold text-[#123E70]">Despachos</h1>
        <p className="text-slate-500">Seguimiento de pedidos, trazabilidad y comprobantes de entrega</p>
      </header>

      <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[#123E70]">
        <Link href="/dashboard/logistica/panel" className="rounded-lg border bg-white p-3">Panel logístico</Link>
        <Link href="/dashboard/logistica/movimientos" className="rounded-lg border bg-white p-3">Salidas por lote</Link>
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        {["PENDIENTE", "EN_RUTA", "ENTREGADO"].map((estado) => (
          <div key={estado} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{estado.replaceAll("_", " ")}</p>
            <p className="text-3xl font-bold text-[#123E70]">{despachos.filter((d) => d.estado === estado).length}</p>
          </div>
        ))}
      </div>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        {despachos.map((d) => (
          <article key={d.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-[#123E70]">Despacho #{d.id} · Venta #{d.ventaId}</strong>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{etiquetaEstado(d.estado)}</span>
            </div>

            <div>
              <p className="font-semibold">{d.venta.cliente.razonSocial}</p>
              {d.venta.cliente.direccion && <p className="text-sm text-slate-600">Destino: {d.venta.cliente.direccion}</p>}
              <p className="text-sm text-slate-500">
                {d.hojaRuta ? `Ruta #${d.hojaRutaId} · ${d.hojaRuta.conductor.nombre} · ${d.hojaRuta.vehiculo.placa} · ${d.hojaRuta.fecha.toLocaleDateString("es-PE", { timeZone: "UTC" })}` : "Sin hoja de ruta asignada"}
              </p>
            </div>

            <ul className="space-y-1 text-sm text-slate-600">
              {d.venta.detalles.map((det) => <li key={det.id}>• {det.producto.nombre} × {det.cantidad}</li>)}
            </ul>

            {d.salidaInventarioEn && <p className="text-xs text-emerald-700">✓ Salida de inventario registrada el {d.salidaInventarioEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}</p>}
            {d.receptor && <p className="text-sm"><strong>Recibido por:</strong> {d.receptor}</p>}
            {d.entregadoEn && <p className="text-xs text-slate-500">Entrega: {d.entregadoEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}</p>}
            {d.estado === "ENTREGADO" && <Link href={`/dashboard/logistica/despachos/${d.id}/comprobante`} className="inline-block rounded-lg border px-3 py-2 text-sm font-semibold text-[#123E70]">Comprobante imprimible</Link>}
            {d.evidencia && <Link href={`/dashboard/logistica/despachos/${d.id}/foto`} className="inline-block rounded-md bg-sky-50 px-3 py-2 text-sm font-semibold text-[#123E70] hover:underline">Ver fotografía de entrega</Link>}
            {(!d.hojaRuta || d.detalles.length > 0) && <p className="text-xs text-amber-700">Despacho sin ruta o parcial: sus movimientos se gestionan desde el flujo correspondiente, no desde los botones de despacho completo.</p>}
            {d.observacion && <p className="text-sm">Observación: {d.observacion}</p>}

            {["PENDIENTE", "EN_RUTA"].includes(d.estado) && d.hojaRuta && d.detalles.length === 0 && (
              <form action={actualizarDespacho} className="space-y-3 border-t pt-4">
                <input type="hidden" name="id" value={d.id} />
                {d.estado === "EN_RUTA" && (
                  <>
                    <label className="block text-sm font-medium">Nombre de quien recibe<input name="receptor" maxLength={120} placeholder="Nombre y apellido" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label>
                    <label className="block text-sm font-medium">Foto de entrega (JPG, PNG o WEBP · máximo 3 MB)<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full rounded-lg border p-2 text-sm" /></label>
                    <textarea name="observacion" maxLength={500} placeholder="Observación o motivo de reprogramación" className="w-full rounded-lg border p-2 text-sm" rows={2} />
                    <p className="text-xs text-slate-500">Para confirmar ENTREGADO se requiere nombre y foto; para REPROGRAMADO, motivo.</p>
                  </>
                )}
                {d.estado === "PENDIENTE" && <p className="text-xs text-amber-700">Al marcar EN RUTA se descontarán las existencias por lote (una sola vez) y la venta pasará a DESPACHADA.</p>}
                <div className="flex flex-wrap gap-2">
                  {(d.estado === "PENDIENTE" ? ["EN_RUTA"] : ["ENTREGADO", "REPROGRAMADO"]).map((estado) => (
                    <button key={estado} name="estado" value={estado} className="rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#087EBD]">
                      {estado.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </form>
            )}

            {d.estado === "REPROGRAMADO" && d.salidaInventarioEn && !d.devolucionInventarioEn && d.hojaRuta && d.detalles.length === 0 && (
              <form action={recibirDevolucionDespacho} className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm font-semibold">Recepción física de devolución</p>
                <p className="text-xs text-slate-600">Reintegrará todas las unidades del despacho al mismo lote, únicamente si están físicamente recibidas y aptas. No genera una ruta nueva.</p>
                <input type="hidden" name="id" value={d.id} />
                <textarea required name="motivo" maxLength={500} placeholder="Motivo y comprobación de devolución" rows={2} className="w-full rounded-lg border p-2 text-sm" />
                <label className="flex items-start gap-2 text-xs"><input required type="checkbox" name="inspeccion" value="confirmada" />Confirmo que almacén recibió la totalidad, verificó lote, cantidad, integridad, conservación y vencimiento.</label>
                <button className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white">Confirmar reintegro al inventario</button>
              </form>
            )}

            {d.devolucionInventarioEn && <p className="text-sm font-semibold text-emerald-700">✓ Reintegrado al almacén el {d.devolucionInventarioEn.toLocaleString("es-PE", { timeZone: "America/Lima" })}. {d.devolucionMotivo}</p>}
            {d.historial.length > 0 && (
              <details className="border-t pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#123E70]">Historial ({d.historial.length})</summary>
                <ol className="mt-2 space-y-2 text-xs text-slate-600">
                  {d.historial.map((h) => <li key={h.id}>{h.fecha.toLocaleString("es-PE", { timeZone: "America/Lima" })} · {h.usuario.nombre} · {h.estadoAnterior.replaceAll("_", " ")} → {h.estadoNuevo.replaceAll("_", " ")}{h.observacion && ` · ${h.observacion}`}</li>)}
                </ol>
              </details>
            )}
          </article>
        ))}
        {!despachos.length && <p className="rounded-xl border bg-white p-6 text-slate-500">No hay despachos registrados.</p>}
      </section>
      <p className="text-xs text-slate-500">Las reprogramaciones conservan la salida hasta que almacén confirme la recepción de las unidades. Una devolución no crea por sí sola otra ruta.</p>
    </main>
  );
}
