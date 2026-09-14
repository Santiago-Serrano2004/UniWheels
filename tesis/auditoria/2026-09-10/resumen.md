# Resumen ejecutivo — auditoría 2026-09-10

## Estado
Anteproyecto **a medio hacer**. §1–§5, §6.1 y §9 están redactados para UniWheels (con arreglos).
**§6.2, §6.3, §6.3.1, todo §7 y §8 siguen siendo el texto de ejemplo de la plantilla** (proyecto de "gestión documental", Flutter/Firebase). Eso es lo que domina el trabajo pendiente.

## Acciones por prioridad

1. **Reescribir §7 Diseño Metodológico completo** para UniWheels (enfoque, metodología con cita, fases por objetivo, diseño de ingeniería, variables propias, factibilidad, hitos/TRL, riesgos, validación). Es el capítulo más largo y más incoherente hoy. Guion en `cambios-propuestos.md`.
2. **Reescribir §6.2 Estado del Arte** (carpooling: BlaBlaCar, Waze Carpool, Uber, Vai, literatura indexada) con tabla comparativa y diferenciador de UniWheels.
3. **Reescribir §8 Resultados Esperados** con métricas objetivo y TRL ≤ 5.
4. **Reescribir §6.3 y §6.3.1** (marco legal real: habeas data + Estatuto del Transporte; ética: consentimiento, datos de ubicación, menores de edad).
5. **Corregir el TRL:** §5 dice TRL 6 → la norma exige entre 3 y 5. Bajar a 5 en todo el documento.
6. **Completar §6.1 Marco Teórico** (se corta a mitad de frase), corregir a 6 microservicios, añadir OSRM/TomTom/XGBoost, limpiar artefactos `\#\#\#` y `──────`.
7. **Arreglar §9 Referencias:** ~15 citas del §6.1 no tienen entrada; formato APA (quitar "References" y "Retrieved from", homogeneizar español, errata "Bucarmanga"). Verificar los enlaces que anclan cifras (RUNT, DTB, UNAB, Forbes).
8. **Objetivos específicos:** OE2, OE3 y OE4 exceden 30 palabras; OE2 dice "base de datos relacional" (es geoespacial); OE3 menciona "WebSockets" que el código no implementa. Versiones recortadas en `cambios-propuestos.md`.
9. **§2.1 Árbol del problema:** está vacío. Insertarlo (contenido propuesto en `cambios-propuestos.md`) y añadirlo como anexo.
10. **§5 Delimitación:** la frase de pagos y consultas gubernamentales dice "se incluyen" en una sección de exclusiones — aclarar si entran o no. Alinear el stack ("Laravel" → "Laravel y FastAPI"; "PWA" → PWA real o "SPA").

## Coherencia con el código — hallazgos
- ✅ TomTom Traffic Flow API, OSRM, XGBoost, ALNS/DARP-TW, PostGIS, 6 microservicios: todo existe en el repo.
- ❌ **WebSockets**: el documento los cita (§1, §3, OE3, §5); **no hay implementación** en el código. Corregir o declarar como trabajo futuro.
- ❌ **PWA**: §5 dice "web progresiva"; el frontend es SPA React sin configuración PWA.
- ❌ **App móvil**: el repo tiene `mobile/` (Expo SDK 54); §5 la excluye implícitamente. Decidir alcance.
- ⚠️ §6.1 nombra 4 microservicios; son 6. Omite OSRM y TomTom pese a usarlos.

## No se hizo en esta pasada
- Verificación individual (abrir enlace, confirmar contenido) de las 9 referencias. Pendiente antes de entregar; prioridad RUNT #7, DTB #4, UNAB #8, Forbes #5.
- Investigación web de fuentes indexadas para §6.2 y §7 (se hará al redactar esas secciones).

## Protegido
`notas/protegido.md` está casi vacío. Antes de la próxima auditoría, registra ahí: tus datos propios (observaciones de ocupación en accesos, resultados de encuesta cuando existan) para que no se marquen como "cita faltante", y cualquier apartado que ya des por cerrado.
