
import { Prisma } from "@/generated/prisma/client";

const Decimal = Prisma.Decimal;

const ESTADOS_COMPROMETIDOS = [
    "SOLICITADA",
    "APROBADA",
    "PAGO_PARCIAL",
    "PAGADA",
] as const;

type DetalleParaSaldo = {
    cantidad: number;
    precioUnitario: Prisma.Decimal;
    recepciones: {
        cantidad: number;
    }[];
};

type OrdenPagoParaSaldo = {
    estado: string;
    montoSolicitado: Prisma.Decimal;
};

export type SaldoOrdenCompra = {
    valorRecibido: Prisma.Decimal;
    montoComprometido: Prisma.Decimal;
    disponible: Prisma.Decimal;
};

export function calcularSaldoOrdenCompra(
    detalles: DetalleParaSaldo[],
    ordenesPago: OrdenPagoParaSaldo[]
): SaldoOrdenCompra {
    let valorRecibido = new Decimal(0);

    for (const detalle of detalles) {
        if (
            !Number.isSafeInteger(detalle.cantidad) ||
            detalle.cantidad <= 0
        ) {
            throw new Error(
                "La Orden de Compra tiene cantidades inválidas."
            );
        }

        const cantidadRecibida = detalle.recepciones.reduce(
            (total, recepcion) => {
                if (
                    !Number.isSafeInteger(recepcion.cantidad) ||
                    recepcion.cantidad <= 0
                ) {
                    throw new Error(
                        "Existe una recepción con cantidad inválida."
                    );
                }

                return total + recepcion.cantidad;
            },
            0
        );

        if (cantidadRecibida > detalle.cantidad) {
            throw new Error(
                "Existen recepciones superiores a lo solicitado."
            );
        }

        if (
            detalle.precioUnitario.isNegative() ||
            !detalle.precioUnitario.isFinite()
        ) {
            throw new Error(
                "Existe un costo unitario inválido en la compra."
            );
        }

        const valorLinea = detalle.precioUnitario
            .mul(cantidadRecibida)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        valorRecibido = valorRecibido.add(valorLinea);
    }

    let montoComprometido = new Decimal(0);

    for (const orden of ordenesPago) {
        if (
            ESTADOS_COMPROMETIDOS.some(
                (estado) => estado === orden.estado
            )
        ) {
            montoComprometido = montoComprometido.add(
                orden.montoSolicitado
            );
        } else if (orden.estado !== "RECHAZADA") {
            // Evita liberar dinero accidentalmente
            // si aparece un estado que aún no contemplamos.
            throw new Error(
                "Existe una Orden de Pago con estado desconocido."
            );
        }
    }

    const disponible = valorRecibido.sub(montoComprometido);

    if (disponible.isNegative()) {
        throw new Error(
            "El importe comprometido supera el valor recibido."
        );
    }

    return {
        valorRecibido,
        montoComprometido,
        disponible,
    };
}
