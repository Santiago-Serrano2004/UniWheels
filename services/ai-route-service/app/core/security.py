import jwt
import redis
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)

_redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD or None,
    decode_responses=True,
    socket_connect_timeout=1.5,
    socket_timeout=1.5,
)


def require_service_caller(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> dict:
    """
    Verifica que la petición traiga un JWT válido emitido con el secreto
    compartido del backend y con claim type=service — este microservicio de
    optimización solo debe ser invocado por otros servicios internos (route-
    matching-service, trip-service), nunca directamente por la app cliente.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autenticado.")

    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    if claims.get("type") != "service":
        raise HTTPException(
            status_code=403,
            detail="Este endpoint solo puede ser invocado por servicios internos del backend.",
        )

    jti = claims.get("jti")
    try:
        if jti and _redis_client.exists(f"jwt:blocklist:{jti}"):
            raise HTTPException(status_code=401, detail="Token revocado.")
    except redis.RedisError:
        # Si Redis no está disponible, no se bloquea el servicio por un problema
        # de infraestructura ajeno a la validez del token en sí (fail-open acotado
        # solo a la revocación, nunca a la verificación de firma/expiración).
        pass

    return claims
