#!/usr/bin/env bash
# Backup diario de todas las bases de datos de UniWheels (pg_dumpall), con
# retención local. Corre en el HOST vía cron, no dentro de un contenedor —
# así el backup sobrevive a que se recree o reconstruya el contenedor de
# Postgres (el volumen postgres_data protege de reinicios, no de un
# `docker compose down -v` accidental ni de un disco corrupto).
#
# Uso (crontab -e en la VM):
#   0 3 * * * /home/ubuntu/uniwheels/docker/backup-postgres.sh >> /home/ubuntu/uniwheels/docker/backups/backup.log 2>&1
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$DIR/backups"
RETENCION_DIAS=14
FECHA=$(date +%Y-%m-%d_%H%M)

mkdir -p "$BACKUP_DIR"

# shellcheck disable=SC1091
source "$DIR/.env"

docker compose -f "$DIR/docker-compose.prod.yml" exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  postgres_gis pg_dumpall -U uniwheels_user \
  | gzip > "$BACKUP_DIR/uniwheels_${FECHA}.sql.gz"

find "$BACKUP_DIR" -name 'uniwheels_*.sql.gz' -mtime +"$RETENCION_DIAS" -delete

echo "[$(date -Iseconds)] Backup completado: uniwheels_${FECHA}.sql.gz"
