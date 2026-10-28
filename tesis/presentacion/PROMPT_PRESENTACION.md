# Prompt — Presentación UniWheels (Semana de la Ingeniería UNAB 2026)

Eres un diseñador de presentaciones académicas y un comunicador técnico senior. Vas a construir la presentación del proyecto de grado **UniWheels** para la **Semana de la Ingeniería UNAB 2026** (27–30 oct 2026). Exposición: **10 minutos**, seguida de **5 minutos de preguntas**. Todo en **español**.

## 0. Preparación del entorno (hazlo primero)
```bash
git pull
# Solo si vas a sacar capturas reales de la app (opcional, ver §6):
# cd services/<servicio-laravel> && composer install && php artisan migrate --seed
# cd mobile && npm install
```
Carga la skill `pptx` (anthropic-skills:pptx) antes de tocar ningún archivo. Si existe `frontend-design`, úsala para criterio visual. Usa `dataviz` para cualquier gráfico.

## 1. Fuentes — única verdad
- **Contenido:** `tesis/export/proyecto-de-grado_latest.md` (documento del proyecto). **100 % del contenido sale de aquí.** No inventes cifras, usuarios, porcentajes, resultados ni citas. Si un dato no está, no lo pongas.
- **Plantilla:** `tesis/presentacion/plantilla_unab_semana_ingenieria.pptx` (16:9, 24384000×13716000 EMU).
- **Activos visuales del producto:** `mobile/assets/images`, `mobile/assets/campuses`, `mobile/assets/institutions`, `landing/`, `marketing/`.
- **Arquitectura real:** `services/`, `gateway/`, `docker/`, `mobile/`, `admin/`, `README.md`, `CLAUDE.md`. Usa `graphify query` si existe `graphify-out/graph.json`.

⚠️ **Contenido contaminado conocido:** en la sección 7.5 (identificación de variables) hay filas heredadas de otro proyecto (MFA ≥ 90 %, "reducción de tiempos de búsqueda documental", "trazabilidad documental", "productividad ≥ 20 %"). **NO las uses.** Cualquier cosa que hable de documentos/gestión documental no pertenece a UniWheels. Lístalas en el reporte final como inconsistencias del documento.

Stack real (de `CLAUDE.md`): 5 microservicios Laravel 13 (auth, vehicle, route-matching con PostGIS, trip, notification) + `ai-route-service` FastAPI (ETA con scikit-learn/xgboost) + gateway nginx + app móvil Expo/React Native + panel admin de Bienestar. El producto es la **app móvil** (la SPA web está congelada; no la muestres como producto). El modelo actual es **B2B sin pagos** (`specs/pivote-b2b-sin-pagos.md`): no muestres pagos/Wompi; si el documento habla de pagos, señálalo como inconsistencia.

Lee el documento completo una vez y extrae a `tesis/presentacion/extracto.md` (con número de línea de origen por dato): problema, justificación, objetivo general, objetivos específicos, alcance, marco teórico clave, estado del arte (competidores/referentes), marco normativo (Ley 1581/2012 habeas data, etc.), metodología (PHVA, PMBOK, desarrollo ágil), diseño de ingeniería/arquitectura, variables, factibilidad, hitos/TRL, riesgos, validación, resultados/avances, conclusiones, trabajo futuro, autores, director, programa. Este extracto es tu base; cada diapositiva cita de él.

## 2. Identidad visual (respeta la plantilla, no la reinventes)
Plantilla UNAB: 4 diapositivas modelo →
1. **Portada** oscura verde (fondo `image1`, "SEMANA DE LA INGENIERÍA 2026", logo UNAB arriba-derecha, `#unabvibra+` abajo-izquierda).
2. **Texto** fondo blanco, título negro grande en negrita, logo verde arriba-derecha, `#unabvibra+` verde abajo.
3. **Imagen + texto** (título, foto izquierda, subtítulo + párrafo + pie de foto derecha).
4. **Cierre** oscuro verde con logo centrado.

Reglas:
- Duplica/clona esos layouts (no crees diapositivas desde cero fuera del sistema). Conserva logo, hashtag y franja lateral en todas.
- Paleta: verde oscuro de fondo (muestrea el hex real de `image1`/`image4`), verde lima del "2026"/hashtag como **único color de acento**, negro/grises `#535353` `#5E5E5E` para texto, blanco. Nada de los colores de acento genéricos del theme (cian, rosa, amarillo) salvo que el lima no alcance para un segundo dato en un gráfico.
- Tipografía: la de la plantilla (títulos en negrita pesada tipo sans geométrica; cuerpo Helvetica/Helvetica Neue). Títulos ≥ 60 pt equivalentes al tamaño original de la plantilla; cuerpo nunca < 24 pt en escala real del lienzo (el lienzo es enorme: 2× un 16:9 normal, escala las medidas).
- Ritmo: alterna diapositivas oscuras (impacto: portada, separador, cifra clave, demo, cierre) y claras (contenido). Máx. 2 claras seguidas sin un ancla visual fuerte.
- **Regla de densidad:** máx. 1 idea por diapositiva, máx. ~30 palabras visibles (excepto la tabla de objetivos), cero párrafos de lorem. El discurso va en **notas del orador**, no en la diapositiva.
- Elementos visuales a construir (shapes nativos de PowerPoint, editables, no imágenes planas):
  - Íconos lineales simples en lima/blanco (SVG→EMF o shapes) para problema, seguridad, ahorro, sostenibilidad.
  - **Diagrama de arquitectura** real (móvil → gateway → microservicios → BD/servicios externos como correo Resend), solo con componentes que existan en el repo.
  - **Línea de tiempo** PMBOK/PHVA con hitos y TRL.
  - **Matriz de riesgos** 3×3 o tabla compacta con semáforo en lima/grises.
  - Mockups de la app dentro de un marco de teléfono (capturas reales de `mobile/` o del documento/mockups; si no hay capturas reales, usa los assets existentes — nunca UI inventada).
  - Un número gigante (cifra hero) por cada dato cuantitativo fuerte que **sí** esté en el documento.

## 3. Estructura (≈13–15 diapositivas para 10 min, ~40 s promedio)
| # | Diapositiva | Layout | Tiempo | Contenido |
|---|---|---|---|---|
| 1 | Portada | 1 | 0:20 | UniWheels, subtítulo de una línea (propuesta de valor del doc), autor(es), director, programa, logo UniWheels |
| 2 | El problema | oscuro + cifra hero | 0:50 | movilidad hacia las sedes (Jardín, CSU, La Casona, El Bosque), horas pico, baja ocupación vehicular; cifra del doc |
| 3 | ¿Por qué importa? | 2 + íconos | 0:40 | congestión, emisiones, seguridad, costo (citas APA del doc, pie pequeño) |
| 4 | Objetivo general + específicos | 2 | 0:50 | general en grande; específicos como 4–5 chips numerados con verbo inicial |
| 5 | Estado del arte | 2 | 0:40 | tabla comparativa de referentes del doc vs UniWheels (✓/✗), diferenciador resaltado en lima |
| 6 | La solución: UniWheels | 3 (mockup) | 0:50 | qué es, para quién (comunidad verificada por correo institucional) |
| 7 | Cómo funciona | claro, flujo 3–4 pasos | 0:40 | publicar ruta → reservar → recoger (coordenadas reales) → viajar/finalizar |
| 8 | Arquitectura | claro, diagrama | 0:50 | diagrama de §2; stack real |
| 9 | Metodología | claro, timeline | 0:40 | PHVA + PMBOK + ágil, hitos, TRL alcanzado/esperado |
| 10 | Seguridad y marco legal | 2 + íconos | 0:30 | verificación institucional, Ley 1581/2012, consideraciones éticas |
| 11 | Validación y resultados | oscuro, cifras | 0:50 | solo resultados del doc (diagnóstico, pruebas, despliegue en producción si el doc lo menciona) |
| 12 | Riesgos y mitigación | claro, matriz | 0:30 | top 3–4 riesgos del doc |
| 13 | Conclusiones + trabajo futuro | claro | 0:40 | 3 conclusiones, 2–3 líneas futuras del doc |
| 14 | Demo / QR | oscuro | 0:20 | QR a la URL pública si el doc o repo la nombran (uniwheels.org) — genera el QR con `qrcode` en Python |
| 15 | Gracias / Preguntas | 4 | — | "¿Preguntas?" + contacto; abre los 5 min de Q&A |

Ajusta el número si el documento lo pide, pero la suma de tiempos debe quedar en **9:30–10:00**.

## 4. Notas del orador (obligatorias en cada diapositiva)
- Guion hablado, natural, en primera persona, con el tiempo objetivo al inicio (`[0:50]`) y una frase de transición a la siguiente.
- ~130 palabras por minuto como tope.

## 5. Preparación de preguntas (5 min de Q&A)
Crea `tesis/presentacion/preguntas_probables.md` con 12–15 preguntas probables del jurado y respuestas de 2–3 frases **basadas en el documento**: seguridad de pasajeros, modelo de negocio/sostenibilidad, por qué no usar Uber/DiDi/Waze Carpool, protección de datos, escalabilidad a otras universidades, validación con usuarios reales, limitaciones, TRL, costos, decisiones técnicas (microservicios, móvil-first), qué falta para lanzamiento. Añade 2–3 **diapositivas de respaldo** (backup) ocultas al final del .pptx (p. ej. arquitectura detallada, tabla de variables válidas, cronograma completo).

## 6. Capturas reales (opcional, si el entorno lo permite)
Si puedes levantar la app (web/admin o Expo web), toma 2–3 capturas con Playwright de pantallas clave (mapa/ruta, reserva, perfil verificado). Si no levanta en ≤ 5 min, abandona y usa assets/mockups existentes. No pierdas tiempo en bucles.

## 7. Entregables
En `tesis/presentacion/`:
- `UniWheels_Semana_Ingenieria_2026.pptx`
- `UniWheels_Semana_Ingenieria_2026.pdf` (vía LibreOffice headless)
- `extracto.md`, `preguntas_probables.md`
- `preview/` con PNG de cada diapositiva

## 8. Control de calidad (no termines sin esto)
1. Renderiza a PNG (`soffice --headless --convert-to pdf` + `pdftoppm`) y **mira cada diapositiva**: sin texto desbordado, sin solapes con logo/hashtag, contraste suficiente, alineación a una retícula común, márgenes iguales.
2. Verifica que no quede ningún "Lorem", "Título", "Subtítulo", "Pie de foto" ni la foto de stock de la plantilla.
3. Cruza cada cifra/afirmación de las diapositivas con `extracto.md` (línea de origen). Cero datos inventados.
4. Suma de tiempos de notas = 9:30–10:00.
5. Corrige y vuelve a renderizar hasta que esté impecable (máx. 3 iteraciones).

## 9. Cierre
Haz commit en una rama `presentacion/semana-ingenieria-2026` (no en main), push, y reporta: ruta de archivos, lista de diapositivas con tiempos, inconsistencias detectadas en el documento (incluida la de §1) y cualquier dato que faltó y quedó fuera.
