# Droguería Borsuas — Sprint 1 (entrega de integración)

## Alcance tomado del resumen del Curso Integrador II

- H0001: inicio de sesión, gestión de sesiones y protección de rutas (NextAuth, `src/auth.ts`, `src/lib/guard.ts`).
- H0002: usuarios, roles, estado, búsqueda y filtros (`src/app/dashboard/usuarios/`).
- H0003: productos, categorías, SKU, precios, moneda y unidad (`src/app/dashboard/productos/`, `categorias/`).
- H0005: consulta de stock, ajustes positivos y negativos, historial y responsable (`src/app/dashboard/inventario/`).
- Diseño base: sidebar, topbar, tarjetas de indicadores, tema corporativo.

## Cambios aplicados en esta entrega

1. Productos: ambos precios de alta y edición se convierten explícitamente de string validado a `Prisma.Decimal`, compatible con `@db.Decimal(12,2)`, en lugar de depender de conversión implícita.
2. Productos: no se aceptan valores de moneda o unidad de medida arbitrarios que Zod antes sustituía silenciosamente con valores predeterminados.
3. Se incluye esta lista de verificación para completar pruebas con los seis roles.

## Comprobaciones locales antes de unir a dev

Trabajar sobre una rama propia. No ejecutar migraciones sobre Railway compartido.

```powershell
npm ci
npx prisma generate
npx tsc --noEmit
npm run build
npm run dev
```

Si `prisma generate` requiere variables, configurar una `.env.local` en el equipo usando credenciales **no compartidas**. No adjuntarlas ni versionarlas.

## Pruebas funcionales manuales pendientes (base de desarrollo)

- [ ] SUPER_ADMIN puede entrar; credenciales incorrectas no permiten ingreso; bloqueo al quinto intento.
- [ ] ADMIN, COMPRAS, COMERCIAL, ALMACEN, CONDUCTOR ven únicamente sus módulos y operaciones autorizados.
- [ ] SUPER_ADMIN crea y edita usuarios, asigna roles, cambia estados; no puede desactivarse a sí mismo.
- [ ] Productos: alta, modificación, SKU duplicado, categorías, moneda PEN/USD y precios con 2 decimales.
- [ ] COMERCIAL puede ver productos sin recibir `precioCompra` desde el servidor.
- [ ] Categorías: alta, edición, duplicados con distinto uso de mayúsculas; impedir eliminar categorías utilizadas.
- [ ] Inventario: stock inicial, ajuste positivo/negativo y prohibición de saldo negativo.
- [ ] Inventario: dos salidas simultáneas que excedan el saldo deben dejar solo una confirmada.
- [ ] Historial: registro de motivo, fecha, producto y responsable de la sesión.
- [ ] Dashboard: conteos reales, sin indicadores inventados de futuros módulos.
- [ ] Navegación móvil y de escritorio, diálogos, tablas, estados vacíos y filtros.

## Fuera del Sprint 1

Proveedores, compras, recepción, lotes/vencimientos, ventas, CRM, caja, logística, IA. No se implementan aquí y no deben crearse datos ficticios para aparentar su funcionamiento.

## Riesgos / próximos incrementos

- `Producto.stockActual` es el saldo provisional hasta definir recepción por lotes; evitar doble contabilización al integrar compras.
- La auditoría registra usuarioId pero aún no congela nombre/rol ni stock anterior/posterior.
- Para tablas de gran tamaño se requerirá paginación en servidor.
- Rotar las credenciales de Railway y de autenticación previamente expuestas; ningún `.env` se incluye en esta entrega.
