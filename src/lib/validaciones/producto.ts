import { z } from "zod";

export const UNIDADES_MEDIDA = [
    "Unidad", "Caja", "Blíster", "Frasco", "Tableta",
    "Ampolla", "Sobre", "Tubo", "Litro", "Kilogramo"
] as const;

const dineroRegEx = /^\d+(\.\d{1,2})?$/;

export const productoSchema = z.object({
    codigo: z.string()
        .min(3, "El código debe tener al menos 3 caracteres")
        .max(20, "Máximo 20 caracteres")
        .regex(/^[a-zA-Z0-9-_]+$/, "Solo letras, números, guiones y guiones bajos")
        .transform((val) => val.toUpperCase()),
    nombre: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(120, "Máximo 120 caracteres"),
    descripcion: z.string()
        .max(300, "Máximo 300 caracteres")
        .optional()
        .nullable(),
    categoriaId: z.coerce.number().min(1, "Debes seleccionar una categoría"),
    unidadMedida: z.enum(UNIDADES_MEDIDA, { error: "Selecciona una unidad de medida válida" }),
    moneda: z.enum(["PEN", "USD"], { error: "Selecciona una moneda válida" }),
    precioCompra: z.string()
        .regex(dineroRegEx, "Debe ser un número válido (ej. 15.50)")
        .refine((val) => Number(val) >= 0, "No puede ser negativo")
        .refine((val) => Number(val) < 10000000, "El monto es demasiado alto"),
    precioVenta: z.string()
        .regex(dineroRegEx, "Debe ser un número válido (ej. 15.50)")
        .refine((val) => Number(val) >= 0, "No puede ser negativo")
        .refine((val) => Number(val) < 10000000, "El monto es demasiado alto"),
    stockMinimo: z.coerce.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;