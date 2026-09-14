# Checklist de auditoría — Anteproyecto UniWheels

Fecha: 2026-09-10 · Fuente: `tesis/export/proyecto-de-grado_2026-09-10.md` · Rúbrica: `tesis/guias/rubrica.md`

## Veredicto global

🔴 **El documento no está listo.** Aproximadamente **la mitad del contenido (§6.2, §6.3, §6.3.1, todo §7 y §8) sigue siendo el texto de ejemplo de la plantilla PG-I**, que trata de un proyecto DISTINTO ("ecosistema de aplicaciones móviles para gestión documental", Flutter/Firebase, escaneo, OCR, firma digital). Nada de eso corresponde a UniWheels ni al código real. Esas secciones hay que escribirlas desde cero.

Las secciones sí redactadas para UniWheels (§1–§5, §6.1, §9) tienen problemas puntuales de límite de palabras, coherencia y APA que se detallan abajo.

---

## §1 Introducción — ⚠️
| Ítem | Estado | Evidencia |
|---|---|---|
| ≤ 150 palabras | ❌ | **202 palabras**. Recortar ~50. |
| Contexto claro y motivador | ⚠️ | El 2º párrafo es demasiado técnico para una introducción: "poda de trayectorias", "telemetría", "XGBoost", "ALNS", "DARP-TW", "árboles de decisión potenciados por gradiente". Eso va en Marco Teórico/Metodología, no aquí. |
| No incluye objetivos/metodología/resultados | ⚠️ | El 2º párrafo describe la arquitectura y los algoritmos = adelanta metodología. |
| Contexto local (Bucaramanga) | ✅ | Menciona UNAB explícitamente. |

## §2 Planteamiento del Problema — ⚠️
| Ítem | Estado | Evidencia |
|---|---|---|
| ≤ 400 palabras (narrativa) | ⚠️ | Narrativa ≈ 430. Ajustar. La tabla de actores va aparte y está bien. |
| Evidencia concreta con cita verificable | ⚠️ | Bien referenciado (RUNT 2026, DTB 2025, AMB 2026, CREG 2026, UNAB 2026, UTS 2024). Pero: "más de 640.000 motocicletas, es decir 44 por cada 100 habitantes y los vehículos siguen el paso" — frase incompleta/informal; y **hay que confirmar que el Boletín 002 RUNT dice exactamente esa cifra** (ver `citas.md`). |
| Problema acotado en tiempo y espacio | ✅ | Bucaramanga y AM, horas pico definidas, sedes nombradas. |
| No propone soluciones aquí | ✅ | Correcto. |
| **2.1 Árbol del problema** | ❌ | **Vacío.** El encabezado existe pero no hay contenido (¿es una imagen que no exportó? verificar en el Doc). Es obligatorio: causas directas/indirectas, problema central, consecuencias directas/indirectas. |
| **2.2 Pregunta problema** | ✅ | Clara, abierta, investigable. Empaqueta 4 resultados (costos, tiempos, ocupación, huella de carbono); aceptable, pero podría acotarse. |
| Erratas | ❌ | "$55.00 COP" → $55.000; "3.600" sin símbolo; espaciados irregulares. |

## §3 Justificación — ✅ / ⚠️
| Ítem | Estado | Evidencia |
|---|---|---|
| ≤ 500 palabras | ✅ | 488. |
| Relevancia / pertinencia / valor agregado / viabilidad / formación | ⚠️ | Cubre relevancia, pertinencia, valor agregado y viabilidad. **Falta "Relación con la formación del estudiante"** (competencias que fortalece). |
| Argumenta con datos | ✅ | Cifras de combustible, parqueadero, referencia a Vai/Forbes. |
| Coherencia técnica | ⚠️ | Menciona "TomTom Traffic Flow API" y "PostGIS 3.4" (✅ existen en el código), pero introduce aquí por primera vez detalles que no aparecen en §1 ni §6.1. Unificar el stack descrito en todo el documento. |

## §4 Objetivos
### 4.1 Objetivo general — ✅ / ⚠️
- ✅ Un verbo en infinitivo ("Desarrollar"). ~37 palabras (≤ 40).
- ❌ Falta el punto final. "durante el año 2026" — mejor "durante el segundo semestre de 2026" para alinear con §5 (periodo 2026-2).
### 4.2 Objetivos específicos — ⚠️
| # | Palabras | ≤ 30 | Verbo infinitivo | Nota |
|---|---|---|---|---|
| OE1 Diagnosticar | ~28 | ✅ | ✅ | OK |
| OE2 Modelar | ~37 | ❌ | ✅ | Excede. "base de datos relacional" ↔ el sistema es **geoespacial (PostGIS)**; ajustar. |
| OE3 Desarrollar | ~46 | ❌ | ✅ | Excede bastante. Omite Python/FastAPI (sí está en §1). "WebSockets con Redis" → **no hay implementación de WebSockets en el código** (verificar). |
| OE4 Evaluar | ~55 | ❌ | ✅ | Excede mucho. Partir la lista de métricas. |
- Cantidad: 4 ✅. Orden lógico (diagnóstico→modelado→desarrollo→evaluación) ✅.
- Trazabilidad a fases de §7: no se puede verificar porque §7 es la plantilla.

## §5 Alcance y delimitación — ⚠️
| Ítem | Estado | Evidencia |
|---|---|---|
| ≤ 250 palabras | ✅ | 234. |
| Alcance: qué se hará, entregables, público | ✅ | Backend microservicios Laravel, UI React, optimización IA, sync geoespacial. |
| **TRL objetivo entre 3 y 5** | ❌ | Dice "busca alcanzar un nivel **TRL 6**". La norma institucional (plantilla §8) exige **TRL entre 3 y 5** para trabajo de grado. Corregir a TRL 5 máximo. |
| Delimitación = qué NO se incluye | ❌ | El párrafo dice "**se incluyen** la integración de pasarelas de pago bancario ... y la consulta automatizada a bases de datos gubernamentales" dentro de la sección *Delimitación*. Por contexto deberían ser **exclusiones** ("se excluyen"). Redacción contradictoria: aclarar. |
| Coherencia con el código | ❌ | (1) "plataforma web **progresiva** (PWA)" — el frontend **no** tiene configuración PWA (es React SPA plano). (2) Alcance dice "exclusivamente ... plataforma web" pero el repо tiene una **app móvil completa (`mobile/`, Expo SDK 54)**: aclarar si está dentro o fuera. (3) "microservicios en Laravel" omite el servicio **Python/FastAPI** (`ai-route-service`). |

## §6.1 Marco Teórico — ⚠️ (contenido real, pero incompleto)
| Ítem | Estado | Evidencia |
|---|---|---|
| ≤ 1500 palabras | ✅ | ~640 (hay margen). |
| **Sección completa** | ❌ | **Se corta a mitad de frase**: "...minimizando la función de costo multiobjetivo f(R)" y termina. Falta cerrar el punto 4 (ALNS/DARP/ML) y añadir el bloque de ETA/XGBoost, OSRM y evaluación de usabilidad. |
| Artefactos de formato | ❌ | Aparecen literales `\#\#\# 4\.` y una línea `──────` (encabezado roto). Limpiar en el Doc. |
| Relación concepto↔objetivo | ⚠️ | Bien encaminado, pero no cierra explícitamente cada concepto con el objetivo del proyecto. |
| Cobertura de servicios | ⚠️ | Nombra 4 microservicios; el sistema real tiene **6** (faltan notification-service y trip-service). Menciona PostGIS pero **no OSRM ni TomTom**, que sí usa el código para ruteo y tráfico. |
| Citas APA | ❌ | ~12 citas en texto (Litman 2020, BID 2022, Furuhata et al. 2013, Shaheen & Cohen 2019, Newman 2021, Evans 2004, ISO/IEC/IEEE 42010 2022, OGC 2011, Obe & Hsu 2021, Rigaux et al. 2002, PostGIS Development Group 2024, Cordeau & Laporte 2007, Turnbull 2018) **ninguna tiene entrada en §9 Referencias**. Ver `citas.md`. |

## §6.2 Estado del Arte — ❌ NO REDACTADO
- El contenido es **íntegramente la instrucción y el ejemplo de la plantilla** (DocuWare, Adobe Scan, Evernote, ORFEO/AGORA, "gestión documental"). Cero contenido sobre el estado del arte del carpooling.
- Debe contener: revisión crítica y comparativa de plataformas y estudios de carpooling / ride-sharing (p. ej. BlaBlaCar, Waze Carpool, Uber Pool, sCoop, Vai en Uniandes, carpooling universitario en la literatura), tabla comparativa, vacíos identificados, y comparación explícita con UniWheels (matching geoespacial sobre grafos + DARP-TW + ALNS + ETA con ML). Fuentes de Scopus/IEEE/ACM/Redalyc/Dialnet.

## §6.3 Marco Normativo y Legal — ❌ NO REDACTADO
- Contenido = plantilla + ejemplo de gestión documental (Ley 1581, ISO 27001/25010 genéricos).
- Debe cubrir, para UniWheels: Ley 1581/2012 y Decreto 1377/2013 (habeas data; tratamiento de **geolocalización** y datos de contacto), Ley 1266/2008, Ley 336/1996 (Estatuto Nacional del Transporte) y Decreto 1079/2015 — clave para argumentar por qué el **transporte solidario sin ánimo de lucro** no constituye servicio público de transporte remunerado; Ley 1581 + política de datos UNAB; Ley 527/1999 si hay pagos/firmas; normas técnicas ISO/IEC 25010, ISO/IEC 27001, OWASP ASVS; licencias de código abierto usadas; políticas institucionales UNAB.

## §6.3.1 Consideraciones éticas — ❌ NO REDACTADO
- Contenido = ejemplo de la plantilla ("documentos simulados").
- Debe cubrir: consentimiento informado para la encuesta/entrevistas y para el piloto (población: estudiantes = puede haber menores de edad → declararlo), tratamiento y minimización de datos de **ubicación en tiempo real**, seguridad de la comunidad (verificación de identidad conductor/pasajero), nivel de riesgo de la investigación, y uso de IA para decisiones de emparejamiento (transparencia). Aval del comité de ética si UNAB lo exige.

## §7 Diseño Metodológico — ❌ NO REDACTADO
- **Todo el capítulo** (tabla de contenido mínimo, 7.1 PHVA, 7.2 PMBOK, 7.3, 7.4 Diseño de Ingeniería, 7.5 Variables, 7.6 Factibilidad, 7.7 Hitos/TRL, 7.8 Riesgos, 7.9 Validación) es el **ejemplo de la plantilla sobre gestión documental** (Flutter, Firebase, "compatibilidad Android/iOS", "reducción de tiempos de búsqueda documental", "oficina piloto", TRL 5).
- Falta el 7.1 real (enfoque y tipo de investigación).
- Debe escribirse para UniWheels: enfoque (mixto: cuantitativo para métricas + cualitativo para el diagnóstico) y tipo (aplicada / desarrollo tecnológico) con cita; metodología de desarrollo (iterativo-incremental / Design Science Research) con **fuente original**; fases ligadas a los 4 OE; técnicas (encuesta y entrevista del OE1, pruebas unitarias/carga, evaluación SUS de campo); estrategia de validación (línea base de tiempos/ocupación vs. medición con el piloto); tabla de variables **de este proyecto** (tiempo de emparejamiento, latencia de consultas PostGIS, MAE del ETA XGBoost, coste ALNS, tasa de ocupación, ahorro de costo, SUS); factibilidad; hitos con TRL ≤ 5; riesgos reales (cuota TomTom, adopción, seguridad, datos de ubicación); validación por incremento.

## §8 Resultados Esperados — ❌ NO REDACTADO
- Contenido = ejemplo de la plantilla sobre gestión documental.
- Debe describir, para UniWheels: qué funcionalidades quedarán operativas al cierre de PG-I, en qué condiciones se prueban (piloto con comunidad UNAB), métricas objetivo (reducción de tiempos, ocupación ≥ X, SUS ≥ Y, MAE ETA ≤ Z), y el TRL final (≤ 5) justificado. ≤ 500 palabras.

## §9 Referencias Bibliográficas — ❌
| Ítem | Estado | Evidencia |
|---|---|---|
| Correspondencia 1:1 con citas en texto | ❌ | ~10 entradas en la lista; ~15 citas en texto sin entrada (todas las de §6.1, más Laudon & Laudon 2020 y Ulrich & Eppinger 2016 que vienen del texto-plantilla). |
| Referencias sin citar | ⚠️ | "Bucaramanga Metropolitana Cómo Vamos (2025)" no aparece citada en el texto. |
| Formato APA 7 | ❌ | Encabezado "**References**" (inglés); uso sistemático de "Retrieved [fecha], from" (APA 7 lo omite salvo contenido cambiante); mezcla "Retrieved" (inglés) con meses en español; título duplicado como contenedor en varias entradas; "Area Metropolitana de Bucarmanga" (errata + falta tilde). |
| Antigüedad ≤ 6 años | ⚠️ | Evans (2004), Rigaux et al. (2002), Cordeau & Laporte (2007), Furuhata et al. (2013): > 6 años. Evans y Cordeau & Laporte son **seminales** (DDD, DARP) → justificables. Los demás: buscar equivalente reciente. |
| Fuentes fiables / indexadas | ⚠️ | Forbes (nota de prensa) para la cifra de inversión de Vai: aceptable para ese dato puntual, ideal corroborar. ResearchGate como URL de Ibáñez Aldecoa (TRL): enlazar a la fuente primaria. Ver `citas.md`. |

## §10 Anexos — ❌
- Solo reproduce la lista de la plantilla. Para PG-I se espera, como mínimo: **cronograma** de ejecución, **árbol del problema**, diagramas de arquitectura, e instrumento de recolección (encuesta/entrevista) con su consentimiento informado.

---

## Comentarios del director
`tesis/notas/comentarios-director.md` está vacío. Si hay comentarios en el Doc, vólcalos ahí para que la próxima auditoría los cruce.
