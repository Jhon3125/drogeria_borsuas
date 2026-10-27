-- AlterTable
ALTER TABLE "DesembolsoPago" ADD COLUMN     "claveIdempotencia" VARCHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "DesembolsoPago_claveIdempotencia_key" ON "DesembolsoPago"("claveIdempotencia");
