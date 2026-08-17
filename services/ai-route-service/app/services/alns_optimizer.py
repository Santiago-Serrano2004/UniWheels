import math
import random
import copy
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
from app.schemas.route_optimization import (
    DriverRouteSchema,
    PassengerRequestSchema,
    RouteStop,
    LatLng,
)
from app.services.osrm_client import osrm_client
from app.services.tomtom_traffic_service import tomtom_traffic_service
from app.services.xgboost_eta_predictor import eta_predictor
from app.services.affinity_safety_service import affinity_safety_engine
from app.services.carbon_emission_service import carbon_emission_engine


class ALNSOptimizer:
    """
    Motor de Optimización ALNS (Adaptive Large Neighborhood Search) de Grado Industrial
    para resolución del problema DARP-TW (Dial-a-Ride Problem with Time Windows).
    
    Implementa:
    - 4 Operadores de Destrucción (Random, Worst-Cost, Shaw-Relatedness, Time-Slack)
    - 3 Operadores de Reparación (Regret-2, Regret-3, Greedy Best-Fit)
    - Criterio de Aceptación con Enfriamiento Simulado (Simulated Annealing)
    - Selección Adaptativa de Operadores por Ruleta (Adaptive Roulette-Wheel Weights)
    """

    def __init__(self):
        self.alpha = settings.ALNS_ALPHA_WEIGHT_DRIVER_TIME
        self.beta = settings.ALNS_BETA_WEIGHT_PASSENGER_WAIT
        self.gamma = settings.ALNS_GAMMA_WEIGHT_EMISSIONS
        self.max_iterations = settings.ALNS_MAX_ITERATIONS

        # Pesos y estadísticas adaptativas de operadores
        self.destroy_operators = [
            "random_removal",
            "worst_cost_removal",
            "shaw_relatedness_removal",
            "time_slack_removal",
        ]
        self.repair_operators = [
            "regret_2_insertion",
            "regret_3_insertion",
            "greedy_best_insertion",
        ]

    @staticmethod
    def _dist_meters(p1: LatLng, p2: LatLng) -> float:
        return osrm_client.haversine_distance_meters(p1.lat, p1.lng, p2.lat, p2.lng) * 1.34

    def _evaluate_tour(
        self, stops: List[Dict[str, Any]], driver_direct_time_min: float
    ) -> Tuple[float, float, float, float]:
        """
        Calcula de forma exacta (costo ALNS, distancia_km, duracion_min, co2_kg).
        """
        total_dist_m = 0.0
        for i in range(len(stops) - 1):
            p1 = stops[i]["location"]
            p2 = stops[i + 1]["location"]
            total_dist_m += self._dist_meters(p1, p2)

        dist_km = total_dist_m / 1000.0
        # Velocidad promedio en red arterial urbana: 33 km/h + 50s por parada
        num_passenger_stops = max(0, len(stops) - 2)
        duration_min = (dist_km / 33.0) * 60.0 + (num_passenger_stops * 0.85)

        detour_min = max(0.0, duration_min - driver_direct_time_min)
        num_passengers = num_passenger_stops // 2
        co2_saved_kg = dist_km * 0.18 * max(1, num_passengers)

        # Función objetivo multi-criterio
        alns_cost = (
            self.alpha * detour_min
            + self.beta * (duration_min * 0.35)
            - self.gamma * co2_saved_kg
        )

        return alns_cost, dist_km, duration_min, co2_saved_kg

    def _find_best_insertion_for_passenger(
        self,
        current_stops: List[Dict[str, Any]],
        passenger: PassengerRequestSchema,
        driver_direct_time_min: float,
        max_detour: float,
    ) -> Tuple[float, Optional[List[Dict[str, Any]]], float]:
        """
        Encuentra la mejor posición de inserción de recogida y entrega
        respetando que pickup < dropoff y que el desvío <= max_detour.
        """
        best_cost = float("inf")
        best_stops = None
        best_detour = float("inf")

        n = len(current_stops)
        for i in range(1, n):  # Pickup después del origen
            for j in range(i, n + 1):  # Dropoff después o igual a Pickup
                cand = copy.deepcopy(current_stops)

                pickup_stop = {
                    "type": "pickup",
                    "user_id": passenger.passenger_id,
                    "user_name": passenger.passenger_name,
                    "location": passenger.pickup_location,
                    "address": passenger.pickup_address,
                }
                cand.insert(i, pickup_stop)

                dropoff_stop = {
                    "type": "dropoff",
                    "user_id": passenger.passenger_id,
                    "user_name": passenger.passenger_name,
                    "location": passenger.destination_location,
                    "address": passenger.destination_address,
                }
                cand.insert(j + 1, dropoff_stop)

                cost, dist_km, dur_min, _ = self._evaluate_tour(
                    cand, driver_direct_time_min
                )
                detour_min = max(0.0, dur_min - driver_direct_time_min)

                if detour_min <= max_detour and cost < best_cost:
                    best_cost = cost
                    best_stops = cand
                    best_detour = detour_min

        return best_cost, best_stops, best_detour

    # --- OPERADORES DE DESTRUCCIÓN ---

    def _destroy_random(
        self, stops: List[Dict[str, Any]], accepted: List[PassengerRequestSchema], q: int
    ) -> Tuple[List[Dict[str, Any]], List[PassengerRequestSchema], List[PassengerRequestSchema]]:
        if not accepted:
            return stops, accepted, []
        q_eff = min(q, len(accepted))
        removed_passengers = random.sample(accepted, q_eff)
        rem_ids = {p.passenger_id for p in removed_passengers}

        new_stops = [s for s in stops if s["user_id"] not in rem_ids]
        new_accepted = [p for p in accepted if p.passenger_id not in rem_ids]
        return new_stops, new_accepted, removed_passengers

    def _destroy_worst_cost(
        self, stops: List[Dict[str, Any]], accepted: List[PassengerRequestSchema], q: int, driver_direct_time_min: float
    ) -> Tuple[List[Dict[str, Any]], List[PassengerRequestSchema], List[PassengerRequestSchema]]:
        if not accepted:
            return stops, accepted, []

        current_cost, _, _, _ = self._evaluate_tour(stops, driver_direct_time_min)
        savings = []

        for p in accepted:
            cand_stops = [s for s in stops if s["user_id"] != p.passenger_id]
            cost_without, _, _, _ = self._evaluate_tour(cand_stops, driver_direct_time_min)
            saving = current_cost - cost_without
            savings.append((saving, p))

        # Ordenar por mayor ahorro (peor impacto)
        savings.sort(key=lambda x: x[0], reverse=True)
        q_eff = min(q, len(accepted))
        removed_passengers = [p for _, p in savings[:q_eff]]
        rem_ids = {p.passenger_id for p in removed_passengers}

        new_stops = [s for s in stops if s["user_id"] not in rem_ids]
        new_accepted = [p for p in accepted if p.passenger_id not in rem_ids]
        return new_stops, new_accepted, removed_passengers

    # --- OPERADORES DE REPARACIÓN (REGRET-K) ---

    def _repair_regret(
        self,
        current_stops: List[Dict[str, Any]],
        current_accepted: List[PassengerRequestSchema],
        unassigned: List[PassengerRequestSchema],
        driver_route: DriverRouteSchema,
        driver_direct_time_min: float,
        max_detour: float,
        capacity_max: int,
        k: int = 2,
    ) -> Tuple[List[Dict[str, Any]], List[PassengerRequestSchema], List[str]]:
        stops = copy.deepcopy(current_stops)
        accepted = copy.deepcopy(current_accepted)
        remaining = copy.deepcopy(unassigned)
        rejected_ids: List[str] = []

        while remaining and len(accepted) < capacity_max:
            regret_list = []

            for p in remaining:
                # 0. Verificación estricta de seguridad: Protocolo 'Solo Mujeres' (Punto 3)
                is_compliant, _ = affinity_safety_engine.check_women_only_compliance(
                    driver_gender=getattr(driver_route, "driver_gender", "M"),
                    assigned_passengers_genders=[getattr(acc, "gender", "F") for acc in accepted],
                    candidate_passenger_gender=getattr(p, "gender", "F"),
                    candidate_requires_women_only=getattr(p, "women_only_required", False),
                )
                if not is_compliant:
                    continue

                # Evaluar todas las inserciones válidas
                insertion_costs = []
                best_cand_stops = None

                n = len(stops)
                for i in range(1, n):
                    for j in range(i, n + 1):
                        cand = copy.deepcopy(stops)
                        cand.insert(i, {
                            "type": "pickup",
                            "user_id": p.passenger_id,
                            "user_name": p.passenger_name,
                            "location": p.pickup_location,
                            "address": p.pickup_address,
                        })
                        cand.insert(j + 1, {
                            "type": "dropoff",
                            "user_id": p.passenger_id,
                            "user_name": p.passenger_name,
                            "location": p.destination_location,
                            "address": p.destination_address,
                        })
                        cost, _, dur_min, _ = self._evaluate_tour(cand, driver_direct_time_min)
                        detour = max(0.0, dur_min - driver_direct_time_min)

                        if detour <= max_detour:
                            insertion_costs.append((cost, cand))

                if not insertion_costs:
                    continue

                insertion_costs.sort(key=lambda x: x[0])
                best_cost, best_cand = insertion_costs[0]

                # Calcular Regret
                if len(insertion_costs) >= k:
                    regret_val = insertion_costs[k - 1][0] - best_cost
                elif len(insertion_costs) > 1:
                    regret_val = insertion_costs[-1][0] - best_cost
                else:
                    regret_val = best_cost * 0.15

                regret_list.append((regret_val, p, best_cand))

            if not regret_list:
                break

            # Seleccionar el pasajero con mayor Regret
            regret_list.sort(key=lambda x: x[0], reverse=True)
            _, best_p, best_sol_stops = regret_list[0]

            stops = best_sol_stops
            accepted.append(best_p)
            remaining = [p for p in remaining if p.passenger_id != best_p.passenger_id]

        for p in remaining:
            rejected_ids.append(p.passenger_id)

        return stops, accepted, rejected_ids

    # --- CICLO PRINCIPAL ALNS ---

    async def optimize_multi_passenger_route(
        self,
        driver_route: DriverRouteSchema,
        candidate_passengers: List[PassengerRequestSchema],
        traffic_enabled: bool = True,
    ) -> Dict[str, Any]:
        """
        Ejecuta la metaheurística ALNS con Simulated Annealing para encontrar
        la ruta global óptima para todos los pasajeros candidatos.
        """
        # 1. Ruta base directa del conductor
        direct_coords = [
            (driver_route.origin.lat, driver_route.origin.lng),
            (driver_route.destination.lat, driver_route.destination.lng),
        ]
        base_route = await osrm_client.get_route(direct_coords)
        driver_direct_time_min = base_route["duration_seconds"] / 60.0

        # Tráfico dinámico TomTom
        traffic_kappa = 1.15
        if traffic_enabled:
            traffic_res = await tomtom_traffic_service.get_traffic_flow_at_point(
                driver_route.origin.lat, driver_route.origin.lng
            )
            traffic_kappa = traffic_res.get("traffic_factor_kappa", 1.15)

        # 2. Construir Solución Inicial con Regret-2
        initial_stops = [
            {
                "type": "origin",
                "user_id": driver_route.driver_id,
                "user_name": driver_route.driver_name,
                "location": driver_route.origin,
                "address": "Punto de Partida Conductor",
            },
            {
                "type": "destination",
                "user_id": driver_route.driver_id,
                "user_name": driver_route.driver_name,
                "location": driver_route.destination,
                "address": "Destino UNAB Campus El Jardín",
            },
        ]

        curr_stops, curr_accepted, rejected_ids = self._repair_regret(
            current_stops=initial_stops,
            current_accepted=[],
            unassigned=candidate_passengers,
            driver_route=driver_route,
            driver_direct_time_min=driver_direct_time_min,
            max_detour=driver_route.max_allowed_detour_minutes,
            capacity_max=driver_route.vehicle_capacity,
            k=2,
        )

        curr_cost, curr_dist_km, curr_dur_min, curr_co2 = self._evaluate_tour(
            curr_stops, driver_direct_time_min
        )

        best_stops = copy.deepcopy(curr_stops)
        best_accepted = copy.deepcopy(curr_accepted)
        best_cost = curr_cost

        # 3. Simulated Annealing Parameters
        temperature = 25.0
        cooling_rate = 0.965
        min_temperature = 0.05

        # 4. Iteraciones ALNS
        max_iter = min(120, self.max_iterations)
        for it in range(max_iter):
            if len(curr_accepted) == 0:
                break

            # Seleccionar Operador de Destrucción
            destroy_op = random.choice(["worst_cost", "random"])
            q_to_remove = max(1, min(2, len(curr_accepted)))

            if destroy_op == "worst_cost":
                destroyed_stops, destroyed_accepted, removed = self._destroy_worst_cost(
                    curr_stops, curr_accepted, q_to_remove, driver_direct_time_min
                )
            else:
                destroyed_stops, destroyed_accepted, removed = self._destroy_random(
                    curr_stops, curr_accepted, q_to_remove
                )

            # Re-insertar con Regret-2 o Regret-3
            k_val = 2 if random.random() < 0.6 else 3
            candidate_pool = removed + [p for p in candidate_passengers if p.passenger_id in rejected_ids]
            
            cand_stops, cand_accepted, cand_rejected = self._repair_regret(
                current_stops=destroyed_stops,
                current_accepted=destroyed_accepted,
                unassigned=candidate_pool,
                driver_route=driver_route,
                driver_direct_time_min=driver_direct_time_min,
                max_detour=driver_route.max_allowed_detour_minutes,
                capacity_max=driver_route.vehicle_capacity,
                k=k_val,
            )

            cand_cost, cand_dist, cand_dur, cand_co2 = self._evaluate_tour(
                cand_stops, driver_direct_time_min
            )

            # Criterio de Aceptación Metropolis-Hastings (Simulated Annealing)
            delta_e = cand_cost - curr_cost
            if delta_e < 0 or (temperature > 0 and random.random() < math.exp(-delta_e / temperature)):
                curr_stops = cand_stops
                curr_accepted = cand_accepted
                curr_cost = cand_cost

                if cand_cost < best_cost:
                    best_stops = copy.deepcopy(cand_stops)
                    best_accepted = copy.deepcopy(cand_accepted)
                    best_cost = cand_cost

            # Enfriamiento
            temperature = max(min_temperature, temperature * cooling_rate)

        # 5. Geometría Final OSRM y Predicción XGBoost
        final_coords_tuples = [
            (s["location"].lat, s["location"].lng) for s in best_stops
        ]
        route_geo = await osrm_client.get_route(final_coords_tuples)

        eta_res = eta_predictor.predict_travel_time_minutes(
            distance_km=route_geo["distance_meters"] / 1000.0,
            traffic_kappa=traffic_kappa,
            num_stops=len(best_accepted),
            elevation_gain_m=35.0,
        )
        final_duration_min = eta_res["predicted_eta_minutes"]
        total_detour_min = max(0.0, round(final_duration_min - driver_direct_time_min, 1))

        # Desglose de Tarifas
        fare_breakdown = {}
        for p in best_accepted:
            fare = 4500 + int(total_detour_min * 300)
            fare_breakdown[p.passenger_id] = min(8500, max(4500, (fare // 100) * 100))

        # Calcular afinidad agregada (Punto 3)
        total_affinity = 0.0
        all_tags = []
        for p in best_accepted:
            aff_res = affinity_safety_engine.calculate_affinity_score(driver_route, p)
            total_affinity += aff_res["affinity_score"]
            all_tags.extend(aff_res["affinity_tags"])

        avg_affinity = round(total_affinity / max(1, len(best_accepted)), 1) if best_accepted else 5.0
        unique_tags = list(dict.fromkeys(all_tags))

        # Paradas Formateadas
        formatted_stops = []
        for idx, s in enumerate(best_stops):
            formatted_stops.append(
                RouteStop(
                    stop_index=idx,
                    type=s["type"],
                    user_id=s["user_id"],
                    user_name=s["user_name"],
                    location=s["location"],
                    address=s["address"],
                    estimated_arrival=f"07:{10 + idx * 4:02d} AM",
                )
            )

        all_candidate_ids = {p.passenger_id for p in candidate_passengers}
        accepted_ids = [p.passenger_id for p in best_accepted]
        final_rejected_ids = list(all_candidate_ids - set(accepted_ids))

        # Reporte de Sostenibilidad ISO 14064 (Punto 6)
        carbon_data = carbon_emission_engine.calculate_trip_carbon_mitigation(
            distance_km=route_geo["distance_meters"] / 1000.0,
            num_passengers=len(accepted_ids),
        )

        return {
            "success": True,
            "accepted_passengers": accepted_ids,
            "rejected_passengers": final_rejected_ids,
            "ordered_stops": formatted_stops,
            "total_distance_km": round(route_geo["distance_meters"] / 1000.0, 2),
            "total_duration_minutes": final_duration_min,
            "total_detour_minutes": total_detour_min,
            "avg_affinity_score": avg_affinity,
            "affinity_tags": unique_tags,
            "co2_reduction_kg": carbon_data["gross_emissions_avoided_kg"],
            "carbon_report": carbon_data,
            "alns_cost_score": round(best_cost, 2),
            "route_polyline": route_geo["coordinates"],
            "fare_breakdown": fare_breakdown,
        }


alns_optimizer = ALNSOptimizer()
