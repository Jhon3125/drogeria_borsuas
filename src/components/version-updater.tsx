"use client";

import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 60_000;

type VersionResponse = { version?: string };

export function VersionUpdater() {
  const [newVersion, setNewVersion] = useState(false);

  useEffect(() => {
    let active = true;
    let initialVersion: string | null = null;

    async function checkVersion() {
      if (document.visibilityState === "hidden") return;

      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;

        const data = (await response.json()) as VersionResponse;
        if (!active || !data.version) return;

        if (initialVersion === null) {
          initialVersion = data.version;
        } else if (initialVersion !== data.version) {
          setNewVersion(true);
        }
      } catch {
        // Temporary connectivity issues should not interrupt the ERP.
      }
    }

    void checkVersion();
    const intervalId = window.setInterval(() => void checkVersion(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkVersion);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkVersion);
    };
  }, []);

  if (!newVersion) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-blue-200 bg-white p-4 shadow-xl"
    >
      <p className="text-sm font-semibold text-[#123E70]">Nueva versión disponible</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Se publicó una actualización de Droguería Borsuas. Guarda tus formularios antes de actualizar.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 w-full rounded-lg bg-[#123E70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c2e55]"
      >
        Actualizar versión
      </button>
    </aside>
  );
}
