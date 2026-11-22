-- DropForeignKey
ALTER TABLE "Despacho" DROP CONSTRAINT "Despacho_hojaRutaId_fkey";

-- DropIndex
DROP INDEX "Despacho_ventaId_key";

-- AlterTable
ALTER TABLE "Despacho" ADD COLUMN     "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "hojaRutaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DetalleDespacho" (
    "id" SERIAL NOT NULL,
    "despachoId" INTEGER NOT NULL,
    "asignacionLoteVentaId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "DetalleDespacho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DetalleDespacho_asignacionLoteVentaId_idx" ON "DetalleDespacho"("asignacionLoteVentaId");

-- CreateIndex
CREATE UNIQUE INDEX "DetalleDespacho_despachoId_asignacionLoteVentaId_key" ON "DetalleDespacho"("despachoId", "asignacionLoteVentaId");

-- CreateIndex
CREATE INDEX "Despacho_ventaId_idx" ON "Despacho"("ventaId");

-- CreateIndex
CREATE INDEX "Despacho_hojaRutaId_idx" ON "Despacho"("hojaRutaId");

-- CreateIndex
CREATE INDEX "Despacho_estado_idx" ON "Despacho"("estado");

-- AddForeignKey
ALTER TABLE "Despacho" ADD CONSTRAINT "Despacho_hojaRutaId_fkey" FOREIGN KEY ("hojaRutaId") REFERENCES "HojaRuta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleDespacho" ADD CONSTRAINT "DetalleDespacho_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "Despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleDespacho" ADD CONSTRAINT "DetalleDespacho_asignacionLoteVentaId_fkey" FOREIGN KEY ("asignacionLoteVentaId") REFERENCES "AsignacionLoteVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
