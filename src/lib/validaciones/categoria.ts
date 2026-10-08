import { z } from "zod";

export const categoriaSchema = z.object({
    nombre: z
        .string()
        .trim()
        .min(3, "Mínimo 3 caracteres")
        .max(60, "Máximo 60 caracteres"),
    descripcion: z.string().trim().max(200, "Máximo 200 caracteres"),
});