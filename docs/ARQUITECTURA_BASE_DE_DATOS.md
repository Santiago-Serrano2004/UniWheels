# Arquitectura de Base de Datos Distribuida — UniWheels

Este documento detalla el esquema de datos físico y lógico implementado en PostgreSQL 16 y PostGIS 3.4 bajo el patrón Database-per-Service.

---

## 1. Mapa General de Bases de Datos

```text
├── auth_db             (Identidad, Perfil UNAB, Roles Spatie, Billeteras y Reputación)
├── vehicle_db          (Vehículos, Catálogo Marcas NHTSA, Documentos Legales y Habeas Data)
├── route_gis_db        (Rutas PostGIS SRID 4326, Paradas e Índices Espaciales GiST)
├── trip_db             (Viajes, Historial de Estados, Cancelaciones y Telemetría GPS)
└── notification_db     (Calificaciones, Reportes de Seguridad y Notificaciones)
```

---

## 2. Diccionario de Datos por Microservicio

### 2.1. Base de Datos: `auth_db`

#### Tabla: `institutions`
* `id` (`bigserial`, PK): Identificador secuencial de la universidad.
* `name` (`varchar(150)`): Nombre oficial de la institución (ej: *Universidad Autónoma de Bucaramanga*).
* `code` (`varchar(20)`, UNIQUE): Acrónimo institucional (*UNAB*).
* `domain` (`varchar(100)`): Dominio requerido de correo electrónico (*unab.edu.co*).
* `is_active` (`boolean`): Estado de admisión en la plataforma.

#### Tabla: `institution_campuses`
* `id` (`bigserial`, PK): Identificador secuencial de la sede.
* `institution_id` (`bigint`, FK): Relación con `institutions`.
* `name` (`varchar(100)`): Nombre de la sede (*Campus El Jardín*, *Campus El Bosque*, *CSU Terrazas*, *La Casona*).
* `code` (`varchar(30)`): Código de sede (*JARDIN*, *BOSQUE*, *CSU*, *CASONA*).
* `address` (`varchar(200)`): Dirección física oficial.
* `latitude` / `longitude` (`decimal(10,7)`): Coordenadas GPS del campus.

#### Tabla: `users`
* `id` (`uuid`, PK): Identificador universal UUID v7 del usuario.
* `institution_id` (`bigint`, FK): Universidad de pertenencia.
* `campus_id` (`bigint`, FK, Nullable): Sede principal del usuario.
* `name` (`varchar(120)`): Nombre completo.
* `email` (`varchar(150)`, UNIQUE): Correo institucional `@unab.edu.co`.
* `id_document_number` (`varchar(30)`, UNIQUE): Cédula de ciudadanía o extranjería.
* `id_document_type` (`varchar(10)`): Tipo de documento (*CC*, *CE*).
* `phone_number` (`varchar(20)`): Teléfono móvil para contacto de viaje.
* `member_type` (`varchar(30)`): Tipo de miembro (*estudiante*, *docente*, *administrativo*).
* `student_code` (`varchar(20)`, Nullable): Código estudiantil formato `UXXXXXXXX`.
* `academic_program_or_department` (`varchar(120)`): Programa académico o área administrativa.
* `semester` (`smallint`, Nullable): Semestre cursado (1 a 12).
* `profile_photo_path` (`varchar(255)`, Nullable): Ruta de la foto de perfil en almacenamiento.
* `is_driver` (`boolean`): Bandera de registro como conductor.
* `is_active` (`boolean`): Estado de la cuenta.
* `verification_expires_at` (`timestamptz`): Fecha límite de validez semestral (6 meses).
* `deleted_at` (`timestamptz`, Nullable): Borrado lógico.

#### Tabla: `user_reputation_stats`
* `id` (`uuid`, PK): Identificador único.
* `user_id` (`uuid`, FK UNIQUE): Usuario evaluado.
* `total_trips_as_driver` / `total_trips_as_passenger` (`integer`): Contador acumulado de viajes completados.
* `rating_sum_as_driver` / `rating_sum_as_passenger` (`decimal(8,2)`): Sumatoria de puntuaciones.
* `rating_count_as_driver` / `rating_count_as_passenger` (`integer`): Cantidad de calificaciones recibidas.
* *Regla de Visibilidad:* No se expone promedio público hasta alcanzar un mínimo de 3 viajes completados.

#### Tabla: `user_wallets` y `wallet_transactions`
* `user_wallets`: Saldo prepago en pesos colombianos (`balance_cop`) y estado de bloqueo (`is_locked`).
* `wallet_transactions`: Bitácora inmutable con tipo de transacción (*recarga_pse*, *recarga_nequi*, *debito_comision_viaje*, *reembolso*), saldo anterior, monto y saldo posterior.

---

### 2.2. Base de Datos: `vehicle_db`

#### Tabla: `vehicles`
* `id` (`uuid`, PK): Identificador del vehículo.
* `user_id` (`uuid`): Propietario registrado.
* `vehicle_type` (`varchar(20)`): Tipo (*carro*, *moto*).
* `plate_number` (`varchar(15)`, UNIQUE): Placa vehicular colombiana normalizada.
* `brand` / `model_line` (`varchar(80)` / `varchar(100)`): Marca y línea consultadas vía API NHTSA o catálogo local.
* `year` (`smallint`): Año del modelo.
* `color` (`varchar(40)`): Color de carrocería.
* `available_seats` (`smallint`): Cupos disponibles (1 para moto, 1-6 para carro).
* `has_ac` / `has_trunk` / `has_extra_helmet` (`boolean`): Equipamiento reglamentario.
* `status` (`varchar(30)`): Estado (*pendiente_revision*, *aprobado*, *rechazado*, *documento_vencido*).

#### Tabla: `vehicle_documents`
* `id` (`uuid`, PK): Identificador del documento.
* `vehicle_id` (`uuid`, FK): Vehículo asociado.
* `document_type` (`varchar(40)`): Tipo (*licencia_conduccion*, *soat*, *tarjeta_propiedad*, *revision_tecnico_mecanica*).
* `file_path` (`varchar(255)`): Ruta en disco privado (`storage/app/private/`).
* `expires_at` (`date`, Nullable): Fecha de vencimiento.
* `is_verified` (`boolean`): Estado de validación por Bienestar Universitario.

#### Tabla: `document_access_logs` (Habeas Data Ley 1581/2012)
* `id` (`uuid`, PK): Identificador inmutable del registro de acceso.
* `auditor_user_id` / `target_user_id` (`uuid`): Quién consultó y a quién pertenece el documento.
* `access_purpose` (`varchar(50)`): Motivo (*verificacion_inicial*, *auditoria_semestral*, *inspeccion_soporte*).
* `ip_address` / `user_agent` (`varchar` / `text`): Metadatos de red.
* `file_hash_sha256` (`varchar(64)`): Firma criptográfica del archivo inspeccionado.
* `accessed_at` (`timestamptz`): Fecha y hora del acceso.

---

### 2.3. Base de Datos: `route_gis_db` (PostGIS 3.4)

#### Tabla: `routes`
* `id` (`uuid`, PK): Identificador de la ruta.
* `driver_id` / `vehicle_id` (`uuid`): Conductor y vehículo asignado.
* `origin_name` / `destination_campus_name` (`varchar`): Nombres descriptivos de inicio y destino.
* `path_geometry` (`GEOMETRY(LineString, 4326)`): Trazado espacial del recorrido. **Indexado con GiST (`idx_routes_path_geometry`)**.
* `origin_geom` / `destination_geom` (`GEOMETRY(Point, 4326)`): Puntos geográficos extremos. **Indexados con GiST**.
* `scheduled_departure_time` / `target_arrival_time` (`timestamptz`): Horario de salida y hora máxima de llegada al campus.
* `max_detour_minutes` (`smallint`, default 15): Límite máximo de retraso total permitido.
* `accumulated_detour_minutes` (`decimal(5,2)`, default 0.00): Desvío acumulado en tiempo real.
* `base_contribution_cop` (`decimal(10,2)`): Tarifa base sugerida.

#### Tabla: `route_stops`
* `id` (`uuid`, PK): Identificador de la parada.
* `route_id` (`uuid`, FK): Ruta a la que pertenece.
* `stop_order` (`smallint`): Posición en el orden de recogida (0 = Origen, 1..N = Pasajeros, N+1 = Campus).
* `stop_name` (`varchar(150)`): Dirección o punto de encuentro.
* `stop_geom` (`GEOMETRY(Point, 4326)`): Punto espacial exacto. **Indexado con GiST**.
* `is_detour` (`boolean`): Indica si fue insertada por optimización de desvío IA.
* `extra_fee_cop` (`decimal(10,2)`): Recargo calculado por desvío (+ $300 COP / min).

---

### 2.4. Base de Datos: `trip_db`

#### Tabla: `trips`
* `id` (`uuid`, PK): Identificador del viaje.
* `driver_id` / `passenger_id` / `vehicle_id` (`uuid`): Participantes del viaje.
* `payment_method` (`varchar(30)`): Método (*efectivo*, *nequi_directo*, *daviplata_directo*, *billetera_uniwheels*).
* `total_fare_cop` (`decimal(10,2)`): Tarifa total abonada por el pasajero.
* `driver_amount_cop` (`decimal(10,2)`): Ganancia neta transferida al conductor.
* `platform_commission_cop` (`decimal(10,2)`): Comisión/markup debitada de la billetera del conductor.
* `status` (`varchar(35)`): Estados (*confirmado*, *en_camino_recogida*, *en_punto_encuentro*, *pasajero_a_bordo*, *en_curso*, *completado*, *cancelado*).

#### Tabla: `trip_cancellations`
* `id` (`uuid`, PK): Identificador de la cancelación.
* `trip_id` (`uuid`, FK): Viaje cancelado.
* `cancelled_by_user_id` (`uuid`): Usuario que canceló.
* `canceller_role` (`varchar(20)`): Rol (*conductor*, *pasajero*).
* `minutes_before_departure` (`integer`): Anticipación de la cancelación.
* `had_penalty` (`boolean`): Aplicación de penalización según umbrales (2 min pasajero / 15 min conductor).

#### Tabla: `trip_tracking_points`
* `id` (`uuid`, PK): Identificador de la muestra GPS.
* `trip_id` (`uuid`, FK): Viaje monitoreado.
* `latitude` / `longitude` (`decimal(10,7)`): Coordenadas capturadas cada 5 segundos.
* `speed_kmh` / `heading_degrees` (`decimal(5,2)`): Velocidad y orientación.
* `recorded_at` (`timestamptz`): Marca de tiempo del dispositivo.

---

### 2.5. Base de Datos: `notification_db`

#### Tabla: `ratings`
* `id` (`uuid`, PK): Identificador de la evaluación.
* `trip_id` (`uuid`): Viaje evaluado.
* `rater_user_id` / `rated_user_id` (`uuid`): Evaluador y evaluado.
* `role_rated` (`varchar(20)`): Rol evaluado (*conductor*, *pasajero*).
* `score` (`smallint`): Puntuación entera de 1 a 5 estrellas.
* `optional_comment` (`text`, Nullable): Reseña comunitaria.

#### Tabla: `reports`
* `id` (`uuid`, PK): Identificador del reporte de seguridad.
* `reporter_user_id` / `reported_user_id` (`uuid`): Denunciante y denunciado.
* `category` (`varchar(50)`): Categorías (*acoso_o_inseguridad*, *cobro_indebido*, *conduccion_peligrosa*, *vehiculo_en_mal_estado*, *suplantacion*).
* `status` (`varchar(35)`): Estado de atención en Bienestar Universitario (*abierto*, *en_investigacion*, *resuelto_con_advertencia*, *resuelto_con_suspension*, *desestimado*).
