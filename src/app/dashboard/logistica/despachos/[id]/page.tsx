
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import DespachoDetalleClient from "./despacho-detalle-client";

export default async function DespachoDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const usuario = await exigirRol([
        "SUPER_ADMIN",
        "ADMIN",
        "ALMACEN",
        "CONDUCTOR",
    ]);

    const { id } = await params;

    if (!/^\d+$/.test(id)) notFound();

    const despacho = await prisma.despacho.findUnique({
        where: { id: Number(id) },
        include: {
            hojaRuta: {
                include: {
                    conductor: { select: { id: true, nombre: true } },
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
                        orderBy: { id: "asc" },
                        include: {
                            producto: { select: { nombre: true, codigo: true } },
                            asignacionesLote: {
                                include: {
                                    lote: {
                                        select: {
                                            numeroLote: true,
                                            fechaVencimiento: true,
                                            estadoCalidad: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            detalles: { select: { id: true } },
            evidencia: {
                select: { id: true, fecha: true, tipoMime: true, nombre: true },
            },
            historial: {
                orderBy: { fecha: "asc" },
                include: {
                    usuario: { select: { nombre: true } },
                },
            },
        },
    });

    if (!despacho) notFound();

    // El conductor solo puede consultar despachos de sus propias rutas.
    if (
        usuario.rol === "CONDUCTOR" &&
        despacho.hojaRuta?.conductorId !== Number(usuario.id)
    ) {
        notFound();
    }

    const datos = {
        id: despacho.id,
        ventaId: despacho.ventaId,
        estado: despacho.estado,
        fechaCreacion: despacho.fechaCreacion.toISOString(),
        fechaActualizacion: despacho.fechaActualizacion.toISOString(),
        salidaInventarioEn: despacho.salidaInventarioEn?.toISOString() ?? null,
        entregadoEn: despacho.entregadoEn?.toISOString() ?? null,
        receptor: despacho.receptor,
        observacion: despacho.observacion,
        devolucionInventarioEn:
            despacho.devolucionInventarioEn?.toISOString() ?? null,
        devolucionMotivo: despacho.devolucionMotivo,

        gestionCompleta:
            Boolean(despacho.hojaRuta) && despacho.detalles.length === 0,

        importeTotal: Number(despacho.venta.importeTotal.toString()),
        saldoPendiente: Number(despacho.venta.saldoPendiente.toString()),
        moneda: despacho.venta.moneda,

        cliente: {
            razonSocial: despacho.venta.cliente.razonSocial,
            direccion: despacho.venta.cliente.direccion,
        },

        ruta: despacho.hojaRuta
            ? {
                id: despacho.hojaRuta.id,
                fecha: despacho.hojaRuta.fecha.toISOString(),
                conductor: despacho.hojaRuta.conductor.nombre,
                vehiculo: despacho.hojaRuta.vehiculo.placa,
                modeloVehiculo: despacho.hojaRuta.vehiculo.modelo,
                capacidadVehiculo: despacho.hojaRuta.vehiculo.capacidad,
            }
            : null,

        productos: despacho.venta.detalles.map((detalle) => ({
            id: detalle.id,
            nombre: detalle.producto.nombre,
            codigo: detalle.producto.codigo,
            cantidad: detalle.cantidad,
            lotes: detalle.asignacionesLote.map((asignacion) => ({
                loteId: asignacion.loteId,
                numero: asignacion.lote.numeroLote,
                cantidad: asignacion.cantidad,
                vencimiento: asignacion.lote.fechaVencimiento.toISOString(),
                calidad: asignacion.lote.estadoCalidad,
            })),
        })),

        evidencia: despacho.evidencia
            ? {
                fecha: despacho.evidencia.fecha.toISOString(),
                tipoMime: despacho.evidencia.tipoMime,
                nombre: despacho.evidencia.nombre,
            }
            : null,

        historial: despacho.historial.map((evento) => ({
            id: evento.id,
            estadoAnterior: evento.estadoAnterior,
            estadoNuevo: evento.estadoNuevo,
            observacion: evento.observacion,
            fecha: evento.fecha.toISOString(),
            usuario: evento.usuario.nombre,
        })),
    };

    return (
        <main className="mx-auto max-w-[1400px] space-y-5 pb-10">
            <div>
                <Link
                    href="/dashboard/logistica/despachos"
                    className="text-sm font-semibold text-[#123E70] hover:underline"
                >
                    ← Volver a despachos
                </Link>
            </div>

            <DespachoDetalleClient
                despacho={datos}
                esConductor={usuario.rol === "CONDUCTOR"}
                puedeGestionarDevolucion={["SUPER_ADMIN", "ADMIN", "ALMACEN"].includes(
                    usuario.rol
                )}
            />
        </main>
    );
}
