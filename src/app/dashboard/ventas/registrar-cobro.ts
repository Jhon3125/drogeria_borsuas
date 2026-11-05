
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

export type EstadoRegistroCobro =
  | { ok?: string; error?: string }
  | undefined;

const cobroSchema = z.object({
  ventaId: z.coerce.number().int().positive(),
  claveOperacion: z.string().uuid(),
  monto: z
    .string()
    .trim()
    .regex(
      /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
      "Ingresa un importe válido con hasta dos decimales."
    ),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]),
  referencia: z.string().trim().max(120).optional(),
});

function aCentavos(valor: string): bigint {
  const [entero, decimal = ""] = valor.split(".");

  return (
    BigInt(entero) * BigInt(100) +
    BigInt(decimal.padEnd(2, "0"))
  );
}

export async function registrarCobroVenta(
  _prev: EstadoRegistroCobro,
  form: FormData
): Promise<EstadoRegistroCobro> {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN"]);

  const parsed = cobroSchema.safeParse({
    ventaId: form.get("ventaId"),
    claveOperacion: form.get("claveOperacion"),
    monto: form.get("monto"),
    metodoPago: form.get("metodoPago"),
    referencia: String(form.get("referencia") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const x = parsed.data;
  const centavos = aCentavos(x.monto);

  if (centavos <= BigInt(0)) {
    return { error: "El cobro debe ser mayor que cero." };
  }

  if (x.metodoPago !== "EFECTIVO" && !x.referencia) {
    return {
      error:
        "Indica el número de operación o referencia para este método de pago.",
    };
  }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        // La clave se verifica dentro de la transacción;
        // el índice UNIQUE protege los reintentos simultáneos.
        const existente = await tx.pago.findUnique({
          where: {
            claveOperacion: x.claveOperacion,
          },
          select: {
            id: true,
            ventaId: true,
          },
        });

        if (existente) {
          if (existente.ventaId !== x.ventaId) {
            throw new Error("La operación pertenece a otra venta.");
          }

          return "Este cobro ya estaba registrado. No se duplicó.";
        }

        const venta = await tx.venta.findUnique({
          where: {
            id: x.ventaId,
          },
          select: {
            id: true,
            estado: true,
            importeTotal: true,
            pagos: {
              select: {
                monto: true,
              },
            },
          },
        });

        if (!venta) {
          throw new Error("Venta no encontrada.");
        }

        if (venta.estado === "ANULADA") {
          throw new Error("No se puede cobrar una venta anulada.");
        }

        const total = BigInt(
          venta.importeTotal
            .mul(100)
            .toDecimalPlaces(0)
            .toString()
        );

        const cobrado = venta.pagos.reduce(
          (s, pago) =>
            s +
            BigInt(
              pago.monto
                .mul(100)
                .toDecimalPlaces(0)
                .toString()
            ),
          BigInt(0)
        );

        const saldo = total - cobrado;

        if (saldo <= BigInt(0)) {
          throw new Error("La venta ya está totalmente pagada.");
        }

        if (centavos > saldo) {
          throw new Error(
            "El cobro supera el saldo pendiente de la venta."
          );
        }

        const nuevoSaldo = new Prisma.Decimal(
          (saldo - centavos).toString()
        ).div(100);

        await tx.pago.create({
          data: {
            ventaId: x.ventaId,
            monto: new Prisma.Decimal(x.monto),
            metodoPago: x.metodoPago,
            claveOperacion: x.claveOperacion,
            referencia: x.referencia || null,
            registradoPorId: Number(usuario.id),
          },
        });

        await tx.venta.update({
          where: {
            id: x.ventaId,
          },
          data: {
            saldoPendiente: nuevoSaldo,
            metodoPago: x.metodoPago,
          },
        });

        return "Cobro registrado correctamente.";
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    revalidatePath(`/dashboard/ventas/${x.ventaId}`);
    revalidatePath("/dashboard/ventas");
    revalidatePath("/dashboard/caja");

    return { ok: resultado };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          ok: "Este cobro ya fue registrado. Actualiza la vista.",
        };
      }

      if (error.code === "P2034") {
        return {
          error:
            "Otro cobro actualizó el saldo. Actualiza la página y vuelve a intentarlo.",
        };
      }
    }

    const msg = error instanceof Error ? error.message : "";

    const errores = [
      "La operación pertenece a otra venta.",
      "Venta no encontrada.",
      "No se puede cobrar una venta anulada.",
      "La venta ya está totalmente pagada.",
      "El cobro supera el saldo pendiente de la venta.",
    ];

    return {
      error: errores.includes(msg)
        ? msg
        : "No se pudo registrar el cobro.",
    };
  }
}
