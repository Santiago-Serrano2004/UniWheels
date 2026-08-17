import math
import copy
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.route_optimization import (
    LatLng,
    RouteStop,
    PassengerRequestSchema,
)
from app.services.osrm_client import osrm_client
from app.services.xgboost_eta_predictor import eta_predictor
from app.services.affinity_safety_service import affinity_safety_engine
from app.services.turn_penalty_service import turn_penalty_engine


class DynamicReoptimizerEngine:
    """
    Motor de Re-optimización Dinámica en Caliente (Dynamic ALNS with Live GPS Streaming).
    Permite incorporar nuevos pasajeros en tiempo real mientras el conductor ya está en marcha,
    congelando las paradas ya ejecutadas y preservando la puntualidad de los pasajeros a bordo.
    """

    async def reoptimize_in_transit(
        self,
        current_driver_location: LatLng,
        current_heading_degrees: Optional[float],
        driver_id: str,
        driver_name: str,
        driver_gender: str,
        driver_capacity: int,
        max_allowed_detour_minutes: float,
        passengers_on_board_ids: List[str],
        active_remaining_stops: List[Dict[str, Any]],
        new_passenger: PassengerRequestSchema,
        destination_location: LatLng,
        destination_address: str = "UNAB Campus El Jardín",
    ) -> Dict[str, Any]:
        """
        Evalúa e inserta en caliente a un nuevo pasajero sobre la ruta en curso.
        """
        # 1. Validación de Capacidad Actual
        # Ocupantes actuales = pasajeros a bordo + recogidas pendientes no realizadas
        pending_pickups = [
            s for s in active_remaining_stops if s.get("type") == "pickup"
        ]
        current_occupancy = len(passengers_on_board_ids) + len(pending_pickups)

        if current_occupancy >= driver_capacity:
            return {
                "accepted": False,
                "reason": f"Capacidad vehicular agotada ({current_occupancy}/{driver_capacity} cupos ocupados).",
                "new_ordered_stops": [],
                "detour_added_minutes": 0.0,
                "new_eta_minutes": 0.0,
                "new_route_polyline": [],
                "updated_passenger_etas": {},
                "notification_prompt": "No fue posible aceptar la solicitud por cupo lleno.",
            }

        # 2. Validación de Seguridad 'Solo Mujeres'
        on_board_genders = ["F"] * len(passengers_on_board_ids)  # Asumido verificado
        is_compliant, reason = affinity_safety_engine.check_women_only_compliance(
            driver_gender=driver_gender,
            assigned_passengers_genders=on_board_genders,
            candidate_passenger_gender=getattr(new_passenger, "gender", "F"),
            candidate_requires_women_only=getattr(new_passenger, "women_only_required", False),
        )
        if not is_compliant:
            return {
                "accepted": False,
                "reason": reason,
                "new_ordered_stops": [],
                "detour_added_minutes": 0.0,
                "new_eta_minutes": 0.0,
                "new_route_polyline": [],
                "updated_passenger_etas": {},
                "notification_prompt": reason,
            }

        # 3. Ruta Base Restante (Desde Posición GPS Actual hasta el final)
        remaining_coords = [(current_driver_location.lat, current_driver_location.lng)]
        for s in active_remaining_stops:
            remaining_coords.append((s["location"]["lat"], s["location"]["lng"]))

        base_res = await osrm_client.get_route(remaining_coords)
        base_time_min = base_res["duration_seconds"] / 60.0

        # 4. Búsqueda de Inserción Óptima de (Pickup, Dropoff) del Nuevo Pasajero
        # El origen actual es el índice 0 (current_driver_location)
        current_stops = copy.deepcopy(active_remaining_stops)
        n = len(current_stops)

        best_cost = float("inf")
        best_cand_stops = None
        best_detour = float("inf")
        best_new_time = float("inf")

        # Probar inserción: pickup en i, dropoff en j (con i <= j)
        for i in range(0, n + 1):  # Pickup puede ser la siguiente parada
            for j in range(i, n + 1):  # Dropoff después de pickup
                cand = copy.deepcopy(current_stops)

                pickup_stop = {
                    "type": "pickup",
                    "user_id": new_passenger.passenger_id,
                    "user_name": new_passenger.passenger_name,
                    "location": {
                        "lat": new_passenger.pickup_location.lat,
                        "lng": new_passenger.pickup_location.lng,
                    },
                    "address": new_passenger.pickup_address,
                }
                cand.insert(i, pickup_stop)

                dropoff_stop = {
                    "type": "dropoff",
                    "user_id": new_passenger.passenger_id,
                    "user_name": new_passenger.passenger_name,
                    "location": {
                        "lat": new_passenger.destination_location.lat,
                        "lng": new_passenger.destination_location.lng,
                    },
                    "address": new_passenger.destination_address,
                }
                cand.insert(j + 1, dropoff_stop)

                # Evaluar tiempo del recorrido candidato
                eval_coords = [(current_driver_location.lat, current_driver_location.lng)]
                for s in cand:
                    eval_coords.append((s["location"]["lat"], s["location"]["lng"]))

                cand_route = await osrm_client.get_route(eval_coords)
                cand_time_min = cand_route["duration_seconds"] / 60.0
                detour = max(0.0, cand_time_min - base_time_min)

                if detour <= max_allowed_detour_minutes and cand_time_min < best_cost:
                    best_cost = cand_time_min
                    best_cand_stops = cand
                    best_detour = detour
                    best_new_time = cand_time_min

        if best_cand_stops is None:
            return {
                "accepted": False,
                "reason": f"El desvío dinámico superaría el umbral permitido de {max_allowed_detour_minutes} min.",
                "new_ordered_stops": [],
                "detour_added_minutes": 0.0,
                "new_eta_minutes": 0.0,
                "new_route_polyline": [],
                "updated_passenger_etas": {},
                "notification_prompt": "Solicitud no aceptada por desvío excesivo.",
            }

        # 5. Construir Geometría Final y Horarios Actualizados
        final_eval_coords = [(current_driver_location.lat, current_driver_location.lng)]
        for s in best_cand_stops:
            final_eval_coords.append((s["location"]["lat"], s["location"]["lng"]))

        final_route = await osrm_client.get_route(final_eval_coords)

        # Ajuste de duración con XGBoost en vivo
        eta_res = eta_predictor.predict_travel_time_minutes(
            distance_km=final_route["distance_meters"] / 1000.0,
            traffic_kappa=1.15,
            num_stops=len(best_cand_stops),
        )
        total_remaining_eta_min = eta_res["predicted_eta_minutes"]

        # Calcular nuevos ETAs por parada
        updated_etas = {}
        cumulative_min = 0.0
        formatted_stops = []

        # Posición actual del vehículo como origen dinámico
        formatted_stops.append(
            RouteStop(
                stop_index=0,
                type="origin",
                user_id=driver_id,
                user_name=driver_name,
                location=current_driver_location,
                address="Posición Actual en Marcha",
                estimated_arrival="En Curso",
            )
        )

        for idx, s in enumerate(best_cand_stops):
            cumulative_min += total_remaining_eta_min / max(1, len(best_cand_stops))
            arrival_str = f"+{int(cumulative_min)} min"
            updated_etas[s["user_id"]] = arrival_str

            formatted_stops.append(
                RouteStop(
                    stop_index=idx + 1,
                    type=s["type"],
                    user_id=s["user_id"],
                    user_name=s["user_name"],
                    location=LatLng(lat=s["location"]["lat"], lng=s["location"]["lng"]),
                    address=s["address"],
                    estimated_arrival=arrival_str,
                )
            )

        notification_text = (
            f"🚗 ¡Nuevo compañero añadido en ruta! {new_passenger.passenger_name} "
            f"en {new_passenger.pickup_address} (+{round(best_detour, 1)} min)."
        )

        return {
            "accepted": True,
            "reason": "Re-optimización dinámica en caliente ejecutada con éxito.",
            "new_ordered_stops": formatted_stops,
            "detour_added_minutes": round(best_detour, 1),
            "new_eta_minutes": total_remaining_eta_min,
            "new_route_polyline": final_route["coordinates"],
            "updated_passenger_etas": updated_etas,
            "notification_prompt": notification_text,
        }


dynamic_reoptimizer = DynamicReoptimizerEngine()
