# ai-route-service

Microservicio de ETA y optimización de ruta. Python + FastAPI. Consumido por route-matching-service y trip-service vía HTTP.

## Comandos
- Entorno: `source .venv/bin/activate` (ya existe `.venv/`).
- Tests: `pytest` (usa pytest-asyncio).
- Reentrenar modelo ETA: `python scripts/retrain_eta_model.py`.
- Servir local: `PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8006` (o `./uniwheels start` desde la raíz).

## Estructura
- `app/main.py` — app FastAPI y routers.
- `app/api/` — endpoints. `app/schemas/` — modelos pydantic v2 de request/response.
- `app/services/` — lógica (predicción ETA, features). `app/models/` — carga/persistencia del modelo.
- `app/core/` — config (pydantic-settings), auth JWT.

## Convenciones
- pydantic v2. Nada de lógica en los handlers: delega a `app/services/`.
- El modelo (sklearn / xgboost) se carga una vez al arranque, no por request.
- Valida el JWT con el mismo secreto compartido que los servicios Laravel.
- No toques `.venv/`. Fija versiones en `requirements.txt` con `~=`.
- Tests deterministas: fija `random_state`; no dependas de datos externos en CI.
