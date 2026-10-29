# Diseño: UniWheels para varias instituciones (multi-tenant)

- **Estado:** diseño aprobado para **implementar cuando exista un segundo cliente** (ADR 0001, decisión 6). Hoy **no se implementa**.
- **Fecha:** 2026-10-05.

## 1. Situación actual (verificada en el código)
| Aspecto | Hoy |
|---|---|
| Institución | Tabla `institutions` en auth-service, con **un solo** `domain` (único) por institución |
| Sedes | `institution_campuses` (FK `institution_id`, lat/lng, `code` único por institución) |
| Usuario | `users.institution_id` y `users.campus_id`. El registro valida el correo contra `institutions.domain` (`InstitutionalEmailRule`) |
| JWT | Claims `iss`, `sub`, `roles` y `exp`. **No incluye la institución** |
| Otros servicios | vehicle, route-matching, trip y notification **no guardan `institution_id`**. Las rutas solo guardan `destination_campus_id` |
| Administrador | El rol global `administrador` ve **todo**. `EnsureAdmin` en auth, vehicle y trip solo revisa el rol |
| Parámetros de negocio | `CONTRIBUTION_*` (route-matching) y `LATE_CANCEL_*` (trip) son **globales**, por variables de entorno |
| Mobile y shared | `INSTITUCIONES_PREDETERMINADAS` tiene una sola institución fija como respaldo |

**Problema:** con dos universidades en el mismo despliegue, un estudiante de A vería rutas de B, y el administrador de A vería usuarios, vehículos y SOS de B.

## 2. Objetivos
1. **Aislamiento:** cada usuario solo ve y se empareja con personas de su institución. Cada administrador solo ve su institución.
2. **Configuración por institución:** dominios de correo, sedes, parámetros de aporte, reglas de cancelación y marca (logo e imagen).
3. **Un solo despliegue** compartido, sin una base de datos por cliente. El costo de infraestructura no debe crecer por cada cliente.
4. **Migración sin cortar el servicio** para la institución actual.

**Fuera de alcance:** viajes entre instituciones distintas, facturación automática y autoservicio de alta de instituciones.

## 3. Decisiones de diseño

### 3.1 Modelo: base compartida con columna `institution_id` (*shared schema*)
- Cada tabla de dominio que pertenece a una institución lleva `institution_id`.
- Se descartan: una base de datos por cliente (multiplica costo y operación con 1 a 10 clientes) y un esquema PostgreSQL por cliente (complica las migraciones en 5 servicios).
- Con decenas de clientes el aislamiento por columna es suficiente, siempre que se aplique en un solo lugar del código (3.4).

### 3.2 La institución viaja en el JWT
- auth-service agrega el claim **`inst`** (`institution_id`) al emitir el token.
- Los demás servicios **nunca confían en un `institution_id` enviado por el cliente**: lo toman del JWT verificado, igual que hoy hacen con `driver_id`.
- Los tokens de servicio (`jwt.service`) no llevan `inst`. En las llamadas internas, la institución va como parámetro explícito y el servicio receptor la valida contra el recurso.

### 3.3 Dominios de correo
- Nueva tabla `institution_email_domains` (`institution_id`, `domain` único), que permite varios dominios por institución (por ejemplo, estudiantes y docentes).
- `InstitutionalEmailRule` valida contra esta tabla.
- Se migra el `institutions.domain` actual como primer registro. La columna se mantiene un ciclo por compatibilidad y luego se elimina.

### 3.4 Aislamiento en cada servicio Laravel
- Un trait `BelongsToInstitution` con un **global scope** que filtra por el `inst` del request, y que en `creating` asigna `institution_id` desde el JWT.
- Un middleware `ResolveInstitution` pone el `inst` del JWT en el contexto del request (un singleton `CurrentInstitution`). Sin `inst` en una ruta de usuario, responde 403.
- Los comandos, jobs y llamadas de servicio usan `CurrentInstitution::run($id, fn)` o desactivan el scope **explícitamente**. Nunca por defecto.
- **Tablas afectadas:**

| Servicio | Tablas que reciben `institution_id` |
|---|---|
| auth | `users` (ya lo tiene), `user_suspension_logs` (por consulta) |
| vehicle | `vehicles`, `vehicle_documents` |
| route-matching | `routes`, `trip_requests` |
| trip | `trips`, `trip_cancellations`, `trip_sos_events`, `trip_tracking_points` |
| notification | `notifications`, `device_push_tokens` |

- **PostGIS:** el emparejamiento (`ST_DWithin` en `routes`) agrega `institution_id = ?` **antes** del filtro espacial. Para eso se crea un índice compuesto `(institution_id, status)` además del GiST actual.

### 3.5 Administradores por institución
- El rol `administrador` pasa a ser **de institución**: su token lleva `inst` y el global scope limita lo que ve.
- Nuevo rol `superadmin` (operador de UniWheels), sin scope, para dar de alta instituciones y dar soporte. Lo revisa un `EnsureSuperAdmin` aparte.
- `EnsureAdmin` sigue revisando el rol; el aislamiento lo garantiza el scope, no el middleware.

### 3.6 Parámetros por institución
- Nueva tabla `institution_settings` en auth-service: `institution_id`, `contribution_car_base`, `contribution_car_per_km`, `contribution_moto_base`, `contribution_moto_per_km`, `late_cancel_threshold`, `late_cancel_window_days`, `late_cancel_suspension_days` y `brand_primary_color` (nullable).
  - Si una columna es null, se usa el valor por defecto de las variables de entorno actuales.
- auth expone `GET /internal/institutions/{id}/settings` (`jwt.service`).
- route-matching y trip lo **cachean en Redis por 10 minutos**, con la llave `uniwheels:inst_settings:{id}`.
- `ContributionCalculator::suggest` y `LateCancellationPolicy` reciben los parámetros en vez de leer `config()` directamente.

### 3.7 App móvil
- El registro ya pide la institución. Se quita la dependencia de `INSTITUCIONES_PREDETERMINADAS` como fuente de verdad: queda solo como respaldo visual y siempre se prefiere la API.
- Logo, imagen de bienvenida y sedes salen de la institución del usuario (`/auth/me`).
- La app no necesita saber el `inst`: el backend filtra con el JWT.

## 4. Plan de migración (cuando llegue el segundo cliente)
Cada paso se puede desplegar solo y sin cortar el servicio.

1. **auth:**
   - crear `institution_email_domains` y `institution_settings`;
   - migrar el dominio actual;
   - agregar `inst` al JWT, sin que nadie lo use todavía.
2. **Los demás servicios:**
   - agregar `institution_id` **nullable** a las tablas de 3.4;
   - hacer el *backfill* con el `id` de la institución actual (todos los datos de hoy son de ella);
   - cambiar la columna a NOT NULL.
3. Activar `ResolveInstitution` y el global scope **servicio por servicio**, con tests de aislamiento (punto 5).
4. Pasar los parámetros de negocio a `institution_settings`.
5. Crear el rol `superadmin` y convertir el administrador actual en administrador de institución.
6. Dar de alta la segunda institución: dominios, sedes, parámetros y su administrador.

**Rotación de tokens:** los tokens emitidos antes del paso 1 no traen `inst`. Durante una ventana igual al `ttl` del JWT, el middleware puede resolver la institución leyendo `users.institution_id` (solo en auth). Después, un token sin `inst` responde 401 y obliga a iniciar sesión de nuevo.

## 5. Pruebas obligatorias de aislamiento
En cada servicio, con dos instituciones A y B:
- el usuario de A **no** ve rutas, vehículos, viajes ni notificaciones de B, ni por listado ni por id directo (404, no 403, para no revelar que existen);
- el emparejamiento de un pasajero de A nunca devuelve rutas de B, aunque estén a 10 metros;
- el administrador de A no lista ni modifica usuarios, vehículos ni SOS de B;
- un `institution_id` enviado en el body o en la query se ignora;
- la suspensión automática y el aporte sugerido usan los parámetros de la institución correcta.

## 6. Riesgos
| Riesgo | Mitigación |
|---|---|
| Una consulta sin scope filtra datos de otra institución | Global scope por defecto, desactivación solo explícita, tests del punto 5 y revisión de cada `withoutGlobalScope` |
| Comandos o jobs sin contexto de institución | `CurrentInstitution::run` obligatorio; sin contexto, el scope **falla cerrado** (no devuelve nada) |
| Rendimiento del emparejamiento | Índice compuesto y filtro por `institution_id` antes de `ST_DWithin` |
| Ley 1581: cada institución es responsable o encargada de sus datos | Contrato de transmisión de datos por institución, y una política que nombre a la institución |

## 7. Estimación
Unas 10 a 14 tareas pequeñas en el formato de `specs/tareas/`: 1 a 2 por servicio, más app, panel y tests de aislamiento. Se escriben como specs cuando haya un cliente firmado.
