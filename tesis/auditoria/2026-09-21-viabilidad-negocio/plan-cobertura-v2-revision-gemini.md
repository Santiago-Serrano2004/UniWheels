# Revisión Técnica y Dictamen del Plan de Cobertura de Riesgos v2 (Gemini)

**Fecha:** 2026-09-21  
**Documento auditado:** `tesis/auditoria/2026-09-21-viabilidad-negocio/plan-cobertura-v2-claude.md`  
**Documentos de referencia:**  
- `tesis/auditoria/2026-09-21-viabilidad-negocio/plan-cobertura-critica-gemini.md` (Crítica Gemini v1)  
- `tesis/auditoria/2026-09-21-viabilidad-negocio/plan-cobertura-critica-codex.md` (Crítica Codex v1)  
- `tesis/auditoria/2026-09-21-viabilidad-negocio/CONSOLIDADO.md`  

---

## (a) Evaluación de la incorporación de las correcciones de Gemini (6/6)

Todas las 6 observaciones y correcciones formuladas por Gemini en la revisión de v1 fueron incorporadas de forma exhaustiva, sustancial y precisa:

1. **Protocolo de Liquidación (Omisión Rec. 4 de `CONSOLIDADO.md`):**  
   * *Estado:* **Totalmente incorporado.**  
   * *Evidencia:* Se elevó a **GATE 0 (0.1 [DOC + HUMANO])**, estableciéndolo como requisito previo a cualquier manejo de dinero. Incluye reglas para cobros fallidos/duplicados, cancelaciones, devoluciones y saldos negativos.

2. **Trampa económica en pagos con tarjeta vs. circuito cerrado:**  
   * *Estado:* **Totalmente incorporado y resuelto con postura clara.**  
   * *Evidencia:* En **1.1**, el plan adopta como recomendación explícita deshabilitar pagos de tarifas de viaje con tarjeta en la app (dejando el 100% de viajes P2P en efectivo/Nequi/Daviplata) y limitar Wompi exclusivamente a la recarga de saldo prepago de comisión para conductores (`WR-`). Esto elimina la contradicción de saldos de ganancia no retirables.

3. **Inversión y precedencia en el orden de prioridades (RC-1 y RC-3):**  
   * *Estado:* **Totalmente incorporado.**  
   * *Evidencia:* En Gate 1, la nota legal `1.2 [DOC]` precede a la decisión `1.1 [HUMANO]`. En Gate 2, el borrador de protocolo `3.1 [DOC]` precede formalmente a la reunión institucional con Bienestar/Jurídica `3.2 [HUMANO]`.

4. **Sobrediseño en menores de edad (RC-8):**  
   * *Estado:* **Totalmente incorporado.**  
   * *Evidencia:* En Gate 4, **8.1 [HUMANO]** adopta la postura pragmática de restringir el piloto exclusivamente a mayores de 18 años, postergando el flujo complejo de tutores para una etapa institucional posterior.

5. **Conciliación Wompi fuera del backlog post-piloto (1.4):**  
   * *Estado:* **Totalmente incorporado.**  
   * *Evidencia:* Se retiró del backlog post-piloto y se integró en **GATE 1 (1.4 [MIXTO])** como condición técnica previa al primer cobro de dinero real.

6. **Reclasificación de infraestructura como [MIXTO] (RC-4):**  
   * *Estado:* **Totalmente incorporado.**  
   * *Evidencia:* Tareas **4.1**, **4.2** y **4.3** en Gate 3 están catalogadas como `[MIXTO]`, delimitando la configuración externa en consola Cloudflare/VM Oracle del código en scripts y Nginx.

---

## (b) Evaluación de la incorporación de las correcciones de Codex (9/9)

Desde la perspectiva de un auditor y revisor independiente, las 9 críticas de Codex fueron absorbidas no solo formalmente sino en su arquitectura conceptual profunda:

1. **Especificación viable de conciliación e idempotencia (Punto 1 Codex):**  
   * *Incorporación:* **1.4 [MIXTO]** incluye la persistencia completa de eventos/payloads de webhooks (no solo `APPROVED`), la corrección de unicidad del ID externo de Wompi frente a la no-unicidad actual de `reference_id`, y la conciliación contra la API autorizada de Wompi.

2. **Tratamiento integral de flujos de dinero y contracargos (Punto 2 Codex):**  
   * *Incorporación:* **1.1** desglosa cada flujo por separado (recarga `WR-`, tarifa `TP-`, P2P), **1.3 [MIXTO]** traslada esto al backend/ledger/UI de forma integral, y **1.5 [MIXTO]** establece política y responsable de contracargos antes del asiento técnico de reverso.

3. **Límites operativos más allá de los T&C (Punto 3 Codex):**  
   * *Incorporación:* **2.1 [HUMANO]** define materialmente elegibilidad, cálculo de tarifas, métodos de pago, conductores y territorio; **2.2 [DOC]** queda supeditado a plasmar esa realidad.

4. **Secuencia y alcance real del SOS (Punto 4 Codex):**  
   * *Incorporación:* **3.3 [MIXTO]** contempla las dos bifurcaciones reales señaladas por Codex: (a) integración de despacho trazable con acuse si la UNAB participa, o (b) aviso transparente y descarte de falsas expectativas si solo opera con 123/contacto personal.

5. **Infraestructura como despliegue operativo y aislamiento R2 (Punto 5 Codex):**  
   * *Incorporación:* **4.1** explicita bucket y tokens en R2 separados del almacenamiento de documentos vehiculares; **4.3** define un entorno aislado con criterios de éxito claros para el *restore drill*.

6. **Bloqueo efectivo y paridad de la app móvil (Punto 6 Codex):**  
   * *Incorporación:* **6.1 [HUMANO]** exige la decisión explícita de no distribución pública de la app móvil en el piloto web; y si se distribuye, **6.2** supedita el lanzamiento a push nativo y SOS integrado.

7. **Alcance real backend/web/móvil y minimización en 18+ (Punto 7 Codex):**  
   * *Incorporación:* **8.2 [MIXTO]** detalla las modificaciones en migración de base de datos (`users`), `RegisterRequest`, `AuthController`, `RegisterForm.jsx` y flujo móvil, respetando la minimización de datos si no se requiere.

8. **Instrumentación y metodología previa para sesgo/disparidad (Punto 8 Codex):**  
   * *Incorporación:* **9.1 [DOC]** crea primero el inventario de atributos del motor de matching y **9.2 [MIXTO]** condiciona la medición a la previa instrumentación de eventos agregados (ofertas, rankings, cancelaciones).

9. **Estructuración en Puertas (Gates) de salida operacional (Punto 9 Codex):**  
   * *Incorporación:* El documento abandonó la lista lineal plana y se reestructuró en **7 Gates secuenciales (Gate 0 a Gate 6)**, asegurando que ningún desconocido participe antes de cumplir las condiciones jurídicas, institucionales, técnicas y operativas.

---

## (c) Análisis de integridad: ¿Queda algo pendiente o nuevo por resolver?

1. **Coherencia interna:** La dependencia entre Gate 0 (Protocolo de Liquidación) y Gate 1 (Decisión 1.1) está claramente descrita: el agente puede redactar el borrador base y la nota legal (1.2), sobre la cual Santiago toma la decisión 1.1, cerrando 0.1 antes de habilitar recargas.
2. **Viabilidad técnica y humana:** Las responsabilidades asignadas a los agentes ([DOC], [CODE], partes técnicas de [MIXTO]) y al humano ([HUMANO], gestiones UNAB, aprovisionamiento Cloudflare) son 100% ejecutables y no presentan puntos ciegos.
3. **Foco del alcance:** Las exclusiones (payout bancario, refactor de frontend, paraderos, SheWheels) protegen el tiempo del tesista sin comprometer la seguridad ni la viabilidad regulatoria del piloto.

---

## (d) Veredicto Final

### **APROBADO SIN RESERVAS PARA FASE DE IMPLEMENTACIÓN.**

El Plan de Cobertura v2 (`plan-cobertura-v2-claude.md`) representa una síntesis madura, rigurosa y exhaustiva del consenso entre Claude, Codex y Gemini. Satisface el 100% de los requisitos técnicos, regulatorios, de infraestructura y de producto necesarios para ejecutar la fase de remediación previa al piloto.
