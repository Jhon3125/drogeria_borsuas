import { auth } from "@/auth";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-bold">Bienvenido, {session?.user.name}</h1>
            <p className="text-muted-foreground">
                Selecciona un módulo del menú lateral para comenzar.
            </p>
        </div>
    );
}