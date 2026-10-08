
"use client";

import { useActionState, useEffect, useState } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
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

import { registrarAjuste } from "./actions";

type ProductoOpcion = {
    id: number;
    codigo: string;
    nombre: string;
    stockActual: number;
};

function FormularioAjuste({
    productos,
    productoId,
    onCerrar,
}: {
    productos: ProductoOpcion[];
    productoId?: number;
    onCerrar: () => void;
}) {
    const [estado, formAction, pendiente] = useActionState(
        registrarAjuste,
        undefined
    );

    const [tipo, setTipo] = useState<
        "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO"
    >("AJUSTE_POSITIVO");

    const [seleccion, setSeleccion] = useState(
        String(productoId ?? productos[0]?.id ?? "")
    );

    const productoSeleccionado = productos.find(
        (producto) => producto.id === Number(seleccion)
    );

    useEffect(() => {
        if (estado?.ok) onCerrar();
    }, [estado?.ok, onCerrar]);

    return (
        <form action={formAction} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="productoId">Producto</Label>
                <select
                    id="productoId"
                    name="productoId"
                    value={seleccion}
                    onChange={(e) => setSeleccion(e.target.value)}
                    disabled={pendiente}
                    required
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                    {productos.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                            {producto.codigo} - {producto.nombre}
                        </option>
                    ))}
                </select>
                {estado?.errores?.productoId && (
                    <p className="text-xs text-destructive">
                        {estado.errores.productoId}
                    </p>
                )}
            </div>

            {productoSeleccionado && (
                <div className="rounded-lg border bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">
                        Existencias actuales
                    </p>
                    <p className="mt-1 text-xl font-bold text-primary">
                        {productoSeleccionado.stockActual} unidades
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de ajuste</Label>
                <select
                    id="tipo"
                    name="tipo"
                    value={tipo}
                    onChange={(e) =>
                        setTipo(
                            e.target.value as
                            | "AJUSTE_POSITIVO"
                            | "AJUSTE_NEGATIVO"
                        )
                    }
                    disabled={pendiente}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="AJUSTE_POSITIVO">
                        Entrada manual (+)
                    </option>
                    <option value="AJUSTE_NEGATIVO">
                        Salida manual (-)
                    </option>
                </select>
            </div>

            <div
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${tipo === "AJUSTE_POSITIVO"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
            >
                {tipo === "AJUSTE_POSITIVO" ? (
                    <ArrowUpCircle className="h-5 w-5" />
                ) : (
                    <ArrowDownCircle className="h-5 w-5" />
                )}
                {tipo === "AJUSTE_POSITIVO"
                    ? "Se incrementarán las existencias del producto."
                    : "Se descontarán unidades del stock disponible."}
            </div>

            <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    placeholder="Ej. 20"
                    required
                    disabled={pendiente}
                    className="h-10"
                />
                {estado?.errores?.cantidad && (
                    <p className="text-xs text-destructive">
                        {estado.errores.cantidad}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="motivo">
                    Motivo del ajuste
                </Label>
                <Textarea
                    id="motivo"
                    name="motivo"
                    placeholder="Ej. Registro inicial de existencias según conteo físico..."
                    required
                    minLength={5}
                    maxLength={500}
                    disabled={pendiente}
                    rows={3}
                    className="resize-none"
                />
                {estado?.errores?.motivo && (
                    <p className="text-xs text-destructive">
                        {estado.errores.motivo}
                    </p>
                )}
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
                    disabled={pendiente}
                    onClick={onCerrar}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={pendiente}>
                    {pendiente ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Boxes className="mr-2 h-4 w-4" />
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
    productoId,
}: {
    productos: ProductoOpcion[];
    productoId?: number;
}) {
    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <Button
                type="button"
                size={productoId ? "sm" : "default"}
                variant={productoId ? "outline" : "default"}
                disabled={productos.length === 0}
                onClick={() => setAbierto(true)}
                className="gap-2"
            >
                {productoId ? (
                    "Ajustar"
                ) : (
                    <>
                        <Plus className="h-4 w-4" />
                        Nuevo ajuste
                    </>
                )}
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-xl">
                            Ajuste de inventario
                        </DialogTitle>
                        <DialogDescription>
                            Registra una entrada o salida manual
                            con su motivo correspondiente.
                        </DialogDescription>
                    </DialogHeader>

                    {abierto && (
                        <FormularioAjuste
                            productos={productos}
                            productoId={productoId}
                            onCerrar={() => setAbierto(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
