# Protocolo de Respuesta a Incidentes — Borrador (Gate 2, tarea 3.1)

**Este es el insumo que Santiago lleva a la conversación con Bienestar Universitario/Jurídica
UNAB (tarea 3.2), no el protocolo final.** Las casillas marcadas `[CONFIRMAR CON UNAB]` son
exactamente lo que esa conversación debe resolver.

## Tipos de incidente cubiertos

1. Accidente de tránsito durante un viaje activo.
2. Acoso, comportamiento inapropiado o situación de inseguridad percibida.
3. Robo o pérdida de pertenencias.
4. Disputa económica no resuelta entre pasajero y conductor (ver también Protocolo de
   Liquidación para el componente financiero).
5. Activación del botón SOS sin que se haya materializado ninguno de los anteriores (falsa
   alarma o incertidumbre del usuario).

## Qué hace hoy el botón SOS (estado actual, sin protocolo institucional)

El botón SOS en la app permite: llamar a la línea de emergencias (123), abrir WhatsApp, y
compartir la ubicación GPS del usuario. **No envía ninguna alerta a UniWheels ni a la UNAB
automáticamente.** Esto significa que, tal como está hoy, ningún incidente reportado por SOS
llega a ningún responsable institucional — depende enteramente de que el propio usuario contacte
a alguien.

## Lo que este protocolo necesita definir con Bienestar/Seguridad UNAB

- `[CONFIRMAR CON UNAB]` ¿Existe o puede crearse un canal de recepción institucional para
  incidentes de UniWheels (línea de Seguridad del campus, correo de guardia, WhatsApp de
  Bienestar)? Si no existe, el protocolo debe ser honesto con el usuario: "en caso de emergencia,
  llama al 123; UniWheels no tiene un canal de respuesta institucional propio todavía."
- `[CONFIRMAR CON UNAB]` Si existe un canal: ¿cuál es el tiempo de respuesta esperado? ¿Opera las
  24 horas o solo en horario de campus?
- `[CONFIRMAR CON UNAB]` ¿Quién tiene autoridad para suspender la cuenta de un conductor/pasajero
  mientras se investiga un incidente grave?
- `[CONFIRMAR CON UNAB]` ¿La UNAB acepta ser mencionada como "canal de apoyo" en la app, o prefiere
  que UniWheels opere sin mencionar a la universidad como responsable directo?

## Flujo propuesto una vez exista un canal institucional confirmado

1. Usuario presiona SOS → la app registra timestamp, ubicación, y datos del viaje activo
   (conductor/pasajero, placa, ruta).
2. Si hay canal institucional confirmado: la app envía una alerta trazable a ese canal (no solo
   abre una llamada) y muestra al usuario una confirmación de que la alerta fue enviada.
3. Si NO hay canal institucional: la app deja claro en el propio botón que la alerta va
   únicamente a servicios de emergencia públicos y/o a un contacto personal del usuario, sin dar a
   entender que hay respuesta institucional de UniWheels o la UNAB detrás.
4. Todo incidente reportado (con o sin canal institucional) debe quedar registrado en algún lugar
   accesible para Santiago, para poder darle seguimiento y para tener evidencia si se necesita
   después.

## Disputas económicas (sin lesión física)

- El tracking GPS real ya implementado en el proyecto permite verificar objetivamente si un viaje
  ocurrió y su recorrido — esto sirve como evidencia razonable para resolver la mayoría de
  disputas de "no llegó / sí llegó".
- Mientras el volumen sea bajo, Santiago arbitra directamente estos casos usando esa evidencia.

## Responsable actual

Hasta que exista un canal institucional confirmado, Santiago es el único punto de contacto para
cualquier incidente reportado sobre la plataforma. Esto debe comunicarse honestamente en la app
(ver 3.3 del plan de cobertura) — no prometer una capacidad de respuesta institucional que todavía
no existe.
