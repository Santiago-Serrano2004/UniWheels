# Verificación de citas — 2026-09-10

> Regla (`notas/protegido.md` §2): las fuentes ya presentes en el documento están **protegidas**.
> Aquí se verifican y se reportan problemas como observación; **no** se propone sustituirlas.
> Sí se listan al final las citas en texto que **no tienen entrada** y necesitan una.

## A. Entradas de la lista de Referencias (§9)

| # | Referencia (corta) | Tipo | Ámbito | Año ≤6a | Observaciones de verificación |
|---|---|---|---|---|---|
| 1 | Área Metropolitana de Bucaramanga (2026) — Tarifas transporte 2026 | Acto administrativo oficial | Local | ✅ | Errata "Bucarmanga" + falta tilde "Área". Confirmar que el enlace amb.gov.co resuelve y que el acuerdo fija las tarifas citadas ($3.000 / $3.600). APA: quitar "Retrieved... from". |
| 2 | Bucaramanga Metropolitana Cómo Vamos (2025) — Informe movilidad | Informe de observatorio ciudadano | Local | ✅ | **No se cita en el texto** → o se usa o se elimina. Fuente útil para datos de motorización/tiempos: recomendable citarla en §2. |
| 3 | CREG (2026) — Precios de combustibles líquidos | Fuente oficial | Nacional | ✅ | Confirmar que la página CREG reporta el precio de gasolina en Bucaramanga ~$16.049 en la fecha citada. |
| 4 | Dirección de Tránsito de Bucaramanga (2025) — Resolución 017/2025 (pico y placa) | Acto administrativo oficial | Local | ✅ | La resolución es de pico y placa; verificar que respalde la cifra de "640.000 motocicletas / 44 por cada 100 hab." (probablemente esa cifra viene de RUNT, no de la resolución). |
| 5 | Forbes (2023) — App de carros compartidos universitarios (Vai) US$530.000 | Nota de prensa | Nacional | ✅ | Enlace parece truncado ("us530-00"). Corroborar la cifra con una 2ª fuente (comunicado de la startup, La República, etc.). Aceptable como dato puntual de contexto. |
| 6 | Ibáñez Aldecoa Quintana, J. M. (2024) — Niveles de madurez de la tecnología (TRL) | Documento de divulgación (ResearchGate) | Global (ES) | ✅ | Enlazar a la fuente primaria, no a la página de ResearchGate. Verificar autoría/año. Para TRL, preferible citar la fuente canónica (p. ej. escala TRL de la Comisión Europea / NASA) además de esta. |
| 7 | RUNT (2026) — Boletín de Prensa 002 de 2026 | Fuente oficial | Nacional | ✅ | Confirmar que el boletín contiene la cifra del parque de motos del AM de Bucaramanga citada en §2. |
| 8 | UNAB (2026) — "Parquearse mejor es pensar en todos" | Comunicado institucional | Local | ✅ | Confirmar que respalda: desbordamiento de parqueaderos, firma "Parquearse", tarifas $125.000–$150.000. |
| 9 | UTS (2024) — Investigación de mercados transporte informal Bucaramanga | Trabajo de grado (repositorio institucional) | Local | ✅ | Enlace genérico al repositorio (no al documento). Localizar el registro exacto. Verificar los porcentajes citados (70% < 29 años; 54,4%). Fuente regional válida. |

APA 7 transversal a la lista: eliminar el encabezado "**References**"; quitar "Retrieved <fecha>, from" (dejar solo la URL o el DOI); no duplicar el título como contenedor; homogeneizar idioma (todo en español); sangría francesa; orden alfabético (ya está).

## B. Citas en el texto SIN entrada en Referencias  → falta añadirlas

Del **Marco Teórico (§6.1)** — todas sin entrada:
- Litman (2020) · Banco Interamericano de Desarrollo [BID] (2022) · Furuhata et al. (2013) · Shaheen & Cohen (2019) · Newman (2021) · Evans (2004) · ISO/IEC/IEEE 42010 (2022) · Open Geospatial Consortium (OGC, 2011) · Obe & Hsu (2021) · Rigaux et al. (2002) · PostGIS Development Group (2024) · Cordeau & Laporte (2007) · Turnbull (2018).

Acciones:
- Añadir la entrada APA de cada una (varias son libros/normas con referencia estable y conocida).
- `> 6 años` sin ser seminal → buscar equivalente reciente: **Turnbull (2018)** (Docker) → manual/ः doc oficial actual o libro 2021+; **Furuhata et al. (2013)** (ridesharing taxonomy) → complementar con una revisión 2019+; **Rigaux et al. (2002)** → sustituible por Obe & Hsu (2021) que ya está citado.
- Seminales que se pueden mantener con nota: **Evans (2004)** (DDD), **Cordeau & Laporte (2007)** (DARP).

Del **texto-plantilla que quedó pegado** (NO son citas de este proyecto; desaparecen al reescribir §7): Laudon & Laudon (2020), Ulrich & Eppinger (2016), DocuWare (2023), González & Herrera (2022), Ríos et al. (2021), Martínez y Suárez (2020), MinTIC (2022).

## C. Afirmaciones que necesitan cita y hoy no tienen ninguna
- §1/§2: "baja tasa de ocupación vehicular (un solo ocupante por vehículo)" en accesos UNAB → hoy dice "observaciones en accesos universitarios"; formalizar como dato propio (registrar en `notas/protegido.md` §3) **o** citar fuente.
- §3: cese/inviabilidad de Metrolínea → añadir fuente (prensa regional o acto administrativo).
- §6.1: "latencias inferiores a 50 ms" para consultas GiST/ST_DWithin → citar benchmark o marcar como objetivo de diseño propio, no como hecho referenciado.
- §6.1: complejidad "O(N) a O(log N)" con índices GiST → citar (Rigaux et al. u Obe & Hsu).

## D. Verificación individual de enlaces (pendiente)
Las 9 entradas de la lista son URLs institucionales. Requieren abrir cada enlace y confirmar (autor, año, título, y que el contenido respalda la afirmación asociada). No se ejecutó en esta pasada; hacerlo antes de la entrega. Prioridad: #4, #7, #8 (anclan las cifras del planteamiento) y #5 (dato de Vai).
