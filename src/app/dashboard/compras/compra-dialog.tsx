
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

type Props = {
    proveedores: {
        id: number;
        razonSocial: string;
    }[];
    productos: {
        id: number;
        nombre: string;
        codigo: string;
        precioCompra: string;
        moneda: Moneda;
    }[];
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
        proveedores.length === 0 ||
        productos.length === 0;

    return (
        <>
            <Button
                type="button"
                onClick={() => setAbierto(true)}
                disabled={sinOpciones}
                title={
                    sinOpciones
                        ? "Se requieren proveedores y productos activos"
                        : "Registrar nueva Orden de Compra"
                }
                className="h-10 gap-2 shadow-xs"
            >
                <Plus className="h-4 w-4" />
                Nueva orden de compra
            </Button>

            <Dialog
                open={abierto}
                onOpenChange={setAbierto}
            >
                <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
                    <DialogHeader className="shrink-0 space-y-3 border-b px-5 pb-5 pt-6 sm:px-7">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <DialogTitle className="text-xl">
                            Nueva Orden de Compra
                        </DialogTitle>

                        <DialogDescription>
                            Registra los productos solicitados,
                            condiciones comerciales y entrega estimada.
                            Los lotes se identificarán al recibir.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="borsuas-content-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
                        {abierto && (
                            <CompraForm
                                proveedores={proveedores}
                                productos={productos}
                                onExito={cerrar}
                                onCancelar={cerrar}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
