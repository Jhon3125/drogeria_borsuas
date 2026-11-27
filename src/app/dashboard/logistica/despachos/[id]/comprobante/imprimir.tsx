"use client";

import Link from "next/link";

export default function Imprimir() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-[#123E70] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f325a]"
      >
        Imprimir / Guardar PDF
      </button>
    </div>
  );
}
