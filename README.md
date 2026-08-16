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

## 3. Reglas de Negocio, Seguridad y Normativa Vehicular

1. **Comunidad Universitaria Multi-Institucional Dinámica:**
   * Registro con correos institucionales validados por dominio (`@unab.edu.co`, etc.).
   * Mascota de bienvenida y sedes universitarias consumidas dinámicamente desde base de datos.
   * Separación estricta de roles: los nuevos registros ingresan con rol de **Pasajero** y tienen un portal dedicado para registrarse como **Conductor**.
2. **Registro de Conductores con NHTSA vPIC API y Caché de 24h:**
   * Conexión en vivo con la API oficial internacional de la NHTSA para la carga dinámica de modelos por marca.
   * Caché local con recarga diaria de 24 horas (`vehicleApiService.js`).
   * Visualizador de placa colombiana reflectiva con remaches y repujado oficial (`ColombianPlateInput.jsx`).
3. **Cumplimiento Normativo Colombiano de Tránsito y Transporte:**
   * **Revisión Técnico-Mecánica (Ley 2294 de 2023 / Ley 1964 de 2019):** Exigible a automóviles particulares (gasolina, diésel, híbridos y eléctricos) a partir de los 5 años de matrícula. Motocicletas a partir de los 2 años.
   * **Póliza SOAT y Licencia de Conducción:** Validación estricta de formatos numéricos colombianos y verificación de vigencia activa (fechas estrictamente futuras).
   * **Habeas Data (Ley 1581 de 2012):** Autorización expresa, almacenamiento seguro en disco privado y URLs firmadas de 10 minutos para auditoría institucional.
4. **Modelo Financiero y Billetera Prepago:**
   * El pasajero abona el viaje al conductor (efectivo / digital).
   * La plataforma debita automáticamente la comisión/markup (12% a 15%) de la Billetera Prepago del conductor.
   * Límite de crédito operativo de -$5.000 COP antes de pausar la publicación de nuevos cupos.

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
