# Extracto del documento — base de la presentación

Fuente única: `tesis/export/proyecto-de-grado_latest.md` (export del 2026-10-09, anteproyecto PG-I, "Agosto de 2026").
`L<n>` = número de línea en ese archivo. `[REPO]` = dato que no está en el documento sino en el repo (solo para arquitectura, flujo del producto y QR). Cada diapositiva cita de aquí.

## 0. Advertencia sobre la fiabilidad del documento

El documento conserva **texto de ejemplo de la rúbrica institucional** (sobre un proyecto de gestión documental con Flutter/Firebase) en secciones enteras. Ese texto **no se usó** como dato de UniWheels, salvo lo que se indica expresamente en las secciones 11 y 12 (genérico y marcado como tal). Detalle en "Inconsistencias" al final.

## 1. Autoría
- Autor: Santiago Serrano Ortiz — L3-4
- Director: Julian Santiago Santoyo Diaz — L8-9
- Asesor metodológico: Jorge Andrick Parra Valencia — L11-12
- Programa: Ingeniería de Sistemas, Facultad de Ingeniería, Universidad Autónoma de Bucaramanga (UNAB) — L14-16
- Asignatura: Proyecto de Grado I — L6. Fecha del documento: Agosto de 2026 — L18
- Título: "UniWheels: Diseño e implementación de una plataforma de carpooling en tiempo real para la optimización de la movilidad en la comunidad UNAB" — L1

## 2. Problema
- Crecimiento del parque automotor → congestión e ineficiencia en la movilidad urbana — L71
- Más de 640.000 motocicletas, 44 por cada 100 habitantes (RUNT, 2026; Dirección de tránsito de Bucaramanga, 2025) — L71
- Sedes: Campus El Jardín, CSU, La Casona y El Bosque — L72
- Horas pico 5:30–6:30 a.m. y 5:30–6:30 p.m.; las vías de acceso sufren estancamientos — L72
- Parqueaderos desbordados (UNAB, 2026); costo mensual $125.000–$150.000 COP carro y $45.000–$55.000 COP moto (el doc dice "$55.00", errata) — L72
- 70 % de los usuarios de transporte alternativo y apps son menores de 29 años; 54,4 % recurre a ellos por incomodidad y falta de rutas del transporte público (UTS, 2024) — L72
- Tarifa transporte colectivo $3.000 COP (ruta corta) / $3.600 (larga) (AMB, 2026); gasolina $16.049 COP/galón promedio (CREG, 2026) — L73
- Un alto porcentaje de vehículos particulares entra con un único ocupante — L73; "en promedio un solo ocupante por vehículo" — L95
- Bus gratuito de la universidad: solo dos o tres rutas, insuficientes — L73
- Metrolínea: inviabilidad operativa y cese — L93
- Pregunta problema — L89

## 3. Justificación
- Alternativa económica, segura y predecible para el pasajero frente al transporte informal — L95
- Conductor: comparte gastos de rodamiento, combustible y parqueadero sin prestar servicio mercantil ni de transporte remunerado no autorizado — L95
- Alineado con Bienestar Universitario y Dirección Administrativa; mitigar saturación de estacionamientos; sin inversión en infraestructura física — L95
- Huella de carbono institucional — L80, L67
- Antecedente: Vai (Universidad de los Andes), inversión ángel cercana a US$530.000 (Forbes, 2023) — L96
- Diferencial: correspondencia geoespacial de trayectorias sobre grafos viales; inserción óptima de paradas (DARP-TW) con ALNS; XGBoost para que el desvío se sugiera solo si es óptimo y está dentro del umbral tolerado por el conductor — L96-98
- Tecnologías de código abierto sin costo de licencia: microservicios Laravel y Python FastAPI, PostgreSQL/PostGIS 3.4, Redis, TomTom Traffic Flow API — L100

## 4. Objetivos
- General (L106): "Desarrollar una plataforma desacoplada de carpooling asistida por Inteligencia Artificial para la comunidad de la Universidad Autónoma de Bucaramanga, optimizando los tiempos de desplazamiento diario, reduciendo sobrecostos de transporte e incrementando la ocupación vehicular durante el año 2026"
- Específico 1 — Diagnosticar hábitos de movilidad y requerimientos de seguridad (encuestas y entrevistas) — L110
- Específico 2 — Modelar la arquitectura modular y el componente de optimización vial (microservicios, base relacional, IA para tiempos de recorrido y paradas) — L111
- Específico 3 — Desarrollar la plataforma (APIs RESTful en Laravel, rastreo geoespacial en vivo, notificaciones en tiempo real) — L112. *Se omitió "web", "React" y "WebSockets" por contradecir el producto actual (app móvil).*
- Específico 4 — Evaluar rendimiento, usabilidad e impacto (pruebas unitarias, de carga y de campo; reducción de tiempos, ocupación vehicular, SUS) — L114

## 5. Alcance
- Plataforma de carpooling para la comunidad UNAB; microservicios Laravel, optimización con IA, sincronización geoespacial en tiempo real — L120
- TRL de partida 3 (prueba de concepto); meta TRL 6 (prototipo integrado validado en entorno relevante) (Ibañez Aldecoa Quintana, 2024) — L121
- Delimitación: comunidad UNAB con correo institucional vigente; perímetro urbano de Bucaramanga y área metropolitana; periodo 2026-2 — L124
- ⚠ L126 incluye "pasarelas de pago bancario" → contradice el modelo B2B sin pagos. No se usó.

## 6. Marco teórico (L132-164)
- Carpooling universitario: comunidad cerrada y solidaria; costos compartidos sin ánimo de lucro mercantil; requiere confianza institucional y control de acceso con credenciales académicas — L135
- Microservicios (DDD, OCI) — L138-147
- PostGIS, SRID 4326, GiST, ST_DWithin — L149-157
- DARP-TW, ALNS, XGBoost — L161-164

## 7. Estado del arte
- L166-220 es **texto de ejemplo de la rúbrica** (gestión documental). No se usó.
- Referentes reales en el documento: publicación de trayectos en redes sociales ("proceso que suele gestionarse de manera precaria") y Vai (Uniandes) — L96

## 8. Marco normativo y consideraciones éticas
- L222-301 es **texto de ejemplo de la rúbrica**. UniWheels no tiene todavía marco normativo redactado. No se usó (ni Ley 1581/2012, que solo aparece en el ejemplo, L253/L265).

## 9. Metodología
- PMBOK (adaptación de fases): Inicio, Planificación, Ejecución, Monitoreo y Control, Cierre — L338-342 (texto genérico de la rúbrica; se usan solo los nombres de fase)
- PHVA: Planear, Hacer, Verificar, Actuar — L331-334 (se usan solo los nombres)
- Enfoque iterativo-incremental (desarrollo por una sola persona), apoyado en Kanban — L346
- TRL 3 → 6 — L121 (L404-408 dice 3→5 con entregables de gestión documental; no se usó)

## 10. Variables (L383-394) — solo las filas no contaminadas, como *metas*
- Compatibilidad Android/iOS: pruebas en ≥ 2 versiones recientes — L385
- Seguridad (cifrado AES-256; auditoría OWASP) — L386
- Rendimiento: tiempo de respuesta < 2 s con 100 usuarios concurrentes — L388
- Facilidad de uso: escala SUS ≥ 80/100 — L390
- Adaptabilidad: ≥ 3 perfiles (L391 los llama administrador, usuario estándar, auditor)
- **Excluidas (heredadas de otro proyecto):** MFA ≥ 90 % (L387), tiempo de respuesta "solicitud de un documento" (L389), reducción de tiempos de búsqueda documental ≥ 40 % (L392), trazabilidad documental (L393), productividad ≥ 20 % (L394).

## 11. Factibilidad e hitos
- L396-400: factibilidad con Flutter/Firebase y oficinas piloto → ejemplo de rúbrica. No usado.
- L404-408 hitos → ejemplo de rúbrica. No usado.

## 12. Riesgos (L412-416)
Única tabla de riesgos del documento; es genérica y posiblemente de ejemplo. Se usa con ese aviso, sin inventar probabilidad:
- Fallos en sincronización nube-móvil — Impacto Alto — almacenamiento local temporal y reintentos automáticos — L414
- Baja adopción del sistema — Impacto Medio — capacitación previa y mejoras en la interfaz — L415
- Vulnerabilidades de seguridad — Impacto Alto — auditorías de código y cifrado extremo a extremo — L416

## 13. Validación
- Usabilidad (SUS), rendimiento (tiempo de respuesta, consumo de recursos), seguridad (OWASP MSTG) — L422-424
- Base para futuras fases de escalamiento — L426
- Evaluación de campo con la comunidad UNAB — L114
- **No hay resultados, pruebas ejecutadas ni despliegue mencionados en el documento.**

## 14. Resultados esperados (L428-456)
Texto de ejemplo de la rúbrica (gestión documental). No usado.

## 15. Actores (L76-81)
Estudiantes pasajeros, conductores, Administración & Bienestar UNAB, autoridades de tránsito (DTB/AMB): caracterización, necesidades, expectativas y limitaciones. Usado en respaldo.

## 16. Referencias del documento (L464-480)
AMB (2026), Bucaramanga Cómo Vamos (2025), CREG (2026), Dirección de tránsito de Bucaramanga (2025), Forbes (2023), Ibañez Aldecoa Quintana (2024), RUNT (2026), UNAB (2026), UTS (2024).

## 17. [REPO] Producto y arquitectura (no es del documento)
- `README.md`: app móvil Expo/React Native; panel admin React+Vite; landing en uniwheels.org; nginx gateway; 5 microservicios Laravel 13 (auth, vehicle, route-matching con PostGIS, trip, notification); `ai-route-service` FastAPI (ETA con XGBoost, ALNS); PostgreSQL por servicio; Redis; Resend (correo).
- `README.md` / `docs/adr/0001-pivote-b2b-sin-pagos.md`: modelo B2B, sin procesar pagos.
- Flujo del viaje: `README.md` (trip-service: solicitado → asignado → en curso con verificación de PIN → completado) y commit "la reserva guarda las coordenadas reales de recogida".
- URL pública: https://uniwheels.org (`README.md`, `landing/`).

## 18. Inconsistencias del documento (resumen)
Ver `revision_autor.md` (pendientes) y el reporte final.

## 19. Evidencia calculada desde el repo (v2, 2026-10-28)
Todas las cifras de la diapositiva 11 y los hitos de la 9 salen de estos comandos, ejecutados sobre `origin/pivote/b2b-sin-pagos` (HEAD `81a54d5`).

| Dato | Comando / fuente | Resultado |
|---|---|---|
| Pruebas Laravel estilo Pest | `grep -rEh '^\s*(it\|test)\(' services/{auth,vehicle}-service/tests \| wc -l` | 90 + 32 = 122 |
| Pruebas Laravel estilo PHPUnit | `grep -rEh 'public function test_' services/*/tests \| wc -l` (auth 4, vehicle 4, route-matching 82, trip 76, notification 34) | 200 |
| Pruebas Python | `grep -rEh 'def test_' services/ai-route-service/tests \| wc -l` | 25 |
| **Total de pruebas declaradas** | 122 + 200 + 25 (conteo estático, no ejecución) | **347** (el README dice ~190: está desactualizado) |
| CI | GitHub Actions `ci.yml`: 198 ejecuciones; la última, run #198 (28 oct, `81a54d5`, rama `pivote/b2b-sin-pagos`) → `success` | 198, en verde |
| Producción | `curl -sI https://uniwheels.org` | `HTTP/2 200` (28 oct) |
| Microservicios en producción | `docker/docker-compose.prod.yml`: auth, vehicle, route-matching, trip, notification, ai-route | 6 |
| Dominio de correo institucional | `services/auth-service/app/Rules/InstitutionalEmailRule.php:36-44` (consulta `Institution::where('domain', …)->where('is_active', true)`) | implementado |
| AES-256 / OWASP | `grep -ril "aes-256\|owasp" services/` | solo `config/app.php` de cada servicio (cifrado por defecto del framework): **no hay cifrado extremo a extremo** → fila excluida del respaldo |
| Redis | `docker-compose.prod.yml`: `depends_on redis` en auth, trip y notification | confirmado |

### Hitos de la diapositiva 9 (`git log`)
| Fecha | Commit | Mensaje | Hito |
|---|---|---|---|
| 2026-09-23 | `791d241` | docs(specs): mapa de mobile con Leaflet en WebView | primer commit del repo: ya contiene los 6 servicios, `ci.yml`, `docker-compose.prod.yml`, `gateway/nginx.prod.conf` |
| 2026-10-04 | `12a2f69` | docs(negocio): pivote a B2B institucional sin procesamiento de pagos | pivote B2B (ADR 0001) |
| 2026-10-05 | `4d5d006` | fix(compose): define las URLs entre servicios en producción (A1) | configuración de producción |
| 2026-10-05 | `25e8be6` | Merge pull request #20 (pivote/t3a-tiendas) | app lista para las tiendas |

## 20. Auditoría de afirmaciones (diapositiva → afirmación → origen)
| Diap. | Afirmación | Origen |
|---|---|---|
| 1 | Autor, director, título | [Doc L1, L3-4, L8-9] |
| 2 | +640.000 motocicletas; 44 por cada 100 habitantes | [Doc L71] (RUNT, 2026) |
| 2 | Horas pico 5:30–6:30 (mañana y tarde) | [Doc L72] |
| 2 | 1 ocupante por vehículo, en promedio | [Doc L73, L95] |
| 2 | Parqueadero desde $125.000 al mes (carro) | [Doc L72] (UNAB, 2026) |
| 3 | Estancamientos en horas pico | [Doc L72] |
| 3 | Gasolina $16.049 por galón; parqueaderos saturados | [Doc L73, L72] (CREG, 2026; UNAB, 2026) |
| 3 | Alternativa al transporte informal | [Doc L78, L95] |
| 3 | Menor huella de carbono institucional | [Doc L80, L67] |
| 4 | Objetivo general y 4 específicos (paráfrasis; se omitió "web", "React", "WebSockets") | [Doc L106, L110-114] |
| 5 | Redes sociales: publicación de trayectos, gestión precaria; Vai (Uniandes), US$530.000 | [Doc L96] (Forbes, 2023) |
| 5 | UniWheels: comunidad verificada, emparejamiento por ruta, paradas sugeridas, enfoque UNAB | [Doc L67, L96-98, L124] |
| 5 | "—" = sin dato en el documento (no se afirma que el referente carezca de la función) | decisión de diseño |
| 6 | Conductores y pasajeros verificados, hacia/desde/entre sedes | [Doc L67] |
| 6 | App móvil; sin pagos en la app | [Repo: README.md, docs/adr/0001-pivote-b2b-sin-pagos.md] |
| 6 | Pantalla de la app | captura real `capturas/app_inicio_splash.png` (Expo web export) |
| 7 | Publicar → reservar (punto de recogida con coordenadas reales) → recoger (PIN) → finalizar | [Repo: README.md trip-service; commits `9d781e8`, `89f9bf5`] |
| 8 | Clientes → gateway; gateway → 5 servicios y ai-route | [Repo: `gateway/api-locations.conf`, `gateway/nginx.prod.conf`] |
| 8 | route-matching → ai-route-service | [Repo: `route-matching-service/app/Services/AiRouteServiceClient.php`] |
| 8 | auth-service → Resend (línea discontinua) | [Repo: `auth-service/config/mail.php` (`resend`), `app/Mail/*`] |
| 8 | ai-route-service → OSRM y TomTom | [Repo: `ai-route-service/app/services/osrm_client.py`, `tomtom_traffic_service.py`] |
| 8 | PostgreSQL+PostGIS (una base por servicio), Redis | [Repo: `docker/docker-compose.prod.yml`, `README.md`] |
| 9 | Hitos 23 sep, 4 oct, 5 oct, 5 oct | sección 19 (commits) |
| 9 | TRL 3 → 6 | [Doc L121] |
| 9 | PMBOK; iterativo-incremental | [Doc L338-342, L346] (texto genérico: ver `revision_autor.md`) |
| 10 | Correo institucional vigente | [Doc L124] + [Repo: `InstitutionalEmailRule.php`] |
| 10 | Verificados; gastos compartidos sin lucro | [Doc L67, L95, L135] |
| 11 | SUS ≥ 80; < 2 s con 100 usuarios; ≥ 2 versiones Android/iOS | [Doc L390, L388, L385] (metas) |
| 11 | 347 pruebas; 6 microservicios; 198 CI en verde; HTTP 200 | sección 19 |
| 12 | Riesgos adopción / seguridad entre pares / servicios externos y mitigaciones | [Repo: specs/pivote-b2b-sin-pagos.md; `trip-service` (PIN); `AiRouteServiceClient.php` (fallback)]; impacto adopción [Doc L415], otros [Pendiente] |
| 13 | Aporte a pasajero, conductor, UNAB | [Doc L95] |
| 13 | TRL 6; base para escalamiento | [Doc L121, L426] |
| 14 | https://uniwheels.org | [Repo: README.md]; QR decodificado en `scripts/qa.py` |
