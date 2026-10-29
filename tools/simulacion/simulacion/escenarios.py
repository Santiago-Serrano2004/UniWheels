"""Los 12 escenarios. Cada uno recibe un Ctx, registra pasos (vía Api) y aserciones (ctx.check)."""
import threading
import time
import uuid
from datetime import timedelta, timezone

from . import infra
from .acciones import (
    V, ahora, buscar, cancelar, ciclo_viaje, desplazar, encontrar, hora, iso, iso_utc, login, publicar,
    publicar_con_sugerido, reservar, sugerencia, sugerido_formula,
)
from .config import ADMIN_EMAIL, PASSWORD
from .personas import PERSONAS as P

ESCENARIOS = {}


def escenario(numero: int, nombre: str):
    def deco(fn):
        ESCENARIOS[numero] = (nombre, fn)
        return fn
    return deco


def _asiento(ctx, route_id):
    return infra.asientos_ruta(route_id)


# =============================================================== 1
@escenario(1, "Camino feliz")
def camino_feliz(ctx):
    c, p = P["c1"], P["p1"]
    sede = ctx.sede("JARDIN")
    salida = hora(1, 7, 0)
    s = sugerencia(ctx, c, c.lat_lng, sede)
    sug = s.get("data.suggested_contribution_cop")
    ctx.check("sugerencia 200 con aporte > 0", s.status == 200 and (sug or 0) > 0, "200 y aporte > 0", s.status)
    ctx.check("max_contribution_cop == suggested_contribution_cop", s.get("data.max_contribution_cop") == sug, sug, s.get("data.max_contribution_cop"))
    r = publicar(ctx, c, c.lat_lng, "Cabecera del Llano, Bucaramanga", sede, salida, 3, sug)
    ctx.check("publicar con el aporte sugerido -> 201", r.status == 201, 201, r.status)
    ruta = r.get("data.id")
    ctx.estado["s1_ruta"] = ruta
    ctx.check("la ruta guarda el aporte publicado", r.get("data.base_contribution_cop") == float(sug or -1), sug, r.get("data.base_contribution_cop"))
    esperado_utc = iso_utc(salida)
    devuelto = (r.get("data.scheduled_departure_time") or "")[:19] + "Z"
    ctx.check(f"la hora de salida enviada con offset -05:00 ({iso(salida)}) se guarda como el mismo instante ({esperado_utc})",
              devuelto == esperado_utc, esperado_utc, r.get("data.scheduled_departure_time"))

    b = buscar(ctx, p, desplazar(p.lat_lng, 80, 60), sede)
    m = encontrar(b, ruta)
    ctx.check("el pasajero encuentra la ruta del conductor", m is not None, "ruta en resultados", f"{b.get('total_matches')} resultados")
    if not m:
        return
    ctx.check("la búsqueda muestra el aporte exacto", m.get("suggested_fare_cop") == float(sug), sug, m.get("suggested_fare_cop"))
    ctx.check("la búsqueda muestra la hora local de salida (07:00 AM)", (m.get("scheduled_departure_time") or "").startswith("07:00"), "07:00 AM", m.get("scheduled_departure_time"))
    ctx.check("la búsqueda muestra el nombre real del conductor", c.nombre in (m.get("driver_name") or "") or "(sim)" in (m.get("driver_name") or ""), c.nombre, m.get("driver_name"))
    ctx.check("la búsqueda muestra la placa real", m.get("vehicle_plate") == c.placa, c.placa, m.get("vehicle_plate"))

    asientos0 = _asiento(ctx, ruta)
    bk = reservar(ctx, p, ruta, m["suggested_fare_cop"], m["departure_timestamp"], "Cabecera del Llano", sede["name"],
                  driver_name=c.nombre, vehicle_plate=c.placa, vehicle_model="Mazda 3")
    ctx.check("reservar por el aporte exacto -> 201", bk.status == 201, 201, bk.status)
    trip, pin = bk.get("data.trip_id"), bk.get("data.boarding_pin")
    ctx.check("se genera un PIN de 4 dígitos", isinstance(pin, str) and len(pin) == 4 and pin.isdigit(), "4 dígitos", pin)
    ctx.check("la reserva descuenta un cupo de la ruta", _asiento(ctx, ruta) == (asientos0 or 0) - 1, (asientos0 or 0) - 1, _asiento(ctx, ruta))
    if not trip:
        return
    ctx.estado["s1_trip_id"] = trip
    act = ctx.api.req("GET", "trip", f"{V}/passenger/active-trip", token=p.token, etiqueta="p1: viaje activo")
    ctx.check("el viaje activo del pasajero es el reservado", act.get("data.trip_id") == trip, trip, act.get("data.trip_id"))

    mal = ctx.api.req("POST", "trip", f"{V}/trips/{trip}/verify-pin", token=c.token, json_body={"pin": "0000" if pin != "0000" else "1111"}, etiqueta="c1: PIN incorrecto")
    ctx.check("PIN incorrecto -> 422", mal.status == 422, 422, mal.status)
    ciclo = ciclo_viaje(ctx, c, trip, pin)
    ctx.check("start/arrive/verify-pin/complete -> 200", all(v == 200 for v in ciclo.values()), ciclo, ciclo)
    tr = ctx.api.req("POST", "trip", f"{V}/trips/{trip}/tracking", token=c.token, json_body={"latitude": 7.11, "longitude": -73.11, "speed_kmh": 30}, etiqueta="c1: tracking")
    ctx.check("tracking de un viaje completado se rechaza", tr.status == 422, 422, tr.status)
    h = ctx.api.req("GET", "trip", f"{V}/passenger/history", token=p.token, etiqueta="p1: historial")
    hist = [t for t in (h.get("data") or []) if t["id"] == trip]
    ctx.check("el historial del pasajero muestra el viaje completado", bool(hist) and hist[0]["status"] == "completado", "completado", hist[0]["status"] if hist else None)

    # Reserva sin datos de conductor/vehículo enviados por el cliente
    p2 = P["p2"]
    sin = reservar(ctx, p2, ruta, m["suggested_fare_cop"], m["departure_timestamp"], "Lagos del Cacique", sede["name"], etiqueta="p2: reservar SIN driver/vehicle/passenger")
    ctx.check("la reserva no inventa placa/modelo/conductor cuando el cliente no los envía",
              sin.get("data.vehicle_plate") not in ("KLU-492", None) and sin.get("data.driver_name") != "Conductor UniWheels",
              f"placa {c.placa} / conductor {c.nombre}", f"placa={sin.get('data.vehicle_plate')} conductor={sin.get('data.driver_name')}")
    ctx.estado["s1_trip_p2"] = sin.get("data.trip_id")


# =============================================================== 2
@escenario(2, "Tope del aporte")
def tope_aporte(ctx):
    c = P["c2"]
    sede = ctx.sede("JARDIN")
    s = sugerencia(ctx, c, c.lat_lng, sede)
    sug = s.get("data.suggested_contribution_cop")
    ctx.check("sugerencia disponible", s.status == 200 and sug, 200, s.status)
    if not sug:
        return
    salida = hora(1, 7, 15)
    r = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, sug + 100, etiqueta="c2: publicar sugerido+100")
    ctx.check("aporte > sugerido -> 422", r.status == 422, 422, r.status)
    ctx.check("422 incluye max_contribution_cop == sugerido", r.get("data.max_contribution_cop") == sug, sug, r.get("data.max_contribution_cop"))
    r = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, sug + 1, etiqueta="c2: publicar sugerido+1")
    ctx.check("aporte = sugerido+1 -> 422 (borde)", r.status == 422, 422, r.status)
    r0 = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, 0, etiqueta="c2: publicar aporte 0")
    ctx.check("aporte 0 -> 201", r0.status == 201, 201, r0.status)
    rs = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, sug, etiqueta="c2: publicar aporte = sugerido")
    ctx.check("aporte = sugerido -> 201", rs.status == 201, 201, rs.status)
    rn = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, -100, etiqueta="c2: aporte negativo")
    ctx.check("aporte negativo -> 422", rn.status == 422, 422, rn.status)
    rd = publicar(ctx, c, c.lat_lng, "Cañaveral, Floridablanca", sede, salida, 3, 1500.5, etiqueta="c2: aporte decimal")
    ctx.check("aporte decimal -> 422", rd.status == 422, 422, rd.status)
    ctx.estado["s2_ruta_cero"] = r0.get("data.id")
    ctx.estado["s2_ruta_sug"] = rs.get("data.id")
    ctx.estado["s2_sug"] = sug


# =============================================================== 3
@escenario(3, "Moto: 1000 + 250/km y 1 cupo")
def moto(ctx):
    m, c = P["c5"], P["c1"]
    sede = ctx.sede("JARDIN")
    s = sugerencia(ctx, m, m.lat_lng, sede)
    km, sug = s.get("data.distance_km"), s.get("data.suggested_contribution_cop")
    ctx.check("tipo de vehículo devuelto = moto", s.get("data.vehicle_type") == "moto", "moto", s.get("data.vehicle_type"))
    if km is None or sug is None:
        ctx.check("sugerencia de moto disponible", False, 200, s.status)
        return
    esperado = sugerido_formula(km, "moto")
    ctx.check("sugerido moto = 1000 + 250/km (redondeo a 100; tolerancia 1 centena por distance_km redondeado)", abs(sug - esperado) <= 100, esperado, sug)
    sc = sugerencia(ctx, c, m.lat_lng, sede)
    ctx.check("mismo trayecto en carro cuesta más que en moto", (sc.get("data.suggested_contribution_cop") or 0) > sug, f"> {sug}", sc.get("data.suggested_contribution_cop"))
    r = publicar(ctx, m, m.lat_lng, "Girón, Santander", sede, hora(1, 6, 30), 1, sug, etiqueta="c5: publicar moto 1 cupo")
    ctx.check("publicar moto con 1 cupo -> 201", r.status == 201, 201, r.status)
    ctx.check("la ruta de moto queda con 1 cupo", r.get("data.available_seats") == 1, 1, r.get("data.available_seats"))
    ctx.estado["s3_ruta"] = r.get("data.id")
    r3 = publicar(ctx, m, m.lat_lng, "Girón, Santander", sede, hora(1, 6, 45), 3, sug, etiqueta="c5: publicar moto con 3 cupos")
    ctx.check("moto con 3 cupos se rechaza (regla: 1 cupo)", r3.status == 422, 422, f"{r3.status} cupos={r3.get('data.available_seats')}")
    rc = publicar(ctx, c, c.lat_lng, "Cabecera", sede, hora(1, 6, 50), 9, 0, etiqueta="c1: carro con 9 cupos")
    ctx.check("carro con 9 cupos -> 422", rc.status == 422, 422, rc.status)
    rcap = publicar(ctx, c, c.lat_lng, "Cabecera", sede, hora(1, 6, 55), 6, 0, etiqueta="c1: carro con 6 cupos (vehículo registrado con 4)")
    ctx.check("cupos de la ruta no superan la capacidad del vehículo registrado (4)", rcap.status == 422, 422, f"{rcap.status} cupos={rcap.get('data.available_seats')}")


# =============================================================== 4
@escenario(4, "Desvío (modalidad 2)")
def desvio(ctx):
    c, p = P["c3"], P["p2"]  # c3 sale de Floridablanca; p2 vive en Lagos del Cacique, fuera del corredor
    sede = ctx.sede("JARDIN")
    r, sug = publicar_con_sugerido(ctx, c, hora(1, 7, 30), 3, sede)
    ctx.check("ruta publicada", r.status == 201, 201, r.status)
    ruta = r.get("data.id")
    ctx.estado["s4_ruta"] = ruta
    if not ruta:
        return
    punto = p.lat_lng
    b = buscar(ctx, p, punto, sede, etiqueta="p2: buscar desde Lagos del Cacique (fuera del corredor)")
    m = encontrar(b, ruta)
    ctx.check("pasajero fuera del corredor encuentra la ruta por desvío", m is not None, "ruta en resultados", f"{b.get('total_matches')} resultados")
    ev = ctx.api.req("POST", "route", f"{V}/routes/{ruta}/evaluate-detour", token=p.token,
                     json_body={"pickup_lat": punto[0], "pickup_lng": punto[1]}, etiqueta="p2: evaluate-detour")
    ctx.check("evaluate-detour responde 200", ev.status == 200, 200, ev.status)
    if not m:
        return
    ctx.check("modalidad 2 (desvío)", m.get("modality") == "modalidad_2_desvio", "modalidad_2_desvio", m.get("modality"))
    ctx.check("el aporte del desvío es el mismo de la ruta", m.get("suggested_fare_cop") == float(sug), sug, m.get("suggested_fare_cop"))
    bk = reservar(ctx, p, ruta, m["suggested_fare_cop"], m["departure_timestamp"], "Lagos del Cacique", sede["name"], etiqueta="p2: reservar con desvío")
    ctx.check("reservar con desvío por el aporte de la ruta -> 201", bk.status == 201, 201, bk.status)


# =============================================================== 5
@escenario(5, "Cupos agotados")
def cupos(ctx):
    c = P["c3"]
    sede = ctx.sede("JARDIN")
    r, sug = publicar_con_sugerido(ctx, c, hora(1, 8, 0), 2, sede)
    ruta = r.get("data.id")
    ctx.check("ruta de 2 cupos publicada", r.status == 201 and ruta, 201, r.status)
    if not ruta:
        return
    codigos = []
    for clave in ("p3", "p4", "p7"):
        pas = P[clave]
        b = reservar(ctx, pas, ruta, sug, iso(hora(1, 8, 0)), "Origen sim", sede["name"], etiqueta=f"{clave}: reservar (cupo {len(codigos) + 1} de 2)")
        codigos.append(b.status)
    ctx.check("las 2 primeras reservas -> 201", codigos[:2] == [201, 201], [201, 201], codigos[:2])
    ctx.check("la 3.ª reserva (sin cupo) se rechaza", codigos[2] in (409, 422), "409/422", codigos[2])
    ctx.check("cupos de la ruta nunca quedan negativos y reflejan las reservas (0)", _asiento(ctx, ruta) == 0, 0, _asiento(ctx, ruta))
    b = buscar(ctx, P["p5"], P["c3"].lat_lng, sede, etiqueta="p5: buscar la ruta llena")
    ctx.check("una ruta sin cupos ya no aparece en la búsqueda", encontrar(b, ruta) is None, "no aparece", "aparece" if encontrar(b, ruta) else "no aparece")
    ctx.estado["s5_ruta"] = ruta


# =============================================================== 6
@escenario(6, "Cancelaciones tardías y suspensión")
def cancelaciones(ctx):
    p = P["p6"]
    sede = ctx.sede("JARDIN")
    conductores = [P["c1"], P["c2"], P["c3"], P["c4"]]
    rutas = []
    for c in conductores:
        r, sug = publicar_con_sugerido(ctx, c, hora(2, 7, 0), 3, sede)
        rutas.append((r.get("data.id"), sug))
    ctx.check("4 rutas publicadas en conductores distintos", all(x[0] for x in rutas), 4, sum(1 for x in rutas if x[0]))
    if not all(x[0] for x in rutas):
        return
    # 1) cancelación a tiempo (recogida en 2 días) no cuenta
    t0 = reservar(ctx, p, rutas[0][0], rutas[0][1], iso_utc(hora(2, 7, 0)), "Provenza", sede["name"], etiqueta="p6: reservar (a tiempo)")
    cn = cancelar(ctx, p, t0.get("data.trip_id"), "pasajero")
    ctx.check("cancelación a tiempo -> 200 sin penalización", cn.status == 200 and cn.get("data.late_cancellation") is False, "200 / late_cancellation=false", f"{cn.status} / {cn.get('data.late_cancellation')}")
    # 2-4) tres cancelaciones tardías (recogida en 1 minuto) en rutas distintas
    resultados = []
    for i, (ruta, sug) in enumerate(rutas[1:], 1):
        t = reservar(ctx, p, ruta, sug, iso_utc(ahora() + timedelta(seconds=60)), "Provenza", sede["name"], etiqueta=f"p6: reservar para cancelar tarde #{i}")
        cn = cancelar(ctx, p, t.get("data.trip_id"), "pasajero", etiqueta=f"p6: cancelar tarde #{i}")
        resultados.append(cn)
        ctx.check(f"cancelación tardía #{i} marcada como tardía", cn.get("data.late_cancellation") is True, True, cn.get("data.late_cancellation"))
        if i < 3:
            ctx.check(f"tras la tardía #{i} la cuenta sigue activa", cn.get("data.suspended") in (False, None), "no suspendida", cn.get("data.suspended"))
    ultima = resultados[-1]
    ctx.check("la 3.ª tardía suspende la cuenta (suspended=true)", ultima.get("data.suspended") is True, True, ultima.get("data.suspended"))
    ctx.check("la respuesta trae suspended_until", bool(ultima.get("data.suspended_until")), "fecha ISO", ultima.get("data.suspended_until"))
    lg = ctx.api.req("POST", "auth", f"{V}/auth/login", json_body={"email": p.email, "password": PASSWORD}, etiqueta="p6: login suspendido")
    ctx.check("login suspendido -> 403 con suspended_until", lg.status == 403 and bool(lg.get("suspended_until")), "403 + suspended_until", f"{lg.status} {lg.get('suspended_until')}")
    me = ctx.api.req("GET", "auth", f"{V}/auth/me", token=p.token, etiqueta="p6: /auth/me suspendido")
    ctx.check("auth-service: request con token -> 403 con suspended_until", me.status == 403 and bool(me.get("suspended_until")), "403 + suspended_until", f"{me.status} {me.get('suspended_until')}")
    for svc, path in (("trip", "/passenger/history"), ("route", "/routes"), ("vehicle", "/vehicles")):
        x = ctx.api.req("GET", svc, f"{V}{path}", token=p.token, etiqueta=f"p6 suspendida: GET {svc} {path}")
        ctx.check(f"{svc}-service: request suspendido -> 403 con suspended_until", x.status == 403 and bool(x.get("suspended_until")), "403 + suspended_until", f"{x.status} {x.get('suspended_until')}")
    ctx.estado["s6_user"] = p.user_id
    ctx.estado["s6_bitacora"] = infra.bitacora_usuario(p.user_id)


# =============================================================== 7
@escenario(7, "Levantamiento perezoso")
def levantamiento(ctx):
    p = P["p6"]
    st = infra.estado_usuario(p.user_id)
    if st["is_active"]:
        ctx.check("precondición: p6 suspendido por el escenario 6", False, "suspendido", st)
        return
    out = infra.tinker(f"App\\Models\\User::where('id','{p.user_id}')->update(['suspended_until'=>now()->subHour()]); echo 'OK';")
    ctx.nota(f"tinker: adelantar suspended_until -> {out[-40:]}")
    # primer request tras vencer el plazo: contra un servicio distinto de auth (como haría la app)
    x = ctx.api.req("GET", "trip", f"{V}/passenger/history", token=p.token, etiqueta="p6: 1.er request tras vencer (trip-service)")
    ctx.check("1.er request tras vencer el plazo (trip-service) ya no devuelve 403", x.status == 200, 200, x.status)
    me = ctx.api.req("GET", "auth", f"{V}/auth/me", token=p.token, etiqueta="p6: /auth/me tras vencer (auth-service)")
    ctx.check("request a auth-service reactiva al usuario (200)", me.status == 200, 200, me.status)
    st = infra.estado_usuario(p.user_id)
    ctx.check("is_active=true y suspended_until=null", st["is_active"] and st["suspended_until"] is None, "activo", st)
    log = infra.bitacora_usuario(p.user_id)
    ctx.check("la bitácora registra auto_reactivated", "auto_reactivated" in log, "auto_reactivated en bitácora", log)
    x2 = ctx.api.req("GET", "trip", f"{V}/passenger/history", token=p.token, etiqueta="p6: trip-service tras reactivar")
    ctx.check("después de reactivado, trip-service responde 200", x2.status == 200, 200, x2.status)
    lg = ctx.api.req("POST", "auth", f"{V}/auth/login", json_body={"email": p.email, "password": PASSWORD}, etiqueta="p6: login tras reactivar")
    ctx.check("login funciona tras reactivar", lg.status == 200, 200, lg.status)
    if lg.status == 200:
        p.token = lg.get("data.access_token")


# =============================================================== 8
@escenario(8, "Administrador: usuarios y suspensión manual")
def administrador(ctx):
    a, u = ctx.admin_token, P["p7"]
    api = ctx.api
    ls = api.req("GET", "auth", f"{V}/admin/users", token=a, params={"search": "sim_", "per_page": 50}, etiqueta="admin: listar usuarios (search=sim_)")
    ctx.check("listado de usuarios 200 con meta de paginación", ls.status == 200 and ls.get("meta.total") is not None, 200, ls.status)
    ctx.check("el listado incluye a los usuarios sim_", (ls.get("meta.total") or 0) >= 20, ">= 20", ls.get("meta.total"))
    big = api.req("GET", "auth", f"{V}/admin/users", token=a, params={"per_page": 1000}, etiqueta="admin: per_page=1000")
    ctx.check("per_page grande se acota (<= 50) o se rechaza", big.status == 422 or (big.get("meta.per_page") or 0) <= 50, "<=50 o 422", f"{big.status} per_page={big.get('meta.per_page')}")
    nad = api.req("GET", "auth", f"{V}/admin/users", token=u.token, etiqueta="p7 (no admin): listar usuarios")
    ctx.check("no administrador -> 403", nad.status == 403, 403, nad.status)
    dt = api.req("GET", "auth", f"{V}/admin/users/{u.user_id}", token=a, etiqueta="admin: detalle de p7")
    ctx.check("detalle 200 con bitácora", dt.status == 200 and "suspension_logs" in (dt.get("data") or {}), "data.suspension_logs", list((dt.get("data") or {}).keys()))
    si = api.req("PATCH", "auth", f"{V}/admin/users/{ctx.admin_id}/suspension", token=a, json_body={"suspended": True, "reason": "prueba"}, etiqueta="admin: suspenderse a sí mismo")
    ctx.check("el admin no puede suspenderse a sí mismo -> 422", si.status == 422, 422, si.status)
    sin_motivo = api.req("PATCH", "auth", f"{V}/admin/users/{u.user_id}/suspension", token=a, json_body={"suspended": True}, etiqueta="admin: suspender sin motivo")
    ctx.nota(f"suspender sin motivo -> {sin_motivo.status}")
    if sin_motivo.status == 200:  # revertir para continuar con el flujo normal
        api.req("PATCH", "auth", f"{V}/admin/users/{u.user_id}/suspension", token=a, json_body={"suspended": False}, etiqueta="admin: revertir")
    s = api.req("PATCH", "auth", f"{V}/admin/users/{u.user_id}/suspension", token=a, json_body={"suspended": True, "reason": "Conducta inapropiada reportada (sim)"}, etiqueta="admin: suspender a p7")
    ctx.check("suspensión manual -> 200", s.status == 200 and s.get("data.is_active") is False, 200, s.status)
    me = api.req("GET", "auth", f"{V}/auth/me", token=u.token, etiqueta="p7: /auth/me suspendido")
    ctx.check("p7 suspendido: request -> 403", me.status == 403, 403, me.status)
    for svc, path in (("trip", "/passenger/history"), ("route", "/routes"), ("vehicle", "/vehicles")):
        x = api.req("GET", svc, f"{V}{path}", token=u.token, etiqueta=f"p7 suspendido manualmente: GET {svc} {path}")
        ctx.check(f"suspensión manual: {svc}-service también responde 403", x.status == 403, 403, x.status)
    lg = api.req("POST", "auth", f"{V}/auth/login", json_body={"email": u.email, "password": PASSWORD}, etiqueta="p7: login suspendido")
    ctx.check("p7 suspendido: login -> 403", lg.status == 403, 403, lg.status)
    # no debe reactivarse solo: aunque pase tiempo y se hagan más requests
    infra.tinker(f"App\\Models\\User::where('id','{u.user_id}')->update(['suspended_until'=>null]); echo 'OK';")
    time.sleep(1)
    me2 = api.req("GET", "auth", f"{V}/auth/me", token=u.token, etiqueta="p7: /auth/me otra vez")
    ctx.check("suspendido manualmente NO se reactiva solo", me2.status == 403, 403, me2.status)
    ctx.check("la bitácora no contiene auto_reactivated", "auto_reactivated" not in infra.bitacora_usuario(u.user_id), "sin auto_reactivated", infra.bitacora_usuario(u.user_id))
    r = api.req("PATCH", "auth", f"{V}/admin/users/{u.user_id}/suspension", token=a, json_body={"suspended": False, "reason": "Revisión concluida (sim)"}, etiqueta="admin: reactivar a p7")
    ctx.check("reactivación manual -> 200 y activo", r.status == 200 and r.get("data.is_active") is True, 200, r.status)
    me3 = api.req("GET", "auth", f"{V}/auth/me", token=u.token, etiqueta="p7: /auth/me tras reactivar")
    ctx.check("tras reactivar, p7 vuelve a operar", me3.status == 200, 200, me3.status)
    dt2 = api.req("GET", "auth", f"{V}/admin/users/{u.user_id}", token=a, etiqueta="admin: detalle de p7 (bitácora)")
    acciones = [l.get("action") for l in (dt2.get("data.suspension_logs") or [])]
    ctx.check("la bitácora muestra suspended y reactivated", "suspended" in acciones and "reactivated" in acciones, "suspended+reactivated", acciones)
    ctx.estado["s8_detalle"] = dt2.get("data")
    inex = api.req("PATCH", "auth", f"{V}/admin/users/{uuid.uuid4()}/suspension", token=a, json_body={"suspended": True, "reason": "x"}, etiqueta="admin: suspender usuario inexistente")
    ctx.check("usuario inexistente -> 404", inex.status == 404, 404, inex.status)
    rol = api.req("GET", "auth", f"{V}/admin/users", token=a, params={"role": "conductor", "active": "true"}, etiqueta="admin: filtro role=conductor&active=true")
    ctx.check("filtro por rol/estado funciona", rol.status == 200 and (rol.get("meta.total") or 0) >= 6, ">= 6 conductores", rol.get("meta.total"))


# =============================================================== 9
@escenario(9, "SOS")
def sos(ctx):
    c, p, a = P["c4"], P["p8"], ctx.admin_token
    sede = ctx.sede("JARDIN")
    r, sug = publicar_con_sugerido(ctx, c, hora(1, 6, 40), 3, sede)
    ruta = r.get("data.id")
    ctx.check("ruta de c4 (carro con RTM) publicada", r.status == 201, 201, r.status)
    if not ruta:
        return
    bk = reservar(ctx, p, ruta, sug, iso(hora(1, 6, 40)), "Piedecuesta", sede["name"], etiqueta="p8: reservar")
    trip, pin = bk.get("data.trip_id"), bk.get("data.boarding_pin")
    ctx.check("reserva 201", bk.status == 201, 201, bk.status)
    if not trip:
        return
    pre = ctx.api.req("POST", "trip", f"{V}/trips/{trip}/sos", token=p.token, json_body={"latitude": 7.0, "longitude": -73.05}, etiqueta="p8: SOS antes de iniciar el viaje")
    ctx.check("SOS sin viaje en curso (solo 'confirmado') se rechaza", pre.status == 422, 422, pre.status)
    ciclo_viaje(ctx, c, trip, pin, completar=False)
    s = ctx.api.req("POST", "trip", f"{V}/trips/{trip}/sos", token=p.token,
                    json_body={"latitude": 7.021, "longitude": -73.071, "emergency_type": "panico_usuario"}, etiqueta="p8: activar SOS en viaje")
    ctx.check("SOS en viaje activo -> 201", s.status == 201, 201, s.status)
    ctx.check("la respuesta del SOS identifica el evento (id)", bool(s.get("data.id") or s.get("data.event_id")), "id del evento", s.data)
    ls = ctx.api.req("GET", "trip", f"{V}/admin/sos-events", token=a, params={"status": "pending"}, etiqueta="admin: SOS pendientes")
    ev = [e for e in (ls.get("data") or []) if e.get("trip_id") == trip]
    # segundo SOS que queda pendiente para el recorrido de la UI del panel
    ctx.api.req("POST", "trip", f"{V}/trips/{trip}/sos", token=p.token,
                json_body={"latitude": 7.03, "longitude": -73.08, "emergency_type": "accidente"}, etiqueta="p8: segundo SOS (queda pendiente para la UI)")
    ctx.check("el admin ve el SOS pendiente del viaje", ls.status == 200 and bool(ev), "SOS del viaje", ls.status)
    if ev:
        ctx.estado["s9_sos"] = ev[0]
        at = ctx.api.req("PATCH", "trip", f"{V}/admin/sos-events/{ev[0]['id']}/attend", token=a, json_body={"notes": "Se contactó al conductor y al pasajero (sim)"}, etiqueta="admin: atender SOS")
        ctx.check("atender SOS -> 200", at.status == 200, 200, at.status)
        ya = ctx.api.req("GET", "trip", f"{V}/admin/sos-events", token=a, params={"status": "attended"}, etiqueta="admin: SOS atendidos")
        ctx.check("el SOS pasa a atendidos", any(e.get("id") == ev[0]["id"] for e in (ya.get("data") or [])), "en atendidos", ya.status)
        otra = ctx.api.req("PATCH", "trip", f"{V}/admin/sos-events/{ev[0]['id']}/attend", token=a, json_body={"notes": "segunda atención"}, etiqueta="admin: atender de nuevo")
        ctx.check("atender dos veces el mismo SOS no sobrescribe la atención original (409/422)", otra.status in (409, 422), "409/422", otra.status)
    ajeno = ctx.api.req("GET", "trip", f"{V}/admin/sos-events", token=p.token, etiqueta="p8 (no admin): listar SOS")
    ctx.check("no administrador no ve los SOS -> 403", ajeno.status == 403, 403, ajeno.status)
    ctx.api.req("POST", "trip", f"{V}/trips/{trip}/complete", token=c.token, json_body={}, etiqueta="c4: completar viaje")


# =============================================================== 10
@escenario(10, "Entradas inválidas")
def invalidas(ctx):
    api = ctx.api
    c1, p9, p1, a = P["c1"], P["p9"], P["p1"], ctx.admin_token
    sede = ctx.sede("JARDIN")
    ruta = ctx.estado.get("s1_ruta")
    ruta_trip = ctx.estado.get("s1_trip_p2")
    malo = "no-es-un-uuid"

    def no500(nombre, resp, aceptables):
        ctx.check(f"{nombre}: {'/'.join(map(str, aceptables))} y nunca 5xx", resp.status in aceptables, aceptables, resp.status)

    # ids que no son UUID
    no500("GET /routes/{no-uuid}", api.req("GET", "route", f"{V}/routes/{malo}", token=p9.token, etiqueta="GET /routes/no-uuid"), (404, 422))
    no500("POST /routes/{no-uuid}/evaluate-detour", api.req("POST", "route", f"{V}/routes/{malo}/evaluate-detour", token=p9.token, json_body={"pickup_lat": 7.1, "pickup_lng": -73.1}, etiqueta="evaluate-detour no-uuid"), (404, 422))
    no500("POST /trips/{no-uuid}/start", api.req("POST", "trip", f"{V}/trips/{malo}/start", token=c1.token, json_body={}, etiqueta="trips/no-uuid/start"), (404, 422))
    no500("POST /trips/{no-uuid}/cancel", api.req("POST", "trip", f"{V}/trips/{malo}/cancel", token=p9.token, json_body={"cancelled_by": "pasajero", "reason": "motivo válido"}, etiqueta="trips/no-uuid/cancel"), (404, 422))
    no500("GET /vehicles/{no-uuid}", api.req("GET", "vehicle", f"{V}/vehicles/{malo}", token=c1.token, etiqueta="vehicles/no-uuid"), (404, 422))
    no500("GET /admin/users/{no-uuid}", api.req("GET", "auth", f"{V}/admin/users/{malo}", token=a, etiqueta="admin/users/no-uuid"), (404, 422))
    no500("GET /admin/vehicles/{no-uuid}", api.req("GET", "vehicle", f"{V}/admin/vehicles/{malo}", token=a, etiqueta="admin/vehicles/no-uuid"), (404, 422))
    no500("POST /trips con route_id no UUID", api.req("POST", "trip", f"{V}/trips", token=p9.token, json_body={"route_id": malo, "pickup_address": "x", "dropoff_address": "y", "total_fare_cop": 0, "scheduled_pickup_time": iso(hora(1, 7))}, etiqueta="reservar route_id inválido"), (422,))
    no500("POST /routes con vehicle_id no UUID", api.req("POST", "route", f"{V}/routes", token=c1.token, json_body={"vehicle_id": malo}, etiqueta="publicar vehicle_id inválido"), (422,))

    # coordenadas fuera de rango
    for lat, lng, nombre in ((95, -73.1, "lat 95"), (7.1, 200, "lng 200"), (0, 0, "lat/lng 0,0 (fuera del área)"), ("abc", -73.1, "lat texto")):
        no500(f"search-match con {nombre}", buscar(ctx, p9, (lat, lng), sede, etiqueta=f"buscar con {nombre}"), (422,))
    no500("publicar con origen fuera de rango", publicar(ctx, c1, (0.0, 0.0), "Nulo", sede, hora(3, 7), 2, 0, etiqueta="publicar origen 0,0"), (422,))
    if ruta_trip:
        no500("SOS con latitud 200", api.req("POST", "trip", f"{V}/trips/{ruta_trip}/sos", token=p9.token, json_body={"latitude": 200, "longitude": 0}, etiqueta="SOS lat 200"), (403, 422))

    # tokens
    r_sin = api.req("GET", "trip", f"{V}/passenger/history", etiqueta="sin token")
    ctx.check("sin token -> 401", r_sin.status == 401, 401, r_sin.status)
    r_bas = api.req("GET", "trip", f"{V}/passenger/history", token="abc.def.ghi", etiqueta="token basura")
    ctx.check("token basura -> 401", r_bas.status == 401, 401, r_bas.status)
    expirado = infra.tinker(
        f"echo Firebase\\JWT\\JWT::encode(['iss'=>config('jwt.issuer'),'sub'=>'{p9.user_id}','email'=>'{p9.email}','roles'=>['estudiante'],'type'=>'user','jti'=>(string)Illuminate\\Support\\Str::uuid(),'iat'=>time()-20000,'exp'=>time()-3600], config('jwt.secret'), config('jwt.algo'));"
    ).splitlines()[-1].strip()
    r_exp = api.req("GET", "trip", f"{V}/passenger/history", token=expirado, etiqueta="token vencido (firmado con el secreto local)")
    ctx.check("token vencido -> 401", r_exp.status == 401, 401, r_exp.status)
    r_ref = api.req("POST", "auth", f"{V}/auth/refresh", token=expirado, json_body={}, etiqueta="refresh con token vencido")
    ctx.check("auth/refresh acepta un token vencido (sesión deslizante de la app)", r_ref.status == 200, 200, r_ref.status)
    tmp = api.req("POST", "auth", f"{V}/auth/login", json_body={"email": P["p10"].email, "password": PASSWORD}, etiqueta="p10: login para probar logout")
    tok = tmp.get("data.access_token")
    api.req("POST", "auth", f"{V}/auth/logout", token=tok, json_body={}, etiqueta="p10: logout")
    r_rev = api.req("GET", "trip", f"{V}/passenger/history", token=tok, etiqueta="token revocado en otro servicio")
    ctx.check("token revocado (logout) -> 401 en trip-service", r_rev.status == 401, 401, r_rev.status)

    # viaje ajeno
    if ruta_trip:
        for nombre, svc, path, body in (
            ("verify-pin", "trip", f"/trips/{ruta_trip}/verify-pin", {"pin": "1234"}),
            ("start", "trip", f"/trips/{ruta_trip}/start", {}),
            ("complete", "trip", f"/trips/{ruta_trip}/complete", {}),
            ("cancel", "trip", f"/trips/{ruta_trip}/cancel", {"cancelled_by": "pasajero", "reason": "intento ajeno"}),
        ):
            x = api.req("POST", svc, f"{V}{path}", token=p9.token, json_body=body, etiqueta=f"p9 intenta {nombre} en viaje ajeno")
            ctx.check(f"viaje ajeno: {nombre} -> 403", x.status == 403, 403, x.status)
        x = api.req("GET", "trip", f"{V}/trips/{ruta_trip}/tracking/latest", token=p9.token, etiqueta="p9 lee tracking de viaje ajeno")
        ctx.check("viaje ajeno: tracking/latest -> 403", x.status == 403, 403, x.status)
        x = api.req("POST", "trip", f"{V}/trips/{ruta_trip}/start", token=P["p2"].token, json_body={}, etiqueta="el pasajero titular intenta start (solo conductor)")
        ctx.check("el pasajero no puede iniciar el viaje (solo conductor) -> 403", x.status == 403, 403, x.status)
    # vehículo ajeno
    x = api.req("GET", "vehicle", f"{V}/vehicles/{c1.vehicle_id}", token=p9.token, etiqueta="p9 ve vehículo ajeno")
    ctx.check("ver vehículo ajeno -> 403", x.status == 403, 403, x.status)
    x = api.req("POST", "vehicle", f"{V}/vehicles/{c1.vehicle_id}/documents", token=p9.token,
                files={"document_file": ("x.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")}, data={"document_type": "soat", "document_number": "AAAAAA1", "expires_at": "2030-01-01"}, etiqueta="p9 sube documento a vehículo ajeno")
    ctx.check("subir documento a vehículo ajeno -> 403", x.status == 403, 403, x.status)
    d = c1.extra.get("docs", {}).get("soat")
    x = api.req("PATCH", "vehicle", f"{V}/vehicles/{c1.vehicle_id}/documents/{d}/verify", token=p9.token, json_body={"is_verified": True}, etiqueta="p9 intenta verificar documento")
    ctx.check("un no-admin no puede verificar documentos -> 403", x.status == 403, 403, x.status)

    # doble reserva y reservar la propia ruta
    if ruta:
        sug = ctx.estado.get("s1_fare") or None
        info = api.req("GET", "route", f"{V}/routes/{ruta}", token=p9.token, etiqueta="detalle de la ruta s1")
        fare = info.get("data.base_contribution_cop", 0)
        salida_iso = info.get("data.scheduled_departure_time")
        a1 = reservar(ctx, p9, ruta, fare, salida_iso, "Girón", sede["name"], etiqueta="p9: reservar (1.ª vez)")
        a2 = reservar(ctx, p9, ruta, fare, salida_iso, "Girón", sede["name"], etiqueta="p9: reservar la MISMA ruta (2.ª vez)")
        ctx.check("reservar dos veces el mismo viaje: la 2.ª se rechaza (409/422)", a1.status == 201 and a2.status in (409, 422), "201 y 409/422", f"{a1.status} y {a2.status}")
        own = reservar(ctx, c1, ruta, fare, salida_iso, "Cabecera", sede["name"], etiqueta="c1: reservar su propia ruta")
        ctx.check("un conductor no puede reservar su propia ruta -> 422/403", own.status in (403, 422), "403/422", own.status)
        ctx.estado["s10_trip_p9"] = (a1.get("data.trip_id"), a1.get("data.boarding_pin"))
        bad_fare = reservar(ctx, P["p10"], ruta, 99999, salida_iso, "Mutis", sede["name"], etiqueta="p10: reservar con tarifa distinta")
        ctx.check("tarifa distinta a la publicada -> 422", bad_fare.status == 422, 422, bad_fare.status)
    # ruta inexistente
    x = reservar(ctx, p9, str(uuid.uuid4()), 0, iso(hora(1, 7)), "Girón", sede["name"], etiqueta="reservar ruta inexistente")
    ctx.check("reservar una ruta inexistente -> 404/422 (sin 5xx)", x.status in (404, 422), "404/422", x.status)

    # publicar sin vehículo aprobado
    x = publicar(ctx, p1, p1.lat_lng, "Cabecera", sede, hora(3, 7), 2, 0, vehicle_id=c1.vehicle_id, etiqueta="p1 (sin vehículo) publica con el vehículo de c1")
    ctx.check("publicar con un vehículo que no es tuyo -> 403/422", x.status in (403, 422), "403/422", x.status)
    x = publicar(ctx, p1, p1.lat_lng, "Cabecera", sede, hora(3, 7), 2, 0, vehicle_id=str(uuid.uuid4()), etiqueta="publicar con vehicle_id inexistente")
    ctx.check("publicar con vehicle_id inexistente -> 404/422 (no 503)", x.status in (404, 422), "404/422", x.status)
    p10 = P["p10"]
    from .acciones import datos_vehiculo
    p10.tipo_vehiculo, p10.marca, p10.modelo, p10.anio, p10.placa = "carro", "Ford", "Fiesta", 2023, "SIM010"
    rv = api.req("GET", "vehicle", f"{V}/vehicles", token=p10.token, etiqueta="p10: vehículos existentes")
    if not (rv.get("data") or []):
        rv = api.req("POST", "vehicle", f"{V}/vehicles", token=p10.token, json_body=datos_vehiculo(p10), etiqueta="p10: registrar vehículo (queda pendiente)")
        p10.vehicle_id = rv.get("data.id")
    else:
        p10.vehicle_id = rv.get("data")[0]["id"]
    ctx.check("vehículo recién creado queda pendiente_revision", True if p10.vehicle_id else False, "vehículo creado", p10.vehicle_id)
    if p10.vehicle_id:
        from .acciones import pdf_dummy
        api.req("POST", "vehicle", f"{V}/vehicles/{p10.vehicle_id}/documents", token=p10.token, data={"document_type": "soat", "document_number": "SIMSOAT0010", "expires_at": "2027-12-31"},
                files={"document_file": ("soat.pdf", pdf_dummy("soat"), "application/pdf")}, etiqueta="p10: sube SOAT (queda sin verificar para la UI)")
    x = publicar(ctx, p10, p10.lat_lng, "Alarcón", sede, hora(3, 7), 2, 0, etiqueta="p10 publica con vehículo PENDIENTE de aprobación")
    ctx.check("publicar sin vehículo aprobado se rechaza (403/422)", x.status in (403, 422), "403/422", x.status)
    x = publicar(ctx, c1, c1.lat_lng, "Cabecera", sede, ahora() - timedelta(days=2), 2, 0, etiqueta="c1 publica con salida en el pasado")
    ctx.check("publicar con salida en el pasado -> 422", x.status == 422, 422, x.status)
    if x.status == 201:  # si se aceptó, ¿los pasajeros la ven en la búsqueda?
        b = buscar(ctx, P["p1"], c1.lat_lng, sede, etiqueta="p1: buscar (¿aparece la ruta con salida en el pasado?)")
        ctx.check("una ruta con salida en el pasado no aparece en la búsqueda", encontrar(b, x.get("data.id")) is None, "no aparece", "aparece" if encontrar(b, x.get("data.id")) else "no aparece")

    # cancelaciones inconsistentes
    ptrip = ctx.estado.get("s10_trip_p9")
    if ptrip and ptrip[0]:
        x = cancelar(ctx, p9, ptrip[0], "passenger", etiqueta="p9: cancelar con cancelled_by='passenger' (valor que envía la app móvil)")
        ctx.check("cancelled_by con el valor que envía la app móvil ('passenger') -> 200", x.status == 200, 200, f"{x.status} {x.get('errors')}")
        x = cancelar(ctx, p9, ptrip[0], "pasajero", etiqueta="p9: cancelar un viaje ya cancelado")
        ctx.check("cancelar un viaje ya cancelado -> 409/422", x.status in (409, 422), "409/422", x.status)
    done = ctx.estado.get("s1_trip_p2")
    if done:
        pass
    # verify-pin formato
    t = ctx.estado.get("s10_trip_p9")
    for pin in ("12", "abcd", "123456"):
        x = api.req("POST", "trip", f"{V}/trips/{(t or [None])[0] or uuid.uuid4()}/verify-pin", token=c1.token, json_body={"pin": pin}, etiqueta=f"verify-pin con '{pin}'")
        ctx.check(f"verify-pin '{pin}' (formato inválido) -> 422 o 403, sin 5xx", x.status in (403, 404, 422, 429), "4xx", x.status)

    # registro: validaciones
    base = {"name": "Sim Invalido", "institution_id": 1, "phone_number": "3001112233", "password": PASSWORD, "verification_code": "000000"}
    for nombre, extra, ok in (
        ("dominio no institucional (gmail.com)", {"email": "sim_malo@gmail.com"}, (422,)),
        ("contraseña débil", {"email": "sim_malo2@unab.edu.co", "password": "abc"}, (422,)),
        ("teléfono inválido", {"email": "sim_malo3@unab.edu.co", "phone_number": "12345"}, (422,)),
        ("código de verificación inexistente", {"email": "sim_malo4@unab.edu.co"}, (422,)),
    ):
        x = api.req("POST", "auth", f"{V}/auth/register", json_body=base | extra, etiqueta=f"register: {nombre}")
        ctx.check(f"register con {nombre} -> 422", x.status in ok, ok, x.status)
    # cancelación del conductor con el rol equivocado (evita la penalización de 15 min)
    _rol_falso(ctx, P["c3"])


def _rol_falso(ctx, c1):
    """El conductor cancela 10 min antes enviando cancelled_by='pasajero' para evitar la penalidad de conductor."""
    sede = ctx.sede("JARDIN")
    r, sug = publicar_con_sugerido(ctx, c1, hora(1, 7, 5), 3, sede)
    ruta = r.get("data.id")
    if not ruta:
        ctx.check("(rol falso) ruta publicada", False, 201, r.status)
        return
    resultados = {}
    for clave, como in (("p11", "conductor"), ("p12", "pasajero")):
        pas = P[clave]
        bk = reservar(ctx, pas, ruta, sug, iso_utc(ahora() + timedelta(minutes=10)), "Mutis", sede["name"], etiqueta=f"{clave}: reservar con recogida en 10 min")
        cn = cancelar(ctx, c1, bk.get("data.trip_id"), como, etiqueta=f"c1 (conductor) cancela enviando cancelled_by='{como}'")
        resultados[como] = (cn.status, cn.get("data.late_cancellation"))
    ctx.check("el rol de la cancelación sale del token, no del cuerpo: el conductor siempre es penalizado igual",
              resultados.get("conductor") == resultados.get("pasajero"), "mismo resultado", resultados)


# =============================================================== 11
@escenario(11, "Concurrencia ligera (3 cupos, 10 pasajeros)")
def concurrencia(ctx):
    c = P["c3"]
    sede = ctx.sede("JARDIN")
    r, sug = publicar_con_sugerido(ctx, c, hora(1, 6, 10), 3, sede)
    ruta = r.get("data.id")
    ctx.check("ruta de 3 cupos publicada", r.status == 201 and ruta, 201, r.status)
    if not ruta:
        return
    claves = ["p1", "p2", "p3", "p4", "p5", "p8", "p9", "p10", "p11", "p12"]
    barrera = threading.Barrier(len(claves))
    salida = {}

    def hilo(clave):
        pas = P[clave]
        api = ctx.nuevo_api()
        try:
            barrera.wait(timeout=30)
            b = api.req("POST", "route", f"{V}/routes/search-match", token=pas.token,
                        json_body={"pickup_lat": c.lat_lng[0], "pickup_lng": c.lat_lng[1], "destination_campus_id": sede["id"]}, etiqueta=f"{clave}: buscar")
            barrera.wait(timeout=60)
            k = api.req("POST", "trip", f"{V}/trips", token=pas.token,
                        json_body={"route_id": ruta, "pickup_address": "Floridablanca", "dropoff_address": sede["name"], "total_fare_cop": sug, "scheduled_pickup_time": iso(hora(1, 6, 10))},
                        etiqueta=f"{clave}: reservar en paralelo")
            salida[clave] = (b.status, k.status)
        finally:
            api.cerrar()

    hilos = [threading.Thread(target=hilo, args=(k,)) for k in claves]
    [h.start() for h in hilos]
    [h.join(timeout=240) for h in hilos]
    reservas_ok = sum(1 for v in salida.values() if v[1] == 201)
    ctx.nota(f"resultados por pasajero (búsqueda, reserva): {salida}")
    ctx.check("las 10 búsquedas en paralelo responden 200", all(v[0] == 200 for v in salida.values()) and len(salida) == 10, "10 x 200", [v[0] for v in salida.values()])
    ctx.check("exactamente 3 reservas confirmadas (sin sobrecupo)", reservas_ok == 3, 3, reservas_ok)
    ctx.check("en la base hay exactamente 3 viajes activos de la ruta", infra.contar_viajes_ruta(ruta) == 3, 3, infra.contar_viajes_ruta(ruta))
    ctx.check("los cupos de la ruta quedan en 0", _asiento(ctx, ruta) == 0, 0, _asiento(ctx, ruta))
    ctx.check("sin errores 5xx bajo concurrencia", all(v[0] < 500 and v[1] < 500 for v in salida.values()), "ningún 5xx", salida)


# =============================================================== 12
FRANJAS = {"manana": (6, 8), "tarde": (17, 19)}


@escenario(12, "Semana simulada (5 días, 20 usuarios)")
def semana(ctx):
    import random

    rng = random.Random(20261004)
    sede = ctx.sede("JARDIN")
    conductores = [P[k] for k in ("c1", "c2", "c3", "c4", "c5", "c6")]
    pasajeros = [P[f"p{i}"] for i in range(1, 15)]
    # solo los que están operativos
    stats = {"busquedas": 0, "busquedas_con_resultado": 0, "reservas": 0, "reservas_ok": 0, "reservas_rechazadas": 0,
             "busquedas_con_algun_resultado": 0, "resultados_con_salida_pasada": 0,
             "rutas": 0, "rutas_ok": 0, "viajes_completados": 0, "cancelaciones": 0, "errores_5xx": 0, "403_suspendidos": 0}
    por_dia = []
    cupos_ruta: dict[str, int] = {}
    reservas_ruta: dict[str, int] = {}
    for dia in range(1, 6):
        dstat = {"dia": dia, "rutas": 0, "busquedas": 0, "con_resultado": 0, "reservas": 0}
        for franja, (h0, h1) in FRANJAS.items():
            publicadas = []  # (ruta_id, aporte, salida, conductor)
            for c in conductores:
                salida = hora(dia, rng.randint(h0, h1 - 1), rng.choice([0, 10, 20, 30, 40, 50]))
                # mañana: barrio -> campus; tarde: campus -> barrio (el esquema solo permite destination_campus_id: se usa el id de la misma sede)
                if franja == "manana":
                    origen, nombre = c.lat_lng, f"{c.barrio}, área metropolitana"
                    s = sugerencia(ctx, c, origen, sede)
                    sug = int(s.get("data.suggested_contribution_cop", 0) or 0)
                    cupos = 1 if c.tipo_vehiculo == "moto" else rng.choice([2, 3, 4])
                    pub = publicar(ctx, c, origen, nombre, sede, salida, cupos, sug, etiqueta=f"d{dia} {franja}: {c.clave} publica")
                else:
                    origen = (sede["latitude"], sede["longitude"])
                    s = ctx.api.req("GET", "route", f"{V}/routes/contribution-suggestion", token=c.token,
                                    params={"vehicle_id": c.vehicle_id, "origin_lat": origen[0], "origin_lng": origen[1], "destination_lat": c.lat_lng[0], "destination_lng": c.lat_lng[1]},
                                    etiqueta=f"d{dia} {franja}: {c.clave} aporte de regreso")
                    sug = int(s.get("data.suggested_contribution_cop", 0) or 0)
                    cupos = 1 if c.tipo_vehiculo == "moto" else rng.choice([2, 3, 4])
                    cuerpo_extra = {"destination_lat": c.lat_lng[0], "destination_lng": c.lat_lng[1]}
                    pub = publicar(ctx, c, origen, sede["name"], sede, salida, cupos, sug, etiqueta=f"d{dia} {franja}: {c.clave} publica regreso", extra=cuerpo_extra)
                stats["rutas"] += 1
                dstat["rutas"] += 1
                if pub.status == 201:
                    stats["rutas_ok"] += 1
                    publicadas.append((pub.get("data.id"), sug, salida, c))
                    cupos_ruta[pub.get("data.id")] = cupos
                elif pub.status >= 500:
                    stats["errores_5xx"] += 1
            # los 14 pasajeros buscan y reservan; los conductores también buscan una vez
            buscadores = list(pasajeros) + conductores
            rng.shuffle(buscadores)
            for u in buscadores:
                punto = desplazar(u.lat_lng, rng.randint(-150, 150), rng.randint(-150, 150)) if franja == "manana" else (sede["latitude"], sede["longitude"])
                b = buscar(ctx, u, punto, sede, etiqueta=f"d{dia} {franja}: {u.clave} busca")
                stats["busquedas"] += 1
                dstat["busquedas"] += 1
                if b.status == 403:
                    stats["403_suspendidos"] += 1
                    continue
                if b.status >= 500:
                    stats["errores_5xx"] += 1
                    continue
                res = b.get("data") or []
                if res:
                    stats["busquedas_con_algun_resultado"] += 1
                ahora_utc = ahora().astimezone(timezone.utc).isoformat()
                stats["resultados_con_salida_pasada"] += sum(1 for m in res if (m.get("departure_timestamp") or "9") < ahora_utc[:19])
                # solo rutas de esta franja (las anteriores siguen publicadas: se ignoran las que no son de hoy+dia)
                res = [m for m in res if m.get("route_id") in {x[0] for x in publicadas} and m.get("driver_id") != u.user_id]
                if res:
                    stats["busquedas_con_resultado"] += 1
                    dstat["con_resultado"] += 1
                if u.rol != "pasajero" or not res:
                    continue
                elegido = res[0]
                bk = reservar(ctx, u, elegido["route_id"], elegido["suggested_fare_cop"], elegido["departure_timestamp"], u.barrio, sede["name"],
                              etiqueta=f"d{dia} {franja}: {u.clave} reserva", driver_name=elegido.get("driver_name"), vehicle_plate=elegido.get("vehicle_plate"))
                stats["reservas"] += 1
                dstat["reservas"] += 1
                if bk.status == 201:
                    stats["reservas_ok"] += 1
                    reservas_ruta[elegido["route_id"]] = reservas_ruta.get(elegido["route_id"], 0) + 1
                    conductor = next(x[3] for x in publicadas if x[0] == elegido["route_id"])
                    azar = rng.random()
                    if azar < 0.6:
                        ciclo = ciclo_viaje(ctx, conductor, bk.get("data.trip_id"), bk.get("data.boarding_pin"))
                        if ciclo.get("complete") == 200:
                            stats["viajes_completados"] += 1
                    elif azar < 0.7:
                        cancelar(ctx, u, bk.get("data.trip_id"), "pasajero", etiqueta=f"d{dia}: {u.clave} cancela a tiempo")
                        stats["cancelaciones"] += 1
                elif bk.status >= 500:
                    stats["errores_5xx"] += 1
                else:
                    stats["reservas_rechazadas"] += 1
        por_dia.append(dstat)
    m = ctx.registro.metricas("12")
    stats["rutas_sobrevendidas"] = sum(1 for r, n in reservas_ruta.items() if n > cupos_ruta.get(r, 99))
    stats["reservas_por_encima_del_cupo"] = sum(max(0, n - cupos_ruta.get(r, 99)) for r, n in reservas_ruta.items())
    ms_busq = sorted(c["ms"] for c in ctx.registro.llamadas if c["escenario"] == "12" and c["plantilla"].endswith("search-match") and c["status"] == 200)
    stats["busquedas_mas_lentas_que_6s"] = sum(1 for x in ms_busq if x > 6000)  # timeout del cliente móvil (api.js: 6000 ms)
    stats["tasa_busquedas_con_resultado"] = round(stats["busquedas_con_resultado"] / max(1, stats["busquedas"]), 3)
    stats["errores_5xx"] = max(stats["errores_5xx"], m["5xx"])
    stats["por_dia"] = por_dia
    ctx.estado["s12_stats"] = stats
    ctx.nota("métricas de la semana: " + str({k: v for k, v in stats.items() if k != "por_dia"}))
    ctx.check("la semana corre sin errores 5xx", m["5xx"] == 0, 0, m["5xx"])
    ctx.check("tasa de búsquedas con resultado >= 50 %", stats["tasa_busquedas_con_resultado"] >= 0.5, ">= 0.5", stats["tasa_busquedas_con_resultado"])
    ctx.check("ninguna ruta se reserva por encima de sus cupos", stats["reservas_por_encima_del_cupo"] == 0, 0, stats["reservas_por_encima_del_cupo"])
    ctx.check("las búsquedas responden antes del timeout del cliente móvil (6 s)", stats["busquedas_mas_lentas_que_6s"] == 0, 0, f'{stats["busquedas_mas_lentas_que_6s"]} de {len(ms_busq)}')
    p95_busq = ms_busq[int(round(0.95 * (len(ms_busq) - 1)))] if ms_busq else 0
    ctx.check("p95 de search-match <= 2 s", p95_busq <= 2000, "<= 2000 ms", round(p95_busq))
