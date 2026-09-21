# Auditoría de viabilidad de negocio de UniWheels — Consolidado final

Fecha: 2026-09-21. Elaborado por Claude a partir de 3 auditorías independientes (Claude, Gemini/agy,
Codex), cada una sobre un tercio de una lista de 25 categorías / ~180 subtemas construida en 3
rondas sucesivas de extensión (Claude → agy → Codex). Documentos fuente completos:

- `tesis/notas/viabilidad-negocio/v3-codex.md` — lista final de temas (no respuestas).
- `tesis/auditoria/2026-09-21-viabilidad-negocio/audit-claude.md` — categorías 3, 4, 6, 7, 10, 11, 13, 16, 17, 19, 24.
- `tesis/auditoria/2026-09-21-viabilidad-negocio/audit-gemini.md` — categorías 1, 2, 5, 9, 12, 14, 15, 25.
- `tesis/auditoria/2026-09-21-viabilidad-negocio/audit-codex.md` — categorías 8, 18, 20, 21, 22, 23.

---

## 0. Advertencia de calidad de fuentes (leer antes que todo lo demás)

Los tres informes NO tienen el mismo nivel de verificabilidad y **no deben citarse en la tesis con
el mismo peso**:

- **`audit-codex.md`** es el más confiable en términos de hechos verificables: cada conclusión cita
  archivo y línea real del repositorio. Se puede comprobar abriendo el código. Trátese como
  evidencia técnica sólida.
- **`audit-claude.md`** (este mismo agente) es razonamiento de negocio a partir de lo ya conocido
  del proyecto — útil como criterio y síntesis, pero no aporta datos externos nuevos ni verificados;
  trátese como opinión experta razonada, no como dato duro.
- **`audit-gemini.md`** contiene el marco legal/regulatorio colombiano general (leyes, decretos,
  principios) que es plausible y **vale la pena que un abogado lo confirme**, pero también incluye
  un volumen alto de **cifras extremadamente específicas sin fuente verificable**: porcentajes de
  encuesta ("82% de las pasajeras...", "68-78% de las estudiantes...") atribuidos a
  `ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md` — que es el **diseño del instrumento, no resultados
  reales todavía** (la encuesta no se ha aplicado), números de radicado de conceptos jurídicos de
  MinTransporte, y cifras de financiamiento de startups ("Vai levantó $530.000 USD en 2023"). Estas
  cifras tienen un patrón típico de alucinación de LLM con falsa precisión. **Recomendación: usar el
  razonamiento cualitativo de `audit-gemini.md` (qué riesgos existen y por qué), pero no citar
  ninguna cifra específica de ese documento en la tesis sin verificarla primero contra una fuente
  primaria real.** Esto no invalida los riesgos identificados — la lógica detrás de cada uno es
  sólida — pero sí invalida los números decorativos que los acompañan.

---

## 1. Resumen ejecutivo

UniWheels es técnicamente un proyecto de grado ambicioso y ya sustancialmente construido (6
microservicios, IA de ruteo, pagos reales, app móvil en desarrollo). La auditoría de negocio
confirma que la arquitectura de producto es razonable para un piloto universitario cerrado, pero
identifica **un problema estructural que las tres auditorías, trabajando de forma independiente,
encontraron por caminos distintos y coinciden en señalar como el más importante**: el modelo actual
de dinero (comisión debitada de una billetera prepago mientras el pago real del viaje ocurre fuera
de la plataforma, en efectivo o transferencia P2P, sin verificación ni posibilidad de retiro) es a
la vez el mayor riesgo de negocio (el conductor no puede convertir su "ganancia" en dinero real),
el mayor riesgo técnico (nada impide que el conductor subdeclare viajes) y el mayor riesgo legal/
regulatorio (roza la captación de dineros de terceros sin autorización, según el marco legal citado
por Gemini). Resolver esto — no necesariamente con una pasarela de desembolso completa, sino al
menos con una decisión clara y comunicada de qué es y qué no es el saldo — es la recomendación
número uno de todo este ejercicio.

El segundo hallazgo transversal es que **el proyecto no tiene todavía ningún acuerdo institucional
formal con la UNAB** (ni aval jurídico, ni protocolo de incidentes, ni rol operativo de Bienestar
más allá de aprobar vehículos) — y varias de las mitigaciones de negocio más efectivas (parqueadero
preferencial, subsidio de comisión, aval legal) dependen enteramente de que ese acuerdo exista.

El tercer hallazgo transversal es que la infraestructura actual (una sola VM gratuita, backups sin
copia externa, TLS incompleto) es apropiada para una demostración de tesis pero **no debe usarse
para aceptar dinero real de usuarios no controlados** hasta cerrar esas brechas — esto ya se sabía
parcialmente de sesiones anteriores de este mismo proyecto, y la auditoría de Codex lo confirma con
evidencia de código adicional.

---

## 2. Riesgos críticos consolidados (deduplicados y priorizados)

Cuando el mismo riesgo de fondo fue detectado independientemente por más de un agente desde un
ángulo distinto, la confianza en que es real sube considerablemente — se marca como **[convergente]**.

### RC-1. El dinero de la plataforma no es verificable ni retirable — riesgo de negocio, técnico y legal a la vez **[convergente: los 3 informes]**
- **Negocio** (`audit-claude.md` 3.7, 3.11): un conductor no puede convertir su saldo en dinero real
  hoy; esto reduce el incentivo de oferta más que cualquier otro factor.
- **Técnico** (`audit-codex.md` 20.1, 20.3, 20.4, 20.6, **ambos marcados RIESGO CRITICO**): no existe
  conciliador entre Wompi/banco/ledger, no hay manejo de contracargos, no hay endpoint de
  devolución/payout, y el margen del 12% no es margen neto una vez se contabiliza esto.
- **Legal** (`audit-gemini.md` 5.13, **RIESGO CRITICO**): sin catalogar jurídicamente el saldo como
  "anticipo de servicio tecnológico" o "billetera de circuito cerrado", administrar fondos de
  terceros sin autorización puede rozar el delito de captación masiva (Art. 316 C.P.) — *marco legal
  general plausible, radicados/artículos específicos sin verificar*.
- **Recomendación**: antes de aceptar dinero de cualquier usuario fuera del círculo de máxima
  confianza del tesista, decidir y comunicar explícitamente: ¿el saldo es retirable? ¿Cómo se
  concilia diariamente contra Wompi? ¿Qué pasa con un contracargo? No requiere resolver todo esto
  con ingeniería nueva de inmediato — requiere una decisión de producto documentada y una
  comunicación honesta al usuario, que sí es barata de hacer ya.

### RC-2. Clasificación regulatoria como transporte no autorizado **[audit-gemini.md, con eco cualitativo en la matriz de riesgo de audit-claude.md 10.1]**
- La línea entre "reparto de gastos entre universitarios" y "transporte remunerado individual" es
  delgada en la legislación colombiana citada (Ley 336/1996, Ley 769/2002). Mitigación sugerida:
  redactar Términos y Condiciones que enmarquen la tarifa como reparto de costos de rodamiento y la
  comisión como pago por servicio tecnológico, no como explotación de transporte.
- *Nota de calidad*: el marco legal general es razonable; verificar con un abogado los radicados y
  artículos exactos antes de citarlos en la tesis.

### RC-3. Ausencia de protocolo institucional de incidentes y de aval formal de la UNAB **[convergente: audit-claude.md 6.2 + audit-codex.md 8.4/23.7 + audit-gemini.md 5.6]**
- El botón SOS es una capacidad técnica sin protocolo humano detrás. No hay mesa de ayuda, SLA,
  turnos ni responsable identificado para un incidente de seguridad, disputa económica o accidente.
  Tampoco existe una resolución de Rectoría/Bienestar que avale formalmente la actividad.
- **Recomendación**: esto es más barato de resolver que cualquier desarrollo de software pendiente
  — es una conversación institucional, no código. Priorizar antes de cualquier piloto con
  desconocidos.

### RC-4. Infraestructura de producción insuficiente para manejar dinero/datos reales **[audit-codex.md — 23.2 y 23.5 marcados RIESGO CRITICO, coherente con lo ya vivido en sesiones previas de este proyecto con Oracle/Azure]**
- Backups sin copia externa ni prueba de restauración real; TLS "Flexible" deja el tramo
  Cloudflare→origen sin cifrar pese a transportar ubicación, documentos y pagos.
- **Recomendación**: no aceptar dinero real hasta resolver ambos puntos — son arreglables sin
  rediseño, ya están documentados con pasos concretos en `docker/DEPLOY.md`.

### RC-5. Escasez estructural de oferta de conductores y fuga hacia canales informales **[convergente: audit-gemini.md 2.7/25.2 (ambos RIESGO CRITICO) + audit-codex.md 8.3 + audit-claude.md 16.1]**
- Hay más demanda de pasajeros que oferta de conductores dispuestos a desviarse, y una vez que un
  conductor y pasajero se conocen, el incentivo de coordinar por WhatsApp evitando la comisión es
  alto. El código no implementa ningún mecanismo de abastecimiento de oferta (lista de espera,
  incentivos, campañas) — eso debe resolverse operativamente, no algorítmicamente.
- **Recomendación**: estrategia de lanzamiento concentrada en 2-3 corredores de alta densidad con
  una "flota semilla" de conductores reclutados activamente antes del lanzamiento público (ver
  `audit-claude.md` categoría 16).

### RC-6. La app móvil no puede sostener hoy la promesa de seguridad del producto **[audit-codex.md 22.1, RIESGO CRITICO]**
- La app Expo no tiene seguimiento GPS real, SOS con viaje activo, ni push nativo equivalente a la
  SPA. Lanzar el canal móvil prometiendo las mismas garantías de seguridad que la web sería
  engañoso hoy.

### RC-7. Bus factor: toda la plataforma depende de un solo desarrollador **[audit-claude.md 10.5, tema no cubierto por los otros dos informes — riesgo real y con menor atención de la esperada]**
- Sin documentación de transferencia de conocimiento ni plan de continuidad, el proyecto muere
  técnicamente cuando el tesista se gradúe, independientemente de qué tan bien funcione el negocio.

### RC-8. Datos de menores de edad (16-17 años) sin consentimiento parental explícito **[audit-gemini.md 5.12]**
- Marco legal general (Ley 1581/2012, Código de Infancia y Adolescencia) razonable de tomar en
  serio; el sistema hoy no valida mayoría de edad en el registro. Barato de mitigar (un campo de
  fecha de nacimiento + flujo de consentimiento) frente al riesgo sancionatorio si se ignora.

### RC-9. Riesgo de opacidad/discriminación algorítmica en el matching **[audit-codex.md 21.6 — hallazgo original, no cubierto por los otros dos]**
- El motor de matching ordena por facultad, reputación y modo "solo mujeres". Es una función de
  seguridad legítima, pero sin explicabilidad ni auditoría de disparidad, es un riesgo reputacional/
  legal latente si se percibe como discriminación no consentida.

---

## 3. Convergencias que aumentan la confianza en hallazgos no marcados "crítico"

- **Los tres informes, sin coordinarse, llegan a la misma conclusión estratégica**: el modelo de
  negocio con mayor probabilidad de sostenerse no es cobro P2P puro a estudiantes, sino un modelo
  **B2B2C donde la UNAB subsidia o licencia la plataforma como servicio de bienestar/sostenibilidad**
  (`audit-claude.md` 3.3/3.4, `audit-gemini.md` 14.2/14.3 con casos internacionales, y el propio
  `v3-codex.md` categoría 24.5 sobre parametrización multi-institucional ya presente en el modelo de
  datos). Esta es probablemente la conclusión más importante y mejor respaldada de toda la
  auditoría, más allá de los riesgos críticos individuales.
- **Los tres coinciden en que la densidad geográfica concentrada (pocos corredores) importa más que
  el tamaño total del mercado** para que el matching funcione (restricciones de 500m/15min ya
  codificadas).
- Codex y Gemini coinciden, desde ángulos distintos, en que **TomTom no se elimina con OSRM local,
  solo se complementa** — cualquier proyección de ahorro de costos debe asumir ambos como gastos
  concurrentes, no como sustitutos.

---

## 4. Recomendaciones priorizadas (para actuar, no solo para documentar en la tesis)

1. **Decisión de producto, esta semana, sin código**: ¿el saldo de la billetera es retirable o no?
   Comunicarlo honestamente en la app. (Resuelve el núcleo de RC-1 sin desarrollo nuevo).
2. **Conversación institucional con Bienestar/Jurídica UNAB**: aval formal + protocolo de incidentes
   por escrito antes de cualquier piloto con personas fuera del círculo de máxima confianza.
   (RC-3).
3. **Backups externos + TLS completo** antes de aceptar el primer pago real de un tercero. Ya
   documentado el cómo en `docker/DEPLOY.md`; falta ejecutarlo. (RC-4).
4. **Protocolo de liquidación por escrito** (`audit-claude.md` categoría 17, Escenario E) — barato de
   redactar, éticamente necesario en cuanto hay dinero de terceros de por medio.
5. **Estrategia de lanzamiento concentrada geográficamente + flota semilla**, no apertura general
   desde el día uno. (RC-5).
6. **Redactar Términos y Condiciones con asesoría legal real** enmarcando tarifa/comisión como
   reparto de costos + servicio tecnológico, y agregar validación de mayoría de edad con
   consentimiento parental para menores. (RC-2, RC-8).
7. Todo lo demás (conciliación automatizada, payout bancario, paridad móvil completa, gobernanza de
   IA) es backlog real y bien documentado (`audit-codex.md`), pero no bloqueante para un piloto
   académico cerrado — sí bloqueante para cualquier escalamiento real más allá de la tesis.

---

## 5. Preguntas que ningún agente puede responder (requieren acción humana de Santiago)

- ¿Qué dice realmente el Reglamento de Propiedad Intelectual de la UNAB sobre proyectos de grado?
  (`audit-claude.md` 13.1).
- ¿Bienestar/Jurídica UNAB están dispuestos a avalar formalmente la plataforma? (RC-3, condiciona
  buena parte del modelo B2B2C).
- Resultados reales de `ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md` una vez aplicada — sin esto,
  toda cifra de disposición a pagar/usar en esta auditoría es estimación, no dato.
- Confirmación legal profesional de los puntos marcados RC-1 y RC-2 antes de escribirlos como
  hechos en la tesis (no basarse solo en lo que un LLM cita sin fuente primaria verificada).

---

## 6. Cómo usar esto en la tesis (mapeo directo a la plantilla PG-I)

Ver `audit-claude.md` sección 11.1 para el mapeo detallado. En resumen: Justificación ← categorías
1/2/10; Presupuesto ← categoría 4 (ya en escenarios); Marco teórico/Estado del arte ← categoría 14;
TRL/madurez ← categorías 8/18/22 de Codex, que son literalmente una evaluación de nivel de madurez
tecnológica real del sistema.
