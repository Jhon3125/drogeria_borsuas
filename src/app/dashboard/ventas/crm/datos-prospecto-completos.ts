/** Datos mínimos requeridos por el flujo de calificación comercial existente. */
export function datosProspectoCompletos(datos: {
  razonSocial: string;
  documento: string | null;
  telefono: string | null;
  correo: string | null;
}): boolean {
  const documento = (datos.documento ?? "").trim();
  const tieneDocumento = /^(?:\d{8}|\d{11})$/.test(documento);
  return (
    datos.razonSocial.trim().length >= 2 &&
    tieneDocumento &&
    Boolean(datos.telefono?.trim() || datos.correo?.trim())
  );
}
