import { z } from "zod";

export const ROLES = [
    "SUPER_ADMIN",
    "ADMIN",
    "COMERCIAL",
    "COMPRAS",
    "ALMACEN",
    "CONDUCTOR",
] as const;

export const ESTADOS = ["ACTIVO", "INACTIVO", "BLOQUEADO"] as const;

const password = z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir una mayúscula")
    .regex(/[0-9]/, "Debe incluir un número");

export const crearUsuarioSchema = z.object({
    nombre: z.string().trim().min(3, "Mínimo 3 caracteres"),
    email: z.string().trim().toLowerCase().email("Correo no válido"),
    password,
    rol: z.enum(ROLES),
});

export const editarUsuarioSchema = z.object({
    nombre: z.string().trim().min(3, "Mínimo 3 caracteres"),
    rol: z.enum(ROLES),
    estado: z.enum(ESTADOS),
    password: z.union([z.literal(""), password]),
});