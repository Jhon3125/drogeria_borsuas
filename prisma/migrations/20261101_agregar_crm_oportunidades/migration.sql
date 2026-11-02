-- CreateEnum
CREATE TYPE "EtapaOportunidad" AS ENUM ('PROSPECTO', 'CONTACTADO', 'COTIZACION', 'NEGOCIACION', 'GANADA', 'PERDIDA');

-- CreateTable
CREATE TABLE "OportunidadComercial" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(180) NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "vendedorId" INTEGER NOT NULL,
    "etapa" "EtapaOportunidad" NOT NULL DEFAULT 'PROSPECTO',
    "montoEstimado" DECIMAL(12,2),
    "moneda" "Moneda" NOT NULL DEFAULT 'PEN',
    "descripcion" TEXT,
    "proximaActividad" VARCHAR(300),
    "fechaSeguimiento" TIMESTAMP(3),
    "motivoPerdida" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),

    CONSTRAINT "OportunidadComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialOportunidad" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "etapaAnterior" "EtapaOportunidad",
    "etapaNueva" "EtapaOportunidad" NOT NULL,
    "comentario" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialOportunidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OportunidadComercial_clienteId_idx" ON "OportunidadComercial"("clienteId");

-- CreateIndex
CREATE INDEX "OportunidadComercial_vendedorId_idx" ON "OportunidadComercial"("vendedorId");

-- CreateIndex
CREATE INDEX "OportunidadComercial_etapa_idx" ON "OportunidadComercial"("etapa");

-- CreateIndex
CREATE INDEX "OportunidadComercial_fechaSeguimiento_idx" ON "OportunidadComercial"("fechaSeguimiento");

-- CreateIndex
CREATE INDEX "OportunidadComercial_fechaCreacion_idx" ON "OportunidadComercial"("fechaCreacion");

-- CreateIndex
CREATE INDEX "HistorialOportunidad_oportunidadId_fechaCambio_idx" ON "HistorialOportunidad"("oportunidadId", "fechaCambio");

-- CreateIndex
CREATE INDEX "HistorialOportunidad_usuarioId_idx" ON "HistorialOportunidad"("usuarioId");

-- AddForeignKey
ALTER TABLE "OportunidadComercial" ADD CONSTRAINT "OportunidadComercial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadComercial" ADD CONSTRAINT "OportunidadComercial_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialOportunidad" ADD CONSTRAINT "HistorialOportunidad_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialOportunidad" ADD CONSTRAINT "HistorialOportunidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

