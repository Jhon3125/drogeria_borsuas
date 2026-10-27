
import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    ShieldAlert,
} from "lucide-react";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_OP_LECTURA } from "@/lib/ordenes-pago/roles";

type Incidencia = {
    clave: string;
    tipo: "OP" | "OC";
    id: number;
    descripcion: string;
};

function dinero(moneda: string, importe: Prisma.Decimal) {
    return `${moneda === "USD" ? "US$" : "S/"} ${importe.toFixed(2)}`;
}

export default async function ConciliacionFinancieraPage() {
    await exigirRol(ROLES_OP_LECTURA);

    const ordenes = await prisma.ordenPago.findMany({
        orderBy: { id: "desc" },
        select: {
            id: true,
            compraId: true,
            moneda: true,
            estado: true,
            montoSolicitado: true,
            desembolsos: {
                select: {
                    monto: true,
                },
            },
        },
    });

    const compras = await prisma.compra.findMany({
        where: {
            OR: [
                { ordenesPago: { some: {} } },
                {
                    recepciones: {
                        some: {},
                    },
                },
            ],
        },
        select: {
            id: true,
            moneda: true,
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
        },
    });

    const cero = () => new Prisma.Decimal(0);
    const incidencias: Incidencia[] = [];

    const opPorCompra = new Map<
        number,
        typeof ordenes
    >();

    for (const orden of ordenes) {
        const anteriores = opPorCompra.get(orden.compraId) ?? [];
        anteriores.push(orden);
        opPorCompra.set(orden.compraId, anteriores);
    }

    for (const orden of ordenes) {
        const pagado = orden.desembolsos.reduce(
            (total, pago) => total.add(pago.monto),
            cero()
        );

        const solicitado = orden.montoSolicitado;

        const agregar = (descripcion: string) => {
            incidencias.push({
                clave: `op-${orden.id}-${incidencias.length}`,
                tipo: "OP",
                id: orden.id,
                descripcion,
            });
        };

        if (solicitado.lte(0)) {
            agregar("El importe solicitado no es positivo.");
        }

        if (orden.desembolsos.some((pago) => pago.monto.lte(0))) {
            agregar("Existen desembolsos con importes no positivos.");
        }

        if (pagado.gt(solicitado)) {
            agregar(
                `Desembolsado ${dinero(orden.moneda, pagado)}; supera el importe solicitado.`
            );
        }

        switch (orden.estado) {
            case "SOLICITADA":
            case "APROBADA":
            case "RECHAZADA":
                if (!pagado.isZero() || orden.desembolsos.length > 0) {
                    agregar(
                        `La OP está ${orden.estado}, pero tiene desembolsos registrados.`
                    );
                }
                break;

            case "PAGO_PARCIAL":
                if (pagado.lte(0) || pagado.gte(solicitado)) {
                    agregar(
                        "El estado PAGO_PARCIAL no corresponde al importe desembolsado."
                    );
                }
                break;

            case "PAGADA":
                if (!pagado.eq(solicitado)) {
                    agregar(
                        "El estado PAGADA no coincide con el importe efectivamente desembolsado."
                    );
                }
                break;

            default:
                agregar("Estado financiero no reconocido.");
        }
    }

    for (const compra of compras) {
        const ordenesCompra = opPorCompra.get(compra.id) ?? [];

        let valorRecibido = cero();
        let recepcionesInvalidas = false;

        for (const detalle of compra.detalles) {
            const recibido = detalle.recepciones.reduce(
                (suma, recepcion) => {
                    if (
                        !Number.isSafeInteger(recepcion.cantidad) ||
                        recepcion.cantidad <= 0
                    ) {
                        recepcionesInvalidas = true;
                    }
                    return suma + recepcion.cantidad;
                },
                0
            );

            if (
                recibido > detalle.cantidad ||
                detalle.cantidad <= 0 ||
                detalle.precioUnitario.isNegative()
            ) {
                recepcionesInvalidas = true;
            }

            valorRecibido = valorRecibido.add(
                detalle.precioUnitario
                    .mul(recibido)
                    .toDecimalPlaces(
                        2,
                        Prisma.Decimal.ROUND_HALF_UP
                    )
            );
        }

        let comprometido = cero();

        for (const orden of ordenesCompra) {
            if (orden.moneda !== compra.moneda) {
                incidencias.push({
                    clave: `oc-${compra.id}-moneda-${orden.id}`,
                    tipo: "OC",
                    id: compra.id,
                    descripcion:
                        `La OP #${orden.id} tiene moneda ${orden.moneda}, ` +
                        `pero la compra utiliza ${compra.moneda}.`,
                });
            }

            if (orden.estado !== "RECHAZADA") {
                comprometido = comprometido.add(
                    orden.montoSolicitado
                );
            }
        }

        if (recepcionesInvalidas) {
            incidencias.push({
                clave: `oc-${compra.id}-recepciones`,
                tipo: "OC",
                id: compra.id,
                descripcion:
                    "Hay cantidades o costos inconsistentes en las líneas recibidas.",
            });
        }

        if (comprometido.gt(valorRecibido)) {
            incidencias.push({
                clave: `oc-${compra.id}-saldo`,
                tipo: "OC",
                id: compra.id,
                descripcion:
                    `Comprometido ${dinero(compra.moneda, comprometido)} ` +
                    `frente a ${dinero(compra.moneda, valorRecibido)} recibidos.`,
            });
        }
    }

    // Detectar OP asociadas a una OC que no se haya recuperado.
    const comprasEncontradas = new Set(
        compras.map((compra) => compra.id)
    );

    for (const compraId of opPorCompra.keys()) {
        if (!comprasEncontradas.has(compraId)) {
            incidencias.push({
                clave: `oc-${compraId}-ausente`,
                tipo: "OC",
                id: compraId,
                descripcion:
                    "No fue posible encontrar la compra asociada para su conciliación.",
            });
        }
    }

    const sinIncidencias = incidencias.length === 0;

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-8">
            <div className="space-y-4">
                <Link
                    href="/dashboard/ordenes-pago"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Órdenes de Pago
                </Link>

                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-secondary p-3 text-primary">
                        <ClipboardCheck className="h-6 w-6" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Conciliación financiera
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Verificación de importes, estados y desembolsos.
                            Esta pantalla no modifica registros.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Órdenes de Pago revisadas
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {ordenes.length}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Compras revisadas
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary">
                        {compras.length}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Incidencias detectadas
                    </p>
                    <p
                        className={`mt-3 text-3xl font-bold ${sinIncidencias
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                    >
                        {incidencias.length}
                    </p>
                </div>
            </div>

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center gap-3 border-b px-6 py-5">
                    {sinIncidencias ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    ) : (
                        <ShieldAlert className="h-5 w-5 text-red-700" />
                    )}

                    <div>
                        <h2 className="font-semibold">
                            Resultado de conciliación
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Cada incidencia indica qué documento
                            necesita revisión.
                        </p>
                    </div>
                </div>

                {sinIncidencias ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />

                        <p className="font-semibold">
                            No se detectaron inconsistencias
                        </p>

                        <p className="max-w-lg text-sm text-muted-foreground">
                            Los importes y estados revisados cumplen
                            las reglas actuales de conciliación.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {incidencias.map((incidencia) => (
                            <div
                                key={incidencia.clave}
                                className="flex flex-wrap items-start justify-between gap-4 px-6 py-4"
                            >
                                <div className="flex gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            {incidencia.tipo}-
                                            {String(incidencia.id).padStart(
                                                4,
                                                "0"
                                            )}
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {incidencia.descripcion}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href={
                                        incidencia.tipo === "OP"
                                            ? `/dashboard/ordenes-pago/${incidencia.id}`
                                            : `/dashboard/compras/${incidencia.id}`
                                    }
                                    className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
                                >
                                    Revisar documento
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <p className="text-xs leading-5 text-muted-foreground">
                La conciliación utiliza los importes almacenados
                y las recepciones registradas. No acredita
                por sí misma la existencia de una transferencia
                bancaria ni sustituye la conciliación con
                extractos bancarios.
            </p>
        </div>
    );
}
