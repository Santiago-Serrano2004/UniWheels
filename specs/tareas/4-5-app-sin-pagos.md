# Fases 4 y 5: paquete compartido y app móvil sin pagos

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/4-5-app-sin-pagos` y abre **un solo PR** contra la rama base.
- **Antes de empezar, lee:**
  - `mobile/AGENTS.md`: Expo SDK 57 está fijado a propósito. Ahí están los problemas conocidos de NativeWind, como que `space-x`/`space-y` no funcionan en nativo (usa `gap`) y cómo usar Modal con `useSafeAreaInsets`.
  - `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`, §1 y §3.
- **Alcance:** `packages/shared/` y `mobile/`. **No toques** `frontend/` (está congelado), ni `admin/`, `landing/` o los servicios.
- **Reglas de UI** (skill `frontend-design-ux-ui` del repo):
  - **cero emojis**;
  - solo íconos de `lucide-react-native`;
  - textos en español neutro (tú);
  - **sin** etiquetas de marketing.

## Contrato del backend (ya mergeado, es la fuente de verdad)
- **`GET /routes/contribution-suggestion?vehicle_id&origin_lat&origin_lng&destination_lat&destination_lng`** (route-matching, con JWT):
  - responde `data { distance_km, vehicle_type, suggested_contribution_cop, max_contribution_cop }`;
  - responde 503 si no se pudo validar el vehículo.
- **`POST /routes`** (route-matching). `PublishRouteRequest` exige:
  - `vehicle_id`;
  - `origin_name`, `origin_lat`, `origin_lng`;
  - `destination_campus_id`, `destination_campus_name`, `destination_lat`, `destination_lng`;
  - `scheduled_departure_time` (ISO);
  - `target_arrival_time` (ISO, posterior a la salida);
  - `available_seats` (1–6);
  - `base_contribution_cop` (entero ≥ 0 y ≤ al sugerido; si lo supera, el backend responde **422** con `errors.base_contribution_cop[0]` y `data.max_contribution_cop`);
  - opcionales: `max_detour_minutes` y `coordinates`.
- **`POST /trips`** (trip-service): `total_fare_cop` debe ser **igual** al `base_contribution_cop` de la ruta. **Ya no existe `payment_method`.**
- **Cancelación** (`cancelTrip`): `data` trae `late_cancellation` (bool), `warning` (string o null) y, si fue tardía, también `late_cancellations_30d`, `suspended` y `suspended_until` (ISO o null). **Ya no existen** `penalized` ni `penalty_fee_cop`.
- **Usuario suspendido:** auth responde **403** con `message` ("Tu cuenta está suspendida hasta el dd/mm/aaaa.") y `suspended_until`, tanto en login como en cualquier request autenticado.
- **Ya no existen:**
  - `/wallet/*`, `/trips/{id}/payment/card/init`, `/payments/*`;
  - `user.wallet` en `/auth/me`;
  - `earnings_cop`, `platform_commission_cop`, `payment_method` y `payment_confirmed_at` en el historial.

---

## Fase 4: `packages/shared`

1. **`src/api.js`:**
   - Elimina `walletService` (l. ≈647), `getWalletTransactions` (≈524) e `initCardPayment` (≈758).
   - Agrega `routesService.getContributionSuggestion({ vehicleId, originLat, originLng, destinationLat, destinationLng })`, que llama a `GET /routes/contribution-suggestion` y retorna `data`. Los errores se manejan como en `publishRoute`: lanza `error.response.data`.
   - `publishRoute` no cambia de firma: el payload correcto lo arma la app (ver 5.4).
2. **`src/index.js`:** quita el export de `walletService` y exporta lo nuevo, si hace falta.
3. **`src/store/useAppStore.js`:**
   - Elimina `driverWalletBalance`, `passengerWalletBalance`, `setDriverWalletBalance`, `rechargeDriverWallet`, `pendingOpenPaymentManagerModal`, `setPendingOpenPaymentManagerModal` y `openPaymentSettings`.
   - Quita `'wallet'` del comentario de pestañas y la mención a la billetera en el docblock.
   - En la acción que limpia el viaje del conductor al cancelar (≈ l. 290–297), quita el cálculo de penalización y saldo: solo limpia `activeDriverTrip` y `currentRoutePassengerTrips`. Ajusta su firma y sus llamadas.
   - El `fare_cop: datosTrayecto.fare_cop || 4500` (≈282) pasa a `datosTrayecto.fare_cop ?? 0`. **No inventes tarifas por defecto.**

## Fase 5: `mobile/`

### 5.1 Eliminar (archivos completos)
- `src/app/(tabs)/wallet.tsx` (y su `Tabs.Screen` en `src/app/(tabs)/_layout.tsx`)
- `src/components/WompiWidgetModal.tsx`
- `src/components/PaymentMethodSelectorModal.tsx`
- `src/components/PaymentMethodsManagerModal.tsx`
- `src/components/driver/TripSettlementModal.tsx`

Antes de borrar, busca con grep dónde se importa cada uno y quita esos usos.
- Donde se abría `TripSettlementModal` (al completar el viaje), **no** pongas otro modal: muestra la confirmación con el mecanismo de aviso que ya usa la pantalla (toast o alert existente) con el texto `"Viaje completado."`.
- Donde se abría `PaymentMethodSelectorModal` antes de reservar, la reserva se confirma directo (ver 5.5).

### 5.2 Quitar saldo, pagos y ganancias
Revisa y limpia, con grep `wallet|Wallet|saldo|billetera|recarga|payment|Payment|comisi|earnings|penalt|Wompi`:
- `src/app/(tabs)/index.tsx`, `map.tsx`, `profile.tsx`, `history.tsx`
- `src/app/login.tsx`, `src/app/register.tsx` (por ejemplo, la sincronización del saldo desde `user.wallet`)
- `src/components/AppHeader.tsx` (saldo en el header)
- `src/components/common/DriverApprovedCelebrationModal.tsx`: cambia el texto "Recibe los aportes… en tu saldo" por `"Tus pasajeros te dan su aporte directamente, en efectivo o Nequi."`
- `src/components/driver/DriverCockpitCard.tsx`: elimina el fallback `|| 4500`. Muestra el aporte real o, si es 0, `"Gratis"`.
- `src/components/driver/DriverHistoryView.tsx`:
  - quita `driverEarnings` (y el cálculo `× 0.88`) y `earnings_cop`;
  - el historial muestra "Aportes recibidos" = suma de `fare_cop`;
  - aclara que se pagan por fuera de la app.
- `src/components/map/LeafletMap.tsx`: revisa la coincidencia del grep y límpiala si es de pagos.
- En `profile.tsx`, quita la entrada de "Métodos de pago".

### 5.3 Cancelación sin multa (`CancelTripPenaltyModal` y sus usos)
- `src/components/driver/CancelTripPenaltyModal.tsx`:
  - quita toda mención a dinero ($3.000, billetera, multa);
  - el aviso previo dice: `"Si cancelas con pasajeros confirmados a menos de 15 minutos de la salida, se registra una cancelación tardía. Con 3 en 30 días tu cuenta se suspende por 30 días."`.
  - Mantén el nombre del archivo, para no tocar más imports de los necesarios.
- Donde se procesa la respuesta de `cancelTrip` (conductor y pasajero): lee `late_cancellation`, `warning`, `suspended` y `suspended_until`.
  - Si `warning` existe, muéstralo tal cual lo manda el backend.
  - Si `suspended` es true, después del aviso **cierra la sesión** con el logout existente y lleva al login. El backend ya bloquea todo lo demás.
- Quita cualquier lectura de `penalized` o `penalty_fee_cop`.

### 5.4 Publicar ruta con aporte sugerido (`DriverRoutePublishForm.tsx`)
**Bug actual (corregir):** el payload no coincide con `PublishRouteRequest`: manda `fare_cop`, `origin_coords`, `campus_id`, etc. Además, el `catch` del backend solo hace `console.warn` y **se crea igual una ruta local falsa**.

1. **Vehículo:** obtén el vehículo aprobado del conductor con `vehicleService.checkApprovedVehicle` (como ya se hace en otras partes de la app; búscalo con grep). Sin vehículo aprobado no se puede publicar: muestra `"Necesitas un vehículo aprobado para publicar rutas."`.
2. **Coordenadas de las sedes:**
   - Usa las sedes de la API (`institutions` → `campuses[].latitude/longitude`, ya expuestas por auth-service), **no** las coordenadas fijas `[7.1193, -73.1042]` y `[7.0682, -73.1065]` del código actual.
   - `INSTITUCIONES_PREDETERMINADAS` no trae coordenadas. Si la sede elegida no las tiene, deshabilita "Publicar" con un aviso.
3. **Aporte sugerido:**
   - Cuando haya vehículo, origen y destino, llama a `getContributionSuggestion` (con debounce de 400 ms al cambiar puntos).
   - Mientras carga, muestra un indicador; si responde 503, muestra un aviso con reintento.
   - Reemplaza los botones fijos `[3500, 4000, 4500, 5000]` por:
     - el texto `"Aporte sugerido: $ X por cupo (máximo)"`, más `"Distancia: N km"`;
     - un campo numérico editable, con valor inicial = sugerido y limitado a 0..sugerido. Si el usuario escribe más, se ajusta al máximo y se muestra `"El máximo para esta ruta es $ X"`;
     - accesos rápidos: `Sugerido`, `75 %`, `50 %`, `Gratis` (redondeados a la centena);
     - el texto fijo: `"Tus pasajeros te pagan este aporte directamente, en efectivo o Nequi. UniWheels no cobra comisión."`.
4. **Payload correcto**, con los nombres exactos del contrato:
   - `vehicle_id`, `origin_name`, `origin_lat`, `origin_lng`, `destination_campus_id`, `destination_campus_name`, `destination_lat`, `destination_lng`, `available_seats` y `base_contribution_cop`;
   - `scheduled_departure_time`: la fecha y hora elegidas, en ISO con zona `-05:00`;
   - `target_arrival_time` = salida + 60 min.
   - **Dirección `desde_campus`:** el backend modela el destino como sede. Manda `destination_campus_id/name` = la sede de origen, y `destination_lat/lng` = el punto real de destino del conductor. Documéntalo en un comentario y en el PR como limitación conocida. **No** cambies el backend.
   - **Entre sedes:** `destination_campus_*` = la sede de destino.
5. **Errores:**
   - **Elimina** la creación de la ruta local cuando el backend falla.
   - En un 422, muestra `errors.base_contribution_cop[0]` si existe, o el primer error, o `message`.
   - En cualquier otro error, muestra el mensaje y no navega.
   - Solo con éxito: guarda en el store la ruta devuelta por el backend (`id` real).

### 5.5 Reservar (`src/app/(tabs)/map.tsx`)
- `total_fare_cop` = `route.fare_cop` del resultado de búsqueda (que el backend envía como `suggested_fare_cop` = aporte de la ruta). **Elimina el fallback `|| 4500`.**
- Quita `payment_method` y `metodoPagoBackend`.
- El botón dice `"Reservar cupo"` y, debajo, `"Aporte al conductor: $ X, en efectivo o Nequi, directo."`. Si X es 0, dice `"Viaje gratis"`.
- La reserva ya no abre un selector de pago: confirma directo.
- En `index.tsx`, la tarjeta del match sigue usando `suggested_fare_cop`. Quita fallbacks de tarifa inventados.

### 5.6 Suspensión al iniciar sesión o en cualquier request
- En `login.tsx`, si el backend responde 403 con `suspended_until`, muestra su `message` tal cual. No muestres "error de conexión".
- Si existe un interceptor o manejador global de 401/403 en `packages/shared/src/api.js`, que con 403 + `suspended_until` haga logout y muestre el mensaje. Si no existe, **no lo crees**: basta con login y cancelación.

---

## Verificación (obligatoria)
1. `cd mobile && npm run lint`: **0 errores**. Las advertencias del React Compiler que ya existían se aceptan; no agregues nuevas.
2. `cd mobile && npx tsc --noEmit`: sin errores nuevos. Si ya había errores antes, compara contra la rama base y documenta en el PR que no aumentaron.
3. Este grep en `mobile/src` y `packages/shared/src` no devuelve nada:
   ```
   grep -rniE "wallet|wompi|billetera|recarga|payment_method|initCardPayment|earnings|penalty_fee|penalized|comisi|4500"
   ```
4. `npx expo export --platform ios --output-dir /tmp/expo-check` (o el equivalente) compila el bundle sin errores. Si la sesión no puede, indícalo en el PR. El usuario probará en Expo Go en iPhone.
5. Commits por bloque: `refactor(shared): ...`, `refactor(mobile): quitar pagos ...`, `fix(mobile): payload de publicación de ruta ...`, `feat(mobile): aporte sugerido ...`.
6. Si algo falla dos veces por la misma causa, **detente** y documéntalo en el PR. Nada de refactors visuales fuera de este alcance.
