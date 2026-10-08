
"use client";

import { useState } from "react";
import { Pencil, Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    actualizarCategoria,
    crearCategoria,
} from "./actions";
import { CategoriaForm } from "./categoria-form";

type CategoriaEditable = {
    id: number;
    nombre: string;
    descripcion: string;
};

export function CategoriaDialog({
    categoria,
}: {
    categoria?: CategoriaEditable;
}) {
    const [abierto, setAbierto] = useState(false);
    const editando = Boolean(categoria);

    return (
        <>
            {editando ? (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAbierto(true)}
                    className="gap-1.5"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                </Button>
            ) : (
                <Button
                    type="button"
                    onClick={() => setAbierto(true)}
                    className="h-10 gap-2 shadow-xs"
                >
                    <Plus className="h-4 w-4" />
                    Nueva categoría
                </Button>
            )}

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            {editando ? (
                                <Pencil className="h-5 w-5" />
                            ) : (
                                <Tags className="h-5 w-5" />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <DialogTitle className="text-xl">
                                {editando
                                    ? "Editar categoría"
                                    : "Nueva categoría"}
                            </DialogTitle>

                            <DialogDescription>
                                {editando
                                    ? "Modifica la información de esta categoría."
                                    : "Registra una categoría para clasificar los productos del catálogo."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Se monta al abrir para reiniciar el formulario. */}
                    {abierto && (
                        <CategoriaForm
                            action={
                                categoria
                                    ? actualizarCategoria.bind(
                                        null,
                                        categoria.id
                                    )
                                    : crearCategoria
                            }
                            modo={editando ? "editar" : "crear"}
                            inicial={categoria}
                            onExito={() => setAbierto(false)}
                            onCancelar={() => setAbierto(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
