# Spec: Tracking GPS real conductor→pasajero durante un viaje activo

## Contexto mínimo (ya investigado, no repetir)

Hoy, todo lo que parece "posición en vivo" en la app es una animación de demostración, desconectada de la posición GPS real del conductor:

- `frontend/src/components/driver/DriverLiveNavigationCockpit.jsx` — el HUD compacto tiene `currentManeuver` (línea 36) y `speedKmh` (línea 38) en `useState` con valores fijos de ejemplo (`'En 350m gire a la derecha hacia Carrera 33'`, `38`) que **nunca se actualizan** (no hay ningún `setCurrentManeuver`/`setSpeedKmh` en todo el archivo). `distanceRemainingMeters` (línea 37) tampoco se usa nunca en el render — está muerto.
- `frontend/src/components/driver/InAppGpsNavigator.jsx` — el navegador de pantalla completa ignora el prop `trip` real. Usa `WAYPOINTS_DATA`, un array fijo de 7 coordenadas en Bucaramanga con nombre de pasajero inventado, y avanza solo con un `setInterval` de 4500ms (línea ~172), sin relación con posición GPS real ni con el origen/destino reales del viaje.
- `frontend/src/components/common/LiveTripIslandWidget.jsx` — el ETA (`etaMinutes`, línea 81) y la barra de progreso (`tripProgressPercent`) son un contador que resta con `setInterval` cada 45s (línea 109), no una posición real.
- `frontend/src/components/map/TripMapView.jsx` — tiene un botón "GPS ▶" (`toggleGpsSimulation`, línea 361) visible también durante un viaje ya reservado (`isBooked=true`) que anima un marcador sobre la polilínea localmente vía `requestAnimationFrame` (línea ~320), sin ninguna conexión al backend.

**Ya existe en la base de datos, sin usar**: la migración `services/trip-service/database/migrations/0001_01_01_000004_create_trip_tracking_points_table.php` crea la tabla `trip_tracking_points` (columnas: `id` uuid, `trip_id` FK a `trips`, `latitude` decimal(10,7), `longitude` decimal(10,7), `speed_kmh` decimal(5,2) nullable, `heading_degrees` decimal(5,2) nullable, `accuracy_meters` decimal(5,2) nullable, `recorded_at` timestamp; índice `[trip_id, recorded_at]`). El comentario de la migración dice literalmente "tabla de telemetría GPS en tiempo real (reporte cada 5 segundos)". **No existe ningún Eloquent Model, controller, ruta ni servicio que la use.** Es decir, el diseño de esta feature ya se pensó pero nunca se implementó — esta spec completa ese trabajo.

`trip-service` (Laravel, `services/trip-service/`) ya maneja el ciclo de vida completo del viaje (`app/Http/Controllers/Api/V1/TripLifecycleController.php`), con estados en `app/Models/Trip.php`: `STATUS_SOLICITADO`, `STATUS_CONFIRMADO`, `STATUS_EN_CAMINO`, `STATUS_EN_PUNTO_ENCUENTRO`, `STATUS_RECOGIDO`, `STATUS_COMPLETADO`, más 2 de cancelado. El modelo `Trip` tiene `driver_id` y `passenger_id` en `$fillable`.

Patrón de autorización ya establecido (`checkTripAuthorization`, líneas 29-56 de `TripLifecycleController.php`): compara `$request->attributes->get('user_id')` (lo setea el middleware `jwt.auth`, ver `app/Http/Middleware/JwtAuthenticate.php`) contra `$trip->driver_id` o `$trip->passenger_id` según el rol requerido, devolviendo 401/403 en JSON. Reutilizar este mismo patrón para los endpoints nuevos (puede copiarse el método completo al nuevo controller, o extraerse a un trait si el ejecutor lo prefiere — no es obligatorio refactorizar, ambas son aceptables).

Rutas actuales en `services/trip-service/routes/api.php`, todas bajo `Route::prefix('v1')->middleware('jwt.auth')->group(...)`.

Frontend: `frontend/src/services/api.js` define `tripLifecycleClient` (axios con baseURL `VITE_TRIP_API_URL || 'http://localhost:8004/api/v1'`, interceptor de auth ya adjunto vía `attachAuthInterceptor`) y `tripLifecycleService` (objeto con métodos `bookTrip`, `startDriving`, `verifyPin`, `completeTrip`, etc., todos con el mismo patrón: `try { const response = await tripLifecycleClient.post/get(...); return response.data; } catch (error) { if (error.response?.data) throw error.response.data; throw { message: '...' }; }`).

El frontend ya usa geolocalización one-shot: `navigator.geolocation.getCurrentPosition(...)` en `DriverLiveNavigationCockpit.jsx` líneas 63-69 (guarda en `driverCoords`). Para esta feature hace falta cambiar a `navigator.geolocation.watchPosition(...)` para reportar continuamente mientras la cabina está abierta.

Tests existentes de referencia: `services/trip-service/tests/Feature/TripLifecycleTest.php` (Pest). Correr con `cd services/trip-service && ./vendor/bin/pest` o `composer test`.

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Nada de WebSockets ni push en tiempo real.** El pasajero hace polling simple (HTTP GET cada pocos segundos) contra el nuevo endpoint. Si en el futuro se quiere sockets, es una iteración aparte.
- No hay que tocar `ai-route-service` ni recalcular ETA con tráfico real en esta v1 — el ETA puede seguir siendo la resta simple `ahora - ETA_estimado_original` o similar aproximación, mientras dependa de datos reales de posición y no de un timer que resta minutos porque sí. Si el ejecutor quiere dejar el ETA tal cual está por ahora y solo arreglar la posición del marcador, es aceptable para esta v1 — lo NO aceptable es dejar el marcador o el HUD del conductor mostrando datos inventados que no reflejan ninguna posición real.
- No hay que generar instrucciones de maniobra reales tipo Waze (eso requeriría un motor de ruteo con turn-by-turn, ej. OSRM `/route` con `steps=true`, que es una feature más grande). Para esta v1 basta con que el HUD del conductor y el mapa del pasajero muestren la **posición real** del conductor y una **distancia/ETA calculada con esa posición real** contra el destino — no maniobra por maniobra.
- No borrar `InAppGpsNavigator.jsx` ni su experiencia visual (señalética, velocímetro, etc.) — solo dejar de alimentarlo con datos inventados. Si no es viable en esta v1 conectarlo a maniobras reales, la Tarea 7 da la opción de simplificarlo honestamente en vez de dejarlo mintiendo.

## Tareas

### Tarea 1 — Modelo `TripTrackingPoint` (trip-service)

Archivo nuevo: `services/trip-service/app/Models/TripTrackingPoint.php`.

- Clase Eloquent estándar del proyecto (mirar `app/Models/Trip.php` para el estilo: `use HasUuids` o generación de UUID en `booted()`, ver cómo lo hace `Trip.php` exactamente y replicar el mismo mecanismo para que el `id` se genere igual).
- `$fillable`: `['trip_id', 'latitude', 'longitude', 'speed_kmh', 'heading_degrees', 'accuracy_meters', 'recorded_at']`.
- `$casts`: `latitude` y `longitude` a `float` (o `decimal:7`, seguir el patrón que use `Trip.php` para sus propios decimales si los tiene), `recorded_at` a `datetime`.
- Relación `trip(): BelongsTo` hacia `Trip::class`.
- Añadir en `Trip.php` la relación inversa `trackingPoints(): HasMany` hacia `TripTrackingPoint::class`, ordenada por `recorded_at desc` no es necesario en la relación misma (se ordena en la query del controller).

**Verificación**: `cd services/trip-service && php artisan tinker --execute="var_dump(class_exists('App\Models\TripTrackingPoint'));"` debe imprimir `bool(true)`.

### Tarea 2 — Endpoints de tracking (trip-service)

Archivo nuevo: `services/trip-service/app/Http/Controllers/Api/V1/TripTrackingController.php`.

Dos métodos:

**`report(Request $request, string $id): JsonResponse`** — el conductor reporta su posición.
- Buscar el trip: `Trip::findOrFail($id)`.
- Autorización: reutilizar el patrón de `checkTripAuthorization($request, $trip, 'driver')` (copiar el método privado desde `TripLifecycleController.php` a este nuevo controller, o extraerlo a un trait común `app/Http/Controllers/Concerns/AuthorizesTripAccess.php` si el ejecutor prefiere no duplicar — cualquiera de las dos formas es válida, elegir la que tome menos líneas).
- Validar que el trip esté en un estado donde tiene sentido reportar posición: `in_array($trip->status, [Trip::STATUS_EN_CAMINO, Trip::STATUS_EN_PUNTO_ENCUENTRO, Trip::STATUS_RECOGIDO])`. Si no, devolver 422 con mensaje `'No se puede reportar posición: el viaje no está en curso.'`.
- Validar el payload con un `Illuminate\Http\Request::validate()` inline (no hace falta un FormRequest aparte para esto, es un endpoint interno de alta frecuencia): `latitude` required numeric between -90/90, `longitude` required numeric between -180/180, `speed_kmh` nullable numeric min:0, `heading_degrees` nullable numeric between 0/360, `accuracy_meters` nullable numeric min:0.
- Crear el `TripTrackingPoint` con `recorded_at = now()`.
- **No** acumular todo el historial indefinidamente en cada respuesta — este endpoint solo inserta, no hace falta devolver nada más que `{'success': true}`.
- Responder 201 con `{'success': true}`.

**`latest(Request $request, string $id): JsonResponse`** — el pasajero (o el propio conductor) consulta la última posición conocida.
- Buscar el trip, autorización con `checkTripAuthorization($request, $trip)` sin rol específico (cualquiera de los dos participantes puede leer, igual que ya hace `arrive`/`complete` para casos similares — revisar si algún método existente en `TripLifecycleController.php` ya autoriza a ambos roles a la vez y replicar exactamente esa validación, o si no existe, usar `$requiredRole = null` que ya soporta `checkTripAuthorization`).
- `$point = $trip->trackingPoints()->latest('recorded_at')->first();`
- Si no hay ningún punto todavía, responder `200` con `data: null` (no es un error — el conductor puede no haber reportado aún su primera posición). El frontend debe manejar ese caso mostrando el estado "esperando posición del conductor" en vez de romper.
- Si hay punto, responder `200` con `data: {latitude, longitude, speed_kmh, heading_degrees, recorded_at (ISO8601)}`.

Registrar las rutas en `services/trip-service/routes/api.php`, dentro del grupo `Route::prefix('v1')->middleware('jwt.auth')->group(...)` ya existente, junto a las demás rutas de `/trips/{id}/...`:

```php
Route::post('/trips/{id}/tracking', [TripTrackingController::class, 'report']);
Route::get('/trips/{id}/tracking/latest', [TripTrackingController::class, 'latest']);
```

Considerar (no obligatorio, pero recomendado dado que el reporte es cada pocos segundos): aplicar `->middleware('throttle:30,1')` al endpoint `report` para evitar que un cliente con un bug en el intervalo tumbe la base de datos con inserts.

**Casos borde**: `trip_id` que no existe → Laravel ya devuelve 404 automático por `findOrFail`. Coordenadas fuera de rango → 422 por la validación. Reportar posición para un trip ya `completado`/`cancelado` → 422 explícito (cubierto arriba). Pasajero intentando llamar a `report` (que es solo del conductor) → 403 vía `checkTripAuthorization`.

**Verificación**: escribir (o pedir a Codex que escriba) un test Pest nuevo `services/trip-service/tests/Feature/TripTrackingTest.php` con al menos: (1) el conductor asignado puede reportar posición en un trip `en_camino` y queda en la tabla; (2) un usuario que no es el conductor del trip recibe 403 al intentar reportar; (3) el pasajero puede leer `latest` y recibe las coordenadas correctas; (4) `latest` sin ningún punto reportado devuelve `data: null` sin error; (5) reportar en un trip `completado` devuelve 422. Correr con `cd services/trip-service && ./vendor/bin/pest --filter=TripTracking`.

### Tarea 3 — Purga de puntos viejos (trip-service, opcional pero recomendado)

La tabla `trip_tracking_points` va a crecer rápido (un insert cada pocos segundos por viaje activo). No es necesario resolver esto en la v1 con un job de limpieza automatizado, pero **sí** dejarlo anotado: agregar un comentario corto en el modelo `TripTrackingPoint.php` indicando que en producción esta tabla necesita una política de retención (ej. borrar puntos de viajes completados hace más de N días) y que no está implementada todavía. No construir el job en esta tarea — solo el comentario, para que quede documentado y no se pierda de vista. (Si el ejecutor tiene tiempo/cuota de sobra y quiere resolverlo ya, un `php artisan schedule` command que borre `TripTrackingPoint::whereHas('trip', fn($q) => $q->whereIn('status', [Trip::STATUS_COMPLETADO, ...cancelados]))->where('recorded_at', '<', now()->subDays(7))->delete()` sería el enfoque, pero es opcional y no bloquea el resto de la spec.)

### Tarea 4 — Cliente frontend para los nuevos endpoints

Archivo: `frontend/src/services/api.js`, dentro de `tripLifecycleService` (junto a los demás métodos, mismo objeto, línea ~774 en adelante).

Añadir dos métodos siguiendo exactamente el mismo patrón try/catch que los demás métodos de `tripLifecycleService` (ver `verifyPin` como ejemplo más cercano):

```js
async reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters }) {
  try {
    const response = await tripLifecycleClient.post(`/trips/${tripId}/tracking`, {
      latitude, longitude, speed_kmh, heading_degrees, accuracy_meters,
    });
    return response.data;
  } catch (error) {
    // Este endpoint se llama cada pocos segundos: un fallo puntual de red no debe
    // interrumpir la navegación ni mostrarle un error al conductor.
    return null;
  }
},

async getLatestPosition(tripId) {
  try {
    const response = await tripLifecycleClient.get(`/trips/${tripId}/tracking/latest`);
    return response.data?.data || null;
  } catch {
    return null;
  }
},
```

Nota de diseño explícita: a diferencia de los demás métodos de este objeto (que lanzan el error hacia arriba), estos dos **tragan el error y devuelven `null`** — es una decisión intencional, no un descuido: un polling/reporte que falla una vez cada tanto no debe romper la UI ni mostrar un mensaje de error al usuario, simplemente se reintenta en el siguiente ciclo.

**Verificación**: `cd frontend && npm run lint` no debe agregar warnings nuevos sobre este bloque. No hace falta test unitario dedicado para esto (es un wrapper delgado de axios, igual que sus vecinos, que tampoco lo tienen).

### Tarea 5 — El conductor reporta su posición real (DriverLiveNavigationCockpit.jsx)

Archivo: `frontend/src/components/driver/DriverLiveNavigationCockpit.jsx`.

- Reemplazar el `useEffect` de las líneas 63-69 (que usa `getCurrentPosition` una sola vez) por `navigator.geolocation.watchPosition(...)`, guardando el `watchId` devuelto para limpiar con `navigator.geolocation.clearWatch(watchId)` en el cleanup del efecto.
- Cada vez que llega una posición nueva del `watchPosition`: (a) actualizar `driverCoords` como ya hace hoy, y (b) si `trip?.id` existe, llamar a `tripLifecycleService.reportPosition(trip.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, speed_kmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : null, heading_degrees: pos.coords.heading, accuracy_meters: pos.coords.accuracy })` — sin `await` bloqueante en el callback del watch (fire-and-forget está bien, ya que `reportPosition` nunca lanza).
- `pos.coords.speed` viene en m/s cuando el navegador lo soporta (puede ser `null` en muchos navegadores/desktops sin GPS real) — por eso la conversión a km/h (`* 3.6`) y el `!= null` antes de convertir. Si es `null`, mandar `speed_kmh: null` (el endpoint ya lo acepta nullable).
- **No** enviar un reporte por cada evento de `watchPosition` sin limitar la frecuencia — el navegador puede disparar el callback muy seguido. Throttlear a máximo 1 envío cada 5 segundos (coincide con el comentario original de la migración "reporte cada 5 segundos"). Implementación simple: guardar el timestamp del último envío en un `useRef` y solo llamar a `reportPosition` si pasaron ≥5000ms desde el último, aunque `driverCoords` (para el marcador local del propio conductor) sí se actualice en cada evento sin throttle.
- Reemplazar los `useState` fijos `currentManeuver` (línea 36) y `speedKmh` (línea 38): `speedKmh` debe derivarse de la posición real reportada (`Math.round((pos.coords.speed || 0) * 3.6)`) en vez de quedar fijo en 38. `currentManeuver`: dado que no hay motor de maniobras real en esta v1 (ver "Alcance"), reemplazar el texto fijo por algo honesto y útil calculado con datos reales disponibles: distancia en línea recta (fórmula haversine, puede copiarse/adaptar la que ya exista en el proyecto si hay una — buscar con `grep -rn "haversine\|ST_DistanceSphere\|toRad" frontend/src` antes de escribir una nueva) desde `driverCoords` hasta `destinoActualNav` (ya calculado en este mismo archivo, línea ~100), mostrado como p.ej. `"A 850 m del punto de encuentro"` / `"A 2.1 km del destino"` según corresponda. Eliminar `distanceRemainingMeters` (estado muerto, línea 37) o reutilizarlo para guardar esa distancia calculada — cualquiera de las dos es aceptable, pero no debe quedar declarado sin usar.

**Casos borde**: el navegador puede denegar el permiso de geolocalización — el código ya tiene un segundo argumento vacío `() => {}` como error callback en el `getCurrentPosition` original; mantener un manejo equivalente (no lanzar excepción, simplemente no reportar y dejar `driverCoords` en el origen de la ruta como ya hace hoy). Verificar que `clearWatch` se llama correctamente al desmontar para no dejar el GPS del dispositivo activo de fondo cuando el conductor sale de la cabina.

**Verificación manual**: con el stack corriendo (`./uniwheels start`), publicar un trayecto como conductor, entrar a la cabina, y confirmar en las DevTools → Network que se hacen requests periódicos a `POST /trips/{id}/tracking` (aprox. cada 5s) mientras la cabina está abierta, y que dejan de hacerse al salir de la vista.

### Tarea 6 — El pasajero consulta la posición real (LiveTripIslandWidget.jsx)

Archivo: `frontend/src/components/common/LiveTripIslandWidget.jsx`.

- Añadir un nuevo estado `const [driverPosition, setDriverPosition] = useState(null);`.
- Sustituir (o complementar) el `useEffect` de las líneas 95-116: mantener el `setInterval` de notificaciones si se quiere conservar esa funcionalidad, pero añadir un **segundo** `useEffect` con su propio `setInterval` de polling cada 5-7 segundos que, mientras `trip?.id` exista, llame a `tripLifecycleService.getLatestPosition(trip.id)` (importar `tripLifecycleService` desde `'../../services/api'`) y guarde el resultado en `driverPosition`. Limpiar el interval en el cleanup.
- El `etaMinutes` actual (que resta 1 minuto cada 45s de forma artificial) debe calcularse a partir de `driverPosition` cuando esté disponible (distancia haversine hasta el punto de recogida o destino, según `isStarted`, dividida por una velocidad promedio razonable, p.ej. 25 km/h urbano, o usando `driverPosition.speed_kmh` si viene y es > 5) en vez de un contador que resta porque sí. Si `driverPosition` todavía es `null` (el conductor no ha reportado ninguna posición aún), es aceptable mantener el comportamiento actual como fallback mientras se muestra un texto sutil de "conectando con el conductor..." — no debe romperse ni mostrar `NaN`/`undefined`.
- `tripProgressPercent`: mismo criterio — cuando hay `driverPosition` real, calcular el progreso real (distancia recorrida vs. distancia total del origen-destino conocidos), en vez de la fórmula sintética actual basada en `etaMinutes`.

**Casos borde**: `getLatestPosition` puede devolver `null` (conductor no ha reportado aún, o el endpoint falló) — el widget debe seguir renderizando sin la posición real en ese caso, no debe quedar en blanco ni tirar error. Si el viaje termina (`trip` se vuelve `null`), el `useEffect` debe limpiar el interval (ya lo hace el `if (!trip) return null;` de la línea 119, pero confirmar que el cleanup del nuevo interval también corre en ese re-render).

**Verificación manual**: con un viaje real activo (conductor con la cabina abierta reportando posición, según Tarea 5) y el pasajero viendo este widget, confirmar que el ETA/progreso cambian de forma consistente con el movimiento real del conductor (puede simularse moviendo la ubicación del navegador vía DevTools → Sensors → Location, o con las coordenadas de prueba que ya usa el proyecto).

### Tarea 7 — El mapa del pasajero muestra la posición real (TripMapView.jsx)

Archivo: `frontend/src/components/map/TripMapView.jsx`.

- Cuando `isBooked` es `true` (viaje real ya reservado, no la vista de previsualización antes de reservar): reemplazar la fuente del marcador del vehículo. En vez de que `vehiclePos`/`vehicleHeading` vengan de la animación local (`animateGpsStep`, líneas ~309-359), deben venir de un polling a `tripLifecycleService.getLatestPosition(activePassengerBooking.id)` (mismo patrón que la Tarea 6, puede factorizarse en un hook compartido `useDriverLivePosition(tripId)` en `frontend/src/hooks/` si el ejecutor lo prefiere, pero no es obligatorio — duplicar el polling en los dos componentes también es aceptable para esta v1).
- El botón "GPS ▶ / Pausar" (`toggleGpsSimulation`, `isSimulatingGps`) debe **dejar de existir cuando `isBooked` es `true`** — no tiene sentido que el pasajero le dé play/pausa a la posición real de otra persona. Puede seguir existiendo tal cual está (como preview/demo) únicamente en el modo de previsualización antes de reservar (`isBooked === false`), dejando claro con esto que la animación manual es solo una demostración de cómo se vería el viaje, nunca el tracking real de un viaje ya confirmado. Revisar `TripMapOverlayControls.jsx` línea ~104-120 para condicionar ese botón a `!isBooked`.

**Casos borde**: igual que la Tarea 6, `getLatestPosition` puede devolver `null` — mientras tanto, mostrar el marcador en la última posición conocida (o en el origen de la ruta si nunca hubo ninguna) en vez de no renderizar nada.

**Verificación manual**: reservar un viaje real como pasajero, abrir la pestaña "Ruta" (`TripMapView`), y confirmar que ya no aparece el botón "GPS ▶" y que el marcador del conductor se mueve según la posición real reportada por la Tarea 5, no según una animación local.

### Tarea 8 — Simplificar honestamente `InAppGpsNavigator.jsx` (opcional, ver "Alcance")

Este archivo es el más caro de arreglar del todo (requeriría maniobras turn-by-turn reales, fuera de alcance de esta v1). Dos caminos aceptables, elegir uno:

**(a) Mínimo honesto**: quitar el `setInterval` de avance automático (línea ~172) y `WAYPOINTS_DATA` fijo. Mostrar en su lugar la posición real (reusando el mismo polling/watch de las tareas anteriores) sobre el mapa, sin panel de "maniobra siguiente" con texto inventado — dejar solo velocímetro real, mapa con posición real, y los controles ya existentes (SOS ya corregido en un commit previo, silencio de voz, botón Finalizar). Es decir, degradar de "navegador turn-by-turn falso" a "mapa de seguimiento en vivo real", que es honesto aunque menos vistoso.

**(b) Dejarlo fuera de esta iteración**: si no hay tiempo/cuota, dejar `InAppGpsNavigator.jsx` sin tocar en esta spec, pero **obligatoriamente** añadir un comentario visible al inicio del archivo (arriba de `WAYPOINTS_DATA`) dejando explícito que esta ruta es una demo fija no conectada a datos reales, para que no se le pierda el rastro al problema. No cerrar esta tarea sin hacer al menos (b) como mínimo.

**Verificación**: si se elige (a), repetir la verificación manual de la Tarea 5 pero dentro del navegador de pantalla completa en vez de la cabina compacta.

## Instrucción final para el agente ejecutor

Haz commit tras cada tarea (`git add -A && git commit -m 'wip: tarea N'`). Al terminar tu turno o al agotar tu cuota, escribe un bloque ESTADO con: hechas, pendientes, siguiente paso concreto, archivos tocados, cómo verificar y la base del diff. Reglas en ~/playbook-agentes.md.
