# Auditoría de viabilidad de negocio — alcance Codex

Fecha: 2026-09-21. Alcance exclusivo: categorías 8, 18 y 20–23 de `v3-codex.md`. La evidencia es una inspección estática del repositorio; una función escrita no se considera evidencia de que esté desplegada o operada. Los números de línea corresponden a esta revisión.

## 8. Escalabilidad técnica y operativa del negocio

### 8.1. Costo marginal de una nueva sede/universidad
**Conclusión.** El costo marginal no es sólo configurar una sede: el producto tiene instituciones/campus y geografía en el backend, pero el modelo de demanda está codificado para zonas de Bucaramanga y OSRM exige un grafo regional. Cada universidad nueva requiere convenio, administrador que valide vehículos/documentos, reclutamiento de ambos lados y generación/mantenimiento del mapa, además de parametrización y soporte local. No es todavía SaaS de alta repetibilidad. **Confianza: alta.** **Evidencia:** `docker/docker-compose.prod.yml:48-51` requiere `/data/santander.osrm`; `services/ai-route-service/app/services/demand_forecasting_service.py:28-81` fija densidades/picos locales. **Impacto de negocio:** el CAC de expansión y el tiempo a liquidez son mayores que el coste de crear una cuenta; vender “otra universidad en días” sería una promesa incorrecta.

### 8.2. Estrategia de lanzamiento
**Conclusión.** Debe ser piloto cerrado, de una sede, corredores y franjas definidos, con conductores preaprobados; abrir la UNAB completa desde día uno amplifica fallos de operación, pagos y soporte. **Confianza: alta.** **Evidencia:** una reserva ya queda `confirmado` antes del pago (`TripLifecycleController.php:112-131`), y el stack declarado es una VM única de piloto (`docker/DEPLOY.md:1-7`). **Impacto:** un piloto permite medir no-show, conversión y atención manual sin dañar la reputación institucional por matches sin oferta.

### 8.3. Efecto de red y masa crítica
**Conclusión.** El código encuentra oferta existente; no implementa lista de espera, incentivos, campañas o abastecimiento de conductores. La masa crítica debe conseguirse operativamente (conductores semilla por corredor/franja, cohortes y subsidio explícito), no mediante el algoritmo. **Confianza: alta.** **Evidencia:** la búsqueda depende de rutas publicadas (`services/route-matching-service/app/Models/Route.php:62-65`) y el match sólo filtra/evalúa candidatas; no crea oferta. **Impacto:** sin densidad simultánea se obtiene pantalla sin resultados, que tiene un coste reputacional muy alto en el primer semestre.

### 8.4. Soporte al usuario
**Conclusión.** No hay evidencia de mesa de ayuda, SLA, turnos, PQR ni responsables. Notificaciones se persisten y se intentan enviar síncronamente, pero no son soporte (`NotificationController.php:19-54`). Un tesista puede atender un piloto pequeño y horario acotado, no incidentes de movilidad/pagos fuera de horario. **Confianza: alta.** **RIESGO CRITICO**. **Impacto:** una disputa de dinero, accidente o acoso sin responsable identificable convierte un incidente individual en pérdida de confianza de la comunidad y de la universidad.

### 8.5. Migración TomTom a OSRM/PostGIS
**Conclusión.** OSRM ya está previsto/autohospedado, por lo que reduce llamadas de ruteo marginales, pero no elimina TomTom: el tráfico sigue siendo dependencia externa. El ahorro sólo existe si se presupuestan VM, RAM, actualización de grafo y operación. **Confianza: alta.** **Evidencia:** OSRM `latest` y `santander.osrm` en `docker-compose.prod.yml:44-51`; caché/consulta TomTom en `LiveTrafficService.php:62-85`. **Impacto:** migrar sin calcular recursos desplaza, no elimina, el coste; sí puede mejorar margen a volumen si se opera bien.

### 8.6. Offline y zonas de sombra
**Conclusión.** No hay cola offline ni sincronización de telemetría móvil; el GPS/estado depende de API. No debe prometerse seguimiento ni coordinación fiable con cobertura intermitente. **Confianza: media.** **Evidencia:** `mobile/src/lib/sdk.ts:18-30` sólo configura almacenamiento de sesión y APIs; la propia pantalla móvil excluye seguimiento real (`mobile/src/app/(tabs)/map.tsx:44-46`). **Impacto:** en parqueaderos o corredores con mala señal aumentan cancelaciones, espera insegura y reclamos.

### 8.7. Capacidad administrativa de Bienestar
**Conclusión.** La revisión documental es un cuello humano sin cola, SLA ni capacidad medida. Las integraciones pueden almacenar documentos, pero no sustituyen personal entrenado en matrícula. **Confianza: alta.** **Evidencia:** producción contempla R2 específicamente para documentos (`docker/DEPLOY.md:74-83`), mientras no hay en código de despliegue worker/flujo de asignación de revisores. **Impacto:** si la aprobación tarda, los conductores no pueden publicar y se rompe la liquidez justo al inicio del semestre.

### 8.8. Capacidad real monohost
**Conclusión.** No puede afirmarse un número de viajes concurrentes: no hay prueba de carga ni métricas de producción. Todos los seis servicios, PostGIS, Redis, OSRM, frontend, gateway y monitor comparten una VM 2 OCPU/12 GB. **Confianza: alta.** **Evidencia:** `docker-compose.prod.yml:11-169`; capacidad objetivo en `docker/DEPLOY.md:21-24`. **Impacto:** cualquier saturación o caída detiene simultáneamente match, viaje y billetera; medir carga es condición antes de ampliar el piloto.

### 8.9. Imágenes no fijadas
**Conclusión.** OSRM usa `latest`, por tanto un rebuild posterior no es reproducible. **Confianza: alta.** **Evidencia:** `docker-compose.prod.yml:44-46`. **Impacto:** una actualización inesperada puede dejar sin rutas en hora pico y cuesta soporte/rollback; se requieren digests/versiones y release probado.

### 8.10. Ruta crítica síncrona de match
**Conclusión.** Un resultado depende de PostGIS/OSRM, tráfico TomTom y, para IA, FastAPI; no hay SLA publicado ni degradación comercial especificada. **Confianza: alta.** **Evidencia:** `gateway/nginx.prod.conf:35-48,107-144` enruta esos servicios; `LiveTrafficService.php:67-85` llama/cacha tráfico. **Impacto:** latencia o caída se traduce directamente en abandono antes de reservar; el piloto debe mostrar “estimación no disponible” en vez de una ETA engañosa.

### 8.11. Enriquecimiento N+1
**Conclusión.** Es un riesgo plausible, no cuantificado: el diseño de microservicios separa identidad, vehículo, rutas y viaje, por lo que listas grandes requieren coordinación interservicio. No hay benchmark de carga real que pruebe el coste. **Confianza: media.** **Evidencia:** cinco bases aisladas en `docker-compose.prod.yml:17-22` y servicios separados `:63-138`. **Impacto:** al abrir más corredores la experiencia puede degradar antes de que el mercado sea suficientemente líquido; se necesita perfil público cacheado/denormalizado y medición.

### 8.12. Coherencia entre bases aisladas
**Conclusión.** La liquidación ya acepta inconsistencia: si auth falla, el viaje se completa y queda pendiente manual. No hay transacción distribuida. **Confianza: alta.** **Evidencia:** `TripLifecycleController.php:283-304`. **Impacto:** usuarios pueden perder acceso/vehículos mientras existen operaciones relacionadas; la conciliación y el soporte crecen más rápido que viajes si no hay procesos compensatorios.

### 8.13. GPS, escritura y retención
**Conclusión.** La retención es de siete días y el sistema reconoce un punto cada ~5 segundos; no hay presupuesto de volumen, índices, backup de evidencia o retención diferenciada por incidente. **Confianza: alta.** **Evidencia:** `trip-service/routes/console.php:11-13`; `PurgeOldTrackingPointsCommand.php:11-31`. **Impacto:** a escala suben disco/backup; borrar por defecto puede eliminar evidencia antes de un reclamo tardío.

### 8.14. Mantenimiento espacial
**Conclusión.** Existe `postgis:maintain`, pero no está programado en `routes/console.php`; requiere propietario operativo y ventanas. **Confianza: alta.** **Evidencia:** `MaintainPostgisIndexesCommand.php:10-27` frente a `route-matching-service/routes/console.php` sin agenda. **Impacto:** degradación gradual del matching reduce conversión sin alarma visible.

### 8.15. Grafo Santander OSRM
**Conclusión.** El artefacto necesario no está versionado (`docker/osrm-data/.gitkeep`), ni hay proceso automatizado de generación/actualización. **Confianza: alta.** **Evidencia:** montaje y nombre obligatorio `santander.osrm` (`docker-compose.prod.yml:48-51`). **Impacto:** cada ciudad requiere trabajo geográfico y capacidad de disco/RAM; una instalación incompleta deja el producto sin su ruta central.

### 8.16. Migraciones en arranque
**Conclusión.** Ejecutar `migrate --force` al iniciar cada PHP container convierte un deploy en cambio de esquema bajo tráfico sin aprobación/rollback separado. **Confianza: alta.** **Evidencia:** `docker/php-service.Dockerfile:48-55`; guía confirma migraciones al arranque (`DEPLOY.md:123-125`). **Impacto:** una migración defectuosa puede causar caída y afectar reservas activas; se necesita fase de migración versionada antes del rollout.

### 8.17. Colas y tareas críticas
**Conclusión.** Sólo hay un bucle `schedule:run`; no se evidencia worker para reintentos de cobro, correo, conciliación o entrega de notificaciones. **Confianza: alta.** **Evidencia:** `php-service.Dockerfile:48-55`; fallos de liquidación quedan para conciliación manual (`TripLifecycleController.php:299-304`). **Impacto:** al crecer, la intervención por excepción elimina el margen de una comisión pequeña.

### 8.18. Gateway dev/prod divergente
**Conclusión.** Hay dos Nginx que se sincronizan a mano. **Confianza: alta.** **Evidencia:** comentario explícito en `gateway/nginx.prod.conf:4-9`. **Impacto:** pruebas que pasan en desarrollo pueden fallar en piloto; cada cambio añade coste de QA/release.

### 8.19. Consola de monitoreo expuesta
**Conclusión.** Uptime Kuma publica `3001:3001` y la guía invita a abrirlo por IP pública, sin control de acceso documentado. **Confianza: alta.** **Evidencia:** `docker-compose.prod.yml:53-61`, `DEPLOY.md:132-138`. **Impacto:** expone inteligencia de disponibilidad y aumenta superficie de ataque; restringirla cuesta poco y es requisito operativo.

## 18. Resiliencia, infraestructura y costos ocultos

### 18.1. Soberanía OSRM/PostGIS
**Conclusión.** Ya existe una arquitectura híbrida viable para piloto, no una sustitución completa: OSRM local da ruteo y TomTom añade tráfico. **Confianza: alta.** **Evidencia:** `docker-compose.prod.yml:44-51`; `LiveTrafficService.php:62-85`. **Impacto:** el coste por consulta puede bajar, pero se debe presupuestar mantenimiento del grafo y fallos de datos; no presentar “casi $0” como coste total.

### 18.2. Caché geoespacial y throttling
**Conclusión.** Hay caché de tráfico por coordenada redondeada/hora y contador diario, pero no evidencia de caché de rutas/matches ni prueba concurrente. **Confianza: alta.** **Evidencia:** `LiveTrafficService.php:62-85`; Redis está disponible (`docker-compose.prod.yml:32-42`). **Impacto:** mitiga cuota TomTom, no el pico completo de salida; sin caché de resultados y prueba de carga, el gasto/latencia marginal sigue incierto.

### 18.3. Almacenamiento documental
**Conclusión.** R2 está planeado pero no hay política implementada de expiración de documentos ni modelación de crecimiento. **Confianza: alta.** **Evidencia:** R2 se configura manualmente (`DEPLOY.md:74-83`); el purgado automático sólo cubre GPS (`PurgeOldTrackingPointsCommand.php:11-31`). **Impacto:** documentos vencidos crecen indefinidamente y aumentan coste, exposición de privacidad y carga de cumplimiento.

## 20. Pagos, conciliación y tesorería

### 20.1. Ledger frente a dinero real
**Conclusión.** Hay ledger por usuario y referencias WR/TP, con webhooks idempotentes, pero no hay conciliador diario que compare Wompi, banco, comisión y ledger. **Confianza: alta.** **RIESGO CRITICO**. **Evidencia:** WR se acredita tras webhook (`WalletController.php:100-141`); TP sólo marca confirmado (`TripPaymentController.php:51-90`); no existe comando/job de conciliación. **Impacto:** no se puede saber ni demostrar a diario si el saldo prometido está cubierto por efectivo real; el error acumulado se convierte en pasivo y conflicto.

### 20.2. Pendientes y reintentos
**Conclusión.** El sistema registra `pendiente_debito`, pero no workflow, responsable, plazo ni reintento automatizado. **Confianza: alta.** **Evidencia:** estado inicial `TripLifecycleController.php:127-130` y fallback manual `:299-304`. **Impacto:** deuda incobrable y trabajo manual; bloquear sin recuperación afecta oferta, no bloquear destruye comisión.

### 20.3. Contracargos
**Conclusión.** No se gestiona reversión/objeción posterior: el webhook sólo actúa ante `APPROVED` y el viaje acreditado puede completar. **Confianza: alta.** **Evidencia:** `TripPaymentController.php:81-89`; crédito de conductor por tarjeta `TripLifecycleController.php:285-290`. **Impacto:** UniWheels absorbería o tendría que recuperar tardíamente dinero de conductor, sin política ni reserva. **RIESGO CRITICO**.

### 20.4. Devoluciones y saldos
**Conclusión.** No hay endpoint/proceso de devolución ni payout; el propio modelo declara que la billetera no tiene desembolso bancario. **Confianza: alta.** **Evidencia:** `Trip.php:35-40`; rutas de wallet sólo inicializan recarga, acreditan o debitan (`WalletController.php:26-98`). **Impacto:** saldo de tarjeta del conductor no equivale a ingreso líquido y recargas no utilizables quedan sin operación de reversión; bloquea cobro real a público.

### 20.5. Separación de funciones
**Conclusión.** No hay roles financieros, doble aprobación ni bitácora de ajustes/devoluciones porque tales operaciones no existen. **Confianza: alta.** **Evidencia:** no hay controladores/jobs de ajuste o conciliación bajo `auth-service/app`; wallet service endpoints son de sistema (`WalletController.php:43-98`). **Impacto:** cualquier operación manual futura concentra poder y fraude/error en una persona; un piloto con dinero requiere al menos maker-checker y extracto inmutable.

### 20.6. Reserva por fraude/pérdidas
**Conclusión.** No hay cálculo de provisión; sólo hay crédito negativo/lock según resultado del débito. **Confianza: alta.** **Evidencia:** `WalletController.php:81-94`; comisión fija 12% `Trip.php:31`. **Impacto:** el margen aparente del 12% no es margen neto: contracargos, deuda, soporte y Wompi pueden volver negativo el unit economics.

### 20.7. Umbral de proveedor payout
**Conclusión.** El umbral ya es funcional, no sólo volumen: antes de aceptar pagos por tarjeta a conductores se necesita una vía formal de desembolso o limitar explícitamente la tarjeta a saldo utilizable. **Confianza: alta.** **Evidencia:** no hay retirada (`Trip.php:38-40`). **Impacto:** sin payout, cada COP acreditado es obligación difícil de cumplir; no escalar tarjeta hasta resolver custodia, dispersión y conciliación.

## 21. Datos, IA y calidad de decisiones

### 21.1. Valor antes de 300 viajes
**Conclusión.** Antes de 300 resúmenes válidos, ETA es un modelo sintético calibrado, no evidencia de puntualidad local; debe rotularse como estimación y medirse contra realidad. **Confianza: alta.** **Evidencia:** mínimo `MIN_REAL_TRIPS = 300` (`retrain_eta_model.py:35`); entrenamiento inicial con 12.000 sintéticos (`xgboost_eta_predictor.py:111-113`). **Impacto:** prometer precisión de IA temprano genera decepción y pérdida de confianza, especialmente si se usa para precio/horario.

### 21.2. Sesgo de entrenamiento
**Conclusión.** Sólo se guarda resumen de completados con distancia y timestamps disponibles; cancelados/no-shows y fallos de ruta quedan fuera. **Confianza: alta.** **Evidencia:** `TripLifecycleController.php:307-330`. **Impacto:** ETA aprende los viajes que sí funcionaron, subestima fricción y puede sobreprometer en corredores difíciles; capturar motivos/espera/cancelación es imprescindible.

### 21.3. Calidad de etiqueta duración
**Conclusión.** La duración va de PIN verificado a finalización accionada por conductor, no de geocerca real a geocerca real. Es una etiqueta manipulable/inconsistente. **Confianza: alta.** **Evidencia:** PIN fija `actual_pickup_time` (`Trip.php:137-142`); complete fija fin tras acción del conductor (`TripLifecycleController.php:230-260`). **Impacto:** entrenar o cobrar con ella puede sesgar ETAs y disputas; usar GPS validado o declarar margen de error.

### 21.4. Gobierno de modelo
**Conclusión.** El script puede persistir un modelo candidato que mejora una validación, sin aprobación humana, registro de experimento, versionado de artefacto ni rollback operativo. **Confianza: alta.** **Evidencia:** `retrain_eta_model.py:125-164` entrena y llama `_save_model`; artefactos se guardan en ruta fija (`xgboost_eta_predictor.py:47-50`). **Impacto:** una actualización mala puede afectar precios/ETAs de todo el campus sin trazabilidad.

### 21.5. Mapa de demanda codificado
**Conclusión.** Densidades y pesos por hora son hipótesis manuales, no telemetría observada. **Confianza: alta.** **Evidencia:** valores literales por zona (`demand_forecasting_service.py:28-81`). **Impacto:** invertir subsidios o publicidad basados en el “heatmap” puede asignar recursos al corredor equivocado; validar con encuesta, rutas y viajes antes.

### 21.6. Afinidad y discriminación
**Conclusión.** El motor usa facultad, reputación, contactos y modo sólo mujeres. El filtro de seguridad puede aportar confianza, pero los atributos sociales deben ser opt-in, explicables y auditables. **Confianza: alta.** **Evidencia:** `affinity_safety_service.py:19-79`; esquema declara facultad y women-only (`route_optimization.py:32-46`). **Impacto:** ordenamiento opaco puede reducir acceso de grupos, generar quejas y riesgo reputacional/legal; separar filtro estricto de ranking y medir disparidades.

### 21.7. Medición causal de IA
**Conclusión.** No se evidencia A/B, baseline ni KPI que atribuya conversiones/puntualidad a ALNS/ETA frente a búsqueda simple. **Confianza: alta.** **Evidencia:** existe optimizador (`alns_optimizer.py:74-83`) pero sólo pruebas técnicas/comandos, no experimentación de producto. **Impacto:** se mantiene complejidad, APIs y deuda sin saber si mejora la liquidez; medir match/completitud/puntualidad por cohorte.

### 21.8. Uso secundario de movilidad
**Conclusión.** Se generan resúmenes de duración/distancia y emisiones, pero no hay evidencia de consentimiento específico, anonimización ni gobierno de uso investigador/ESG. **Confianza: media.** **Evidencia:** resumen se persiste (`TripLifecycleController.php:323-330`); cálculo de emisiones existe (`carbon_emission_service.py:63-77`). **Impacto:** informes agregados pueden ser un activo B2B, pero usar trayectorias sin reglas erosiona confianza y limita acuerdos institucionales.

## 22. Producto móvil y experiencia de mercado

### 22.1. Paridad SPA–móvil
**Conclusión.** Móvil permite login, búsqueda/reserva y flujo de tarjeta, pero no tiene seguimiento real, SOS, publicación/conducción, documentos ni push nativo equivalentes. **Confianza: alta.** **RIESGO CRITICO**. **Evidencia:** `map.tsx:44-46` excluye tracking real; `AppHeader.tsx:16` reconoce que SOS no existe con viaje activo; README sigue siendo plantilla Expo (`mobile/README.md:1-37`). **Impacto:** lanzar a estudiantes por móvil sin esas capacidades rompe la promesa central de seguridad/operación, aunque la SPA las diseñe.

### 22.2. Distribución/pruebas nativas
**Conclusión.** Hay identificadores de bundle, pero no EAS/build scripts, perfiles, pipeline de tienda ni pruebas automatizadas móviles. Está en etapa de desarrollo Expo. **Confianza: alta.** **Evidencia:** `mobile/app.json:10-26`; scripts sólo `expo start/android/ios/web` (`mobile/package.json:53-59`). **Impacto:** calendario y coste de publicación/betas no están incluidos; no comprometer fecha comercial basada en Expo Go.

### 22.3. Notificaciones móviles en incidente
**Conclusión.** Sólo se implementa Web Push; si VAPID falta o no hay suscripción, es no-op. FCM/APNs no está implementado. **Confianza: alta.** **Evidencia:** `WebPushService.php:24-26,45-56`; `DEPLOY.md:165-168`. **Impacto:** no se puede prometer aviso crítico confiable en móvil; esto es especialmente grave para cancelaciones y SOS.

### 22.4. Túnel de pruebas
**Conclusión.** El túnel quick de Cloudflare es efímero, URL cambiante y sin uptime; sirve para QA, no piloto ni métricas. **Confianza: alta.** **Evidencia:** `mobile/DEV_NOTES.md:20-27`. **Impacto:** una demo/prueba de campo puede fallar por infraestructura y contaminar resultados de adopción.

### 22.5. Privacidad de permisos
**Conclusión.** Hay justificaciones de ubicación y foto/cámara, pero no alternativa claramente descrita ni política de minimización para usuarios que rechacen permisos. **Confianza: alta.** **Evidencia:** `mobile/app.json:42-56`. **Impacto:** usuarios sensibles abandonan antes del primer valor; pedir sólo ubicación cuando se busca/publica y permitir perfil sin foto reduce fricción.

### 22.6. Accesibilidad, batería y conectividad
**Conclusión.** No hay mediciones en gama baja, presupuesto de datos/batería ni estrategia offline; mapa/WebView de Wompi y ubicación son dependencias reales. **Confianza: media.** **Evidencia:** dependencias `expo-location`, `react-native-maps`, `react-native-webview` (`mobile/package.json:24,37,43`); no hay tests móviles. **Impacto:** si la app agota batería/datos, conductores abandonan, exactamente el lado escaso del mercado.

## 23. Continuidad, confiabilidad e incidentes

### 23.1. RTO/RPO por servicio
**Conclusión.** No hay objetivos RTO/RPO definidos. Deben fijarse antes de piloto: identidad/match pueden tolerar degradación corta; viaje activo, pagos/ledger y documentos requieren prioridades y comunicación distinta. **Confianza: alta.** **Evidencia:** guía sólo describe arranque y backup, no SLO/RTO/RPO (`docker/DEPLOY.md:117-158`). **Impacto:** sin objetivos se improvisa qué restaurar y a quién informar; cada hora de caída puede causar viaje fallido y saldo disputado.

### 23.2. Backup recuperable
**Conclusión.** Hay dump diario local de 14 días, sin copia offsite automatizada ni prueba de restauración documentada. **Confianza: alta.** **RIESGO CRITICO**. **Evidencia:** `backup-postgres.sh:22-27`; `DEPLOY.md:140-158` reconoce que R2 está pendiente. **Impacto:** pérdida de VM puede eliminar simultáneamente producción y backups, incluyendo ledger, reputación y evidencias; no aceptar dinero antes de backup externo y restore drill.

### 23.3. Puntos únicos Cloudflare/Oracle/dominio
**Conclusión.** VM, Postgres, Redis, OSRM y gateway son un único host; no hay runbook de conmutación/comunicación. **Confianza: alta.** **Evidencia:** arquitectura monohost `docker-compose.prod.yml:11-169`; Cloudflare/DNS se configura manualmente (`DEPLOY.md:45-72`). **Impacto:** una caída durante salida de campus interrumpe todos los trayectos; se necesita canal alterno, estado público y protocolo de cancelar/evitar cobros.

### 23.4. Secreto JWT compartido
**Conclusión.** Un único JWT_SECRET compartido entre servicios crea compromiso transversal; no hay rotación sin interrupción definida. **Confianza: alta.** **Evidencia:** `DEPLOY.md:108-110`. **Impacto:** filtrar un secreto permite suplantación entre dominios; obliga revocar sesiones y causa bloqueo masivo, con alto coste de confianza.

### 23.5. TLS extremo a extremo
**Conclusión.** Flexible deja HTTP entre Cloudflare y origen y la guía lo considera aceptable para piloto; no lo es para ubicación, documentos o pagos reales. **Confianza: alta.** **RIESGO CRITICO**. **Evidencia:** `DEPLOY.md:58-72`; TLS 443 está comentado en `gateway/nginx.prod.conf:157-174`. **Impacto:** exposición/manipulación en el tramo origen destruye la confianza y el cumplimiento; Full TLS es condición de salida antes de usuarios reales.

### 23.6. Vulnerabilidades de dependencias
**Conclusión.** Hay dependencias de seis plataformas e imágenes, pero no inventario SBOM, escaneo, calendario de parche o dueño definido. **Confianza: alta.** **Evidencia:** imágenes base externas (`docker-compose.prod.yml:13,33,45,54,154`) y stacks PHP/Python/React/Expo (`mobile/package.json:14-43`). **Impacto:** una vulnerabilidad sin responsable puede comprometer ubicación/documentos/pagos y terminar el piloto reputacionalmente.

### 23.7. Soporte fuera de horario
**Conclusión.** No hay guardia ni escalamiento; Uptime Kuma sólo detecta si se configura manualmente. **Confianza: alta.** **Evidencia:** setup manual de monitores (`DEPLOY.md:132-138`); ausencia de SLA/on-call en repo. **Impacto:** mañana/noche son precisamente ventanas de movilidad; alertar sin responder no reduce el daño.

### 23.8. Simulacros de degradación
**Conclusión.** Hay pruebas unitarias y un comando de auditoría técnica, pero no escenarios documentados de caída de Wompi/Redis/auth/OSRM/red móvil y comunicación al usuario. **Confianza: media.** **Evidencia:** comando de benchmark usa escenarios locales (`AuditAiPerformanceCommand.php:71-103`); fallback financiero deja pendiente manual (`TripLifecycleController.php:299-304`). **Impacto:** sin simulacro, un fallo real puede crear cobros/ETAs inconsistentes y decisiones inseguras. Definir fallbacks, mensajes y criterios de detener reservas antes del piloto.

## Síntesis de riesgos críticos detectados

Se marcaron **6 RIESGO CRITICO**: soporte/incidentes sin operación (8.4), conciliación sin dinero real (20.1), contracargos sin procedimiento (20.3), móvil sin capacidades críticas (22.1), backups no recuperables/offsite (23.2) y TLS Flexible (23.5). No son seis defectos aislados: son condiciones de salida de un piloto que transporte personas o acepte dinero.
