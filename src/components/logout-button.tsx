import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
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
                className="w-full justify-start"
            >
                Cerrar sesión
            </Button>
        </form>
    );
}