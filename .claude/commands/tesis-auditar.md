---
description: Auditoria completa del anteproyecto a demanda (rubrica UNAB + coherencia con codigo + APA7 + verificacion de citas)
allowed-tools: Bash, Read, Grep, Glob, WebSearch, WebFetch
argument-hint: "[apartado] — ej: 6.2  |  vacio = todo el documento"
---
Auditoría del anteproyecto de grado. **No escribes en el Google Doc.** Salida en `tesis/auditoria/<fecha>/`.

## 0. Traer y preparar
1. `tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py --local-only --no-commit` (si falla, usa el `_latest` existente y avísalo).
2. Lee `tesis/export/proyecto-de-grado_latest.md`.
3. Lee `tesis/guias/rubrica.md`, `tesis/notas/protegido.md`, `tesis/notas/esquema.md`, `tesis/notas/comentarios-director.md`.
4. Troceá el documento por los apartados de la rúbrica (1..10 y subapartados). Si `$ARGUMENTS` indica un apartado, audita solo ese.

## 1. Por cada apartado
a. **Norma del apartado**: además de la rúbrica, haz una búsqueda web (WebSearch) de "cómo se redacta / qué debe contener" ese apartado en un anteproyecto de ingeniería (Colombia). Contrasta con lo que exige la rúbrica; si la web aporta criterios extra relevantes, inclúyelos como recomendación.
b. **Contenido mínimo**: marca cada ítem `[ ]` de la rúbrica como ✅/⚠️/❌ con evidencia (cita textual breve del doc + ubicación).
c. **Límite de palabras**: cuenta y compara con el máximo. Reporta exceso/defecto.
d. **Coherencia con el código**: para §5, §7, §8 (y donde se describa la solución), contrasta cada afirmación técnica con el monorepo real (servicios, stack, JWT, PostGIS, React 19, Expo SDK 54, CI). Lista afirmaciones que no cuadran y features del código sin documentar.
e. **Contexto local**: afirmaciones sobre el entorno deben referirse a Bucaramanga / área metropolitana / Santander / Colombia. Marca las que no.
f. Si el apartado está en `protegido.md` → 🔒: solo validas formato APA y citas, no propones reescritura.

## 2. APA 7 (todo el documento)
- Extrae todas las citas en texto y toda la lista de referencias.
- Comprueba: formato de cita en texto, formato de cada entrada, sangría francesa, orden alfabético, huérfanas en ambos sentidos, DOI/URL presente.
- Referencia institucional: https://normasapa.in/ y `tesis/guias/_txt/Guia-Normas-APA-7ma-edicion.txt`.

## 3. Verificación de citas
- **Todas las fuentes ya presentes en el documento están protegidas** (ver `tesis/notas/protegido.md` §2): se verifican y se reportan problemas como observación, pero NO se propone sustituirlas ni eliminarlas (salvo las listadas como excepción).
- Delega en el agente **tesis-citas** la lista completa de referencias. Espera su tabla y adjúntala.
- En `cambios-propuestos.md` solo pueden aparecer citas **nuevas** para afirmaciones sin respaldo. Los ajustes a citas existentes se describen como observación, y se aplican en la herramienta *Citas* de Google Docs, no como texto plano.

## 4. Salidas (crea `tesis/auditoria/<AAAA-MM-DD>/`)
- `checklist.md` — por apartado: estado global, tabla de ítems ✅/⚠️/❌ con evidencia, conteo de palabras, hallazgos de coherencia con código, comentarios del director sin cerrar que tocan ese apartado.
- `cambios-propuestos.md` — por apartado no protegido: bloques **ANTES / DESPUÉS** con el texto exacto listo para pegar en el Doc **en modo Sugerencias**. Marca `[CITA: ...]` donde falte respaldo. No inventes datos ni citas.
- `citas.md` — la tabla de tesis-citas + veredicto por referencia + acciones (sustituir / actualizar / añadir DOI / eliminar).
- `resumen.md` — 5-8 acciones de mayor impacto para la próxima sesión de escritura, priorizadas.

## Reglas
- Español académico formal, en la voz del documento.
- Nada de "humanizar para evadir detección de IA": no es parte de este workflow.
- Si algo no se puede verificar, se marca como pendiente; no se afirma.
