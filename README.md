# UniWheels — Plataforma de Carpooling Universitario UNAB

UniWheels es un ecosistema distribuido de microservicios diseñado para optimizar y transformar la movilidad compartida de la comunidad de la Universidad Autónoma de Bucaramanga (UNAB). La plataforma conecta a estudiantes, docentes y colaboradores que viajan en automóvil o motocicleta hacia las diferentes sedes universitarias, implementando algoritmos de optimización de rutas (ALNS / DARP-TW), predicción de tiempos con Machine Learning (XGBoost), políticas de seguridad institucional y un modelo de economía colaborativa con liquidación prepago.

---

## 1. Arquitectura del Sistema

El backend sigue el patrón **Database-per-Service** (base de datos aislada por microservicio) montado sobre **PostgreSQL 16** con la extensión geoespacial **PostGIS 3.4**, caché distribuido en **Redis 7** y un motor especializado de optimización de rutas en **Python FastAPI**.

```text
UniWheels/
├── services/
│   ├── auth-service/            # Puerto 8001 | Auth JWT, Perfiles UNAB, RBAC, Billeteras Prepago (auth_db)
│   ├── vehicle-service/         # Puerto 8002 | Vehículos, API NHTSA, Documentos Legales y Habeas Data (vehicle_db)
│   ├── route-matching-service/  # Puerto 8003 | Rutas PostGIS SRID 4326, Índices GiST y Matching Espacial (route_gis_db)
│   ├── trip-service/            # Puerto 8004 | Máquina de Estados, Cancelaciones y Telemetría GPS (trip_db)
│   ├── notification-service/    # Puerto 8005 | Calificaciones Bidireccionales y Reportes de Seguridad (notification_db)
│   └── ai-route-service/        # Puerto 8006 | Motor de Optimización IA: ALNS (DARP-TW), XGBoost ETA y TomTom API
├── frontend/                    # React 18 SPA (Vite, TailwindCSS, React-Leaflet, Framer Motion, Zustand)
├── gateway/                     # API Gateway Centralizado (Nginx Reverse Proxy)
├── docker/                      # Orquestación de Contenedores y Bases de Datos (Podman / Docker)
└── docs/                        # Documentación Técnica y Especificación de Negocio
```

---

## 2. Matriz de Microservicios y Bases de Datos

| Microservicio | Puerto | Stack Tecnológico | Base de Datos | Responsabilidad Principal |
| :--- | :---: | :--- | :--- | :--- |
| `auth-service` | `8001` | Laravel 11 / PHP 8.2 | `auth_db` | Autenticación institucional con PIN obligatorio, perfiles, RBAC con Spatie, correos de bienvenida/despedida/recuperación y eliminación de cuenta bajo Habeas Data (Ley 1581). |
| `vehicle-service` | `8002` | Laravel 11 / PHP 8.2 | `vehicle_db` | Registro de carros y motos, integración con API de NHTSA, validación de RTM (Ley 2294/2023), notificaciones al admin con tokens HMAC y descarga de documentos con URLs firmadas temporales. |
| `route-matching-service` | `8003` | Laravel 11 / PHP 8.2 | `route_gis_db` (PostGIS 3.4) | Geometrías de rutas (`LineString`), indexación espacial GiST, evaluación de desvíos en tiempo real con radio de 3.2 km y cálculo de tarifas sugeridas. |
| `trip-service` | `8004` | Laravel 11 / PHP 8.2 | `trip_db` | Ciclo de vida y transiciones del viaje (`solicitado` → `asignado` → `en_curso` con validación de PIN de 4 dígitos → `completado`), liquidación financiera y políticas de cancelación. |
| `notification-service` | `8005` | Laravel 11 / PHP 8.2 | `notification_db` | Calificaciones 1 a 5 estrellas, notificaciones in-app y push en tiempo real. |
| `ai-route-service` | `8006` | Python 3.12 / FastAPI | N/A (Stateless) | Algoritmo ALNS (*Adaptive Large Neighborhood Search*) para DARP-TW multi-pasajero, predicción de tiempo de llegada (ETA) con XGBoost e integración de tráfico con TomTom Traffic Flow API. |

---

## 3. Reglas de Negocio, Seguridad y Normativa Vehicular

1. **Comunidad Universitaria Verificada con PIN:**
   * Registro con correos institucionales validados por dominio (`@unab.edu.co`).
   * Envío obligatorio de PIN de 6 dígitos antes de crear la cuenta.
   * Eliminación voluntaria de cuenta con revocación de tokens y correo de despedida.
2. **Modalidades de Trayecto Universitarias:**
   * **Hacia Campus:** Punto de partida en la ciudad $\rightarrow$ Sede universitaria.
   * **Desde Campus:** Sede universitaria $\rightarrow$ Punto de destino en la ciudad (con punto de encuentro textual obligatorio en la sede).
   * **Entre Sedes (Inter-Campus):** Conexión directa entre campus de la institución con punto de encuentro en la sede de origen.
3. **Poda Espacial y Filtro de Horario:**
   * Evaluación de proximidad geoespacial entre el punto del pasajero y la trayectoria del conductor.
   * Filtrado temporal automático en una ventana de menos de 1 hora ($\pm 60\text{ min}$).
   * Insignias del modelo de IA: `Ruta directa`, `Desvío viable (+X min)` y `Desvío no disponible`.
4. **Registro de Conductores con NHTSA vPIC API y Caché de 24h:**
   * Conexión en vivo con la API oficial internacional de la NHTSA para la carga dinámica de modelos por marca.
   * Caché local con recarga diaria de 24 horas (`vehicleApiService.js`).
   * Visualizador de placa colombiana reflectiva con remaches y repujado oficial (`ColombianPlateInput.jsx`).
5. **Cumplimiento Normativo Colombiano de Tránsito y Transporte:**
   * **Revisión Técnico-Mecánica (Ley 2294 de 2023 / Ley 1964 de 2019):** Exigible a automóviles particulares a partir de los 5 años de matrícula. Motocicletas a partir de los 2 años.
   * **Póliza SOAT y Licencia de Conducción:** Validación estricta de formatos numéricos colombianos y verificación de vigencia activa.
   * **Habeas Data (Ley 1581 de 2012):** Autorización expresa, almacenamiento seguro en disco privado y URLs firmadas de 10 minutos para auditoría institucional.

---

## 4. Pruebas Automatizadas y Calidad de Código

```bash
# Pruebas en auth-service
cd UniWheels/services/auth-service && ./vendor/bin/pest

# Pruebas en vehicle-service
cd UniWheels/services/vehicle-service && ./vendor/bin/pest

# Pruebas en trip-service
cd UniWheels/services/trip-service && ./vendor/bin/pest

# Pruebas en ai-route-service
cd UniWheels/services/ai-route-service && pytest tests/

# Compilación Frontend
cd UniWheels/frontend && npm run build
```

---

## 5. Despliegue Local del Entorno

### 5.1. Iniciar Infraestructura de Contenedores
```bash
cd UniWheels/docker
podman-compose up -d
```

### 5.2. Iniciar Servicios
```bash
# Auth Service (:8001)
cd UniWheels/services/auth-service && php artisan serve --port=8001

# Vehicle Service (:8002)
cd UniWheels/services/vehicle-service && php artisan serve --port=8002

# Route Matching Service (:8003)
cd UniWheels/services/route-matching-service && php artisan serve --port=8003

# Trip Service (:8004)
cd UniWheels/services/trip-service && php artisan serve --port=8004

# Notification Service (:8005)
cd UniWheels/services/notification-service && php artisan serve --port=8005

# AI Route Service (:8006)
cd UniWheels/services/ai-route-service && .venv/bin/uvicorn app.main:app --port 8006 --reload

# Frontend SPA (:5173)
cd UniWheels/frontend && npm run dev
```
