-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "etapa",
ADD COLUMN     "cotizacionId" INTEGER,
ADD COLUMN     "estado" "EstadoVenta" NOT NULL DEFAULT 'CONFIRMADA',
ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'PEN',
ADD COLUMN     "oportunidadId" INTEGER;

-- DropEnum
DROP TYPE "EstadoCobranza";

-- DropEnum
DROP TYPE "EtapaVenta";

-- CreateTable
CREATE TABLE "AsignacionLoteVenta" (
    "id" SERIAL NOT NULL,
    "detalleVentaId" INTEGER NOT NULL,
    "loteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsignacionLoteVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AsignacionLoteVenta_loteId_idx" ON "AsignacionLoteVenta"("loteId");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionLoteVenta_detalleVentaId_loteId_key" ON "AsignacionLoteVenta"("detalleVentaId", "loteId");

-- CreateIndex
CREATE INDEX "Cotizacion_clienteId_idx" ON "Cotizacion"("clienteId");

-- CreateIndex
CREATE INDEX "Cotizacion_vendedorId_idx" ON "Cotizacion"("vendedorId");

-- CreateIndex
CREATE INDEX "Cotizacion_oportunidadId_idx" ON "Cotizacion"("oportunidadId");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");

-- CreateIndex
CREATE INDEX "DetalleCotizacion_productoId_idx" ON "DetalleCotizacion"("productoId");

-- CreateIndex
CREATE INDEX "DetalleVenta_ventaId_idx" ON "DetalleVenta"("ventaId");

-- CreateIndex
CREATE INDEX "DetalleVenta_productoId_idx" ON "DetalleVenta"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_cotizacionId_key" ON "Venta"("cotizacionId");

-- CreateIndex
CREATE INDEX "Venta_clienteId_idx" ON "Venta"("clienteId");

-- CreateIndex
CREATE INDEX "Venta_vendedorId_idx" ON "Venta"("vendedorId");

-- CreateIndex
CREATE INDEX "Venta_oportunidadId_idx" ON "Venta"("oportunidadId");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "Venta"("estado");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionLoteVenta" ADD CONSTRAINT "AsignacionLoteVenta_detalleVentaId_fkey" FOREIGN KEY ("detalleVentaId") REFERENCES "DetalleVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionLoteVenta" ADD CONSTRAINT "AsignacionLoteVenta_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
