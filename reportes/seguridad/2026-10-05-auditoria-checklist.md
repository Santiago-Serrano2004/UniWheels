# Auditoría de seguridad: checklist de 25 puntos

- **Fecha:** 2026-10-05.
- **Alcance:** los 6 servicios backend, `packages/shared`, `mobile`, `admin`, `landing`, el gateway y la VM de producción.
- **Método:** revisión de código con grep dirigido, `php artisan route:list` de cada servicio y pruebas en vivo contra producción, solo de lectura o con datos inválidos.

## Resumen
| Estado | Puntos |
|---|---|
| ✅ Bien | 1, 4, 5, 6, 7, 9, 11, 12, 13, 15, 16, 17, 25 |
| ⚠️ Con hallazgos | 3, 8, 18, 19 (y A2/A3, fuera de la lista) |
| ➖ No aplica | 2 (Next.js), 10 (sin OAuth), 14 (una sola institución; ver `docs/DISENO_MULTI_INSTITUCION.md`), 20 (sin LLM), 21–23 (sin pagos, ADR 0001), 24 (sin Supabase) |

## Hallazgos
| ID | Severidad | Punto | Hallazgo | Estado |
|---|---|---|---|---|
| A1 | **Crítica** | 3 | En producción, auth-service y notification-service **no tenían** `*_SERVICE_URL` y usaban `127.0.0.1` (sí mismos). "Eliminar cuenta" no borraba los datos en los otros 4 servicios (Ley 1581), y calificar o calcular la reputación fallaba | **Corregido en producción** (2026-10-05). Falta llevarlo a `docker-compose.prod.yml` (S1) |
| A2 | **Alta** | 16 | `RegisterRequest` acepta `profile_photo_path` del cliente sin validar, y `AccountErasureService` **borra ese archivo** del disco público. Un usuario podía apuntar a la foto de otro y borrarla al eliminar su cuenta, o mostrar una imagen ajena como suya | S1 |
| A3 | **Alta** | 14/infra | Los 5 servicios se conectan a PostgreSQL con `uniwheels_user`, que es **superusuario**. Ya existen roles por servicio (`*_service_role`), pero no se usan. Si un servicio queda comprometido, quedan expuestas las 5 bases | S2 (operación, con confirmación) |
| A4 | Media | 8 | El código de recuperación de contraseña (6 dígitos, 15 min, un solo uso) **no tiene límite de intentos fallidos**; solo hay throttle de 5/min por IP. Con muchas IP se puede probar por fuerza bruta | S1 |
| A5 | Media | 6/8 | Cambiar la contraseña **no revoca los JWT ya emitidos**: una sesión robada sigue válida hasta 4 h (más la renovación de 7 días) | S1 |
| A6 | Media | 18 | El login solo tiene throttle por IP (10/min). Una sede universitaria sale por una sola IP (NAT), y no hay límite por cuenta | S1 |
| A7 | Baja | 25 | Un login con tipos inválidos (`email` como array) responde **500** en vez de 422. El cuerpo es genérico ("Server Error") y no filtra detalles | S1 |
| A8 | Baja | 2 | La llave de TomTom va en la app (`EXPO_PUBLIC_TOMTOM_API_KEY`, `placesApiService`). Es una llave pensada para clientes, pero sin restricciones cualquiera puede agotar la cuota gratuita | Usuario: restringirla en el panel de TomTom. Más adelante, usar un proxy en el backend |
| A9 | Baja | 3 | Varios `.env.production` tienen variables duplicadas y contradictorias (`127.0.0.1` y nombre de contenedor). Hoy gana la última, que es la correcta, pero es frágil. Ya se limpiaron `APP_ENV`/`APP_DEBUG` | S2 |

## Verificado como correcto
- **(1, 4) Secretos:** no hay secretos en el código ni en el historial de git. Ningún `.env` está versionado (están en `.gitignore`). La configuración no tiene valores por defecto inseguros (`env('JWT_SECRET')` sin default).
- **(5) Contraseñas:** se guardan con `Hash::make` (bcrypt) y el cast `hashed`.
- **(6, 7) JWT:** HS256 con un secreto de 65 caracteres, igual en los 5 servicios. Vence a las 4 h, y hay lista de bloqueo en Redis para logout.
- **(8)** El código de recuperación vence a los 15 min y se borra al usarse.
- **(9)** El registro exige el código enviado al correo antes de crear la cuenta.
- **(11) Rutas:** todas las rutas exigen JWT, salvo login, registro, envío de códigos, instituciones, catálogo de vehículos, lista de espera y la llave VAPID.
- **(12) Datos propios:** vehículos, documentos, viajes, rutas, notificaciones y seguimiento verifican que el recurso pertenezca al usuario (403 si no). La verificación de documentos exige el rol de administrador.
- **(13) Admin:** todas las rutas `/admin/*` usan el middleware de administrador, y está cubierto por tests.
- **(15) SQL:** no hay SQL armado con datos del usuario. Los fragmentos crudos son constantes y el resto usa el ORM o *bindings*.
- **(16) Subidas:** los documentos aceptan pdf/jpg/png de hasta 5 MB, y la foto del vehículo es una imagen de hasta 5 MB, validado en el servidor.
- **(17) XSS:** React escapa el contenido. El mapa (WebView) recibe los datos con `JSON.stringify` y escapa las etiquetas.
- **(19)** forgot-password tiene límite de 5/min por correo y 60/min por IP.
- **(25) Errores:** producción tiene `APP_ENV=production` y `APP_DEBUG=false`, y los 500 devuelven "Server Error" sin traza.
