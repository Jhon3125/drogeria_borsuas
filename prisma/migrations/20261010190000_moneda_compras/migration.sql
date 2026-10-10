-- Migración aditiva: las compras históricas se mantienen en PEN.
-- No modifica importes, detalles ni existencias existentes.
ALTER TABLE "Compra"
    ADD COLUMN "moneda" "Moneda" NOT NULL DEFAULT 'PEN',
    ADD COLUMN "tipoCambio" DECIMAL(12,6);

-- El tipo de cambio representa soles por 1 dólar (PEN/USD).
-- El tipoCambio de las compras históricas permanece NULL.
