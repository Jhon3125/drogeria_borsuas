
"use client";

import { useActionState, useEffect, useState } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    ClipboardPenLine,
    Loader2,
    Plus,
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
import { Textarea } from "@/components/ui/textarea";

import { registrarAjusteLote } from "./actions";

export type OpcionLote = {
    id: number;
    numeroLote: string;
    cantidadDisponible: number;
    cantidadInicial: number;
    fechaVencimiento: string;
};

export type OpcionProductoInventario = {
    id: number;
    codigo: string;
    nombre: string;
    lotes: OpcionLote[];
};

type TipoAjuste = "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO";

export function FormularioAjusteLote({
    lote,
    onExito,
    onCancelar,
}: {
    lote: OpcionLote;
    onExito: () => void;
    onCancelar: () => void;
}) {
    const [estado, formAction, pendiente] = useActionState(
        registrarAjusteLote,
        undefined
    );

    const [tipo, setTipo] = useState<TipoAjuste>(
        "AJUSTE_NEGATIVO"
    );

    const [cantidad, setCantidad] = useState("");

    const [motivo, setMotivo] = useState("");

    const cantidadNumero = Number(cantidad);

    const maximo =
        tipo === "AJUSTE_POSITIVO"
            ? lote.cantidadInicial - lote.cantidadDisponible
            : lote.cantidadDisponible;

    const cantidadValida =
        cantidad.trim() !== "" &&
        Number.isSafeInteger(cantidadNumero) &&
        cantidadNumero > 0 &&
        cantidadNumero <= maximo &&
        cantidadNumero <= 1000000;

    useEffect(() => {
        if (estado?.ok) {
            onExito();
        }
    }, [estado?.ok, onExito]);

    return (
        <form action={formAction} className="space-y-5">
            <input
                type="hidden"
                name="loteId"
                value={lote.id}
            />

            <div className="rounded-xl border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">
                    Lote seleccionado
                </p>

                <p className="mt-1 text-sm font-semibold">
                    {lote.numeroLote}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Disponible
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                            {lote.cantidadDisponible}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Cantidad inicial
                        </p>
                        <p className="mt-1 text-xl font-bold">
                            {lote.cantidadInicial}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor={`tipo-${lote.id}`}>
                    Tipo de ajuste
                </Label>

                <select
                    id={`tipo-${lote.id}`}
                    name="tipo"
                    value={tipo}
                    onChange={(e) =>
                        setTipo(e.target.value as TipoAjuste)
                    }
                    disabled={pendiente}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                    <option value="AJUSTE_NEGATIVO">
                        Ajuste negativo — descontar
                    </option>
                    <option value="AJUSTE_POSITIVO">
                        Ajuste positivo — corregir conteo
                    </option>
                </select>
            </div>

            <div
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${tipo === "AJUSTE_POSITIVO"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
            >
                {tipo === "AJUSTE_POSITIVO" ? (
                    <ArrowUpCircle className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                    <ArrowDownCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}

                <span>
                    {tipo === "AJUSTE_POSITIVO"
                        ? "Se devolverán unidades al saldo del lote, sin superar su cantidad inicial."
                        : "Se descontarán unidades del saldo disponible del lote."}
                </span>
            </div>

            <div className="space-y-2">
                <Label htmlFor={`cantidad-${lote.id}`}>
                    Cantidad
                </Label>

                <Input
                    id={`cantidad-${lote.id}`}
                    name="cantidad"
                    type="number"
                    min="1"
                    max={Math.min(maximo, 1000000)}
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    disabled={pendiente || maximo <= 0}
                    placeholder="Ingresa la cantidad"
                    required
                    className="h-10"
                />

                <p className="text-xs text-muted-foreground">
                    Máximo permitido para este tipo de ajuste:{" "}
                    <strong>{Math.min(maximo, 1000000)}</strong> unidades.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor={`motivo-${lote.id}`}>
                    Motivo del ajuste
                </Label>

                <Textarea
                    id={`motivo-${lote.id}`}
                    name="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Describe el resultado del conteo físico o la incidencia detectada..."
                    minLength={8}
                    maxLength={500}
                    rows={4}
                    required
                    disabled={pendiente}
                    className="resize-none"
                />

                <p className="text-xs text-muted-foreground">
                    Obligatorio: entre 8 y 500 caracteres.
                </p>
            </div>

            {estado?.error && (
                <p
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    {estado.error}
                </p>
            )}

            <div className="flex justify-end gap-3 border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelar}
                    disabled={pendiente}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={
                        pendiente ||
                        !cantidadValida ||
                        motivo.trim().length < 8 ||
                        motivo.trim().length > 500
                    }
                    className="gap-2"
                >
                    {pendiente ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ClipboardPenLine className="h-4 w-4" />
                    )}

                    {pendiente
                        ? "Registrando..."
                        : "Registrar ajuste"}
                </Button>
            </div>
        </form>
    );
}

export function AjusteDialog({
    productos,
}: {
    productos: OpcionProductoInventario[];
}) {
    const [abierto, setAbierto] = useState(false);

    const [productoId, setProductoId] = useState(
        String(productos[0]?.id ?? "")
    );

    const productoSeleccionado = productos.find(
        (p) => p.id === Number(productoId)
    );

    const [loteId, setLoteId] = useState(
        String(productos[0]?.lotes[0]?.id ?? "")
    );

    const loteSeleccionado = productoSeleccionado?.lotes.find(
        (l) => l.id === Number(loteId)
    );

    function cambiarProducto(id: string) {
        setProductoId(id);

        const siguiente = productos.find(
            (p) => p.id === Number(id)
        );

        setLoteId(String(siguiente?.lotes[0]?.id ?? ""));
    }

    function cerrar() {
        setAbierto(false);
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                disabled={productos.length === 0}
                className="h-10 gap-2"
            >
                <Plus className="h-4 w-4" />
                Nuevo ajuste
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <ClipboardPenLine className="h-5 w-5" />
                        </div>

                        <DialogTitle className="text-xl">
                            Ajuste manual de inventario
                        </DialogTitle>

                        <DialogDescription>
                            Selecciona un producto y un lote respaldado.
                            El ajuste registrará automáticamente al
                            responsable autenticado.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="ajuste-producto">
                            Producto
                        </Label>

                        <select
                            id="ajuste-producto"
                            value={productoId}
                            onChange={(e) =>
                                cambiarProducto(e.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            {productos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.codigo} — {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ajuste-lote">
                            Lote
                        </Label>

                        <select
                            id="ajuste-lote"
                            value={loteId}
                            onChange={(e) =>
                                setLoteId(e.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            {productoSeleccionado?.lotes.map((lote) => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.numeroLote} —{" "}
                                    {lote.cantidadDisponible} disponibles
                                </option>
                            ))}
                        </select>
                    </div>

                    {abierto && loteSeleccionado && (
                        <FormularioAjusteLote
                            key={loteSeleccionado.id}
                            lote={loteSeleccionado}
                            onExito={cerrar}
                            onCancelar={cerrar}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
