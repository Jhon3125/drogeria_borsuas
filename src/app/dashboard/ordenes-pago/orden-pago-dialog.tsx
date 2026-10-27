
"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Loader2,
    Plus,
    Wallet,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { crearOrdenPago } from "./actions";

type CompraElegible = {
    id: number;
    proveedor: string;
    moneda: string;
    valorRecibido: string;
    comprometido: string;
    disponible: string;
};

function monedaTexto(moneda: string, valor: string) {
    return `${moneda === "USD" ? "US$" : "S/"} ${valor}`;
}

function FormularioOrdenPago({
    compras,
    onCerrar,
}: {
    compras: CompraElegible[];
    onCerrar: () => void;
}) {
    const router = useRouter();

    const [estado, accion, pendiente] = useActionState(
        crearOrdenPago,
        undefined
    );

    const [compraId, setCompraId] = useState(
        compras[0]?.id ?? 0
    );
    const [monto, setMonto] = useState("");
    const [numeroFactura, setNumeroFactura] = useState("");
    const [observaciones, setObservaciones] = useState("");

    const compra = compras.find((item) => item.id === compraId);
    const disponible = Number(compra?.disponible ?? 0);
    const montoNumero = Number(monto);

    const importeValido =
        /^\d{1,10}(\.\d{1,2})?$/.test(monto) &&
        Number.isFinite(montoNumero) &&
        montoNumero > 0 &&
        montoNumero <= disponible;

    const puedeGuardar =
        Boolean(compra) &&
        importeValido &&
        numeroFactura.trim().length <= 100 &&
        observaciones.trim().length <= 2000;

    useEffect(() => {
        if (estado?.ok) {
            onCerrar();
            router.refresh();
        }
    }, [estado?.ok, onCerrar, router]);

    return (
        <form action={accion} className="space-y-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-[#123E70]">
                Solo puedes solicitar pagos por mercadería
                recibida y no comprometida en otras
                Órdenes de Pago.
            </div>

            <div className="space-y-2">
                <Label htmlFor="op-compra">
                    Orden de Compra *
                </Label>

                <select
                    id="op-compra"
                    name="compraId"
                    value={compraId}
                    onChange={(e) => {
                        setCompraId(Number(e.target.value));
                        setMonto("");
                    }}
                    disabled={pendiente}
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                    {compras.map((item) => (
                        <option key={item.id} value={item.id}>
                            OC-
                            {String(item.id).padStart(4, "0")}
                            {" — "}
                            {item.proveedor}
                            {" — "}
                            Disponible:{" "}
                            {monedaTexto(
                                item.moneda,
                                item.disponible
                            )}
                        </option>
                    ))}
                </select>
            </div>

            {compra && (
                <div className="rounded-xl border bg-secondary/25 p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">
                            Resumen financiero de la OC
                        </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Valor recibido
                            </p>
                            <p className="mt-1 font-semibold">
                                {monedaTexto(
                                    compra.moneda,
                                    compra.valorRecibido
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Ya comprometido
                            </p>
                            <p className="mt-1 font-semibold">
                                {monedaTexto(
                                    compra.moneda,
                                    compra.comprometido
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Disponible para solicitar
                            </p>
                            <p className="mt-1 text-xl font-bold text-emerald-700">
                                {monedaTexto(
                                    compra.moneda,
                                    compra.disponible
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="op-monto">
                        Importe solicitado *
                    </Label>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                            {compra?.moneda === "USD"
                                ? "US$"
                                : "S/"}
                        </span>

                        <Input
                            id="op-monto"
                            name="montoSolicitado"
                            type="text"
                            inputMode="decimal"
                            value={monto}
                            onChange={(e) =>
                                setMonto(e.target.value)
                            }
                            placeholder="0.00"
                            disabled={pendiente}
                            required
                            className="h-11 pl-12"
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Máximo:{" "}
                        {compra
                            ? monedaTexto(
                                compra.moneda,
                                compra.disponible
                            )
                            : "—"}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="op-factura">
                        Número de factura (opcional)
                    </Label>

                    <Input
                        id="op-factura"
                        name="numeroFactura"
                        value={numeroFactura}
                        onChange={(e) =>
                            setNumeroFactura(e.target.value)
                        }
                        maxLength={100}
                        disabled={pendiente}
                        placeholder="Ej. F001-00001234"
                        className="h-11"
                    />
                </div>
            </div>

            {monto.length > 0 && !importeValido && (
                <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                    Ingresa un importe mayor que cero,
                    con máximo dos decimales, que no supere
                    el saldo disponible de la OC.
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="op-observaciones">
                    Observaciones (opcional)
                </Label>

                <textarea
                    id="op-observaciones"
                    name="observaciones"
                    rows={3}
                    maxLength={2000}
                    value={observaciones}
                    onChange={(e) =>
                        setObservaciones(e.target.value)
                    }
                    disabled={pendiente}
                    placeholder="Motivo del pago, condiciones comerciales u otras indicaciones..."
                    className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {estado?.error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {estado.error}
                </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                La Orden de Pago quedará en estado
                SOLICITADA, pendiente de autorización.
                No se registrará ningún desembolso.
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCerrar}
                    disabled={pendiente}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={pendiente || !puedeGuardar}
                    className="gap-2 bg-[#123E70] hover:bg-[#0c315b]"
                >
                    {pendiente ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                    {pendiente
                        ? "Registrando..."
                        : "Solicitar Orden de Pago"}
                </Button>
            </div>
        </form>
    );
}

export function OrdenPagoDialog({
    compras,
}: {
    compras: CompraElegible[];
}) {
    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                disabled={compras.length === 0}
                className="gap-2 bg-[#123E70] hover:bg-[#0c315b]"
            >
                <Plus className="h-4 w-4" />
                Nueva Orden de Pago
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                    <DialogHeader className="shrink-0 border-b px-6 py-5">
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Wallet className="h-5 w-5" />
                        </div>

                        <DialogTitle className="text-xl">
                            Nueva Orden de Pago
                        </DialogTitle>

                        <DialogDescription>
                            Registra una solicitud de pago
                            asociada a mercadería efectivamente recibida.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        {abierto && (
                            <FormularioOrdenPago
                                compras={compras}
                                onCerrar={() => setAbierto(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
