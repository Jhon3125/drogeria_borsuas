
import Link from "next/link";
import {
    ArrowUpRight,
    Banknote,
    ClipboardList,
    LockKeyhole,
    Wallet,
} from "lucide-react";

type OrdenPagoResumen = {
    id: number;
    estado: string;
    fechaSolicitud: Date;
    montoSolicitado: string;
    montoPagado: string;
    solicitante: string;
};

type Props = {
    compraId: number;
    moneda: string;
    valorRecibido: string;
    montoComprometido: string;
    montoPagado: string;
    disponible: string;
    ordenes: OrdenPagoResumen[];
    puedeSolicitar: boolean;
};

const ESTADOS: Record<
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

function formatearMoneda(moneda: string, monto: string) {
    const simbolo = moneda === "USD" ? "US$" : "S/";
    return `${simbolo} ${monto}`;
}

export function ResumenFinancieroCompra({
    compraId,
    moneda,
    valorRecibido,
    montoComprometido,
    montoPagado,
    disponible,
    ordenes,
    puedeSolicitar,
}: Props) {
    const indicadores = [
        {
            titulo: "Valor recibido",
            valor: valorRecibido,
            icono: ClipboardList,
            color: "text-primary",
        },
        {
            titulo: "Comprometido en OP",
            valor: montoComprometido,
            icono: LockKeyhole,
            color: "text-amber-700",
        },
        {
            titulo: "Total desembolsado",
            valor: montoPagado,
            icono: Banknote,
            color: "text-emerald-700",
        },
        {
            titulo: "Disponible para solicitar",
            valor: disponible,
            icono: Wallet,
            color: "text-blue-700",
        },
    ];

    return (
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Wallet className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold">
                            Situación financiera
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Obligaciones y pagos vinculados
                            a esta Orden de Compra.
                        </p>
                    </div>
                </div>

                {puedeSolicitar && (
                    <Link
                        href="/dashboard/ordenes-pago"
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-primary hover:bg-secondary"
                    >
                        Ir a Órdenes de Pago
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map((item) => {
                    const Icono = item.icono;

                    return (
                        <div
                            key={item.titulo}
                            className="rounded-xl border bg-secondary/20 p-4"
                        >
                            <div className="flex items-center gap-2">
                                <Icono
                                    className={`h-4 w-4 ${item.color}`}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {item.titulo}
                                </p>
                            </div>

                            <p
                                className={`mt-3 text-xl font-bold ${item.color}`}
                            >
                                {formatearMoneda(
                                    moneda,
                                    item.valor
                                )}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="border-t px-6 py-4">
                <h3 className="text-sm font-semibold">
                    Órdenes de Pago asociadas
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    OC-{String(compraId).padStart(4, "0")}
                    {" · "}
                    {ordenes.length} solicitud(es) registradas.
                </p>
            </div>

            {ordenes.length === 0 ? (
                <div className="border-t px-6 py-10 text-center">
                    <Wallet className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium">
                        Sin Órdenes de Pago registradas
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Las solicitudes vinculadas a esta compra
                        aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto border-t">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/40 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3">Orden</th>
                                <th className="px-4 py-3">Solicitante</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">
                                    Solicitado
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Pagado
                                </th>
                                <th className="px-6 py-3 text-right">
                                    Acción
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {ordenes.map((orden) => {
                                const estado =
                                    ESTADOS[orden.estado] ?? {
                                        texto: orden.estado,
                                        clase: "bg-secondary text-foreground",
                                    };

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
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Intl.DateTimeFormat(
                                                    "es-PE",
                                                    {
                                                        dateStyle: "medium",
                                                        timeZone:
                                                            "America/Lima",
                                                    }
                                                ).format(
                                                    orden.fechaSolicitud
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            {orden.solicitante}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}
                                            >
                                                {estado.texto}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium">
                                            {formatearMoneda(
                                                moneda,
                                                orden.montoSolicitado
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-emerald-700">
                                            {formatearMoneda(
                                                moneda,
                                                orden.montoPagado
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/ordenes-pago/${orden.id}`}
                                                className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-primary hover:underline"
                                            >
                                                Ver OP
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="border-t bg-secondary/20 px-6 py-3">
                <p className="text-xs leading-5 text-muted-foreground">
                    El importe comprometido incluye las
                    solicitudes activas y las pagadas.
                    Las OP rechazadas no comprometen saldo.
                    Los desembolsos forman parte del importe
                    comprometido, por lo que no deben
                    descontarse nuevamente del disponible.
                </p>
            </div>
        </section>
    );
}
