-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "claveOperacion" UUID,
ADD COLUMN     "referencia" VARCHAR(120),
ADD COLUMN     "registradoPorId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Pago_claveOperacion_key" ON "Pago"("claveOperacion");

-- CreateIndex
CREATE INDEX "Pago_registradoPorId_idx" ON "Pago"("registradoPorId");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
