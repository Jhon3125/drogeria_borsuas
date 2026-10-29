
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cambiarEstadoCalidadLote } from "./actions";

type EstadoCalidad =
    | "DISPONIBLE"
    | "CUARENTENA"
    | "BLOQUEADO";

export function EstadoCalidadForm({
    loteId,
    estadoActual,
}: {
    loteId: number;
    estadoActual: EstadoCalidad;
}) {
    const router = useRouter();

    const [estado, accion, pendiente] = useActionState(
        cambiarEstadoCalidadLote,
        undefined
    );

    const [nuevoEstado, setNuevoEstado] =
        useState<EstadoCalidad>(estadoActual);

    const [motivo, setMotivo] = useState("");

    useEffect(() => {
        if (estado?.ok) {
            router.refresh();
        }
    }, [estado?.ok, router]);

    return (
        <section className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                    Gestión de calidad
                </h2>
            </div>

            <p className="mb-5 text-sm text-muted-foreground">
                Cambiar el estado no incrementa ni disminuye
                las existencias físicas del lote.
            </p>

            <form action={accion} className="space-y-4">
                <input
                    type="hidden"
                    name="loteId"
                    value={loteId}
                />

                <div className="space-y-2">
                    <label
                        htmlFor="estado-calidad"
                        className="block text-sm font-medium"
                    >
                        Nuevo estado
                    </label>

                    <select
                        id="estado-calidad"
                        name="estadoCalidad"
                        value={nuevoEstado}
                        onChange={(e) =>
                            setNuevoEstado(
                                e.target.value as EstadoCalidad
                            )
                        }
                        disabled={pendiente}
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                        <option value="DISPONIBLE">
                            Disponible
                        </option>
                        <option value="CUARENTENA">
                            Cuarentena
                        </option>
                        <option value="BLOQUEADO">
                            Bloqueado
                        </option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="motivo-calidad"
                        className="block text-sm font-medium"
                    >
                        Motivo del cambio *
                    </label>

                    <textarea
                        id="motivo-calidad"
                        name="motivo"
                        value={motivo}
                        onChange={(e) =>
                            setMotivo(e.target.value)
                        }
                        minLength={10}
                        maxLength={500}
                        required
                        disabled={pendiente}
                        rows={3}
                        placeholder="Describe la razón del bloqueo, cuarentena o liberación..."
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                </div>

                {estado?.error && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {estado.error}
                    </p>
                )}

                {estado?.ok && (
                    <p
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                    >
                        {estado.ok}
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={
                        pendiente ||
                        nuevoEstado === estadoActual ||
                        motivo.trim().length < 10
                    }
                    className="gap-2 bg-[#123E70] hover:bg-[#0c315b]"
                >
                    {pendiente && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Guardar cambio de calidad
                </Button>
            </form>
        </section>
    );
}
