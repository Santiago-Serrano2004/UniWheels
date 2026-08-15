# Microservicio de Viajes y Telemetría GPS (trip-service)

Microservicio en Laravel 13 responsable de la orquestación del ciclo de vida de los viajes compartidos, máquina de estados, aplicación de políticas de cancelación y registro de telemetría.

---

## 1. Responsabilidades
* Máquina de estados del viaje: `confirmado` -> `en_camino_recogida` -> `en_punto_encuentro` -> `pasajero_a_bordo` -> `en_curso` -> `completado`.
* Trazabilidad de comisiones (12%-15%) e integración con la billetera prepago.
* Auditoría de cancelaciones con detección de penalizaciones (menos de 2 min para pasajeros o menos de 15 min para conductores).
* Recepción y registro de muestras de telemetría GPS cada 5 segundos.
* Generación de resúmenes post-viaje comprimidos para conservación eficiente de datos.
