/*
  Warnings:

  - You are about to drop the column `descripción` on the `Categoria` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "descripción",
ADD COLUMN     "descripcion" TEXT;
