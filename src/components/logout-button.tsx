
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type Props = {
    compacto?: boolean;
};

export function LogoutButton({ compacto = false }: Props) {
    return (
        <form
            action={async () => {
                "use server";

                await signOut({
                    redirectTo: "/login",
                });
            }}
        >
            <Button
                type="submit"
                variant="ghost"
                size="sm"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className={
                    compacto
                        ? "h-10 gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                        : "w-full justify-start"
                }
            >
                <LogOut className="h-4 w-4" />
                {compacto ? "Salir" : "Cerrar sesión"}
            </Button>
        </form>
    );
}
