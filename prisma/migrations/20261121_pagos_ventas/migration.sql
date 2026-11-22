-- BORSUAS: migración segura para esquemas donde registradoPorId ya existe.
-- No borra ni modifica pagos históricos.
ALTER TABLE "Pago"
  ADD COLUMN IF NOT EXISTS "claveIdempotencia" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "registradoPorId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Pago_claveIdempotencia_key"
  ON "Pago"("claveIdempotencia");

CREATE INDEX IF NOT EXISTS "Pago_ventaId_fecha_idx"
  ON "Pago"("ventaId", "fecha");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Pago"'::regclass
      AND conname = 'Pago_registradoPorId_fkey'
  ) THEN
    ALTER TABLE "Pago"
      ADD CONSTRAINT "Pago_registradoPorId_fkey"
      FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
