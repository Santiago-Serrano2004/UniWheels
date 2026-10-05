# B3: eliminación real de datos (Ley 1581) y bugs medios y bajos

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/b3-datos-bugs-medios` y abre **un solo PR** contra la rama base.
- **Fuente:** `reportes/simulacion/2026-10-04/REPORTE.md` (SIM-015 a SIM-028) y los hallazgos del PR #15.
- **CI en verde obligatoria.** Revisa `tests/Pest.php` de cada servicio antes de escribir tests; si no existe, usa PHPUnit. No nombres helpers como métodos de `TestCase`.
- **Un commit por punto**, con su test.
- **Ya resueltos, no tocar:** SIM-018 (B1) y SIM-025a. Las migraciones locales fallaban por dueños de tablas en la base de desarrollo del usuario; eso ya se arregló.

## 1. Eliminar cuenta borra los datos de verdad (PRIORIDAD, Ley 1581)
**Hoy:** `AuthController::deleteAccount` hace `is_active = false` + soft delete, y los datos personales siguen en la base. La política publicada promete "eliminar tus datos".

**Cambio en auth-service** (en una transacción):
- Anonimiza al usuario:
  - `name` → "Usuario eliminado";
  - `email` → `deleted+<uuid>@deleted.invalid`;
  - `id_document_number`, `phone_number`, `student_code`, `academic_program_or_department`, `profile_photo_path` y `semester` → null;
  - `password` → un hash aleatorio;
  - `is_active = false` y soft delete.

  **Revisa las columnas reales en la migración de `users`** y anonimiza **todas** las que tengan datos personales.
- Borra la foto de perfil del disco, si existe.
- Revoca el token: agrega el JWT a la lista de bloqueo de Redis, igual que en `logout`.
- **Pide a los otros servicios que borren o anonimicen sus datos** con un endpoint interno `jwt.service` en cada uno: `DELETE /api/v1/internal/users/{id}/personal-data`.
  - **vehicle-service:** borra los archivos de documentos y fotos del disco, borra o anonimiza `vehicle_documents` (número de documento) y marca los vehículos como eliminados (soft delete).
  - **trip-service:**
    - en `trips`, anonimiza los campos de texto con nombres (`driver_name`, `passenger_name`, direcciones de recogida y destino);
    - borra `trip_tracking_points` del usuario;
    - **conserva** los ids y estados, para las estadísticas agregadas.
  - **route-matching:** cancela las rutas futuras del usuario.
  - **notification-service:** borra notificaciones y `device_push_tokens`.
- Si algún servicio falla, auth **igual** completa la anonimización local y registra un warning con el user_id. Deja un `TODO` para reintentos.
- **Elimina la ruta duplicada** `POST /auth/delete-account`; queda solo `DELETE /auth/account`. Verifica con grep que la app y el panel no usen la otra.
- Si `frontend/` usa `delete-account-direct`, **no lo toques**: está congelado.
- **Tests:** el usuario queda anonimizado, ya no puede iniciar sesión, su token queda revocado y se llama a los 4 endpoints internos (`Http::fake`).

## 2. SIM-015: cancelar un viaje ya cancelado o completado
- `cancel` devuelve **409** "Este viaje ya no se puede cancelar." si el estado no es activo, sin crear otra fila de cancelación ni liberar el cupo de nuevo.

## 3. SIM-016: datos inventados
- `TripLifecycleController.php:115-118`: quita los valores por defecto "Conductor UniWheels", "KLU-492" y "Mazda 3". Los datos del conductor y del vehículo se obtienen del servidor: `DriverProfileClient`/`public-summary` vía route-matching, o los que trae `getRoute`. Si no están disponibles, guarda null; no inventes nada.
- `RouteController.php:88-90` (listado `GET /routes`): quita "Carlos Mendoza / KLU-492 / Mazda 3 (Rojo) / 4.9". Usa los datos reales (`getDriverProfile` y `getVehicleSummary` ya existen) o null.
- Busca con grep `Carlos Mendoza|KLU-492|Mazda 3|Conductor UniWheels` en `services/` y en `mobile/src`. Fuera de los tests, no debe quedar ninguna coincidencia.

## 4. SIM-017: SOS
- Solo se acepta en un viaje en curso (`en_camino`, `en_punto_encuentro`, `en_progreso` o los estados activos reales del modelo). Si no → 422.
- La respuesta incluye el `id` del evento.
- Atender un evento ya atendido → 409, sin sobrescribir.

## 5. SIM-019: `vehicle_id` inexistente
- vehicle-service responde 404 en `public-summary`. route-matching distingue: 404 → **422** "El vehículo no existe."; error de red o 5xx → 503.

## 6. SIM-020: reputación
- **Al calificar** (`POST /ratings`, notification-service): solo puede calificar alguien que participó en ese viaje **completado** (verifícalo con trip-service por endpoint interno). Si no → 403. Una sola calificación por persona y viaje → 409.
- **Al calificar o completar un viaje:** actualiza `user_reputation_stats` en auth-service con un endpoint interno: promedio y conteo por rol, y viajes totales.
- **`api.js` y `profile.tsx`:** usa los nombres reales de los campos (`rating_average_driver`, `total_trips_as_driver`, etc.). Revisa la respuesta real de `/user/reputation-stats`.

## 7. SIM-021: renovar la sesión
- `POST /auth/refresh` acepta un token **vencido hace menos de 7 días**, si su firma es válida y no está en la lista de bloqueo. Emite uno nuevo y bloquea el anterior.
- Un token con firma inválida o vencido hace más de 7 días → 401.
- Verifica que el interceptor de `api.js` (l. 44-60) lo use bien.

## 8. SIM-022: `api.js` deja de fingir éxito
- `forgotPassword`, `resetPassword`, `triggerEmergencySos` y `searchMatches` **lanzan el error**, como el resto. `getDriverHistory` y `submitRating` ya se corrigieron en la B2.
- Ajusta sus llamadas en la app para mostrar el mensaje. En el SOS, si falla, muestra un aviso claro y la opción de llamar al 123.

## 9. SIM-023: límite de códigos de verificación
- Cambia el límite de `send-verification-code` de "5 por minuto por IP" a **"5 por minuto por correo + 60 por minuto por IP"**, porque una sede universitaria sale a internet por una sola IP. Aplícalo también a `forgot-password` si tiene el mismo problema.

## 10. SIM-024: bitácora de descargas de documentos
- `VehicleController::downloadDocument`: `auditor_id` sale del JWT, **no** del query string. `purpose` puede venir del query, pero validado contra una lista fija (`verificacion`, `auditoria`).

## 11. SIM-025 b y c: infraestructura de desarrollo
- `./uniwheels migrate`: si alguna migración falla, el script **sale con código distinto de 0** y no imprime "completadas".
- `./uniwheels start`: si OSRM no tiene datos (`docker/osrm-data` vacío), muestra un aviso claro ("OSRM sin datos, se usa respaldo geodésico") y no se queda esperando.
- Si `start` no termina cuando se canaliza su salida, corrígelo para que no dependa de una TTY.

## 12. Bajos
- **SIM-026:** en la landing a 390 px, el ancla `#universidades` debe quedar alineada bajo la navbar. Usa `scroll-margin-top` en las secciones con ancla, igual a la altura de la navbar.
- **SIM-027:**
  - quita los respaldos falsos: PIN `'4829'` en `PassengerActiveTripCard.tsx:92` y `LiveTripIslandWidget.tsx:98`, tarifa `'$ 4.500'`, y el id de viaje que cae a `route.id` en `map.tsx:485`. Si falta el dato, muestra "—" o no muestres el elemento;
  - corrige `getAllVehiclesForAdmin` para que use el endpoint de admin;
  - quita de `checkApprovedVehicle` los parámetros que el backend ignora.
- **SIM-028:** el `debug_code` solo se puede devolver si `APP_ENV=local` **y** `APP_DEBUG=true`. Ya es así: verifícalo y **agrega un test** que garantice que con `APP_ENV=production` nunca aparece.

## Criterios de terminado
1. CI en verde, con el link en el PR.
2. Tabla en el PR: punto o SIM, commit y test.
3. **Nota de despliegue:** qué servicios cambian, migraciones y endpoints internos nuevos.
4. Si algo falla dos veces por la misma causa, detente y documéntalo en el PR. Nada fuera de este alcance.
