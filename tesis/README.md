# Tesis / Proyecto de grado — UniWheels

Anteproyecto PG-I: *"UniWheels: Diseño e implementación de una plataforma de carpooling
en tiempo real para la optimización de la movilidad en la comunidad UNAB"*.
Autor: Santiago Serrano Ortiz. Director: Julian Santiago Santoyo Diaz.
Asesor metodológico: Jorge Andrick Parra Valencia. UNAB, Bucaramanga.

## Fuente de verdad: el Google Doc

- Documento canónico: el Google Doc compartido (id `1MDoLTcFMQVPcnajJJryyJA4Ok9l243M9OR-3HRO3GX0`).
- Ahí escribe **solo Santiago**. El director y el asesor **comentan dentro del Doc**.
- Versionado nativo del Doc (*Archivo → Historial de versiones*). Usa versiones con nombre en hitos.
- **Nadie edita esta carpeta como si fuera el documento. Aquí no se redacta la tesis.**

## Carpetas

- `export/` — snapshots del Doc (una dirección, Doc → repo):
  - `proyecto-de-grado_latest.pdf` / `.md` y copias con fecha. El `.md` es lo que leen los agentes.
  - Se generan con `scripts/snapshot.py`.
- `guias/` — guías institucionales bajadas de la subcarpeta `guias/` del Drive (`scripts/sync_guias.py`):
  - `rubrica.md` — **rúbrica de auditoría** derivada de la plantilla PG-I (estructura, límites de palabras, contenido mínimo por apartado). Versionada.
  - `_txt/` — guías convertidas a texto (plantilla, APA 7, objetivos, marco teórico, TRL, presupuesto, gestores). Versionado.
  - Los originales (`.pdf/.docx/.html`) están en `.gitignore`; se re-descargan con `sync_guias.py`.
- `notas/` — material de trabajo: `esquema.md`, `argumentos.md`, `comentarios-director.md`, `pendientes.md`, `protegido.md` (lo que NO se debe reescribir).
- `auditoria/<fecha>/` — salidas de `/tesis-auditar`.
- `scripts/` — `snapshot.py`, `sync_guias.py`, `config.json` (local, ignorado), `sa-key.json` (local, ignorado). Ver `SETUP.md`.

## Flujos

**Publicar versión** (cuando tú quieras, no automático):
```
tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py
```
Exporta el Doc → PDF + MD en `export/` → sube el PDF como nueva versión de `Proyecto_de_grado.pdf`
en la carpeta compartida (mismo enlace) → commit del snapshot si cambió.
Flags: `--local-only` (no toca Drive), `--no-commit`.

**Auditar** (a demanda):
```
/tesis-auditar            # todo el documento
/tesis-auditar 6.2        # solo un apartado
```
Trae el snapshot, contrasta cada apartado con `guias/rubrica.md` + normas de redacción (búsqueda web) +
coherencia con el código de UniWheels, revisa APA 7, y delega la verificación de cada cita en el agente
`tesis-citas`. Produce en `auditoria/<fecha>/`: `checklist.md`, `cambios-propuestos.md` (ANTES/DESPUÉS
listo para pegar como Sugerencias), `citas.md`, `resumen.md`. **No escribe en el Doc.**

**Aplicar cambios**: tú pegas los bloques DESPUÉS en el Doc en **modo Sugerencias**, para que el
director y el asesor los revisen y acepten.

## Alcance del apoyo con IA

Los agentes ayudan a **auditar y mejorar** la redacción propia: estructura, contenido por rúbrica,
argumento, APA 7, verificación de fuentes, coherencia con el código. **No** se "humaniza" texto para
evadir detectores de IA. La defensa ante un falso positivo es la procedencia: historial de versiones
del Doc + snapshots con fecha en git.

APA 7: skill `academic-thesis-apa7`, `guias/_txt/Guia-Normas-APA-7ma-edicion.txt`, https://normasapa.in/
