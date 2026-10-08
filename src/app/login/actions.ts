"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function iniciarSesion(
    _estadoPrevio: string | undefined,
    formData: FormData
) {
    try {
        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            const code = (error as AuthError & { code?: string }).code;
            if (code === "bloqueado")
                return "Tu cuenta está bloqueada por intentos fallidos. Contacta al administrador.";
            if (code === "inactivo")
                return "Tu cuenta está inactiva. Contacta al administrador.";
            return "Correo o contraseña incorrectos.";
        }
        throw error; // necesario para que funcione la redirección
    }
}