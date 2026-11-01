import { TabsProveedor } from "./tabs-proveedor";
import { RecepcionesProveedor } from "./recepciones-proveedor";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMPRAS_LECTURA } from "@/lib/compras-roles";

type PageProps = {
    params: Promise<{ id: string }>;
};

type ResumenMoneda = {
    moneda: string;
    comprado: number;
    recibido: number;
    pagado: number;
};

function formatearDinero(monto: number, moneda: string) {
    const simbolo =
        moneda === "PEN"
            ? "S/"
            : moneda === "USD"
                ? "US$"
                : moneda;

    return `${simbolo} ${monto.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatearFecha(fecha: Date | null | undefined) {
    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(fecha);
}

function EstadoBadge({ estado }: { estado: string }) {
    const normalizado = estado.toUpperCase();

    const esPositivo = [
        "COMPLETADO",
        "COMPLETADA",
        "PAGADO",
        "PAGADA",
        "AUTORIZADA",
        "APROBADA",
    ].includes(normalizado);

    const esNegativo =
        normalizado.includes("RECHAZ") ||
        normalizado.includes("CANCEL") ||
        normalizado.includes("ANUL");

    const estilos = esPositivo
        ? "bg-green-50 text-[#238B55]"
        : esNegativo
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-700";

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estilos}`}
        >
            {estado.replaceAll("_", " ")}
        </span>
    );
}

function Indicador({
    titulo,
    valor,
    descripcion,
}: {
    titulo: string;
    valor: string | number;
    descripcion: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
                {titulo}
            </p>

            <p className="mt-3 text-3xl font-bold text-[#123E70]">
                {valor}
            </p>

            <p className="mt-2 text-xs text-slate-500">
                {descripcion}
            </p>
        </div>
    );
}

function Dato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string | null | undefined;
}) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {titulo}
            </p>

            <p className="break-words text-sm font-medium text-slate-800">
                {valor || "No registrado"}
            </p>
        </div>
    );
}

function LineaImporte({
    titulo,
    monto,
    moneda,
}: {
    titulo: string;
    monto: number;
    moneda: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-slate-600">{titulo}</span>

            <span className="text-right font-bold text-slate-800">
                {formatearDinero(monto, moneda)}
            </span>
        </div>
    );
}

export default async function DetalleProveedorPage({
    params,
}: PageProps) {
    // 1. Seguridad y validación del identificador
    const usuario = await exigirRol(ROLES_COMPRAS_LECTURA);

    const puedeVerPagos =
        usuario.rol === "SUPER_ADMIN" ||
        usuario.rol === "ADMIN";

    const { id } = await params;
    const proveedorId = Number(id);

    if (
        !Number.isSafeInteger(proveedorId) ||
        proveedorId <= 0
    ) {
        notFound();
    }

    // 2. Consultar proveedor, compras y recepciones
    const proveedor = await prisma.proveedor.findUnique({
        where: {
            id: proveedorId,
        },
        include: {
            compras: {
                orderBy: {
                    fecha: "desc",
                },
                include: {
                    detalles: {
                        select: {
                            id: true,
                            cantidad: true,
                            precioUnitario: true,
                        },
                    },
                    recepciones: {
                        select: {
                            id: true,
                            detalleCompraId: true,
                            cantidad: true,
                            fecha: true,
                        },
                    },
                },
            },
        },
    });

    if (!proveedor) {
        notFound();
    }

    // 3. Consultar finanzas únicamente con permiso.
    // Incluimos desembolsos explícitamente para que
    // Prisma y TypeScript reconozcan la relación.
    const ordenesPagoProveedor = puedeVerPagos
        ? await prisma.ordenPago.findMany({
            where: {
                compra: {
                    proveedorId: proveedor.id,
                },
            },
            include: {
                desembolsos: {
                    orderBy: {
                        fechaPago: "desc",
                    },
                },
            },
            orderBy: {
                fechaSolicitud: "desc",
            },
        })
        : [];

    // 4. Agrupar las OP por compra
    const pagosPorCompra = new Map<
        number,
        typeof ordenesPagoProveedor
    >();

    for (const orden of ordenesPagoProveedor) {
        const actuales = pagosPorCompra.get(orden.compraId) ?? [];

        actuales.push(orden);

        pagosPorCompra.set(orden.compraId, actuales);
    }

    // 5. Preparar resúmenes por moneda
    const resumenPorMoneda = new Map<
        string,
        ResumenMoneda
    >();

    function obtenerResumen(moneda: string) {
        let resumen = resumenPorMoneda.get(moneda);

        if (!resumen) {
            resumen = {
                moneda,
                comprado: 0,
                recibido: 0,
                pagado: 0,
            };

            resumenPorMoneda.set(moneda, resumen);
        }

        return resumen;
    }

    let unidadesSolicitadas = 0;
    let unidadesRecibidas = 0;
    let cantidadRecepciones = 0;

    // 6. Calcular datos de cada compra
    const compras = proveedor.compras.map((compra) => {
        const moneda = String(compra.moneda);

        const resumen = obtenerResumen(moneda);

        const importeOrden = Number(compra.importeTotal);

        resumen.comprado += importeOrden;

        const detallesPorId = new Map(
            compra.detalles.map((detalle) => [
                detalle.id,
                detalle,
            ])
        );

        const solicitado = compra.detalles.reduce(
            (suma, detalle) => suma + detalle.cantidad,
            0
        );

        const recibido = compra.recepciones.reduce(
            (suma, recepcion) => suma + recepcion.cantidad,
            0
        );

        // Solo se valoran las unidades que cuentan
        // con una recepción registrada.
        const valorRecibido = compra.recepciones.reduce(
            (suma, recepcion) => {
                const detalle = detallesPorId.get(
                    recepcion.detalleCompraId
                );

                if (!detalle) {
                    return suma;
                }

                return (
                    suma +
                    recepcion.cantidad *
                    Number(detalle.precioUnitario)
                );
            },
            0
        );

        resumen.recibido += valorRecibido;

        unidadesSolicitadas += solicitado;
        unidadesRecibidas += recibido;

        cantidadRecepciones += compra.recepciones.length;

        const ordenesPago =
            pagosPorCompra.get(compra.id) ?? [];

        return {
            id: compra.id,
            fecha: compra.fecha,
            fechaEntregaEstimada: compra.fechaEntregaEstimada,
            estado: compra.estado,
            moneda,
            importeOrden,
            solicitado,
            recibido,
            valorRecibido,
            cantidadRecepciones: compra.recepciones.length,
            cantidadOP: ordenesPago.length,
        };
    });

    // 7. Calcular dinero desembolsado por moneda
    let cantidadDesembolsos = 0;

    for (const orden of ordenesPagoProveedor) {
        const moneda = String(orden.moneda);
        const resumen = obtenerResumen(moneda);

        for (const desembolso of orden.desembolsos) {
            resumen.pagado += Number(desembolso.monto);
            cantidadDesembolsos++;
        }
    }

    const resumenMonedas = Array.from(
        resumenPorMoneda.values()
    ).sort((a, b) => a.moneda.localeCompare(b.moneda));

    const porcentajeRecepcion =
        unidadesSolicitadas > 0
            ? Math.min(
                100,
                (unidadesRecibidas / unidadesSolicitadas) * 100
            )
            : 0;

    return (
        <main className="space-y-6 p-4 md:p-6">
            {/* Encabezado */}
            <header className="space-y-4">
                <Link
                    href="/dashboard/proveedores"
                    className="inline-flex items-center text-sm font-semibold text-[#087EBD] hover:underline"
                >
                    ← Volver a proveedores
                </Link>

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Proveedores / Detalle
                        </p>

                        <h1 className="mt-2 text-2xl font-bold text-[#123E70] md:text-3xl">
                            {proveedor.razonSocial}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            RUC: {proveedor.ruc}
                        </p>
                    </div>

                    <span
                        className={`self-start rounded-full px-4 py-2 text-sm font-semibold ${proveedor.estado
                            ? "bg-green-50 text-[#238B55]"
                            : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        {proveedor.estado
                            ? "Proveedor activo"
                            : "Proveedor inactivo"}
                    </span>
                </div>
            </header>

            {/* Indicadores */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Indicador
                    titulo="Órdenes de compra"
                    valor={compras.length}
                    descripcion="OC vinculadas"
                />

                <Indicador
                    titulo="Recepciones"
                    valor={cantidadRecepciones}
                    descripcion="Ingresos registrados"
                />

                <Indicador
                    titulo="Unidades solicitadas"
                    valor={unidadesSolicitadas.toLocaleString("es-PE")}
                    descripcion="Según las órdenes de compra"
                />

                <Indicador
                    titulo="Unidades recibidas"
                    valor={unidadesRecibidas.toLocaleString("es-PE")}
                    descripcion="Según recepciones efectivas"
                />
            </section>

            <TabsProveedor
                general={
                    <div className="space-y-6">
                        {/* Información del proveedor */}
                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-5 text-lg font-bold text-[#123E70]">
                                Información general
                            </h2>

                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                <Dato
                                    titulo="Razón social"
                                    valor={proveedor.razonSocial}
                                />

                                <Dato
                                    titulo="RUC"
                                    valor={proveedor.ruc}
                                />

                                <Dato
                                    titulo="Persona de contacto"
                                    valor={proveedor.contacto}
                                />

                                <Dato
                                    titulo="Teléfono"
                                    valor={proveedor.telefono}
                                />

                                <Dato
                                    titulo="Correo electrónico"
                                    valor={proveedor.correo}
                                />

                                <Dato
                                    titulo="Dirección"
                                    valor={proveedor.direccion}
                                />
                            </div>
                        </section>

                        {/* Resumen económico */}
                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-[#123E70]">
                                Resumen económico
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Importes separados por moneda. Los valores
                                recibidos se calculan según las cantidades
                                ingresadas y los precios de las órdenes de compra.
                            </p>

                            {resumenMonedas.length === 0 ? (
                                <p className="mt-5 text-sm text-slate-500">
                                    Este proveedor todavía no registra compras.
                                </p>
                            ) : (
                                <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                    {resumenMonedas.map((resumen) => (
                                        <div
                                            key={resumen.moneda}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                        >
                                            <h3 className="mb-4 font-bold text-[#123E70]">
                                                Moneda: {resumen.moneda}
                                            </h3>

                                            <div className="space-y-4">
                                                <LineaImporte
                                                    titulo="Importe total de OC"
                                                    monto={resumen.comprado}
                                                    moneda={resumen.moneda}
                                                />

                                                <LineaImporte
                                                    titulo="Valor de mercadería recibida"
                                                    monto={resumen.recibido}
                                                    moneda={resumen.moneda}
                                                />

                                                {puedeVerPagos && (
                                                    <>
                                                        <div className="border-t border-slate-200 pt-4">
                                                            <LineaImporte
                                                                titulo="Total desembolsado"
                                                                monto={resumen.pagado}
                                                                moneda={resumen.moneda}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="mt-4 text-xs text-slate-500">
                                El valor recibido es una valorización de las
                                recepciones a precio de OC. No representa por sí
                                solo el saldo pendiente de pago.
                            </p>
                        </section>
                    </div>
                }
                compras={
                    <div className="space-y-6">
                        {/* Historial de compras */}
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5">
                                <h2 className="text-lg font-bold text-[#123E70]">
                                    Historial de órdenes de compra
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Órdenes emitidas y seguimiento de sus recepciones.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Orden</th>
                                            <th className="px-4 py-4">Estado</th>
                                            <th className="px-4 py-4 text-right">
                                                Importe
                                            </th>
                                            <th className="px-4 py-4 text-center">
                                                Unidades
                                            </th>
                                            <th className="px-4 py-4 text-center">
                                                Recepciones
                                            </th>
                                            <th className="px-4 py-4 text-center">
                                                Entrega estimada
                                            </th>
                                            <th className="px-5 py-4 text-right">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {compras.map((compra) => (
                                            <tr
                                                key={compra.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-[#123E70]">
                                                        OC #{compra.id}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatearFecha(compra.fecha)}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <EstadoBadge estado={compra.estado} />
                                                </td>

                                                <td className="px-4 py-4 text-right font-semibold text-slate-800">
                                                    {formatearDinero(
                                                        compra.importeOrden,
                                                        compra.moneda
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <p className="font-semibold text-slate-800">
                                                        {compra.recibido} / {compra.solicitado}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Recibidas / Solicitadas
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {compra.cantidadRecepciones}
                                                </td>

                                                <td className="px-4 py-4 text-center text-slate-600">
                                                    {formatearFecha(
                                                        compra.fechaEntregaEstimada
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/compras/${compra.id}`}
                                                        className="font-semibold text-[#087EBD] hover:underline"
                                                    >
                                                        Ver OC
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {compras.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="font-semibold text-slate-700">
                                        Sin órdenes de compra
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Este proveedor aún no tiene compras registradas.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                }
                recepciones={
                    <div className="space-y-6">
                        {/* Seguimiento de recepciones */}
                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#123E70]">
                                        Seguimiento de recepciones
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Comparación de unidades solicitadas y recibidas.
                                    </p>
                                </div>

                                <span className="text-xl font-bold text-[#087EBD]">
                                    {porcentajeRecepcion.toFixed(1)}%
                                </span>
                            </div>

                            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-[#238B55]"
                                    style={{
                                        width: `${porcentajeRecepcion}%`,
                                    }}
                                />
                            </div>

                            <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500">
                                <span>
                                    {unidadesRecibidas.toLocaleString("es-PE")} recibidas
                                </span>

                                <span>
                                    {unidadesSolicitadas.toLocaleString("es-PE")} solicitadas
                                </span>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Este porcentaje representa unidades físicas,
                                no cumplimiento monetario ni puntualidad.
                            </p>
                        </section>

                        {/* Desglose de recepciones por OC y producto */}
                        <RecepcionesProveedor proveedorId={proveedor.id} />
                    </div>
                }
                finanzas={puedeVerPagos ? (
                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5">
                                <h2 className="text-lg font-bold text-[#123E70]">
                                    Órdenes de pago y desembolsos
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {ordenesPagoProveedor.length} órdenes de pago
                                    y {cantidadDesembolsos} desembolsos registrados.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Orden de pago</th>
                                            <th className="px-4 py-4">Compra</th>
                                            <th className="px-4 py-4">Estado</th>
                                            <th className="px-4 py-4 text-right">
                                                Solicitado
                                            </th>
                                            <th className="px-4 py-4 text-right">
                                                Desembolsado
                                            </th>
                                            <th className="px-5 py-4 text-right">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {ordenesPagoProveedor.map((orden) => {
                                            const montoDesembolsado =
                                                orden.desembolsos.reduce(
                                                    (suma, desembolso) =>
                                                        suma + Number(desembolso.monto),
                                                    0
                                                );

                                            return (
                                                <tr
                                                    key={orden.id}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-bold text-[#123E70]">
                                                            OP #{orden.id}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatearFecha(
                                                                orden.fechaSolicitud
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <Link
                                                            href={`/dashboard/compras/${orden.compraId}`}
                                                            className="font-semibold text-[#087EBD] hover:underline"
                                                        >
                                                            OC #{orden.compraId}
                                                        </Link>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <EstadoBadge
                                                            estado={String(orden.estado)}
                                                        />
                                                    </td>

                                                    <td className="px-4 py-4 text-right text-slate-700">
                                                        {formatearDinero(
                                                            Number(orden.montoSolicitado),
                                                            String(orden.moneda)
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-semibold text-slate-800">
                                                        {formatearDinero(
                                                            montoDesembolsado,
                                                            String(orden.moneda)
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Link
                                                            href={`/dashboard/ordenes-pago/${orden.id}`}
                                                            className="font-semibold text-[#087EBD] hover:underline"
                                                        >
                                                            Ver OP
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {ordenesPagoProveedor.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="font-semibold text-slate-700">
                                        Sin órdenes de pago
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        No se registran órdenes de pago para este
                                        proveedor.
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                                <p className="text-xs text-slate-500">
                                    Los importes desembolsados corresponden a pagos
                                    registrados. No se consideran pagos las órdenes
                                    únicamente solicitadas o autorizadas.
                                </p>
                            </div>
                        </section>
                    </div>
                ) : undefined}
            />
        </main>
    );
}
