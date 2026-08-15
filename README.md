# UniWheels — Plataforma de Carpooling Universitario UNAB

UniWheels es un ecosistema distribuido de microservicios diseñado para optimizar y transformar la movilidad compartida de la comunidad de la Universidad Autónoma de Bucaramanga (UNAB). La plataforma conecta a estudiantes, docentes y colaboradores que viajan en automóvil o motocicleta hacia las diferentes sedes universitarias, implementando algoritmos de optimización de rutas, políticas de seguridad institucional y un modelo de economía colaborativa con liquidación prepago.

---

## 1. Arquitectura del Sistema

El backend sigue el patrón Database-per-Service (base de datos aislada por microservicio) montado sobre PostgreSQL 16 con la extensión geoespacial PostGIS 3.4 y caché distribuido en Redis 7.

```text
UniWheels/
├── services/
│   ├── auth-service/            # Puerto 8001 | Auth JWT, Perfiles UNAB, RBAC, Billeteras Prepago (auth_db)
│   ├── vehicle-service/         # Puerto 8002 | Vehículos, API NHTSA, Documentos Legales y Habeas Data (vehicle_db)
│   ├── route-matching-service/  # Puerto 8003 | Rutas PostGIS SRID 4326, Índices GiST y Desvíos IA (route_gis_db)
│   ├── trip-service/            # Puerto 8004 | Máquina de Estados, Cancelaciones y Telemetría GPS (trip_db)
│   └── notification-service/    # Puerto 8005 | Calificaciones Bidireccionales y Reportes de Seguridad (notification_db)
├── frontend/                    # React 18 SPA (Vite, TailwindCSS, React-Leaflet, Framer Motion)
├── gateway/                     # API Gateway Centralizado (Nginx Reverse Proxy)
├── docker/                      # Orquestación de Contenedores y Bases de Datos
└── docs/                        # Documentación Técnica y Especificación de Negocio
```

---

## 2. Matriz de Microservicios y Bases de Datos

| Microservicio | Puerto | Base de Datos | Motor / Extensión | Responsabilidad Principal |
| :--- | :---: | :--- | :--- | :--- |
| `auth-service` | `8001` | `auth_db` | PostgreSQL 16 | Autenticación institucional @unab.edu.co, perfil académico semestral, RBAC con Spatie y billeteras virtuales de saldo prepago. |
| `vehicle-service` | `8002` | `vehicle_db` | PostgreSQL 16 | Registro de carros y motos, integración con API de NHTSA, validación de RTM (Ley 2294/2023) y auditoría Habeas Data (Ley 1581/2012). |
| `route-matching-service` | `8003` | `route_gis_db` | PostGIS 3.4 | Geometrías de rutas (LineString), indexación espacial GiST, evaluación de desvíos en tiempo real con límite de 15 min y buffer de abordaje de 2 min. |
| `trip-service` | `8004` | `trip_db` | PostgreSQL 16 | Ciclo de vida y transiciones del viaje, trazabilidad de cobro de comisión (12%-15%), políticas de cancelación y registro GPS cada 5 seg. |
| `notification-service` | `8005` | `notification_db` | PostgreSQL 16 | Calificaciones 1 a 5 estrellas (visibles a partir de 3 viajes), reportes de seguridad para Bienestar Universitario y notificaciones push. |

---

## 3. Reglas de Negocio y Seguridad Institucional

1. **Comunidad Exclusiva UNAB:**
   * Registro restringido a correos institucionales `@unab.edu.co`.
   * Ciclo de re-verificación semestral cada 6 meses (`verification_expires_at`).
   * Código estudiantil validado mediante expresión regular obligatoria `^U\d{8}$`.
2. **Sedes Universitarias Homologadas:**
   * Campus El Jardín (Avenida 42 # 48-11, Bucaramanga)
   * Campus El Bosque (Calle 157 # 19-55, Floridablanca)
   * CSU Terrazas (Calle 51 # 27-24, Bucaramanga)
   * La Casona UNAB (Calle 42 # 34-14, Bucaramanga)
3. **Modelo Financiero y Billetera Prepago del Conductor:**
   * El pasajero paga el total del viaje directamente al conductor (Efectivo / Nequi / DaviPlata).
   * La plataforma debita automáticamente la comisión/markup (12% a 15%) de la Billetera Prepago del conductor.
   * Límite de crédito operativo: Si el saldo de la billetera es menor a -$5.000 COP, el conductor no puede publicar nuevas rutas hasta recargar.
4. **Cumplimiento Normativo Colombiano:**
   * **Revisión Técnico-Mecánica (Ley 2294 de 2023):** Exigible a vehículos con más de 5 años y motocicletas con más de 2 años.
   * **Habeas Data (Ley 1581 de 2012):** Almacenamiento de documentos en disco privado con URLs firmadas de 10 minutos y bitácora inmutable en `document_access_logs`.

---

## 4. Pruebas Automatizadas y Calidad de Código

El proyecto cuenta con suites de pruebas completas basadas en Pest PHP:

```bash
# Ejecutar pruebas en auth-service
cd UniWheels/services/auth-service && ./vendor/bin/pest

# Ejecutar pruebas en vehicle-service
cd UniWheels/services/vehicle-service && ./vendor/bin/pest
```

---

## 5. Despliegue Local del Entorno

### 5.1. Iniciar Infraestructura de Contenedores
```bash
cd UniWheels/docker
podman-compose up -d
```

### 5.2. Ejecutar Migraciones en Microservicios
```bash
# Auth Service
cd ../services/auth-service && php artisan migrate:fresh --seed

# Vehicle Service
cd ../services/vehicle-service && php artisan migrate:fresh

# Route Matching Service
cd ../services/route-matching-service && php artisan migrate:fresh

# Trip Service
cd ../services/trip-service && php artisan migrate:fresh

# Notification Service
cd ../services/notification-service && php artisan migrate:fresh
```
