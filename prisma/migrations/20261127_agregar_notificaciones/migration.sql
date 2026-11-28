
-- Crear enums de notificaciones
CREATE TYPE "CategoriaNotificacion" AS ENUM (
    'INVENTARIO',
    'COMPRAS',
    'VENTAS',
    'LOGISTICA',
    'FINANZAS',
    'SISTEMA'
);

CREATE TYPE "PrioridadNotificacion" AS ENUM (
    'INFO',
    'ADVERTENCIA',
    'CRITICA'
);

-- Crear tabla de notificaciones
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "categoria" "CategoriaNotificacion" NOT NULL,
    "prioridad" "PrioridadNotificacion" NOT NULL DEFAULT 'INFO',
    "titulo" VARCHAR(160) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" VARCHAR(300),
    "claveUnica" VARCHAR(191) NOT NULL,
    "leidaEn" TIMESTAMP(3),
    "resueltaEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- Evitar notificaciones duplicadas por usuario
CREATE UNIQUE INDEX "Notificacion_usuarioId_claveUnica_key"
ON "Notificacion"("usuarioId", "claveUnica");

-- Índices para consultas frecuentes
CREATE INDEX "Notificacion_usuarioId_leidaEn_creadaEn_idx"
ON "Notificacion"("usuarioId", "leidaEn", "creadaEn");

CREATE INDEX "Notificacion_usuarioId_resueltaEn_idx"
ON "Notificacion"("usuarioId", "resueltaEn");

CREATE INDEX "Notificacion_categoria_creadaEn_idx"
ON "Notificacion"("categoria", "creadaEn");

-- Relación con Usuario
ALTER TABLE "Notificacion"
ADD CONSTRAINT "Notificacion_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "Usuario"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
