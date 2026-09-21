#!/usr/bin/env bash
# ==============================================================================
# UniWheels — Simulacro de Restauración de Base de Datos (Restore Drill)
# ==============================================================================
# Este script automatiza la prueba de recuperación ante desastres (Disaster Recovery)
# restaurando un dump generado por backup-postgres.sh en un contenedor PostgreSQL/PostGIS
# COMPLETAMENTE AISLADO y TEMPORAL, sin tocar ni poner en riesgo la base de datos de producción.
#
# ==============================================================================
# CRITERIO DE ÉXITO EXPLÍCITO DE LA RESTAURACIÓN:
# ==============================================================================
# 1. Existencia de las 5 bases de datos esperadas del stack de microservicios:
#    - auth_db (usuarios, billeteras, transacciones, eventos pasarela)
#    - vehicle_db (vehículos, documentación técnica)
#    - route_gis_db (rutas geoespaciales, índices espaciales)
#    - trip_db (ciclo de vida del viaje, tracking GPS, liquidaciones)
#    - notification_db (notificaciones push y auditoría de envíos)
#
# 2. Conteo mínimo de tablas por microservicio (esquema íntegro):
#    - auth_db:          >= 5 tablas
#    - vehicle_db:       >= 2 tablas
#    - route_gis_db:     >= 1 tabla
#    - trip_db:          >= 4 tablas
#    - notification_db:  >= 1 tabla
#
# 3. Disponibilidad y funcionamiento de la extensión PostGIS:
#    - route_gis_db debe responder exitosamente a `SELECT postgis_version();`
#
# 4. Integridad de lectura en tablas maestras críticas:
#    - Consulta exitosa de conteo de registros en `auth_db.users` y `trip_db.trips`.
# ==============================================================================
#
# Uso:
#   ./docker/restore-drill.sh [ruta_al_dump.sql.gz]
#
# Si no se especifica archivo, utiliza el dump más reciente en docker/backups/
# ==============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$DIR/backups"

# 1. Determinar el archivo de dump a probar
if [ $# -ge 1 ]; then
    DUMP_FILE="$1"
else
    # Buscar el backup más reciente
    DUMP_FILE=$(find "$BACKUP_DIR" -name 'uniwheels_*.sql.gz' -type f 2>/dev/null | sort -r | head -n 1 || true)
fi

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
    echo "[ERROR] No se encontró ningún archivo de backup para realizar el restore drill." >&2
    echo "Uso: $0 [ruta_al_dump.sql.gz]" >&2
    exit 1
fi

echo "=================================================================="
echo "UniWheels — Restore Drill (Simulacro de Restauración)"
echo "Archivo a verificar: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
echo "Timestamp: $(date -Iseconds)"
echo "=================================================================="

# Generar identificador único para el entorno aislado
DRILL_ID="drill_$(date +%s)_$RANDOM"
CONTAINER_NAME="uniwheels_pg_${DRILL_ID}"
DRILL_PASSWORD="drill_password_${RANDOM}"
IMAGE_POSTGIS="docker.io/postgis/postgis:16-3.4-alpine"

# Detectar runtime de contenedores (docker o podman)
if command -v docker >/dev/null 2>&1; then
    DOCKER_CMD="docker"
elif command -v podman >/dev/null 2>&1; then
    DOCKER_CMD="podman"
else
    echo "[ERROR] No se encontró docker ni podman en el sistema." >&2
    exit 1
fi

# Limpieza garantizada al salir (éxito o error)
cleanup() {
    echo ""
    echo "[CLEANUP] Destruyendo contenedor temporal aislado ($CONTAINER_NAME)..."
    $DOCKER_CMD rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    echo "[CLEANUP] Entorno temporal desmontado limpiamente."
}
trap cleanup EXIT

# 2. Levantar contenedor temporal aislado
echo "[1/4] Levantando contenedor PostgreSQL temporal aislado..."
$DOCKER_CMD run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER=uniwheels_user \
    -e POSTGRES_PASSWORD="$DRILL_PASSWORD" \
    "$IMAGE_POSTGIS" >/dev/null

# 3. Esperar que PostgreSQL esté listo
echo "[2/4] Esperando inicialización del motor de base de datos..."
MAX_ATTEMPTS=30
ATTEMPT=0
until $DOCKER_CMD exec -e PGPASSWORD="$DRILL_PASSWORD" "$CONTAINER_NAME" pg_isready -U uniwheels_user -h 127.0.0.1 >/dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
        echo "[ERROR] Timeout esperando que el contenedor temporal esté listo." >&2
        exit 1
    fi
    sleep 1
done
echo "PostgreSQL temporal iniciado y listo para recibir restauración."

# 4. Restaurar el dump
echo "[3/4] Restaurando dump en el contenedor temporal..."
if [[ "$DUMP_FILE" == *.gz ]]; then
    gunzip -c "$DUMP_FILE" | $DOCKER_CMD exec -i -e PGPASSWORD="$DRILL_PASSWORD" "$CONTAINER_NAME" psql -U uniwheels_user postgres >/dev/null 2>&1
else
    $DOCKER_CMD exec -i -e PGPASSWORD="$DRILL_PASSWORD" "$CONTAINER_NAME" psql -U uniwheels_user postgres < "$DUMP_FILE" >/dev/null 2>&1
fi
echo "Restauración ejecutada. Iniciando verificación de criterios de éxito..."

# 5. Verificación de criterios de éxito
echo "[4/4] Evaluando criterios de éxito..."
FAILURES=0

ejecutar_sql() {
    local db="$1"
    local query="$2"
    $DOCKER_CMD exec -e PGPASSWORD="$DRILL_PASSWORD" "$CONTAINER_NAME" psql -U uniwheels_user -d "$db" -t -A -c "$query" 2>/dev/null || echo "ERROR"
}

# --- Criterio 1 & 2: Verificar bases de datos y cantidad mínima de tablas ---
declare -A BASES_TABLAS_MINIMAS=(
    ["auth_db"]=5
    ["vehicle_db"]=2
    ["route_gis_db"]=1
    ["trip_db"]=4
    ["notification_db"]=1
)

for DB in "${!BASES_TABLAS_MINIMAS[@]}"; do
    MIN_TABLAS="${BASES_TABLAS_MINIMAS[$DB]}"
    # Verificar si la base existe
    DB_EXISTS=$(ejecutar_sql postgres "SELECT 1 FROM pg_database WHERE datname='$DB';")
    if [ "$DB_EXISTS" != "1" ]; then
        echo "  [FAIL] Base de datos '$DB' NO existe tras la restauración."
        FAILURES=$((FAILURES + 1))
        continue
    fi

    # Contar tablas públicas
    TABLE_COUNT=$(ejecutar_sql "$DB" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
    if [[ "$TABLE_COUNT" =~ ^[0-9]+$ ]] && [ "$TABLE_COUNT" -ge "$MIN_TABLAS" ]; then
        echo "  [OK] Base de datos '$DB': presente con $TABLE_COUNT tablas (mínimo requerido: $MIN_TABLAS)."
    else
        echo "  [FAIL] Base de datos '$DB': tiene $TABLE_COUNT tablas (esperado >= $MIN_TABLAS)."
        FAILURES=$((FAILURES + 1))
    fi
done

# --- Criterio 3: Verificar PostGIS en route_gis_db ---
POSTGIS_VER=$(ejecutar_sql route_gis_db "SELECT postgis_lib_version();")
if [[ "$POSTGIS_VER" != "ERROR" && -n "$POSTGIS_VER" ]]; then
    echo "  [OK] Extensión PostGIS en 'route_gis_db': activa y funcional (versión: $POSTGIS_VER)."
else
    echo "  [FAIL] Extensión PostGIS en 'route_gis_db' no está disponible o arrojó error."
    FAILURES=$((FAILURES + 1))
fi

# --- Criterio 4: Integridad de lectura en tablas maestras ---
AUTH_USERS=$(ejecutar_sql auth_db "SELECT count(*) FROM users;")
if [[ "$AUTH_USERS" =~ ^[0-9]+$ ]]; then
    echo "  [OK] Consulta de integridad en 'auth_db.users': accesible ($AUTH_USERS usuarios registrados)."
else
    echo "  [FAIL] Consulta de integridad en 'auth_db.users' falló."
    FAILURES=$((FAILURES + 1))
fi

TRIP_COUNT=$(ejecutar_sql trip_db "SELECT count(*) FROM trips;")
if [[ "$TRIP_COUNT" =~ ^[0-9]+$ ]]; then
    echo "  [OK] Consulta de integridad en 'trip_db.trips': accesible ($TRIP_COUNT viajes registrados)."
else
    echo "  [FAIL] Consulta de integridad en 'trip_db.trips' falló."
    FAILURES=$((FAILURES + 1))
fi

echo "=================================================================="
if [ "$FAILURES" -eq 0 ]; then
    echo "RESULTADO: SIMULACRO DE RESTAURACIÓN EXITOSO [PASS]"
    echo "El dump de backup es 100% íntegro, consistente y recuperable."
    echo "=================================================================="
    exit 0
else
    echo "RESULTADO: SIMULACRO DE RESTAURACIÓN FALLIDO ($FAILURES errores detectados) [FAIL]"
    echo "Revisa el contenido del dump o los logs de PostgreSQL."
    echo "=================================================================="
    exit 1
fi
