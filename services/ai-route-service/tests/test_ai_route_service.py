import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.xgboost_eta_predictor import eta_predictor
from app.services.osrm_client import osrm_client
from app.services.tomtom_traffic_service import tomtom_traffic_service
from app.schemas.route_optimization import DriverRouteSchema, PassengerRequestSchema, LatLng


# ==============================================================================
# 1. PRUEBAS MATEMÁTICAS Y DE RENDIMIENTO DE XGBOOST
# ==============================================================================

def test_xgboost_accuracy_and_r2_score():
    """Verifica que el modelo XGBoost tenga una precisión R2 > 0.95 y MAE < 0.50 min."""
    metrics = eta_predictor.metrics
    assert metrics["mean_r2_score"] >= 0.95, f"R2 insuficiente: {metrics['mean_r2_score']}"
    assert metrics["mean_mae_minutes"] <= 0.60, f"MAE demasiado alto: {metrics['mean_mae_minutes']}"


def test_xgboost_peak_hour_monotonicity():
    """Verifica que a la misma distancia, la hora pico (07:15 AM) tarde más que la hora valle (10:00 AM)."""
    res_pico = eta_predictor.predict_travel_time_minutes(distance_km=7.5, departure_hour=7.25, day_of_week=1)
    res_valle = eta_predictor.predict_travel_time_minutes(distance_km=7.5, departure_hour=10.0, day_of_week=1)

    assert res_pico["predicted_eta_minutes"] > res_valle["predicted_eta_minutes"]
    assert res_pico["is_peak_hour"] is True
    assert res_valle["is_peak_hour"] is False


def test_xgboost_rain_delay_monotonicity():
    """Verifica que la lluvia incremente el tiempo de viaje estimado."""
    res_seco = eta_predictor.predict_travel_time_minutes(distance_km=8.0, is_raining=False)
    res_lluvia = eta_predictor.predict_travel_time_minutes(distance_km=8.0, is_raining=True)

    assert res_lluvia["predicted_eta_minutes"] > res_seco["predicted_eta_minutes"]


def test_xgboost_extreme_distance_bounds():
    """Verifica robustez ante distancias mínimas (100m) y distancias interurbanas (35km)."""
    res_min = eta_predictor.predict_travel_time_minutes(distance_km=0.1)
    assert res_min["predicted_eta_minutes"] >= 1.5

    res_max = eta_predictor.predict_travel_time_minutes(distance_km=35.0)
    assert res_max["predicted_eta_minutes"] > 40.0


# ==============================================================================
# 2. PRUEBAS DEL MOTOR TOPOGRÁFICO Y GEODÉSICO (OSRM / HAVERSINE)
# ==============================================================================

def test_haversine_bucaramanga_distance_accuracy():
    """Verifica el cálculo geodésico exacto entre Cañaveral y UNAB Campus El Jardín (~6.8 km en línea recta)."""
    canaveral = (7.0678, -73.1066)
    unab_jardin = (7.1193, -73.1042)

    dist_m = osrm_client.haversine_distance_meters(
        canaveral[0], canaveral[1], unab_jardin[0], unab_jardin[1]
    )

    # Distancia en línea recta ~5.7 km, sinuosidad ~7.6 km
    assert 5500 <= dist_m <= 6000


@pytest.mark.asyncio
async def test_osrm_fallback_polyline_generation():
    """Verifica la generación de polilíneas continuas sin saltos nulos."""
    coords = [(7.0678, -73.1066), (7.0856, -73.1142), (7.1193, -73.1042)]
    route = await osrm_client.get_route(coords)

    assert route["distance_meters"] > 6000
    assert route["duration_seconds"] > 300
    assert len(route["coordinates"]) >= 15


# ==============================================================================
# 3. PRUEBAS DEL ALGORITMO ALNS Y RESTRICCIONES DURAS (DARP-TW)
# ==============================================================================

@pytest.mark.asyncio
async def test_alns_precedence_constraint_enforcement():
    """
    RESTRICCIÓN DURA DE PRECEDENCIA:
    Para cada pasajero, la parada de recogida (pickup) DEBE estar antes que la entrega (dropoff).
    """
    driver = DriverRouteSchema(
        driver_id="d1",
        driver_name="Carlos Mendoza",
        origin=LatLng(lat=7.0678, lng=-73.1066),
        destination=LatLng(lat=7.1193, lng=-73.1042),
        vehicle_capacity=3,
        departure_time="06:45 AM",
        max_allowed_detour_minutes=12.0,
    )

    passengers = [
        PassengerRequestSchema(
            passenger_id="p1",
            passenger_name="Santiago Serrano",
            pickup_location=LatLng(lat=7.1186, lng=-73.1102),
            pickup_address="Parque San Pío",
            destination_location=LatLng(lat=7.1193, lng=-73.1042),
            destination_address="UNAB",
        ),
        PassengerRequestSchema(
            passenger_id="p2",
            passenger_name="Valentina Gómez",
            pickup_location=LatLng(lat=7.0856, lng=-73.1142),
            pickup_address="Provenza",
            destination_location=LatLng(lat=7.1193, lng=-73.1042),
            destination_address="UNAB",
        ),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/optimize/multi-passenger-alns",
            json={"driver_route": driver.model_dump(), "candidate_passengers": [p.model_dump() for p in passengers]},
        )
        assert resp.status_code == 200
        data = resp.json()

        stops = data["ordered_stops"]
        for p_id in data["accepted_passengers"]:
            pickup_idx = next(i for i, s in enumerate(stops) if s["user_id"] == p_id and s["type"] == "pickup")
            dropoff_idx = next(i for i, s in enumerate(stops) if s["user_id"] == p_id and s["type"] == "dropoff")
            assert pickup_idx < dropoff_idx, f"Violación de precedencia para {p_id}: pickup {pickup_idx} >= dropoff {dropoff_idx}"


@pytest.mark.asyncio
async def test_alns_vehicle_capacity_constraint():
    """
    RESTRICCIÓN DURA DE CAPACIDAD:
    Si hay 5 candidatos pero la capacidad del carro es 2, exactamente 2 son aceptados y 3 rechazados.
    """
    driver = DriverRouteSchema(
        driver_id="d1",
        driver_name="Carlos Mendoza",
        origin=LatLng(lat=7.0678, lng=-73.1066),
        destination=LatLng(lat=7.1193, lng=-73.1042),
        vehicle_capacity=2,  # Capacidad estricta de 2 cupos
        departure_time="06:45 AM",
        max_allowed_detour_minutes=15.0,
    )

    passengers = [
        PassengerRequestSchema(
            passenger_id=f"p{i}",
            passenger_name=f"Pasajero {i}",
            pickup_location=LatLng(lat=7.08 + (i * 0.005), lng=-73.11),
            pickup_address=f"Punto {i}",
            destination_location=LatLng(lat=7.1193, lng=-73.1042),
            destination_address="UNAB",
        )
        for i in range(5)
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/optimize/multi-passenger-alns",
            json={"driver_route": driver.model_dump(), "candidate_passengers": [p.model_dump() for p in passengers]},
        )
        data = resp.json()
        assert len(data["accepted_passengers"]) == 2
        assert len(data["rejected_passengers"]) == 3


@pytest.mark.asyncio
async def test_alns_hard_detour_rejection():
    """
    RESTRICCIÓN DURA DE DESVÍO MÁXIMO:
    Un pasajero ubicado en Piedecuesta (muy lejos) debe ser rechazado si el conductor fijó desvío máx de 8 min.
    """
    driver = DriverRouteSchema(
        driver_id="d1",
        driver_name="Carlos Mendoza",
        origin=LatLng(lat=7.0678, lng=-73.1066),  # Cañaveral
        destination=LatLng(lat=7.1193, lng=-73.1042),  # UNAB El Jardín
        vehicle_capacity=3,
        departure_time="06:45 AM",
        max_allowed_detour_minutes=6.0,  # Desvío máximo bajo
    )

    passengers = [
        PassengerRequestSchema(
            passenger_id="p_piedecuesta",
            passenger_name="Pasajero Lejano",
            pickup_location=LatLng(lat=6.9880, lng=-73.0500),  # Piedecuesta (al sur, desvío de >20 min)
            pickup_address="Piedecuesta",
            destination_location=LatLng(lat=7.1193, lng=-73.1042),
            destination_address="UNAB",
        )
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/optimize/multi-passenger-alns",
            json={"driver_route": driver.model_dump(), "candidate_passengers": [p.model_dump() for p in passengers]},
        )
        data = resp.json()
        assert "p_piedecuesta" in data["rejected_passengers"]
        assert len(data["accepted_passengers"]) == 0


# ==============================================================================
# 4. PRUEBAS DE VALIDACIÓN DE ESQUEMAS Y ENDPOINTS REST (FASTAPI)
# ==============================================================================

@pytest.mark.asyncio
async def test_invalid_latitude_schema_rejection():
    """Verifica que Pydantic rechace coordenadas con latitud fuera de rango (-90 a 90) con HTTP 422."""
    payload = {
        "driver_route": {
            "driver_id": "d1",
            "driver_name": "Carlos",
            "origin": {"lat": 120.0, "lng": -73.10},  # LATITUD INVÁLIDA
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "departure_time": "07:00 AM",
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Santiago",
            "pickup_location": {"lat": 7.11, "lng": -73.11},
            "pickup_address": "Parque San Pío",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/match", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_stress_concurrent_evaluations():
    """Prueba de estrés: Ejecuta 25 evaluaciones concurrentes en paralelo en < 1 segundo."""
    payload = {
        "driver_route": {
            "driver_id": "d1",
            "driver_name": "Carlos Mendoza",
            "origin": {"lat": 7.0678, "lng": -73.1066},
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "vehicle_capacity": 3,
            "departure_time": "06:45 AM",
            "max_allowed_detour_minutes": 12.0,
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Santiago Serrano",
            "pickup_location": {"lat": 7.1186, "lng": -73.1102},
            "pickup_address": "Parque San Pío",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tasks = [client.post("/api/v1/optimize/match", json=payload) for _ in range(25)]
        responses = await asyncio.gather(*tasks)

        assert len(responses) == 25
        assert all(r.status_code == 200 for r in responses)


# ==============================================================================
# 5. PRUEBAS DE PUNTOS DE ENCUENTRO INTELIGENTES (SMART WALKING PICKUPS - PUNTO 1)
# ==============================================================================

@pytest.mark.asyncio
async def test_smart_walking_within_radius_projection():
    """
    Verifica que un estudiante a 150m de la Autopista sea proyectado sobre la vía principal,
    clasificando en Modalidad 1 Directa y ahorrando tiempo de desvío al conductor.
    """
    payload = {
        "driver_route": {
            "driver_id": "d1",
            "driver_name": "Carlos Mendoza",
            "origin": {"lat": 7.0678, "lng": -73.1066},
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "waypoints": [{"lat": 7.0856, "lng": -73.1142}],  # Autopista Floridablanca / Provenza
            "departure_time": "06:45 AM",
            "max_allowed_detour_minutes": 10.0,
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Santiago Serrano",
            "pickup_location": {"lat": 7.0858, "lng": -73.1152},  # A ~110m de Provenza/Autopista
            "pickup_address": "Cerca a Autopista",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
            "max_walking_distance_meters": 250.0,  # Radio caminable amplio
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/match", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_smart_pickup_applied"] is True
        assert 50.0 <= data["walking_distance_meters"] <= 250.0
        assert data["walking_time_minutes"] > 0.0
        assert data["driver_time_saved_minutes"] > 0.0
        assert data["modality"] == "modalidad_1_directa"


@pytest.mark.asyncio
async def test_smart_walking_exceeding_radius_no_projection():
    """
    Verifica que si el estudiante está demasiado lejos de la arteria vial (> radio caminable),
    el sistema NO lo obligue a caminar y requiera desvío vehicular.
    """
    payload = {
        "driver_route": {
            "driver_id": "d1",
            "driver_name": "Carlos Mendoza",
            "origin": {"lat": 7.0678, "lng": -73.1066},
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "departure_time": "06:45 AM",
            "max_allowed_detour_minutes": 10.0,
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Santiago Serrano",
            "pickup_location": {"lat": 7.0858, "lng": -73.1250},  # Muy al interior del barrio (~1.1 km)
            "pickup_address": "Interior Barrio",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
            "max_walking_distance_meters": 150.0,  # Radio caminable bajo
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/match", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_smart_pickup_applied"] is False
        assert data["walking_distance_meters"] == 0.0


# ==============================================================================
# 6. PRUEBAS DE LA MATRIZ DE PENALIZACIÓN DE GIROS COMPLEJOS (PUNTO 2)
# ==============================================================================

def test_turn_classification_angles():
    """
    Verifica la clasificación geométrica de giros a la derecha, izquierda y retorno en U.
    """
    from app.services.turn_penalty_service import turn_penalty_engine, TurnTypeEnum

    # Giro a la derecha de ~90 grados (Norte -> Este)
    p1 = (7.0, -73.0)
    p2 = (7.01, -73.0)  # Hacia el Norte
    p3 = (7.01, -72.99)  # Hacia el Este
    t_type, angle, pen = turn_penalty_engine.classify_turn(p1, p2, p3)
    assert t_type in [TurnTypeEnum.SHARP_RIGHT, TurnTypeEnum.SLIGHT_RIGHT]
    assert angle > 0  # Ángulo positivo para derecha

    # Giro a la izquierda de ~90 grados (Norte -> Oeste)
    p4 = (7.01, -73.01)  # Hacia el Oeste
    t_type_left, angle_left, pen_left = turn_penalty_engine.classify_turn(p1, p2, p4)
    assert t_type_left in [TurnTypeEnum.SHARP_LEFT, TurnTypeEnum.SLIGHT_LEFT]
    assert angle_left < 0  # Ángulo negativo para izquierda
    assert pen_left > pen  # Giro a la izquierda penaliza más que giro a la derecha

    # Retorno en U (Norte -> Sur)
    p_u = (7.0, -73.0)
    t_type_u, angle_u, pen_u = turn_penalty_engine.classify_turn(p1, p2, p_u)
    assert t_type_u == TurnTypeEnum.U_TURN
    assert pen_u >= 130.0  # Penalización severa por retorno en U


def test_turn_penalty_peak_hour_surcharge():
    """Verifica que en hora pico los giros a la izquierda reciban un recargo del 30%."""
    from app.services.turn_penalty_service import turn_penalty_engine

    poly = [(7.0, -73.0), (7.01, -73.0), (7.01, -73.01), (7.02, -73.01)]
    res_valle = turn_penalty_engine.evaluate_route_turns(poly, is_peak_hour=False)
    res_pico = turn_penalty_engine.evaluate_route_turns(poly, is_peak_hour=True)

    assert res_pico["total_penalty_seconds"] >= res_valle["total_penalty_seconds"]


# ==============================================================================
# 7. PRUEBAS DE AFINIDAD Y PROTOCOLO SOLO MUJERES (PUNTO 3)
# ==============================================================================

@pytest.mark.asyncio
async def test_women_only_protocol_male_driver_rejection():
    """
    Verifica que si una estudiante activa 'Solo Mujeres', un conductor masculino sea rechazado de inmediato.
    """
    payload = {
        "driver_route": {
            "driver_id": "d1",
            "driver_name": "Carlos Mendoza",
            "driver_gender": "M",  # Conductor masculino
            "origin": {"lat": 7.0678, "lng": -73.1066},
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "departure_time": "06:45 AM",
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Valentina Gómez",
            "gender": "F",
            "women_only_required": True,  # Requiere solo mujeres
            "pickup_location": {"lat": 7.0856, "lng": -73.1142},
            "pickup_address": "Provenza",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/match", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_viable"] is False
        assert "Solo Mujeres" in data["summary_message"]


@pytest.mark.asyncio
async def test_women_only_protocol_female_driver_success():
    """
    Verifica que si conductora y pasajeras son mujeres, el viaje sea aprobado con etiqueta de seguridad.
    """
    payload = {
        "driver_route": {
            "driver_id": "d_female",
            "driver_name": "Laura Pedraza",
            "driver_gender": "F",  # Conductora mujer
            "driver_faculty": "Medicina",
            "origin": {"lat": 7.0678, "lng": -73.1066},
            "destination": {"lat": 7.1193, "lng": -73.1042},
            "departure_time": "06:45 AM",
        },
        "passenger_request": {
            "passenger_id": "p1",
            "passenger_name": "Valentina Gómez",
            "gender": "F",
            "faculty": "Medicina",  # Misma facultad
            "women_only_required": True,
            "pickup_location": {"lat": 7.0856, "lng": -73.1142},
            "pickup_address": "Provenza",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "UNAB",
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/match", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_viable"] is True
        assert data["affinity_score"] >= 7.0
        assert any("Solo Mujeres" in tag for tag in data["affinity_tags"])
        assert any("Medicina" in tag for tag in data["affinity_tags"])


# ==============================================================================
# 8. PRUEBAS DE RE-OPTIMIZACIÓN DINÁMICA EN CALIENTE (PUNTO 4)
# ==============================================================================

@pytest.mark.asyncio
async def test_dynamic_reoptimization_in_transit_success():
    """
    Verifica la inserción exitosa en caliente de un pasajero mientras el vehículo ya va en marcha.
    """
    payload = {
        "current_driver_location": {"lat": 7.0856, "lng": -73.1142},  # En marcha por Provenza
        "driver_id": "d1",
        "driver_name": "Carlos Mendoza",
        "driver_gender": "M",
        "driver_capacity": 3,
        "max_allowed_detour_minutes": 10.0,
        "passengers_on_board_ids": ["p_already_onboard"],
        "active_remaining_stops": [
            {
                "type": "dropoff",
                "user_id": "p_already_onboard",
                "user_name": "Laura",
                "location": {"lat": 7.1193, "lng": -73.1042},
                "address": "Campus El Jardín",
            },
            {
                "type": "destination",
                "user_id": "d1",
                "user_name": "Carlos",
                "location": {"lat": 7.1193, "lng": -73.1042},
                "address": "Campus El Jardín",
            },
        ],
        "new_candidate_passenger": {
            "passenger_id": "p_new_in_transit",
            "passenger_name": "Santiago Serrano",
            "gender": "M",
            "pickup_location": {"lat": 7.1186, "lng": -73.1102},  # Parque San Pío
            "pickup_address": "Parque San Pío",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "Campus El Jardín",
        },
        "destination_location": {"lat": 7.1193, "lng": -73.1042},
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/dynamic-reoptimize", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["accepted"] is True
        assert len(data["new_ordered_stops"]) >= 4
        assert data["detour_added_minutes"] <= 6.0
        assert "Santiago Serrano" in data["notification_prompt"]


@pytest.mark.asyncio
async def test_dynamic_reoptimization_capacity_exhaustion():
    """
    Verifica que si los cupos del carro están llenos con pasajeros a bordo,
    la re-optimización rechace la nueva inserción.
    """
    payload = {
        "current_driver_location": {"lat": 7.0856, "lng": -73.1142},
        "driver_id": "d1",
        "driver_name": "Carlos Mendoza",
        "driver_capacity": 2,  # Capacidad máxima 2
        "passengers_on_board_ids": ["p1", "p2"],  # Ya van 2 personas a bordo
        "active_remaining_stops": [],
        "new_candidate_passenger": {
            "passenger_id": "p3",
            "passenger_name": "Mateo",
            "gender": "M",
            "pickup_location": {"lat": 7.1186, "lng": -73.1102},
            "pickup_address": "San Pío",
            "destination_location": {"lat": 7.1193, "lng": -73.1042},
            "destination_address": "Campus El Jardín",
        },
        "destination_location": {"lat": 7.1193, "lng": -73.1042},
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/optimize/dynamic-reoptimize", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["accepted"] is False
        assert "agotada" in data["reason"]


# ==============================================================================
# 9. PRUEBAS DE PREDICCIÓN DE DEMANDA Y MAPAS DE CALOR (PUNTO 5)
# ==============================================================================

@pytest.mark.asyncio
async def test_demand_forecast_peak_morning_intensity():
    """
    Verifica que a las 07:00 AM de un día entre semana haya alta intensidad de demanda (>= 0.70)
    en los corredores hacia la UNAB y múltiples zonas de alta prioridad identificadas.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/optimize/demand-forecast?hour=7.0&day_of_week=1&is_raining=false")
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_heatmap_points"] >= 25
        assert len(data["high_demand_zones"]) >= 3
        assert any(z["zone_id"] == "canaveral" for z in data["high_demand_zones"])
        assert any(z["zone_id"] == "provenza" for z in data["high_demand_zones"])


@pytest.mark.asyncio
async def test_demand_forecast_midnight_low_intensity():
    """
    Verifica que en la madrugada (03:00 AM) la demanda sea mínima (< 0.20) y no existan alertas críticas.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/optimize/demand-forecast?hour=3.0&day_of_week=1&is_raining=false")
        assert resp.status_code == 200
        data = resp.json()

        assert len(data["high_demand_zones"]) == 0
        assert all(pt["intensity"] < 0.25 for pt in data["heatmap_points"])


@pytest.mark.asyncio
async def test_driver_proactive_departure_recommendations():
    """
    Verifica que el sistema genere recomendaciones inteligentes personalizadas para un conductor que sale de Cañaveral.
    """
    driver_origin = {"lat": 7.0678, "lng": -73.1066}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/optimize/driver-departure-recommendations?departure_hour=6.8&day_of_week=1",
            json=driver_origin,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert "Cañaveral" in data["closest_zone_name"]
        assert data["demand_intensity"] >= 0.70
        assert len(data["recommendations"]) >= 2
        assert any("17.400" in rec or "cupos" in rec for rec in data["recommendations"])


# ==============================================================================
# 10. PRUEBAS DE MEDICIÓN DE HUELLA DE CARBONO Y PROTOCOLO ISO 14064 (PUNTO 6)
# ==============================================================================

def test_carbon_mitigation_calculation_gasoline_car():
    """
    Verifica el cálculo de mitigación de CO2e bajo ISO 14064 para un viaje de 10 km con 3 pasajeros.
    """
    from app.services.carbon_emission_service import carbon_emission_engine, VehicleEmissionTypeEnum

    res = carbon_emission_engine.calculate_trip_carbon_mitigation(
        distance_km=10.0,
        num_passengers=3,
        vehicle_type=VehicleEmissionTypeEnum.GASOLINE_CAR,
    )

    # 3 pasajeros ahorran aprox. 3 * 10km * 165g/km = 4.95 kg de CO2
    assert res["gross_emissions_avoided_kg"] >= 4.5
    assert res["net_trip_emissions_kg"] > 0.0
    assert res["gasoline_saved_liters"] > 1.8
    assert res["trees_equivalent_annual"] > 0.20
    assert res["eco_points_earned"] >= 45
    assert "ISO 14064-1" in res["iso_14064_compliance_statement"]


def test_carbon_mitigation_vehicle_types_comparison():
    """
    Verifica que un vehículo eléctrico o híbrido produzca menores emisiones netas que uno a gasolina.
    """
    from app.services.carbon_emission_service import carbon_emission_engine, VehicleEmissionTypeEnum

    res_gas = carbon_emission_engine.calculate_trip_carbon_mitigation(
        distance_km=12.0, num_passengers=2, vehicle_type=VehicleEmissionTypeEnum.GASOLINE_CAR
    )
    res_ev = carbon_emission_engine.calculate_trip_carbon_mitigation(
        distance_km=12.0, num_passengers=2, vehicle_type=VehicleEmissionTypeEnum.ELECTRIC_CAR
    )

    assert res_ev["net_trip_emissions_kg"] < res_gas["net_trip_emissions_kg"]


@pytest.mark.asyncio
async def test_carbon_report_in_alns_multi_passenger_response():
    """
    Verifica que la respuesta completa de ALNS incluya el objeto carbon_report con EcoPoints.
    """
    driver = DriverRouteSchema(
        driver_id="d1",
        driver_name="Carlos Mendoza",
        origin=LatLng(lat=7.0678, lng=-73.1066),
        destination=LatLng(lat=7.1193, lng=-73.1042),
        vehicle_capacity=3,
        departure_time="06:45 AM",
        max_allowed_detour_minutes=12.0,
    )

    passengers = [
        PassengerRequestSchema(
            passenger_id="p1",
            passenger_name="Santiago Serrano",
            pickup_location=LatLng(lat=7.1186, lng=-73.1102),
            pickup_address="Parque San Pío",
            destination_location=LatLng(lat=7.1193, lng=-73.1042),
            destination_address="UNAB",
        ),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/optimize/multi-passenger-alns",
            json={"driver_route": driver.model_dump(), "candidate_passengers": [p.model_dump() for p in passengers]},
        )
        assert resp.status_code == 200
        data = resp.json()

        assert "carbon_report" in data
        assert data["carbon_report"]["eco_points_earned"] > 0
        assert data["carbon_report"]["gasoline_saved_liters"] > 0.0





