import math
import httpx
from typing import List, Tuple, Dict, Any
from app.core.config import settings


class OSRMClient:
    """
    Cliente para cálculo de distancias y geometrías de ruta con OSRM y fallback geométrico.
    """

    def __init__(self):
        self.base_url = settings.OSRM_BASE_URL

    @staticmethod
    def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calcula la distancia de círculo máximo en metros entre dos puntos WGS84."""
        R = 6371000.0  # Radio de la Tierra en metros
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    async def get_route(
        self, coordinates: List[Tuple[float, float]]
    ) -> Dict[str, Any]:
        """
        Consulta OSRM para una lista de coordenadas [(lat, lng), ...].
        Si OSRM local no responde, aplica modelo topográfico de Bucaramanga.
        """
        # Formato OSRM: lng,lat;lng,lat
        formatted_coords = ";".join([f"{lng},{lat}" for lat, lng in coordinates])
        url = f"{self.base_url}/route/v1/driving/{formatted_coords}?overview=full&geometries=geojson"

        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("routes"):
                        route = data["routes"][0]
                        coords = [
                            [pt[1], pt[0]] for pt in route["geometry"]["coordinates"]
                        ]
                        return {
                            "duration_seconds": route["duration"],
                            "distance_meters": route["distance"],
                            "coordinates": coords,
                            "source": "osrm_local",
                        }
        except Exception:
            pass

        # FALLBACK GEOMÉTRICO (Topografía Bucaramanga / Floridablanca)
        total_dist_meters = 0.0
        detailed_coords: List[List[float]] = []

        for i in range(len(coordinates) - 1):
            p1 = coordinates[i]
            p2 = coordinates[i + 1]
            seg_dist = self.haversine_distance_meters(p1[0], p1[1], p2[0], p2[1]) * 1.34  # Factor de sinuosidad
            total_dist_meters += seg_dist

            # Generar puntos intermedios interpolados
            steps = max(5, int(seg_dist / 150.0))
            for step in range(steps):
                t = step / float(steps)
                lat = p1[0] + t * (p2[0] - p1[0])
                lng = p1[1] + t * (p2[1] - p1[1])
                detailed_coords.append([round(lat, 6), round(lng, 6)])

        detailed_coords.append([coordinates[-1][0], coordinates[-1][1]])

        # Velocidad promedio urbana en Bucaramanga: 28 km/h = 7.77 m/s
        avg_speed_mps = 7.77
        duration_sec = total_dist_meters / avg_speed_mps

        return {
            "duration_seconds": round(duration_sec, 1),
            "distance_meters": round(total_dist_meters, 1),
            "coordinates": detailed_coords,
            "source": "topographic_haversine_fallback",
        }


osrm_client = OSRMClient()
