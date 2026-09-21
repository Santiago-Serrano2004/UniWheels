# Plan de cobertura de riesgos — v2 (Claude, incorpora crítica de agy y Codex)

v1 recibió: agy → "Aprobado con cambios menores" (6 correcciones). Codex → "Necesita revisión
mayor" (9 correcciones, más profundas). Codex agotó su cuota de OpenAI (disponible de nuevo el
2026-10-21) y no podrá revisar esta v2 — su crítica ya entregada
(`plan-cobertura-critica-codex.md`) se trata como su voto final e incorporada aquí en su
totalidad. Esta v2 se envía a agy para reconfirmación; con esa reconfirmación se considera
consenso suficiente para dividir implementación (Claude + agy; Codex queda excluido de la
implementación de este ciclo por indisponibilidad, no por desacuerdo con el plan).

Cambio estructural principal (pedido explícito de Codex, punto 9 de su crítica): se abandona el
orden lineal de v1 y se reemplaza por un **modelo de puertas (gates)** — no se puede abrir el
piloto a un desconocido hasta pasar la puerta anterior completa.

---

## GATE 0 — Protocolo de liquidación (nuevo, faltaba en v1; señalado por agy Y Codex)

**0.1 [DOC + HUMANO]** Redactar el "Protocolo de Liquidación y Disputas" cubriendo explícitamente:
cobro fallido/duplicado, cancelación, comisión pendiente, devolución, saldo negativo, plazo de
resolución, canal de disputa y responsable humano de cada caso. Depende de la decisión 1.1 (no
puede redactarse en el vacío) y de revisión legal antes de publicarse. Un agente puede producir el
borrador completo; Santiago + revisión legal lo aprueban.

---

## GATE 1 — Naturaleza del dinero, legalidad de la tarifa y conciliación mínima (RC-1, RC-2)

**1.1 [HUMANO]** Decisión de producto y legal, por cada flujo de dinero por separado (no una sola
etiqueta "retirable sí/no" — Codex mostró que eso no alcanza):
- Recarga de comisión (Wompi → billetera del conductor, referencias `WR-`).
- Pago de tarifa del viaje con tarjeta (Wompi → crédito automático a la billetera del conductor al
  completar el viaje, hoy en `TripLifecycleController.php`).
- Pago de tarifa en efectivo/Nequi/Daviplata P2P (fuera de la plataforma).
- Para cada uno: naturaleza jurídica, usos permitidos, titularidad, reversos y devolución.

**Recomendación explícita de este plan (no una lista abierta de opciones — una postura)**: para el
piloto, **deshabilitar el pago de tarifa del viaje con tarjeta**. El 100% de los viajes se cobra
P2P (efectivo/Nequi/Daviplata) directamente entre pasajero y conductor; Wompi en la app se usa
única y exclusivamente para que el conductor recargue saldo de comisión (`WR-`). Esto cierra por
completo la contradicción que agy identificó (saldo de "ganancia" por tarjeta que nunca sería
retirable) sin necesidad de payout bancario, y reduce el alcance de 1.4/1.5 a un solo flujo de
dinero real (la recarga), no tres. Santiago decide si acepta esta recomendación o define otra.

**1.2 [DOC]** Nota legal en español simple (insumo para abogado/jurídica UNAB, no un dictamen)
sobre billetera de circuito cerrado vs. captación, y sobre la distinción reparto de
costos/transporte remunerado (cubre RC-1 y RC-2 a la vez). Debe entregarse ANTES de 1.1, no
después (fix de secuencia pedido por agy y Codex).

**1.3 [MIXTO]** Aplicar la decisión de 1.1 en: `WalletView.jsx` (leyenda de la naturaleza del
saldo), pantalla de recarga, historial de transacciones, T&C, y reglas de backend — no solo un
texto en la UI (Codex: "una sola leyenda no resuelve qué se puede consumir o devolver").

**1.4 [MIXTO, redefinido — v1 lo tenía mal especificado según Codex]** Conciliación mínima antes
del primer cobro real (no en el backlog post-piloto):
- Parte de decisión: responsable humano, frecuencia (diaria), umbral de discrepancia que dispara
  revisión manual.
- Parte de código: persistir el evento/payload completo de cada webhook de Wompi (hoy solo se actúa
  sobre `APPROVED`, los demás estados no quedan registrados), usar el ID externo de Wompi como
  clave de idempotencia real (hoy `reference_id` no es único en la migración de
  `user_wallets_and_transactions`, lo que permite duplicar un crédito en un reintento), y comparar
  contra el reporte/API autorizado de Wompi, no solo contra la tabla interna. Con la recomendación
  de 1.1 (deshabilitar tarjeta para tarifas), el alcance de esto se reduce a conciliar solo
  recargas `WR-`, mucho más simple que conciliar además pagos de viaje `TP-`.

**1.5 [MIXTO]** Manejo de contracargos: primero política y responsable (parte de 0.1), luego el
asiento de reversa idempotente en el ledger, bloqueo/notificación al usuario afectado, y prueba de
reintento. Solo aplica si se mantiene algún cobro por tarjeta (con la recomendación de 1.1, el
único cobro por tarjeta es la recarga de comisión, de menor riesgo que un contracargo sobre una
tarifa de viaje ya pagada al conductor).

**2.1 [HUMANO]** Decisión legal/de producto sobre los límites operativos del piloto: elegibilidad,
cómo se calcula y publica la tarifa, métodos de pago permitidos, comisión, número de conductores,
publicidad, territorio. Los T&C (2.2) documentan esta decisión, no la reemplazan (Codex: "los T&C
no cambian por sí mismos la clasificación material").

**2.2 [DOC]** Borrador de Términos y Condiciones reflejando 1.1 y 2.1, para revisión legal.

---

## GATE 2 — Aval institucional UNAB y protocolo de incidentes real (RC-3)

**3.1 [DOC]** Borrador de "Protocolo de Respuesta a Incidentes" — ESTE va primero, como insumo
para la conversación (fix de secuencia: v1 tenía la conversación antes del borrador, ambos
críticos lo señalaron).

**3.2 [HUMANO]** Conversación de Santiago con Bienestar/Jurídica UNAB usando 3.1 como base:
solicitar aval formal y acordar canal, disponibilidad, SLA y responsables reales del protocolo de
incidentes.

**3.3 [MIXTO, redefinido]** Integración real del despacho de SOS, no solo "cambiar un contacto"
(Codex: el SOS actual abre llamadas 123/125 y WhatsApp sin destinatario institucional fijo, con
datos por defecto — cambiar un número no genera recepción, acuse, escalamiento ni custodia de
evidencia). Dos caminos según lo que confirme 3.2:
- Si Bienestar/Seguridad UNAB acepta ser el canal receptor: el código debe enviar una alerta
  trazable (registro, timestamp, ubicación) y mostrar confirmación de entrega/acuse al usuario.
- Si NO hay canal institucional (solo 123 y contacto personal): la UI debe decirlo explícitamente,
  sin dar a entender que hay soporte institucional de UniWheels/UNAB detrás del botón.

---

## GATE 3 — Infraestructura verificada (RC-4)

**4.1 [MIXTO]** Backup externo a Cloudflare R2: parte de código (ajustar `backup-postgres.sh` para
subir a R2), parte de operación humana (crear bucket y token separados del bucket de documentos
vehiculares — Codex señala que reusar ese bucket mezclaría permisos, cifrado y retención de dos
cosas distintas).

**4.2 [MIXTO]** TLS "Full": parte de código (descomentar bloque 443 en `nginx.prod.conf`), parte de
operación humana (generar certificado de origen en el dashboard de Cloudflare, gestionar el
secreto en la VM).

**4.3 [MIXTO]** Prueba de restauración real: requiere un entorno aislado, datos de prueba, y un
criterio de aceptación explícito ("se considera exitosa si..."), no solo ejecutar el script una
vez.

---

## GATE 4 — Límites de producto aplicados (RC-8, RC-9)

**8.1 [HUMANO, primero]** Decisión de política: ¿el piloto se restringe a mayores de 18 años, o se
construye un flujo de consentimiento parental completo? Recomendación de este plan: restringir a
18+ para el piloto (mucho más simple, cierra el riesgo legal por completo) y dejar el
consentimiento parental como trabajo de una fase institucional posterior si se decide admitir
primíparos de 16-17 años más adelante.

**8.2 [MIXTO, alcance real corregido por Codex — no es un solo archivo]** Si se elige restringir a
18+: agregar columna de fecha de nacimiento en la migración de `users`, validación en
`RegisterRequest`, persistencia en `AuthController`, verificación en el flujo de registro tanto web
(`RegisterForm.jsx`) como móvil (que hoy duplica el flujo), y registro auditable de que la
restricción se aplicó (versión de política + fecha). No capturar fecha de nacimiento si finalmente
no se usa para nada (principio de minimización de datos que Codex señaló).

**9.1 [DOC]** Inventario explícito de qué atributos usa el motor de matching
(`affinity_safety_service.py`) — género, facultad, reputación, contactos — con origen, valor por
defecto, finalidad, si es opt-in, y visibilidad para el usuario. Documenta lo que ya existe, no
cambia código.

**9.2 [MIXTO, no antes de 9.1]** Decidir qué variables/umbrales son aceptables usar en el ranking
(no solo en el filtro duro de "solo mujeres", que es distinto y ya justificado por seguridad).
Solo después, instrumentar eventos mínimos y agregados (candidato elegible/excluido, oferta,
aceptación, cancelación, tiempo de espera) para poder medir disparidad más adelante — hoy no existe
ningún dato para calcular esto, instrumentarlo es prerequisito de medir, no la medición en sí.

---

## GATE 5 — Oferta y soporte operativo confirmados (RC-5, RC-6, RC-7)

**5.1 [DOC]** Plan de lanzamiento: 2-3 corredores concretos, franjas horarias, tácticas de flota
semilla.

**5.2 [HUMANO]** Ejecución real de reclutamiento de flota semilla — no automatizable.

**6.1 [HUMANO, no solo documentación — fix de Codex]** Decisión explícita: ¿la app móvil se
distribuye a usuarios reales en este piloto, o se mantiene solo como desarrollo interno? Un
`README` no impide que alguien la use en producción. Si se decide NO distribuir: no requiere más
acción que no publicarla. Si se decide SÍ distribuirla en algún alcance limitado: requiere primero
6.2 (push nativo + protocolo SOS acordado en Gate 2 integrado en móvil, no solo "reusar lógica de
la SPA").

**6.2 [CODE, backlog — condicionado a la decisión de 6.1]** Tracking GPS real y SOS con viaje
activo en móvil, con push nativo (FCM/APNs), no antes de que 6.1 decida distribuir la app.

**7.1 [DOC]** Runbook de continuidad: cómo levantar el proyecto desde cero, dónde están las
credenciales, qué se necesita para que otra persona pueda mantenerlo.

**7.2 [HUMANO]** Decidir a quién se le da acceso de respaldo.

---

## GATE 6 — Piloto web con desconocidos (solo después de pasar los Gates 0-5)

Ningún desconocido (fuera del círculo de máxima confianza del tesista) participa del piloto, ni se
acepta una sola recarga real, hasta que los Gates 0 a 5 estén completos. Dentro de este límite, el
piloto opera solo en la modalidad web (SPA), con el móvil excluido salvo que 6.1 decida
explícitamente distribuirlo.

---

## Explícitamente fuera de este plan (backlog post-piloto, no bloqueante)

- Payout bancario real / dispersión automatizada a conductores.
- Paridad móvil completa más allá de lo que Gate 5/6.2 exija si se decide distribuir la app.
- Refactor de modularidad de frontend (spec aparte).
- Features nuevas de crecimiento (paraderos oficiales, SheWheels, tarifa solidaria, etc.).
- Registro de marca/DNDA/estructura societaria (categoría 13 — prematuro antes de validar el
  modelo).
