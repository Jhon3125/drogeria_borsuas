
"use client";

import { useState } from "react";
import {
    PackagePlus,
    Pencil,
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

import {
    actualizarProducto,
    crearProducto,
} from "./actions";
import { ProductoForm } from "./producto-form";

type Categoria = {
    id: number;
    nombre: string;
};

type ProductoEditable = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    categoriaId: number;
    unidadMedida: string;
    moneda: string;
    precioCompra: string;
    precioVenta: string;
    stockMinimo: number;
};

type Props = {
    producto?: ProductoEditable;
    categorias: Categoria[];
};

export function ProductoDialog({
    producto,
    categorias,
}: Props) {
    const [abierto, setAbierto] = useState(false);
    const editando = Boolean(producto);

    return (
        <>
            {editando ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                    Nuevo producto
                </Button>
            )}

            <Dialog
                open={abierto}
                onOpenChange={setAbierto}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            {editando ? (
                                <Pencil className="h-5 w-5" />
                            ) : (
                                <PackagePlus className="h-5 w-5" />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <DialogTitle className="text-xl">
                                {editando
                                    ? "Editar producto"
                                    : "Nuevo producto"}
                            </DialogTitle>

                            <DialogDescription>
                                {editando
                                    ? "Actualiza la información, clasificación y precios del producto."
                                    : "Registra un nuevo producto en el catálogo de Borsuas."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <ProductoForm
                        action={
                            producto
                                ? actualizarProducto.bind(
                                    null,
                                    producto.id
                                )
                                : crearProducto
                        }
                        modo={editando ? "editar" : "crear"}
                        inicial={producto}
                        categorias={categorias}
                        onExito={() => setAbierto(false)}
                        onCancelar={() => setAbierto(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
