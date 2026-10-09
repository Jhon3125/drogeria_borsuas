# Sprint 2 — Fase 2.2: inventario operativo respaldado por compras y lotes

## Cambios
- Inventario `/dashboard/inventario` lista solo productos con lotes que coinciden en producto, número de lote y fecha de vencimiento con detalles de **compras RECIBIDO**.
- `Stock en lotes` y tarjetas de métricas salen de lotes verificados (no del campo histórico `Producto.stockActual`). Se incluyen lotes con cantidad cero para mostrar agotados cuando la procedencia existe.
- Para evitar cifras no justificables, los lotes con cantidades negativas, cantidad disponible superior a inicial, o inicial superior a total recibido quedan fuera de la vista operativa.
- `/dashboard/inventario/producto/[id]` muestra número de lote, vencimiento, stock, compra y proveedor.
- `/dashboard/lotes` usa exactamente el mismo criterio de procedencia.
- Los ajustes generales no están disponibles ni desde UI ni desde la Server Action histórica. Se conservan registros anteriores para conciliación; NO se eliminan datos.
- El dashboard recibe los íconos del Sprint 2 que faltaban.

## Límites importantes
- `Lote` no dispone de FK directa a `DetalleCompra` en el esquema actual. El vínculo se infiere por (productoId, numeroLote, fechaVencimiento) + estado RECIBIDO. Es una aproximación para la visualización, no auditoría inalterable. En una siguiente migración se necesita una relación explícita / recepción identificada.
- El campo `stockActual` NO se reescribe automáticamente. Las diferencias se muestran en `/dashboard/inventario/conciliacion`.
- No se implementaron ajustes por lote, salidas FEFO, devoluciones o recepción parcial.
- Ejecutar verificaciones localmente: `npm ci`, `npx prisma generate`, `npx tsc --noEmit`, `npm run build`; probar con una base de DESARROLLO. No ejecutar migraciones sobre Railway compartido.

## Pruebas funcionales sugeridas
1. Producto de catálogo sin compras: no debe aparecer en Inventario.
2. Compra PENDIENTE: no debe hacer visible el lote ni aumentar las métricas.
3. Compra RECIBIDO: el producto y el lote deben aparecer con el total recibido.
4. Un lote que no tenga coincidencia exacta de producto, número y vencimiento debe quedar fuera de la vista operativa y permanecer en Conciliación.
5. El botón de ajuste general debe desaparecer y la acción antigua debe rechazar solicitudes.
6. Un lote respaldado con disponibilidad 0 debe aparecer como agotado.
7. Roles sin permiso deben seguir sin acceder al Inventario.

Revisar conciliación antes de operar con stock real. No se han borrado ni modificado registros en PostgreSQL.
