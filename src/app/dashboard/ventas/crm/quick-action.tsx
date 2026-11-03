"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type Variante = "default" | "primary" | "success";

export function QuickAction({
  label,
  icon,
  onClick,
  disabled = false,
  variant = "default",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: Variante;
}) {
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0, arriba: true });

  const actualizarPosicion = useCallback(() => {
    if (!boton.current) return;
    const r = boton.current.getBoundingClientRect();
    const arriba = r.top >= 54;
    setPosicion({
      top: arriba ? r.top - 8 : r.bottom + 8,
      left: Math.max(90, Math.min(window.innerWidth - 90, r.left + r.width / 2)),
      arriba,
    });
  }, []);

  useEffect(() => { setMontado(true); }, []);
  useEffect(() => {
    if (!visible) return;
    actualizarPosicion();
    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [visible, actualizarPosicion]);

  const estilos: Record<Variante, string> = {
    default: "border-slate-200 bg-white text-[#123E70] hover:bg-slate-50",
    primary: "border-sky-200 bg-sky-50 text-[#087EBD] hover:bg-sky-100",
    success: "border-[#123E70] bg-[#123E70] text-white hover:bg-[#087EBD]",
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        draggable={false}
        disabled={disabled}
        aria-label={label}
        aria-describedby={visible && !disabled ? id : undefined}
        onClick={() => { setVisible(false); onClick(); }}
        onMouseEnter={() => { actualizarPosicion(); setVisible(true); }}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => { actualizarPosicion(); setVisible(true); }}
        onBlur={() => setVisible(false)}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 ${estilos[variant]}`}
      >
        {icon}
      </button>
      {montado && visible && !disabled && createPortal(
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] max-w-[230px] -translate-x-1/2 rounded-md bg-slate-950 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white shadow-xl"
          style={{ left: posicion.left, top: posicion.top, transform: `translate(-50%, ${posicion.arriba ? "-100%" : "0"})` }}
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
}
