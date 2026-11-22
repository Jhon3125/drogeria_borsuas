-- Columnas de trazabilidad de recepción física, sin alterar despachos previos.
ALTER TABLE "Despacho" ADD COLUMN IF NOT EXISTS "devolucionInventarioEn" TIMESTAMP(3);
ALTER TABLE "Despacho" ADD COLUMN IF NOT EXISTS "devolucionMotivo" VARCHAR(500);
-- Prisma crea el valor adicional de enum para identificar movimientos de reintegro.
ALTER TYPE "TipoMovimiento" ADD VALUE IF NOT EXISTS 'ENTRADA_DEVOLUCION';
