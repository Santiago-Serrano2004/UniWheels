"""Acciones reutilizables: alta de usuarios, conductores, publicar, buscar y reservar."""
import math
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from .cliente import Api, Registro
from .config import ADMIN_EMAIL, ADMIN_PASSWORD, PASSWORD
from . import infra
from .personas import PERSONAS, Persona

V = "/api/v1"
BOGOTA = timezone(timedelta(hours=-5))


def pdf_dummy(titulo: str = "documento simulado") -> bytes:
    """PDF mínimo válido (una página en blanco con un texto)."""
    contenido = f"BT /F1 12 Tf 72 720 Td ({titulo}) Tj ET".encode()
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(contenido)).encode() + b" >>\nstream\n" + contenido + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = b"%PDF-1.4\n"
    offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(out))
        out += f"{i} 0 obj\n".encode() + o + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for o in offs:
        out += f"{o:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return out


def ahora() -> datetime:
    return datetime.now(BOGOTA)


def hora(dia: int, h: int, m: int = 0) -> datetime:
    """Hora local de Bogotá `dia` días en el futuro (0 = hoy, 1 = mañana...)."""
    base = ahora() + timedelta(days=dia)
    return base.replace(hour=h, minute=m, second=0, microsecond=0)


def iso(dt: datetime) -> str:
    """ISO 8601 con offset de Colombia (-05:00), como lo envía la app móvil (DriverRoutePublishForm.tsx)."""
    return dt.isoformat(timespec="seconds")


def iso_utc(dt: datetime) -> str:
    """El mismo instante en UTC con sufijo Z (inmune al manejo de offsets del backend)."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sugerido_formula(distancia_km: float, tipo: str) -> int:
    base, por_km = (2000, 400) if tipo == "carro" else (1000, 250)
    return int(math.ceil(round(base + distancia_km * por_km, 6) / 100) * 100)


def desplazar(lat_lng, metros_norte: float = 0.0, metros_este: float = 0.0):
    lat, lng = lat_lng
    return (lat + metros_norte / 111_000.0, lng + metros_este / (111_000.0 * math.cos(math.radians(lat))))


@dataclass
class Ctx:
    """Contexto compartido por los escenarios."""

    registro: Registro
    campus: list = field(default_factory=list)
    admin_token: str | None = None
    admin_id: str | None = None
    pasos: list = field(default_factory=list)
    aserciones: list = field(default_factory=list)
    estado: dict = field(default_factory=dict)  # datos compartidos entre escenarios

    def nuevo_api(self) -> Api:
        return Api(self.registro, self.pasos)

    @property
    def api(self) -> Api:
        if "api" not in self.estado:
            self.estado["api"] = self.nuevo_api()
        self.estado["api"].pasos = self.pasos  # los pasos van a la lista del escenario en curso
        return self.estado["api"]

    def check(self, nombre: str, condicion: bool, esperado=None, obtenido=None):
        self.aserciones.append(
            {"asercion": nombre, "ok": bool(condicion), "esperado": esperado, "obtenido": obtenido}
        )
        return bool(condicion)

    def nota(self, texto: str):
        self.pasos.append({"nota": texto})

    def sede(self, codigo: str = "JARDIN") -> dict:
        for c in self.campus:
            if c["code"] == codigo:
                return c
        return self.campus[0]


# ---------------------------------------------------------------- alta de usuarios
def alta_usuario(ctx: Ctx, p: Persona) -> bool:
    """send-verification-code -> leer código del log -> register -> login."""
    api = ctx.api
    r = api.req("POST", "auth", f"{V}/auth/send-verification-code", json_body={"email": p.email}, etiqueta=f"{p.clave}: enviar código")
    if r.status == 422 and "Ya existe" in r.texto:
        return login(ctx, p)
    if r.status != 200:
        return False
    codigo = infra.leer_codigo_log(p.email)
    if not codigo:
        ctx.nota(f"{p.clave}: no se encontró el código en laravel.log")
        return False
    cuerpo = {
        "name": f"{p.nombre} (sim)",
        "institution_id": 1,
        "campus_id": ctx.sede()["id"],
        "email": p.email,
        "id_document_number": p.doc,
        "id_document_type": "CC",
        "phone_number": p.telefono,
        "student_code": p.codigo_estudiantil,
        "academic_program_or_department": "Ingeniería de Sistemas",
        "semester": 5,
        "password": PASSWORD,
        "verification_code": codigo,
    }
    r = api.req("POST", "auth", f"{V}/auth/register", json_body=cuerpo, etiqueta=f"{p.clave}: register")
    if r.status != 201:
        return False
    time.sleep(0.2)
    return login(ctx, p)


def login(ctx: Ctx, p: Persona) -> bool:
    r = ctx.api.req("POST", "auth", f"{V}/auth/login", json_body={"email": p.email, "password": PASSWORD}, etiqueta=f"{p.clave}: login")
    if r.status != 200:
        return False
    p.token = r.get("data.access_token")
    p.user_id = r.get("data.user.id")
    return bool(p.token and p.user_id)


def login_admin(ctx: Ctx) -> bool:
    r = ctx.api.req("POST", "auth", f"{V}/auth/login", json_body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, etiqueta="sim_admin: login")
    if r.status != 200:
        return False
    ctx.admin_token = r.get("data.access_token")
    ctx.admin_id = r.get("data.user.id")
    return True


def refrescar_token(ctx: Ctx, p: Persona) -> bool:
    r = ctx.api.req("POST", "auth", f"{V}/auth/refresh", token=p.token, json_body={}, etiqueta=f"{p.clave}: refresh")
    if r.status == 200 and r.get("data.access_token"):
        p.token = r.get("data.access_token")
        return True
    return False


# ---------------------------------------------------------------- conductores
def datos_vehiculo(p: Persona) -> dict:
    moto = p.tipo_vehiculo == "moto"
    return {
        "vehicle_type": p.tipo_vehiculo,
        "plate_number": p.placa,
        "brand": p.marca,
        "model_line": p.modelo,
        "year": p.anio,
        "color": "Negro" if moto else "Gris",
        "available_seats": 1 if moto else 4,
        "has_ac": not moto,
        "has_trunk": not moto,
        "has_extra_helmet": moto,
    }


def alta_conductor(ctx: Ctx, p: Persona) -> bool:
    """driver/register -> crear vehículo -> subir documentos (PDF dummy)."""
    api = ctx.api
    moto = p.tipo_vehiculo == "moto"
    manana = (ahora() + timedelta(days=400)).date().isoformat()
    cuerpo = datos_vehiculo(p) | {
        "propulsion_type": "gasolina",
        "soat_number": f"SIMSOAT{p.indice:04d}",
        "soat_expires_at": manana,
        "soat_photo": "dummy.pdf",
        "license_number": p.licencia,
        "license_category": "A2" if moto else "B1",
        "license_expires_at": manana,
        "license_photo": "dummy.pdf",
        "habeas_data_accepted": True,
    }
    if (ahora().year - p.anio) >= (2 if moto else 5):
        cuerpo |= {"rtm_number": f"SIMRTM{p.indice:04d}", "rtm_expires_at": manana, "rtm_photo": "dummy.pdf"}
    r = api.req("POST", "auth", f"{V}/driver/register", token=p.token, json_body=cuerpo, etiqueta=f"{p.clave}: driver/register")
    if r.status != 200:
        return False
    refrescar_token(ctx, p)  # el JWT debe traer el rol conductor

    # ¿ya tiene vehículo (re-ejecución)?
    r = api.req("GET", "vehicle", f"{V}/vehicles", token=p.token, etiqueta=f"{p.clave}: listar vehículos")
    existentes = r.get("data", []) or []
    if existentes:
        p.vehicle_id = existentes[0]["id"]
        return True

    r = api.req("POST", "vehicle", f"{V}/vehicles", token=p.token, json_body=datos_vehiculo(p), etiqueta=f"{p.clave}: crear vehículo")
    if r.status != 201:
        return False
    p.vehicle_id = r.get("data.id")
    docs = [
        ("soat", f"SIMSOAT{p.indice:04d}", manana),
        ("licencia_conduccion", p.licencia, manana),
        ("tarjeta_propiedad", None, None),
    ]
    if "rtm_number" in cuerpo:
        docs.append(("revision_tecnico_mecanica", cuerpo["rtm_number"], manana))
    p.extra["docs"] = {}
    for tipo, numero, vence in docs:
        datos = {"document_type": tipo}
        if numero:
            datos["document_number"] = numero
        if vence:
            datos["expires_at"] = vence
        r = api.req(
            "POST", "vehicle", f"{V}/vehicles/{p.vehicle_id}/documents", token=p.token,
            data=datos, files={"document_file": (f"{tipo}.pdf", pdf_dummy(tipo), "application/pdf")},
            etiqueta=f"{p.clave}: subir {tipo}",
        )
        if r.status != 201:
            return False
        p.extra["docs"][tipo] = r.get("data.id")
    return True


def aprobar_vehiculo(ctx: Ctx, p: Persona) -> str | None:
    """El administrador (Bienestar) verifica cada documento; devuelve el estado final del vehículo."""
    estado = None
    for tipo, doc_id in (p.extra.get("docs") or {}).items():
        r = ctx.api.req(
            "PATCH", "vehicle", f"{V}/vehicles/{p.vehicle_id}/documents/{doc_id}/verify",
            token=ctx.admin_token, json_body={"is_verified": True}, etiqueta=f"admin aprueba {tipo} de {p.clave}",
        )
        estado = r.get("data.vehicle_status", estado)
    return estado


# ---------------------------------------------------------------- rutas, búsqueda y reservas
def sugerencia(ctx: Ctx, p: Persona, origen, sede) -> "Resp":
    return ctx.api.req(
        "GET", "route", f"{V}/routes/contribution-suggestion", token=p.token,
        params={
            "vehicle_id": p.vehicle_id, "origin_lat": origen[0], "origin_lng": origen[1],
            "destination_lat": sede["latitude"], "destination_lng": sede["longitude"],
        },
        etiqueta=f"{p.clave}: aporte sugerido",
    )


def publicar(ctx: Ctx, p: Persona, origen, origen_nombre, sede, salida: datetime, cupos: int, aporte: int,
             etiqueta=None, vehicle_id=None, token=None, extra=None):
    cuerpo = {
        "vehicle_id": vehicle_id or p.vehicle_id,
        "origin_name": origen_nombre,
        "origin_lat": origen[0], "origin_lng": origen[1],
        "destination_campus_id": sede["id"],
        "destination_campus_name": sede["name"],
        "destination_lat": sede["latitude"], "destination_lng": sede["longitude"],
        "scheduled_departure_time": iso(salida),
        "target_arrival_time": iso(salida + timedelta(minutes=45)),
        "available_seats": cupos,
        "base_contribution_cop": aporte,
        "max_detour_minutes": 15,
    }
    cuerpo |= extra or {}
    return ctx.api.req("POST", "route", f"{V}/routes", token=token or p.token, json_body=cuerpo,
                       etiqueta=etiqueta or f"{p.clave}: publicar ruta")


def publicar_con_sugerido(ctx: Ctx, p: Persona, salida: datetime, cupos: int | None = None, sede=None, origen=None,
                          fraccion: float = 1.0):
    """Pide el aporte sugerido y publica con ese valor (o una fracción). Devuelve (resp_publicar, sugerido)."""
    sede = sede or ctx.sede()
    origen = origen or p.lat_lng
    s = sugerencia(ctx, p, origen, sede)
    sug = int(s.get("data.suggested_contribution_cop", 0) or 0)
    cupos = cupos or (1 if p.tipo_vehiculo == "moto" else 3)
    r = publicar(ctx, p, origen, f"{p.barrio}, Bucaramanga", sede, salida, cupos, int(sug * fraccion))
    return r, sug


def buscar(ctx: Ctx, p: Persona, punto, sede, etiqueta=None, hora_preferida=None):
    cuerpo = {"pickup_lat": punto[0], "pickup_lng": punto[1], "destination_campus_id": sede["id"]}
    if hora_preferida:
        cuerpo["preferred_time"] = hora_preferida
    return ctx.api.req("POST", "route", f"{V}/routes/search-match", token=p.token, json_body=cuerpo,
                       etiqueta=etiqueta or f"{p.clave}: buscar rutas")


def encontrar(resp, route_id: str):
    for m in resp.get("data", []) or []:
        if m.get("route_id") == route_id:
            return m
    return None


def reservar(ctx: Ctx, p: Persona, route_id: str, tarifa, salida_iso: str, origen: str = "Origen sim",
             destino: str = "Campus UNAB", etiqueta=None, api: Api | None = None, **extra):
    cuerpo = {
        "route_id": route_id,
        "pickup_address": origen[:150],
        "dropoff_address": destino[:150],
        "total_fare_cop": tarifa,
        "scheduled_pickup_time": salida_iso,
    }
    cuerpo |= extra
    return (api or ctx.api).req("POST", "trip", f"{V}/trips", token=p.token, json_body=cuerpo,
                                etiqueta=etiqueta or f"{p.clave}: reservar")


def ciclo_viaje(ctx: Ctx, conductor: Persona, trip_id: str, pin: str, completar: bool = True) -> dict:
    """start -> arrive -> verify-pin -> complete. Devuelve los códigos HTTP."""
    out = {}
    t = conductor.token
    out["start"] = ctx.api.req("POST", "trip", f"{V}/trips/{trip_id}/start", token=t, json_body={}, etiqueta="conductor: start").status
    out["arrive"] = ctx.api.req("POST", "trip", f"{V}/trips/{trip_id}/arrive", token=t, json_body={}, etiqueta="conductor: arrive").status
    out["pin"] = ctx.api.req("POST", "trip", f"{V}/trips/{trip_id}/verify-pin", token=t, json_body={"pin": pin}, etiqueta="conductor: verify-pin").status
    if completar:
        out["complete"] = ctx.api.req("POST", "trip", f"{V}/trips/{trip_id}/complete", token=t, json_body={}, etiqueta="conductor: complete").status
    return out


def cancelar(ctx: Ctx, p: Persona, trip_id: str, como: str, motivo="Cambio de planes simulado", etiqueta=None):
    return ctx.api.req("POST", "trip", f"{V}/trips/{trip_id}/cancel", token=p.token,
                       json_body={"cancelled_by": como, "reason": motivo}, etiqueta=etiqueta or f"{p.clave}: cancelar como {como}")
