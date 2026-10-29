#!/bin/bash
# Evidencia de la revisión estática: a qué servicio enruta gateway/api-locations.conf cada ruta que usa la app.
# Reemplaza cada `proxy_pass http://X;` por `return 200 "X";` y consulta las rutas con nginx en podman (solo localhost:18080).
# Uso: bash tools/simulacion/evidencia/gateway_probe.sh   (desde la raíz del repo)
set -e
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
D="$(mktemp -d)"
sed -E 's#proxy_pass http://([a-z_]+);#return 200 "\1";#' "$RAIZ/gateway/api-locations.conf" > "$D/api-locations.conf"
cat > "$D/nginx.conf" <<'EOF'
events { worker_connections 64; }
http {
    limit_req_zone $binary_remote_addr zone=api_gateway_limit:10m rate=80r/s;
    limit_req_zone $binary_remote_addr zone=tracking_limit:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
    limit_conn_zone $binary_remote_addr zone=addr_limit:10m;
    server {
        listen 18080;
        include /etc/nginx/api-locations.conf;
        location / { return 200 "SPA_LANDING_O_ADMIN (ninguna ruta de API coincide)"; }
    }
}
EOF
podman rm -f gwtest >/dev/null 2>&1 || true
podman run -d --rm --name gwtest --security-opt label=disable --network=host \
  -v "$D/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$D/api-locations.conf:/etc/nginx/api-locations.conf:ro" \
  docker.io/library/nginx:1.27-alpine >/dev/null
sleep 2
for p in /api/v1/driver/history /api/v1/ratings /api/v1/ratings/received /api/v1/passenger/history \
         /api/v1/user/reputation-stats /api/v1/admin/users /api/v1/admin/vehicles /api/v1/trips/abc/sos \
         /api/v1/routes/contribution-suggestion /api/v1/vehicles/check-approved /api/v1/notifications \
         /api/v1/push/device-tokens /api/v1/auth/delete-account; do
  printf '%-45s -> ' "$p"; curl -s "localhost:18080$p"; echo
done
podman rm -f gwtest >/dev/null
