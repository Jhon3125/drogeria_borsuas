
"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    AlertTriangle,
    Boxes,
    Loader2,
    Package,
    Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { formatoMoneda } from "@/lib/formato";
import { UNIDADES_MEDIDA } from "@/lib/validaciones/producto";

import type { EstadoForm } from "./actions";

type Categoria = {
    id: number;
    nombre: string;
};

type ProductoInicial = {
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
    action: (
        prev: EstadoForm,
        formData: FormData
    ) => Promise<EstadoForm>;
    modo: "crear" | "editar";
    inicial?: ProductoInicial;
    categorias: Categoria[];
    onExito: () => void;
    onCancelar: () => void;
};

const claseSelect =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export function ProductoForm({
    action,
    modo,
    inicial,
    categorias,
    onExito,
    onCancelar,
}: Props) {
    const [estado, formAction, pendiente] = useActionState(
        action,
        undefined
    );

    const valores = estado?.valores ?? inicial;
    const errores = estado?.errores ?? {};
    const editando = modo === "editar";

    const [precioCompra, setPrecioCompra] = useState(
        String(valores?.precioCompra ?? "")
    );

    const [precioVenta, setPrecioVenta] = useState(
        String(valores?.precioVenta ?? "")
    );

    const [moneda, setMoneda] = useState(
        String(valores?.moneda ?? "PEN")
    );

    const compra = Number(precioCompra);
    const venta = Number(precioVenta);

    const margenNegativo =
        precioCompra.trim() !== "" &&
        precioVenta.trim() !== "" &&
        Number.isFinite(compra) &&
        Number.isFinite(venta) &&
        venta < compra;

    const diferencia = compra - venta;

    useEffect(() => {
        if (estado?.ok) {
            onExito();
        }
    }, [estado, onExito]);

    return (
        <form action={formAction} className="space-y-6">
            {/* Información general */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Información general
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="codigo">
                            Código SKU
                        </Label>

                        <Input
                            id="codigo"
                            name="codigo"
                            placeholder="Ej. BORS-001"
                            defaultValue={String(
                                valores?.codigo ?? ""
                            )}
                            disabled={editando}
                            required={!editando}
                            className="h-10"
                        />

                        {editando && (
                            <input
                                type="hidden"
                                name="codigo"
                                value={inicial?.codigo ?? ""}
                            />
                        )}

                        {editando && (
                            <p className="text-xs text-muted-foreground">
                                El código SKU no puede modificarse.
                            </p>
                        )}

                        {errores.codigo && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.codigo}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">
                            Nombre del producto
                        </Label>

                        <Input
                            id="nombre"
                            name="nombre"
                            placeholder="Ej. Paracetamol 500 mg"
                            defaultValue={String(
                                valores?.nombre ?? ""
                            )}
                            required
                            className="h-10"
                        />

                        {errores.nombre && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.nombre}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categoriaId">
                            Categoría
                        </Label>

                        <select
                            id="categoriaId"
                            name="categoriaId"
                            defaultValue={String(
                                valores?.categoriaId ?? ""
                            )}
                            required
                            className={claseSelect}
                        >
                            <option value="" disabled>
                                Selecciona una categoría
                            </option>

                            {categorias.map((categoria) => (
                                <option
                                    key={categoria.id}
                                    value={categoria.id}
                                >
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>

                        {errores.categoriaId && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.categoriaId}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unidadMedida">
                            Unidad de medida
                        </Label>

                        <select
                            id="unidadMedida"
                            name="unidadMedida"
                            defaultValue={String(
                                valores?.unidadMedida ??
                                "Unidad"
                            )}
                            className={claseSelect}
                        >
                            {UNIDADES_MEDIDA.map((unidad) => (
                                <option
                                    key={unidad}
                                    value={unidad}
                                >
                                    {unidad}
                                </option>
                            ))}
                        </select>

                        {errores.unidadMedida && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.unidadMedida}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Precios */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Precios y moneda
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="moneda">
                            Moneda
                        </Label>

                        <select
                            id="moneda"
                            name="moneda"
                            value={moneda}
                            onChange={(e) =>
                                setMoneda(e.target.value)
                            }
                            className={claseSelect}
                        >
                            <option value="PEN">
                                Soles (S/)
                            </option>
                            <option value="USD">
                                Dólares (USD)
                            </option>
                        </select>

                        {errores.moneda && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.moneda}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="precioCompra">
                            Precio de compra
                        </Label>

                        <Input
                            id="precioCompra"
                            name="precioCompra"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={precioCompra}
                            onChange={(e) =>
                                setPrecioCompra(e.target.value)
                            }
                            required
                            className="h-10"
                        />

                        {errores.precioCompra && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.precioCompra}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="precioVenta">
                            Precio de venta
                        </Label>

                        <Input
                            id="precioVenta"
                            name="precioVenta"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={precioVenta}
                            onChange={(e) =>
                                setPrecioVenta(e.target.value)
                            }
                            required
                            className="h-10"
                        />

                        {errores.precioVenta && (
                            <p className="text-xs font-medium text-destructive">
                                {errores.precioVenta}
                            </p>
                        )}
                    </div>
                </div>

                {/* Advertencia bajo costo */}
                {margenNegativo && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
                    >
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div className="space-y-1">
                            <p className="text-sm font-semibold">
                                Aviso de margen negativo
                            </p>

                            <p className="text-xs leading-5 text-amber-800">
                                El precio de venta está{" "}
                                <strong>
                                    {formatoMoneda(
                                        diferencia,
                                        moneda as "PEN" | "USD"
                                    )}
                                </strong>{" "}
                                por debajo del precio de compra.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* Inventario y descripción */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                        Inventario e información adicional
                    </h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="stockMinimo">
                        Stock mínimo
                    </Label>

                    <Input
                        id="stockMinimo"
                        name="stockMinimo"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={String(
                            valores?.stockMinimo ?? 0
                        )}
                        required
                        className="h-10 sm:max-w-52"
                    />

                    <p className="text-xs text-muted-foreground">
                        Cantidad mínima de referencia para
                        futuras alertas de inventario.
                    </p>

                    {errores.stockMinimo && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.stockMinimo}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="descripcion">
                        Descripción (opcional)
                    </Label>

                    <Textarea
                        id="descripcion"
                        name="descripcion"
                        defaultValue={String(
                            valores?.descripcion ?? ""
                        )}
                        placeholder="Información adicional del producto..."
                        rows={3}
                        className="resize-none"
                    />

                    {errores.descripcion && (
                        <p className="text-xs font-medium text-destructive">
                            {errores.descripcion}
                        </p>
                    )}
                </div>
            </section>

            {/* Errores generales */}
            {estado?.error && (
                <div
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    {estado.error}
                </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelar}
                    disabled={pendiente}
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
                        : editando
                            ? "Guardar cambios"
                            : "Crear producto"}
                </Button>
            </div>
        </form>
    );
}
