
"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardList,
    Loader2,
    LockKeyhole,
    UnlockKeyhole,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    liberarRetencionLote,
    registrarRetencionLote,
} from "./retenciones-actions";

type Retencion = {
    id: number;
    cantidad: number;
    motivo: string;
    estado: "ACTIVA" | "LIBERADA";
    fechaRegistro: string;
    registradoPor: string;
    fechaLiberacion: string | null;
    liberadoPor: string | null;
    motivoLiberacion: string | null;
};

type Props = {
    loteId: number;
    stockFisico: number;
    retenciones: Retencion[];
    puedeGestionar: boolean;
};

function NuevaRetencion({
    loteId,
    maximo,
}: {
    loteId: number;
    maximo: number;
}) {
    const router = useRouter();
    const [estado, accion, pendiente] = useActionState(
        registrarRetencionLote,
        undefined
    );

    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("");

    useEffect(() => {
        if (estado?.ok) {
            setCantidad("");
            setMotivo("");
            router.refresh();
        }
    }, [estado?.ok, router]);

    const cantidadNumero = Number(cantidad);

    const valido =
        /^\d+$/.test(cantidad) &&
        Number.isSafeInteger(cantidadNumero) &&
        cantidadNumero > 0 &&
        cantidadNumero <= maximo &&
        cantidadNumero <= 1000000 &&
        motivo.trim().length >= 10 &&
        motivo.trim().length <= 500;

    return (
        <form
            action={accion}
            className="space-y-4 rounded-xl border bg-secondary/20 p-4"
        >
            <input type="hidden" name="loteId" value={loteId} />

            <div>
                <h3 className="font-semibold">
                    Registrar retención parcial
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    Unidades libres para retener: {maximo}
                </p>
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="retencion-cantidad"
                    className="block text-sm font-medium"
                >
                    Cantidad a retener *
                </label>

                <input
                    id="retencion-cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    max={maximo}
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    disabled={pendiente || maximo <= 0}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="retencion-motivo"
                    className="block text-sm font-medium"
                >
                    Motivo de retención *
                </label>

                <textarea
                    id="retencion-motivo"
                    name="motivo"
                    rows={3}
                    maxLength={500}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    disabled={pendiente || maximo <= 0}
                    placeholder="Ej. Se inmovilizan 12 cajas por daños en el embalaje."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
            </div>

            {estado?.error && (
                <p role="alert" className="text-sm text-red-700">
                    {estado.error}
                </p>
            )}

            {estado?.ok && (
                <p role="status" className="text-sm text-emerald-700">
                    {estado.ok}
                </p>
            )}

            <Button
                type="submit"
                disabled={pendiente || !valido}
                className="gap-2 bg-[#123E70] hover:bg-[#0c315b]"
            >
                {pendiente ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <LockKeyhole className="h-4 w-4" />
                )}
                Registrar retención
            </Button>
        </form>
    );
}

function LiberarRetencion({
    retencionId,
}: {
    retencionId: number;
}) {
    const router = useRouter();
    const [abierto, setAbierto] = useState(false);
    const [motivo, setMotivo] = useState("");

    const [estado, accion, pendiente] = useActionState(
        liberarRetencionLote,
        undefined
    );

    useEffect(() => {
        if (estado?.ok) {
            setAbierto(false);
            router.refresh();
        }
    }, [estado?.ok, router]);

    if (!abierto) {
        return (
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setAbierto(true)}
                className="gap-2"
            >
                <UnlockKeyhole className="h-4 w-4" />
                Liberar
            </Button>
        );
    }

    return (
        <form action={accion} className="space-y-2">
            <input
                type="hidden"
                name="retencionId"
                value={retencionId}
            />

            <textarea
                name="motivoLiberacion"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={500}
                disabled={pendiente}
                placeholder="Motivo de liberación (mínimo 10 caracteres)"
                className="w-full min-w-52 rounded-lg border bg-background p-2 text-xs"
                rows={3}
            />

            {estado?.error && (
                <p role="alert" className="text-xs text-red-700">
                    {estado.error}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    type="submit"
                    disabled={
                        pendiente ||
                        motivo.trim().length < 10 ||
                        motivo.trim().length > 500
                    }
                >
                    {pendiente && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Confirmar liberación
                </Button>

                <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    disabled={pendiente}
                    onClick={() => setAbierto(false)}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

export function RetencionesPanel({
    loteId,
    stockFisico,
    retenciones,
    puedeGestionar,
}: Props) {
    const retenidas = retenciones
        .filter((retencion) => retencion.estado === "ACTIVA")
        .reduce((total, retencion) => total + retencion.cantidad, 0);

    const libres = Math.max(0, stockFisico - retenidas);

    const fecha = (valor: string) =>
        new Intl.DateTimeFormat("es-PE", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "America/Lima",
        }).format(new Date(valor));

    return (
        <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-6 py-5">
                <ClipboardList className="h-5 w-5 text-primary" />
                <div>
                    <h2 className="font-semibold">
                        Retenciones parciales de calidad
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Inmovilización parcial de existencias
                        sin modificar el stock físico.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/30 p-4">
                    <p className="text-xs text-muted-foreground">
                        Stock físico
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                        {stockFisico}
                    </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-4">
                    <p className="text-xs text-amber-800">
                        Unidades retenidas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-amber-800">
                        {retenidas}
                    </p>
                </div>

                <div className="rounded-lg bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-800">
                        Unidades sin retención parcial
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">
                        {libres}
                    </p>
                </div>
            </div>

            {puedeGestionar && (
                <div className="border-t p-5">
                    <NuevaRetencion
                        loteId={loteId}
                        maximo={libres}
                    />
                </div>
            )}

            <div className="border-t px-6 py-4">
                <h3 className="text-sm font-semibold">
                    Historial de retenciones
                </h3>
            </div>

            {retenciones.length === 0 ? (
                <p className="border-t p-6 text-sm text-muted-foreground">
                    Este lote no tiene retenciones registradas.
                </p>
            ) : (
                <div className="divide-y border-t">
                    {retenciones.map((retencion) => (
                        <div
                            key={retencion.id}
                            className="flex flex-wrap justify-between gap-4 p-5"
                        >
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">
                                        {retencion.cantidad} unidades
                                    </span>

                                    <span
                                        className={`rounded-full px-2 py-1 text-xs ${retencion.estado === "ACTIVA"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-emerald-50 text-emerald-700"
                                            }`}
                                    >
                                        {retencion.estado === "ACTIVA"
                                            ? "Retenidas"
                                            : "Liberadas"}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {retencion.motivo}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    Registrada por {retencion.registradoPor}
                                    {" · "}{fecha(retencion.fechaRegistro)}
                                </p>

                                {retencion.fechaLiberacion && (
                                    <p className="text-xs text-muted-foreground">
                                        Liberada por{" "}
                                        {retencion.liberadoPor ?? "No registrado"}
                                        {" · "}{fecha(retencion.fechaLiberacion)}
                                        {" · "}
                                        {retencion.motivoLiberacion}
                                    </p>
                                )}
                            </div>

                            {puedeGestionar &&
                                retencion.estado === "ACTIVA" && (
                                    <LiberarRetencion
                                        retencionId={retencion.id}
                                    />
                                )}
                        </div>
                    ))}
                </div>
            )}

            <p className="border-t bg-secondary/20 px-6 py-3 text-xs text-muted-foreground">
                Las unidades sin retención parcial no equivalen
                necesariamente a stock apto para venta. También
                deben verificarse el vencimiento y el estado
                general de calidad del lote.
            </p>
        </section>
    );
}
