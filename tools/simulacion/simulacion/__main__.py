"""CLI: python -m simulacion run --all | run --escenario 1,5 | --cleanup"""
import argparse
import json
import platform
import sys
import time
import traceback
from pathlib import Path
from datetime import datetime

from . import contrato, infra
from .acciones import Ctx, alta_conductor, alta_usuario, aprobar_vehiculo, login_admin
from .cliente import Registro
from .config import SERVICIOS, directorio_reporte, verificar_seguridad
from .escenarios import ESCENARIOS
from .personas import CONDUCTORES, PERSONAS


CACHE = Path(__file__).resolve().parents[1] / ".sesiones.json"  # ignorado por git; solo acelera reintentos locales


def _leer_cache() -> dict:
    try:
        return json.loads(CACHE.read_text())
    except Exception:
        return {}


def _guardar_cache():
    CACHE.write_text(json.dumps({p.clave: {"token": p.token, "user_id": p.user_id, "vehicle_id": p.vehicle_id, "extra": p.extra} for p in PERSONAS.values()}))


def preparar(ctx: Ctx) -> dict:
    """Escenario 0: sim_admin por tinker, sedes, alta de los 20 usuarios y aprobación de vehículos."""
    ctx.pasos, ctx.aserciones = [], []
    t0 = time.time()
    ctx.estado["admin_id_db"] = infra.asegurar_admin()
    r = ctx.api.req("GET", "auth", "/api/v1/institutions", etiqueta="GET /institutions")
    ctx.campus = (r.get("data.0.campuses") or []) if r.status == 200 else []
    ctx.check("GET /institutions devuelve las sedes de UNAB", len(ctx.campus) >= 1, ">= 1 sede", len(ctx.campus))
    ctx.check("login de sim_admin", login_admin(ctx), True, bool(ctx.admin_token))
    fallidos = []
    cache = _leer_cache()
    for p in PERSONAS.values():
        c = cache.get(p.clave)
        if c and c.get("token"):  # reutiliza la sesión de una corrida previa (los tokens duran 4 h)
            me = ctx.api.req("GET", "auth", "/api/v1/auth/me", token=c["token"], etiqueta=f"{p.clave}: sesión en caché")
            if me.status == 200:
                p.token, p.user_id, p.vehicle_id, p.extra = c["token"], c["user_id"], c.get("vehicle_id"), c.get("extra", {})
                continue
        if not alta_usuario(ctx, p):
            fallidos.append(p.clave)
            continue
    ctx.check("alta de los 20 usuarios por la API real (código del log -> register -> login)", not fallidos, "20 usuarios", f"fallidos: {fallidos}")
    fallo_cond = []
    for p in CONDUCTORES:
        if p.vehicle_id and p.extra.get("aprobado"):
            continue
        if p.token and not alta_conductor(ctx, p):
            fallo_cond.append(p.clave)
    ctx.check("alta de los 6 conductores (driver/register, vehículo, documentos)", not fallo_cond, 6, f"fallidos: {fallo_cond}")
    sin_aprobar = []
    for p in CONDUCTORES:
        if p.vehicle_id and not p.extra.get("aprobado"):
            estado = aprobar_vehiculo(ctx, p) if p.extra.get("docs") else "aprobado?"
            if p.extra.get("docs") and estado != "aprobado":
                sin_aprobar.append((p.clave, estado))
            else:
                p.extra["aprobado"] = True
    ctx.check("Bienestar aprueba los 6 vehículos (estado aprobado)", not sin_aprobar, "aprobado", sin_aprobar)
    for p in CONDUCTORES:  # el token ya pudo emitirse antes de aprobar: verificar el endpoint de vehículo aprobado
        if p.vehicle_id:
            r = ctx.api.req("GET", "vehicle", "/api/v1/vehicles/check-approved", token=p.token, etiqueta=f"{p.clave}: check-approved")
            if r.get("has_approved_vehicle") is not True:
                ctx.check(f"{p.clave}: check-approved devuelve true tras la aprobación", False, True, r.data)
    _guardar_cache()
    return {
        "numero": 0,
        "nombre": "Preparación: alta de 20 usuarios por la API real",
        "estado": "pasó" if all(a["ok"] for a in ctx.aserciones) else "falló",
        "duracion_s": round(time.time() - t0, 1),
        "aserciones": ctx.aserciones,
        "pasos": ctx.pasos,
    }


def ejecutar(numeros: list[int], fecha: str | None, con_contrato: bool = False, mezclar: bool = False) -> int:
    verificar_seguridad()
    registro = Registro()
    ctx = Ctx(registro)
    salida = directorio_reporte(fecha)
    resultados = {
        "inicio": datetime.now().isoformat(timespec="seconds"),
        "host": platform.node(),
        "servicios": SERVICIOS,
        "escenarios": [],
    }
    previos = {}
    if mezclar and (salida / "resultados.json").exists():  # conserva los escenarios de una corrida anterior
        previos = json.loads((salida / "resultados.json").read_text())

    def guardar():
        salida_json = dict(resultados)
        salida_json["metricas_globales"] = registro.metricas()
        salida_json["semana"] = ctx.estado.get("s12_stats")
        if previos:
            nuevos = {e["numero"] for e in resultados["escenarios"]}
            salida_json["escenarios"] = sorted(
                resultados["escenarios"] + [e for e in previos.get("escenarios", []) if e["numero"] not in nuevos],
                key=lambda e: e["numero"],
            )
            salida_json["semana"] = salida_json["semana"] or previos.get("semana")
            salida_json["metricas_globales_corrida_previa"] = previos.get("metricas_globales")
            salida_json["contrato"] = resultados.get("contrato") or previos.get("contrato")
        (salida / "resultados.json").write_text(json.dumps(salida_json, ensure_ascii=False, indent=2, default=str))

    registro.escenario_actual = "0"
    resultados["escenarios"].append(preparar(ctx))
    guardar()
    for n in numeros:
        nombre, fn = ESCENARIOS[n]
        ctx.pasos, ctx.aserciones = [], []
        registro.escenario_actual = str(n)
        print(f"[{n:>2}] {nombre} ...", flush=True)
        t0 = time.time()
        error = None
        try:
            fn(ctx)
        except Exception:  # un escenario roto no detiene la corrida
            error = traceback.format_exc()
            ctx.check("el escenario termina sin excepción", False, "sin excepción", error.splitlines()[-1])
        ok = all(a["ok"] for a in ctx.aserciones) and not error
        resultados["escenarios"].append({
            "numero": n, "nombre": nombre, "estado": "pasó" if ok else "falló",
            "duracion_s": round(time.time() - t0, 1),
            "aserciones": ctx.aserciones, "pasos": ctx.pasos,
            "metricas": registro.metricas(str(n)), "error": error,
        })
        print(f"     -> {'PASÓ' if ok else 'FALLÓ'} ({sum(a['ok'] for a in ctx.aserciones)}/{len(ctx.aserciones)} aserciones)", flush=True)
        guardar()
    if 1 in numeros or con_contrato:
        registro.escenario_actual = "contrato"
        try:
            resultados["contrato"] = contrato.sondear(ctx)
        except Exception:
            resultados["contrato"] = [{"error": traceback.format_exc()}]
    resultados["fin"] = datetime.now().isoformat(timespec="seconds")
    guardar()
    pasaron = sum(1 for e in resultados["escenarios"] if e["numero"] > 0 and e["estado"] == "pasó")
    total = sum(1 for e in resultados["escenarios"] if e["numero"] > 0)
    print(f"\nEscenarios: {pasaron}/{total} pasaron. Resultados en {salida / 'resultados.json'}")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="simulacion", description="Simulador de usuarios de UniWheels (solo localhost)")
    sub = ap.add_subparsers(dest="cmd")
    run = sub.add_parser("run", help="ejecuta escenarios")
    run.add_argument("--all", action="store_true")
    run.add_argument("--escenario", help="lista separada por comas, p. ej. 1,5,11")
    run.add_argument("--fecha", help="carpeta de reporte (por defecto, hoy)")
    run.add_argument("--contrato", action="store_true", help="ejecuta también el sondeo de contrato (siempre con --all)")
    run.add_argument("--merge", action="store_true", help="conserva los escenarios de resultados.json que no se re-ejecutan")
    ap.add_argument("--cleanup", action="store_true", help="borra SOLO los datos con prefijo sim_")
    args = ap.parse_args(argv)
    verificar_seguridad()
    if args.cleanup:
        print(json.dumps(infra.cleanup(), ensure_ascii=False, indent=2))
        CACHE.unlink(missing_ok=True)
        return 0
    if args.cmd == "run":
        numeros = sorted(ESCENARIOS) if args.all else [int(x) for x in (args.escenario or "").split(",") if x]
        if not numeros:
            ap.error("indica --all o --escenario N[,M]")
        return ejecutar(numeros, args.fecha, args.contrato, args.merge)
    ap.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
