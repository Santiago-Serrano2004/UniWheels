from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import optimization

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservicio de Inteligencia Artificial para Ruteo Inteligente, TomTom Live Traffic, Predicción de ETA con XGBoost y Algoritmo ALNS (DARP-TW) para UniWheels.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de Rutas API v1
app.include_router(optimization.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de comprobación de salud del microservicio de IA."""
    return {
        "status": "healthy",
        "service": "ai-route-service",
        "version": settings.VERSION,
        "engine": "FastAPI + OSRM + TomTom + XGBoost + ALNS",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
