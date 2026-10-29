# Microservicio de Rutas y Optimización Espacial (route-matching-service)

Microservicio geoespacial con PostGIS 3.4 y motor de optimización de rutas para el emparejamiento inteligente de trayectos universitarios.

---

## 1. Responsabilidades
* Almacenamiento de geometrías de rutas en formato nativo `GEOMETRY(LineString, 4326)` con índices espaciales `GiST`.
* Búsqueda por proximidad (`ST_DWithin`) en corredores viales para Modalidad 1 (Match Directo).
* Evaluación algorítmica de inserción de desvíos para Modalidad 2 con restricción dura de 15 minutos totales acumulados y 2 minutos de espera de abordaje.
* Aporte sugerido con tope: `GET /api/v1/routes/contribution-suggestion` devuelve la distancia vial, el aporte sugerido y el máximo (`max_contribution_cop`) para un origen, un destino y un vehículo. Al publicar, `base_contribution_cop` no puede superar el sugerido. Fórmula: base + km × valor por km, redondeada a la centena. Se configura con `CONTRIBUTION_CAR_BASE`, `CONTRIBUTION_CAR_PER_KM`, `CONTRIBUTION_MOTO_BASE` y `CONTRIBUTION_MOTO_PER_KM` (2000, 400, 1000 y 250 por defecto).
* El desvío no tiene recargo: el aporte es siempre el de la ruta.

---

## 2. Estructura de Datos y Extensión Espacial
* Base de datos: `route_gis_db`
* Extensión habilitada: `postgis`
* Índices GiST creados:
  * `idx_routes_path_geometry`
  * `idx_routes_origin_geom`
  * `idx_routes_destination_geom`
  * `idx_route_stops_geom`
  * `idx_trip_requests_pickup`
