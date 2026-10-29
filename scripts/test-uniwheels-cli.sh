#!/usr/bin/env bash
# SIM-025: pruebas del CLI ./uniwheels sin PHP, Docker ni servicios reales.
#   - migrate: sale con código != 0 y NO imprime "completadas" si alguna migración falla.
#   - start: avisa si OSRM no tiene datos (sin pedir su contenedor) y termina aunque
#     su salida esté canalizada (`| cat`), sin depender de una TTY.
# Ejecutar: bash scripts/test-uniwheels-cli.sh
set -u

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
FAILS=0

cleanup() {
    for pidfile in "${TMP}"/.uniwheels/pids/*.pid; do
        [ -f "${pidfile}" ] && kill "$(cat "${pidfile}")" 2>/dev/null
    done
    pkill -f "${TMP}/fakebin" 2>/dev/null
    rm -rf "${TMP}"
}
trap cleanup EXIT

ok()   { echo "  ok   - $1"; }
fail() { echo "  FAIL - $1"; FAILS=$((FAILS + 1)); }

# --- Árbol mínimo: copia del CLI + carpetas de servicios vacías -----------------------
mkdir -p "${TMP}/docker/osrm-data" "${TMP}/fakebin"
cp "${REPO}/uniwheels" "${TMP}/uniwheels"
touch "${TMP}/docker/docker-compose.yml"
for d in auth-service vehicle-service route-matching-service trip-service notification-service ai-route-service; do
    mkdir -p "${TMP}/services/${d}"
done
mkdir -p "${TMP}/frontend"

# php falso: `artisan migrate` falla en el servicio indicado; `artisan serve` se queda vivo sin escuchar.
cat > "${TMP}/fakebin/php" <<'SH'
#!/usr/bin/env bash
if [ "$2" = "migrate" ]; then
    echo "migrando $(basename "$PWD")"
    [ "$(basename "$PWD")" = "${FAKE_MIGRATE_FAIL:-}" ] && { echo "must be owner of table wallet_transactions" >&2; exit 1; }
    exit 0
fi
exec sleep 40
SH
cat > "${TMP}/fakebin/npm" <<'SH'
#!/usr/bin/env bash
exec sleep 40
SH
# docker/podman falsos: registran los argumentos para ver qué contenedores se piden.
for bin in docker podman; do
cat > "${TMP}/fakebin/${bin}" <<SH
#!/usr/bin/env bash
echo "\$@" >> "${TMP}/compose-calls.log"
exit 0
SH
done
chmod +x "${TMP}"/fakebin/*

export PATH="${TMP}/fakebin:${PATH}"

echo "migrate"
out="$(FAKE_MIGRATE_FAIL=vehicle-service bash "${TMP}/uniwheels" migrate 2>&1)"; code=$?
[ "${code}" -ne 0 ] && ok "sale con código distinto de 0 si una migración falla (código ${code})" || fail "salió 0 con una migración fallida"
echo "${out}" | grep -q "completadas" && fail "imprimió 'completadas' pese al fallo" || ok "no imprime 'completadas' si falla"
echo "${out}" | grep -q "migrando trip-service" && ok "migra los demás servicios aunque uno falle" || fail "no migró los servicios restantes"
echo "${out}" | grep -q "vehicle-service" && ok "nombra el servicio que falló" || fail "no nombra el servicio fallido"

out="$(bash "${TMP}/uniwheels" migrate 2>&1)"; code=$?
{ [ "${code}" -eq 0 ] && echo "${out}" | grep -q "completadas"; } && ok "sin fallos: código 0 y 'completadas'" || fail "el caso exitoso debería salir 0 con 'completadas'"

echo "start"
export UNIWHEELS_PORT_WAIT_TICKS=1
start="$(date +%s)"
out="$(timeout 30 bash "${TMP}/uniwheels" start 2>&1 < /dev/null | cat)"
elapsed=$(( $(date +%s) - start ))
[ "${elapsed}" -lt 25 ] && ok "start termina con la salida canalizada (${elapsed}s)" || fail "start no termina cuando se canaliza (${elapsed}s)"
echo "${out}" | grep -q "OSRM sin datos" && ok "avisa que OSRM no tiene datos" || fail "no avisa de OSRM sin datos"
echo "${out}" | grep -q "respaldo geodésico" && ok "indica el respaldo geodésico" || fail "no menciona el respaldo geodésico"
if [ -f "${TMP}/compose-calls.log" ] && grep -q "osrm_backend" "${TMP}/compose-calls.log"; then
    fail "pidió el contenedor de OSRM sin datos"
else
    ok "no pide el contenedor de OSRM sin datos"
fi

if [ "${FAILS}" -gt 0 ]; then
    echo "${FAILS} prueba(s) fallaron"
    exit 1
fi
echo "todas las pruebas del CLI pasaron"
