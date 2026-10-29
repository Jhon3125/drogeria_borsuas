
-- 1. Crear el enum únicamente si no existe.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'EstadoRetencionLote'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE "EstadoRetencionLote"
        AS ENUM ('ACTIVA', 'LIBERADA');
    END IF;
END
$$;

-- 2. Crear la tabla si todavía no existe.
CREATE TABLE IF NOT EXISTS "RetencionLote" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" "EstadoRetencionLote"
        NOT NULL DEFAULT 'ACTIVA',
    "registradoPorId" INTEGER NOT NULL,
    "fechaRegistro" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liberadoPorId" INTEGER,
    "fechaLiberacion" TIMESTAMP(3),
    "motivoLiberacion" VARCHAR(500),

    CONSTRAINT "RetencionLote_pkey"
        PRIMARY KEY ("id")
);

-- 3. Crear índices si no existen.
CREATE INDEX IF NOT EXISTS
    "RetencionLote_loteId_estado_idx"
ON "RetencionLote"("loteId", "estado");

CREATE INDEX IF NOT EXISTS
    "RetencionLote_fechaRegistro_idx"
ON "RetencionLote"("fechaRegistro");

-- 4. Crear las relaciones únicamente si faltan.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'RetencionLote_loteId_fkey'
          AND conrelid = '"RetencionLote"'::regclass
    ) THEN
        ALTER TABLE "RetencionLote"
        ADD CONSTRAINT "RetencionLote_loteId_fkey"
        FOREIGN KEY ("loteId")
        REFERENCES "Lote"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'RetencionLote_registradoPorId_fkey'
          AND conrelid = '"RetencionLote"'::regclass
    ) THEN
        ALTER TABLE "RetencionLote"
        ADD CONSTRAINT "RetencionLote_registradoPorId_fkey"
        FOREIGN KEY ("registradoPorId")
        REFERENCES "Usuario"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'RetencionLote_liberadoPorId_fkey'
          AND conrelid = '"RetencionLote"'::regclass
    ) THEN
        ALTER TABLE "RetencionLote"
        ADD CONSTRAINT "RetencionLote_liberadoPorId_fkey"
        FOREIGN KEY ("liberadoPorId")
        REFERENCES "Usuario"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
