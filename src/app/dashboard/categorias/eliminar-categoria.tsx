"use client";

import { useState, useTransition } from "react";
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

export function EliminarCategoria({ id, nombre }: { id: number; nombre: string }) {
    const [abierto, setAbierto] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, startTransition] = useTransition();

    function confirmar() {
        startTransition(async () => {
            const res = await eliminarCategoria(id);
            if (res?.error) {
                setError(res.error);
                return;
            }
            setAbierto(false);
        });
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    setError(null);
                    setAbierto(true);
                }}
            >
                Eliminar
            </Button>

            <AlertDialog open={abierto} onOpenChange={setAbierto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar la categoría "{nombre}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Solo se puede eliminar si no tiene productos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
                        <Button variant="destructive" onClick={confirmar} disabled={pendiente}>
                            {pendiente ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}