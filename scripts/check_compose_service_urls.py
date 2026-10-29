#!/usr/bin/env python3
"""Verifica que cada *_URL que un servicio lee en config/services.php esté
definida en el `environment` de ese servicio en docker-compose.prod.yml.

Sin esa variable el servicio cae al default 127.0.0.1 (él mismo) en producción.
Uso: python3 scripts/check_compose_service_urls.py
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
COMPOSE = ROOT / "docker" / "docker-compose.prod.yml"
ENV_URL = re.compile(r"env\(\s*['\"]([A-Z0-9_]+_URL)['\"]")


def compose_env(service):
    env = service.get("environment") or {}
    if isinstance(env, list):
        return {item.split("=", 1)[0] for item in env}
    return set(env)


def find_missing(root=ROOT, compose=COMPOSE):
    services = yaml.safe_load(compose.read_text())["services"]
    missing = []
    for config in sorted(root.glob("services/*/config/services.php")):
        name = config.parent.parent.name
        wanted = set(ENV_URL.findall(config.read_text()))
        defined = compose_env(services.get(name, {}))
        missing += [(name, var) for var in sorted(wanted - defined)]
    return missing


if __name__ == "__main__":
    missing = find_missing()
    for name, var in missing:
        print(f"FALTA {var} en environment de {name} (docker-compose.prod.yml)")
    if missing:
        sys.exit(1)
    print("OK: todas las *_URL de config/services.php están en el compose.")
