-- CreateEnum
CREATE TYPE "EstadoOrdenPago" AS ENUM ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'PAGO_PARCIAL', 'PAGADA');

-- CreateEnum
CREATE TYPE "MetodoDesembolso" AS ENUM ('TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'OTRO');

-- CreateEnum
CREATE TYPE "AccionHistorialOrdenPago" AS ENUM ('CREACION', 'APROBACION', 'RECHAZO', 'REGISTRO_DESEMBOLSO');

-- CreateTable
CREATE TABLE "OrdenPago" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "autorizadorId" INTEGER,
    "estado" "EstadoOrdenPago" NOT NULL DEFAULT 'SOLICITADA',
    "montoSolicitado" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "numeroFactura" VARCHAR(100),
    "observaciones" TEXT,
    "motivoRechazo" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAutorizacion" TIMESTAMP(3),
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesembolsoPago" (
    "id" SERIAL NOT NULL,
    "ordenPagoId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" "MetodoDesembolso" NOT NULL,
    "referencia" VARCHAR(150),
    "observaciones" TEXT,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesembolsoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialOrdenPago" (
    "id" SERIAL NOT NULL,
    "ordenPagoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" "AccionHistorialOrdenPago" NOT NULL,
    "estadoAnterior" "EstadoOrdenPago",
    "estadoNuevo" "EstadoOrdenPago" NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialOrdenPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdenPago_compraId_idx" ON "OrdenPago"("compraId");

-- CreateIndex
CREATE INDEX "OrdenPago_estado_idx" ON "OrdenPago"("estado");

-- CreateIndex
CREATE INDEX "OrdenPago_fechaSolicitud_idx" ON "OrdenPago"("fechaSolicitud");

-- CreateIndex
CREATE INDEX "OrdenPago_solicitanteId_idx" ON "OrdenPago"("solicitanteId");

-- CreateIndex
CREATE INDEX "OrdenPago_autorizadorId_idx" ON "OrdenPago"("autorizadorId");

-- CreateIndex
CREATE INDEX "DesembolsoPago_ordenPagoId_idx" ON "DesembolsoPago"("ordenPagoId");

-- CreateIndex
CREATE INDEX "DesembolsoPago_responsableId_idx" ON "DesembolsoPago"("responsableId");

-- CreateIndex
CREATE INDEX "DesembolsoPago_fechaPago_idx" ON "DesembolsoPago"("fechaPago");

-- CreateIndex
CREATE INDEX "HistorialOrdenPago_ordenPagoId_fecha_idx" ON "HistorialOrdenPago"("ordenPagoId", "fecha");

-- CreateIndex
CREATE INDEX "HistorialOrdenPago_usuarioId_idx" ON "HistorialOrdenPago"("usuarioId");

-- AddForeignKey
ALTER TABLE "OrdenPago" ADD CONSTRAINT "OrdenPago_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenPago" ADD CONSTRAINT "OrdenPago_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenPago" ADD CONSTRAINT "OrdenPago_autorizadorId_fkey" FOREIGN KEY ("autorizadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesembolsoPago" ADD CONSTRAINT "DesembolsoPago_ordenPagoId_fkey" FOREIGN KEY ("ordenPagoId") REFERENCES "OrdenPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesembolsoPago" ADD CONSTRAINT "DesembolsoPago_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialOrdenPago" ADD CONSTRAINT "HistorialOrdenPago_ordenPagoId_fkey" FOREIGN KEY ("ordenPagoId") REFERENCES "OrdenPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialOrdenPago" ADD CONSTRAINT "HistorialOrdenPago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
