"""
Reentrenamiento por lotes del modelo XGBoost de ETA con datos reales de viajes
completados (trip-service). Job de lote manual/cron — no se ejecuta en cada
arranque del servicio ni se dispara por tráfico normal.

Uso: python -m scripts.retrain_eta_model   (desde la raíz de ai-route-service)

Flujo:
1. Descarga los viajes completados reales (distancia y duración reales) desde
   trip-service vía el endpoint interno servicio-a-servicio.
2. Si el volumen todavía no supera MIN_REAL_TRIPS, no hace nada — un modelo
   entrenado con pocos registros reales generaliza peor que el sintético actual.
3. Convierte los registros reales al mismo shape de 8 features que el dataset
   sintético (tráfico/lluvia/desnivel se fijan neutros: no se observan hoy en
   trip-service) y los combina con una muestra sintética para conservar
   variedad en esas dimensiones.
4. Entrena un modelo candidato y compara su MAE contra el modelo vigente sobre
   el mismo set de validación. Solo reemplaza el modelo persistido si el
   candidato es mejor.
"""
import sys
import time
from datetime import datetime

import httpx
import jwt
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.services.xgboost_eta_predictor import eta_predictor

MIN_REAL_TRIPS = 300  # Piso mínimo antes de considerar viable un modelo real.


def _service_token() -> str:
    ahora = int(time.time())
    return jwt.encode(
        {
            "iss": "uniwheels-ai-route-service",
            "sub": "ai-route-service",
            "type": "service",
            "jti": f"retrain-{ahora}",
            "iat": ahora,
            "exp": ahora + 60,
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def fetch_real_trips() -> list[dict]:
    registros: list[dict] = []
    pagina = 1

    with httpx.Client(timeout=10.0) as client:
        while True:
            resp = client.get(
                f"{settings.TRIP_SERVICE_URL}/api/v1/trips/training-data/completed",
                headers={"Authorization": f"Bearer {_service_token()}"},
                params={"page": pagina, "per_page": 500},
            )
            resp.raise_for_status()
            body = resp.json()
            registros.extend(body["data"])
            if pagina >= body["meta"]["last_page"]:
                break
            pagina += 1

    return registros


def real_records_to_features(registros: list[dict]) -> tuple[np.ndarray, np.ndarray]:
    """
    Traduce los viajes reales al shape de 8 columnas del dataset sintético.
    num_stops/traffic_kappa/is_raining/elevation_gain_m no se observan hoy en
    trip-service, así que quedan en valores neutros — el modelo sigue
    aprendiendo la relación real distancia/hora/día -> duración; simplemente
    no gana señal nueva en esas 3 dimensiones todavía.
    """
    X, y = [], []
    for r in registros:
        if not r.get("scheduled_pickup_time") or r.get("distance_km") is None:
            continue

        dt = datetime.fromisoformat(r["scheduled_pickup_time"].replace("Z", "+00:00"))
        hour = dt.hour + dt.minute / 60.0
        day = dt.weekday()
        is_peak = 1.0 if (
            day < 5 and ((6.5 <= hour <= 8.5) or (11.5 <= hour <= 13.5) or (17.2 <= hour <= 19.5))
        ) else 0.0

        X.append([r["distance_km"], hour, day, is_peak, 1.15, 0, 0.0, 35.0])
        y.append(r["actual_duration_minutes"])

    return np.array(X), np.array(y)


def main() -> int:
    print(f"Consultando viajes completados reales en {settings.TRIP_SERVICE_URL}...")
    try:
        registros = fetch_real_trips()
    except (httpx.HTTPError, httpx.HTTPStatusError) as e:
        print(f"No se pudo consultar trip-service: {e}")
        return 1

    print(f"Total de viajes completados con resumen real: {len(registros)}")

    if len(registros) < MIN_REAL_TRIPS:
        print(
            f"Aún no hay suficiente volumen real ({len(registros)}/{MIN_REAL_TRIPS}). "
            "No se reentrena — el modelo sintético actual se mantiene sin cambios."
        )
        return 0

    X_real, y_real = real_records_to_features(registros)
    if len(X_real) < MIN_REAL_TRIPS:
        print("Insuficientes registros reales utilizables tras filtrar datos incompletos.")
        return 0

    # Muestra sintética para conservar variedad en las dimensiones que los
    # viajes reales todavía no observan (tráfico, lluvia, desnivel).
    X_synth, y_synth = eta_predictor._generate_synthetic_calibration_dataset(n_samples=6000)

    X_full = np.vstack([X_real, X_synth])
    y_full = np.concatenate([y_real, y_synth])

    X_train, X_val, y_train, y_val = train_test_split(X_full, y_full, test_size=0.2, random_state=42)

    candidato = xgb.XGBRegressor(
        n_estimators=280,
        max_depth=6,
        learning_rate=0.032,
        subsample=0.90,
        colsample_bytree=0.90,
        gamma=0.02,
        reg_alpha=0.05,
        reg_lambda=0.8,
        random_state=42,
        n_jobs=-1,
    )
    candidato.fit(X_train, y_train)
    pred_candidato = candidato.predict(X_val)
    mae_candidato = mean_absolute_error(y_val, pred_candidato)

    pred_actual = eta_predictor.model.predict(X_val)
    mae_actual = mean_absolute_error(y_val, pred_actual)

    print(f"MAE modelo actual (sobre este set de validación):    {mae_actual:.3f} min")
    print(f"MAE modelo candidato (con {len(X_real)} viajes reales): {mae_candidato:.3f} min")

    if mae_candidato < mae_actual:
        eta_predictor.model = candidato
        eta_predictor.metrics = {
            "mean_r2_score": float(r2_score(y_val, pred_candidato)),
            "mean_mae_minutes": float(mae_candidato),
            "mean_rmse_minutes": float(np.sqrt(mean_squared_error(y_val, pred_candidato))),
            "samples_trained": int(len(X_full)),
            "real_samples": int(len(X_real)),
            "retrained_at": datetime.now().isoformat(),
        }
        eta_predictor._save_model()
        print("Modelo candidato mejor que el actual — reemplazado y persistido en disco.")
    else:
        print("El modelo candidato no mejoró al actual — se conserva el modelo vigente sin cambios.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
