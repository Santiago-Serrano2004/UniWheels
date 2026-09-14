# Dockerfile de producción para ai-route-service (FastAPI + XGBoost + scikit-learn).
FROM docker.io/library/python:3.12-slim

WORKDIR /app

# numpy/scikit-learn/xgboost necesitan estas librerías nativas para compilar/cargar
# sus ruedas — sin esto el `pip install` falla o el import revienta en runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8006

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8006"]
