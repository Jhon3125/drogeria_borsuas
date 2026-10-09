"use server";

import { exigirRol } from "@/lib/guard";
import { ROLES_AJUSTE_INVENTARIO } from "@/lib/permisos";

export type EstadoAjuste = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
} | undefined;

/** La acción histórica permanece exportada para clientes anteriores.
 *  No hay ajustes generales permitidos en inventario por lotes.
 */
export async function registrarAjuste(
  _prev: EstadoAjuste,
  _formData: FormData
): Promise<EstadoAjuste> {
  await exigirRol(ROLES_AJUSTE_INVENTARIO);
  return { error: "Los ajustes generales están deshabilitados. Registra una compra y confirma su recepción por lote. Las existencias heredadas requieren conciliación administrativa." };
}
