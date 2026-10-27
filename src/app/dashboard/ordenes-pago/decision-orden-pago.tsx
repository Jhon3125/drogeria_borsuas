
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
    ShieldCheck,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    aprobarOrdenPago,
    rechazarOrdenPago,
} from "./actions";

export function DecisionOrdenPago({
    ordenPagoId,
}: {
    ordenPagoId: number;
}) {
    const router = useRouter();
    const [mostrarRechazo, setMostrarRechazo] = useState(false);
    const [motivo, setMotivo] = useState("");

    const [aprobacion, accionAprobar, aprobando] = useActionState(
        aprobarOrdenPago,
        undefined
    );

    const [rechazo, accionRechazar, rechazando] = useActionState(
        rechazarOrdenPago,
        undefined
    );

    const procesando = aprobando || rechazando;

    useEffect(() => {
        if (aprobacion?.ok || rechazo?.ok) {
            router.refresh();
        }
    }, [aprobacion?.ok, rechazo?.ok, router]);

    return (
        <section className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary p-2.5 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="font-semibold">
                        Autorización de pago
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Aprobar autoriza el desembolso,
                        pero no registra una salida de dinero.
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-3">
                    <form action={accionAprobar}>
                        <input
                            type="hidden"
                            name="ordenPagoId"
                            value={ordenPagoId}
                        />

                        <Button
                            type="submit"
                            disabled={procesando || mostrarRechazo}
                            className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                            {aprobando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Aprobar solicitud
                        </Button>
                    </form>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={procesando}
                        onClick={() =>
                            setMostrarRechazo((valor) => !valor)
                        }
                        className="gap-2 text-red-700"
                    >
                        <XCircle className="h-4 w-4" />
                        {mostrarRechazo
                            ? "Cerrar rechazo"
                            : "Rechazar solicitud"}
                    </Button>
                </div>

                {mostrarRechazo && (
                    <form
                        action={accionRechazar}
                        className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-4"
                    >
                        <input
                            type="hidden"
                            name="ordenPagoId"
                            value={ordenPagoId}
                        />

                        <label
                            htmlFor="motivo-rechazo-op"
                            className="block text-sm font-semibold"
                        >
                            Motivo del rechazo *
                        </label>

                        <textarea
                            id="motivo-rechazo-op"
                            name="motivo"
                            value={motivo}
                            onChange={(event) =>
                                setMotivo(event.target.value)
                            }
                            disabled={procesando}
                            minLength={10}
                            maxLength={1000}
                            required
                            rows={3}
                            placeholder="Explica por qué se rechaza esta solicitud..."
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />

                        <p className="text-xs text-muted-foreground">
                            Al rechazarla, el importe solicitado
                            dejará de comprometer saldo de la OC.
                        </p>

                        <Button
                            type="submit"
                            disabled={
                                procesando ||
                                motivo.trim().length < 10 ||
                                motivo.trim().length > 1000
                            }
                            variant="destructive"
                            className="gap-2"
                        >
                            {rechazando && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Confirmar rechazo
                        </Button>
                    </form>
                )}

                {(aprobacion?.error || rechazo?.error) && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {aprobacion?.error || rechazo?.error}
                    </p>
                )}

                {(aprobacion?.ok || rechazo?.ok) && (
                    <p
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                    >
                        {aprobacion?.ok || rechazo?.ok}
                    </p>
                )}
            </div>
        </section>
    );
}
