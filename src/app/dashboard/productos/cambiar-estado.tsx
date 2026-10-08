"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cambiarEstadoProducto } from "./actions";

export function BotonCambiarEstado({ id, estadoActual }: { id: number; estadoActual: boolean }) {
    const [isPending, startTransition] = useTransition();

    const manejarCambio = () => {
        const accion = estadoActual ? "desactivar" : "reactivar";
        if (confirm(`¿Estás seguro de que deseas ${accion} este producto? ${estadoActual ? "No aparecerá en nuevas compras ni ventas." : ""}`)) {
            startTransition(async () => {
                await cambiarEstadoProducto(id, !estadoActual);
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={manejarCambio}
            disabled={isPending}
            className={estadoActual ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
        >
            {isPending ? "..." : estadoActual ? "Desactivar" : "Reactivar"}
        </Button>
    );
}