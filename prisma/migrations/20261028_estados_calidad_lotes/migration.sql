-- CreateEnum
CREATE TYPE "EstadoCalidadLote" AS ENUM ('DISPONIBLE', 'CUARENTENA', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "AccionCalidadLote" AS ENUM ('CAMBIO_ESTADO');

-- AlterTable
ALTER TABLE "Lote" ADD COLUMN     "estadoCalidad" "EstadoCalidadLote" NOT NULL DEFAULT 'DISPONIBLE';

-- CreateTable
CREATE TABLE "HistorialCalidadLote" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" "AccionCalidadLote" NOT NULL DEFAULT 'CAMBIO_ESTADO',
    "estadoAnterior" "EstadoCalidadLote" NOT NULL,
    "estadoNuevo" "EstadoCalidadLote" NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialCalidadLote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistorialCalidadLote_loteId_fecha_idx" ON "HistorialCalidadLote"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "HistorialCalidadLote_usuarioId_idx" ON "HistorialCalidadLote"("usuarioId");

-- AddForeignKey
ALTER TABLE "HistorialCalidadLote" ADD CONSTRAINT "HistorialCalidadLote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCalidadLote" ADD CONSTRAINT "HistorialCalidadLote_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
