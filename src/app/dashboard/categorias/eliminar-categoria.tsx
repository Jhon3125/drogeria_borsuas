
"use client";

import { useState, useTransition } from "react";
import {
    AlertTriangle,
    Loader2,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { eliminarCategoria } from "./actions";

type Props = {
    id: number;
    nombre: string;
    cantidadProductos: number;
};

export function EliminarCategoria({
    id,
    nombre,
    cantidadProductos,
}: Props) {
    const [abierto, setAbierto] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, iniciarTransicion] = useTransition();

    const tieneProductos = cantidadProductos > 0;

    function confirmar() {
        if (pendiente || tieneProductos) return;

        setError(null);

        iniciarTransicion(async () => {
            try {
                const resultado = await eliminarCategoria(id);

                if (resultado?.error) {
                    setError(resultado.error);
                    return;
                }

                if (resultado?.ok) {
                    setAbierto(false);
                }
            } catch {
                setError(
                    "Ocurrió un error al eliminar la categoría."
                );
            }
        });
    }

    return (
        <>
            <span
                title={
                    tieneProductos
                        ? `No se puede eliminar: contiene ${cantidadProductos} producto(s).`
                        : "Eliminar categoría"
                }
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={tieneProductos}
                    onClick={() => {
                        setError(null);
                        setAbierto(true);
                    }}
                    className={
                        tieneProductos
                            ? "gap-1.5 cursor-not-allowed opacity-45"
                            : "gap-1.5 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    }
                    aria-label={
                        tieneProductos
                            ? `No se puede eliminar ${nombre}: tiene productos asociados`
                            : `Eliminar ${nombre}`
                    }
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                </Button>
            </span>

            <AlertDialog
                open={abierto}
                onOpenChange={(nuevoEstado) => {
                    if (!pendiente) {
                        setAbierto(nuevoEstado);
                        if (!nuevoEstado) setError(null);
                    }
                }}
            >
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader className="space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <AlertDialogTitle className="text-xl">
                            ¿Eliminar categoría?
                        </AlertDialogTitle>

                        <AlertDialogDescription className="leading-6">
                            Vas a eliminar permanentemente esta
                            categoría del catálogo. Esta acción
                            no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="rounded-lg border border-border bg-secondary/40 p-4">
                        <p className="text-xs text-muted-foreground">
                            Categoría seleccionada
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                            {nombre}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                            Solo se permite eliminar categorías
                            sin productos asociados.
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

                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={pendiente}>
                            Cancelar
                        </AlertDialogCancel>

                        <Button
                            type="button"
                            onClick={confirmar}
                            disabled={pendiente}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {pendiente ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}

                            {pendiente
                                ? "Eliminando..."
                                : "Eliminar categoría"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
