#!/usr/bin/env python3
"""
Política de retención GFS (Grandfather-Father-Son) para los respaldos de
PostgreSQL generados por `./uniwheels backup`.

Se agrupan los archivos por base de datos (prefijo del nombre de archivo,
formato "<db>_<YYYYmmdd_HHMMSS>.sql.gz") y se conserva:
  - Todos los respaldos de los últimos KEEP_DAILY_DAYS días (diarios).
  - El respaldo más antiguo de cada una de las últimas KEEP_WEEKLY_WEEKS
    semanas (semanales) — sobrevive aunque ya no esté en la ventana diaria.
  - El respaldo más antiguo de cada uno de los últimos KEEP_MONTHLY_MONTHS
    meses (mensuales).
Todo lo que no caiga en ninguna de esas tres categorías se elimina.

Uso: python3 backup_retention.py <directorio_de_backups>
"""
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

KEEP_DAILY_DAYS = 7
KEEP_WEEKLY_WEEKS = 4
KEEP_MONTHLY_MONTHS = 6

FILENAME_RE = re.compile(r"^(?P<db>[a-z_]+)_(?P<ts>\d{8}_\d{6})\.sql\.gz$")


def parse_backups(backup_dir: Path):
    por_base_de_datos = defaultdict(list)
    for archivo in backup_dir.glob("*.sql.gz"):
        m = FILENAME_RE.match(archivo.name)
        if not m:
            continue
        try:
            ts = datetime.strptime(m.group("ts"), "%Y%m%d_%H%M%S")
        except ValueError:
            continue
        por_base_de_datos[m.group("db")].append((ts, archivo))
    return por_base_de_datos


def calcular_a_conservar(respaldos: list[tuple[datetime, Path]]) -> set[Path]:
    ahora = datetime.now()
    respaldos_ordenados = sorted(respaldos, key=lambda r: r[0])
    conservar: set[Path] = set()

    # 1. Diarios: todo lo de los últimos N días.
    corte_diario = ahora - timedelta(days=KEEP_DAILY_DAYS)
    for ts, archivo in respaldos_ordenados:
        if ts >= corte_diario:
            conservar.add(archivo)

    # 2. Semanales: el más antiguo de cada semana ISO, últimas N semanas.
    semanas_vistas = {}
    corte_semanal = ahora - timedelta(weeks=KEEP_WEEKLY_WEEKS)
    for ts, archivo in respaldos_ordenados:
        if ts < corte_semanal:
            continue
        clave_semana = ts.isocalendar()[:2]  # (año, num_semana)
        if clave_semana not in semanas_vistas:
            semanas_vistas[clave_semana] = archivo
    conservar.update(semanas_vistas.values())

    # 3. Mensuales: el más antiguo de cada mes calendario, últimos N meses.
    meses_vistos = {}
    corte_mensual = ahora - timedelta(days=30 * KEEP_MONTHLY_MONTHS)
    for ts, archivo in respaldos_ordenados:
        if ts < corte_mensual:
            continue
        clave_mes = (ts.year, ts.month)
        if clave_mes not in meses_vistos:
            meses_vistos[clave_mes] = archivo
    conservar.update(meses_vistos.values())

    return conservar


def main():
    if len(sys.argv) != 2:
        print("Uso: backup_retention.py <directorio_de_backups>")
        return 1

    backup_dir = Path(sys.argv[1])
    if not backup_dir.is_dir():
        print(f"El directorio {backup_dir} no existe.")
        return 1

    por_base_de_datos = parse_backups(backup_dir)
    total_eliminados = 0

    for db, respaldos in por_base_de_datos.items():
        a_conservar = calcular_a_conservar(respaldos)
        for _, archivo in respaldos:
            if archivo not in a_conservar:
                archivo.unlink()
                total_eliminados += 1
        print(f"  {db}: {len(a_conservar)} respaldo(s) conservado(s), {len(respaldos) - len(a_conservar)} eliminado(s).")

    if total_eliminados == 0:
        print("  No había respaldos antiguos para eliminar todavía.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
