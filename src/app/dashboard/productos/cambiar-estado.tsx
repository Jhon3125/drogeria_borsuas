
"use client";

import { useState, useTransition } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Power,
    PowerOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { cambiarEstadoProducto } from "./actions";

type Props = {
    id: number;
    estadoActual: boolean;
};

export function BotonCambiarEstado({
    id,
    estadoActual,
}: Props) {
    const [abierto, setAbierto] = useState(false);
    const [pendiente, iniciarTransicion] = useTransition();
    const [error, setError] = useState("");

    const desactivar = estadoActual;

    function manejarCambio() {
        setError("");

        iniciarTransicion(async () => {
            try {
                const resultado = await cambiarEstadoProducto(
                    id,
                    !estadoActual
                );

                if (resultado.ok) {
                    setAbierto(false);
                } else {
                    setError(
                        resultado.error ??
                        "No se pudo actualizar el producto."
                    );
                }
            } catch {
                setError("Ocurrió un error inesperado.");
            }
        });
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAbierto(true)}
                className={
                    desactivar
                        ? "gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        : "gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                }
            >
                {desactivar ? (
                    <PowerOff className="h-3.5 w-3.5" />
                ) : (
                    <Power className="h-3.5 w-3.5" />
                )}

                {desactivar ? "Desactivar" : "Reactivar"}
            </Button>

            <Dialog
                open={abierto}
                onOpenChange={(nuevoEstado) => {
                    if (!pendiente) {
                        setAbierto(nuevoEstado);
                        if (!nuevoEstado) setError("");
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-md"
                    showCloseButton={!pendiente}
                >
                    <DialogHeader className="space-y-3">
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${desactivar
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                                }`}
                        >
                            {desactivar ? (
                                <AlertTriangle className="h-6 w-6" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6" />
                            )}
                        </div>

                        <DialogTitle className="text-xl">
                            {desactivar
                                ? "¿Desactivar producto?"
                                : "¿Reactivar producto?"}
                        </DialogTitle>

                        <DialogDescription className="leading-6">
                            {desactivar
                                ? "El producto quedará inactivo y no deberá utilizarse en nuevas operaciones comerciales."
                                : "El producto volverá a estar habilitado para las operaciones comerciales."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border bg-secondary/40 p-4">
                        <p className="text-sm font-medium text-foreground">
                            {desactivar
                                ? "El producto no será eliminado."
                                : "Se conservará toda su información."}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {desactivar
                                ? "Podrás reactivarlo posteriormente desde el catálogo."
                                : "Su historial y sus datos registrados permanecerán intactos."}
                        </p>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={pendiente}
                            onClick={() => setAbierto(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            disabled={pendiente}
                            onClick={manejarCambio}
                            className={
                                desactivar
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-emerald-700 text-white hover:bg-emerald-800"
                            }
                        >
                            {pendiente ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : desactivar ? (
                                <PowerOff className="mr-2 h-4 w-4" />
                            ) : (
                                <Power className="mr-2 h-4 w-4" />
                            )}

                            {pendiente
                                ? "Procesando..."
                                : desactivar
                                    ? "Desactivar producto"
                                    : "Reactivar producto"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
