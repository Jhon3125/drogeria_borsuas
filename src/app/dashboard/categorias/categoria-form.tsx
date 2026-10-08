"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstadoForm } from "./actions";

type Props = {
    action: (prev: EstadoForm, formData: FormData) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: { nombre: string; descripcion: string };
    onExito: () => void;
    onCancelar: () => void;
};

export function CategoriaForm({ action, modo, inicial, onExito, onCancelar }: Props) {
    const [estado, formAction, pendiente] = useActionState(action, undefined);
    const v = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};

    useEffect(() => {
        if (estado?.ok) onExito();
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" defaultValue={v?.nombre} required />
                {errores.nombre && <p className="text-sm text-red-600">{errores.nombre}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                    id="descripcion"
                    name="descripcion"
                    defaultValue={v?.descripcion}
                    rows={3}
                />
                {errores.descripcion && (
                    <p className="text-sm text-red-600">{errores.descripcion}</p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={pendiente}>
                    {pendiente ? "Guardando..." : modo === "editar" ? "Guardar cambios" : "Crear categoría"}
                </Button>
            </div>
        </form>
    );
}