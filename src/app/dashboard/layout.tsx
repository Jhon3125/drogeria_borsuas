
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

import { NAVEGACION } from "@/lib/navegacion";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const items = NAVEGACION.filter((item) =>
        item.roles.includes(session.user.rol)
    );

    const nombreUsuario = session.user.name ?? "Usuario";

    return (
        <div className="flex h-dvh overflow-hidden bg-muted/30">
            {/* Sidebar con altura independiente */}
            <div className="hidden h-full shrink-0 md:block">
                <Sidebar items={items} />
            </div>

            {/* Área principal */}
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                {/* Topbar fijo dentro del layout */}
                <div className="z-10 shrink-0">
                    <Topbar
                        nombre={nombreUsuario}
                        rol={session.user.rol}
                    />
                </div>

                {/* Scroll exclusivo del contenido */}
                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
