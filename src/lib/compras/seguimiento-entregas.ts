
export type SituacionEntrega =
    | "RECIBIDA"
    | "SIN_FECHA"
    | "ATRASADA"
    | "HOY"
    | "PROGRAMADA";

type DatosOrden = {
    estado: string;
    fechaEntregaEstimada: Date | null;
};

export function fechaActualPeru(): string {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const valor = (tipo: string) =>
        partes.find((parte) => parte.type === tipo)?.value ?? "";

    return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function fechaEntregaISO(fecha: Date): string {
    // La fecha de entrega fue registrada como una fecha
    // de calendario, a las 12:00 UTC.
    // Usamos UTC para evitar que cambie de día.
    return fecha.toISOString().slice(0, 10);
}

export function calcularSituacionEntrega(
    orden: DatosOrden,
    hoy = fechaActualPeru()
): SituacionEntrega {
    if (orden.estado === "RECIBIDO") {
        return "RECIBIDA";
    }

    if (!orden.fechaEntregaEstimada) {
        return "SIN_FECHA";
    }

    const entrega = fechaEntregaISO(orden.fechaEntregaEstimada);

    if (entrega < hoy) return "ATRASADA";
    if (entrega === hoy) return "HOY";

    return "PROGRAMADA";
}

export function formatearFechaEntrega(
    fecha: Date | null
): string {
    if (!fecha) return "No especificada";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(fecha);
}
