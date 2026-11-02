-- CreateEnum
CREATE TYPE "EstadoRelacionComercial" AS ENUM ('PROSPECTO', 'CALIFICADO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "TipoActividadComercial" AS ENUM ('LLAMADA', 'WHATSAPP', 'CORREO', 'VISITA', 'OTRO', 'CALIFICACION');

-- CreateEnum
CREATE TYPE "ResultadoActividadComercial" AS ENUM ('CONTACTO_EFECTIVO', 'SIN_RESPUESTA', 'REPROGRAMADO', 'SIN_INTERES', 'CALIFICADO');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "estadoRelacionComercial" "EstadoRelacionComercial" NOT NULL DEFAULT 'PROSPECTO',
ADD COLUMN     "fechaCalificacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActividadComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoActividadComercial" NOT NULL,
    "resultado" "ResultadoActividadComercial" NOT NULL,
    "personaContacto" VARCHAR(120),
    "observaciones" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActividadComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActividadComercial_oportunidadId_fecha_idx" ON "ActividadComercial"("oportunidadId", "fecha");

-- CreateIndex
CREATE INDEX "ActividadComercial_usuarioId_idx" ON "ActividadComercial"("usuarioId");

-- AddForeignKey
ALTER TABLE "ActividadComercial" ADD CONSTRAINT "ActividadComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadComercial" ADD CONSTRAINT "ActividadComercial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
