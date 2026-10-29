# UniWheels — carpooling universitario UNAB

Monorepo. Plataforma de movilidad compartida. Ver `README.md` y `./uniwheels help`.

## Mapa

| Ruta | Qué es | Stack |
|---|---|---|
| `services/auth-service` (8001) | Único emisor de JWT de usuario | Laravel 13, PHP 8.3, Sanctum, spatie/permission |
| `services/vehicle-service` (8002) | Vehículos | Laravel 13 |
| `services/route-matching-service` (8003) | Emparejamiento de rutas | Laravel 13 + **PostgreSQL/PostGIS real** (ST_DWithin, GiST) |
| `services/trip-service` (8004) | Viajes | Laravel 13 |
| `services/notification-service` | Notificaciones | Laravel 13 |
| `services/ai-route-service` | ETA / optimización de ruta | Python FastAPI, scikit-learn, xgboost |
| `frontend/` | SPA web, **congelado** (no se agregan funciones; la app móvil es el producto) | React 19, Vite 8, Tailwind 4, react-leaflet, zustand |
| `mobile/` | App | Expo SDK 57, React Native, TypeScript, NativeWind |
| `admin/` | Panel de Bienestar | React, Vite |
| `landing/` | Sitio público | React, Vite |
| `gateway/` | Reverse proxy | solo nginx.conf |
| `docker/` | Orquestación local | docker-compose, OSRM |
| `./uniwheels` | CLI maestro (levanta/para servicios, logs, tests) | bash |

## Comandos por área

- **Servicio Laravel**: `cd services/<svc>` → `composer test` (corre `php artisan test`), `./vendor/bin/pest`, `./vendor/bin/pint` (formato), `php artisan ...`.
- **ai-route-service**: `cd services/ai-route-service` → `source .venv/bin/activate` → `pytest`. Reentrenar: `python scripts/retrain_eta_model.py`.
- **frontend**: `cd frontend` → `npm test` (vitest), `npm run lint` (oxlint), `npm run test:e2e` (playwright), `npm run dev`.
- **mobile**: `cd mobile` → `npm run lint`, `npm start`. **Lee `mobile/AGENTS.md` antes de tocar nada**: Expo SDK 57 está fijado a propósito, no subir de versión.
- **Todo junto**: `./uniwheels` (ver subcomandos con `./uniwheels help`).

## Convenciones

- **Cross-service**: los servicios validan JWT emitidos por auth-service con un secreto compartido. Cualquier cambio en el payload del token o en contratos entre servicios obliga a actualizar todos los consumidores y el `.github/workflows/ci.yml`.
- **PHP**: PSR-12 + Pint. Validación en Form Requests, no en controladores. Lógica en Actions/Services, controladores finos. Tests con Pest.
- **route-matching-service**: nunca asumas SQLite; depende de funciones PostGIS. Sus tests en CI usan `postgis/postgis:16-3.4`.
- **Python**: FastAPI + pydantic v2, lógica en `app/services/`, tests con pytest-asyncio.
- **frontend**: componentes función, estado con zustand, HTTP con axios, mapas con react-leaflet. Sin CSS-in-JS: Tailwind 4.
- **No editar**: `vendor/`, `node_modules/`, `.venv/`, `dist/`, `docker/osrm-data/`.
- **Nunca** commitees `.env` (solo `.env.example`).
- Skills de dominio disponibles en `../.agents/skills/` (laravel-microservices, postgis-spatial, react-leaflet-frontend, ai-route-optimization, podman-devops, clean-code-refactoring).

## Tesis / proyecto de grado

- Anteproyecto PG-I (UNAB). Documento canónico: el **Google Doc** (ver `tesis/README.md`). Solo Santiago escribe; director y asesor comentan dentro del Doc. **No se edita desde aquí.**
- `tesis/scripts/snapshot.py`: exporta el Doc (PDF + MD) a `tesis/export/` y publica nueva versión del PDF en Drive. A demanda, no cron.
- `tesis/guias/rubrica.md`: rúbrica institucional (estructura, límites de palabra, contenido mínimo por apartado).
- **`/tesis-auditar [apartado]`**: auditoría a demanda — rúbrica + normas de redacción (web) + coherencia con el código + APA 7 + verificación de cada cita (agente `tesis-citas`). Salidas en `tesis/auditoria/<fecha>/`. No escribe en el Doc; Santiago pega los cambios como Sugerencias.
- Agentes: `tesis` (redacción/crítica), `tesis-citas` (verificación de referencias).
- Nada de "humanizar" para evadir detección de IA.

## Trabajo actual

Rama `pivote/b2b-sin-pagos`: pivote a B2B sin pagos (ver `specs/pivote-b2b-sin-pagos.md`).
