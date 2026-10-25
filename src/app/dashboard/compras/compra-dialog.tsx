
"use client";

import { useCallback, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { CompraForm } from "./form";

type Moneda = "PEN" | "USD";

type ProductoOpcion = {
    id: number;
    nombre: string;
    codigo: string;
    precioCompra: string;
    moneda: Moneda;
};

type Props = {
    proveedores: {
        id: number;
        razonSocial: string;
    }[];
    productos: ProductoOpcion[];
};

export function CompraDialog({
    proveedores,
    productos,
}: Props) {
    const [abierto, setAbierto] = useState(false);

    const cerrar = useCallback(() => {
        setAbierto(false);
    }, []);

    const sinOpciones =
        proveedores.length === 0 || productos.length === 0;

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                disabled={sinOpciones}
                title={
                    sinOpciones
                        ? "Necesitas proveedores y productos activos"
                        : "Registrar nueva orden de compra"
                }
                className="h-10 gap-2 shadow-xs"
            >
                <Plus className="h-4 w-4" />
                Nueva orden de compra
            </Button>

            <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-5xl">
                    <DialogHeader className="shrink-0 space-y-3 border-b pb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <DialogTitle className="text-xl">
                            Nueva Orden de Compra
                        </DialogTitle>

                        <DialogDescription>
                            Registra los productos solicitados al
                            proveedor. La orden quedará pendiente
                            hasta confirmar la recepción física.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 overflow-y-auto py-2">
                        {abierto && (
                            <CompraForm
                                proveedores={proveedores}
                                productos={productos}
                                onExito={cerrar}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
