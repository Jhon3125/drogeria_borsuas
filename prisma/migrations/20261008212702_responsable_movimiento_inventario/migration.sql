-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "usuarioId" INTEGER;

-- CreateIndex
CREATE INDEX "MovimientoInventario_usuarioId_idx" ON "MovimientoInventario"("usuarioId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_fecha_idx" ON "MovimientoInventario"("fecha");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
