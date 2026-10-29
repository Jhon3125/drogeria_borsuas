-- CreateEnum
CREATE TYPE "EstadoRetencionLote" AS ENUM ('ACTIVA', 'LIBERADA');

-- CreateTable
CREATE TABLE "RetencionLote" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" "EstadoRetencionLote" NOT NULL DEFAULT 'ACTIVA',
    "registradoPorId" INTEGER NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liberadoPorId" INTEGER,
    "fechaLiberacion" TIMESTAMP(3),
    "motivoLiberacion" VARCHAR(500),

    CONSTRAINT "RetencionLote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RetencionLote_loteId_estado_idx" ON "RetencionLote"("loteId", "estado");

-- CreateIndex
CREATE INDEX "RetencionLote_fechaRegistro_idx" ON "RetencionLote"("fechaRegistro");

-- AddForeignKey
ALTER TABLE "RetencionLote" ADD CONSTRAINT "RetencionLote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetencionLote" ADD CONSTRAINT "RetencionLote_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetencionLote" ADD CONSTRAINT "RetencionLote_liberadoPorId_fkey" FOREIGN KEY ("liberadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
