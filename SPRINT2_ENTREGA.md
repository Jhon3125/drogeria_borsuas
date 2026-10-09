# Sprint 2 — Proveedores, compras, recepción, lotes y vencimientos

## Flujo principal
1. Crear proveedor activo en `/dashboard/proveedores`.
2. Registrar compra con líneas, lote y vencimiento en `/dashboard/compras`.
3. La compra se guarda **PENDIENTE** sin modificar el stock.
4. Un usuario de Almacén/Admin confirma recepción: transición condicional `PENDIENTE` → `RECIBIDO` y, en una misma transacción SERIALIZABLE, crea/acumula lotes, incrementa `Producto.stockActual` y registra movimientos ENTRADA_COMPRA asociados a responsable.
5. Consultar lotes en `/dashboard/lotes`.

## Permisos
- Proveedores: consulta compras/almacén/admin, edición compras/admin.
- Compras: registro compras/admin; recepción almacén/admin.
- Lotes: consulta compras/almacén/admin.
- Reglas aplicadas en Server Actions y páginas.

## Precauciones
- **No se introdujeron migraciones** porque los modelos ya existían. No ejecutar migraciones contra la BD compartida para probar este ZIP.
- Compra existente con estado histórico COMPLETADO no se recibe automáticamente.
- Inventario Sprint 1 permite ajustes globales. No mezclar ajustes manuales con movimientos de lotes sin una política de conciliación. En particular, no se implementó salida FEFO, edición de recepción, devolución, ni almacenes múltiples.
- Los costos no convierten automáticamente monedas PEN/USD: se interpreta S/ en el listado; si se desea comprar en USD es necesario ampliar el esquema de Compra con moneda/tipo de cambio antes de producción.
- Para despliegue comercial: revisar trazabilidad por compra en cada movimiento, tratamiento de vencidos, FEFO, control de proveedores farmacéuticos y pruebas simultáneas de recepción.
- Probar con base de desarrollo y respaldo, no con Railway producción. El archivo ZIP no contiene variables de entorno.

## Verificación
`npx prisma generate` → `npx tsc --noEmit` → `npm run build`. Ver archivo de resultados y validar manualmente con usuarios de diferentes roles.
