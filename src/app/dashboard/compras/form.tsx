
"use client";

import { useActionState, useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { crearCompra } from "./actions";

type Moneda = "PEN" | "USD";

type ProductoOpcion = {
  id: number;
  nombre: string;
  codigo: string;
  precioCompra: string;
  moneda: Moneda;
};

type Item = {
  clave: number;
  productoId: number;
  cantidad: number;
  precioUnitario: string;
  precioManual: boolean;
};

type Props = {
  proveedores: {
    id: number;
    razonSocial: string;
  }[];
  productos: ProductoOpcion[];
  onExito?: () => void;
  onCancelar?: () => void;
};

const simbolo = (moneda: Moneda) =>
  moneda === "USD" ? "US$" : "S/";

const claseCampo =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

function sugerirCosto(
  producto: ProductoOpcion | undefined,
  moneda: Moneda,
  tipoCambio: string
) {
  if (!producto) return "";

  const costo = Number(producto.precioCompra);

  if (!Number.isFinite(costo) || costo < 0) {
    return "";
  }

  if (producto.moneda === moneda) {
    return costo.toFixed(2);
  }

  const tasa = Number(tipoCambio);

  if (!Number.isFinite(tasa) || tasa <= 0) {
    return "";
  }

  const convertido =
    producto.moneda === "USD"
      ? costo * tasa
      : costo / tasa;

  return Number.isFinite(convertido) && convertido >= 0
    ? convertido.toFixed(2)
    : "";
}

export function CompraForm({
  proveedores,
  productos,
  onExito,
  onCancelar,
}: Props) {
  const [proveedorId, setProveedorId] = useState(0);
  const [moneda, setMoneda] = useState<Moneda>("PEN");
  const [tipoCambio, setTipoCambio] = useState("");
  const [fechaEntregaEstimada, setFechaEntregaEstimada] =
    useState("");
  const [observaciones, setObservaciones] = useState("");

  const [siguienteClave, setSiguienteClave] = useState(2);
  const [items, setItems] = useState<Item[]>([
    {
      clave: 1,
      productoId: 0,
      cantidad: 1,
      precioUnitario: "",
      precioManual: false,
    },
  ]);

  const [estado, formAction, pendiente] = useActionState(
    crearCompra,
    undefined
  );

  useEffect(() => {
    if (estado?.ok) {
      onExito?.();
    }
  }, [estado?.ok, onExito]);

  const requiereCambio = items.some((item) => {
    const producto = productos.find(
      (p) => p.id === item.productoId
    );

    return producto && producto.moneda !== moneda;
  });

  const tasaValida =
    /^\d{1,5}(\.\d{1,6})?$/.test(tipoCambio) &&
    Number(tipoCambio) > 0;

  const clavesLineas = items
    .filter((item) => item.productoId > 0)
    .map((item) => {
      const costo = Number(item.precioUnitario);

      return `${item.productoId}::${costo.toFixed(2)}`;
    });

  const duplicados =
    new Set(clavesLineas).size !== clavesLineas.length;

  const itemsInvalidos = items.some(
    (item) =>
      !item.productoId ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad < 1 ||
      item.cantidad > 1000000 ||
      !/^\d{1,9}(\.\d{1,2})?$/.test(
        item.precioUnitario
      )
  );

  const total = items.reduce(
    (acumulado, item) =>
      acumulado +
      Number(item.precioUnitario || 0) * item.cantidad,
    0
  );

  const puedeGuardar =
    proveedorId > 0 &&
    items.length > 0 &&
    !itemsInvalidos &&
    !duplicados &&
    (!requiereCambio || tasaValida) &&
    Number.isFinite(total) &&
    total <= 9999999999.99 &&
    observaciones.trim().length <= 1000;

  function cambiarMoneda(nuevaMoneda: Moneda) {
    setMoneda(nuevaMoneda);

    setItems((anteriores) =>
      anteriores.map((item) => ({
        ...item,
        precioUnitario: sugerirCosto(
          productos.find(
            (p) => p.id === item.productoId
          ),
          nuevaMoneda,
          tipoCambio
        ),
        precioManual: false,
      }))
    );
  }

  function cambiarTipoCambio(valor: string) {
    setTipoCambio(valor);

    setItems((anteriores) =>
      anteriores.map((item) =>
        item.precioManual
          ? item
          : {
            ...item,
            precioUnitario: sugerirCosto(
              productos.find(
                (p) =>
                  p.id === item.productoId
              ),
              moneda,
              valor
            ),
          }
      )
    );
  }

  function seleccionarProducto(clave: number, id: number) {
    const producto = productos.find((p) => p.id === id);

    setItems((anteriores) =>
      anteriores.map((item) =>
        item.clave !== clave
          ? item
          : {
            ...item,
            productoId: id,
            precioUnitario: sugerirCosto(
              producto,
              moneda,
              tipoCambio
            ),
            precioManual: false,
          }
      )
    );
  }

  function actualizarItem(
    clave: number,
    campo: "cantidad" | "precioUnitario",
    valor: string
  ) {
    setItems((anteriores) =>
      anteriores.map((item) =>
        item.clave !== clave
          ? item
          : {
            ...item,
            [campo]:
              campo === "cantidad"
                ? Number(valor)
                : valor,
            precioManual:
              campo === "precioUnitario"
                ? true
                : item.precioManual,
          }
      )
    );
  }

  function agregarProducto() {
    if (items.length >= 100) return;

    setItems((anteriores) => [
      ...anteriores,
      {
        clave: siguienteClave,
        productoId: 0,
        cantidad: 1,
        precioUnitario: "",
        precioManual: false,
      },
    ]);

    setSiguienteClave((actual) => actual + 1);
  }

  function quitarProducto(clave: number) {
    setItems((anteriores) =>
      anteriores.filter((item) => item.clave !== clave)
    );
  }

  const payload = JSON.stringify({
    proveedorId,
    moneda,
    tipoCambio: requiereCambio ? tipoCambio : "",
    fechaEntregaEstimada:
      fechaEntregaEstimada || null,
    observaciones: observaciones.trim(),
    items: items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    })),
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-[#123E70]">
        La orden quedará pendiente. Las existencias
        solo aumentarán cuando se confirme la recepción.
      </div>

      {/* Información general */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Información de la orden
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="oc-proveedor">
              Proveedor *
            </Label>

            <select
              id="oc-proveedor"
              value={proveedorId}
              onChange={(e) =>
                setProveedorId(
                  Number(e.target.value)
                )
              }
              disabled={pendiente}
              className={claseCampo}
              required
            >
              <option value={0}>
                Seleccionar proveedor
              </option>
              {proveedores.map((proveedor) => (
                <option
                  key={proveedor.id}
                  value={proveedor.id}
                >
                  {proveedor.razonSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-moneda">
              Moneda *
            </Label>

            <select
              id="oc-moneda"
              value={moneda}
              onChange={(e) =>
                cambiarMoneda(
                  e.target.value as Moneda
                )
              }
              disabled={pendiente}
              className={claseCampo}
            >
              <option value="PEN">
                Soles (PEN · S/)
              </option>
              <option value="USD">
                Dólares (USD · US$)
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de emisión</Label>
            <div className="flex h-10 items-center rounded-lg border bg-secondary/40 px-3 text-sm text-muted-foreground">
              Automática al registrar
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-entrega">
              Entrega estimada
            </Label>
            <Input
              id="oc-entrega"
              type="date"
              value={fechaEntregaEstimada}
              onChange={(e) =>
                setFechaEntregaEstimada(
                  e.target.value
                )
              }
              disabled={pendiente}
              className="h-10"
            />
          </div>
        </div>

        {requiereCambio && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Label
              htmlFor="oc-tipo-cambio"
              className="text-amber-950"
            >
              Tipo de cambio (1 USD = S/)
            </Label>
            <Input
              id="oc-tipo-cambio"
              type="number"
              min="0.000001"
              step="0.000001"
              value={tipoCambio}
              onChange={(e) =>
                cambiarTipoCambio(
                  e.target.value
                )
              }
              placeholder="Ej. 3.750000"
              disabled={pendiente}
              className="h-10 max-w-64 bg-white"
            />
            <p className="text-xs text-amber-900">
              Se utiliza para sugerir costos.
              Puedes modificar cada costo unitario.
            </p>
          </div>
        )}
      </section>

      {/* Productos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">
              Productos solicitados
            </h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={agregarProducto}
            disabled={
              pendiente || items.length >= 100
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir producto
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, indice) => {
            const producto = productos.find(
              (p) => p.id === item.productoId
            );

            const subtotal =
              Number(item.precioUnitario || 0) *
              item.cantidad;

            return (
              <div
                key={item.clave}
                className="rounded-xl border border-border bg-secondary/25 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    PRODUCTO {indice + 1}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      quitarProducto(
                        item.clave
                      )
                    }
                    disabled={
                      pendiente ||
                      items.length === 1
                    }
                    className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(90px,0.8fr)_minmax(130px,1fr)]">
                  <div className="space-y-2">
                    <Label>
                      Producto *
                    </Label>
                    <select
                      aria-label={`Producto ${indice + 1}`}
                      value={
                        item.productoId
                      }
                      onChange={(e) =>
                        seleccionarProducto(
                          item.clave,
                          Number(
                            e.target.value
                          )
                        )
                      }
                      disabled={pendiente}
                      className={claseCampo}
                    >
                      <option value={0}>
                        Seleccionar producto
                      </option>
                      {productos.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                        >
                          {p.codigo} —{" "}
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad *</Label>
                    <Input
                      aria-label={`Cantidad del producto ${indice + 1}`}
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarItem(
                          item.clave,
                          "cantidad",
                          e.target.value
                        )
                      }
                      disabled={pendiente}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Costo unitario (
                      {simbolo(moneda)}) *
                    </Label>
                    <Input
                      aria-label={`Costo del producto ${indice + 1}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        item.precioUnitario
                      }
                      onChange={(e) =>
                        actualizarItem(
                          item.clave,
                          "precioUnitario",
                          e.target.value
                        )
                      }
                      disabled={pendiente}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {producto
                      ? `Costo catálogo: ${simbolo(producto.moneda)} ${Number(producto.precioCompra).toFixed(2)}`
                      : "Selecciona un producto"}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    Subtotal:{" "}
                    {simbolo(moneda)}{" "}
                    {Number.isFinite(subtotal)
                      ? subtotal.toFixed(2)
                      : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {duplicados && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <p className="font-semibold">
              Hay productos duplicados con el mismo costo.
            </p>

            <p className="mt-1 text-xs leading-5">
              Puedes registrar el mismo producto varias veces
              únicamente cuando tenga costos unitarios diferentes.
              Si el costo es igual, agrupa las cantidades en una sola línea.
            </p>
          </div>
        )}
      </section>

      {/* Observaciones */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b pb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Indicaciones de entrega
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oc-observaciones">
            Observaciones (opcional)
          </Label>
          <Textarea
            id="oc-observaciones"
            value={observaciones}
            onChange={(e) =>
              setObservaciones(e.target.value)
            }
            rows={3}
            maxLength={1000}
            disabled={pendiente}
            placeholder="Horario de entrega, instrucciones al proveedor u otras condiciones..."
            className="resize-none"
          />
        </div>
      </section>

      {/* Total */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div>
          <p className="text-sm font-semibold text-[#123E70]">
            Total estimado
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length} línea(s) de producto
          </p>
        </div>

        <p className="text-2xl font-bold text-[#123E70]">
          {simbolo(moneda)}{" "}
          {Number.isFinite(total)
            ? total.toFixed(2)
            : "—"}
        </p>
      </div>

      {estado?.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {estado.error}
        </p>
      )}

      <input
        type="hidden"
        name="payload"
        value={payload}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        {onCancelar && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={pendiente}
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          disabled={pendiente || !puedeGuardar}
          className="min-w-44 gap-2"
        >
          {pendiente && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {pendiente
            ? "Registrando..."
            : "Crear Orden de Compra"}
        </Button>
      </div>
    </form>
  );
}
