# Prompt v2 — Pulido final de la presentación UniWheels

Trabaja en la rama `presentacion/semana-ingenieria-2026`. Archivo base: `tesis/presentacion/UniWheels_Semana_Ingenieria_2026.pptx`. Carga la skill `pptx` antes de editar. **Edita el pptx existente; no lo regeneres desde cero** (conserva notas, diapositivas ocultas y layouts de la plantilla). Al final: re-render, commit, push.

## 0. Hechos del lienzo (no los olvides)
- Lienzo: 24 384 000 × 13 716 000 EMU = **1920 × 1080 pt** (el doble de un 16:9 estándar de 960 × 540 pt). Todo tamaño de fuente se lee a la mitad en proyección.
- Retícula obligatoria (en pt del lienzo):
  - Margen izquierdo = **86 pt** (x donde empieza hoy el título). Margen derecho = **1834 pt** (borde derecho del logo UNAB). Ancho útil = 1748 pt.
  - Zona de contenido vertical: de **y = 300 pt** (bajo el título) a **y = 940 pt** (encima de `#unabvibra+`). Altura útil = 640 pt.
  - 12 columnas, medianil 32 pt. Todo bloque empieza y termina en una columna.
- Fuentes de la plantilla: `Open Sans ExtraBold` (títulos/cifras) y `Open Sans` (cuerpo). Incrusta las fuentes si python-pptx/LibreOffice lo permiten; si no, documenta en el reporte que deben instalarse.

## 1. Defectos medidos (corrige todos)

### 1.1 Tipografía demasiado pequeña (crítico)
Tamaños actuales mínimos por diapositiva (en centésimas de pt): 22, 24, 26, 30 → equivalen a 11–15 pt en un 16:9 estándar. Ilegible desde el fondo de un auditorio.
Escala tipográfica nueva (pt del lienzo, `sz` = valor × 100):

| Rol | Tamaño | Peso |
|---|---|---|
| Título de diapositiva | 80 | ExtraBold (no tocar) |
| Cifra hero | 200–240 | ExtraBold, lima |
| Cifra de tarjeta | 96–120 | ExtraBold |
| Subtítulo / encabezado de tarjeta | 52–56 | Bold |
| Cuerpo | **40–44** | Regular |
| Etiqueta (overline, encabezado de tabla) | 30, MAYÚSCULAS, tracking +100 | Bold |
| Fuente / pie (citas APA) | **28 mínimo** | Regular, gris `#5E5E5E` |

**Ningún `sz` < 2800 en diapositivas visibles.** Respaldo (16–18): mínimo 2600. Verifícalo con:
```bash
for f in x/ppt/slides/slide{1..15}.xml; do grep -oP 'sz="\K\d+' $f | sort -n | head -1; done
```
Si al subir el tamaño el texto no cabe, **recorta texto**, no reduzcas la fuente.

### 1.2 Mitad inferior vacía (crítico)
Las diapositivas 3, 4, 5, 7, 9, 13 ocupan solo y ≈ 300–650 pt; deja ~300 pt muertos antes del hashtag. Regla: el grupo de contenido debe ocupar **≥ 75 % de la zona útil (≥ 480 pt de alto)** y quedar **centrado ópticamente** (un poco arriba del centro: centro geométrico − 20 pt). Hazlo creciendo tarjetas, íconos y tipografía, no añadiendo texto.

### 1.3 Margen derecho inconsistente
Las filas de tarjetas de las diapositivas 3, 5, 9, 13 terminan en x ≈ 1190 pt, mientras el logo termina en 1834. Toda fila de tarjetas/tabla/diagrama debe ir de **x = 86 a x = 1834 pt**. Recalcula: `ancho_tarjeta = (1748 − 32·(n−1)) / n`.

### 1.4 Diapositiva por diapositiva

1. **Portada.** El panel de UniWheels tapa la ilustración del evento (que es la identidad de la Semana). Reduce el panel a una tarjeta de **≤ 640 × 420 pt** anclada abajo a la derecha (x 1194–1834, y 520–940), fondo verde oscuro al 85 % de opacidad, borde lima 2 pt, radio 24 pt, y deja visible al menos el 60 % de la ilustración. Nombre del autor y del director a 32 pt mínimo.
2. **El problema.** "+640.000" sin fuente visible: añade la cita APA del documento abajo a la izquierda (28 pt, gris claro `#A7A7A7` sobre oscuro). Alinea la parte superior de la columna de 3 tarjetas con la parte superior de la cifra hero, y su base con la base del texto descriptivo. Tarjetas a 1194–1834 pt.
3. **¿Por qué importa?** Los íconos son círculos rellenos de clip-art y no siguen un mismo sistema. Sustitúyelos por íconos **lineales de un solo grosor** (trazo 6 pt, extremos redondeados, 120 × 120 pt, color `#0B3D1E` o el verde oscuro de la plantilla) dentro de un cuadrado redondeado lima pálido (lima al 18 %). Genera los 4 íconos como SVG → PNG a 4× (o shapes nativos) **todos de la misma familia** (p. ej. dibujo propio o Lucide: `car`, `wallet`, `shield-check`, `leaf`; Lucide es ISC, guarda la licencia en `tesis/presentacion/assets/LICENSE-lucide`). 4 tarjetas a todo el ancho.
4. **Objetivos.** El objetivo general es un párrafo de 3 líneas. Conviértelo en **una frase de ≤ 18 palabras a 52 pt** con el verbo resaltado en lima. Los 4 chips pasan a tarjetas altas (≥ 300 pt): número 96 pt lima, verbo 52 pt, descripción 40 pt.
5. **Estado del arte.** Tres tarjetas con poco contenido. Sustitúyelas por una **matriz comparativa** (filas: Redes sociales, Vai/Uniandes, UniWheels; columnas: comunidad verificada, emparejamiento por ruta, paradas sugeridas, enfoque UNAB). Usa ✓ lima y — gris. **Solo** celdas sostenidas por el documento (L96) o el repo; si una celda no se puede sostener, déjala vacía con "—" y anótalo en el reporte. Fila UniWheels con fondo verde oscuro y texto blanco.
6. **La solución.** El teléfono muestra una foto del campus, no la app. Ver §2 (capturas reales). Las 3 píldoras tienen anchos distintos: mismo ancho (480 pt), misma altura (72 pt), texto 32 pt centrado, apiladas con 24 pt de separación.
7. **Cómo funciona.** Bajo cada paso, un mini-teléfono (220 × 440 pt) con la pantalla real correspondiente (§2). Si no hay capturas, sube los círculos y el texto para llenar la zona útil (círculos 160 pt, número 80 pt).
8. **Arquitectura.** El diagrama ocupa ~60 % del ancho y las flechas en abanico desde el gateway se cruzan.
   - Escálalo a 86–1834 pt, en 4 carriles verticales: **Clientes** (App móvil, Panel admin) → **Gateway nginx** → **Microservicios** (5, misma altura, separación constante) → **Datos/externos** (PostgreSQL + PostGIS, Redis, Resend, ai-route-service).
   - Conectores **ortogonales** (elbow), trazo 4 pt, puntas de flecha triangulares, sin cruces. Del gateway sale **una** barra vertical (bus) de la que salen 5 ramas horizontales.
   - Texto de nodos: nombre 36 pt bold, stack 28 pt.
   - Verifica cada flecha con el código: `gateway/nginx.conf` (rutas reales), `docker/docker-compose*.yml` (dependencias), cliente HTTP de `services/route-matching-service` hacia `ai-route-service`, uso real de Resend en `services/auth-service` o `notification-service`. **Flecha que no exista en el código → se elimina.**
9. **Metodología.** Según tu propio reporte, las fases PHVA/PMBOK de la sección 7 son texto de ejemplo de la rúbrica. Quítale protagonismo: deja una sola línea de tiempo (PMBOK) con **fechas reales derivadas de `git log`** (primer commit, primer servicio, despliegue en producción, pivote B2B: usa `git log --reverse --format='%ad %s' --date=short` y `git log --all --oneline | grep -i -E 'deploy|prod|pivote'`), y bajo ella TRL 3 → 6. Cada hito debe tener un commit de respaldo; anota los hashes en `extracto.md`.
10. **Comunidad verificada.** Mismos íconos lineales de §1.4-3 (`mail-check`, `users`, `scale` o `hand-coins`). Sustituye el ícono "=". Confirma en `services/auth-service` que la verificación por dominio de correo institucional está implementada (busca la regla de validación del dominio) y cita el archivo en `extracto.md`.
11. **Cómo se validará** → renómbrala **"Validación: metas y estado actual"**. Mitad izquierda: las 3 metas actuales. Mitad derecha: **evidencia real del repo**, calculada, nunca estimada:
    - Nº de tests automatizados: `grep -rE "^\s*(it|test)\(" services/*/tests | wc -l` (Pest) + `grep -rE "def test_" services/ai-route-service/tests | wc -l`.
    - Que CI pasa: estado del último run en `.github/workflows/ci.yml` (`gh run list -L 1` si `gh` está disponible; si no, omítelo).
    - "En producción: uniwheels.org" — comprueba con `curl -sI https://uniwheels.org | head -1` que responde 200/30x; si no responde, no lo afirmes.
    - Nº de microservicios desplegados (de `docker/` o el compose de producción).
    Cada cifra lleva su comando de origen en `extracto.md`.
12. **Riesgos.** (a) Los 3 riesgos actuales vienen del texto de ejemplo (sincronización nube-móvil, cifrado extremo a extremo = Flutter/Firebase). Sustitúyelos por riesgos reales de UniWheels, sostenidos por el repo/doc: **adopción (arranque en frío de conductores)**, **seguridad entre pares** (mitigación real: verificación institucional + PIN de viaje del trip-service), **dependencia de servicios externos** (correo Resend, mapas/OSRM). Si alguno no tiene sustento, márcalo `[Pendiente]` en las notas. (b) **Semántica de color:** hoy "Alto" va en lima (que comunica "bien"). Usa: Alto = relleno verde oscuro + texto blanco; Medio = gris `#A7A7A7` + texto negro; Bajo = contorno gris. El lima queda solo para lo positivo (mitigación).
13. **Aporte y siguientes pasos.** Rellena la zona útil; la tarjeta "TRL 6" a la altura total de la columna izquierda.
14. **QR.** Decodifica el QR con `zbarimg` o `pyzbar` y confirma que apunta exactamente a `https://uniwheels.org`. QR ≥ 520 × 520 pt, zona silenciosa de 4 módulos, error correction `M`.
15. **¿Preguntas?** Bien. Solo sube el pie a 36 pt.

Respaldo 16–18: tablas con filas de ≥ 72 pt, cuerpo 28 pt. En "Variables", quita la fila **Seguridad (AES-256 / OWASP)** si no está implementada en el repo (comprueba con `grep -ri "aes-256\|owasp" services/`).

## 2. Capturas reales de la app (alta prioridad)
La diapositiva 6 y la 7 necesitan pantallas reales. En este orden, con tope de **8 minutos en total**:
1. Si existe `tesis/presentacion/capturas/*.png` (el autor puede haberlas subido desde su teléfono), úsalas.
2. Si no, intenta `cd mobile && npm install && npx expo export --platform web` y sirve `dist/` con datos de demo/mocks si existen (`grep -ri "mock\|demo\|fixture" mobile/src | head`). Captura a 390 × 844 px @3x con Playwright.
3. Si nada funciona, **no inventes UI**: deja el marco con la foto actual y escribe en el reporte "faltan capturas: subir 4 PNG a `tesis/presentacion/capturas/` (inicio/mapa, publicar ruta, reservar, viaje en curso)".
Marco de teléfono: rectángulo redondeado (radio 56 pt), bisel negro 14 pt, isla dinámica, sombra suave (blur 40 pt, 20 % opacidad). Captura recortada exactamente al área de pantalla, sin deformar (respeta la proporción).

## 3. Integridad del contenido
- Cada número visible debe tener entrada en `extracto.md` con origen `[Doc Lxxx]`, `[Repo: archivo/comando]` o `[Commit hash]`. Tabla final de auditoría: diapositiva → afirmación → origen.
- **Prohibido** usar texto de las secciones de ejemplo de la rúbrica que tú mismo identificaste (L166–220, L222–301, L329–342, L352–367, L387–394, L396–426, L428–456) como si fuera de UniWheels.
- TRL: usa 3 → 6 (L121) y escribe en notas: "el documento tiene metas de TRL distintas; unificar en el Doc".
- Errata "$55.00" (L72): no la reproduzcas.

## 4. Notas del orador
- Quita todas las notas "Para ti" de las diapositivas 9–12 (4 notas) y pásalas a `tesis/presentacion/revision_autor.md`.
- Reajusta el guion a los cambios (riesgos, validación, metodología). Total **9:30–9:50** a ≤ 130 palabras/min; escribe el conteo de palabras por diapositiva en el reporte.
- Cada nota termina con una frase de transición en **negrita**.

## 5. Consistencia visual global (checklist)
- [ ] Radio de esquina único en todas las tarjetas: 24 pt.
- [ ] Rellenos de tarjeta: claro `#F2F2F2`, oscuro = verde de la plantilla. Sin sombras en tarjetas planas.
- [ ] Lima solo para: cifras, números de paso, verbos clave y estado positivo. Máx. 2 elementos lima por diapositiva clara (salvo números de paso).
- [ ] Mismo `y` de título en todas (no tocar el layout) y mismo `y` de inicio de contenido (300 pt).
- [ ] Todos los íconos de una misma familia, mismo grosor y tamaño.
- [ ] Ningún texto en negrita sintética sobre ExtraBold.
- [ ] Contraste WCAG AA: gris sobre blanco ≥ 4.5:1 (`#5E5E5E` vale; `#A7A7A7` sobre blanco **no**), lima sobre verde oscuro ≥ 3:1 para cifras grandes.
- [ ] Sin cajas de texto con autofit `normAutofit` que encojan texto: ponlas en `noAutofit` y dimensiónalas.

## 6. Verificación automática (escríbela como `tesis/presentacion/scripts/qa.py` y ejecútala)
Debe fallar (exit 1) si:
1. Algún `sz < 2800` en las diapositivas 1–15.
2. Algún shape con texto se sale del rectángulo 86–1834 × 0–1080 pt (excepto fondos/decoración a sangre).
3. Dos shapes con texto se solapan (intersección de bounding boxes > 0, ignorando los que están anidados intencionalmente en una tarjeta).
4. Aparece "Lorem", "Título", "Subtítulo", "Pie de foto", "Para ti".
5. La suma de tiempos `[m:ss]` de las notas no está entre 9:30 y 9:50.
6. El QR no decodifica a `https://uniwheels.org`.
Además, renderiza (`soffice --headless --convert-to pdf` → `pdftoppm -r 80 -png`) y **revisa visualmente cada PNG**; compara antes/después en `preview/` (guarda los anteriores en `preview/v1/`).

Máx. 3 iteraciones de render-corrección. Si algo no se puede cumplir, para y explícalo en el reporte, no lo fuerces.

## 7. Entrega
Commit atómico por bloque (tipografía+retícula; arquitectura; validación+riesgos; capturas; notas; QA) en `presentacion/semana-ingenieria-2026`, push. Reporte final:
- Tabla diapositiva → cambios → tiempo → palabras.
- Salida de `qa.py`.
- Tabla de auditoría de afirmaciones (§3).
- Lo que queda pendiente del autor (capturas, correcciones en el Google Doc, fuentes por instalar).
