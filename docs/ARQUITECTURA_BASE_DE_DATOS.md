# Arquitectura de Base de Datos Distribuida — UniWheels

Este documento detalla el esquema de datos físico y lógico implementado en **PostgreSQL 16** y **PostGIS 3.4** bajo el patrón **Database-per-Service**, documentando las estrategias de indexación, transaccionalidad ACID y cumplimiento normativo.

---

## 1. Mapa General de Bases de Datos

```text
├── auth_db             (Identidad, Perfil UNAB, Roles Spatie, Billeteras Prepago y Reputación)
├── vehicle_db          (Vehículos, Catálogo Marcas NHTSA, Documentos Legales y Habeas Data)
├── route_gis_db        (Rutas PostGIS SRID 4326, Paradas e Índices Espaciales GiST)
├── trip_db             (Viajes, Máquina de Estados, PIN de Abordaje, Índices Compuestos y Liquidación)
└── notification_db     (Calificaciones 1 a 5 estrellas, Reportes de Seguridad y Notificaciones)
```

---

## 2. Diccionario de Datos y Reglas por Microservicio

### 2.1. Base de Datos: `auth_db`

#### Tabla: `institutions` e `institution_campuses`
* **`institutions`**: Identificador `id` (`bigserial`), nombre oficial (*Universidad Autónoma de Bucaramanga*), acrónimo `code` (*UNAB*), dominio requerido `domain` (*unab.edu.co*) e imagen de bienvenida `welcome_image_url`.
* **`institution_campuses`**: Sedes oficiales (`Campus El Jardín` con `is_main_campus = true`, `Campus El Bosque`, `CSU Terrazas`, `Campus La Casona`) con coordenadas GPS y dirección física.

#### Tabla: `users`
* `id` (`uuid`, PK): Identificador universal UUIDv7.
* `institution_id` / `campus_id` (`bigint`, FK): Relación institucional.
* `name`, `email` (UNIQUE), `id_document_number` (UNIQUE), `id_document_type` (`CC`, `CE`), `phone_number`.
* `member_type` (`estudiante`, `docente`, `administrativo`), `student_code` (`UXXXXXXXX`), `semester`.
* `is_driver` (`boolean`), `is_active` (`boolean`), `verification_expires_at` (`timestamptz`).
* `deleted_at` (`timestamptz`): Soporte de **borrado lógico (*Soft Deletes*)** para cumplimiento de Habeas Data e integridad de auditoría histórica.

#### Tablas: `user_wallets` y `wallet_transactions` (Control de Concurrencia)
* **`user_wallets`**: Saldo prepago en pesos colombianos (`balance_cop`) y estado de bloqueo (`is_locked`).
* **`wallet_transactions`**: Bitácora inmutable con doble contabilidad (`balance_before_cop`, `amount_cop`, `balance_after_cop`, `reference_id`, `status`).
* **Bloqueo Pesimista (*Pessimistic Locking*):** Todas las operaciones financieras son gestionadas por `WalletTransactionService` mediante `UserWallet::where('user_id', $id)->lockForUpdate()->firstOrFail();` dentro de transacciones atómicas `DB::transaction()`.

---

### 2.2. Base de Datos: `vehicle_db`

#### Tabla: `vehicles`
* `id` (`uuid`, PK), `user_id` (`uuid`), `vehicle_type` (`carro`, `moto`), `plate_number` (`varchar(15)`, UNIQUE).
* `brand`, `model_line`, `year`, `color`, `available_seats`, `has_ac`, `has_trunk`, `has_extra_helmet`.
* `status` (`pendiente_revision`, `aprobado`, `rechazado`, `documento_vencido`), `rejection_reason`.

#### Tablas: `vehicle_documents` y `document_access_logs` (Habeas Data Ley 1581/2012)
* **`vehicle_documents`**: Archivos de SOAT, Licencia y RTM almacenados en almacenamiento privado seguro (`storage/app/private/`).
* **`document_access_logs`**: Registro inmutable de cada consulta con `auditor_user_id`, `target_user_id`, `document_type`, `access_purpose`, `ip_address`, `user_agent` y `file_hash_sha256`.

---

### 2.3. Base de Datos: `route_gis_db` (PostGIS 3.4 Espacial)

#### Tabla: `routes`
* `id` (`uuid`, PK), `driver_id` (`uuid`), `vehicle_id` (`uuid`).
* `origin_name` (`varchar(150)`), `destination_campus_id` (`bigint`), `destination_campus_name` (`varchar(100)`).
* `scheduled_departure_time`, `target_arrival_time`, `estimated_duration_minutes`, `available_seats`, `base_contribution_cop`.
* **Columnas de Geometría PostGIS (SRID 4326):**
  * `path_geometry`: `GEOMETRY(LineString, 4326)`
  * `origin_geom`: `GEOMETRY(Point, 4326)`
  * `destination_geom`: `GEOMETRY(Point, 4326)`
* **Índices Espaciales GiST:**
  ```sql
  CREATE INDEX idx_routes_path_geometry ON routes USING GIST (path_geometry);
  CREATE INDEX idx_routes_origin_geom ON routes USING GIST (origin_geom);
  CREATE INDEX idx_routes_destination_geom ON routes USING GIST (destination_geom);
  ```
* **Mantenimiento Espacial:** Comando Artisan `php artisan postgis:maintain` para ejecutar `VACUUM ANALYZE` en tablas espaciales.

---

### 2.4. Base de Datos: `trip_db`

#### Tabla: `trips`
* `id` (`uuid`, PK), `route_id` (`uuid`), `driver_id` (`uuid`), `passenger_id` (`uuid`), `vehicle_id` (`uuid`).
* `driver_name`, `passenger_name`, `vehicle_plate`, `vehicle_model`, `pickup_address`, `dropoff_address`.
* `boarding_pin` (`varchar(10)`), `is_pin_verified` (`boolean`), `pin_verified_at` (`timestamptz`).
* `total_fare_cop` (`decimal(10,2)`), `driver_amount_cop`, `platform_commission_cop` (12%), `commission_status`.
* `status` (`solicitado`, `confirmado`, `en_camino`, `recogido`, `completado`, `cancelado_por_conductor`, `cancelado_por_pasajero`).
* **Índices Compuestos de Alto Rendimiento:**
  ```sql
  CREATE INDEX idx_trips_driver_status_scheduled ON trips (driver_id, status, scheduled_pickup_time);
  CREATE INDEX idx_trips_passenger_status_scheduled ON trips (passenger_id, status, scheduled_pickup_time);
  ```

---

### 2.5. Base de Datos: `notification_db`

#### Tabla: `ratings`
* `id` (`uuid`, PK), `trip_id` (`uuid`), `rater_user_id` (`uuid`), `rated_user_id` (`uuid`).
* `role_rated` (`conductor`, `pasajero`), `score` (`tinyint`, 1 a 5 estrellas), `optional_comment` (`text`).
* `UNIQUE (trip_id, rater_user_id, rated_user_id)`.
