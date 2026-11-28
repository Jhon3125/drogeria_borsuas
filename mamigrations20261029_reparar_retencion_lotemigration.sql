warning: in the working copy of 'prisma/schema.prisma', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/prisma/schema.prisma b/prisma/schema.prisma[m
[1mindex 5d04520..e603c2f 100644[m
[1m--- a/prisma/schema.prisma[m
[1m+++ b/prisma/schema.prisma[m
[36m@@ -135,6 +135,21 @@[m [menum ResultadoActividadComercial {[m
   CALIFICADO[m
 }[m
 [m
[32m+[m[32menum CategoriaNotificacion {[m
[32m+[m[32m  INVENTARIO[m
[32m+[m[32m  COMPRAS[m
[32m+[m[32m  VENTAS[m
[32m+[m[32m  LOGISTICA[m
[32m+[m[32m  FINANZAS[m
[32m+[m[32m  SISTEMA[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32menum PrioridadNotificacion {[m
[32m+[m[32m  INFO[m
[32m+[m[32m  ADVERTENCIA[m
[32m+[m[32m  CRITICA[m
[32m+[m[32m}[m
[32m+[m
 // ==========================================[m
 // M├ôDULO 1: USUARIOS Y ROLES (H0001, H0002)[m
 // ==========================================[m
[36m@@ -169,6 +184,7 @@[m [mmodel Usuario {[m
   actividadesComerciales   ActividadComercial[]   @relation("ResponsableActividadComercial")[m
   cobrosRegistrados        Pago[]                 @relation("ResponsableCobro")[m
   historialDespachos       HistorialDespacho[]    @relation("AutorHistorialDespacho")[m
[32m+[m[32m  notificaciones           Notificacion[][m
 }[m
 [m
 // ==========================================[m
[36m@@ -437,15 +453,15 @@[m [mmodel AsignacionLoteVenta {[m
 }[m
 [m
 model Pago {[m
[31m-  id              Int        @id @default(autoincrement())[m
[31m-  ventaId         Int[m
[31m-  monto           Decimal    @db.Decimal(12, 2)[m
[31m-  fecha           DateTime   @default(now())[m
[31m-  claveOperacion  String?    @unique @db.Uuid[m
[31m-  claveIdempotencia String? @unique @db.VarChar(64)[m
[31m-  referencia      String?    @db.VarChar(120)[m
[31m-  registradoPorId Int?[m
[31m-  metodoPago      MetodoPago[m
[32m+[m[32m  id                Int        @id @default(autoincrement())[m
[32m+[m[32m  ventaId           Int[m
[32m+[m[32m  monto             Decimal    @db.Decimal(12, 2)[m
[32m+[m[32m  fecha             DateTime   @default(now())[m
[32m+[m[32m  claveOperacion    String?    @unique @db.Uuid[m
[32m+[m[32m  claveIdempotencia String?    @unique @db.VarChar(64)[m
[32m+[m[32m  referencia        String?    @db.VarChar(120)[m
[32m+[m[32m  registradoPorId   Int?[m
[32m+[m[32m  metodoPago        MetodoPago[m
 [m
   registradoPor Usuario? @relation("ResponsableCobro", fields: [registradoPorId], references: [id], onDelete: SetNull)[m
   venta         Venta    @relation(fields: [ventaId], references: [id])[m
[36m@@ -627,21 +643,21 @@[m [mmodel HojaRuta {[m
 }[m
 [m
 model Despacho {[m
[31m-  id                 Int            @id @default(autoincrement())[m
[31m-  hojaRutaId         Int?[m
[31m-  ventaId            Int[m
[31m-  estado             EstadoDespacho @default(PENDIENTE)[m
[31m-  observacion        String?[m
[31m-  fechaCreacion      DateTime       @default(now())[m
[31m-  salidaInventarioEn DateTime?[m
[32m+[m[32m  id                     Int            @id @default(autoincrement())[m
[32m+[m[32m  hojaRutaId             Int?[m
[32m+[m[32m  ventaId                Int[m
[32m+[m[32m  estado                 EstadoDespacho @default(PENDIENTE)[m
[32m+[m[32m  observacion            String?[m
[32m+[m[32m  fechaCreacion          DateTime       @default(now())[m
[32m+[m[32m  salidaInventarioEn     DateTime?[m
   devolucionInventarioEn DateTime?[m
[31m-  devolucionMotivo   String?        @db.VarChar(500)[m
[31m-  receptor           String?        @db.VarChar(120)[m
[31m-  entregadoEn        DateTime?[m
[31m-  fechaActualizacion DateTime       @updatedAt[m
[32m+[m[32m  devolucionMotivo       String?        @db.VarChar(500)[m
[32m+[m[32m  receptor               String?        @db.VarChar(120)[m
[32m+[m[32m  entregadoEn            DateTime?[m
[32m+[m[32m  fechaActualizacion     DateTime       @updatedAt[m
 [m
[31m-  hojaRuta HojaRuta?         @relation(fields: [hojaRutaId], references: [id], onDelete: SetNull)[m
[31m-  venta    Venta             @relation(fields: [ventaId], references: [id], onDelete: Restrict)[m
[32m+[m[32m  hojaRuta  HojaRuta?           @relation(fields: [hojaRutaId], references: [id], onDelete: SetNull)[m
[32m+[m[32m  venta     Venta               @relation(fields: [ventaId], references: [id], onDelete: Restrict)[m
   detalles  DetalleDespacho[][m
   historial HistorialDespacho[][m
   evidencia EvidenciaEntrega?[m
[36m@@ -770,7 +786,33 @@[m [mmodel HistorialOrdenPago {[m
 }[m
 [m
 model ConfiguracionSistema {[m
[31m-  id Int @id @default(1)[m
[31m-  diasAlertaVencimiento Int @default(90)[m
[31m-  actualizadoEn DateTime @default(now()) @updatedAt[m
[32m+[m[32m  id                    Int      @id @default(1)[m
[32m+[m[32m  diasAlertaVencimiento Int      @default(90)[m
[32m+[m[32m  actualizadoEn         DateTime @default(now()) @updatedAt[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mmodel Notificacion {[m
[32m+[m[32m  id        Int                   @id @default(autoincrement())[m
[32m+[m[32m  usuarioId Int[m
[32m+[m[32m  categoria CategoriaNotificacion[m
[32m+[m[32m  prioridad PrioridadNotificacion @default(INFO)[m
[32m+[m
[32m+[m[32m  titulo  String  @db.VarChar(160)[m
[32m+[m[32m  mensaje String  @db.Text[m
[32m+[m[32m  enlace  String? @db.VarChar(300)[m
[32m+[m
[32m+[m[32m  // Identificador para evitar notificaciones duplicadas.[m
[32m+[m[32m  claveUnica String @db.VarChar(191)[m
[32m+[m
[32m+[m[32m  leidaEn       DateTime?[m
[32m+[m[32m  resueltaEn    DateTime?[m
[32m+[m[32m  creadaEn      DateTime  @default(now())[m
[32m+[m[32m  actualizadaEn DateTime  @updatedAt[m
[32m+[m
[32m+[m[32m  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)[m
[32m+[m
[32m+[m[32m  @@unique([usuarioId, claveUnica])[m
[32m+[m[32m  @@index([usuarioId, leidaEn, creadaEn])[m
[32m+[m[32m  @@index([usuarioId, resueltaEn])[m
[32m+[m[32m  @@index([categoria, creadaEn])[m
 }[m
