from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List


class Settings(BaseSettings):
    PROJECT_NAME: str = "UniWheels AI Route Optimization Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8006
    HOST: str = "0.0.0.0"

    # Integraciones Externas
    TOMTOM_API_KEY: str = ""
    OSRM_BASE_URL: str = "http://localhost:5000"
    TRIP_SERVICE_URL: str = "http://127.0.0.1:8004"

    # JWT compartido con los microservicios Laravel (auth-service es el emisor).
    # Este servicio solo debe ser invocado por otros servicios del backend, nunca
    # directamente por la app cliente — se exige un token con claim type=service.
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"

    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None

    # Orígenes permitidos para CORS (gateway/frontend). Nunca "*" combinado con
    # allow_credentials=True.
    CORS_ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:80"]

    # Parámetros del Algoritmo ALNS (DARP-TW)
    ALNS_MAX_ITERATIONS: int = 250
    ALNS_MAX_DETOUR_MINUTES: float = 12.0
    ALNS_ALPHA_WEIGHT_DRIVER_TIME: float = 1.0
    ALNS_BETA_WEIGHT_PASSENGER_WAIT: float = 0.8
    ALNS_GAMMA_WEIGHT_EMISSIONS: float = 0.5

    # Coordenadas Clave UNAB Bucaramanga
    CAMPUS_EL_JARDIN_LAT: float = 7.1193
    CAMPUS_EL_JARDIN_LNG: float = -73.1042

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
