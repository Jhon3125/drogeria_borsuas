
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { exigirRol } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
    ROLES_OP_LECTURA,
    ROLES_OP_SOLICITUD,
} from "@/lib/ordenes-pago/roles";
import { calcularSaldoOrdenCompra } from "@/lib/ordenes-pago/saldos";
import { OrdenPagoDialog } from "./orden-pago-dialog";
import {
    ClipboardList,
    Search,
    Wallet,
    Clock3,
    CheckCircle2,
} from "lucide-react";
import { ClipboardCheck } from "lucide-react";

type Props = {
    searchParams: Promise<{
        q?: string;
        estado?: string;
    }>;
};

const ESTADOS = [
    "SOLICITADA",
    "APROBADA",
    "RECHAZADA",
    "PAGO_PARCIAL",
    "PAGADA",
] as const;

function moneda(simbolo: string, monto: string) {
    return `${simbolo === "USD" ? "US$" : "S/"} ${monto}`;
}

function etiquetaEstado(estado: string) {
    const configuracion: Record<
        string,
        { texto: string; clase: string }
    > = {
        SOLICITADA: {
            texto: "Solicitada",
            clase: "bg-amber-50 text-amber-700",
        },
        APROBADA: {
            texto: "Aprobada",
            clase: "bg-blue-50 text-blue-700",
        },
        RECHAZADA: {
            texto: "Rechazada",
            clase: "bg-red-50 text-red-700",
        },
        PAGO_PARCIAL: {
            texto: "Pago parcial",
            clase: "bg-violet-50 text-violet-700",
        },
        PAGADA: {
            texto: "Pagada",
            clase: "bg-emerald-50 text-emerald-700",
        },
    };

    return configuracion[estado] ?? {
        texto: estado,
        clase: "bg-secondary text-muted-foreground",
    };
}

export default async function OrdenesPagoPage({
    searchParams,
}: Props) {
    const usuario = await exigirRol(ROLES_OP_LECTURA);
    const puedeSolicitar = ROLES_OP_SOLICITUD.includes(
        usuario.rol
    );

    const params = await searchParams;
    const q = (params.q ?? "").trim().slice(0, 100);

    const estado = ESTADOS.find(
        (item) => item === params.estado
    );

    const idBuscado = /^\d+$/.test(q)
        ? Number(q)
        : /^OP-(\d+)$/i.test(q)
            ? Number(q.match(/^OP-(\d+)$/i)?.[1])
            : null;

    const where: Prisma.OrdenPagoWhereInput = {
        ...(estado ? { estado } : {}),
        ...(q
            ? {
                OR: [
                    {
                        compra: {
                            proveedor: {
                                razonSocial: {
                                    contains: q,
                                    mode: "insensitive",
                                },
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

    const [ordenes, totalFiltrado, comprasElegibles] =
        await Promise.all([
            prisma.ordenPago.findMany({
                where,
                take: 60,
                orderBy: [
                    { fechaSolicitud: "desc" },
                    { id: "desc" },
                ],
                include: {
                    compra: {
                        include: {
                            proveedor: {
                                select: {
                                    razonSocial: true,
                                },
                            },
                        },
                    },
                    solicitante: {
                        select: { nombre: true },
                    },
                    desembolsos: {
                        select: { monto: true },
                    },
                },
            }),

            prisma.ordenPago.count({ where }),

            puedeSolicitar
                ? prisma.compra.findMany({
                    where: {
                        estado: {
                            in: ["PARCIAL", "RECIBIDO"],
                        },
                    },
                    take: 200,
                    orderBy: [
                        { fecha: "desc" },
                        { id: "desc" },
                    ],
                    select: {
                        id: true,
                        moneda: true,
                        proveedor: {
                            select: {
                                razonSocial: true,
                            },
                        },
                        detalles: {
                            select: {
                                cantidad: true,
                                precioUnitario: true,
                                recepciones: {
                                    select: {
                                        cantidad: true,
                                    },
                                },
                            },
                        },
                        ordenesPago: {
                            select: {
                                estado: true,
                                montoSolicitado: true,
                            },
                        },
                    },
                })
                : Promise.resolve([]),
        ]);

    const opcionesCompra = comprasElegibles.flatMap(
        (compra) => {
            try {
                const saldo = calcularSaldoOrdenCompra(
                    compra.detalles,
                    compra.ordenesPago
                );

                if (saldo.disponible.lte(0)) return [];

                return [
                    {
                        id: compra.id,
                        proveedor: compra.proveedor.razonSocial,
                        moneda: compra.moneda,
                        valorRecibido:
                            saldo.valorRecibido.toFixed(2),
                        comprometido:
                            saldo.montoComprometido.toFixed(2),
                        disponible: saldo.disponible.toFixed(2),
                    },
                ];
            } catch (error) {
                // Una OC inconsistente no debe convertirse
                // en candidata a solicitar pagos.
                console.error(
                    `OC #${compra.id}: saldo financiero inválido`,
                    error
                );
                return [];
            }
        }
    );

    return (
        <div className="mx-auto max-w-7xl space-y-7 pb-8">
            <section className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        Finanzas / Órdenes de Pago
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Wallet className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Órdenes de Pago
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Solicitudes, autorizaciones y
                                desembolsos a proveedores.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/dashboard/ordenes-pago/conciliacion"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-primary transition-colors hover:bg-secondary"
                    >
                        <ClipboardCheck className="h-4 w-4" />
                        Conciliación
                    </Link>

                    {puedeSolicitar && (
                        <OrdenPagoDialog compras={opcionesCompra} />
                    )}
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Órdenes encontradas
                    </div>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {totalFiltrado}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4 text-amber-600" />
                        Compras disponibles para solicitud
                    </div>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {puedeSolicitar
                            ? opcionesCompra.length
                            : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {puedeSolicitar
                            ? "Entre las 200 compras recientes consultadas"
                            : "Disponible para roles solicitantes"}
                    </p>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="space-y-4 border-b px-5 py-5 sm:px-6">
                    <div>
                        <h2 className="font-semibold">
                            Directorio de Órdenes de Pago
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Consulta las solicitudes registradas
                            y su avance financiero.
                        </p>
                    </div>

                    <form
                        method="get"
                        className="flex flex-wrap items-center gap-3"
                    >
                        <div className="relative min-w-48 flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                name="q"
                                defaultValue={q}
                                placeholder="Buscar OP o proveedor..."
                                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <select
                            name="estado"
                            defaultValue={estado ?? "TODOS"}
                            className="h-10 rounded-lg border bg-background px-3 text-sm"
                        >
                            <option value="TODOS">
                                Todos los estados
                            </option>
                            {ESTADOS.map((item) => (
                                <option key={item} value={item}>
                                    {etiquetaEstado(item).texto}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-[#123E70] px-4 text-sm font-medium text-white hover:bg-[#0c315b]"
                        >
                            Buscar
                        </button>

                        {(q || estado) && (
                            <Link
                                href="/dashboard/ordenes-pago"
                                className="text-sm text-primary hover:underline"
                            >
                                Limpiar
                            </Link>
                        )}
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/40 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Orden</th>
                                <th className="px-4 py-4">Proveedor</th>
                                <th className="px-4 py-4">Importe</th>
                                <th className="px-4 py-4">Estado</th>
                                <th className="px-4 py-4">Solicitante</th>
                                <th className="px-6 py-4 text-right">
                                    Pagado
                                </th>
                                <th className="px-6 py-4 text-right">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {ordenes.map((orden) => {
                                const pagado =
                                    orden.desembolsos.reduce(
                                        (total, d) =>
                                            total.add(d.monto),
                                        new Prisma.Decimal(0)
                                    );

                                const estadoVisual =
                                    etiquetaEstado(orden.estado);

                                return (
                                    <tr
                                        key={orden.id}
                                        className="hover:bg-secondary/20"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-primary">
                                                OP-
                                                {String(orden.id).padStart(
                                                    4,
                                                    "0"
                                                )}
                                            </p>
                                            <Link
                                                href={`/dashboard/compras/${orden.compraId}`}
                                                className="mt-1 inline-block text-xs text-muted-foreground hover:text-primary hover:underline"
                                            >
                                                OC-
                                                {String(
                                                    orden.compraId
                                                ).padStart(4, "0")}
                                            </Link>
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {
                                                orden.compra.proveedor
                                                    .razonSocial
                                            }
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 font-semibold">
                                            {moneda(
                                                orden.moneda,
                                                orden.montoSolicitado.toFixed(2)
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${estadoVisual.clase}`}
                                            >
                                                {estadoVisual.texto}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            {orden.solicitante.nombre}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-emerald-700">
                                            {moneda(
                                                orden.moneda,
                                                pagado.toFixed(2)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/ordenes-pago/${orden.id}`}
                                                className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border border-input bg-background px-3 text-sm font-medium text-primary hover:bg-secondary"
                                            >
                                                Ver detalle
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}

                            {ordenes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-16 text-center"
                                    >
                                        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                                        <p className="font-medium">
                                            No se encontraron Órdenes de Pago
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Las nuevas solicitudes aparecerán aquí.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t bg-secondary/20 px-6 py-3 text-xs text-muted-foreground">
                    Mostrando {ordenes.length} de {totalFiltrado} órdenes.
                    {totalFiltrado > 60 &&
                        " Se muestran las 60 más recientes."}
                </div>
            </section>
        </div>
    );
}
