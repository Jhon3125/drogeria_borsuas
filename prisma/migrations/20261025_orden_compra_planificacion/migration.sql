
-- Planificación de Órdenes de Compra
-- Mantiene los registros históricos.

ALTER TABLE "Compra"
    ADD COLUMN "fechaEntregaEstimada" TIMESTAMP(3),
    ADD COLUMN "observaciones" TEXT;

-- Las órdenes nuevas no necesitan conocer
-- el lote ni el vencimiento antes de recibir.
-- Los valores históricos se conservan.

ALTER TABLE "DetalleCompra"
    ALTER COLUMN "numeroLote" DROP NOT NULL,
    ALTER COLUMN "fechaVencimiento" DROP NOT NULL;
