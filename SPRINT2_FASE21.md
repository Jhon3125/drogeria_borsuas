# Sprint 2 — Fase 2.1: conciliación de compras e inventario

## Cambios realizados
- Nueva ruta `/dashboard/inventario/conciliacion`: compara stock general y suma de lotes por producto, solo lectura, protegida por los roles de lectura de inventario.
- Diferencia visible cuando un producto con lotes tiene saldos distintos.
- Stock heredado sin lotes visible por separado; no se crea un lote ficticio.
- Ajuste manual sin lote bloqueado **en servidor** para productos con lotes (incluidos los de saldo cero), y ocultado en la interfaz. Evita empeorar la diferencia entre el stock general y los lotes.
- Enlaces a la conciliación desde Compras e Inventario.
- Se conserva la recepción existente, que incrementa lotes, stock general y movimiento en una transacción. No se agregó migración.

## Restricciones deliberadas
- Recepción parcial NO implementada: el esquema actual Compra/DetalleCompra no guarda cantidades recibidas por renglón ni estados parciales. Necesita una migración diseñada y probada en una base de desarrollo.
- Ajustes por lote NO implementados: requieren selección de lote, validación de vencimiento y transacciones con auditoría. Para evitar incoherencias se impide el ajuste general de productos con lotes.
- Lote de apertura o conciliación física NO creado automáticamente: un stock antiguo sin lotes se reporta para conciliación manual autorizada.
- Stock anterior/posterior y referencia estructurada a compra NO implementados: necesitan campos y migración; por ahora el motivo de movimiento contiene `Recepción de compra #...`.

## Validación local
1. `npm install`, `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
2. En entorno de prueba, registra compra pendiente y comprueba stock invariable.
3. Confirma recepción y comprueba stock, lote y movimiento sincronizados.
4. Verifica la vista de conciliación y su permiso de consulta.
5. Comprueba que los productos con lotes no admiten ajustes sin lote ni por interfaz ni invocando la Server Action.
6. Revisa diferencias heredadas; no ejecutes scripts de ajuste automático en producción.

No usar `db push`, `migrate reset` ni `migrate dev` contra la instancia compartida de Railway.
