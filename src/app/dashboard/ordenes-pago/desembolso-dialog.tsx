
"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    Loader2,
    Plus,
} from "lucide-react";

import { registrarDesembolso } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Props = {
    ordenPagoId: number;
    moneda: string;
    saldo: string;
};

function FormularioDesembolso({
    ordenPagoId,
    moneda,
    saldo,
    onCerrar,
}: Props & { onCerrar: () => void }) {
    const router = useRouter();

    const [estado, accion, pendiente] = useActionState(
        registrarDesembolso,
        undefined
    );

    const [monto, setMonto] = useState("");
    const [metodo, setMetodo] = useState("TRANSFERENCIA");
    const [referencia, setReferencia] = useState("");
    const [fechaPago, setFechaPago] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [claveIdempotencia, setClaveIdempotencia] = useState("");

    const montoNumero = Number(monto);

    const importeValido =
        /^\d{1,10}(\.\d{1,2})?$/.test(monto) &&
        Number.isFinite(montoNumero) &&
        montoNumero > 0 &&
        montoNumero <= Number(saldo);

    const fechaValida =
        /^\d{4}-\d{2}-\d{2}$/.test(fechaPago);

    const puedeGuardar =
        Boolean(claveIdempotencia) &&
        importeValido &&
        fechaValida &&
        (metodo !== "TRANSFERENCIA" ||
            referencia.trim().length > 0) &&
        referencia.trim().length <= 150 &&
        observaciones.trim().length <= 2000;

    const simbolo = moneda === "USD" ? "US$" : "S/";

    useEffect(() => {
        if (estado?.ok) {
            onCerrar();
            router.refresh();
        }
    }, [estado?.ok, onCerrar, router]);

    useEffect(() => {
        setClaveIdempotencia(crypto.randomUUID());
    }, []);

    function nuevaOperacion() {
        setClaveIdempotencia(crypto.randomUUID());
    }

    return (
        <form action={accion} className="space-y-5">
            <input
                type="hidden"
                name="ordenPagoId"
                value={ordenPagoId}
            />
            <input
                type="hidden"
                name="claveIdempotencia"
                value={claveIdempotencia}
            />

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-medium text-[#123E70]">
                    Saldo autorizado pendiente
                </p>
                <p className="mt-2 text-2xl font-bold text-[#123E70]">
                    {simbolo} {saldo}
                </p>
                <p className="mt-1 text-xs text-[#123E70]/70">
                    Se pueden registrar desembolsos parciales
                    hasta completar este importe.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="desembolso-monto">
                        Importe del desembolso *
                    </Label>

                    <Input
                        id="desembolso-monto"
                        name="monto"
                        inputMode="decimal"
                        value={monto}
                        onChange={(e) => {
                            setMonto(e.target.value);
                            nuevaOperacion();
                        }}
                        disabled={pendiente}
                        placeholder="0.00"
                        required
                        className="h-11"
                    />

                    <button
                        type="button"
                        disabled={pendiente}
                        onClick={() => {
                            setMonto(saldo);
                            nuevaOperacion();
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Completar saldo pendiente
                    </button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="desembolso-fecha">
                        Fecha efectiva del pago *
                    </Label>

                    <Input
                        id="desembolso-fecha"
                        type="date"
                        name="fechaPago"
                        value={fechaPago}
                        onChange={(e) => {
                            setFechaPago(e.target.value);
                            nuevaOperacion();
                        }}
                        disabled={pendiente}
                        required
                        className="h-11"
                    />

                    <p className="text-xs text-muted-foreground">
                        Indica la fecha en que realmente
                        se realizó el pago.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="desembolso-metodo">
                        Método de pago *
                    </Label>

                    <select
                        id="desembolso-metodo"
                        name="metodo"
                        value={metodo}
                        onChange={(e) => {
                            setMetodo(e.target.value);
                            nuevaOperacion();
                        }}
                        disabled={pendiente}
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    >
                        <option value="TRANSFERENCIA">
                            Transferencia bancaria
                        </option>
                        <option value="EFECTIVO">
                            Efectivo
                        </option>
                        <option value="CHEQUE">
                            Cheque
                        </option>
                        <option value="OTRO">
                            Otro método
                        </option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="desembolso-referencia">
                        Referencia del pago
                        {metodo === "TRANSFERENCIA" && " *"}
                    </Label>

                    <Input
                        id="desembolso-referencia"
                        name="referencia"
                        value={referencia}
                        onChange={(e) => {
                            setReferencia(e.target.value);
                            nuevaOperacion();
                        }}
                        disabled={pendiente}
                        maxLength={150}
                        required={metodo === "TRANSFERENCIA"}
                        placeholder="N.º operación / transferencia"
                        className="h-11"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="desembolso-observaciones">
                    Observaciones
                </Label>

                <textarea
                    id="desembolso-observaciones"
                    name="observaciones"
                    rows={3}
                    value={observaciones}
                    onChange={(e) => {
                        setObservaciones(e.target.value);
                        nuevaOperacion();
                    }}
                    maxLength={2000}
                    disabled={pendiente}
                    placeholder="Detalles adicionales del desembolso..."
                    className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
            </div>

            {monto && !importeValido && (
                <p
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                    El importe debe ser positivo, tener máximo
                    dos decimales y no superar el saldo pendiente.
                </p>
            )}

            {estado?.error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    {estado.error}
                </p>
            )}

            <div className="rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
                Confirma únicamente desembolsos que realmente
                hayan sido realizados. Esta operación quedará
                registrada en el historial financiero.
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
                        <CreditCard className="h-4 w-4" />
                    )}
                    {pendiente
                        ? "Registrando..."
                        : "Confirmar desembolso"}
                </Button>
            </div>
        </form>
    );
}

export function DesembolsoDialog(props: Props) {
    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                className="gap-2 bg-[#123E70] hover:bg-[#0c315b]"
            >
                <Plus className="h-4 w-4" />
                Registrar desembolso
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                    <DialogHeader className="shrink-0 border-b px-6 py-5">
                        <DialogTitle className="text-xl">
                            Registrar desembolso
                        </DialogTitle>
                        <DialogDescription>
                            OP-
                            {String(props.ordenPagoId).padStart(4, "0")}
                            {" · "}Registra un pago efectivo
                            al proveedor.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        {abierto && (
                            <FormularioDesembolso
                                {...props}
                                onCerrar={() => setAbierto(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
