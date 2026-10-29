"""Cliente HTTP con registro de pasos, tiempos y manejo de 429."""
import json
import re
import statistics
import threading
import time
from dataclasses import dataclass, field

import httpx

from .config import SERVICIOS

UUID_RE = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
SECRETOS = ("password", "access_token", "Authorization")


def plantilla_ruta(path: str) -> str:
    return UUID_RE.sub("{id}", path)


def _censurar(obj):
    if isinstance(obj, dict):
        return {k: ("***" if k in SECRETOS else _censurar(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_censurar(v) for v in obj[:20]]
    return obj


def _truncar(texto: str, n: int = 700) -> str:
    return texto if len(texto) <= n else texto[:n] + f"...[+{len(texto) - n} car.]"


@dataclass
class Resp:
    status: int
    data: object
    texto: str
    ms: float
    headers: dict = field(default_factory=dict)

    def get(self, ruta: str, defecto=None):
        """Acceso por ruta con puntos: 'data.user.id'."""
        cur = self.data
        for p in ruta.split("."):
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            elif isinstance(cur, list) and p.isdigit() and int(p) < len(cur):
                cur = cur[int(p)]
            else:
                return defecto
        return cur


class Registro:
    """Almacena todas las llamadas HTTP (para métricas) de la ejecución."""

    def __init__(self):
        self.llamadas: list[dict] = []
        self.lock = threading.Lock()
        self.escenario_actual = None

    def agregar(self, d: dict):
        d["escenario"] = self.escenario_actual
        with self.lock:
            self.llamadas.append(d)

    def metricas(self, escenario: str | None = None) -> dict:
        por_ep: dict[str, list[float]] = {}
        codigos: dict[str, int] = {}
        total_5xx = 0
        total_429 = 0
        for c in self.llamadas:
            if escenario and c["escenario"] != escenario:
                continue
            if c["status"] == 429:
                total_429 += 1
                continue
            if c["status"] >= 500:
                total_5xx += 1
            clave = f"{c['metodo']} {c['plantilla']}"
            por_ep.setdefault(clave, []).append(c["ms"])
            codigos[str(c["status"])] = codigos.get(str(c["status"]), 0) + 1
        endpoints = {}
        for k, v in sorted(por_ep.items()):
            v = sorted(v)
            endpoints[k] = {
                "n": len(v),
                "p50_ms": round(statistics.median(v), 1),
                "p95_ms": round(v[min(len(v) - 1, int(round(0.95 * (len(v) - 1))))], 1),
                "max_ms": round(v[-1], 1),
            }
        return {"endpoints": endpoints, "codigos": codigos, "5xx": total_5xx, "429": total_429}


class Api:
    def __init__(self, registro: Registro, pasos: list | None = None):
        self.registro = registro
        self.pasos = pasos if pasos is not None else []
        self.http = httpx.Client(timeout=90.0, headers={"Accept": "application/json"})

    def cerrar(self):
        self.http.close()

    def req(
        self,
        metodo: str,
        servicio: str,
        path: str,
        token: str | None = None,
        json_body=None,
        params=None,
        files=None,
        data=None,
        etiqueta: str | None = None,
        reintentar_429: bool = True,
        headers: dict | None = None,
    ) -> Resp:
        url = f"{SERVICIOS[servicio]}{path}"
        h = dict(headers or {})
        if token:
            h["Authorization"] = f"Bearer {token}"
        intentos = 0
        while True:
            t0 = time.perf_counter()
            try:
                r = self.http.request(metodo, url, headers=h, json=json_body, params=params, files=files, data=data)
                status, texto, hdrs = r.status_code, r.text, dict(r.headers)
            except httpx.HTTPError as e:  # sin respuesta
                status, texto, hdrs = 0, f"{type(e).__name__}: {e}", {}
            ms = (time.perf_counter() - t0) * 1000
            try:
                data_json = json.loads(texto)
            except Exception:
                data_json = None
            self.registro.agregar(
                {"metodo": metodo, "plantilla": plantilla_ruta(path), "servicio": servicio, "status": status, "ms": ms}
            )
            if status == 429 and reintentar_429 and intentos < 6:
                espera = min(int(hdrs.get("retry-after", "15")) + 1, 75)
                self.pasos.append({"nota": f"429 en {metodo} {path}; espera {espera}s y reintenta"})
                time.sleep(espera)
                intentos += 1
                continue
            break
        paso = {
            "paso": etiqueta or f"{metodo} {path}",
            "request": {
                "metodo": metodo,
                "url": url,
                "params": params,
                "body": _censurar(json_body) if json_body is not None else (list(data.keys()) if data else None),
                "auth": "Bearer ***" if token else None,
            },
            "status": status,
            "respuesta": _truncar(json.dumps(_censurar(data_json), ensure_ascii=False) if data_json is not None else texto),
            "ms": round(ms, 1),
        }
        self.pasos.append(paso)
        return Resp(status, data_json, texto, ms, hdrs)
