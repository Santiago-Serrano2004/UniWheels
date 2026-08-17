import math
from typing import List, Tuple, Dict, Any
from enum import Enum


class TurnTypeEnum(str, Enum):
    STRAIGHT = "recto_continuo"
    SLIGHT_RIGHT = "derecha_suave"
    SHARP_RIGHT = "derecha_cerrada"
    SLIGHT_LEFT = "izquierda_suave"
    SHARP_LEFT = "izquierda_cerrada"
    U_TURN = "retorno_en_u"


class TurnPenaltyEngine:
    """
    Motor de Análisis y Penalización de Giros Complejos para UniWheels.
    Modela el impacto cinemático y semafórico de intersecciones viales en Bucaramanga:
    - Giros rectos / continuos: 0 s
    - Giros a la derecha: 12-18 s (flujo preferente en Colombia)
    - Giros a la izquierda: 75-105 s (espera de fase semafórica o contraflujo)
    - Retornos en U: 130-160 s (maniobra de alto retraso en avenidas)
    """

    # Penalizaciones base en segundos según el tipo de maniobra
    TURN_PENALTIES_SECONDS = {
        TurnTypeEnum.STRAIGHT: 0.0,
        TurnTypeEnum.SLIGHT_RIGHT: 12.0,
        TurnTypeEnum.SHARP_RIGHT: 20.0,
        TurnTypeEnum.SLIGHT_LEFT: 65.0,
        TurnTypeEnum.SHARP_LEFT: 95.0,
        TurnTypeEnum.U_TURN: 140.0,
    }

    @staticmethod
    def calculate_bearing(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Calcula el acimut geográfico (heading) en grados [0, 360) entre dos coordenadas (lat, lng)."""
        lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
        lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])

        d_lon = lon2 - lon1
        y = math.sin(d_lon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(d_lon)

        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360.0) % 360.0

    @classmethod
    def classify_turn(
        cls, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]
    ) -> Tuple[TurnTypeEnum, float, float]:
        """
        Evalúa la transición entre el segmento P1->P2 y el segmento P2->P3.
        Retorna (tipo_de_giro, deflexion_grados, penalizacion_segundos).
        """
        bearing1 = cls.calculate_bearing(p1, p2)
        bearing2 = cls.calculate_bearing(p2, p3)

        # Ángulo de deflexión en [-180, +180]
        # Positivo = Giro a la derecha, Negativo = Giro a la izquierda
        angle_diff = (bearing2 - bearing1 + 180.0) % 360.0 - 180.0

        abs_angle = abs(angle_diff)

        if abs_angle <= 25.0:
            turn_type = TurnTypeEnum.STRAIGHT
        elif 25.0 < angle_diff <= 65.0:
            turn_type = TurnTypeEnum.SLIGHT_RIGHT
        elif 65.0 < angle_diff <= 125.0:
            turn_type = TurnTypeEnum.SHARP_RIGHT
        elif -65.0 <= angle_diff < -25.0:
            turn_type = TurnTypeEnum.SLIGHT_LEFT
        elif -125.0 <= angle_diff < -65.0:
            turn_type = TurnTypeEnum.SHARP_LEFT
        else:
            turn_type = TurnTypeEnum.U_TURN

        penalty_sec = cls.TURN_PENALTIES_SECONDS[turn_type]
        return turn_type, round(angle_diff, 1), penalty_sec

    def evaluate_route_turns(
        self, polyline: List[Tuple[float, float]], is_peak_hour: bool = False
    ) -> Dict[str, Any]:
        """
        Analiza toda la polilínea de la ruta y calcula la matriz de giros y penalizaciones.
        Durante horas pico, los giros a la izquierda sufren un multiplicador de +30%.
        """
        if len(polyline) < 3:
            return {
                "total_penalty_seconds": 0.0,
                "total_penalty_minutes": 0.0,
                "turn_counts": {t.value: 0 for t in TurnTypeEnum},
                "complex_turns_count": 0,
                "details": [],
            }

        peak_multiplier = 1.30 if is_peak_hour else 1.0

        total_penalty_sec = 0.0
        turn_counts = {t.value: 0 for t in TurnTypeEnum}
        complex_turns = 0
        details = []

        # Evaluar giros en puntos nodales significativos (cada ~80-150m)
        step = max(1, len(polyline) // 15)
        sampled_points = [polyline[i] for i in range(0, len(polyline), step)]
        if sampled_points[-1] != polyline[-1]:
            sampled_points.append(polyline[-1])

        for i in range(len(sampled_points) - 2):
            p1 = sampled_points[i]
            p2 = sampled_points[i + 1]
            p3 = sampled_points[i + 2]

            turn_type, angle_deg, base_penalty = self.classify_turn(p1, p2, p3)

            adjusted_penalty = base_penalty
            if turn_type in [TurnTypeEnum.SHARP_LEFT, TurnTypeEnum.SLIGHT_LEFT, TurnTypeEnum.U_TURN]:
                adjusted_penalty *= peak_multiplier
                complex_turns += 1

            turn_counts[turn_type.value] += 1
            total_penalty_sec += adjusted_penalty

            if turn_type != TurnTypeEnum.STRAIGHT:
                details.append({
                    "node_index": i + 1,
                    "location": {"lat": p2[0], "lng": p2[1]},
                    "turn_type": turn_type.value,
                    "deflection_degrees": angle_deg,
                    "penalty_seconds": round(adjusted_penalty, 1),
                })

        return {
            "total_penalty_seconds": round(total_penalty_sec, 1),
            "total_penalty_minutes": round(total_penalty_sec / 60.0, 2),
            "turn_counts": turn_counts,
            "complex_turns_count": complex_turns,
            "details": details,
        }


turn_penalty_engine = TurnPenaltyEngine()
