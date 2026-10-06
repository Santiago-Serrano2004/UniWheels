"""Acceso a la infraestructura local: tinker, log de auth-service, Postgres y Redis (podman).

Todo es local. La limpieza solo toca filas ligadas a usuarios con el prefijo `sim_`.
"""
import json
import re
import subprocess
import time

from .config import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    AUTH_LOG,
    BACKEND_ROOT,
    PG_CONTAINER,
    PG_USER,
    PREFIJO,
    REDIS_CONTAINER,
)


def tinker(codigo: str, servicio: str = "auth-service", timeout: int = 90) -> str:
    """Ejecuta PHP con `php artisan tinker --execute` dentro del servicio indicado."""
    r = subprocess.run(
        ["php", "artisan", "tinker", "--execute", codigo],
        cwd=BACKEND_ROOT / "services" / servicio,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return (r.stdout + r.stderr).strip()


def psql(db: str, sql: str) -> str:
    r = subprocess.run(
        ["podman", "exec", PG_CONTAINER, "psql", "-U", PG_USER, "-d", db, "-At", "-c", sql],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if r.returncode != 0:
        raise RuntimeError(f"psql {db}: {r.stderr.strip()}")
    return r.stdout.strip()


def _redis_password() -> str:
    """REDIS_PASSWORD del .env local de auth-service (nunca se imprime ni se guarda)."""
    env = BACKEND_ROOT / "services/auth-service/.env"
    if env.exists():
        for linea in env.read_text().splitlines():
            if linea.startswith("REDIS_PASSWORD="):
                return linea.split("=", 1)[1].strip().strip('"')
    return ""


def redis_cli(*args: str) -> str:
    cmd = ["podman", "exec"]
    pw = _redis_password()
    if pw and pw != "null":
        cmd += ["-e", f"REDISCLI_AUTH={pw}"]
    r = subprocess.run([*cmd, REDIS_CONTAINER, "redis-cli", *args], capture_output=True, text=True, timeout=30)
    return r.stdout.strip()


_RE_DIGITO = re.compile(r'email-pin-box email-pin-box-\w+\\?">(\d)<')


def leer_codigo_log(email: str, esperar: float = 8.0) -> str | None:
    """Lee el último código de verificación enviado a `email` desde laravel.log (MAIL_MAILER=log)."""
    fin = time.time() + esperar
    while time.time() < fin:
        if AUTH_LOG.exists():
            # solo la cola del log (los correos HTML son grandes)
            with open(AUTH_LOG, "rb") as f:
                f.seek(0, 2)
                tam = f.tell()
                f.seek(max(0, tam - 600_000))
                cola = f.read().decode("utf-8", errors="ignore")
            for linea in reversed(cola.splitlines()):
                if f"To: {email}" in linea and "pin-box" in linea:
                    digitos = _RE_DIGITO.findall(linea)
                    if len(digitos) >= 6:
                        return "".join(digitos[:6])
        time.sleep(0.5)
    return None


def asegurar_admin() -> str:
    """Crea (idempotente) el administrador sim_admin con tinker."""
    codigo = f"""
$u = App\\Models\\User::withTrashed()->where('email','{ADMIN_EMAIL}')->first();
if (!$u) {{
  $u = App\\Models\\User::create([
    'name'=>'sim_admin Bienestar','email'=>'{ADMIN_EMAIL}','id_document_number'=>'sim_0000',
    'id_document_type'=>'CC','phone_number'=>'3009000000','institution_id'=>1,'member_type'=>'colaborador',
    'academic_program_or_department'=>'Bienestar Universitario','password'=>Illuminate\\Support\\Facades\\Hash::make('{ADMIN_PASSWORD}'),
    'is_active'=>true,'email_verified_at'=>now(),'phone_verified_at'=>now(),'verification_expires_at'=>now()->addMonths(6),
  ]);
  $u->assignRole('administrador');
  App\\Models\\UserReputationStats::create(['user_id'=>$u->id]);
}}
echo 'ADMIN_ID='.$u->id;
"""
    salida = tinker(codigo)
    m = re.search(r"ADMIN_ID=([0-9a-f-]{36})", salida)
    if not m:
        raise RuntimeError(f"No se pudo crear sim_admin: {salida[:400]}")
    return m.group(1)


def estado_usuario(user_id: str) -> dict:
    fila = psql("auth_db", f"select is_active, coalesce(suspended_until::text,'') from users where id='{user_id}'")
    activo, hasta = (fila.split("|") + [""])[:2]
    return {"is_active": activo == "t", "suspended_until": hasta or None}


def bitacora_usuario(user_id: str) -> list[str]:
    salida = psql("auth_db", f"select action from user_suspension_logs where user_id='{user_id}' order by created_at")
    return [l for l in salida.splitlines() if l]


def adelantar_suspension(user_id: str) -> None:
    """Pone suspended_until en el pasado (simula que venció el plazo)."""
    psql("auth_db", f"update users set suspended_until = now() - interval '1 hour' where id='{user_id}' and is_active=false")


def asientos_ruta(route_id: str) -> int | None:
    v = psql("route_gis_db", f"select available_seats from routes where id='{route_id}'")
    return int(v) if v else None


def contar_viajes_ruta(route_id: str, estados_activos: bool = True) -> int:
    filtro = "and status not like 'cancelado%'" if estados_activos else ""
    return int(psql("trip_db", f"select count(*) from trips where route_id='{route_id}' {filtro}"))


# --------------------------------------------------------------------------- limpieza
def cleanup() -> dict:
    """Borra SOLO datos ligados a usuarios `sim_%` en las 5 bases + llaves de Redis y caché."""
    res: dict[str, int | str] = {}
    ids_txt = psql("auth_db", f"select id from users where starts_with(email, '{PREFIJO}')")
    ids = [i for i in ids_txt.splitlines() if i]
    res["usuarios_sim"] = len(ids)
    if not ids:
        # igual limpiamos la caché de códigos huérfanos
        _limpiar_cache_auth(res)
        return res
    lista = ",".join(f"'{i}'" for i in ids)

    # trip_db
    trips = psql("trip_db", f"select id from trips where driver_id in ({lista}) or passenger_id in ({lista})").splitlines()
    tl = ",".join(f"'{t}'" for t in trips if t)
    if tl:
        for tabla in ("trip_sos_events", "trip_tracking_points", "trip_status_history", "trip_cancellations", "trip_completed_summaries"):
            psql("trip_db", f"delete from {tabla} where trip_id in ({tl})")
        psql("trip_db", f"delete from trips where id in ({tl})")
    psql("trip_db", f"delete from trip_cancellations where cancelled_by_user_id in ({lista})")
    res["viajes"] = len([t for t in trips if t])

    # route_gis_db
    rutas = psql("route_gis_db", f"select id from routes where driver_id in ({lista})").splitlines()
    rl = ",".join(f"'{r}'" for r in rutas if r)
    if rl:
        psql("route_gis_db", f"delete from route_stops where route_id in ({rl})")
        psql("route_gis_db", f"delete from trip_requests where route_id in ({rl})")
        psql("route_gis_db", f"delete from routes where id in ({rl})")
    psql("route_gis_db", f"delete from trip_requests where passenger_id in ({lista})")
    res["rutas"] = len([r for r in rutas if r])

    # vehicle_db
    vehs = psql("vehicle_db", f"select id from vehicles where user_id in ({lista})").splitlines()
    vl = ",".join(f"'{v}'" for v in vehs if v)
    if vl:
        psql("vehicle_db", f"delete from document_access_logs where vehicle_id in ({vl})")
        psql("vehicle_db", f"delete from vehicle_documents where vehicle_id in ({vl})")
        psql("vehicle_db", f"delete from vehicles where id in ({vl})")
    res["vehiculos"] = len([v for v in vehs if v])

    # notification_db
    for tabla, col in (
        ("notifications", "user_id"),
        ("device_push_tokens", "user_id"),
        ("push_subscriptions", "user_id"),
        ("ratings", "rater_user_id"),
        ("ratings", "rated_user_id"),
        ("reports", "reporter_user_id"),
        ("reports", "reported_user_id"),
    ):
        psql("notification_db", f"delete from {tabla} where {col} in ({lista})")

    # auth_db
    psql("auth_db", f"delete from user_suspension_logs where user_id in ({lista})")
    psql("auth_db", f"delete from user_reputation_stats where user_id in ({lista})")
    psql("auth_db", f"delete from model_has_roles where model_id in ({lista})")
    psql("auth_db", f"delete from model_has_permissions where model_id in ({lista})")
    psql("auth_db", f"delete from users where id in ({lista})")
    _limpiar_cache_auth(res)

    # Redis: llaves de suspensión de los usuarios sim
    borradas = 0
    for i in ids:
        for llave in redis_cli("--scan", "--pattern", f"*uniwheels:suspended_user:{i}").splitlines():
            if llave and i in llave:
                borradas += 1 if redis_cli("del", llave).strip() == "1" else 0
    res["redis_llaves"] = borradas
    return res


def _limpiar_cache_auth(res: dict) -> None:
    # CACHE_STORE=database en auth-service: llaves email_verification_sim_*
    n = psql("auth_db", f"select count(*) from cache where strpos(key, '{PREFIJO}') > 0")
    psql("auth_db", f"delete from cache where strpos(key, '{PREFIJO}') > 0")
    res["cache_codigos"] = int(n or 0)
