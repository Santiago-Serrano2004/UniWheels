# Cambios propuestos — 2026-09-10

Bloques **ANTES / DESPUÉS** listos para pegar en el Doc **en modo Sugerencias**.
`[CITA: ...]` marca dónde hace falta añadir/confirmar una referencia. No se inventan datos.
Las secciones ❌ del checklist no llevan "DESPUÉS" completo: llevan un **guion de contenido** para que tú redactes.

---

## §1 Introducción — recortar a ≤150 y bajar el nivel técnico

**ANTES** (2º párrafo, íntegro):
> Para mitigar esta situación, se presenta UniWheels, una plataforma de transporte compartido (carpooling) institucional en tiempo real. El sistema integra un módulo de análisis geoespacial para la poda de trayectorias, acoplado a la ingesta de telemetría de tráfico en tiempo real, la cual alimenta un modelo de aprendizaje supervisado de árboles de decisión potenciados por gradiente (XGBoost) para la predicción dinámica del tiempo estimado de llegada (ETA) y un algoritmo heurístico de Búsqueda Adaptativa de Vecindario Grande (ALNS) para la optimización del problema de recogida y entrega con ventanas de tiempo (DARP-TW). Soportada sobre una arquitectura orientada a microservicios (APIs RESTful en Laravel y Python FastAPI, junto con un cliente web React SPA), UniWheels automatiza el emparejamiento entre conductores y pasajeros verificados de la comunidad universitaria, optimizando los trayectos hacia las sedes, desde los campus y entre sedes institucionales bajo un modelo colaborativo, seguro y sostenible.

**DESPUÉS**:
> Para responder a esta situación se propone UniWheels, una plataforma institucional de transporte compartido (carpooling) en tiempo real que conecta a conductores y pasajeros verificados de la comunidad UNAB. La plataforma empareja de forma automática trayectos cotidianos hacia y entre las sedes, sugiriendo únicamente los desvíos que resultan convenientes para el conductor y el pasajero, con el fin de reducir costos de transporte, disminuir los tiempos de desplazamiento y aumentar la ocupación por vehículo bajo un modelo colaborativo, seguro y sostenible. Los detalles de arquitectura y de los algoritmos de optimización se desarrollan en el Marco Teórico y en el Diseño Metodológico.

*(El primer párrafo se conserva; con este cambio el apartado queda ≈130 palabras.)*

---

## §2 Planteamiento del Problema

### 2.a Errata y frase incompleta
**ANTES:** "...circulan más de 640.000 motocicletas, es decir 44 por cada 100 habitantes y los vehículos siguen el paso."
**DESPUÉS:** "...circulan más de 640.000 motocicletas —cerca de 44 por cada 100 habitantes—, cifra a la que se suma un parque creciente de vehículos particulares [CITA: confirmar cifra exacta y fuente — RUNT, Boletín 002 de 2026]."

**ANTES:** "entre $45.000 y $55.00 COP para motocicletas"
**DESPUÉS:** "entre $45.000 y $55.000 COP para motocicletas"

### 2.b Árbol del problema (§2.1) — está vacío
Insertar el árbol (imagen o tabla). Estructura mínima:
- **Problema central:** Baja eficiencia y alto costo de la movilidad de la comunidad UNAB hacia sus sedes en Bucaramanga.
- **Causas directas:** baja ocupación vehicular (1 ocupante/vehículo); ausencia de un mecanismo formal de emparejamiento; cobertura y frecuencia insuficientes del transporte público tras el cese de Metrolínea; parqueaderos institucionales saturados.
- **Causas indirectas:** crecimiento del parque automotor; costos crecientes de combustible y parqueadero; percepción de inseguridad del transporte informal; malla vial sin capacidad de ampliación.
- **Consecuencias directas:** tiempos de espera y de viaje elevados; sobrecosto mensual en transporte; congestión en accesos a sedes en horas pico.
- **Consecuencias indirectas:** afectación a la puntualidad académica; mayor huella de carbono institucional; pérdida de tiempo productivo; presión sobre la infraestructura de la universidad.

*(Este árbol también va como anexo — §10.)*

---

## §3 Justificación — añadir "Relación con la formación"

**AÑADIR** un párrafo antes del último:
> Para su autor, el desarrollo de UniWheels consolida competencias en arquitectura de software distribuida (microservicios), bases de datos geoespaciales, aprendizaje automático aplicado (predicción de ETA), diseño de algoritmos de optimización combinatoria (DARP-TW/ALNS), desarrollo web full-stack y prácticas de ingeniería de software (pruebas automatizadas, integración continua), además de la capacidad de llevar una necesidad real del entorno hasta una solución validada en campo.

---

## §4 Objetivos

### 4.1 Objetivo general
**ANTES:** "...incrementando la ocupación vehicular durante el año 2026"
**DESPUÉS:** "...e incrementando la ocupación vehicular, durante el segundo semestre de 2026."
*(añade el conector "e", la coma y el punto final; alinea el periodo con §5 "2026-2")*

### 4.2 Objetivos específicos — recortar cada uno a ≤30 palabras
**ANTES → DESPUÉS**

OE2 (37 → 26):
> ~~Modelar la arquitectura web modular y el componente de optimización vial mediante patrones desacoplados de microservicios, diseño de base de datos relacional y algoritmos de inteligencia artificial, para la predicción de tiempos de recorrido y paradas vehiculares.~~
> **Modelar la arquitectura de microservicios, el modelo de datos geoespacial y los algoritmos de optimización de rutas y predicción de tiempos de llegada del sistema.**

OE3 (46 → 27):
> ~~Desarrollar la plataforma web de transporte universitario compartido mediante la implementación de servicios API RESTful en Laravel, una interfaz de usuario reactiva en React y la sincronización bidireccional vía WebSockets con Redis, para el rastreo geoespacial en vivo y la emisión de notificaciones en tiempo real.~~
> **Desarrollar la plataforma con servicios API REST en Laravel y FastAPI, interfaz en React y actualización en tiempo real del seguimiento geoespacial y las notificaciones.**
> *(Nota: "actualización en tiempo real" en vez de "WebSockets" — el código aún no implementa WebSockets. Si se implementarán, decláralo aquí y en §7; si es polling/SSE, nómbralo con precisión.)*

OE4 (55 → 29):
> ~~Evaluar el rendimiento, la usabilidad y el impacto operativo de la plataforma mediante pruebas unitarias automatizadas, pruebas de carga y evaluaciones de campo con la comunidad de la Universidad Autónoma de Bucaramanga, para medir la reducción en los tiempos de desplazamiento, la tasa de ocupación vehicular y el índice de satisfacción basado en la escala SUS.~~
> **Evaluar rendimiento, usabilidad e impacto operativo mediante pruebas automatizadas, pruebas de carga y una evaluación de campo con la comunidad UNAB, contrastando los resultados con una línea base.**

---

## §5 Alcance y delimitación

### 5.a TRL
**ANTES:** "...busca alcanzar un nivel TRL 6 (Technology Readiness Level) (Ibañez Aldecoa Quintana, 2024), correspondiente a un prototipo de sistema plenamente integrado y validado en un entorno relevante..."
**DESPUÉS:** "...busca alcanzar un nivel **TRL 5** (Technology Readiness Level), correspondiente a un sistema integrado y validado en un entorno relevante con usuarios reales [CITA: escala TRL — fuente canónica, p. ej. Comisión Europea (2014) o NASA], mediante pruebas de rendimiento, cobertura de código y usabilidad con estudiantes y docentes."
*(La norma institucional exige TRL entre 3 y 5 para trabajo de grado.)*

### 5.b Delimitación contradictoria
**ANTES:** "Desde el punto de vista funcional y de recursos, se incluyen la integración de pasarelas de pago bancario con moneda de curso legal y la consulta automatizada a bases de datos gubernamentales externas en tiempo real."
**DESPUÉS (si son exclusiones):** "Quedan **fuera del alcance** de este trabajo la integración con pasarelas de pago bancario con moneda de curso legal y la consulta automatizada en tiempo real a bases de datos gubernamentales externas."
*(Si en realidad SÍ están dentro del alcance, muévelas al bloque "Alcance" y redáctalas como entregables.)*

### 5.c Coherencia con el código
- "plataforma web **progresiva**": o se añade configuración PWA real al frontend, o se cambia por "aplicación web (SPA en React)".
- App móvil: el repo tiene `mobile/` (Expo). Decide y redacta: "El cliente móvil nativo queda fuera del alcance de PG-I" **o** inclúyelo como entregable.
- "microservicios en Laravel" → "microservicios en Laravel y Python (FastAPI)".

---

## §6.1 Marco Teórico

### 6.1.a Completar la sección (se corta a mitad de frase)
Termina el punto 4 y añade lo que falta. Guion:
- Cerrar ALNS/DARP-TW: función de costo multiobjetivo, operadores de destrucción/reconstrucción, criterio de aceptación, y por qué una metaheurística en vez de exacto (NP-hard) [CITA: Ropke & Pisinger, 2006; Cordeau & Laporte, 2007].
- **Ruteo topológico sobre grafos viales (OSRM)** — el código lo usa y hoy no aparece [CITA: Luxen & Vetter, 2011].
- **Telemetría de tráfico en tiempo real (TomTom Traffic Flow)** y su papel como entrada al ETA [CITA: doc. técnica TomTom].
- **Predicción de ETA con Gradient Boosting (XGBoost)**: formulación como regresión, variables de entrada (hora, día, tramo, congestión), métrica de error (MAE/RMSE) [CITA: Chen & Guestrin, 2016].
- Cerrar cada bloque con una frase que ligue el concepto al objetivo del proyecto.

### 6.1.b Corregir los 6 microservicios
**ANTES:** lista de 4 (Autenticación, Vehicular, Trayectos, Optimización).
**DESPUÉS:** añadir **Microservicio de Viajes** (máquina de estados del viaje, telemetría GPS, datos de entrenamiento del ETA) y **Microservicio de Notificaciones**. Total: 6, como en el repositorio.

### 6.1.c Artefactos de formato
Eliminar del Doc las líneas literales `\#\#\# 4\.` y `──────`; rehacer ese encabezado como "4. Algoritmos de ruteo dinámico...".

### 6.1.d Citas
Añadir a §9 todas las referencias del Marco Teórico (ver `citas.md` sección B). Marcar "latencias < 50 ms" y "O(N)→O(log N)" con cita o reformular como objetivo de diseño.

---

## §6.2 Estado del Arte — REESCRIBIR (hoy es la plantilla)

Guion (máx. 1500 palabras, enfoque analítico + tabla comparativa):
1. **Comerciales / masivas:** BlaBlaCar, Waze Carpool, Uber Pool/Share — modelo, matching, público, por qué no encajan en un contexto universitario cerrado.
2. **Universitarias / regionales:** Vai (U. de los Andes) [CITA: Forbes 2023 + 2ª fuente]; iniciativas de carpooling en campus reportadas en la literatura [CITA: artículos Scopus/IEEE sobre "university carpooling", "campus ridesharing"].
3. **Académico-algorítmico:** trabajos sobre DARP-TW dinámico, matching geoespacial y ETA con ML en ridesharing [CITA: 3–5 papers indexados, ≤6 años salvo seminales].
4. **Tabla comparativa:** columnas = comunidad cerrada / verificación institucional / matching sobre grafos viales / inserción óptima de paradas (DARP) / ETA con ML / tráfico en vivo / sin ánimo de lucro. Filas = cada referente + UniWheels.
5. **Vacíos y diferenciador de UniWheels:** ninguna combina comunidad universitaria verificada + DARP-TW con ALNS + ETA con XGBoost + telemetría en vivo sobre un modelo solidario.

---

## §6.3 Marco Normativo y Legal — REESCRIBIR (máx. 300 palabras)

Cubrir, con nombre y número, y en una frase cada una su aplicación:
- **Ley 1581 de 2012** y **Decreto 1377 de 2013** — habeas data; tratamiento de geolocalización, correo y contacto; autorización, finalidad, política de datos; encargado/responsable.
- **Ley 1266 de 2008** — si se consulta historial/antecedentes.
- **Ley 336 de 1996 (Estatuto Nacional del Transporte)** y **Decreto 1079 de 2015** — sustento de por qué el transporte solidario sin ánimo de lucro entre miembros de una comunidad no constituye servicio público de transporte remunerado.
- **Ley 527 de 1999** — si hay firma electrónica / registro de acuerdos entre las partes.
- **ISO/IEC 25010** (calidad de producto software) e **ISO/IEC 27001 / OWASP ASVS** (seguridad) como guía no obligatoria.
- **Licencias** de los componentes de código abierto usados.
- **Políticas UNAB** de tratamiento de datos y de uso del correo institucional.

---

## §6.3.1 Consideraciones éticas — REESCRIBIR (máx. 300 palabras)

- Nivel de riesgo de la investigación (declararlo; justificar).
- **Consentimiento informado** para encuesta y entrevistas (OE1) y para el piloto de campo (OE4); si participan estudiantes menores de edad, prever asentimiento + consentimiento del acudiente.
- **Datos de ubicación en tiempo real:** minimización, retención limitada, anonimización para análisis, no compartir con terceros.
- **Seguridad de las personas:** verificación de identidad de conductor y pasajero por correo institucional; no exponer datos de contacto más allá de lo necesario para el viaje.
- **Uso de IA:** el emparejamiento y los desvíos son sugerencias; transparencia sobre qué optimiza el sistema y bajo qué umbral de tolerancia del conductor.
- Aval del comité de ética de la UNAB si aplica.

---

## §7 Diseño Metodológico — REESCRIBIR TODO (máx. 2000 palabras)

Guion mínimo (sustituye por completo el texto-plantilla actual):
- **7.1 Enfoque y tipo de investigación:** mixto (cuantitativo para métricas de desempeño e impacto; cualitativo para el diagnóstico OE1); tipo: investigación aplicada / desarrollo tecnológico [CITA: Hernández-Sampieri; y para desarrollo tecnológico, Design Science Research — Hevner et al., 2004].
- **7.2 Metodología de desarrollo:** iterativo-incremental por servicio, con tablero Kanban; justificación con fuente original [CITA]. Integración con PHVA y con áreas de gestión PMBOK (alcance, tiempo, calidad, riesgos).
- **7.3 Fases** (una por OE, con actividades y entregables):
  1. Diagnóstico (encuesta + entrevistas) → especificación de requisitos.
  2. Modelado → arquitectura de microservicios, modelo de datos PostGIS, diseño de los algoritmos ALNS/ETA.
  3. Construcción → los 6 servicios, frontend React, integración OSRM/TomTom, pruebas automatizadas + CI.
  4. Validación → pruebas de carga, evaluación SUS de campo, medición de tiempos/ocupación vs. línea base.
- **7.4 Diseño de Ingeniería:** análisis comparativo de alternativas **de arquitectura del sistema** (monolito vs. microservicios; matching por bounding-box vs. poda PostGIS + OSRM; ETA por heurística vs. ML) con tabla y conclusión.
- **7.5 Variables** (tabla propia): tiempo de emparejamiento; latencia de consultas espaciales (ST_DWithin/GiST); MAE/RMSE del ETA (XGBoost); coste de la solución ALNS y % de mejora vs. orden ingenuo; tasa de ocupación (pax/vehículo); ahorro de costo por usuario; SUS; disponibilidad de servicios.
- **7.6 Factibilidad:** técnica (stack open source + cuota gratuita TomTom), económica (sin licencias), operativa (piloto con comunidad UNAB).
- **7.7 Hitos y TRL:** tabla incremento → TRL (3 → 4 → 5, nunca 6) → entregable.
- **7.8 Riesgos:** agotamiento de cuota TomTom (circuit breaker ya en el código); baja adopción en el piloto; incidentes de seguridad/identidad; fuga de datos de ubicación; sesgo del modelo ETA por pocos datos.
- **7.9 Validación por incremento:** criterios de aceptación cuantitativos por servicio.

---

## §8 Resultados Esperados — REESCRIBIR (máx. 500 palabras)

Guion: qué queda operativo al cierre de PG-I (los 6 servicios integrados + frontend + pipeline de datos ETA), condiciones de prueba (piloto N usuarios, X sedes, Y días), métricas objetivo con valor (reducción de tiempo ≥ __%, ocupación ≥ __ pax/veh, SUS ≥ __, MAE ETA ≤ __ min, latencia espacial ≤ __ ms), y TRL final ≤ 5 justificado. Sin promesas vagas.

---

## §9 Referencias — arreglos APA (formato, no contenido)
- Quitar el encabezado "**References**".
- En cada entrada: eliminar "Retrieved <fecha>, from"; dejar solo URL/DOI.
- Homogeneizar a español; corregir "Área Metropolitana de Bucaramanga".
- Quitar el título repetido como contenedor.
- Añadir todas las entradas de las citas del §6.1 (ver `citas.md`).
- Eliminar "Bucaramanga Metropolitana Cómo Vamos (2025)" si no se cita, o citarla en §2.

## §10 Anexos — añadir
Cronograma; árbol del problema; diagrama(s) de arquitectura; instrumento de la encuesta/entrevista + consentimiento informado.
