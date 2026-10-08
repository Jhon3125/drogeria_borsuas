import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { ETIQUETA_ROL, NAVEGACION } from "@/lib/navegacion";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const items = NAVEGACION.filter((i) => i.roles.includes(session.user.rol)).map(
        ({ titulo, href }) => ({ titulo, href })
    );

    return (
        <div className="flex min-h-screen">
            <aside className="w-60 border-r bg-muted/30">
                <div className="border-b p-4 font-semibold">Droguería Borsuas</div>
                <Sidebar items={items} />
            </aside>

            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b px-6 py-3">
                    <div className="text-sm">
                        <span className="font-medium">{session.user.name}</span>
                        <span className="text-muted-foreground">
                            {" "}
                            · {ETIQUETA_ROL[session.user.rol]}
                        </span>
                    </div>
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}
                    >
                        <Button type="submit" variant="outline" size="sm">
                            Cerrar sesión
                        </Button>
                    </form>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}