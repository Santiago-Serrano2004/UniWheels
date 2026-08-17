import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from app.schemas.route_optimization import LatLng


class DemandForecastingEngine:
    """
    Motor de Predicción Espacio-Temporal de Demanda y Generación de Mapas de Calor (Heatmaps).
    Modela las dinámicas horarias de los 7 campus y corredores metropolitanos de la UNAB:
    - Cañaveral / C.C. Caracolí / Floridablanca
    - Provenza / Diamante II
    - Cabecera del Llano / Parque San Pío
    - Real de Minas / Plaza Mayor
    - Bucarica / Caracolí Sur
    - Girón / Anillo Vial
    - UNAB Campus El Jardín / El Bosque / CSU
    """

    # Catálogo de micro-zonas metropolitanas estratégicas UNAB
    ZONAS_ESTRATEGICAS = [
        {
            "zone_id": "canaveral",
            "name": "Cañaveral / C.C. Caracolí (Floridablanca)",
            "center": (7.0678, -73.1066),
            "radius_km": 1.2,
            "base_student_density": 0.95,  # Zona con altísima concentración de estudiantes
            "peak_morning_weight": 1.0,
            "peak_noon_weight": 0.85,
            "peak_evening_weight": 0.75,
        },
        {
            "zone_id": "provenza",
            "name": "Provenza / Diamante II (Sur Bucaramanga)",
            "center": (7.0856, -73.1142),
            "radius_km": 1.1,
            "base_student_density": 0.88,
            "peak_morning_weight": 0.92,
            "peak_noon_weight": 0.80,
            "peak_evening_weight": 0.70,
        },
        {
            "zone_id": "cabecera",
            "name": "Cabecera del Llano / Parque San Pío",
            "center": (7.1186, -73.1102),
            "radius_km": 1.0,
            "base_student_density": 0.92,
            "peak_morning_weight": 0.85,
            "peak_noon_weight": 0.95,  # Alta demanda al medio día
            "peak_evening_weight": 0.90,
        },
        {
            "zone_id": "real_de_minas",
            "name": "Real de Minas / Plaza Mayor",
            "center": (7.1080, -73.1250),
            "radius_km": 1.3,
            "base_student_density": 0.78,
            "peak_morning_weight": 0.82,
            "peak_noon_weight": 0.75,
            "peak_evening_weight": 0.65,
        },
        {
            "zone_id": "giron_anillo_vial",
            "name": "Girón / Anillo Vial Occidental",
            "center": (7.0720, -73.1680),
            "radius_km": 1.8,
            "base_student_density": 0.65,
            "peak_morning_weight": 0.90,
            "peak_noon_weight": 0.60,
            "peak_evening_weight": 0.55,
        },
        {
            "zone_id": "campus_el_bosque",
            "name": "UNAB Campus El Bosque / CSU (Floridablanca)",
            "center": (7.0650, -73.0980),
            "radius_km": 0.9,
            "base_student_density": 0.85,
            "peak_morning_weight": 0.90,
            "peak_noon_weight": 0.90,
            "peak_evening_weight": 0.85,
        },
    ]

    def _get_hourly_demand_multiplier(self, hour: float, day_of_week: int) -> float:
        """
        Calcula el multiplicador temporal según los bloques de inicio de clases en la UNAB:
        - Bloque 1: 06:00 - 08:00 AM (Pico máximo matutino)
        - Bloque 2: 11:30 - 01:30 PM (Pico de medio día)
        - Bloque 3: 05:30 - 07:30 PM (Pico nocturno)
        - Madrugada / Noche tarde: Demanda mínima (< 0.1)
        """
        if day_of_week == 6:  # Domingo (actividad académica mínima)
            return 0.15

        # Picos de clases
        if 6.0 <= hour <= 8.2:
            return 1.45  # +45% de demanda
        elif 11.3 <= hour <= 13.7:
            return 1.30  # +30% de demanda
        elif 17.2 <= hour <= 19.5:
            return 1.25  # +25% de demanda
        elif 8.5 <= hour <= 11.0 or 14.0 <= hour <= 17.0:
            return 0.65  # Horario valle de clases
        else:
            return 0.10  # Madrugada / noche

    def generate_spatiotemporal_demand_heatmap(
        self,
        target_hour: float = 7.0,
        day_of_week: int = 1,
        is_raining: bool = False,
    ) -> Dict[str, Any]:
        """
        Genera los puntos del mapa de calor (Heatmap) con intensidades normalizadas [0.0, 1.0]
        y resume las zonas de mayor escasez de cupos.
        """
        hourly_mult = self._get_hourly_demand_multiplier(target_hour, day_of_week)
        rain_mult = 1.25 if is_raining else 1.0

        heatmap_points = []
        high_demand_zones = []

        for z in self.ZONAS_ESTRATEGICAS:
            # Calcular intensidad de la zona
            intensity = min(1.0, round(z["base_student_density"] * hourly_mult * rain_mult * 0.75, 2))
            estimated_passengers = int(intensity * 48)  # Estimado de 0 a 48 pasajeros buscando cupo

            status = "Baja Demanda"
            if intensity >= 0.75:
                status = "🔴 Alta Escasez de Cupos (Zona Crítica)"
                high_demand_zones.append({
                    "zone_id": z["zone_id"],
                    "zone_name": z["name"],
                    "intensity": intensity,
                    "estimated_passengers": estimated_passengers,
                    "recommendation": f"Alta demanda hacia Campus El Jardín. Ocupación rápida de cupos.",
                })
            elif intensity >= 0.45:
                status = "🟡 Demanda Moderada"

            # Generar nube de calor gaussiana alrededor del centro de la zona
            center_lat, center_lng = z["center"]
            heatmap_points.append({
                "lat": center_lat,
                "lng": center_lng,
                "intensity": intensity,
                "zone_name": z["name"],
                "status": status,
                "estimated_passengers": estimated_passengers,
            })

            # Puntos satélites circundantes para gradiente suave en Leaflet
            for offset_lat, offset_lng in [
                (0.003, 0.003), (-0.003, -0.003), (0.003, -0.003), (-0.003, 0.003)
            ]:
                heatmap_points.append({
                    "lat": round(center_lat + offset_lat, 5),
                    "lng": round(center_lng + offset_lng, 5),
                    "intensity": round(intensity * 0.72, 2),
                    "zone_name": z["name"],
                    "status": status,
                    "estimated_passengers": int(estimated_passengers * 0.7),
                })

        return {
            "timestamp": datetime.now().isoformat(),
            "target_hour": target_hour,
            "day_of_week": day_of_week,
            "is_raining": is_raining,
            "total_heatmap_points": len(heatmap_points),
            "heatmap_points": heatmap_points,
            "high_demand_zones": high_demand_zones,
        }

    def get_driver_proactive_recommendation(
        self,
        driver_origin: LatLng,
        driver_departure_hour: float = 7.0,
        day_of_week: int = 1,
    ) -> Dict[str, Any]:
        """
        Analiza el origen del conductor y le genera recomendaciones proactivas de salida
        para maximizar su ocupación y ganancias.
        """
        # Encontrar la zona estratégica más cercana
        closest_zone = None
        min_dist_km = float("inf")

        for z in self.ZONAS_ESTRATEGICAS:
            c_lat, c_lng = z["center"]
            dist_km = math.sqrt((driver_origin.lat - c_lat) ** 2 + (driver_origin.lng - c_lng) ** 2) * 111.0
            if dist_km < min_dist_km:
                min_dist_km = dist_km
                closest_zone = z

        hourly_mult = self._get_hourly_demand_multiplier(driver_departure_hour, day_of_week)
        intensity = min(1.0, round(closest_zone["base_student_density"] * hourly_mult, 2)) if closest_zone else 0.5

        if intensity >= 0.70:
            suggested_time = f"{int(driver_departure_hour):02d}:{(int((driver_departure_hour % 1) * 60) - 5) % 60:02d} AM"
            tips = [
                f"🔥 {closest_zone['name']} presenta alta concentración de pasajeros hacia la UNAB.",
                f"💡 Sal 5 minutos antes ({suggested_time}) para asegurar tus 3 cupos completos sobre la ruta.",
                f"💰 Ganancia estimada en este horario: ~$17.400 COP por trayecto completo.",
            ]
        else:
            tips = [
                f"Tráfico y demanda moderados en {closest_zone['name'] if closest_zone else 'tu sector'}.",
                "Tu horario habitual de salida cuenta con flujo vehicular estable.",
            ]

        return {
            "closest_zone_name": closest_zone["name"] if closest_zone else "Área Metropolitana",
            "demand_intensity": intensity,
            "recommendations": tips,
        }


demand_forecasting_engine = DemandForecastingEngine()
