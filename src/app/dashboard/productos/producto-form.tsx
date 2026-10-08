"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatoMoneda } from "@/lib/formato";
import { UNIDADES_MEDIDA } from "@/lib/validaciones/producto";
import type { EstadoForm } from "./actions";

type Props = {
    action: (prev: EstadoForm, formData: FormData) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: any;
    categorias: { id: number; nombre: string }[];
    onExito: () => void;
    onCancelar: () => void;
};

const claseSelect =
    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ProductoForm({ action, modo, inicial, categorias, onExito, onCancelar }: Props) {
    const [estado, formAction, pendiente] = useActionState(action, { ok: false });
    const v = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};
    const editando = modo === "editar";

    // Estados locales SOLO para calcular la alerta ámbar en tiempo real
    const [precioCompra, setPrecioCompra] = useState(v?.precioCompra?.toString() || "");
    const [precioVenta, setPrecioVenta] = useState(v?.precioVenta?.toString() || "");
    const [moneda, setMoneda] = useState(v?.moneda || "PEN");

    const compra = Number(precioCompra);
    const venta = Number(precioVenta);
    const margenNegativo = !isNaN(compra) && !isNaN(venta) && venta < compra;
    const diferencia = compra - venta;

    useEffect(() => {
        if (estado?.ok) onExito();
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Código SKU */}
                <div className="space-y-2">
                    <Label htmlFor="codigo">Código SKU</Label>
                    <Input
                        id="codigo"
                        name="codigo"
                        defaultValue={v?.codigo}
                        disabled={editando}
                        required={!editando}
                        placeholder="Ej. BORS-001"
                    />
                    {/* TRUCO: Si estamos editando, inyectamos un input oculto para que el código SKU viaje sí o sí al servidor */}
                    {editando && <input type="hidden" name="codigo" value={v?.codigo || ""} />}

                    {errores.codigo && <p className="text-sm text-red-600">{errores.codigo}</p>}
                </div>

                {/* Nombre */}
                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del producto</Label>
                    <Input id="nombre" name="nombre" defaultValue={v?.nombre} required placeholder="Ej. Paracetamol 500mg" />
                    {errores.nombre && <p className="text-sm text-red-600">{errores.nombre}</p>}
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                    <Label htmlFor="categoriaId">Categoría</Label>
                    <select id="categoriaId" name="categoriaId" defaultValue={v?.categoriaId ?? ""} required className={claseSelect}>
                        <option value="" disabled>Seleccione una categoría</option>
                        {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                    {errores.categoriaId && <p className="text-sm text-red-600">{errores.categoriaId}</p>}
                </div>

                {/* Unidad de Medida */}
                <div className="space-y-2">
                    <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                    <select id="unidadMedida" name="unidadMedida" defaultValue={v?.unidadMedida ?? "Unidad"} className={claseSelect}>
                        {UNIDADES_MEDIDA.map((unidad) => (
                            <option key={unidad} value={unidad}>{unidad}</option>
                        ))}
                    </select>
                    {errores.unidadMedida && <p className="text-sm text-red-600">{errores.unidadMedida}</p>}
                </div>

                {/* Moneda */}
                <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <select
                        id="moneda"
                        name="moneda"
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value)}
                        className={claseSelect}
                    >
                        <option value="PEN">Soles (S/)</option>
                        <option value="USD">Dólares ($)</option>
                    </select>
                    {errores.moneda && <p className="text-sm text-red-600">{errores.moneda}</p>}
                </div>

                {/* Stock Mínimo */}
                <div className="space-y-2">
                    <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                    <Input id="stockMinimo" name="stockMinimo" type="number" defaultValue={v?.stockMinimo ?? 0} required />
                    {errores.stockMinimo && <p className="text-sm text-red-600">{errores.stockMinimo}</p>}
                </div>

                {/* Precio de Compra */}
                <div className="space-y-2">
                    <Label htmlFor="precioCompra">Precio de Compra (Costo)</Label>
                    <Input
                        id="precioCompra"
                        name="precioCompra"
                        value={precioCompra}
                        onChange={(e) => setPrecioCompra(e.target.value)}
                        required
                        placeholder="0.00"
                    />
                    {errores.precioCompra && <p className="text-sm text-red-600">{errores.precioCompra}</p>}
                </div>

                {/* Precio de Venta */}
                <div className="space-y-2">
                    <Label htmlFor="precioVenta">Precio de Venta</Label>
                    <Input
                        id="precioVenta"
                        name="precioVenta"
                        value={precioVenta}
                        onChange={(e) => setPrecioVenta(e.target.value)}
                        required
                        placeholder="0.00"
                    />
                    {errores.precioVenta && <p className="text-sm text-red-600">{errores.precioVenta}</p>}
                </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea id="descripcion" name="descripcion" defaultValue={v?.descripcion} placeholder="Detalles adicionales del producto..." className="resize-none" />
                {errores.descripcion && <p className="text-sm text-red-600">{errores.descripcion}</p>}
            </div>

            {/* ALERTA ÁMBAR (Liquidación bajo costo) */}
            {margenNegativo && (
                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                                Aviso de margen negativo
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    El precio de venta es menor al costo de compra. Estás vendiendo el producto
                                    <strong> {formatoMoneda(diferencia, moneda as "PEN" | "USD")} </strong>
                                    por debajo de su costo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={pendiente}>
                    {pendiente ? "Guardando..." : editando ? "Guardar cambios" : "Crear Producto"}
                </Button>
            </div>
        </form>
    );
}