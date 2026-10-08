"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { actualizarCategoria, crearCategoria } from "./actions";
import { CategoriaForm } from "./categoria-form";

type CategoriaEditable = { id: number; nombre: string; descripcion: string };

export function CategoriaDialog({ categoria }: { categoria?: CategoriaEditable }) {
    const [abierto, setAbierto] = useState(false);
    const editando = !!categoria;

    return (
        <>
            <Button
                size={editando ? "sm" : "default"}
                variant={editando ? "outline" : "default"}
                onClick={() => setAbierto(true)}
            >
                {editando ? "Editar" : "Nueva categoría"}
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
                        <DialogDescription>
                            {editando
                                ? "Modifica el nombre o la descripción."
                                : "Registra una categoría para clasificar los productos."}
                        </DialogDescription>
                    </DialogHeader>

                    <CategoriaForm
                        action={editando ? actualizarCategoria.bind(null, categoria.id) : crearCategoria}
                        modo={editando ? "editar" : "crear"}
                        inicial={categoria}
                        onExito={() => setAbierto(false)}
                        onCancelar={() => setAbierto(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}