# B1: bugs críticos y de seguridad de la simulación

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/b1-bugs-criticos` y abre **un solo PR** contra la rama base.
- **Fuente:** `reportes/simulacion/2026-10-04/REPORTE.md` (IDs `SIM-xxx`). Lee cada bloque antes de corregir; trae los pasos para reproducir y el archivo y la línea de la causa.
- **CI:** cada push corre la CI completa (`.github/workflows/ci.yml`). El PR **tiene que quedar en verde**. Si la sesión no puede correr tests en local (PHP < 8.4 o sin PostGIS), apóyate en la CI: haz push y revisa con `gh pr checks`/`gh run watch`.
- **Framework de tests:** revisa `tests/Pest.php` en cada servicio antes de escribir tests; si no existe, usa **PHPUnit**. No nombres helpers de test como métodos de `TestCase` (`query`, `get`, `post`…).
- **Un commit por SIM.** Mensaje: `fix(<servicio>): SIM-00X <resumen>`.
- **Cada corrección trae su test**, que falla sin el fix y pasa con él.

---

## SIM-004: la app no puede cancelar (crítico)
- `mobile/src/components/PassengerActiveTripCard.tsx:131` y `mobile/src/components/driver/CancelTripPenaltyModal.tsx:60` mandan `passenger`/`driver`, y el backend espera `pasajero`/`conductor`.
- Busca con grep **todos** los usos de `cancelTrip(` en `mobile/src` y `packages/shared/src` y corrígelos.
- Por SIM-010, el backend va a ignorar este campo, pero manda el valor correcto igual.

## SIM-010: el rol de quien cancela lo decide el servidor (alto)
- En `TripLifecycleController::cancel`, el rol se determina por el `user_id` del JWT:
  - si es el `driver_id` del viaje → `conductor`;
  - si es el `passenger_id` → `pasajero`;
  - si es cualquier otro → **403**.
- `cancelled_by` del body pasa a ser **opcional e ignorado**. Ajusta `CancelTripRequest`, que ya no es `required`.

## SIM-009: la cancelación tardía usa la hora del servidor (alto)
- En `TripLifecycleController::store`, `scheduled_pickup_time` se toma de `scheduled_departure_time` de la ruta, que se obtiene del route-matching con `RouteMatchingClient::getRoute`. **Nunca** del cliente.
- Si el cliente lo manda, se ignora.
- **Test:** ruta que sale en 3 h, reservar y cancelar devuelve `late_cancellation: false`.

## SIM-008: doble reserva y reserva de la ruta propia (alto)
- En `store`:
  - si `passenger_id == driver_id` de la ruta → **422** "No puedes reservar tu propia ruta.";
  - si el pasajero ya tiene un viaje **activo** (no cancelado ni completado) en esa ruta → **409** "Ya tienes una reserva en esta ruta.".

## SIM-001: control de cupos atómico (crítico)
La dueña de `routes.available_seats` es **route-matching**.

**route-matching:**
- `POST /api/v1/internal/routes/{id}/reserve-seat`, con `jwt.service` y `whereUuid`. Hace una actualización atómica:
  ```
  UPDATE routes SET available_seats = available_seats - 1
  WHERE id = ? AND status = 'publicada' AND available_seats > 0
  ```
  Si afecta 1 fila → 200 con los `available_seats` restantes. Si afecta 0 → **409** "La ruta ya no tiene cupos disponibles.".
- `POST /api/v1/internal/routes/{id}/release-seat` (`jwt.service`): `available_seats = available_seats + 1`, **sin pasar** la capacidad del vehículo. Si `routes` no guarda la capacidad, agrega la columna `total_seats`, con valor igual a `available_seats` al publicar (migración nueva; las filas existentes copian `available_seats`).

**trip-service:**
- **Al reservar:** después de validar SIM-008 y antes de crear el viaje, llama a `reserve-seat`.
  - Si responde 409 → la reserva responde 409.
  - Si falla la creación del viaje → `release-seat`.
  - Si no se puede contactar con route-matching → **503** sin crear el viaje.
- **Al cancelar** un viaje activo (cualquier rol) → `release-seat`.
  - Si falla, registra un warning **y no bloquees la cancelación**. Deja un `TODO` documentado para una conciliación futura.

**Tests:**
- 4 reservas sobre 3 cupos → 3 con 201 y 1 con 409;
- cancelar devuelve el cupo;
- una ruta con 0 cupos no aparece en `search-match`. Ya filtra por `available_seats > 0`: verifícalo.

## SIM-002 y SIM-018: solo vehículo propio y aprobado, con cupos coherentes (crítico)
**vehicle-service:** agrega a la respuesta de `/vehicles/{id}/public-summary` los campos `status`, `owner_id` (el `user_id` del vehículo) y `available_seats`.

**route-matching** (`DriverProfileClient` y `RouteController::store`):
- Reemplaza `getVehicleType()` por un `getVehicleForValidation()` que devuelva `type`, `status`, `owner_id` y `available_seats`, o `null` si falla. Si es `null` → 503, como hoy.
- Si `owner_id != driver_id` del JWT, o `status` no es el valor de "aprobado" que usa vehicle-service (búscalo en su modelo), responde **422**: "Necesitas un vehículo propio aprobado para publicar rutas.".
- `available_seats` de la ruta tiene que ser **≤ los cupos del vehículo**. Las motos, siempre 1. Si no → 422 con el máximo permitido.
- **Usa el mismo método en `contribution-suggestion`** (con la misma validación de dueño y aprobado), para no tener dos clientes.

## SIM-005: horas con zona horaria (crítico)
- Verifica que `config('app.timezone')` sea `UTC` en route-matching y trip-service.
- Al recibir `scheduled_departure_time`, `target_arrival_time` y `scheduled_pickup_time`, conviértelos a UTC antes de guardar: `Carbon::parse($valor)->utc()`. Hazlo en el FormRequest con `passedValidation` o en el controlador, de forma consistente.
- **Al responder:**
  - las fechas ISO salen en UTC con `Z`;
  - los textos para mostrar (como `scheduled_departure_time` formateado en `SpatialMatchingService` o en los historiales) usan `->setTimezone('America/Bogota')->format('h:i A')`. Ojo: es `h` minúscula, en formato de 12 horas. Busca con grep `format('H:i A')` y corrige todos.
- **Test:** publicar `2026-10-05T07:00:00-05:00` guarda `12:00Z`, y la búsqueda muestra `07:00 AM`.

## SIM-006: JWT mal formado da 500 (alto)
- En `auth-service/app/Services/JwtService.php` y en `*/app/Services/JwtVerifier.php` de los 4 servicios: cualquier excepción al decodificar (`\Throwable`, incluidas `DomainException` y `UnexpectedValueException`) responde **401**.
- **Test por servicio:** `Bearer abc.def.ghi` → 401.

## SIM-007: ids que no son UUID dan 500 (alto)
- Agrega `->whereUuid(...)` a **todas** las rutas con parámetro UUID en vehicle, trip, auth (admin) y route-matching (las que falten tras T2).
- **Test** en un endpoint por servicio: id inválido → 404.

## SIM-003: prefijo de Redis fijo (dev; prevención)
- En los 5 servicios, `config/database.php`: el prefijo de Redis por defecto pasa a ser `env('REDIS_PREFIX', 'uniwheels-database-')`, independiente de `APP_NAME`. Producción ya usa ese valor.
- Agrega `REDIS_PREFIX=uniwheels-database-` a cada `.env.example`.
- **Test** en trip-service: un usuario con la llave de suspensión escrita con ese prefijo recibe 403.

---

## Fuera de alcance
SIM-011 a SIM-028 van en las tandas B2 y B3. No hagas refactors.

## Criterios de terminado
1. CI del PR **en verde**: link a la ejecución en la descripción.
2. Tabla en el PR con SIM, commit y test que lo cubre.
3. Si algo falla dos veces por la misma causa, detente y documéntalo en el PR.
4. **Nota de despliegue** en el PR:
   - hay migraciones en route-matching (`total_seats`, si aplica);
   - se despliegan vehicle, route-matching, trip, auth y notification **juntos**;
   - la app requiere recargar el bundle.
