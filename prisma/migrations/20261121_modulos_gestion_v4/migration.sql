-- Permitir nuevos intentos de entrega tras una devolución confirmada.
-- Evitar más de un despacho activo simultáneamente por venta.
DROP INDEX IF EXISTS "Despacho_ventaId_key";
CREATE INDEX IF NOT EXISTS "Despacho_ventaId_idx" ON "Despacho"("ventaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Despacho_ventaId_activo_idx" ON "Despacho"("ventaId") WHERE "estado" IN ('PENDIENTE'::"EstadoDespacho", 'EN_RUTA'::"EstadoDespacho");
CREATE TABLE IF NOT EXISTS "ConfiguracionSistema" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "diasAlertaVencimiento" INTEGER NOT NULL DEFAULT 90,
  "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);
