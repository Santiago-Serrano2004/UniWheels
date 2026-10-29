> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Backend del panel de administración v1 (revisión segura, SOS, usuarios, viajes, pagos)

**Documento:** `specs/admin-backend-v1.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago (alcance "todo, puntos 1 a 3") — en implementación
**Actualiza:** `specs/mobile-paridad-07-decision-panel-bienestar.md` (el panel sigue en web, pero se quita la aprobación con un clic por correo; ver Tarea 2).

---

## Contexto mínimo (ya investigado, no repetir)

- Todos los servicios Laravel validan el JWT de auth-service con un secreto compartido y dejan en el request `user_id` y `user_roles` (middleware en `app/Http/Middleware` de cada servicio). El rol de admin es `administrador` (spatie en auth-service).
- **Solo auth-service revisa `is_active`**. vehicle, trip, route-matching y notification aceptan cualquier token con firma válida hasta que vence: suspender a un usuario no tiene efecto en esos servicios. Todos usan Redis con `REDIS_CLIENT=predis` (producción: host `redis`, con password).
- vehicle-service ya tiene: `GET /vehicles` (para admin devuelve todos los vehículos, `VehicleController@index`), `GET /vehicles/{vehicleId}/documents/{documentId}/download` (con auditoría de acceso para Habeas Data), `PATCH /vehicles/{vehicleId}/documents/{documentId}/verify`, y **`GET /vehicles/{id}/status?action=approve|reject&token=` (HMAC por correo)**: aprueba o rechaza el vehículo completo sin iniciar sesión, sin revisar los documentos, con un token que no vence. El correo lo manda `VehicleController@store` a `ADMIN_EMAIL` (`SolicitudVehiculoAdminMail`).
- trip-service tiene `trip_sos_events` (sin columnas de atención), `wompi_webhook_events`, `trips` (con `commission_status`, `payment_confirmed_at`, `total_fare_cop`, `platform_commission_cop`). auth-service tiene `wompi_webhook_events` (recargas `WR-`) y la billetera (`user_wallets`, `wallet_transactions`).
- Documentos requeridos por vehículo: `soat` y `licencia_conduccion` siempre; `revision_tecnico_mecanica` si el vehículo la requiere (carro de 5 años o más, moto de 2 años o más; ver `requiereTecnomecanica` en `packages/shared/src/utils/colombianVehicleRules.js`).

## Convenciones

- Rutas de admin bajo el prefijo `/api/v1/admin/...` en cada servicio, detrás de `jwt.auth` y de un middleware `admin` que responde 403 si `user_roles` no incluye `administrador`. Crear ese middleware en cada servicio que lo necesite, igual en todos.
- Validación en Form Requests, lógica en Services/Actions, controladores finos, tests con Pest (convención de `UniWheels/CLAUDE.md`). Listados paginados (`?page=`, `per_page` máximo 50) con filtros por query string.
- `gateway/nginx.prod.conf`: agregar `location ~ ^/api/v1/admin/(vehicles|documents)` → vehicle_service, `^/api/v1/admin/(sos-events|trips|payments/trips)` → trip_service, `^/api/v1/admin/(users|payments/topups)` → auth_service. Van **antes** de las locations genéricas, con `limit_req` como las demás.

## Tareas

### Tarea 1 — Suspensión efectiva en todos los servicios

- auth-service: `PATCH /api/v1/admin/users/{id}/suspension` con `{ suspended: bool, reason: string (obligatoria al suspender) }`. Cambia `is_active` y registra la acción en una nueva tabla `user_suspension_logs` (`user_id`, `admin_user_id`, `action`, `reason`, `created_at`). Al suspender escribe en Redis (facade `Redis`, **no** `Cache`, para que la clave sea la misma para todos los servicios) `uniwheels:suspended_user:{id}` sin TTL; al reactivar la borra. No se puede suspender a otro administrador ni a uno mismo.
- En los 5 servicios, el middleware JWT, después de validar la firma, rechaza con 403 `{"message":"Tu cuenta está suspendida."}` si existe `uniwheels:suspended_user:{user_id}`. Si Redis no responde: dejar pasar y loguear un warning, para no tirar toda la API por Redis.
- Tests: un usuario suspendido recibe 403 en un endpoint protegido de cada servicio (mockear Redis donde haga falta); al reactivarlo vuelve a funcionar; no se puede suspender a un admin.

**Verificación**: `composer test` + `pint --test` en los 5 servicios. Commit: `feat: suspension de usuarios efectiva en todos los servicios`.

### Tarea 2 — Revisión de vehículos segura (vehicle-service)

- `GET /api/v1/admin/vehicles?status=&search=` (placa o marca) paginado, con el conteo de documentos por estado. `GET /api/v1/admin/vehicles/{id}` con sus documentos y el dueño (`user_id`; el nombre lo resuelve el panel llamando a auth).
- Al verificar o rechazar un documento (endpoint existente `.../verify`): si todos los documentos requeridos del vehículo están verificados → vehículo `aprobado`; si alguno fue rechazado → vehículo `rechazado` con `rejection_reason` armado con las notas; en cualquier otro caso queda `pendiente_revision`. Esta lógica va en un Service con tests.
- **Quitar** la ruta `GET /vehicles/{id}/status` (HMAC por correo) y `updateStatusByToken`. `SolicitudVehiculoAdminMail` pasa a ser solo un aviso con un botón "Revisar en el panel" que lleva a `https://admin.uniwheels.org/vehiculos/{id}` (URL base configurable con `ADMIN_PANEL_URL`). Actualizar la vista del correo y quitar la página `vehicle_status_updated` si queda sin uso.
- Agregar una nota al final de `specs/mobile-paridad-07-decision-panel-bienestar.md` explicando por qué se retiró la aprobación por correo (sin sesión, sin revisar documentos, token sin vencimiento).

**Verificación**: tests + pint. Commit: `feat(vehicle-service): revision de vehiculos solo desde el panel con aprobacion por documentos`.

### Tarea 3 — Alertas SOS (trip-service)

- Migración: `trip_sos_events` agrega `attended_at` (nullable), `attended_by_user_id` (nullable uuid) y `attention_notes` (nullable text).
- `GET /api/v1/admin/sos-events?status=pending|attended` paginado, del más reciente al más antiguo, con datos del viaje (conductor, pasajero, placa, direcciones, estado) desde `trips`.
- `PATCH /api/v1/admin/sos-events/{id}/attend` con `{ notes }`.

**Verificación**: tests + pint. Commit: `feat(trip-service): consulta y atencion de alertas SOS para administradores`.

### Tarea 4 — Usuarios (auth-service)

- `GET /api/v1/admin/users?search=&role=&active=` paginado (nombre, correo, código estudiantil, rol, activo, conductor, fecha de registro). `GET /api/v1/admin/users/{id}` con reputación, billetera y el historial de suspensiones.
- `POST /api/v1/admin/users/lookup` con `{ ids: [] }` (máximo 100) → nombre y correo por id, para que el panel muestre nombres en vez de UUID.

**Verificación**: tests + pint. Commit: `feat(auth-service): listado y detalle de usuarios para administradores`.

### Tarea 5 — Viajes y pagos (solo lectura)

- trip-service: `GET /api/v1/admin/trips?status=&from=&to=` paginado. `GET /api/v1/admin/payments/trips?status=` → eventos de `wompi_webhook_events` más el estado de pago y comisión de cada viaje, con totales del período (recaudado, comisión de la plataforma, comisiones pendientes de débito).
- auth-service: `GET /api/v1/admin/payments/topups?status=` → recargas de billetera (`wompi_webhook_events` con referencia `WR-` y las transacciones asociadas).

**Verificación**: tests + pint. Commit: `feat: consulta de viajes y pagos para administradores`.

### Tarea 6 — Gateway

Agregar las locations de `/api/v1/admin/...` de la sección Convenciones en `gateway/nginx.prod.conf` sin tocar las existentes.

**Verificación**: revisión manual del orden de las locations (van antes de las genéricas). Commit: `feat(gateway): rutas de administracion`.

**El despliegue (migraciones, rebuilds, `ADMIN_PANEL_URL`) lo hace Claude.**
