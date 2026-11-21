-- Asegurar que el despliegue se ejecute solo una vez mediante Prisma Migrate.
ALTER TABLE "Despacho" ADD COLUMN "salidaInventarioEn" TIMESTAMP(3),
ADD COLUMN "receptor" VARCHAR(120),
ADD COLUMN "entregadoEn" TIMESTAMP(3);

CREATE TABLE "HistorialDespacho" (
 "id" SERIAL NOT NULL,
 "despachoId" INTEGER NOT NULL,
 "usuarioId" INTEGER NOT NULL,
 "estadoAnterior" "EstadoDespacho" NOT NULL,
 "estadoNuevo" "EstadoDespacho" NOT NULL,
 "observacion" VARCHAR(500),
 "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "HistorialDespacho_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HistorialDespacho_despachoId_fecha_idx" ON "HistorialDespacho"("despachoId", "fecha");
ALTER TABLE "HistorialDespacho" ADD CONSTRAINT "HistorialDespacho_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "Despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistorialDespacho" ADD CONSTRAINT "HistorialDespacho_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EvidenciaEntrega" (
 "id" SERIAL NOT NULL,
 "despachoId" INTEGER NOT NULL,
 "contenido" BYTEA NOT NULL,
 "tipoMime" VARCHAR(30) NOT NULL,
 "nombre" VARCHAR(150) NOT NULL,
 "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "EvidenciaEntrega_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EvidenciaEntrega_despachoId_key" ON "EvidenciaEntrega"("despachoId");
ALTER TABLE "EvidenciaEntrega" ADD CONSTRAINT "EvidenciaEntrega_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "Despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
