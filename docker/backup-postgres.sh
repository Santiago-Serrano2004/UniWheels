#!/usr/bin/env bash
# Backup diario de todas las bases de datos de UniWheels (pg_dumpall), con
# retención local y subida opcional a Cloudflare R2 (bucket separado de backups).
# Corre en el HOST vía cron, no dentro de un contenedor — así el backup
# sobrevive a que se recree o reconstruya el contenedor de Postgres
# (el volumen postgres_data protege de reinicios, no de un `docker compose down -v`
# accidental ni de un disco corrupto).
#
# Uso (crontab -e en la VM):
#   0 3 * * * /home/ubuntu/uniwheels/docker/backup-postgres.sh >> /home/ubuntu/uniwheels/docker/backups/backup.log 2>&1
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$DIR/backups"
RETENCION_DIAS=14
FECHA=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="$BACKUP_DIR/uniwheels_${FECHA}.sql.gz"

mkdir -p "$BACKUP_DIR"

# shellcheck disable=SC1091
if [ -f "$DIR/.env" ]; then
  source "$DIR/.env"
fi

echo "[$(date -Iseconds)] Iniciando dump de PostgreSQL..."

docker compose -f "$DIR/docker-compose.prod.yml" exec -T \
  -e PGPASSWORD="${POSTGRES_PASSWORD:-}" \
  postgres_gis pg_dumpall -U uniwheels_user \
  | gzip > "$BACKUP_FILE"

echo "[$(date -Iseconds)] Backup local completado: uniwheels_${FECHA}.sql.gz ($(du -h "$BACKUP_FILE" | cut -f1))"

# Limpieza de retención local
find "$BACKUP_DIR" -name 'uniwheels_*.sql.gz' -mtime +"$RETENCION_DIAS" -delete

# Subida a Cloudflare R2 (Offsite Backup) — Bucket DEDICADO para backups de DB
if [ -n "${R2_BACKUPS_BUCKET:-}" ]; then
  echo "[$(date -Iseconds)] Subiendo backup a Cloudflare R2 (bucket: $R2_BACKUPS_BUCKET)..."
  ENDPOINT="${R2_BACKUPS_ENDPOINT:-${R2_ENDPOINT:-}}"
  KEY_ID="${R2_BACKUPS_ACCESS_KEY_ID:-${R2_ACCESS_KEY_ID:-}}"
  SECRET_KEY="${R2_BACKUPS_SECRET_ACCESS_KEY:-${R2_SECRET_ACCESS_KEY:-}}"

  if [ -z "$ENDPOINT" ] || [ -z "$KEY_ID" ] || [ -z "$SECRET_KEY" ]; then
    echo "[$(date -Iseconds)] ERROR: R2_BACKUPS_BUCKET está configurado pero faltan credenciales (R2_BACKUPS_ENDPOINT, R2_BACKUPS_ACCESS_KEY_ID, R2_BACKUPS_SECRET_ACCESS_KEY)." >&2
    exit 1
  fi

  if command -v aws >/dev/null 2>&1; then
    AWS_ACCESS_KEY_ID="$KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$SECRET_KEY" \
    aws s3 cp "$BACKUP_FILE" "s3://${R2_BACKUPS_BUCKET}/postgres/uniwheels_${FECHA}.sql.gz" \
      --endpoint-url "$ENDPOINT"
    echo "[$(date -Iseconds)] Subida exitosa a R2 vía AWS CLI."
  elif command -v rclone >/dev/null 2>&1; then
    RCLONE_CONFIG_R2_TYPE=s3 \
    RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
    RCLONE_CONFIG_R2_ACCESS_KEY_ID="$KEY_ID" \
    RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$SECRET_KEY" \
    RCLONE_CONFIG_R2_ENDPOINT="$ENDPOINT" \
    rclone copyto "$BACKUP_FILE" "R2:${R2_BACKUPS_BUCKET}/postgres/uniwheels_${FECHA}.sql.gz"
    echo "[$(date -Iseconds)] Subida exitosa a R2 vía rclone."
  elif command -v python3 >/dev/null 2>&1; then
    python3 - <<PYEOF
import os, sys, urllib.request, hashlib, hmac, datetime, urllib.parse

endpoint = "$ENDPOINT".rstrip('/')
bucket = "$R2_BACKUPS_BUCKET"
key_id = "$KEY_ID"
secret_key = "$SECRET_KEY"
filepath = "$BACKUP_FILE"
object_key = f"postgres/uniwheels_${FECHA}.sql.gz"

try:
    import boto3
    from botocore.config import Config
    s3 = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    s3.upload_file(filepath, bucket, object_key)
    print(f"[{datetime.datetime.now().isoformat()}] Subida exitosa a R2 vía boto3.")
except ImportError:
    with open(filepath, 'rb') as f:
        data = f.read()

    host = urllib.parse.urlparse(endpoint).netloc
    url = f"{endpoint}/{bucket}/{object_key}"
    payload_hash = hashlib.sha256(data).hexdigest()
    t = datetime.datetime.now(datetime.timezone.utc)
    amzdate = t.strftime('%Y%m%dT%H%M%SZ')
    datestamp = t.strftime('%Y%m%d')
    region = 'auto'
    service = 's3'

    canonical_uri = f"/{bucket}/{object_key}"
    canonical_headers = f'host:{host}\nx-amz-content-sha256:{payload_hash}\nx-amz-date:{amzdate}\n'
    signed_headers = 'host;x-amz-content-sha256;x-amz-date'
    canonical_request = f"PUT\n{canonical_uri}\n\n{canonical_headers}\n{signed_headers}\n{payload_hash}"

    algorithm = 'AWS4-HMAC-SHA256'
    credential_scope = f"{datestamp}/{region}/{service}/aws4_request"
    string_to_sign = f"{algorithm}\n{amzdate}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

    def sign(key, msg):
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    kDate = sign(('AWS4' + secret_key).encode('utf-8'), datestamp)
    kRegion = sign(kDate, region)
    kService = sign(kRegion, service)
    kSigning = sign(kService, 'aws4_request')
    signature = hmac.new(kSigning, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

    authorization_header = f"{algorithm} Credential={key_id}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

    req = urllib.request.Request(url, data=data, method='PUT')
    req.add_header('Host', host)
    req.add_header('x-amz-date', amzdate)
    req.add_header('x-amz-content-sha256', payload_hash)
    req.add_header('Authorization', authorization_header)
    req.add_header('Content-Type', 'application/gzip')

    with urllib.request.urlopen(req) as resp:
        if resp.status in (200, 201, 204):
            print(f"[{datetime.datetime.now().isoformat()}] Subida exitosa a R2 vía Python SigV4.")
        else:
            raise Exception(f"HTTP error {resp.status}")
PYEOF
  else
    echo "[$(date -Iseconds)] AVISO: R2_BACKUPS_BUCKET configurado pero no se encontró aws-cli, rclone ni python3." >&2
  fi
else
  echo "[$(date -Iseconds)] AVISO: R2_BACKUPS_BUCKET no configurado. El backup solo se conservará localmente en $BACKUP_DIR."
fi

echo "[$(date -Iseconds)] Proceso de backup finalizado."
