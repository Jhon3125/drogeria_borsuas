import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <main className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>
                Bienvenido, <strong>{session?.user.name}</strong> — Rol:{" "}
                <strong>{session?.user.rol}</strong>
            </p>
            <form
                action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                }}
            >
                <Button type="submit" variant="outline">
                    Cerrar sesión
                </Button>
            </form>
        </main>
    );
}