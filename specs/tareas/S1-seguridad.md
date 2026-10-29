# S1: correcciones de seguridad (auditoría del checklist)

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/s1-seguridad` y abre **un solo PR** contra la rama base.
- **Fuente:** `reportes/seguridad/2026-10-05-auditoria-checklist.md` (IDs A1–A7).
- **CI en verde obligatoria.** auth-service usa **Pest**; revisa `tests/Pest.php` en los demás antes de escribir tests.
- **Un commit por ID, cada uno con su test.** Haz push después de cada commit.

## A1: direcciones internas en compose
`docker/docker-compose.prod.yml`: agrega en `environment` de **auth-service** `VEHICLE_SERVICE_URL`, `ROUTE_MATCHING_SERVICE_URL`, `TRIP_SERVICE_URL` y `NOTIFICATION_SERVICE_URL`, y en **notification-service** `AUTH_SERVICE_URL` y `TRIP_SERVICE_URL`. Usa nombres de contenedor: `http://vehicle-service:8002`, `http://route-matching-service:8003`, `http://trip-service:8004`, `http://notification-service:8005` y `http://auth-service:8001`.
- Revisa **todos** los servicios: si alguno llama a otro (grep `config('services.*.url')`) y su `environment` no define esa URL, agrégala.
- Documenta las variables en `docker/DEPLOY.md`.
- **Test:** un script en `scripts/` que lea el compose con `yaml` (Python) y verifique que cada `services.<x>.url` usado en `config/services.php` de cada servicio tenga su variable en el `environment` de ese servicio. Súmalo a la CI como un paso barato.

## A2: la foto de perfil no la decide el cliente
- `RegisterRequest`: elimina `profile_photo_path` y `profile_photo`.
- `AuthController::register`: no guardes `profile_photo_path` desde el request.
- `AccountErasureService`: solo borra la foto si la ruta empieza con `profile-photos/` y no contiene `..`. Cualquier otra ruta se ignora y se registra un warning.
- Verifica con grep que la app y el panel no envíen `profile_photo_path`; si lo envían, quítalo.
- **Tests:**
  - registrar con `profile_photo_path` → el campo queda null;
  - eliminar una cuenta con `profile_photo_path = 'profile-photos/../vehicle-docs/x.pdf'` o con una ruta de otro usuario fuera de `profile-photos/` → no se borra nada (`Storage::fake`).

## A4: límite de intentos del código de recuperación
- En `resetPassword`, cuenta los intentos fallidos por correo en la caché (`password_reset_attempts_{correo}`, mismo TTL que el código).
- Al **5.º fallo**, borra el código y responde 422 con "Demasiados intentos. Solicita un código nuevo.".
- El throttle de la ruta pasa a ser **5/min por correo y 30/min por IP** (un `RateLimiter` nombrado, como `verification-code`).
- **Test:** 5 códigos incorrectos invalidan el código: el 6.º intento con el código correcto también falla.

## A5: revocar las sesiones al cambiar la contraseña
- Al cambiar la contraseña (reset) y al eliminar la cuenta, guarda en Redis `uniwheels:tokens_valid_after:{user_id}` = timestamp actual, con un TTL igual a la ventana de renovación (7 días) más el TTL del token.
- En `JwtAuthenticate` de auth **y en `JwtVerifier`/middleware de los otros 4 servicios**: si existe esa llave y el `iat` del token es menor que el valor guardado → **401** "Tu sesión ya no es válida. Inicia sesión de nuevo.". Usa el **mismo prefijo de Redis** que la suspensión.
- `/auth/refresh` también rechaza esos tokens.
- **Tests:**
  - en auth: un token emitido antes del reset da 401 y uno posterior da 200;
  - en trip: con la llave escrita, un token viejo da 401.

## A6: límite de intentos de login por cuenta
- `/auth/login` pasa a usar un `RateLimiter` nombrado `login`: **5/min por correo** y **30/min por IP**.
- Al superarlo → 429 con "Demasiados intentos. Espera un minuto.".
- **Test:** el 6.º intento con el mismo correo en un minuto da 429, y otro correo desde la misma IP sigue permitido.

## A7: entradas mal tipadas → 422, no 500
- `LoginRequest` (o la validación de login): `email` → `['required', 'string', 'email']` y `password` → `['required', 'string']`.
- Revisa con grep los FormRequest de los 5 servicios: todo campo de texto que se use en una consulta o comparación debe tener `string`. Corrige los que falten, **sin cambiar reglas de negocio**.
- **Test:** login con `email` de tipo array → 422.

## Criterios de terminado
- CI en verde, con el link en el PR.
- Tabla en el PR: ID, commit y test.
- **Nota de despliegue:** se reconstruyen los 5 servicios. A5 toca a todos. A1 cambia el compose, así que hay que recrear auth y notification.
- Si algo falla dos veces por la misma causa, detente y documéntalo. Nada fuera de este alcance.
