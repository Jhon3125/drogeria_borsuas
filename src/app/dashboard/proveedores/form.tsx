
"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    guardarProveedor,
    type EstadoProveedor,
} from "./actions";

type ProveedorData = {
    id: number;
    razonSocial: string;
    ruc: string;
    contacto: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
};

type Props = {
    proveedor?: ProveedorData;
    onCancelar?: () => void;
};

const estadoInicial: EstadoProveedor = undefined;

export function FormularioProveedor({
    proveedor,
    onCancelar,
}: Props) {
    const router = useRouter();

    const [estado, accion, pendiente] = useActionState(
        guardarProveedor,
        estadoInicial
    );

    useEffect(() => {
        if (estado?.ok) {
            router.refresh();
        }
    }, [estado?.ok, router]);

    const esEdicion = Boolean(proveedor);

    return (
        <form
            action={accion}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <input
                type="hidden"
                name="id"
                value={proveedor?.id ?? ""}
            />

            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#123E70]">
                        {esEdicion
                            ? "Editar proveedor"
                            : "Registrar nuevo proveedor"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {esEdicion
                            ? "Actualiza los datos generales del proveedor."
                            : "Completa los datos de la empresa proveedora."}
                    </p>
                </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
                <Campo
                    id="proveedor-razonSocial"
                    nombre="razonSocial"
                    etiqueta="Razón social"
                    valor={proveedor?.razonSocial ?? ""}
                    requerido
                    maxLength={180}
                    placeholder="Ej. Distribuidora Farmacéutica SAC"
                />

                <Campo
                    id="proveedor-ruc"
                    nombre="ruc"
                    etiqueta="RUC"
                    valor={proveedor?.ruc ?? ""}
                    requerido
                    maxLength={11}
                    minLength={11}
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    placeholder="11 dígitos"
                />

                <Campo
                    id="proveedor-contacto"
                    nombre="contacto"
                    etiqueta="Persona de contacto"
                    valor={proveedor?.contacto ?? ""}
                    maxLength={120}
                    placeholder="Nombre del representante"
                />

                <Campo
                    id="proveedor-telefono"
                    nombre="telefono"
                    etiqueta="Teléfono"
                    valor={proveedor?.telefono ?? ""}
                    maxLength={30}
                    tipo="tel"
                    placeholder="Número de contacto"
                />

                <Campo
                    id="proveedor-correo"
                    nombre="correo"
                    etiqueta="Correo electrónico"
                    valor={proveedor?.correo ?? ""}
                    tipo="email"
                    maxLength={254}
                    placeholder="contacto@empresa.com"
                />

                <div className="space-y-1.5 md:col-span-2">
                    <label
                        htmlFor="proveedor-direccion"
                        className="block text-sm font-semibold text-slate-700"
                    >
                        Dirección
                    </label>

                    <textarea
                        id="proveedor-direccion"
                        name="direccion"
                        defaultValue={proveedor?.direccion ?? ""}
                        rows={2}
                        maxLength={300}
                        placeholder="Dirección fiscal o comercial"
                        className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100"
                    />
                </div>

                {estado?.error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:col-span-2"
                    >
                        {estado.error}
                    </div>
                )}

                {estado?.ok && (
                    <div
                        role="status"
                        className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-[#238B55] md:col-span-2"
                    >
                        {estado.ok}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                {onCancelar && (
                    <button
                        type="button"
                        disabled={pendiente}
                        onClick={onCancelar}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                )}

                <button
                    type="submit"
                    disabled={pendiente}
                    className="rounded-lg bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087EBD] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pendiente
                        ? "Guardando..."
                        : esEdicion
                            ? "Guardar cambios"
                            : "Registrar proveedor"}
                </button>
            </div>
        </form>
    );
}

type CampoProps = {
    id: string;
    nombre: string;
    etiqueta: string;
    valor: string;
    requerido?: boolean;
    tipo?: string;
    maxLength?: number;
    minLength?: number;
    inputMode?: "numeric";
    pattern?: string;
    placeholder?: string;
};

function Campo({
    id,
    nombre,
    etiqueta,
    valor,
    requerido = false,
    tipo = "text",
    maxLength,
    minLength,
    inputMode,
    pattern,
    placeholder,
}: CampoProps) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={id}
                className="block text-sm font-semibold text-slate-700"
            >
                {etiqueta}

                {requerido && (
                    <span className="ml-1 text-red-600">*</span>
                )}
            </label>

            <input
                id={id}
                name={nombre}
                type={tipo}
                defaultValue={valor}
                required={requerido}
                maxLength={maxLength}
                minLength={minLength}
                inputMode={inputMode}
                pattern={pattern}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#087EBD] focus:ring-2 focus:ring-sky-100"
            />
        </div>
    );
}
