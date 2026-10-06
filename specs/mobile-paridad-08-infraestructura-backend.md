> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Spec: Paridad móvil 08 — Impacto y Adecuación de Infraestructura y Backend Desplegado

## Contexto mínimo (ya investigado, no repetir)

El backend de UniWheels se encuentra actualmente **desplegado y 100% operativo en producción real** sobre una máquina virtual en la nube (VM Azure `68.155.150.69`, dominio oficial `https://uniwheels.org`). 

La infraestructura actual está orquestada mediante Docker Compose (`docker/docker-compose.prod.yml`) con un API Gateway Nginx (`gateway/nginx.prod.conf`) que gestiona terminación TLS Full (Cloudflare Origin CA), certificados SSL, cabeceras de seguridad y balanceo hacia 6 microservicios independientes:
1. `auth-service` (`:8001` - Laravel 11 / PostgreSQL)
2. `vehicle-service` (`:8002` - Laravel 11 / PostgreSQL)
3. `route-matching-service` (`:8003` - Laravel 11 / PostGIS 16)
4. `trip-service` (`:8004` - Laravel 11 / PostgreSQL)
5. `notification-service` (`:8005` - Laravel 11 / PostgreSQL)
6. `ai-route-service` (`:8006` - FastAPI / Python 3.14)

Con la transición hacia una estrategia de producto **100% cliente móvil nativo** (iOS y Android en Expo), es imperativo adecuar la infraestructura y los servicios desplegados para soportar el tráfico de dispositivos móviles sin fricciones, sin romper el despliegue existente y garantizando máxima compatibilidad.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Migración a Kubernetes o arquitecturas serverless. Se mantiene el stack Docker Compose de producción actual (`docker-compose.prod.yml`).
- **Fuera de alcance:** Reemplazo de bases de datos relacionales. Se mantienen las instancias de PostgreSQL 16 con PostGIS y Redis 7.

---

## Hallazgos de Investigación en el Código Real

### 1. Políticas CORS y Clientes Nativos
- **Diagnóstico:** Los clientes móviles nativos (React Native en Android / iOS que usan motores HTTP nativos como OkHttp y NSURLSession) **no envían la cabecera `Origin`** en sus peticiones HTTP estándar. 
- **Impacto:** Tanto el middleware `HandleCors` de Laravel como `CORSMiddleware` de FastAPI ignoran las restricciones de origen cuando `Origin` está ausente, permitiendo que las peticiones nativas fluyan libremente. Sin embargo, en entornos de desarrollo híbrido (Expo Web, emuladores y pruebas de pasarela Wompi en WebViews), los orígenes `http://localhost:8081` o esquemas personalizados (`uniwheels://`) pueden ser bloqueados si la configuración es estricta.
- **Acción requerida:** Estandarizar la configuración CORS en `services/*` para permitir orígenes de desarrollo móvil y WebViews sin comprometer la seguridad.

### 2. Backend de Notificaciones Push (FCM / APNs)
- **Diagnóstico:** `services/notification-service` solo implementa Web Push (`WebPushService.php` con protocolo VAPID) y la tabla `push_subscriptions` está atada a claves `p256dh` y `auth` exclusivas de navegadores web.
- **Impacto:** Los teléfonos móviles no pueden registrar suscripciones VAPID nativamente sin un Service Worker de navegador.
- **Acción requerida:** Crear la tabla `device_push_tokens`, implementar el despachador `ExpoPushService.php` (que utiliza el Expo Push API oficial para enrutar automáticamente hacia FCM en Android y APNs en iOS sin costo ni gestión de certificados binarios complejos en PHP), y actualizar `NotificationController` para enviar a ambos canales.

### 3. Subida de Archivos y Documentos (Multipart)
- **Diagnóstico:** `vehicle-service` (`UploadDocumentRequest.php`) valida archivos con `'document_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'`. `nginx.prod.conf` tiene configurado `client_max_body_size 10M;`.
- **Impacto:** El backend ya está perfectamente capacitado para procesar `multipart/form-data` binario. `expo-image-picker` en React Native envía datos multipart compatibles mediante objetos `{ uri, name, type }`.
- **Acción requerida:** Asegurar que los clientes HTTP en `packages/shared/src/api.js` no sobrescriban el header `Content-Type` forzando un string plano sin `boundary`, permitiendo que Axios/FormData configure el delimitador multipart automáticamente.

### 4. API Gateway Nginx (`gateway/nginx.prod.conf`)
- **Diagnóstico:**
  - Rate limits: La zona `api_gateway_limit` tiene `rate=40r/s` con `burst=30 nodelay`. Con telemetría GPS cada 5s por conductor y polling cada 5s por pasajero, 50 usuarios concurrentes en la misma red Wi-Fi universitaria (misma IP pública) consumen ~20 r/s.
  - Cabeceras de seguridad: `Permissions-Policy` y `Content-Security-Policy` son ignoradas por las apps móviles nativas (solo aplican al navegador), por lo que no interfieren con la cámara o GPS del celular.
- **Acción requerida:** Aumentar el límite de ráfaga y tasa en `nginx.prod.conf` para tráfico de tracking en `/api/v1/trips` previendo alta concurrencia de estudiantes compartiendo la IP pública de la universidad.

---

## Tareas

### Tarea 1 — Migración y Modelo `DevicePushToken` en `notification-service`

**Archivos:**
- `services/notification-service/database/migrations/2026_09_22_000001_create_device_push_tokens_table.php`
- `services/notification-service/app/Models/DevicePushToken.php`

**Instrucciones:**
1. Crear la migración para almacenar tokens push de dispositivos móviles:
   ```php
   Schema::create('device_push_tokens', function (Blueprint $table) {
       $table->uuid('id')->primary();
       $table->uuid('user_id')->index();
       $table->string('token', 255)->unique();
       $table->string('platform', 20)->default('expo'); // 'android', 'ios', 'expo'
       $table->string('device_name', 100)->nullable();
       $table->string('app_version', 20)->nullable();
       $table->boolean('is_active')->default(true);
       $table->timestamp('last_used_at')->nullable();
       $table->timestamps();
   });
   ```
2. Crear el modelo Eloquent `DevicePushToken`:
   - `$fillable = ['user_id', 'token', 'platform', 'device_name', 'app_version', 'is_active', 'last_used_at']`.
   - `$casts = ['is_active' => 'boolean', 'last_used_at' => 'datetime']`.
   - Scope `scopeActiveForUser($query, $userId)`.

**Verificación:** Ejecutar `php artisan migrate` en `notification-service` y verificar creación de tabla.

**Mensaje de commit:** `feat(notification-service): migracion y modelo DevicePushToken para push nativo`

---

### Tarea 2 — Servicio `ExpoPushService.php` y Endpoints de Registro

**Archivos:**
- `services/notification-service/app/Services/ExpoPushService.php`
- `services/notification-service/app/Http/Controllers/Api/V1/DeviceTokenController.php`
- `services/notification-service/routes/api.php`

**Instrucciones:**
1. Implementar `ExpoPushService.php`:
   - Enviar notificaciones hacia `https://exp.host/--/api/v2/push/send` utilizando `Illuminate\Support\Facades\Http`:
   ```php
   public function sendToUser(string $userId, string $title, string $body, array $payload = []): void
   {
       $tokens = DevicePushToken::activeForUser($userId)->pluck('token')->toArray();
       if (empty($tokens)) return;

       $messages = array_map(fn($t) => [
           'to' => $t,
           'sound' => 'default',
           'title' => $title,
           'body' => $body,
           'data' => $payload,
           'priority' => 'high',
           'channelId' => 'trip_alerts',
       ], $tokens);

       $response = Http::post('https://exp.host/--/api/v2/push/send', $messages);
       // Si el token es inválido (DeviceNotRegistered), marcar is_active = false
   }
   ```
2. Crear `DeviceTokenController.php`:
   - `store(Request $request)`: Valida token, plataforma, y ejecuta `updateOrCreate` asociando el `user_id` autenticado.
   - `destroy(Request $request)`: Desactiva el token al cerrar sesión.
3. Registrar rutas en `notification-service/routes/api.php` bajo middleware `jwt.auth`:
   - `POST /push/device-tokens`
   - `POST /push/device-tokens/remove`
4. Actualizar `NotificationController::send()` para invocar tanto `WebPushService` como `ExpoPushService`.

**Verificación:** Enviar una petición `POST /push/device-tokens` con token de prueba y comprobar respuesta 201 en base de datos.

**Mensaje de commit:** `feat(notification-service): servicio ExpoPushService y endpoints de gestion de device tokens`

---

### Tarea 3 — Ajuste de Rate Limits en `gateway/nginx.prod.conf` para Telemetría de Campus

**Archivo:** `gateway/nginx.prod.conf`.

**Instrucciones:**
1. Ajustar la zona de limitación de tasa para permitir la concurrencia esperada en horas pico de salida universitaria:
   ```nginx
   # Aumentar zona de API Gateway para soportar telemetría GPS continua desde NATs universitarios
   limit_req_zone $binary_remote_addr zone=api_gateway_limit:10m rate=80r/s;
   limit_req_zone $binary_remote_addr zone=tracking_limit:10m rate=100r/s;
   ```
2. Añadir bloque específico con límites holgados para la ruta de telemetría de viajes:
   ```nginx
   # --- Microservicio de Ciclo de Vida del Viaje y Telemetría (:8004) ---
   location ~ ^/api/v1/trips/[^/]+/tracking {
       limit_req zone=tracking_limit burst=50 nodelay;
       proxy_pass http://trip_service;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto https;
   }
   ```

**Verificación:** Ejecutar `docker compose -f docker/docker-compose.prod.yml exec gateway nginx -t` para validar la sintaxis de configuración.

**Mensaje de commit:** `perf(gateway): optimizar rate limits de nginx para telemetria GPS en alta concurrencia`

---

### Tarea 4 — Compatibilidad de Subida Multipart en `packages/shared/src/api.js`

**Archivo:** `packages/shared/src/api.js`.

**Instrucciones:**
1. En el método `uploadDocument` de `vehicleService`:
   ```javascript
   async uploadDocument(vehicleId, formData) {
     try {
       const response = await vehicleApiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
         headers: {
           // Dejar que Axios configure automáticamente el Content-Type multipart con su boundary único
           'Content-Type': 'multipart/form-data',
         },
         transformRequest: (data) => data, // Evitar serializaciones JSON en React Native
       });
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al subir el archivo del documento.' };
     }
   }
   ```
2. Replicar la misma configuración para `registerVehicle` cuando se incluya `perspective_photo`.

**Verificación:** Subir un archivo de imagen simulado en FormData y comprobar que el backend recibe el archivo binario intacto.

**Mensaje de commit:** `fix(shared): asegurar compatibilidad de headers multipart/form-data en axios`

---

## Matriz de Verificación de Infraestructura

| ID Prueba | Componente | Acción / Petición | Resultado Esperado | ¿Verificado? |
| :--- | :--- | :--- | :--- | :---: |
| INF-01 | Gateway Nginx | Enviar 60 req/s a `/api/v1/trips/{id}/tracking` | HTTP 200/201 (no 429 Too Many Requests) | [ ] |
| INF-02 | Notification Service | Registrar token `ExponentPushToken[...]` | Inserta en `device_push_tokens` con `is_active: true` | [ ] |
| INF-03 | Dispatcher Push | Disparar evento de viaje (`POST /notifications/send`) | Entrega push a Expo Push API con código 200 | [ ] |
| INF-04 | Vehicle Service | Subir PDF de SOAT de 4MB desde mobile | HTTP 201, archivo almacenado en disco privado R2/local | [ ] |
| INF-05 | CORS Gateway | Petición HTTP sin cabecera `Origin` | Petición procesada exitosamente sin rechazo CORS | [ ] |
