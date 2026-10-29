# T2: pulido de pendientes conocidos

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/t2-pulido` y abre un PR contra la rama base.
- **Antes de empezar:** lee `mobile/AGENTS.md` y `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md` §1 y §3.
- **Reglas de UI:** cero emojis, solo íconos `lucide-react-native` y `gap` en lugar de `space-*`.
- **Un commit por punto.**

## 1. Plantillas de rutina recurrente con montos fijos (`mobile/src/components/driver/DriverHistoryView.tsx`)
- Hoy las plantillas guardan tarifa `'4500'` y ofrecen botones de 3500 a 5000. Eso contradice el aporte con tope: al republicar, el backend rechaza con 422 cualquier aporte mayor al sugerido.
- **Cambio:** la plantilla ya no guarda monto. Al usar una plantilla para publicar, el aporte se calcula con `routesService.getContributionSuggestion`, igual que en `DriverRoutePublishForm`. **Reutiliza la lógica**: extrae un hook `useContributionSuggestion` si hace falta, sin duplicarla.
- Quita los botones fijos de montos de la plantilla.

## 2. Cancelación desde `mobile/src/components/LiveTripIslandWidget.tsx`
- Hoy cancela solo en el estado local (`cancelPassengerBooking` y `cancelDriverTrip` del store) **sin llamar al backend**. El viaje queda activo en el servidor y no se registra la cancelación tardía.
- **Cambio:** llama a `tripLifecycleService.cancelTrip` (o como se llame en `packages/shared/src/api.js`), con el mismo flujo que el resto de la app, y usa el helper `src/utils/cancelTripFeedback.ts` para el aviso y la suspensión. Solo con éxito limpia el estado local. Si falla, muestra el error y no limpia.

## 3. Fecha "Hoy" en UTC (`mobile/src/components/driver/DriverRoutePublishForm.tsx`, l. ≈41)
- `todayStr = () => new Date().toISOString().split('T')[0]` devuelve la fecha UTC: después de las 19:00 en Colombia, "Hoy" pasa a ser mañana.
- **Cambio:** calcula la fecha local en `America/Bogota`, por ejemplo con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })`. Busca con grep otros usos de `toISOString().split('T')[0]` en `mobile/src` y `packages/shared/src`, y corrígelos igual.

## 4. `whereUuid` en route-matching (`services/route-matching-service/routes/api.php`)
- Las rutas con `{id}` (`/routes/{id}`, `/routes/{id}/evaluate-detour` y `/routes/{id}/optimize-passengers`) responden 500 con un id que no es UUID.
- **Cambio:** agrega `->whereUuid('id')` a cada una. Agrega un test PHPUnit (el servicio **no** usa Pest) que verifique que `GET /api/v1/routes/no-es-uuid` responde 404.
- No nombres helpers de test como métodos de `TestCase`.

## 5. Advertencias del React Compiler (`mobile`)
- `npm run lint` da 24 advertencias (`set-state-in-effect` y refs leídas en render).
- **Corrige solo las que se puedan arreglar sin cambiar el comportamiento:** derivar estado en vez de sincronizarlo, usar `useMemo` o mover lógica a handlers.
- Si una corrección no es obviamente segura, **déjala** y documéntala en el PR.
- **Meta:** menos advertencias, 0 errores y ningún cambio funcional.

## Verificación
1. `cd mobile && npm ci && npm run lint`: 0 errores y menos advertencias que las 24 de la base.
2. `npx tsc --noEmit`: sin errores nuevos.
3. `cd services/route-matching-service && composer test`: en verde. Este equipo tiene PostGIS en el contenedor `uniwheels_postgres_gis`; levántalo con `podman start uniwheels_postgres_gis uniwheels_redis` si está detenido.
4. Si existe la CI arreglada (tarea T1), que el PR quede en verde.
5. Si algo falla dos veces por la misma causa, detente y documéntalo.
