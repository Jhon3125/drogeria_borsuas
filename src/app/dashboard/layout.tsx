
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

import {
    NAVEGACION,
    NAVEGACION_FUTURA,
} from "@/lib/navegacion";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const rol = session.user.rol;

    const items = NAVEGACION.filter((item) =>
        item.roles.includes(rol)
    );

    const futuros = NAVEGACION_FUTURA.filter((item) =>
        item.roles.includes(rol)
    );

    const nombreUsuario = session.user.name ?? "Usuario";

    return (
        <div className="flex h-dvh overflow-hidden bg-background">
            {/* Sidebar independiente */}
            <div className="hidden h-full shrink-0 md:block">
                <Sidebar
                    items={items}
                    futuros={futuros}
                />
            </div>

            {/* Área principal */}
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <div className="z-10 shrink-0">
                    <Topbar
                        nombre={nombreUsuario}
                        rol={rol}
                    />
                </div>

                <main className="borsuas-content-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
