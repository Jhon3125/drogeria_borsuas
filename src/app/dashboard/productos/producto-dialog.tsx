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
import { actualizarProducto, crearProducto } from "./actions";
import { ProductoForm } from "./producto-form";

type Categoria = { id: number; nombre: string };

type ProductoEditable = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    categoriaId: number;
    unidadMedida: string;
    moneda: string;
    precioCompra: any; // Decimal de Prisma
    precioVenta: any;  // Decimal de Prisma
    stockMinimo: number;
};

type Props = {
    producto?: ProductoEditable;
    categorias: Categoria[];
};

export function ProductoDialog({ producto, categorias }: Props) {
    const [abierto, setAbierto] = useState(false);
    const editando = !!producto;

    return (
        <>
            <Button
                size={editando ? "sm" : "default"}
                variant={editando ? "outline" : "default"}
                onClick={() => setAbierto(true)}
            >
                {editando ? "Editar" : "Nuevo producto"}
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar producto" : "Nuevo producto"}</DialogTitle>
                        <DialogDescription>
                            {editando
                                ? "Modifica los detalles, precios o categorización del producto."
                                : "Completa los datos para registrar un nuevo producto en el catálogo."}
                        </DialogDescription>
                    </DialogHeader>

                    <ProductoForm
                        action={editando ? actualizarProducto.bind(null, producto.id) : crearProducto}
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