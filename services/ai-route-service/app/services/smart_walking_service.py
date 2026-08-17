import math
from typing import List, Tuple, Dict, Any, Optional
from app.schemas.route_optimization import LatLng
from app.services.osrm_client import osrm_client


class SmartWalkingPickupEngine:
    """
    Motor de Puntos de Encuentro Inteligentes con Radio Caminable (Virtual Bus Stops).
    Proyecta la recogida del estudiante al punto más cercano sobre la arteria principal del conductor,
    reduciendo el desvío vehicular en hasta un 50% y convirtiendo viajes inviables en viables.
    """

    # Velocidad peatonal universitaria promedio: 4.8 km/h = 1.33 m/s
    WALKING_SPEED_METERS_PER_SEC = 1.33

    @staticmethod
    def _project_point_onto_segment(
        p: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]
    ) -> Tuple[float, float, float]:
        """
        Proyecta ortogonalmente un punto P(lat, lng) sobre el segmento de recta AB.
        Retorna (lat_proj, lng_proj, t_ratio).
        """
        # Conversión a coordenadas tangentes locales usando aproximación equirectangular
        lat_rad = math.radians((a[0] + b[0]) / 2.0)
        cos_lat = math.cos(lat_rad)

        px, py = p[1] * cos_lat, p[0]
        ax, ay = a[1] * cos_lat, a[0]
        bx, by = b[1] * cos_lat, b[0]

        dx = bx - ax
        dy = by - ay
        len_sq = dx * dx + dy * dy

        if len_sq < 1e-12:
            return a[0], a[1], 0.0

        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / len_sq))
        proj_lat = a[0] + t * (b[0] - a[0])
        proj_lng = a[1] + t * (b[1] - a[1])

        return proj_lat, proj_lng, t

    def find_optimal_walking_pickup(
        self,
        passenger_location: LatLng,
        driver_route_polyline: List[List[float]],
        max_walking_radius_meters: float = 250.0,
    ) -> Dict[str, Any]:
        """
        Calcula el punto de encuentro óptimo sobre la polilínea del conductor.
        """
        p_lat, p_lng = passenger_location.lat, passenger_location.lng

        best_proj_point = (p_lat, p_lng)
        min_distance_meters = float("inf")
        best_segment_idx = 0

        # Si no hay polilínea suficiente, retornar el punto original
        if len(driver_route_polyline) < 2:
            return {
                "is_smart_pickup_applicable": False,
                "pickup_point": passenger_location,
                "walking_distance_meters": 0.0,
                "walking_time_minutes": 0.0,
                "driver_time_saved_minutes": 0.0,
                "walking_instructions": "Punto de recogida en la ubicación original del pasajero.",
            }

        # Iterar sobre cada segmento de la ruta del conductor
        for i in range(len(driver_route_polyline) - 1):
            a = (driver_route_polyline[i][0], driver_route_polyline[i][1])
            b = (driver_route_polyline[i + 1][0], driver_route_polyline[i + 1][1])

            proj_lat, proj_lng, _ = self._project_point_onto_segment((p_lat, p_lng), a, b)
            dist_m = osrm_client.haversine_distance_meters(p_lat, p_lng, proj_lat, proj_lng)

            if dist_m < min_distance_meters:
                min_distance_meters = dist_m
                best_proj_point = (proj_lat, proj_lng)
                best_segment_idx = i

        walking_distance = round(min_distance_meters, 1)

        # Si el punto sobre la avenida está dentro del radio caminable del estudiante
        if walking_distance <= max_walking_radius_meters:
            walking_time_sec = walking_distance / self.WALKING_SPEED_METERS_PER_SEC
            walking_time_min = round(walking_time_sec / 60.0, 1)

            # Estimación del desvío vehicular ahorrado al conductor
            # El conductor se ahorra entrar al barrio, frenar y salir: ~ (distancia * 2 / 20 km/h) + 1 min
            driver_saved_min = round(max(0.5, (walking_distance * 2.0 / (20.0 * 1000.0 / 60.0)) + 0.8), 1)

            instruction = (
                f"Punto de encuentro optimizado sobre la vía principal a {int(walking_distance)} metros "
                f"(~{walking_time_min} min a pie). El conductor no necesita desviarse hacia el interior del sector."
            )

            return {
                "is_smart_pickup_applicable": True,
                "pickup_point": LatLng(lat=round(best_proj_point[0], 6), lng=round(best_proj_point[1], 6)),
                "walking_distance_meters": walking_distance,
                "walking_time_minutes": walking_time_min,
                "driver_time_saved_minutes": driver_saved_min,
                "walking_instructions": instruction,
            }
        else:
            # Si supera el radio caminable, el conductor se desvía hasta la puerta
            return {
                "is_smart_pickup_applicable": False,
                "pickup_point": passenger_location,
                "walking_distance_meters": 0.0,
                "walking_time_minutes": 0.0,
                "driver_time_saved_minutes": 0.0,
                "walking_instructions": (
                    f"El punto de encuentro sobre la vía principal supera el radio caminable ({int(walking_distance)}m > {int(max_walking_radius_meters)}m). "
                    f"El conductor se desviará hasta el punto solicitado."
                ),
            }


smart_walking_engine = SmartWalkingPickupEngine()
