from typing import List, Dict, Any, Tuple, Optional
from app.schemas.route_optimization import DriverRouteSchema, PassengerRequestSchema


class AffinitySafetyEngine:
    """
    Motor de Afinidad Universitaria, Confianza y Filtro de Seguridad 'Solo Mujeres'.
    Modela la compatibilidad comunitaria entre estudiantes y docentes de la UNAB:
    - Restricción dura: Modo 'Solo Mujeres' (Women-Only Safety Protocol).
    - Bonificación de Afinidad Académica (misma facultad / programa).
    - Ponderación de Reputación y Reseñas Comunitarias (estrellas >= 4.8).
    """

    WEIGHT_FACULTY_MATCH = 2.0
    WEIGHT_RATING = 1.2
    WEIGHT_MUTUAL_FRIENDS = 0.8

    @classmethod
    def check_women_only_compliance(
        cls,
        driver_gender: str,
        assigned_passengers_genders: List[str],
        candidate_passenger_gender: str,
        candidate_requires_women_only: bool,
    ) -> Tuple[bool, str]:
        """
        Verifica el cumplimiento estricto del protocolo de seguridad 'Solo Mujeres'.
        Si la pasajera candidata o alguna pasajera ya asignada solicita 'Solo Mujeres',
        todos los ocupantes (conductor y pasajeros) deben ser de género femenino ('F').
        """
        driver_is_female = driver_gender.upper() in ["F", "FEMENINO", "FEMALE"]
        candidate_is_female = candidate_passenger_gender.upper() in ["F", "FEMENINO", "FEMALE"]

        # Si el candidato requiere solo mujeres
        if candidate_requires_women_only:
            if not candidate_is_female:
                return False, "Rechazado por protocolo 'Solo Mujeres': La opción solo está habilitada para usuarias de género femenino."
            if not driver_is_female:
                return False, "Rechazado por protocolo 'Solo Mujeres': El conductor asignado no cumple con el requisito exclusivo de conductoras mujeres."
            for g in assigned_passengers_genders:
                if g.upper() not in ["F", "FEMENINO", "FEMALE"]:
                    return False, "Rechazado por protocolo 'Solo Mujeres': El viaje cuenta con pasajeros masculinos ya confirmados."

        return True, "Protocolo de seguridad verificado exitosamente."

    @classmethod
    def calculate_affinity_score(
        cls,
        driver: DriverRouteSchema,
        passenger: PassengerRequestSchema,
    ) -> Dict[str, Any]:
        """
        Calcula el puntaje de afinidad y genera las etiquetas comunitarias (tags).
        """
        affinity_points = 0.0
        tags = []

        # 1. Misma Facultad o Programa Académico
        d_faculty = getattr(driver, "driver_faculty", None)
        p_faculty = getattr(passenger, "faculty", None)
        if d_faculty and p_faculty and d_faculty.strip().lower() == p_faculty.strip().lower():
            affinity_points += cls.WEIGHT_FACULTY_MATCH
            tags.append(f"Misma Facultad ({d_faculty})")

        # 2. Reputación Destacada (>= 4.8 estrellas)
        p_rating = getattr(passenger, "rating", 5.0)
        d_rating = getattr(driver, "driver_rating", 5.0)
        if p_rating >= 4.8 and d_rating >= 4.8:
            affinity_points += cls.WEIGHT_RATING
            tags.append("⭐ Usuarios con Reputación Elite")

        # 3. Amigos o Compañeros en Común
        mutual = getattr(passenger, "mutual_friends_count", 0)
        if mutual > 0:
            affinity_points += min(3.0, mutual * cls.WEIGHT_MUTUAL_FRIENDS)
            tags.append(f"👥 {mutual} contactos en común en la UNAB")

        # 4. Modo Solo Mujeres
        if getattr(passenger, "women_only_required", False):
            tags.append("🛡️ Modo Exclusivo Solo Mujeres")

        score_normalized = min(10.0, round(5.0 + affinity_points, 1))

        return {
            "affinity_score": score_normalized,
            "affinity_bonus_discount": round(affinity_points * 0.75, 2),
            "affinity_tags": tags,
        }


affinity_safety_engine = AffinitySafetyEngine()
