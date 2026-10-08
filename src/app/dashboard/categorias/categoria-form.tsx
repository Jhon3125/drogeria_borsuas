
"use client";

import { useActionState, useEffect } from "react";
import {
    AlignLeft,
    Loader2,
    Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { EstadoForm } from "./actions";

type Props = {
    action: (
        prev: EstadoForm,
        formData: FormData
    ) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: {
        nombre: string;
        descripcion: string;
    };
    onExito: () => void;
    onCancelar: () => void;
};

export function CategoriaForm({
    action,
    modo,
    inicial,
    onExito,
    onCancelar,
}: Props) {
    const [estado, formAction, pendiente] = useActionState(
        action,
        undefined
    );

    const valores = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};

    useEffect(() => {
        if (estado?.ok) {
            onExito();
        }
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-6">
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Tags className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Información de la categoría
                    </h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nombre">
                        Nombre de la categoría
                    </Label>

                    <Input
                        id="nombre"
                        name="nombre"
                        placeholder="Ej. Medicamentos"
                        defaultValue={valores?.nombre ?? ""}
                        required
                        maxLength={100}
                        className="h-10"
                        aria-invalid={Boolean(errores.nombre)}
                        aria-describedby={
                            errores.nombre
                                ? "categoria-nombre-error"
                                : undefined
                        }
                    />

                    {errores.nombre && (
                        <p
                            id="categoria-nombre-error"
                            role="alert"
                            className="text-xs font-medium text-destructive"
                        >
                            {errores.nombre}
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Utiliza un nombre claro para identificar
                        los productos de esta categoría.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="descripcion">
                        Descripción (opcional)
                    </Label>

                    <div className="relative">
                        <Textarea
                            id="descripcion"
                            name="descripcion"
                            placeholder="Describe los productos que pertenecen a esta categoría..."
                            defaultValue={
                                valores?.descripcion ?? ""
                            }
                            rows={4}
                            className="resize-none"
                            aria-invalid={Boolean(errores.descripcion)}
                        />

                        <AlignLeft className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-muted-foreground/50" />
                    </div>

                    {errores.descripcion && (
                        <p
                            role="alert"
                            className="text-xs font-medium text-destructive"
                        >
                            {errores.descripcion}
                        </p>
                    )}
                </div>
            </section>

            {estado?.error && (
                <div
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    {estado.error}
                </div>
            )}

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
                    disabled={pendiente}
                    className="min-w-36"
                >
                    {pendiente && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {pendiente
                        ? "Guardando..."
                        : modo === "editar"
                            ? "Guardar cambios"
                            : "Crear categoría"}
                </Button>
            </div>
        </form>
    );
}
