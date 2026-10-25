
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    PackageCheck,
    Plus,
    Trash2,
    Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { recibirCompraConLotes } from "./actions";

type Linea = {
    id: number;
    codigo: string;
    nombre: string;
    precioUnitario: string;
    pendiente: number;
};

type Partida = {
    clave: number;
    detalleCompraId: number;
    cantidad: string;
    numeroLote: string;
    fechaVencimiento: string;
};

const campo =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20";

function FormularioRecepcion({
    compraId,
    lineas,
    onExito,
    onCancelar,
}: {
    compraId: number;
    lineas: Linea[];
    onExito: () => void;
    onCancelar: () => void;
}) {
    const router = useRouter();

    const [estado, accion, pendiente] = useActionState(
        recibirCompraConLotes,
        undefined
    );

    const [partidas, setPartidas] = useState<Partida[]>([
        {
            clave: 1,
            detalleCompraId: lineas[0]?.id ?? 0,
            cantidad: "",
            numeroLote: "",
            fechaVencimiento: "",
        },
    ]);

    const [siguienteClave, setSiguienteClave] = useState(2);

    useEffect(() => {
        if (estado?.ok) {
            onExito();
            router.refresh();
        }
    }, [estado?.ok, onExito, router]);

    function actualizar(
        clave: number,
        campoPartida:
            | "detalleCompraId"
            | "cantidad"
            | "numeroLote"
            | "fechaVencimiento",
        valor: string
    ) {
        setPartidas((actuales) =>
            actuales.map((partida) =>
                partida.clave !== clave
                    ? partida
                    : {
                        ...partida,
                        [campoPartida]:
                            campoPartida === "detalleCompraId"
                                ? Number(valor)
                                : valor,
                    }
            )
        );
    }

    function agregarPartida() {
        if (partidas.length >= 100) return;

        setPartidas((actuales) => [
            ...actuales,
            {
                clave: siguienteClave,
                detalleCompraId: lineas[0]?.id ?? 0,
                cantidad: "",
                numeroLote: "",
                fechaVencimiento: "",
            },
        ]);

        setSiguienteClave((actual) => actual + 1);
    }

    const totales = new Map<number, number>();

    for (const partida of partidas) {
        const cantidad = Number(partida.cantidad);

        if (Number.isFinite(cantidad)) {
            totales.set(
                partida.detalleCompraId,
                (totales.get(partida.detalleCompraId) ?? 0) +
                cantidad
            );
        }
    }

    const superaPendiente = lineas.some(
        (linea) =>
            (totales.get(linea.id) ?? 0) > linea.pendiente
    );

    const partidasValidas = partidas.every((partida) => {
        const cantidad = Number(partida.cantidad);

        return (
            lineas.some((linea) => linea.id === partida.detalleCompraId) &&
            partida.cantidad.trim() !== "" &&
            Number.isSafeInteger(cantidad) &&
            cantidad >= 1 &&
            cantidad <= 1000000 &&
            partida.numeroLote.trim().length >= 1 &&
            partida.numeroLote.trim().length <= 90 &&
            /^\d{4}-\d{2}-\d{2}$/.test(
                partida.fechaVencimiento
            )
        );
    });

    const fechasPorLote = new Map<string, string>();
    let conflictoVencimiento = false;

    for (const partida of partidas) {
        const linea = lineas.find(
            (item) => item.id === partida.detalleCompraId
        );

        if (!linea || !partida.numeroLote.trim()) continue;

        const clave = `${linea.codigo}::${partida.numeroLote.trim()}`;
        const anterior = fechasPorLote.get(clave);

        if (
            anterior &&
            partida.fechaVencimiento &&
            anterior !== partida.fechaVencimiento
        ) {
            conflictoVencimiento = true;
        }

        if (partida.fechaVencimiento) {
            fechasPorLote.set(clave, partida.fechaVencimiento);
        }
    }

    const totalRecibir = partidas.reduce(
        (total, partida) =>
            total + (Number(partida.cantidad) || 0),
        0
    );

    const payload = JSON.stringify({
        compraId,
        partidas: partidas.map((partida) => ({
            detalleCompraId: partida.detalleCompraId,
            cantidad: Number(partida.cantidad),
            numeroLote: partida.numeroLote.trim(),
            fechaVencimiento: partida.fechaVencimiento,
        })),
    });

    return (
        <form action={accion} className="space-y-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-[#123E70]">
                Registra únicamente la mercadería recibida
                físicamente. Cada partida debe indicar su lote
                de fabricante y vencimiento.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-semibold">
                        Partidas recibidas
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Puedes añadir más lotes para una misma línea.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={agregarPartida}
                    disabled={pendiente || partidas.length >= 100}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Añadir lote
                </Button>
            </div>

            <div className="space-y-3">
                {partidas.map((partida, indice) => {
                    const linea = lineas.find(
                        (item) =>
                            item.id === partida.detalleCompraId
                    );

                    const cantidadEnOtrasPartidas = partidas
                        .filter(
                            (item) =>
                                item.clave !== partida.clave &&
                                item.detalleCompraId ===
                                partida.detalleCompraId
                        )
                        .reduce(
                            (total, item) =>
                                total + (Number(item.cantidad) || 0),
                            0
                        );

                    const maximo = Math.max(
                        0,
                        (linea?.pendiente ?? 0) -
                        cantidadEnOtrasPartidas
                    );

                    return (
                        <div
                            key={partida.clave}
                            className="space-y-4 rounded-xl border bg-secondary/25 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground">
                                    PARTIDA {indice + 1}
                                </p>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={
                                        pendiente ||
                                        partidas.length === 1
                                    }
                                    onClick={() =>
                                        setPartidas((actuales) =>
                                            actuales.filter(
                                                (item) =>
                                                    item.clave !==
                                                    partida.clave
                                            )
                                        )
                                    }
                                    className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Quitar
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Producto / línea de OC</Label>

                                <select
                                    aria-label={`Línea de OC para partida ${indice + 1}`}
                                    value={partida.detalleCompraId}
                                    onChange={(e) =>
                                        actualizar(
                                            partida.clave,
                                            "detalleCompraId",
                                            e.target.value
                                        )
                                    }
                                    disabled={pendiente}
                                    className={campo}
                                >
                                    {lineas.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.codigo} — {item.nombre}
                                            {" · "}Línea #{item.id}
                                            {" · "}Costo {item.precioUnitario}
                                            {" · "}Pendiente {item.pendiente}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Cantidad recibida *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={maximo}
                                        step="1"
                                        value={partida.cantidad}
                                        onChange={(e) =>
                                            actualizar(
                                                partida.clave,
                                                "cantidad",
                                                e.target.value
                                            )
                                        }
                                        disabled={pendiente}
                                        required
                                        className="h-10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>N.º lote fabricante *</Label>
                                    <Input
                                        value={partida.numeroLote}
                                        onChange={(e) =>
                                            actualizar(
                                                partida.clave,
                                                "numeroLote",
                                                e.target.value
                                            )
                                        }
                                        disabled={pendiente}
                                        maxLength={90}
                                        required
                                        placeholder="Ej. L240815A"
                                        className="h-10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Vencimiento *</Label>
                                    <Input
                                        type="date"
                                        value={
                                            partida.fechaVencimiento
                                        }
                                        onChange={(e) =>
                                            actualizar(
                                                partida.clave,
                                                "fechaVencimiento",
                                                e.target.value
                                            )
                                        }
                                        disabled={pendiente}
                                        required
                                        className="h-10"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Pendiente de la línea:{" "}
                                <strong>{linea?.pendiente ?? 0}</strong>
                                {" · "}Máximo para esta partida:{" "}
                                <strong>{maximo}</strong>
                            </p>
                        </div>
                    );
                })}
            </div>

            {superaPendiente && (
                <p
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                    Las partidas de una línea superan la
                    cantidad pendiente de la Orden de Compra.
                </p>
            )}

            {conflictoVencimiento && (
                <p
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                    Un mismo lote de producto no puede tener
                    diferentes fechas de vencimiento.
                </p>
            )}

            {estado?.error && (
                <p
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    {estado.error}
                </p>
            )}

            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm font-semibold text-[#123E70]">
                    Total a recibir
                </p>
                <p className="text-xl font-bold text-[#123E70]">
                    {totalRecibir} unidades
                </p>
            </div>

            <input type="hidden" name="payload" value={payload} />

            <div className="flex justify-end gap-3 border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    disabled={pendiente}
                    onClick={onCancelar}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={
                        pendiente ||
                        !partidasValidas ||
                        superaPendiente ||
                        conflictoVencimiento
                    }
                    className="gap-2"
                >
                    {pendiente ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <PackageCheck className="h-4 w-4" />
                    )}
                    {pendiente
                        ? "Registrando..."
                        : "Confirmar recepción"}
                </Button>
            </div>
        </form>
    );
}

export function RecepcionDialog({
    compraId,
    lineas,
}: {
    compraId: number;
    lineas: Linea[];
}) {
    const [abierto, setAbierto] = useState(false);

    const hayPendientes = lineas.some(
        (linea) => linea.pendiente > 0
    );

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                disabled={!hayPendientes}
                className="gap-2"
            >
                <Truck className="h-4 w-4" />
                Registrar recepción
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                    <DialogHeader className="shrink-0 border-b px-6 py-5">
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <PackageCheck className="h-5 w-5" />
                        </div>

                        <DialogTitle className="text-xl">
                            Registrar recepción de mercadería
                        </DialogTitle>

                        <DialogDescription>
                            OC-{String(compraId).padStart(4, "0")}
                            {" · "}Selecciona las partidas recibidas
                            y sus datos de trazabilidad.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="borsuas-content-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        {abierto && (
                            <FormularioRecepcion
                                compraId={compraId}
                                lineas={lineas.filter(
                                    (linea) => linea.pendiente > 0
                                )}
                                onExito={() => setAbierto(false)}
                                onCancelar={() => setAbierto(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
