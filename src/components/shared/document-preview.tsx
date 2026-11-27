
"use client";

import { useEffect } from "react";
import { Download, ExternalLink, X } from "lucide-react";

type DocumentPreviewProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    src: string;
    type: "image" | "page";
};

export default function DocumentPreview({
    open,
    onClose,
    title,
    src,
    type,
}: DocumentPreviewProps) {
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = overflowAnterior;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        <h2 className="truncate font-bold text-[#123E70]">
                            {title}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {type === "image"
                                ? "Previsualización de imagen"
                                : "Previsualización de documento"}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir en otra pestaña"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                            <ExternalLink className="h-5 w-5" />
                        </a>

                        <a
                            href={src}
                            download
                            title="Descargar"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                            <Download className="h-5 w-5" />
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar previsualización"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-auto bg-slate-100">
                    {type === "image" ? (
                        <div className="flex min-h-[300px] items-center justify-center p-3 sm:p-6">
                            <img
                                src={src}
                                alt={title}
                                className="max-h-[calc(94vh-100px)] max-w-full rounded-lg object-contain"
                            />
                        </div>
                    ) : (
                        <iframe
                            src={src}
                            title={title}
                            className="h-[75vh] min-h-[450px] w-full bg-white"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
