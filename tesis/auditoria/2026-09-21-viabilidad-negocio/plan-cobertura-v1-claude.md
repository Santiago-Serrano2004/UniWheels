# Plan de cobertura de riesgos y recomendaciones — v1 (Claude)

Este documento traduce los 9 riesgos críticos (RC-1 a RC-9) y las 7 recomendaciones de
`CONSOLIDADO.md` en un plan de acción concreto. Antes de dividir tareas entre agentes, este plan
debe ser auditado por agy y por Codex, y solo se ejecuta una vez los 3 estemos de acuerdo (o las
discrepancias queden resueltas explícitamente).

## Cómo está clasificada cada acción

- **[HUMANO]** — solo Santiago (o Santiago + un tercero: UNAB, un abogado) puede hacerlo. Ningún
  agente puede "implementarlo". El agente solo puede preparar el insumo (ej. un borrador de
  documento) para que Santiago lo use en esa conversación humana.
- **[DOC]** — un documento/política/spec que un agente puede redactar completo.
- **[CODE]** — un cambio de código real, implementable por Codex/agy siguiendo el patrón de specs
  ya usado en este repo (`specs/*.md`).
- **[MIXTO]** — requiere una decisión humana primero, y una vez tomada, un agente puede implementar
  la consecuencia técnica.

---

## Cobertura de RC-1 — Dinero no verificable ni retirable

1.1. **[HUMANO]** Decisión de producto: ¿el saldo de billetera es retirable a futuro o
     permanentemente de circuito cerrado (solo consumible dentro de la app)? Esto lo decide
     Santiago, posiblemente con insumo legal (ver 1.2). Ningún agente puede tomar esta decisión.
1.2. **[DOC]** Borrador de nota legal en español simple (no un dictamen, un insumo para que
     Santiago lo lleve a un abogado o al área jurídica UNAB) explicando la distinción entre
     "billetera de circuito cerrado" y "captación de dineros", con las preguntas exactas que hay
     que resolver. Basado en `audit-gemini.md` 5.13/5.15, marcando explícitamente qué es marco
     legal general y qué necesita verificación.
1.3. **[MIXTO]** Una vez tomada 1.1: actualizar la UI de la billetera (`WalletView.jsx`) para
     comunicar honestamente la naturaleza del saldo (ej. "Este saldo no es retirable como
     transferencia bancaria; se usa para pagar la comisión de tus próximos viajes").
1.4. **[CODE]** Job de conciliación diaria básica (no una pasarela de payout completa): un comando
     que compare los créditos de Wompi (webhooks recibidos) contra los créditos/débitos en el
     ledger de `WalletController` y reporte discrepancias, en vez de descubrirlas manualmente.
     Cubre `audit-codex.md` 20.1.
1.5. **[CODE]** Manejo explícito de contracargos: al menos un endpoint/proceso documentado de qué
     pasa cuando Wompi reporta un contracargo después de que el conductor ya recibió el crédito
     (`audit-codex.md` 20.3) — no requiere resolverlo automáticamente, sí requiere que no quede en
     silencio.

## Cobertura de RC-2 — Clasificación regulatoria de transporte

2.1. **[DOC]** Borrador de Términos y Condiciones que enmarquen la tarifa como reparto de costos de
     rodamiento y la comisión como pago por servicio tecnológico (no explotación de transporte),
     basado en `audit-gemini.md` 5.1/5.2/5.9, marcado explícitamente como borrador para revisión
     legal, no como texto final.
2.2. **[HUMANO]** Revisión de ese borrador por un abogado o el área jurídica UNAB antes de
     publicarlo como T&C reales de la app.

## Cobertura de RC-3 — Protocolo institucional de incidentes / aval UNAB

3.1. **[HUMANO]** Conversación de Santiago con Bienestar Universitario/Jurídica UNAB solicitando
     aval formal y definiendo el protocolo de incidentes (a quién llega el SOS, en cuánto tiempo,
     quién actúa). No delegable a ningún agente.
3.2. **[DOC]** Borrador de "Protocolo de Respuesta a Incidentes" (plantilla lista para llenar con
     los datos reales que Bienestar/Seguridad UNAB confirmen: teléfono de guardia, tiempo de
     respuesta esperado, escalamiento) para que Santiago lleve algo concreto a esa conversación en
     vez de partir de cero.
3.3. **[MIXTO]** Una vez exista el protocolo real: conectar el botón SOS del código a la
     información de contacto real (hoy probablemente apunta solo a WhatsApp/123 genérico).

## Cobertura de RC-4 — Infraestructura insuficiente para dinero/datos reales

4.1. **[CODE]** Completar el backup externo a Cloudflare R2 (ya identificado como pendiente en
     `docker/DEPLOY.md` sección 8) — subir cada dump a R2 tras generarlo localmente.
4.2. **[CODE]** Habilitar TLS "Full" en vez de "Flexible" (pasos ya documentados en
     `docker/DEPLOY.md` sección 3) — generar certificado de origen Cloudflare, montarlo, descomentar
     el bloque 443 en `gateway/nginx.prod.conf`.
4.3. **[CODE]** Prueba de restauración real de un backup (no solo generarlo, restaurarlo en un
     entorno de prueba y confirmar que funciona) — `audit-codex.md` 23.2 señala que esto nunca se
     ha probado.

## Cobertura de RC-5 — Escasez de oferta / fuga a canales informales

5.1. **[DOC]** Plan de lanzamiento escrito: qué 2-3 corredores concretos, qué franjas horarias, y
     una lista de tácticas de "flota semilla" (bono de bienvenida, contacto directo a conductores
     conocidos) — esto es estrategia, no código, pero sí documentable como spec de go-to-market.
5.2. **[HUMANO]** Ejecución real del reclutamiento de la flota semilla (contactar personas) — no
     automatizable.
5.3. **[CODE]** (opcional, baja prioridad) Mecánica de referidos simple si no existe ya —
     verificar primero si `useAppStore.js` o el backend ya tiene algo parecido antes de construir
     de cero.

## Cobertura de RC-6 — App móvil no lista para prometer seguridad

6.1. **[DOC]** Actualizar `mobile/README.md`/`mobile/DEV_NOTES.md` para que declare explícitamente
     qué funciones de seguridad NO están disponibles todavía en móvil (tracking real, SOS con viaje
     activo), de forma que nadie lance la app móvil a usuarios reales asumiendo paridad con la SPA
     por accidente.
6.2. **[CODE]** (backlog, no bloqueante para el piloto en web) Implementar tracking GPS real y SOS
     con viaje activo en móvil, reusando la lógica ya construida en la SPA (`specs/gps-tracking-real.md`
     como referencia de lo que el backend ya expone).

## Cobertura de RC-7 — Bus factor (un solo desarrollador)

7.1. **[DOC]** Un documento de "runbook de continuidad": cómo levantar el proyecto desde cero
     (ya existe buena parte en `docker/DEPLOY.md` y los `CLAUDE.md`), dónde están todas las
     credenciales/cuentas (Wompi, TomTom, Cloudflare, dominios), y quién más (si alguien) tendría
     acceso en caso de que Santiago no pueda seguir manteniéndolo.
7.2. **[HUMANO]** Decidir y ejecutar a quién se le da acceso de respaldo (otro estudiante, un
     profesor, nadie) — decisión de Santiago.

## Cobertura de RC-8 — Datos de menores sin consentimiento parental

8.1. **[CODE]** Agregar campo de fecha de nacimiento al registro y lógica de flujo de consentimiento
     parental para menores de 18 años (`RegisterForm.jsx` + `auth-service`), coherente con Habeas
     Data ya implementado en el proyecto.
8.2. **[DOC]** Texto legal del consentimiento parental (borrador para revisión, ver 2.2).

## Cobertura de RC-9 — Opacidad/discriminación algorítmica

9.1. **[DOC]** Documentar explícitamente en el proyecto qué atributos usa el matching
     (`affinity_safety_service.py`) y por qué, como insumo de transparencia — no cambia el código,
     documenta la lógica ya existente para poder explicarla si se cuestiona.
9.2. **[CODE]** (backlog, no urgente para el piloto) Métrica simple de disparidad: ¿el modo "solo
     mujeres" o el peso de facultad está dejando a algún grupo con tiempos de espera
     sistemáticamente peores? Solo medir, no necesariamente cambiar el algoritmo todavía.

---

## Orden de prioridad global sugerido (para la fase de implementación)

**Bloqueante antes de cualquier piloto con desconocidos** (en este orden):
1. 1.1 (decisión) → 1.3 (comunicarlo en UI) — RC-1
2. 3.1 (conversación) → 3.2 como insumo previo — RC-3
3. 4.1 + 4.2 + 4.3 — RC-4
4. 2.1 → 2.2 — RC-2
5. 8.1 — RC-8

**Importante pero no bloqueante para un piloto cerrado y controlado**:
6. 5.1 — RC-5
7. 7.1 — RC-7
8. 6.1 — RC-6 (declarar la limitación, no resolverla todavía)
9. 9.1 — RC-9

**Backlog explícito, después del piloto**:
10. 1.4, 1.5 — conciliación/contracargos automatizados
11. 6.2 — paridad móvil completa
12. 9.2 — métrica de disparidad
13. 5.3 — referidos

---

## Lo que este plan NO incluye a propósito

- No incluye el refactor de modularidad de frontend (ya scoped en spec aparte).
- No incluye las ideas de features nuevas de la auditoría original (paraderos oficiales, SheWheels,
  tarifa solidaria) — son crecimiento, no cobertura de riesgo.
- No incluye resolver RC-1/RC-2 con una pasarela de payout bancario completa — eso es un salto de
  complejidad e integración regulatoria mucho mayor (mandato de dispersión, ver `audit-gemini.md`
  5.15) que no se justifica antes de validar que el modelo de negocio funciona en absoluto.
