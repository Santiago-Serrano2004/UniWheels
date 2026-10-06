# Microservicio de Viajes y Telemetría GPS (trip-service)

Microservicio en Laravel 13 responsable de la orquestación del ciclo de vida de los viajes compartidos, máquina de estados, aplicación de políticas de cancelación y registro de telemetría.

---

## 1. Responsabilidades
* Máquina de estados del viaje: `confirmado` -> `en_camino_recogida` -> `en_punto_encuentro` -> `pasajero_a_bordo` -> `en_curso` -> `completado`.
* La plataforma no procesa pagos: `total_fare_cop` es el aporte acordado, se paga directamente entre usuarios y debe ser igual al `base_contribution_cop` de la ruta.
* Auditoría de cancelaciones con detección de penalizaciones (menos de 2 min para pasajeros o menos de 15 min para conductores).
* Política de cancelaciones tardías: 3 cancelaciones tardías (`had_penalty`) en 30 días suspenden la cuenta 30 días, mediante `POST /api/v1/internal/users/{id}/late-cancellation-suspension` de auth-service. Configurable con `LATE_CANCEL_THRESHOLD`, `LATE_CANCEL_WINDOW_DAYS` y `LATE_CANCEL_SUSPENSION_DAYS` (3, 30 y 30 por defecto) y `AUTH_SERVICE_URL`.
* Recepción y registro de muestras de telemetría GPS cada 5 segundos.
* Generación de resúmenes post-viaje comprimidos para conservación eficiente de datos.
