# Microservicio de Rutas y Optimización Espacial (route-matching-service)

Microservicio geoespacial con PostGIS 3.4 y motor de optimización de rutas para el emparejamiento inteligente de trayectos universitarios.

---

## 1. Responsabilidades
* Almacenamiento de geometrías de rutas en formato nativo `GEOMETRY(LineString, 4326)` con índices espaciales `GiST`.
* Búsqueda por proximidad (`ST_DWithin`) en corredores viales para Modalidad 1 (Match Directo).
* Evaluación algorítmica de inserción de desvíos para Modalidad 2 con restricción dura de 15 minutos totales acumulados y 2 minutos de espera de abordaje.
* Cálculo dinámico del recargo por minuto de desvío (+$300 COP / min).

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
