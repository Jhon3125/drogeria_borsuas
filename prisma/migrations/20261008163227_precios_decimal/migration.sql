/*
  Warnings:

  - You are about to alter the column `importeTotal` on the `Compra` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `precioUnitario` on the `DetalleCompra` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `precioUnitario` on the `DetalleVenta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `descuento` on the `DetalleVenta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `monto` on the `Gasto` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `monto` on the `Pago` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `precioCompra` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `precioVenta` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `subtotal` on the `Venta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `descuento` on the `Venta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `importeTotal` on the `Venta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `saldoPendiente` on the `Venta` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "Compra" ALTER COLUMN "importeTotal" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "DetalleCompra" ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "DetalleVenta" ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "descuento" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Gasto" ALTER COLUMN "monto" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Pago" ALTER COLUMN "monto" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "precioCompra" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "precioVenta" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Venta" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "descuento" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "importeTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "saldoPendiente" SET DATA TYPE DECIMAL(12,2);
