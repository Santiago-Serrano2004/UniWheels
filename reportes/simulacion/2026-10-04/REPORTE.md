## T3: simulación de 20 usuarios y reporte de bugs

Agrega el simulador (`tools/simulacion/`) y la evidencia (`reportes/simulacion/2026-10-04/`: `resultados.json`, capturas del panel y la landing, `gateway_probe.txt`). **No corrige bugs.** Solo localhost, `MAIL_MAILER=log`, datos con prefijo `sim_` (limpiados con `python -m simulacion --cleanup`).

Nota: el REPORTE.md no se pudo escribir como archivo en esta sesión (el entorno bloqueó la escritura de archivos de reporte); el reporte completo está en esta descripción. La evidencia cruda por paso está en `resultados.json`.

## Resumen

**Escenarios: 3 pasaron, 9 fallaron** (de 12). Pasaron: 2 (tope del aporte), 4 (desvío), 7 (levantamiento perezoso; pasa de forma parcialmente trivial por SIM-003). Fallaron: 1, 3, 5, 6, 8, 9, 10, 11, 12.

| # | Escenario | Resultado | Aserciones OK |
|---|---|---|---|
| 1 | Camino feliz | falló | 15/19 |
| 2 | Tope del aporte | pasó | 8/8 |
| 3 | Moto | falló | 6/8 |
| 4 | Desvío | pasó | 6/6 |
| 5 | Cupos agotados | falló | 2/5 |
| 6 | Cancelaciones tardías y suspensión | falló | 11/14 |
| 7 | Levantamiento perezoso | pasó | 6/6 |
| 8 | Administrador | falló | 16/19 |
| 9 | SOS | falló | 7/10 |
| 10 | Entradas inválidas | falló | 29/49 |
| 11 | Concurrencia (3 cupos, 10 pasajeros) | falló | 3/6 |
| 12 | Semana simulada | falló | 2/5 |

Funciona bien: alta por la API real (código leído del log), aprobación de documentos, aporte sugerido y tope (carro y moto), búsqueda directa y por desvío con el mismo aporte, suspensión automática a la 3.ª tardía, suspensión manual que no se reactiva sola, panel y landing sin errores de consola.

### Semana simulada (escenario 12)
5 días, franjas 6-8 a. m. y 5-7 p. m., 20 usuarios: 60 rutas, 200 búsquedas, 135 reservas, 75 viajes completados, 14 cancelaciones.

- Búsquedas con resultado: **92,5 %** (185/200).
- Errores 5xx: **0**.
- Reservas rechazadas por cupo: 0 de 135 (100 reservas por encima del cupo en 15 rutas, SIM-001).
- Búsquedas más lentas que el timeout móvil (6 s): **133 de 200**.

| Endpoint | n | p50 ms | p95 ms |
|---|---|---|---|
| GET contribution-suggestion | 60 | 39 | 89 |
| POST /routes | 60 | 73 | 95 |
| **POST /routes/search-match** | 200 | **9238** | **24496** |
| POST /trips | 135 | 69 | 88 |
| POST trips/{id}/start | 75 | 32 | 39 |
| POST trips/{id}/arrive | 75 | 31 | 41 |
| POST trips/{id}/verify-pin | 75 | 33 | 40 |
| POST trips/{id}/complete | 75 | 74 | 86 |
| POST trips/{id}/cancel | 14 | 39 | 46 |

Con 10 búsquedas concurrentes (escenario 11): p50 25,7 s, p95 43,6 s. Los 9 errores 5xx del `resultados.json` final son las pruebas deliberadas del escenario 10 (SIM-006/007).

### Los 5 hallazgos más graves
1. **SIM-001** El cupo nunca se descuenta: 10 reservas sobre 3 cupos, todas 201.
2. **SIM-002** Se publica ruta con vehículo sin aprobar o ajeno.
3. **SIM-003** Suspensión y logout solo se aplican en auth-service (prefijo Redis distinto en los otros 4).
4. **SIM-004** Cancelar desde la app móvil responde siempre 422 (`passenger` vs `pasajero`).
5. **SIM-005** Horas con offset `-05:00` se guardan sin convertir: 07:00 se ve como "02:00 AM".

## Bugs

Reproducir = `python -m simulacion run --escenario N` (desde `tools/simulacion`, con `UNIWHEELS_BACKEND_ROOT` apuntando al checkout que corre) o el request indicado. Evidencia en `resultados.json` (escenario y paso citados).

### Críticos

**SIM-001 — Los cupos no se descuentan; hay sobrecupo.** Componente: trip-service + route-matching.
- Reproducir: escenarios 11 y 5. A mano: ruta con `available_seats: 3` y 4 `POST :8004/api/v1/trips` de pasajeros distintos.
- Esperado: 3 reservas 201 y la 4.ª rechazada; ruta con 0 cupos fuera de la búsqueda. Obtenido: todas 201; 10 viajes activos con 3 cupos; `routes.available_seats` sigue en 3; ruta de 2 cupos con 3 reservas sigue en la búsqueda; 100 reservas sobre cupo en la semana.
- Causa: `trip-service/.../TripLifecycleController.php:68-140` (`store`) no valida ni decrementa; ningún código escribe `available_seats`. Falta operación atómica entre servicios.

**SIM-002 — Se publica ruta sin vehículo aprobado, ajeno o pendiente.** Componente: route-matching.
- Reproducir: escenario 10 (pasos "p10 publica con vehículo PENDIENTE" y "p1 publica con el vehículo de c1").
- Esperado 403/422. Obtenido 201 en ambos.
- Causa: `RouteController.php:170` solo usa `getVehicleType()` (public-summary); no verifica `status = aprobado` ni dueño.

**SIM-003 — Suspensión y token revocado no se aplican fuera de auth-service.** Componente: los 5 servicios (Redis).
- Reproducir: escenarios 6, 8, 10. Suspender (`PATCH :8001/api/v1/admin/users/{id}/suspension`); con su token `GET :8001/auth/me` da 403 pero `GET :8004/passenger/history`, `:8003/routes`, `:8002/vehicles` dan 200. Igual tras `POST /auth/logout`.
- Esperado: 403 con `suspended_until` / 401. Obtenido: 200 (también en suspensión manual).
- Causa: prefijo Redis por `APP_NAME` (`services/*/config/database.php:152`, sin `REDIS_PREFIX` en los .env). auth escribe `uniwheels-auth-service-database-...` (`UserSuspensionService.php:41,83`, `JwtService.php:69`); los demás leen con su prefijo (`trip-service/.../JwtAuthenticate.php:39`, `*/Services/JwtVerifier.php:24`). Además no devuelven `suspended_until`.

**SIM-004 — La app móvil no puede cancelar viajes (422).** Componente: contrato app/trip-service.
- Reproducir: escenario 10. `POST :8004/api/v1/trips/{id}/cancel` con `{"cancelled_by":"passenger","reason":"Cancelado por el pasajero"}`.
- Esperado 200. Obtenido `422 cancelled_by validation.in` (el backend solo acepta `conductor|pasajero`: `CancelTripRequest.php:17`).
- App: `mobile/src/components/PassengerActiveTripCard.tsx:131`, `mobile/src/components/driver/CancelTripPenaltyModal.tsx:60`. Inutiliza penalizaciones y suspensión desde la app.

**SIM-005 — Horas con offset `-05:00` se guardan sin convertir (5 h de desfase).** Componente: route-matching y trip-service.
- Reproducir: escenario 1. `POST :8003/api/v1/routes` con `"scheduled_departure_time":"2026-10-05T07:00:00-05:00"` y luego `search-match`.
- Esperado: `12:00Z` y "07:00 AM". Obtenido: `2026-10-05T07:00:00.000000Z`, búsqueda muestra `"02:00 AM"`; 17:30 sale como `12:30 PM`. El formato `H:i A` además mezcla 24 h con AM/PM.
- Evidencia: escenario 1 y `contrato[hora-en-busqueda]`. La app publica con `-05:00` (`DriverRoutePublishForm.tsx:56,403`).
- Causa: cast `datetime` (`Route.php:36`, `Trip.php:60`) guarda el wall-time sin pasar a UTC en columnas `timestamp`.

### Altos

**SIM-006 — JWT mal formado da 500 en los 5 servicios.** `curl -H 'Authorization: Bearer abc.def.ghi' localhost:8001/api/v1/auth/me` (también :8002 `/vehicles`, :8003 `/routes`, :8004 `/passenger/history`, :8005 `/notifications`). Esperado 401; obtenido 500 `DomainException: Syntax error, malformed JSON`. Causa: `JwtService.php:51` y `*/Services/JwtVerifier.php` capturan solo `Expired|SignatureInvalid|UnexpectedValue`. Evidencia: escenario 10.

**SIM-007 — Ids no UUID dan 500.** Con token válido: `GET :8003/routes/no-es-un-uuid`, `POST :8003/routes/no-es-un-uuid/evaluate-detour`, `POST :8004/trips/no-es-un-uuid/start` y `/cancel`, `GET :8002/vehicles/no-es-un-uuid`, `GET :8001/admin/users/no-es-un-uuid`, `GET :8002/admin/vehicles/no-es-un-uuid` -> 500 en los 7 (esperado 404/422). Causa: `findOrFail($id)` sobre columnas uuid (`RouteController.php:268,287,317`, `TripLifecycleController.php:150-294`, `VehicleController.php:155,177,206`, `AdminUserController.php:64,85`). Evidencia: escenario 10.

**SIM-008 — Doble reserva de la misma ruta y reserva de la ruta propia.** Escenario 10: dos `POST /trips` iguales -> 201 y 201; el conductor reserva su ruta -> 201 (esperado 409/422 y 403/422). Causa: `TripLifecycleController::store` no comprueba duplicados ni `passenger_id != driver_id`.

**SIM-009 — La penalización de cancelación usa una hora enviada por el cliente (y la app manda medianoche).** Reproducir: `run --escenario 1 --contrato` (sonda `cancelacion-hora-movil`): ruta que sale en 3 h, reserva con `scheduled_pickup_time = <fecha>T00:00:00` (`mobile/.../map.tsx:482`), cancelar -> `late_cancellation: true` (esperado false). Causa: `Trip::minutesBeforeDeparture()` (`Trip.php:145`) usa `trips.scheduled_pickup_time` del cuerpo, no la salida de la ruta; más SIM-005 (con offsets, toda recogida a < ~5 h cuenta tardía: reservas a 1 y 5 min quedaron con `minutes_before_departure = 0`).

**SIM-010 — El rol de cancelación sale del cuerpo.** Escenario 10 ("c3 cancela enviando cancelled_by=..."): el conductor cancela a 10 min con `conductor` -> `late_cancellation: true`; con `pasajero` -> `false`. Un conductor evita la penalización y un pasajero puede marcar "cancelado_por_conductor". Causa: `TripLifecycleController.php:292` usa `input('cancelled_by')` en vez de comparar el usuario con `driver_id`/`passenger_id`.

**SIM-011 — `search-match` p50 9,2 s / p95 24,5 s; el timeout de la app es 6 s.** Escenarios 12 y 11. 133/200 búsquedas > 6 s; tiempo lineal en candidatas (mediana 2,8 s con < 10, 9,6 s con 10-30, 16,8 s con 30-60; ~0,5 s por candidata). La app (`api.js:126`, timeout 6000 ms; `searchMatches` devuelve `[]` ante error) muestra "sin rutas". Causa: `SpatialMatchingService::findMatchesForPassenger` llama en serie a ai-route-service (`/optimize/match`) por candidata, sin límite, paralelismo ni caché, e incluye rutas pasadas y llenas.

**SIM-012 — Rutas con salida pasada: se aceptan y aparecen en la búsqueda.** Escenario 10: `POST /routes` con salida 2 días atrás -> 201 y la devuelve `search-match` (38 resultados con salida pasada en la semana). Causa: `PublishRouteRequest.php:26` solo `date`; `PostGisSpatialRepository::findCandidateRoutes` (línea 27) no filtra `scheduled_departure_time > now()`; `preferred_time` se ignora.

**SIM-013 — "Eliminar cuenta" de la app llama un endpoint inexistente y cierra sesión.** `POST :8001/api/v1/auth/delete-account-direct` -> 404 (sonda `delete-account-direct`). Backend: `DELETE /auth/account` y `POST /auth/delete-account` (`routes/api.php:34-35`). Cliente: `api.js:360`; `mobile/.../profile.tsx:53` hace `logout()` en `finally`: el usuario cree haber borrado su cuenta (Ley 1581).

**SIM-014 — El gateway de producción no enruta `/driver/history` ni `/ratings`.** `bash tools/simulacion/evidencia/gateway_probe.sh` (nginx real con las `location` de `gateway/api-locations.conf`): ambas caen en la SPA (`gateway_probe.txt`). `getDriverHistory` (`api.js:499`) y `submitRating` (`api.js:524`) fallan en producción y el cliente lo oculta (`[]` / `{success:true}`).

### Medios

- **SIM-015** Cancelar un viaje ya cancelado/completado devuelve 200 y crea otra fila de cancelación (escenario 10). `Trip::cancelBy*` y el endpoint no validan estado.
- **SIM-016** Datos inventados: la reserva sin `driver_name/vehicle_plate/vehicle_model` devuelve "Conductor UniWheels", "KLU-492", "Mazda 3" (`TripLifecycleController.php:115-118`); `GET /routes` devuelve a todas las rutas "Carlos Mendoza / KLU-492 / Mazda 3 (Rojo) / 4.9" (`RouteController.php:88-90`, sonda `routes-listado`). El panel de Bienestar lo muestra en viajes reales (`capturas/admin/09_viajes.png`).
- **SIM-017** SOS: acepta viaje solo `confirmado` (esperado 422; `TripTrackingController.php:117`); la respuesta no trae id del evento; atender dos veces sobrescribe la atención (`SosEventService.php:9`). Escenario 9.
- **SIM-018** Cupos sin relación con el vehículo: moto con `available_seats: 3` -> 201, carro de 4 cupos con 6 -> 201 (escenario 3; `PublishRouteRequest.php:28`).
- **SIM-019** `vehicle_id` inexistente -> 503 en vez de 404/422 (`RouteController.php:110,170`, `vehicleValidationFailed()`). Escenario 10.
- **SIM-020** Reputación nunca se calcula (nada escribe `user_reputation_stats`: tras viaje completado y calificación 5, el conductor sigue en `null`/0); la app espera `rating_average`/`total_trips` y recibe `rating_average_driver`/`total_trips_as_driver` (`api.js:534`, `profile.tsx:208`); `POST /ratings` de quien no viajó -> 201. Sondas `reputation-stats`, `ratings-*`.
- **SIM-021** `POST /auth/refresh` con token vencido -> 401, así que el refresh del interceptor de `api.js:44-60` nunca funciona: la app cierra sesión a las 4 h (`JWT_TTL=14400`). Escenario 10.
- **SIM-022** `api.js` finge éxito: `forgotPassword`/`resetPassword` (328-345) y `submitRating` (524) devuelven `{success:true}` sin respuesta; `triggerEmergencySos` (693) traga errores; `searchMatches` devuelve `[]` ante error. Revisión estática.
- **SIM-023** `send-verification-code` limitado a 5/min por IP: 9 respuestas 429 y 555 s para 20 altas; una sede universitaria sale por una IP (NAT).
- **SIM-024** `VehicleController::downloadDocument` toma `auditor_id` y `purpose` del query string (`VehicleController.php:280-285`) para la bitácora Habeas Data: auditor falsificable. Revisión estática (no reproducida).
- **SIM-025** Infra de desarrollo: (a) `./uniwheels migrate`: la migración `2026_10_04_000001_drop_wallet_and_wompi_tables` falla (`must be owner of table wallet_transactions`; tabla de `uniwheels_user`, el resto de `auth_service_role`), el script igual imprime "Migraciones completadas" (`uniwheels:285-297`) y la migración `add_suspended_until_to_users` queda bloqueada detrás (se aplicó con `--path`); falló dos veces con la misma causa. (b) OSRM: `uniwheels_osrm` sale con código 1 por `docker/osrm-data/` vacío; todo corrió con el respaldo geodésico. (c) `./uniwheels start` no termina si se canaliza y arranca `frontend-spa` en :5173.

### Bajos
- **SIM-026** Landing en 390 px: tras abrir el menú y pulsar "Para universidades", la sección queda con `top = 342 px` (`capturas/landing/movil_390_02_universidades.png`).
- **SIM-027** Respaldos falsos en la app: PIN `'4829'` (`PassengerActiveTripCard.tsx:92`, `LiveTripIslandWidget.tsx:98`), tarifa `'$ 4.500'` (`PassengerActiveTripCard.tsx:97`), id de viaje cae a `route.id` (`map.tsx:485`); `getAllVehiclesForAdmin` (`api.js:466`) usa `/vehicles` (vacío para no admin); `checkApprovedVehicle` envía `user_id`/`plate_number` ignorados.
- **SIM-028** `send-verification-code`, `send-sms-code` y `forgot-password` devuelven `data.debug_code` si `APP_ENV=local` y `APP_DEBUG=true`: confirmar que producción no usa `local`.

## Revisión estática de `packages/shared/src/api.js`

| Llamada | Contrato real | Resultado | Bug |
|---|---|---|---|
| `cancelTrip` (`passenger`/`driver`) | `conductor`/`pasajero` | 422 | SIM-004 |
| `deleteAccount` -> `/auth/delete-account-direct` | `/auth/delete-account` | 404 | SIM-013 |
| `getUserReputationStats` | `rating_average_driver`, `total_trips_as_driver`... | campos distintos, siempre 0/null | SIM-020 |
| `getDriverHistory`, `submitRating` | existen en el servicio; sin ruta en el gateway | caen en la SPA | SIM-014 |
| `bookTrip` (`scheduled_pickup_time` = fecha + `T00:00:00`) | base de la penalización | tardía a 3 h | SIM-009 |
| `publishRoute` (hora con `-05:00`) | se guarda sin convertir | 5 h de desfase | SIM-005 |
| `searchMatches` (timeout 6 s, `[]` ante error) | p50 9,2 s | resultados vacíos | SIM-011 |
| interceptor 401 + `/auth/refresh` | exige token vigente | 401 | SIM-021 |
| `getContributionSuggestion`, `publishRoute` (422 con `max_contribution_cop`) | coincide | ok | - |
| `registerDeviceToken`, `unregisterDeviceToken`, `getUserNotifications`, `submitRating` (payload) | coincide (201/200) | ok | - |

## UI web
- **Panel** (`capturas/admin/`, 13 capturas, 0 mensajes de consola, 0 respuestas HTTP >= 400): login `sim_admin`; Vehículos (lista y detalle con documentos); Usuarios (lista, expediente con bitácora, suspender y reactivar); Viajes (174 registros); Alertas SOS (pendiente, atender, atendida); vista móvil. Todo el recorrido funcionó.
- **Landing** (`capturas/landing/`): carga, `#universidades`, modal de privacidad y FAQ en escritorio (4/4) y móvil 390 px (3/4, SIM-026); 0 errores de consola, sin desbordamiento horizontal.

## Observaciones de UX (no son bugs)
- El panel muestra "Conductor UniWheels / KLU-492 / Mazda 3" en viajes reales (efecto de SIM-016); Bienestar no sabe quién viajó.
- El detalle del vehículo lista solo los documentos subidos ("Documentos Obligatorios (1)"); no avisa los faltantes (licencia).
- El modal "Reactivar" no pide motivo; "Suspender" sí.
- `admin/vite.config.js` no define `server.proxy`: con `npm run dev` hace falta un proxy (se usó `tools/simulacion/ui/proxy_local.mjs`).
- No hay viaje de regreso (campus -> casa): `destination_campus_id` es obligatorio; las rutas de la tarde se publicaron con destino en el barrio pero `destination_campus_id` de la sede.
- La búsqueda no pagina ni limita (hasta 60 candidatas).
- Tras reactivarse una suspensión automática, la ventana de 30 días sigue contando las 3 cancelaciones: la siguiente tardía suspende otra vez de inmediato. Confirmar si es lo deseado.

## Limitaciones
- Backend local (`php artisan serve`, un proceso por servicio), OSRM apagado (respaldo geodésico) y `APP_DEBUG=true`; las latencias absolutas de producción pueden diferir, la forma (lineal por candidata) no.
- La app móvil no se manejó: revisión estática, contrastada con el backend.
- Escenarios 1 y 10 y el sondeo de contrato se repitieron con `--merge` tras ajustar el simulador (la primera versión mezclaba SIM-005 con la prueba de rol de cancelación); los demás resultados vienen de la corrida completa.

## Cómo correrlo
Ver `tools/simulacion/README.md`: `MAIL_MAILER=log ./uniwheels start`, luego `python -m simulacion run --all --contrato` y `python -m simulacion --cleanup`. UI: `tools/simulacion/ui/`.


🤖 Generated with [Claude Code](https://claude.com/claude-code)

