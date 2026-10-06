"""Sondeo del contrato real para la revisión estática de packages/shared/src/api.js.

Cada sonda llama al backend local con exactamente lo que enviaría api.js y registra lo observado.
No es un escenario: sus resultados van en resultados.json -> "contrato".
"""
from datetime import timedelta

from .acciones import V, ahora, iso, publicar_con_sugerido, reservar
from .personas import PERSONAS as P


def sondear(ctx) -> list[dict]:
    ctx.pasos, ctx.aserciones = [], []
    api = ctx.api
    out = []

    def nota(clave, api_js, esperado, resp, extra=None):
        out.append({
            "sonda": clave, "api_js": api_js, "esperado_por_el_cliente": esperado,
            "status": resp.status, "respuesta": (resp.texto or "")[:500], "extra": extra,
        })

    p1, c1, p3 = P["p1"], P["c1"], P["p3"]
    r = api.req("GET", "auth", f"{V}/user/reputation-stats", token=p1.token, etiqueta="getUserReputationStats")
    nota("reputation-stats", "tripsService.getUserReputationStats()", "rating_average, total_trips, puntualidad, amabilidad, reviews_count", r,
         {"claves_recibidas": sorted((r.get("data") or {}).keys())})

    r = api.req("POST", "auth", f"{V}/auth/delete-account-direct", token=p1.token, json_body={"email": p1.email}, etiqueta="authService.deleteAccount (endpoint del cliente)")
    nota("delete-account-direct", "authService.deleteAccount(email) -> POST /auth/delete-account-direct", "200 y cuenta eliminada", r)

    r = api.req("GET", "trip", f"{V}/driver/history", token=c1.token, etiqueta="getDriverHistory")
    nota("driver-history", "tripsService.getDriverHistory()", "lista de viajes del conductor", r, {"items": len(r.get("data") or [])})

    # calificación: payload exacto de mobile (trip_id, rated_user_id, role_rated, score, optional_comment)
    trip = ctx.estado.get("s1_trip_id")
    if not trip:  # corrida parcial: toma el último viaje completado de p1
        h = api.req("GET", "trip", f"{V}/passenger/history", token=p1.token, etiqueta="p1: historial (buscar viaje completado)")
        trip = next((t["id"] for t in (h.get("data") or []) if t.get("status") == "completado"), None)
    if trip:
        r = api.req("POST", "notif", f"{V}/ratings", token=p1.token,
                    json_body={"trip_id": trip, "rated_user_id": c1.user_id, "role_rated": "conductor", "score": 5, "optional_comment": "Excelente (sim)"},
                    etiqueta="submitRating (pasajero califica a su conductor)")
        nota("ratings-ok", "tripsService.submitRating", "201", r)
        r = api.req("POST", "notif", f"{V}/ratings", token=p3.token,
                    json_body={"trip_id": trip, "rated_user_id": c1.user_id, "role_rated": "conductor", "score": 1, "optional_comment": "no viajé (sim)"},
                    etiqueta="submitRating por alguien que NO viajó")
        nota("ratings-no-participante", "—", "403/422 (solo participantes del viaje completado)", r)
        r = api.req("GET", "auth", f"{V}/user/reputation-stats", token=c1.token, etiqueta="reputación del conductor tras calificaciones")
        nota("reputation-tras-ratings", "getUserReputationStats", "promedio y total de viajes actualizados", r)
    r = api.req("GET", "notif", f"{V}/notifications", token=p1.token, etiqueta="getUserNotifications")
    nota("notifications", "notificationsService.getUserNotifications", "{success, unread_count, data}", r, {"claves": sorted((r.data or {}).keys()) if isinstance(r.data, dict) else None})
    r = api.req("POST", "notif", f"{V}/push/device-tokens", token=p1.token, json_body={"token": "ExponentPushToken[sim]", "platform": "expo", "device_name": "sim", "app_version": "1.0.0"}, etiqueta="registerDeviceToken")
    nota("device-token", "notificationsService.registerDeviceToken", "201/200", r)
    r = api.req("POST", "notif", f"{V}/push/device-tokens/remove", token=p1.token, json_body={"token": "ExponentPushToken[sim]"}, etiqueta="unregisterDeviceToken")
    nota("device-token-remove", "notificationsService.unregisterDeviceToken", "200", r)
    r = api.req("GET", "vehicle", f"{V}/vehicles/check-approved", token=c1.token, params={"user_id": p1.user_id, "plate_number": "XXX999"}, etiqueta="checkApprovedVehicle con user_id/plate_number ajenos")
    nota("check-approved", "vehicleService.checkApprovedVehicle(userId, plate)", "se evalúa al usuario del token (user_id/plate ignorados)", r, {"has_approved_vehicle": r.get("has_approved_vehicle")})
    r = api.req("GET", "vehicle", f"{V}/vehicles", token=p1.token, etiqueta="getAllVehiclesForAdmin ejecutado por un no-admin")
    nota("vehicles-list", "vehicleService.getAllVehiclesForAdmin()", "todos los vehículos (nombre 'ForAdmin')", r, {"items": len(r.get("data") or [])})

    # GET /routes (listado público de rutas): ¿datos reales de conductor/vehículo?
    r = api.req("GET", "route", f"{V}/routes", token=p1.token, etiqueta="GET /routes (listado de rutas)")
    primero = (r.get("data") or [{}])[0]
    nota("routes-listado", "routeApiClient.get('/routes')", "nombre/placa/vehículo reales del conductor", r,
         {"driver_name": primero.get("driver_name"), "plate": primero.get("plate"), "vehicle": primero.get("vehicle"), "rating": primero.get("rating")})

    # Reserva con el payload exacto de mobile (map.tsx:474): scheduled_pickup_time = `${fecha}T00:00:00`
    # y cancelación del pasajero con el valor correcto ('pasajero') para aislar el efecto de la hora.
    c2, p13 = P["c2"], P["p13"]
    salida = ahora() + timedelta(hours=3)
    pub, sug = publicar_con_sugerido(ctx, c2, salida, 3, ctx.sede("JARDIN"))
    ruta = pub.get("data.id")
    if ruta:
        medianoche = f"{salida.date().isoformat()}T00:00:00"
        bk = reservar(ctx, p13, ruta, sug, medianoche, "Ciudadela Real de Minas", "Campus El Jardín",
                      etiqueta="p13: reservar con scheduled_pickup_time de la app móvil (fecha + T00:00:00)")
        cn = api.req("POST", "trip", f"{V}/trips/{bk.get('data.trip_id')}/cancel", token=p13.token,
                     json_body={"cancelled_by": "pasajero", "reason": "Cambio de planes simulado"},
                     etiqueta="p13: cancelar 3 h antes de la salida real")
        nota("cancelacion-hora-movil", "map.tsx:482 scheduled_pickup_time = fecha + T00:00:00", "cancelar 3 h antes de la salida NO es tardía", cn,
             {"salida_real": iso(salida), "scheduled_pickup_time_enviado": medianoche, "late_cancellation": cn.get("data.late_cancellation")})

    # Formato de la hora de salida en la búsqueda: ruta de la tarde (17:30 en Bogotá, enviada con -05:00)
    from .acciones import buscar, encontrar, hora
    c3 = P["c3"]
    pub2, _ = publicar_con_sugerido(ctx, c3, hora(1, 17, 30), 3, ctx.sede("JARDIN"), origen=c3.lat_lng)
    if pub2.get("data.id"):
        b = buscar(ctx, p13, c3.lat_lng, ctx.sede("JARDIN"), etiqueta="p13: buscar la ruta de las 17:30")
        m = encontrar(b, pub2.get("data.id"))
        nota("hora-en-busqueda", "routeApiClient search-match -> scheduled_departure_time", "17:30 (hora de Bogotá, formato legible)", b,
             {"enviada": "17:30-05:00", "scheduled_departure_time": (m or {}).get("scheduled_departure_time"),
              "departure_timestamp": (m or {}).get("departure_timestamp")})
    return out
