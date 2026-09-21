# Auditoría y Crítica Técnica al Plan de Cobertura de Negocio v1 (Gemini)

**Fecha:** 2026-09-21  
**Documento auditado:** `tesis/auditoria/2026-09-21-viabilidad-negocio/plan-cobertura-v1-claude.md`  
**Referencia base:** `tesis/auditoria/2026-09-21-viabilidad-negocio/CONSOLIDADO.md` y codebase de UniWheels  

---

## (a) Puntos de acuerdo con el plan (Síntesis)

1. **Taxonomía de responsabilidades clara ([HUMANO], [DOC], [CODE], [MIXTO]):** La categorización es acertada y evita la trampa común de pretender que los agentes de IA "resuelvan" temas regulatorios o institucionales sin intervención humana.
2. **Pragmatismo en el modelo de pagos para el piloto:** Es totalmente correcto descartar la integración inmediata de una pasarela de dispersión bancaria/mandato masivo (PSE/ACH) para un proyecto de grado; eso agregaría meses de fricción bancaria/regulatoria innecesaria.
3. **Condición de parada de infraestructura (RC-4):** Es un acierto condicionar el manejo de dinero/datos reales a la resolución previa de TLS Full y backups externos en Cloudflare R2 documentados en `docker/DEPLOY.md`.
4. **Priorización institucional sobre la técnica en seguridad (RC-3):** Acertado reconocer que el botón SOS es inútil sin un acuerdo y protocolo humano con Bienestar/Seguridad de la UNAB.
5. **Delimitación explícita de exclusiones:** Dejar fuera refactors de frontend y features accesorias (SheWheels, paraderos, etc.) mantiene el foco estricto en viabilidad y reducción de riesgos.

---

## (b) Problemas identificados y propuestas de corrección

### 1. Omisión de la Recomendación 4 de `CONSOLIDADO.md` (Protocolo de Liquidación)
* **Problema:** `CONSOLIDADO.md` (Sección 4, punto 4) establece como recomendación prioritaria un *"Protocolo de liquidación por escrito (audit-claude.md categoría 17, Escenario E) — barato de redactar, éticamente necesario en cuanto hay dinero de terceros de por medio"*. El plan `plan-cobertura-v1-claude.md` omitió por completo esta acción. Si el piloto se suspende o finaliza, debe existir un procedimiento transparente de devolución o cierre de saldos recargados.
* **Propuesta de corrección:** Agregar la tarea **1.6 [DOC]**: Redactar el *Protocolo de Liquidación y Reembolso de Saldos de Billetera* (reglas de devolución de saldo no consumido ante cierre del piloto, fallas técnicas o retiro voluntario de usuarios). Debe ser prerrequisito antes de recibir recargas reales.

---

### 2. Trampa económica y contradicción en pagos con tarjeta vs. billetera cerrada (RC-1 / 1.1 / 1.3 / `WalletController.php`)
* **Problema técnico y de negocio:**
  En el código actual (`services/auth-service/app/Http/Controllers/Api/V1/WalletController.php` líneas 47-67 y `trip-service`), cuando un pasajero paga un viaje con tarjeta vía Wompi (referencia `TP-`), el backend abona automáticamente el valor de la tarifa a la billetera del conductor (`WalletController::credit`).
  Si en **1.1 / 1.3** se adopta la decisión de que *"el saldo es de circuito cerrado y solo sirve para pagar comisiones de la plataforma"*, se crea una **trampa económica crítica**: un conductor que complete viajes pagados con tarjeta acumulará saldo que **nunca podrá retirar en dinero real** y que solo podría "gastar" haciendo docenas de viajes adicionales en efectivo para consumir ese saldo en comisiones del 12%. Esto generaría incentivos perversos, rechazo de pagos con tarjeta y potenciales acusaciones de retención indebida de fondos.
* **Propuesta de corrección:**
  La decisión de producto **1.1 [HUMANO]** debe resolver explícitamente la dualidad de pagos para el piloto:
  * **Opción A (Recomendada para el piloto):** Deshabilitar pagos de viajes con tarjeta en la app. El 100% de los viajes se cobra P2P (efectivo/Nequi) directamente entre estudiante y conductor. Wompi en la app se utiliza **única y exclusivamente para recargar saldo de comisión prepago del conductor (referencias `WR-`)**. Así, la billetera es 100% de circuito cerrado sin contradicciones.
  * **Opción B (Si se mantienen pagos de viaje con tarjeta):** Definir un proceso manual de dispersión semanal (Santiago liquidando vía Nequi/Daviplata contra comprobante a los conductores) y documentar el cronograma en los T&C.

---

### 3. Inversión y fallas en el "Orden de Prioridad Global" (Líneas 125-131)
* **Problema en RC-3:** El plan lista `2. 3.1 (conversación) → 3.2 como insumo previo — RC-3`. Esto es un contrasentido de flujo: Santiago no puede tener la conversación formal con Bienestar UNAB (3.1 [HUMANO]) sin llevar primero en la mano el borrador del protocolo de incidentes (3.2 [DOC]) para estructurar la reunión.
* **Problema en RC-1:** La tarea `1.2 [DOC]` (borrador de nota legal sobre captación vs circuito cerrado) fue excluida de la secuencia priorizada (solo dice `1.1 → 1.3`), a pesar de ser el insumo necesario para que Santiago tome la decisión 1.1 con criterio jurídico.
* **Propuesta de corrección:** Reestructurar las cadenas de precedencia:
  1. `1.2 [DOC]` (Nota legal) $\rightarrow$ `1.1 [HUMANO]` (Decisión de modelo) $\rightarrow$ `1.3 [MIXTO]` (Ajuste UI) + `1.6 [DOC]` (Protocolo liquidación).
  2. `3.2 [DOC]` (Borrador protocolo incidentes) $\rightarrow$ `3.1 [HUMANO]` (Reunión con Bienestar UNAB) $\rightarrow$ `3.3 [MIXTO]` (Configuración SOS).

---

### 4. Sobrediseño y mala clasificación en RC-8 (Menores de edad / Consentimiento parental)
* **Problema:** La acción **8.1** está catalogada como `[CODE]` directo para *"implementar lógica de flujo de consentimiento parental para menores de 18 años"*. 
  1. No se puede codificar un flujo de consentimiento de menores sin una definición jurídica previa del mecanismo válido (¿subida de documento de identidad del tutor?, ¿firma digital?, ¿declaración juramentada?).
  2. Construir un flujo de consentimiento de tutores para una plataforma de transporte universitario en un piloto de tesis es un sobrediseño innecesario que introduce alta fricción y riesgo legal de Habeas Data infantil (Ley 1581 / Ley 1098).
* **Propuesta de corrección:**
  Reclasificar y simplificar la estrategia:
  * **8.1a [HUMANO/DOC]:** Definir como política del piloto la **restricción exclusiva para mayores de 18 años**.
  * **8.1b [CODE]:** Agregar en `RegisterForm.jsx` y `auth-service` la validación obligatoria de fecha de nacimiento (`age >= 18`). Con esto se anula el 100% de la exposición jurídica de RC-8 para el piloto con apenas unas líneas de código. Dejar el flujo con consentimiento parental para una fase comercial institucional posterior.

---

### 5. Desacuerdo con dejar la Conciliación Wompi (1.4) en el Backlog Post-Piloto
* **Problema:** El plan posterga el job de conciliación diaria básica (**1.4**) al ítem 10 (Backlog post-piloto). 
  Si el piloto va a recibir dinero real (incluso si son solo recargas de conductores de $5.000 a $20.000 COP), operar sin un mecanismo de conciliación entre las transacciones aprobadas en Wompi y los registros en `wallet_transactions` implica que cualquier fallo silencioso de webhook o desincronización dejará saldos inconsistentes sin trazabilidad.
* **Propuesta de corrección:**
  Elevar **1.4 [CODE]** a la fase previa al piloto comercial con terceros (junto a los backups de RC-4). No se requiere un sistema complejo: basta un comando artisan/script cron que compare diariamente las transacciones exitosas de Wompi API contra la tabla `wallet_transactions` y alerte discrepancias.

---

### 6. Mala clasificación operativa en Infraestructura RC-4 (4.1 y 4.2)
* **Problema:** Las tareas **4.1** (Backups R2) y **4.2** (TLS Full) están rotuladas como `[CODE]` puro. En la práctica, no se pueden resolver solo con commits al repositorio de Git; dependen críticamente de acciones en paneles administrativos externos (crear bucket en Cloudflare R2, generar R2 API Tokens, generar Certificado de Origen en Cloudflare y configurar variables en la VM Oracle).
* **Propuesta de corrección:** Reclasificar 4.1 y 4.2 como **[MIXTO]** o **[DEVOPS/OPS]**, dividiendo claramente:
  * *Parte Humana/DevOps:* Crear recursos y llaves en Cloudflare Dashboard y pegarlas en `.env.production` / `gateway/certs/` de la VM.
  * *Parte Código:* Ajustes en `backup-postgres.sh` (integración con S3/R2 API) y `gateway/nginx.prod.conf` (descomentar bloque 443).

---

## (c) Veredicto Final

**Aprobado con cambios menores.**

El plan de Claude tiene una estructura sólida, realista y bien enfocada en riesgos. No requiere una reescritura estructural ni una revisión mayor, pero **debe incorporar los 6 ajustes señalados** (especialmente resolver la regla de pagos con tarjeta en la billetera cerrada, corregir el orden de insumos previos en RC-1 y RC-3, simplificar la validación de mayores de edad en RC-8, incorporar el protocolo de liquidación y subir la conciliación básica de Wompi antes de manejar dinero real).
