from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "UniWheels AI Route Optimization Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8006
    HOST: str = "0.0.0.0"

    # Integraciones Externas
    TOMTOM_API_KEY: str = ""
    OSRM_BASE_URL: str = "http://localhost:5000"

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
