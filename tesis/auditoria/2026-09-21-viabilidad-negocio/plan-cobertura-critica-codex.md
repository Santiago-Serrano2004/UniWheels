# Crítica Codex al plan de cobertura v1

Fecha: 2026-09-21. Alcance: auditoría del plan, no implementación. Contrasté `plan-cobertura-v1-claude.md`, `CONSOLIDADO.md` y la evidencia actual del repositorio.

## (a) Puntos donde estoy de acuerdo

- La descomposición por RC-1 a RC-9 es clara y, nominalmente, asigna una acción a cada riesgo. Es correcto tratar el aval y protocolo UNAB como humano (3.1), no como una feature.
- Es correcto tomar una decisión explícita y comunicar honestamente la naturaleza del saldo antes de construir un payout, y no imponer un payout bancario para una primera validación académica.
- La separación entre documento, decisión humana y código es una base útil. También es razonable dejar referidos y paridad móvil completa fuera de un primer piloto exclusivamente web.
- R2/offsite, TLS al origen y un restore drill sí son condiciones técnicas de salida antes de dinero o datos reales. La evidencia sigue vigente: `docker/backup-postgres.sh:22-27` deja la copia en el host y `docker/docker-compose.prod.yml:157-160` monta solo HTTP/80.

## (b) Problemas reales y correcciones propuestas

### 1. RC-1 está incompleto; 1.4 no es viable como está especificado

El plan propone comparar «créditos de Wompi (webhooks recibidos)» con el ledger (plan líneas 34-37). No existe aún esa fuente fiable: los handlers solo actúan sobre `APPROVED` y no persisten el evento/payload; los demás estados retornan sin registro (`services/auth-service/app/Http/Controllers/Api/V1/WalletController.php:115-141`; `services/trip-service/app/Http/Controllers/Api/V1/TripPaymentController.php:65-89`).

Además, billetera y viajes viven en servicios/bases distintos. Una conciliación debe abarcar recargas WR-, pagos TP-, importe bruto Wompi, comisión, neto del conductor, liquidación y `pendiente_debito`; comparar solo créditos/débitos de billetera omite pagos de viaje. La idempotencia tampoco está garantizada en base: `reference_id` no es único (`services/auth-service/database/migrations/2026_08_15_000004_create_user_wallets_and_transactions_tables.php:22-35`) y un reintento de crédito por viaje puede duplicarlo (`services/trip-service/app/Services/WalletServiceClient.php:29-38`; `services/auth-service/app/Services/WalletTransactionService.php:39-65`).

**Corrección.** Reemplazar 1.4 por **[MIXTO] diseño y operación de conciliación**: responsable, frecuencia, umbral y resolución humana; y como [CODE], intents/eventos Wompi persistidos, IDs externos, restricciones de idempotencia y una comparación contra reporte/API autorizado de Wompi. Debe producir una cola accionable. Si habrá tarjeta en el piloto, no puede quedar sin más «después del piloto» (líneas 138-140): puede comenzar manual, pero debe existir antes del primer cobro.

También falta la recomendación priorizada 4 de `CONSOLIDADO.md`: un **protocolo de liquidación por escrito**. No equivale al endpoint de contracargo. Debe definir cobro fallido/duplicado, cancelación, comisión pendiente, devolución, saldo negativo, plazo, canal de disputa y responsable. Es **[DOC] + [HUMANO]** y depende de 1.1 y revisión legal.

### 2. 1.1, 1.3 y 1.5 reducen demasiado el modelo de dinero

La alternativa «retirable a futuro o circuito cerrado» (líneas 23-25) no decide el tratamiento de recarga, ganancia de tarjeta, comisión P2P, reverso y reembolso. Hoy una tarjeta acredita al conductor en su billetera al completar (`services/trip-service/app/Http/Controllers/Api/V1/TripLifecycleController.php:283-303`), y la interfaz presenta el saldo como «Prepago / Ganancias» y permite recargar por Wompi (`frontend/src/components/wallet/WalletView.jsx:107-108`, `162-211`). Una sola leyenda de no retiro no resuelve qué se puede consumir ni devolver.

**Corrección.** 1.1 debe fijar, con insumo legal, naturaleza, usos, titularidad, reversos y devolución de cada flujo; 1.3 pasa a **[MIXTO]** y debe aplicar la decisión en WalletView, recarga, historial, T&C y reglas backend, no solo una etiqueta.

1.5 tampoco es solo [CODE]. Un endpoint no decide quién absorbe un contracargo. El webhook solo fija `payment_confirmed_at` (`TripPaymentController.php:81-87`) y el servicio de billetera solo conoce crédito/débito normal (`WalletTransactionService.php:29-112`), sin reverso ni vínculo persistido al ID externo. Debe ser **[MIXTO]**: política y responsable primero; luego asiento de reverso idempotente, bloqueo/notificación y pruebas de reintento.

### 3. RC-2: los T&C no cambian por sí mismos la clasificación material

2.1--2.2 son necesarios pero insuficientes. Denominar la tarifa «reparto de costos» no transforma la operación si el producto cobra una tarifa mediante Wompi y calcula un neto para conductor/comisión (`TripLifecycleController.php:248-295`).

**Corrección.** Añadir una decisión **[HUMANO] legal/de producto** sobre límites operativos del piloto (elegibilidad, cálculo/publicación de tarifa, métodos de pago, comisión, conductores, publicidad y territorio) y una acción **[MIXTO]** que compruebe que UI/backend respetan lo aprobado. Los T&C transparentan; no sustituyen esa decisión.

### 4. RC-3 tiene una dependencia invertida y subestima el SOS

La prioridad dice «3.1 → 3.2 como insumo previo» (línea 127): si 3.2 es el insumo, el orden correcto es 3.2 → 3.1.

Además, el SOS no envía una alerta institucional. Abre llamadas 123/125, WhatsApp sin destinatario fijo y copia un enlace; incluso tiene coordenadas/datos por defecto (`frontend/src/components/common/SosEmergencyModal.jsx:16-75`, `170-245`). Cambiar un contacto no genera recepción, acuse, escalamiento, registro ni custodia de evidencia.

**Corrección.** Ordenar **3.2 → 3.1 → 3.3**. Reformular 3.3 como **[MIXTO] integración de despacho SOS**: UNAB debe definir canal, disponibilidad, SLA, datos autorizados, responsables y contingencia; si se promete recepción institucional, código debe enviar alerta trazable y mostrar entrega/acuse. Si solo se permiten 123/contacto personal, la UI debe decirlo sin prometer soporte UniWheels/UNAB.

### 5. RC-4 son acciones de despliegue, no solo [CODE]

4.1--4.3 requieren cuenta Cloudflare, bucket/token o certificado, secretos, VM y validación operativa. La guía exige crear bucket/token en consola (`docker/DEPLOY.md:74-83`) y certificado Cloudflare (`docker/DEPLOY.md:58-68`). Un restore además requiere entorno aislado, datos de prueba, criterio de aceptación y evidencia. Tampoco debe reutilizarse por defecto el bucket privado de documentos para dumps: faltan permisos separados, cifrado, retención y alerta de upload fallido.

**Corrección.** Reclasificar 4.1--4.3 como **[MIXTO]**. Un agente puede preparar scripts/configuración; Santiago debe aprovisionar, custodiar secretos, desplegar/autorizar y validar. Mantenerlas bloqueantes es correcto.

### 6. RC-6: un README no bloquea un lanzamiento móvil

6.1 es útil, pero no impide que Expo apunte a producción ni que se distribuya. El móvil reconoce que no tiene viaje activo ni SOS (`mobile/src/components/AppHeader.tsx:14-17`); el plan además omite push nativo, otra brecha de seguridad ya auditada.

**Corrección.** Añadir antes de distribución móvil una decisión **[HUMANO]** de canal permitido y salvaguarda **[MIXTO]**: bloquear/despublicar producción móvil, o señalizar inequívocamente la limitación y deshabilitar flujos que prometen seguridad. 6.2 debe incluir push nativo y el protocolo SOS acordado; no basta «reusar la lógica SPA».

### 7. RC-8 está mal clasificado y subestima el consentimiento

8.1 no es solo [CODE]. Fecha de nacimiento y checkbox no prueban representación parental ni resuelven evidencia, versión, revocación, retención y acceso; capturar la fecha añade un dato que debe justificarse antes. Es una decisión legal/institucional previa.

Técnicamente abarca más que `RegisterForm.jsx`: no hay columna en `users` (`services/auth-service/database/migrations/0001_01_01_000000_create_users_table.php:14-45`), ni validación (`services/auth-service/app/Http/Requests/RegisterRequest.php:48-72`) ni persistencia (`services/auth-service/app/Http/Controllers/Api/V1/AuthController.php:64-94`), y el registro móvil duplica el flujo. El frontend fija `id_document_type: 'CC'` (`frontend/src/components/auth/RegisterForm.jsx:299-309`), lo cual debe revisarse si se admite a menores.

**Corrección.** Convertir 8.1 en **[MIXTO]**: primero decidir bloquear menores en el piloto o aprobar un diseño de consentimiento; después implementar migración/modelo/request/API, web y móvil, registro auditable de versión/fecha/método y pruebas. No capturar fecha hasta aprobar minimización.

### 8. RC-9: no se puede medir disparidad sin instrumentación y definición previa

9.2 presupone grupos y resultados que hoy no se guardan. El motor recibe género, facultad, reputación y contactos como payload con defaults (`services/ai-route-service/app/schemas/route_optimization.py:24-47`), pero no hay en la acción propuesta eventos de candidato elegible/excluido, ranking, oferta, aceptación, cancelación y espera. Sin denominadores, no hay métrica de disparidad defendible.

**Corrección.** 9.1 debe inventariar atributo, origen, default, finalidad, opt-in y visibilidad. Hacer 9.2 **[MIXTO]**: decidir qué variables y umbrales se pueden usar; luego instrumentar eventos minimizados/agregados y revisar periódicamente. Así se puede auditar el filtro duro women-only y los bonos de ranking (`services/ai-route-service/app/services/affinity_safety_service.py:19-87`) sin atribuir causalidad sin evidencia.

### 9. Prioridad: falta una puerta de salida operacional; RC-5 cae demasiado pronto

El plan deja 5.1 como no bloqueante (líneas 132-136), pese a que sin conductores semilla/corredores no hay valor para el pasajero. Para abrir a desconocidos debe estar definida y reclutada la flota, corredores/horarios, revisión de vehículos y soporte. No es una condición técnica universal, pero sí un gate operacional del piloto.

**Corrección.** Sustituir la secuencia lineal por gates: (1) saldo, legalidad y protocolo de liquidación; (2) aval/protocolo UNAB y SOS; (3) infraestructura y restore comprobados; (4) límites de producto aplicados; (5) flota semilla, corredores y soporte confirmados; (6) piloto web. Conciliación/contracargos puede iniciar manualmente, pero nunca sin dueño/procedimiento. Móvil queda fuera hasta superar su propio gate.

## (c) Veredicto final

**Necesita revisión mayor.** La estructura es útil, pero falta el protocolo de liquidación, varias tareas operativas/de decisión están mal clasificadas y las propuestas financieras, SOS, menores y disparidad no son implementables ni suficientes con el alcance escrito. Debe corregirse antes de dividir implementación.
