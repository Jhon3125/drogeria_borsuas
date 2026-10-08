
import Link from "next/link";
import {
    ArrowUpRight,
    type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ColorMetrica =
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "violet"
    | "slate";

type MetricCardProps = {
    titulo: string;
    valor?: string | number | null;
    descripcion: string;
    icono: LucideIcon;
    color?: ColorMetrica;
    pendiente?: boolean;
    href?: string;
};

const estilosColor: Record<
    ColorMetrica,
    {
        icono: string;
        acento: string;
    }
> = {
    blue: {
        icono: "bg-[#E1F0FC] text-[#087EBD]",
        acento: "bg-[#087EBD]",
    },
    green: {
        icono: "bg-[#E2F5EA] text-[#238B55]",
        acento: "bg-[#238B55]",
    },
    amber: {
        icono: "bg-amber-50 text-amber-600",
        acento: "bg-amber-500",
    },
    red: {
        icono: "bg-red-50 text-red-600",
        acento: "bg-red-500",
    },
    violet: {
        icono: "bg-violet-50 text-violet-600",
        acento: "bg-violet-500",
    },
    slate: {
        icono: "bg-slate-100 text-slate-500",
        acento: "bg-slate-400",
    },
};

export function MetricCard({
    titulo,
    valor,
    descripcion,
    icono: Icono,
    color = "blue",
    pendiente = false,
    href,
}: MetricCardProps) {
    const estilo = estilosColor[pendiente ? "slate" : color];

    const contenido = (
        <>
            {/* Acento superior */}
            <div
                className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    estilo.acento
                )}
            />

            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground/80">
                    {titulo}
                </p>

                <div
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        estilo.icono
                    )}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4">
                <p
                    className={cn(
                        "text-3xl font-bold tracking-tight",
                        pendiente
                            ? "text-muted-foreground/65"
                            : "text-primary"
                    )}
                >
                    {pendiente ? "—" : (valor ?? "—")}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {descripcion}
                </p>
            </div>

            {pendiente && (
                <div className="mt-3">
                    <span className="inline-flex rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                        Próximamente
                    </span>
                </div>
            )}

            {!pendiente && href && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Ver detalles
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
            )}
        </>
    );

    const clases = cn(
        "relative flex min-h-40 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs",
        href &&
        !pendiente &&
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    );

    if (href && !pendiente) {
        return (
            <Link href={href} className={clases}>
                {contenido}
            </Link>
        );
    }

    return <div className={clases}>{contenido}</div>;
}
