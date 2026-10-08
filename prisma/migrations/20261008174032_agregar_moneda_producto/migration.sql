-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('PEN', 'USD');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'PEN';
