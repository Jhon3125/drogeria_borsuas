import Link from "next/link";
import { usuarioVigente } from "@/lib/guard";
import { VersionUpdater } from "@/components/version-updater";
import { SidebarMobile } from "@/components/sidebar-mobile";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { NAVEGACION, NAVEGACION_FUTURA } from "@/lib/navegacion";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const usuario = await usuarioVigente();
    const rol = usuario.rol;

    // El conductor utiliza una experiencia independiente del ERP administrativo.
    if (rol === "CONDUCTOR") {
        return (
            <div className="min-h-dvh bg-[#F3F7FC]">
                <VersionUpdater />

                <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-[#F3F7FC]">
                    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href="/dashboard/logistica/despachos"
                                className="flex min-w-0 items-center gap-3"
                                aria-label="Ir a mis entregas"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#123E70] text-white">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
                                        <path d="M3.5 7.7 12 12l8.5-4.3M12 12v9" />
                                    </svg>
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-base font-extrabold tracking-tight text-[#123E70]">BORSUAS</span>
                                    <span className="block truncate text-xs text-slate-500">Entregas y logística</span>
                                </span>
                            </Link>

                            <div className="flex shrink-0 items-center gap-2">
                                <span className="hidden text-right sm:block">
                                    <span className="block max-w-36 truncate text-sm font-semibold text-slate-800">
                                        {usuario.name}
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        Conductor
                                    </span>
                                </span>

                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#123E70]">
                                    {usuario.name.trim().charAt(0).toUpperCase()}
                                </span>

                                <LogoutButton compacto />
                            </div>
                        </div>
                    </header>

                    <main className="min-h-0 flex-1 px-4 pb-28 pt-5 sm:px-6">
                        {children}
                    </main>

                    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur">
                        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
                            <Link
                                href="/dashboard/logistica/despachos"
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#123E70] hover:bg-blue-50"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" />
                                    <circle cx="7.5" cy="18" r="2" />
                                    <circle cx="17.5" cy="18" r="2" />
                                </svg>
                                Entregas
                            </Link>
                            <Link
                                href="/dashboard/logistica/despachos?vista=historial"
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-[#123E70]"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                                    <path d="M3 3v5h5M12 7v5l3 2" />
                                </svg>
                                Historial
                            </Link>
                            <Link
                                href="/dashboard/logistica/despachos?vista=perfil"
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-[#123E70]"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 21a8 8 0 0 1 16 0" />
                                </svg>
                                Perfil
                            </Link>
                        </div>
                    </nav>
                </div>
            </div>
        );
    }

    // Interfaz administrativa original para los demás roles.
    const items = NAVEGACION.filter((item) => item.roles.includes(rol));
    const futuros = NAVEGACION_FUTURA.filter((item) => item.roles.includes(rol));

    return (
        <div className="flex h-dvh overflow-hidden bg-background">
            <VersionUpdater />

            <div className="hidden h-full shrink-0 md:block">
                <Sidebar items={items} futuros={futuros} />
            </div>

            <SidebarMobile items={items} futuros={futuros} />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <div className="z-10 shrink-0">
                    <Topbar nombre={usuario.name} rol={rol} />
                </div>

                <main className="borsuas-content-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
