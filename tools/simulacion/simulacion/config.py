"""Configuración y salvaguardas de seguridad del simulador.

El simulador SOLO habla con localhost. Cualquier otro host aborta la ejecución.
"""
import os
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

PROHIBIDOS = ("uniwheels.org", "68.155.150.69")

SERVICIOS = {
    "auth": os.environ.get("SIM_AUTH_URL", "http://localhost:8001"),
    "vehicle": os.environ.get("SIM_VEHICLE_URL", "http://localhost:8002"),
    "route": os.environ.get("SIM_ROUTE_URL", "http://localhost:8003"),
    "trip": os.environ.get("SIM_TRIP_URL", "http://localhost:8004"),
    "notif": os.environ.get("SIM_NOTIF_URL", "http://localhost:8005"),
}

REPO_ROOT = Path(__file__).resolve().parents[3]

# Raíz del backend que está corriendo (donde están vendor/ y los .env locales).
BACKEND_ROOT = Path(os.environ.get("UNIWHEELS_BACKEND_ROOT", REPO_ROOT))
AUTH_LOG = BACKEND_ROOT / "services/auth-service/storage/logs/laravel.log"

PREFIJO = "sim_"
DOMINIO = "unab.edu.co"
PASSWORD = "Sim_Pass#2026"
ADMIN_EMAIL = f"{PREFIJO}admin@{DOMINIO}"
ADMIN_PASSWORD = "Sim_Admin#2026"

PG_CONTAINER = os.environ.get("SIM_PG_CONTAINER", "uniwheels_postgres_gis")
PG_USER = os.environ.get("SIM_PG_USER", "uniwheels_user")
REDIS_CONTAINER = os.environ.get("SIM_REDIS_CONTAINER", "uniwheels_redis")

REPORTES_DIR = REPO_ROOT / "reportes" / "simulacion"


def directorio_reporte(fecha: str | None = None) -> Path:
    d = REPORTES_DIR / (fecha or date.today().isoformat())
    d.mkdir(parents=True, exist_ok=True)
    return d


def verificar_seguridad() -> None:
    """Aborta si algún servicio apunta fuera de localhost o a producción."""
    for nombre, url in SERVICIOS.items():
        host = urlparse(url).hostname or ""
        if any(p in url for p in PROHIBIDOS) or host not in ("localhost", "127.0.0.1"):
            sys.exit(f"[SEGURIDAD] {nombre}={url} no es localhost. El simulador nunca corre contra producción.")
