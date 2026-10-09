-- Adición no destructiva. No se inventan recepciones para compras históricas.
CREATE TABLE "RecepcionCompra" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "detalleCompraId" INTEGER NOT NULL,
    "loteId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecepcionCompra_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RecepcionCompra_cantidad_check" CHECK ("cantidad" > 0)
);
CREATE INDEX "RecepcionCompra_compraId_idx" ON "RecepcionCompra"("compraId");
CREATE INDEX "RecepcionCompra_detalleCompraId_idx" ON "RecepcionCompra"("detalleCompraId");
CREATE INDEX "RecepcionCompra_loteId_idx" ON "RecepcionCompra"("loteId");
CREATE INDEX "RecepcionCompra_usuarioId_idx" ON "RecepcionCompra"("usuarioId");
ALTER TABLE "RecepcionCompra" ADD CONSTRAINT "RecepcionCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecepcionCompra" ADD CONSTRAINT "RecepcionCompra_detalleCompraId_fkey" FOREIGN KEY ("detalleCompraId") REFERENCES "DetalleCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecepcionCompra" ADD CONSTRAINT "RecepcionCompra_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecepcionCompra" ADD CONSTRAINT "RecepcionCompra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
