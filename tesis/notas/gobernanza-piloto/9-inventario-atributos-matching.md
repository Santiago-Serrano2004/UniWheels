# Inventario de atributos del motor de matching — Gate 4, tarea 9.1

Basado en lectura directa de `services/ai-route-service/app/services/affinity_safety_service.py`.
Documenta lo que el sistema YA hace, no propone cambios.

| Atributo | Origen | Valor por defecto | Finalidad | ¿Es opt-in? | ¿Visible al usuario? |
|---|---|---|---|---|---|
| Género (conductor y pasajero) | Perfil del usuario, capturado en registro | Ninguno (dato obligatorio del perfil) | Único uso: hacer cumplir el modo "Solo Mujeres" cuando alguna de las partes lo solicita (`check_women_only_compliance`) — es un filtro de seguridad estricto (bloquea el match, no solo lo pondera), no un factor de puntuación general | El modo "Solo Mujeres" es opt-in (el usuario lo activa por viaje); el dato de género en sí no es opt-in, es parte del perfil | Sí, el resultado ("Modo Exclusivo Solo Mujeres") se muestra como etiqueta en la tarjeta del viaje |
| Facultad/programa académico | Perfil del usuario | Ninguno | Bonificación de puntaje de afinidad si coincide con la del otro usuario (`WEIGHT_FACULTY_MATCH = 2.0`) — no es un filtro duro, solo suma puntos y genera una etiqueta visible | No es opt-in explícito; se infiere del perfil académico ya registrado | Sí, se muestra como etiqueta ("Misma Facultad") |
| Calificación/reputación (rating) | Historial de calificaciones bidireccionales | 5.0 si no hay historial (`getattr(..., 5.0)`) | Bonificación de puntaje si ambas partes tienen ≥4.8 estrellas (`WEIGHT_RATING = 1.2`) | No aplica (es resultado del uso de la plataforma, no una elección) | Sí, etiqueta "Usuarios con Reputación Elite" |
| Contactos en común | Conteo de contactos mutuos en la comunidad UNAB | 0 si no hay dato | Bonificación de puntaje proporcional al número de contactos en común (`WEIGHT_MUTUAL_FRIENDS = 0.8`, tope de 3.0 puntos) | No es opt-in explícito | Sí, etiqueta con el número de contactos |

## Cómo se combinan (mecánica exacta del código)

El puntaje de afinidad (`affinity_score`) es un número entre 5.0 y 10.0: empieza en 5.0 y suma
los puntos de los factores anteriores que apliquen, con un tope de 10.0. Este puntaje se traduce
además en un "descuento de afinidad" (`affinity_bonus_discount`) proporcional. El modo "Solo
Mujeres" es la única regla que puede **excluir** un match por completo (`check_women_only_compliance`
devuelve `False` y bloquea, no solo resta puntos); todo lo demás (facultad, rating, contactos)
solo **ordena/pondera** entre matches ya elegibles, nunca excluye a nadie.

## Lo que NO existe todavía (necesario para poder medir disparidad más adelante, tarea 9.2)

- No hay registro de qué candidatos fueron excluidos y por qué en cada búsqueda.
- No hay registro de la posición final del ranking mostrada a cada usuario.
- No hay vínculo entre el ranking mostrado y si el usuario efectivamente aceptó ese match.

Sin estos tres registros, no es posible calcular si algún grupo (por ejemplo, alguien sin
contactos en común o de una facultad minoritaria) sistemáticamente recibe peores tiempos de
espera — la tarea 9.2 del plan de cobertura depende de instrumentar esto primero.
