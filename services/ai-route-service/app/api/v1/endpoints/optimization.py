from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from app.schemas.route_optimization import (
    RouteEvaluationRequest,
    RouteEvaluationResponse,
    MultiPassengerALNSRequest,
    MultiPassengerALNSResponse,
    DynamicReoptimizationRequest,
    DynamicReoptimizationResponse,
    CarbonLedgerReport,
    ModalityEnum,
    LatLng,
)
from app.services.osrm_client import osrm_client
from app.services.tomtom_traffic_service import tomtom_traffic_service
from app.services.xgboost_eta_predictor import eta_predictor
from app.services.alns_optimizer import alns_optimizer
from app.services.smart_walking_service import smart_walking_engine
from app.services.turn_penalty_service import turn_penalty_engine
from app.services.affinity_safety_service import affinity_safety_engine
from app.services.carbon_emission_service import carbon_emission_engine

router = APIRouter(prefix="/optimize", tags=["AI Route Optimization"])


@router.post("/match", response_model=RouteEvaluationResponse)
async def evaluate_single_passenger_match(
    payload: RouteEvaluationRequest,
) -> RouteEvaluationResponse:
    """
    Evalúa la compatibilidad espacial y temporal de un pasajero respecto a la ruta activa del conductor.
    Integra el motor de Puntos de Encuentro Inteligentes con Radio Caminable (Virtual Bus Stops),
    la Matriz de Penalización de Giros Complejos (Turn Penalties) y el Filtro de Afinidad y Seguridad (Puntos 1, 2 y 3).
    """
    driver = payload.driver_route
    passenger = payload.passenger_request

    # 0. Verificación estricta de seguridad: Protocolo 'Solo Mujeres'
    is_compliant, compliance_msg = affinity_safety_engine.check_women_only_compliance(
        driver_gender=getattr(driver, "driver_gender", "M"),
        assigned_passengers_genders=[],
        candidate_passenger_gender=getattr(passenger, "gender", "F"),
        candidate_requires_women_only=getattr(passenger, "women_only_required", False),
    )

    if not is_compliant:
        return RouteEvaluationResponse(
            is_viable=False,
            modality=ModalityEnum.REJECTED,
            detour_minutes=0.0,
            original_duration_minutes=0.0,
            new_total_duration_minutes=0.0,
            suggested_fare_cop=0,
            traffic_status="N/A",
            traffic_multiplier_kappa=1.0,
            recommended_pickup=passenger.pickup_location,
            is_smart_pickup_applied=False,
            walking_distance_meters=0.0,
            walking_time_minutes=0.0,
            driver_time_saved_minutes=0.0,
            walking_instructions="",
            turn_penalty_seconds=0.0,
            turn_breakdown=None,
            affinity_score=0.0,
            affinity_tags=["Incompatible por protocolo 'Solo Mujeres'"],
            polyline_coordinates=[],
            summary_message=compliance_msg,
        )

    # 1. Ruta Directa Base del Conductor (incluyendo waypoints si existen)
    base_coords = [(driver.origin.lat, driver.origin.lng)]
    if driver.waypoints:
        for wp in driver.waypoints:
            base_coords.append((wp.lat, wp.lng))
    base_coords.append((driver.destination.lat, driver.destination.lng))

    base_route = await osrm_client.get_route(base_coords)
    base_duration_min = base_route["duration_seconds"] / 60.0

    # 2. Evaluación de Punto de Encuentro Inteligente con Radio Caminable (Punto 1)
    smart_walk_res = smart_walking_engine.find_optimal_walking_pickup(
        passenger_location=passenger.pickup_location,
        driver_route_polyline=base_route["coordinates"],
        max_walking_radius_meters=passenger.max_walking_distance_meters,
    )

    effective_pickup = smart_walk_res["pickup_point"]

    # 3. Tráfico TomTom en Tiempo Real
    traffic_res = await tomtom_traffic_service.get_traffic_flow_at_point(
        effective_pickup.lat, effective_pickup.lng
    )
    traffic_kappa = traffic_res.get("traffic_factor_kappa", 1.15)
    traffic_status = traffic_res.get("status_description", "Tráfico fluido")

    # 4. Ruta con el Punto Efectivo (Origen Conductor -> Punto Recogida -> Destino UNAB)
    detour_coords = [
        (driver.origin.lat, driver.origin.lng),
        (effective_pickup.lat, effective_pickup.lng),
        (driver.destination.lat, driver.destination.lng),
    ]
    detour_route = await osrm_client.get_route(detour_coords)

    # 5. Predicción precisa con XGBoost
    eta_calc = eta_predictor.predict_travel_time_minutes(
        distance_km=detour_route["distance_meters"] / 1000.0,
        traffic_kappa=traffic_kappa,
        num_stops=1,
    )

    # 6. Análisis de Giros Complejos y Penalizaciones (Punto 2)
    turn_analysis = turn_penalty_engine.evaluate_route_turns(
        polyline=[(pt[0], pt[1]) for pt in detour_route["coordinates"]],
        is_peak_hour=eta_calc.get("is_peak_hour", False),
    )

    # 7. Cálculo de Afinidad y Etiquetas Comunitarias (Punto 3)
    aff_res = affinity_safety_engine.calculate_affinity_score(driver, passenger)

    total_new_duration_min = eta_calc["predicted_eta_minutes"]
    detour_min = max(0.0, round(total_new_duration_min - base_duration_min, 1))

    # 8. Clasificación de Modalidad
    max_allowed = driver.max_allowed_detour_minutes
    if detour_min <= 1.5 or smart_walk_res["is_smart_pickup_applicable"]:
        modality = ModalityEnum.DIRECT
        is_viable = True
        suggested_fare = 4500
        msg = (
            f"Modalidad 1 Directa: Punto de encuentro optimizado sobre la vía principal. "
            f"Desvío mínimo conductor de {detour_min} min (Caminata pasajero: {int(smart_walk_res['walking_distance_meters'])}m)."
        )
    elif detour_min <= max_allowed:
        modality = ModalityEnum.DETOUR
        is_viable = True
        # Recargo por desvío: $300 COP por minuto adicional
        suggested_fare = int(4500 + (detour_min * 300))
        suggested_fare = min(8500, max(4500, (suggested_fare // 100) * 100))
        msg = f"Modalidad 2 con Desvío: Desvío vehicular de +{detour_min} min (Límite conductor: {max_allowed} min)."
    else:
        modality = ModalityEnum.REJECTED
        is_viable = False
        suggested_fare = 0
        msg = f"Inviable: Desvío vehicular de +{detour_min} min supera el umbral máximo de {max_allowed} min."

    # 9. Cálculo de Huella de Carbono ISO 14064 (Punto 6)
    carbon_data = carbon_emission_engine.calculate_trip_carbon_mitigation(
        distance_km=detour_route["distance_meters"] / 1000.0,
        num_passengers=1,
    )

    return RouteEvaluationResponse(
        is_viable=is_viable,
        modality=modality,
        detour_minutes=detour_min,
        original_duration_minutes=round(base_duration_min, 1),
        new_total_duration_minutes=total_new_duration_min,
        suggested_fare_cop=suggested_fare,
        traffic_status=traffic_status,
        traffic_multiplier_kappa=traffic_kappa,
        recommended_pickup=effective_pickup,
        is_smart_pickup_applied=smart_walk_res["is_smart_pickup_applicable"],
        walking_distance_meters=smart_walk_res["walking_distance_meters"],
        walking_time_minutes=smart_walk_res["walking_time_minutes"],
        driver_time_saved_minutes=smart_walk_res["driver_time_saved_minutes"],
        walking_instructions=smart_walk_res["walking_instructions"],
        turn_penalty_seconds=turn_analysis["total_penalty_seconds"],
        turn_breakdown=turn_analysis["turn_counts"],
        affinity_score=aff_res["affinity_score"],
        affinity_tags=aff_res["affinity_tags"],
        carbon_report=CarbonLedgerReport(**carbon_data),
        polyline_coordinates=detour_route["coordinates"],
        summary_message=msg,
    )


@router.post("/multi-passenger-alns", response_model=MultiPassengerALNSResponse)
async def optimize_multi_passenger_alns(
    payload: MultiPassengerALNSRequest,
) -> MultiPassengerALNSResponse:
    """
    Ejecuta el Algoritmo ALNS (Adaptive Large Neighborhood Search) para optimizar
    la secuencia de paradas de múltiples pasajeros candidatos en un solo viaje de carpooling (DARP-TW).
    """
    res = await alns_optimizer.optimize_multi_passenger_route(
        driver_route=payload.driver_route,
        candidate_passengers=payload.candidate_passengers,
        traffic_enabled=payload.traffic_layer_enabled,
    )

    return MultiPassengerALNSResponse(**res)


@router.post("/dynamic-reoptimize", response_model=DynamicReoptimizationResponse)
async def dynamic_reoptimize_in_transit(
    payload: DynamicReoptimizationRequest,
) -> DynamicReoptimizationResponse:
    """
    Ejecuta la Re-optimización Dinámica en Caliente mientras el vehículo está en marcha (Punto 4).
    Evalúa e inserta un nuevo pasajero sobre las paradas pendientes restantes en < 15 milisegundos.
    """
    from app.services.dynamic_reoptimization_service import dynamic_reoptimizer

    res = await dynamic_reoptimizer.reoptimize_in_transit(
        current_driver_location=payload.current_driver_location,
        current_heading_degrees=payload.current_heading_degrees,
        driver_id=payload.driver_id,
        driver_name=payload.driver_name,
        driver_gender=payload.driver_gender,
        driver_capacity=payload.driver_capacity,
        max_allowed_detour_minutes=payload.max_allowed_detour_minutes,
        passengers_on_board_ids=payload.passengers_on_board_ids,
        active_remaining_stops=payload.active_remaining_stops,
        new_passenger=payload.new_candidate_passenger,
        destination_location=payload.destination_location,
        destination_address=payload.destination_address,
    )

    return DynamicReoptimizationResponse(**res)


@router.get("/traffic-corridor")
async def get_corridor_traffic(
    lat: float = Query(7.0856, description="Latitud WGS84"),
    lng: float = Query(-73.1142, description="Longitud WGS84"),
) -> Dict[str, Any]:
    """
    Consulta en tiempo real la velocidad de flujo y factor de congestión de TomTom Traffic API.
    """
    return await tomtom_traffic_service.get_traffic_flow_at_point(lat, lng)


@router.get("/demand-forecast")
async def get_demand_forecast_heatmap(
    hour: float = Query(7.0, ge=0.0, le=24.0, description="Hora objetivo (formato 24h, ej. 7.5 para 7:30 AM)"),
    day_of_week: int = Query(1, ge=0, le=6, description="Día de la semana: 0=Lunes, 6=Domingo"),
    is_raining: bool = Query(False, description="Condición de lluvia"),
) -> Dict[str, Any]:
    """
    Genera el Mapa de Calor (Heatmap) con predicción espacio-temporal de demanda universitaria (Punto 5).
    """
    from app.services.demand_forecasting_service import demand_forecasting_engine

    return demand_forecasting_engine.generate_spatiotemporal_demand_heatmap(
        target_hour=hour,
        day_of_week=day_of_week,
        is_raining=is_raining,
    )


@router.post("/driver-departure-recommendations")
async def get_driver_recommendations(
    driver_origin: LatLng,
    departure_hour: float = Query(7.0, ge=0.0, le=24.0),
    day_of_week: int = Query(1, ge=0, le=6),
) -> Dict[str, Any]:
    """
    Genera recomendaciones proactivas de salida para conductores según la demanda predictiva en su zona de partida (Punto 5).
    """
    from app.services.demand_forecasting_service import demand_forecasting_engine

    return demand_forecasting_engine.get_driver_proactive_recommendation(
        driver_origin=driver_origin,
        driver_departure_hour=departure_hour,
        day_of_week=day_of_week,
    )
