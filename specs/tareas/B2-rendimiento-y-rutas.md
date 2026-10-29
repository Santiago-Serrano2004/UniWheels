# B2: rendimiento de la búsqueda, rutas pasadas, gateway y eliminación de cuenta

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/b2-rendimiento-rutas` y abre **un solo PR** contra la rama base.
- **Fuente:** `reportes/simulacion/2026-10-04/REPORTE.md`, bloques SIM-011 a SIM-014.
- **CI:** el PR tiene que quedar **en verde**. Apóyate en la CI si la sesión no tiene PHP 8.4 o PostGIS.
- **Tests:** revisa `tests/Pest.php` en cada servicio antes de escribir tests. route-matching y trip usan **PHPUnit**. No nombres helpers como métodos de `TestCase`.
- **Un commit por SIM**, cada uno con su test.

## SIM-012: rutas con salida en el pasado (alto)
1. `PublishRouteRequest`: `scheduled_departure_time` pasa a `['required', 'date', 'after:now']`, con el mensaje "La hora de salida debe ser futura.". El valor llega con offset y B1 ya lo convierte a UTC, así que la comparación debe hacerse sobre el instante correcto. Verifícalo con un test con offset `-05:00`.
2. `PostGisSpatialRepository::findCandidateRoutes`: agrega los filtros `scheduled_departure_time > now()`, `status = 'publicada'` y `available_seats > 0`, si alguno falta. **El filtro va en SQL**, antes de cualquier evaluación por candidata.
3. **Tests:**
   - publicar con salida en el pasado → 422;
   - una ruta pasada ya guardada en la base no aparece en `search-match`;
   - una ruta llena tampoco aparece.

## SIM-011: búsqueda lenta (alto). Meta: p95 < 2 s con 60 rutas candidatas
**Causa:** `SpatialMatchingService::findMatchesForPassenger` llama **en serie** a ai-route-service (`/optimize/match`) **por cada candidata** (~0,5 s cada una), sin límite ni caché.

**Cambios**, en este orden y sin cambiar el contrato de la respuesta:
1. **Menos candidatas:** después del filtro de SIM-012, limita las candidatas a las **20 más cercanas** al punto del pasajero, ordenadas por distancia PostGIS (`ORDER BY ST_Distance … LIMIT 20`, usando el índice GiST). Deja el número en una config `MATCH_MAX_CANDIDATES`, con 20 por defecto.
2. **Modalidad 1 sin IA:** las candidatas que quedan a ≤ 500 m del corredor (modalidad 1) **no** llaman a la IA. Verifica que hoy sea así; si no, corrígelo.
3. **IA en paralelo:** para las candidatas de modalidad 2, usa `Http::pool` de Laravel en lugar de llamadas en serie, con un timeout por llamada de **2 s**. Una candidata cuya evaluación falle o venza el timeout se **descarta**; no rompe la búsqueda.
4. **Caché corta:** cachea en Redis el resultado de la evaluación de desvío por `(route_id, pickup redondeado a 3 decimales)` durante **60 s**, con la llave `uniwheels:detour:{route_id}:{lat}:{lng}`.
5. **Medición:** registra con `Log::info` la duración total de `search-match` y el número de candidatas. Sin datos personales.

**Tests:**
- con 30 rutas candidatas y `Http::fake` de la IA, el servicio hace **como máximo 20** llamadas a la IA;
- una respuesta lenta o fallida de la IA no rompe la búsqueda;
- la segunda búsqueda idéntica usa la caché (0 llamadas nuevas).

**Medición en el PR:** si la sesión puede levantar el sistema, corre `tools/simulacion` (`python -m simulacion run --escenario 12`, ver `tools/simulacion/README.md`) y reporta p50/p95 de `search-match` antes y después. Si no puede, dilo en el PR. **No inventes cifras.**

## SIM-013: "Eliminar cuenta" (alto, Ley 1581)
1. `packages/shared/src/api.js` (≈ l. 360): `deleteAccount` debe llamar a `DELETE /auth/account`, el endpoint que existe. Verifica en `services/auth-service/routes/api.php` qué parámetros espera y qué hace exactamente.
2. `mobile/src/app/(tabs)/profile.tsx` (≈ l. 53):
   - **Solo** si el backend responde éxito, haz `logout()` y muestra "Tu cuenta fue eliminada.".
   - Si falla, **no** cierres la sesión: muestra el error.
   - Quita el `logout()` del `finally`.
3. Verifica que `deleteAccount` en el backend realmente elimine o anonimice los datos personales, como promete la política: "eliminar tus datos". Si solo pone `is_active = false`, **no lo cambies en este PR**: documéntalo en el PR como hallazgo para una tarea aparte.

## SIM-014: el gateway no enruta `/driver/history` ni `/ratings` (alto)
1. Identifica a qué servicio pertenece cada ruta (grep en `services/*/routes/api.php`) y agrégala al bloque `location` correspondiente de `gateway/api-locations.conf`, siguiendo el patrón de las regex existentes.
2. Revisa con grep **todas** las rutas que usa `packages/shared/src/api.js` y compáralas con lo que enruta el gateway. Agrega cualquier otra que falte, y lista en el PR las que agregaste.
3. Valida la sintaxis:
   - si la sesión tiene Docker o Podman: `docker run --rm -v $PWD/gateway:/g:ro nginx:alpine sh -c "cp /g/nginx.prod.conf /etc/nginx/nginx.conf; cp /g/api-locations.conf /etc/nginx/; mkdir -p /etc/nginx/certs; apk add -q openssl; openssl req -x509 -newkey rsa:2048 -nodes -subj /CN=t -keyout /etc/nginx/certs/origin.key -out /etc/nginx/certs/origin.crt -days 1; nginx -t"`. Agrega `--add-host` para cada upstream;
   - si no puede, dilo en el PR.
4. Si existe `tools/simulacion/evidencia/gateway_probe.sh`, córrelo y adjunta la salida.

## Además, en `api.js` (relacionado con SIM-014 y SIM-022)
- `getDriverHistory` y `submitRating`: hoy, ante un error, devuelven `[]` o `{ success: true }` y ocultan el fallo. Hazlas **lanzar el error** como el resto de `api.js`, y ajusta sus llamadas en la app para que muestren un mensaje. **Solo estas dos funciones**; el resto de SIM-022 va en la B3.

## Criterios de terminado
1. CI en verde, con el link en el PR.
2. Tabla en el PR: SIM, commit y test.
3. Mediciones de rendimiento reales o "no medido" con el motivo.
4. **Nota de despliegue:** route-matching (config `MATCH_MAX_CANDIDATES`), gateway (reinicio) y app (recargar el bundle).
5. Si algo falla dos veces por la misma causa, detente y documéntalo en el PR.
