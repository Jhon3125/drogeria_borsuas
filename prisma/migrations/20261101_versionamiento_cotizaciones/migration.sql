-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "cotizacionAnteriorId" INTEGER,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_cotizacionAnteriorId_key" ON "Cotizacion"("cotizacionAnteriorId");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_cotizacionAnteriorId_fkey" FOREIGN KEY ("cotizacionAnteriorId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
