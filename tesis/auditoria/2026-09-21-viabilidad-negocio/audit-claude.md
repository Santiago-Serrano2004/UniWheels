# Auditoría de viabilidad de negocio — Claude

Categorías asignadas: 3, 4, 6, 7, 10, 11, 13, 16, 17, 19, 24 (numeración de `v3-codex.md`).
Formato por item: **Conclusión**, **Confianza**, **Evidencia/razonamiento**.

---

## 3. Modelo de negocio y monetización

**3.1 — Comisión actual (12% carro, "11,5% moto" en spec pero 12% en código).**
Conclusión: la comisión es razonable frente al mercado (Uber/DiDi cobran 20-25% al conductor;
InDriver, más cercano en modelo peer-to-peer, cobra comisiones bajas o nulas al usar precio
negociado). 12% sobre tarifas de $3.500-5.000 COP es baja en términos absolutos ($400-600 COP
por viaje), lo que la hace políticamente aceptable para una comunidad universitaria sensible al
precio, pero también significa que el volumen necesario para generar ingresos relevantes es alto.
**RIESGO CRITICO** (menor, ya reportado por Codex en 3.13): la discrepancia entre "11,5% moto" en
la spec y "12% uniforme" en el código es un riesgo de comunicación/confianza, no solo un bug —
corregirlo antes de cualquier lanzamiento público, cualquiera sea la cifra real elegida.
Confianza: alta (comparación directa con comisiones públicas de competidores).

**3.2 — Modelos alternativos de monetización.**
Conclusión: la suscripción plana no encaja bien con un mercado de bajísimo ticket promedio
($3.500-5.000/viaje) — el usuario esperaría "gratis" y sentiría la suscripción como una barrera
de entrada. El freemium (reserva prioritaria, rutas recurrentes premium) es más viable porque no
excluye al usuario ocasional. La publicidad institucional (ej. Bienestar Universitario pagando
por visibilidad de campañas de seguridad vial dentro de la app) es una fuente adicional de
ingreso de bajo riesgo que no compite con el modelo de comisión.
Confianza: media (razonamiento por analogía con apps de nicho similar, no hay dato duro de
disposición a pagar suscripción en este mercado específico — eso lo debe traer la encuesta).

**3.3/3.4 — Subsidio universitario / modelo B2B2C.**
Conclusión: este es probablemente el modelo de mayor viabilidad real a mediano plazo. Un
mercado tan pequeño y cerrado (una sola comunidad universitaria) tiene bajísimo margen para
sostener una empresa con fines de lucro pura vía comisión; pero es un encaje casi perfecto para
que Bienestar Universitario lo adopte como servicio de bienestar/movilidad sostenible
(justificable institucionalmente: reduce accidentalidad, mejora bienestar, alinea con
sostenibilidad/ESG — ver categoría 15). Si la universidad subsidia la comisión o la absorbe
completamente, el producto se vuelve "gratis para el usuario final" y la fricción de adopción
cae drásticamente. Este es el escenario que más se alinea con el hallazgo 3.9 de agy
(gamificación/incentivos institucionales) y con el "Escenario B" de licenciamiento SaaS de la
categoría 17.
Confianza: media-alta (razonamiento estratégico sólido, pero depende de una decisión política
institucional fuera del control del proyecto).

**3.5 — Unit economics por viaje desde el día uno.**
Conclusión: probablemente NO es positivo por viaje individual si se contabiliza el costo fijo de
infraestructura (servidor, TomTom, dominio) prorrateado a bajo volumen — pero SÍ puede ser
marginalmente positivo por viaje si solo se cuenta el costo variable directo (comisión Wompi por
transacción), ya que $400-600 COP de comisión probablemente supera el costo marginal de una
transacción Wompi de bajo valor. La verdadera pregunta no es "unit economics por viaje" sino
"cuántos viajes/día se necesitan para que el fijo dejede pesar" — ver 4.3.
Confianza: media (sin cifras reales de costo por transacción Wompi confirmadas — encaja con lo
que Codex debe cuantificar en 4.7).

**3.6-3.10 (aportes de agy) — saldo deudor, cobro híbrido, monetización de datos ESG,
gamificación institucional, tarifa dinámica por clima.**
- 3.6: el límite de -$5.000 COP de saldo negativo es una política de crédito operativo mínima
  y razonable para no bloquear al conductor en su primer viaje del día, pero sin un mecanismo de
  cobro forzoso (no hay integración de "recaudo automático" cuando el conductor recarga), el
  riesgo real es que el conductor simplemente abandone la app con deuda pendiente — que en la
  práctica es una pérdida no cobrable, no un "riesgo de cartera" en el sentido financiero
  tradicional (no hay forma legal de perseguir $5.000 COP). Tratarlo como costo de adquisición
  hundido, no como cuenta por cobrar real. Confianza: alta.
- 3.7 (cobro híbrido efectivo/Nequi + comisión en billetera separada): esto es la fragilidad
  estructural más importante del modelo de monetización completo — la plataforma NUNCA ve ni
  controla el dinero real del viaje, solo confía en que el conductor reporte honestamente y
  mantenga saldo prepago para la comisión. Esto es autodeclarativo por diseño. **RIESGO CRITICO**:
  el incentivo económico racional de cualquier conductor es minimizar lo que "cuenta como viaje
  cobrado" para pagar menos comisión, y no hay ningún control técnico que lo impida (coincide con
  el hallazgo técnico 3.15/6.12 de Codex sobre pago P2P no verificable). Este es, en mi
  evaluación, el riesgo de negocio más grande de todo el modelo de monetización actual — más que
  cualquier tema regulatorio. Confianza: alta.
- 3.8 (monetización de datos/ESG a la universidad): viable y de bajo riesgo, pero es un ingreso
  secundario, no un modelo de negocio primario — cuantitativamente pequeño frente al volumen de
  comisiones necesario para sostener infraestructura. Confianza: media.
- 3.9 (incentivos en especie institucionales): fuertemente recomendado como complemento del
  modelo B2B2C (3.3/3.4) — mucho más barato para la universidad que subsidio en efectivo, y con
  mayor "pegajosidad" (un descuento en matrícula genera lealtad de todo un semestre). Confianza:
  media-alta.
- 3.10 (tarifa dinámica por clima/congestión): técnicamente viable (la IA de ruteo ya existe),
  pero riesgosa en un mercado tan sensible al precio y tan pequeño — un recargo por lluvia puede
  sentirse como "surge pricing" abusivo en una comunidad cerrada donde la reputación se daña
  rápido (ver 10.2). Recomendación: si se implementa, debe ser un descuento por oferta abundante
  más que un recargo por escasez, al menos en la fase piloto. Confianza: media.

**3.11-3.18 (aportes de Codex) — modelo de tarjeta sin desembolso, custodia de fondos, comisión
uniforme vs. documentada, precio del desvío, comisión sobre pago externo no verificable,
comunicación de fondos inmovilizados, mezcla de métodos de pago, multiocupación.**
- 3.11/3.12 (saldo no retirable, custodia de fondos): esto es un tema de negocio serio y a la
  vez de cumplimiento (se cruza con 5.13). Un conductor que "gana" plata en una billetera que no
  puede retirar como dinero real percibe la ganancia como falsa o de bajo valor — esto reduce
  directamente el incentivo de oferta (menos conductores activos). **RIESGO CRITICO**: sin un
  camino creíble a "esto se convierte en dinero real en mi cuenta", el atractivo para el
  conductor es mucho menor que competidores donde SÍ hay retiro (Uber, DiDi). Este es un
  problema de propuesta de valor para el lado de la oferta, no solo un detalle técnico pendiente.
  Confianza: alta.
- 3.13: ya cubierto en 3.1.
- 3.14 (precio del desvío $300/min): razonable frente al costo de oportunidad de un
  universitario que ya no cobra por su tiempo a tarifas de mercado laboral, pero conviene
  validar contra el dato real de la encuesta (percepción de "vale la pena" del desvío).
  Confianza: media.
- 3.15/3.16/3.17: ver 3.7 — mismo riesgo estructural, la plataforma solo puede incentivar el
  cumplimiento (depósitos, límites, gamificación de confianza), no forzarlo técnicamente sin
  intermediar el pago real (lo cual requeriría integrar pasarela de dispersión completa, un
  salto de complejidad y costo regulatorio grande, ver 5.15). Confianza: alta.
- 3.18 (multiocupación real): actualmente el modelo económico está diseñado para 1 pasajero por
  reserva; permitir 3+ pasajeros por viaje multiplicaría el ingreso por viaje del conductor sin
  aumentar proporcionalmente el costo del trayecto — es la palanca de unit economics más potente
  disponible, pero requiere trabajo real de ingeniería (evitar dobles reservas del mismo cupo,
  cobro fraccionado). Recomiendo priorizarlo alto en el roadmap de negocio, no solo como mejora
  técnica. Confianza: media-alta.

---

## 4. Unit economics y viabilidad financiera

**4.1 — CAC en mercado universitario cerrado.**
Conclusión: efectivamente más barato que un mercado abierto — hay canales de adquisición casi
gratuitos (inducción de primíparos, correo institucional, redes de bienestar universitario,
boca a boca en un campus físicamente concentrado). El CAC real probablemente esté dominado por
el costo de tiempo humano (community management, aprobación manual de vehículos) más que por
gasto publicitario pago. Confianza: media-alta.

**4.2 — LTV pasajero vs. conductor, roles intercambiables.**
Conclusión: sí son intercambiables (mismo estudiante puede ser conductor unos días — cuando le
toca Pico y Placa a otro, o cuando necesita ingreso extra en examen de finanzas — y pasajero
otros), lo cual es una ventaja de retención poco común frente a plataformas donde los roles son
rígidos (Uber conductor profesional vs. pasajero). El LTV real depende del tiempo de permanencia
en la universidad (4-5 años promedio de carrera) — es un LTV de ciclo de vida limitado pero
predecible, a diferencia de un mercado abierto donde el usuario puede quedarse indefinidamente.
Confianza: media (razonamiento estructural, sin dato de churn real).

**4.3 — Punto de equilibrio de infraestructura.**
Conclusión: dado que actualmente corre en una sola VM de hosting gratuito (ver hallazgo de
Codex 8.8), el punto de equilibrio en la fase piloto es efectivamente $0 de costo de servidor —
el costo real emergerá cuando se necesite escalar más allá de lo que un Always Free tier
soporta, o cuando se activen servicios pagos reales (TomTom a escala, SMS, Wompi). Recomendación
para la tesis: presentar el presupuesto en escenarios (piloto gratuito / escala 500 usuarios /
escala 2000 usuarios) en vez de una sola cifra, dado que la sección de "presupuesto" del PG-I
exige esto de todas formas (11.1). Confianza: alta (coherente con toda la sesión de despliegue
ya documentada en memoria del proyecto).

**4.4 — Costo real de servicios externos a escala.**
Conclusión: NO escalan puramente lineal — TomTom y SMS tienen modelos de tiers por volumen
(más barato por unidad a mayor consumo, hasta cierto punto), mientras que Wompi sí es
esencialmente lineal (porcentaje fijo por transacción). El mayor riesgo de escalamiento no lineal
es el almacenamiento de documentos (R2) y el ancho de banda de mapas, que pueden crecer más
rápido que el número de usuarios activos si no se gestiona bien el cacheo. Confianza: media.

**4.5 — Presupuesto de infraestructura 6/12/24 meses.**
Conclusión: dado que ya existe experiencia reciente y documentada de este mismo proyecto
intentando (y fallando) con Oracle Free Tier y Azure for Students por restricciones de cuenta,
el presupuesto de la tesis debería ser explícito en que el "costo $0" es frágil y no garantizado
a 12-24 meses — un presupuesto realista de tesis debe incluir un escenario de contingencia con
Hetzner (~$4.5 USD/mes) como piso mínimo defendible ante el comité. **RIESGO CRITICO** (de cara
a la sustentación de tesis, no del negocio en sí): presentar un presupuesto que asuma
infraestructura gratuita indefinida es fácilmente cuestionable por un jurado — mejor mostrar que
se conoce el riesgo y se tiene un plan B costeado. Confianza: alta (evidencia directa de esta
misma sesión de trabajo).

**4.6 — Necesidad de capital externo.**
Conclusión: para la fase de tesis/piloto, no se requiere capital externo (los costos son
mínimos y asumibles personalmente o por la universidad). Para cualquier escenario de escalamiento
real post-tesis (categoría 17), sí se requeriría, y las fuentes más realistas son las de
categoría 9 (fondos de emprendimiento) antes que inversión de riesgo privada, dado el tamaño de
mercado limitado de un solo campus. Confianza: media-alta.

**4.7-4.9 (aportes de agy) — comisión de pasarela en microrrecargas, ratio conductor/pasajero,
licencias anuales móviles.**
- 4.7: en microtransacciones (~$10.000-20.000 COP), las comisiones de pasarela colombianas
  (Wompi u homólogos) suelen tener un componente fijo que golpea desproporcionadamente montos
  bajos — es razonable estimar que el costo de procesamiento puede representar 3-6% del monto
  recargado en el rango bajo. Recomendación de negocio: fijar un monto mínimo de recarga que
  diluya el componente fijo (ej. $15.000-20.000 COP mínimo) en vez de permitir recargas muy
  pequeñas. Confianza: media (sin tarifa exacta de Wompi confirmada en esta auditoría — Codex
  puede/debe confirmar la tarifa real leyendo la config/documentación de integración).
- 4.8: la restricción dura de 15 min de desvío acumulado y 500m de radio (ya vista en el código)
  implica que la liquidez requerida por corredor es alta — probablemente se necesite una
  densidad de conductores mucho mayor a la intuición inicial para que el matching funcione bien
  en horas valle. Esto refuerza la recomendación de 16.2 (concentrar el lanzamiento en 2-3
  corredores, no expandir geográficamente de inmediato). Confianza: media.
- 4.9: costos fijos anuales de $99 USD (Apple) + $25 USD (Google, único) son pequeños en
  términos absolutos pero deben aparecer explícitamente en el presupuesto de tesis (refuerza
  4.5/11.1) — son de los pocos costos 100% ciertos y no dependientes de escenarios de
  crecimiento. Confianza: alta.

**4.10-4.17 (aportes de Codex) — conciliación manual, doble efecto financiero, reservas sin
compromiso, presupuesto de mapas multiplataforma, catálogo NHTSA, margen tras incentivos,
sensibilidad al mínimo de recarga, costo de observabilidad.**
Conclusión general: estos hallazgos técnicos de Codex describen, en conjunto, un patrón de
negocio importante: el sistema actual fue diseñado optimizando por velocidad de desarrollo
(delegar la conciliación financiera fina a "trabajo futuro"), lo cual es correcto para un MVP
de tesis, pero **cualquier plan de negocio que proyecte ingresos por comisión a escala real
debe asumir que hoy existe fricción/pérdida de conciliación no cuantificada** (4.10/4.11), que
las reservas sin compromiso económico real generan oferta desperdiciada medible (4.12,
relacionado con no-shows), y que hay costos de "producto operable" (Sentry, Uptime Kuma,
catálogo vehicular, mapas multiplataforma) que normalmente se ignoran en un plan financiero de
estudiante pero que sí son reales a escala (4.13, 4.14, 4.17). Para la tesis, recomiendo un
apartado explícito de "costos de operación no evidentes en el código pero necesarios en
producción real", más que intentar resolver cada uno técnicamente antes de sustentar.
Confianza: alta (son hallazgos técnicos concretos con impacto financiero directo y razonable).

---

## 6. Seguridad, confianza y gestión de riesgo operativo

**6.1 — Antecedentes judiciales del conductor.**
Conclusión: deseable pero probablemente desproporcionado para la fase piloto — la verificación
de antecedentes judiciales en Colombia (consulta pública Policía Nacional/Procuraduría) es
gratuita y automatizable a futuro, pero añade fricción y tiempo de onboarding. Recomendación:
NO bloqueante para el piloto (documentos vehiculares + verificación institucional por correo
@unab.edu.co ya dan una base de identidad razonable en un entorno cerrado), pero sí debe
quedar como ítem explícito del roadmap de confianza antes de cualquier apertura a usuarios
externos a la universidad. Confianza: media-alta.

**6.2 — Protocolo institucional de incidentes.**
Conclusión: este es el hallazgo de mayor brecha operativa de toda la categoría de seguridad. El
botón SOS en código es una capacidad técnica, no un protocolo — sin un acuerdo formal previo con
Bienestar Universitario/Seguridad del campus sobre "qué pasa exactamente cuando alguien presiona
SOS" (¿a quién llega, en cuánto tiempo, quién actúa), la función es cosmética en un incidente
real. **RIESGO CRITICO**: lanzar un piloto público prometiendo "seguridad" sin este protocolo
firmado institucionalmente es un riesgo reputacional y potencialmente legal serio si ocurre un
incidente grave. Confianza: alta.

**6.3 — Disputas económicas (no llegó / sí llegó).**
Conclusión: el tracking GPS real (ya implementado en esta misma sesión de trabajo, spec
`gps-tracking-real.md`) sí da evidencia objetiva razonable para arbitrar la mayoría de casos,
pero **no hay definido quién arbitra ni con qué autoridad** — hoy no existe un flujo de soporte/
disputas en el producto. Confianza: alta (evidencia técnica confirmada, ausencia de proceso
confirmada por ausencia en el código y en la documentación revisada).

**6.4 — Seguro de accidentes para pasajeros.**
Conclusión: este es probablemente el hallazgo de mayor apalancamiento institucional de toda la
categoría 7 también — negociar una póliza colectiva estudiantil que cubra explícitamente
trayectos en vehículo de un tercero (muchas pólizas de seguro estudiantil ya existentes podrían,
sin saberlo, no cubrir esto) sería tanto un diferencial de marketing fuerte como una reducción
real de riesgo legal. Confianza: media (depende de pólizas existentes de la UNAB que no se
auditaron aquí).

**6.5 — Política de suspensión por mal comportamiento.**
Conclusión: el sistema de calificaciones existe pero no hay evidencia de una política de
umbral automático de suspensión (ej. "3 calificaciones bajo 2 estrellas en 30 días =
suspensión temporal"). Es una brecha fácil y barata de cerrar (regla de negocio simple, no
requiere nueva infraestructura). Confianza: media-alta.

**6.6-6.8 (aportes de agy) — cadena de custodia en siniestros, fraude documental, normativa de
casco.**
- 6.6: coincide y refuerza 6.2 — el protocolo con línea 123 y seguro estudiantil debe
  documentarse antes del piloto, no después de un incidente. Confianza: alta.
- 6.7 (suplantación/documento adulterado): riesgo real pero de probabilidad baja-media en un
  entorno cerrado universitario (el costo social de ser descubierto es alto), no priorizar
  sobre 6.2/3.7 en la fase piloto. Confianza: media.
- 6.8 (responsabilidad por casco no reglamentario): riesgo legal real y específico de
  Bucaramanga (alta tasa de motos) — la app debería, como mínimo, incluir un check-list/
  disclaimer explícito de cumplimiento de casco reglamentario antes de confirmar un viaje en
  moto, como mitigación de responsabilidad de la plataforma. Confianza: media-alta.

**6.9-6.16 (aportes de Codex) — finalización unilateral, PIN corto, telemetría como evidencia
débil, fraude P2P, abuso coordinado de reputación, toma de cuenta, documento caducado, ingeniería
social contra Bienestar.**
Conclusión general: estos hallazgos técnicos confirman, desde el ángulo de seguridad, el mismo
patrón de fondo que 3.7 mostró desde el ángulo financiero: **el sistema confía por diseño en el
buen comportamiento del usuario en varios puntos críticos** (finalización de viaje, telemetría,
pago P2P, vigencia documental). Para un piloto cerrado y de bajo volumen esto es un riesgo
aceptable; para cualquier escalamiento más allá de un grupo pequeño y conocido, cada uno de
estos puntos se vuelve una superficie de abuso económico real, no solo teórico. Recomiendo que
el roadmap de "endurecimiento" de estos puntos esté explícitamente condicionado al crecimiento
de usuarios (ej. "antes de superar 200 usuarios activos, resolver 6.9 y 6.15"), no tratado como
deuda técnica genérica sin prioridad. Confianza: alta.

---

## 7. Relación institucional y stakeholders

**7.1 — Rol de Bienestar Universitario.**
Conclusión: hoy es solo "aprobador puntual" (panel de revisión de vehículos ya implementado).
Para que el modelo B2B2C (3.3/3.4) funcione, este rol necesita evolucionar a "co-responsable
operativo" con presupuesto y personal asignado — es una decisión institucional, no técnica, y
es probablemente el paso individual de mayor impacto en la viabilidad de largo plazo del
proyecto. Confianza: alta (estructural, no depende de datos externos).

**7.2 — Postura jurídica de la UNAB.**
Conclusión: no auditable sin conversación directa con el área jurídica de la universidad —
queda como pregunta abierta explícita para Santiago, no una que un agente de investigación
pueda responder de forma remota. **RIESGO CRITICO**: si la universidad decide NO avalar
formalmente la plataforma por temor a responsabilidad derivada, el modelo institucional
completo (7.1, 3.3, 3.4) queda inviable y el proyecto tendría que reposicionarse como
iniciativa 100% independiente del estudiante (más cerca del Escenario A de la categoría 17).
Confianza: alta en el riesgo, sin poder resolverlo (requiere acción humana institucional).

**7.3 — Alianzas (aseguradoras, Metrolínea, otras universidades).**
Conclusión: la alianza más accionable a corto plazo es con una aseguradora para descuento en
SOAT/póliza de conductores UniWheels (barato de negociar, alto valor percibido). La alianza con
Metrolínea/autoridad de movilidad es de bajo valor inmediato (UniWheels no compite ni
complementa directamente el transporte masivo) salvo como narrativa de sostenibilidad/
descongestión para la tesis. Confianza: media.

**7.4 — Gobernanza futura del producto.**
Ver categoría 17 (Escenarios de Salida) — están directamente vinculados; no los repito aquí.

**7.5 — Sponsors de emprendimiento UNAB.**
Ver categoría 9, cubierta por agy.

**7.6-7.8 (aportes de agy) — integración con parqueaderos, vigilancia de porterías, AMB/DTB.**
Conclusión: 7.6 (parqueadero preferencial HOV) es el incentivo institucional de menor costo y
mayor visibilidad diaria disponible — más barato que cualquier subsidio en efectivo y visible
todos los días para el usuario. Recomiendo priorizarlo como la primera alianza institucional a
negociar, por encima incluso de 7.3. 7.7 (vigilancia) es operativamente necesario pero de bajo
impacto estratégico. 7.8 (AMB/DTB) es válido como narrativa de tesis (impacto social/
descongestión) pero de bajo valor comercial directo en el corto plazo. Confianza: media-alta.

---

## 10. Riesgos generales (matriz de riesgo del negocio)

Consolidando probabilidad/impacto cualitativo (alto/medio/bajo) para la matriz de riesgo de la
tesis:

| Riesgo | Probabilidad | Impacto | Nota |
|---|---|---|---|
| 10.1 Regulatorio (transporte remunerado no autorizado) | Media | Alto | Ver categoría 5 (agy) — depende de interpretación legal, no de la tecnología |
| 10.2 Reputacional (incidente de seguridad) | Media-baja | Muy alto | Comunidad pequeña = viralidad negativa rápida; mitigar con 6.2 antes de lanzar |
| 10.3 Abandono/baja adopción | Media | Alto | Solo se puede confirmar con datos reales de la encuesta |
| 10.4 Dependencia de terceros | Alta (ya materializado esta sesión) | Medio | Ya se vivió con Oracle/Azure; mitigable con presupuesto de contingencia (4.5) |
| 10.5 Bus factor (un solo desarrollador) | Alta | Alto | Es el riesgo más seguro y menos discutido de todos — sin plan de transferencia de conocimiento, el proyecto muere técnicamente cuando el tesista se gradúa |
| **Nuevo 10.6** | Confianza real del conductor en el modelo de pago (3.7/3.11) | Media-alta | Alto | Riesgo de negocio no listado explícitamente en v1, mereció categoría propia — el "dinero no retirable" puede matar la oferta de conductores independientemente de todo lo demás |

**RIESGO CRITICO** consolidado (mi selección de los 3 más importantes de TODA mi porción de la
auditoría, no solo de esta categoría): (1) modelo de pago con dinero no verificable ni retirable
(3.7/3.11/6.12), (2) ausencia de protocolo institucional de incidentes (6.2), (3) bus factor de
un solo desarrollador sin plan de continuidad (10.5).
Confianza: alta (síntesis razonada de hallazgos ya evidenciados, no una nueva investigación).

---

## 11. Alineación académica de la tesis (rigor PG-I)

**11.1 — Cómo alimentan estos hallazgos las secciones obligatorias.**
Conclusión: esta auditoría completa (las 3 partes, una vez consolidadas) es directamente
reutilizable para: la sección de **Justificación** (categorías 1, 2, 10 — por qué el problema
importa y por qué ahora), **TRL** (categoría 8/18/22 de Codex — qué tan madura es la
implementación real vs. el diseño), **Presupuesto** (categoría 4 — ya estructurado en
escenarios), y **Marco teórico/Estado del arte** (categoría 14 de agy — benchmarking
internacional). Recomiendo a Santiago mapear explícitamente cada categoría de esta auditoría a
la sección correspondiente de la plantilla PG-I al momento de redactar, en vez de tratarlas
como documentos separados. Confianza: alta.

**11.2 — Validación de hipótesis contra la encuesta.**
Conclusión: no se puede completar esta auditoría sin los datos reales de
`ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md` una vez recolectados — queda como tarea de
seguimiento explícita, no una que esta auditoría (basada en código y razonamiento, no en datos
primarios nuevos) pueda resolver. Confianza: alta en que es una limitación real, no un hallazgo.

**11.3 — Indicadores de éxito medibles para el piloto.**
Conclusión: propongo como mínimo viable para reportar en la sustentación (si se alcanza a
pilotear): (a) número de viajes completados, (b) tasa de repetición de usuarios (¿volvieron a
usarla?), (c) tiempo promedio de espera hasta match, (d) NPS o calificación promedio, (e) al
menos una cifra de reducción estimada de emisiones/costo de transporte auto-reportada por los
usuarios. Estos son medibles con el código ya existente (calificaciones, historial de viajes)
sin desarrollo adicional. Confianza: alta.

---

## 13. Propiedad Intelectual, Activos Intangibles y Aspectos Societarios

**13.1 — Titularidad de derechos de autor en la UNAB.**
Conclusión: no auditable sin leer el reglamento de propiedad intelectual real de la UNAB —
pregunta abierta explícita para Santiago. La práctica común en universidades colombianas es que
el estudiante conserva derechos morales y patrimoniales de sus proyectos de grado salvo que
exista un convenio de investigación financiado que diga lo contrario, pero esto debe
confirmarse, no asumirse. Confianza: baja (sin fuente primaria consultada).

**13.2 — Registro DNDA.**
Conclusión: el registro de software ante la Dirección Nacional de Derecho de Autor en Colombia
es de bajo costo y trámite relativamente simple (declarativo, no constitutivo de derecho, pero
sí da fecha cierta y prueba de autoría). Recomendación: hacerlo es barato y de riesgo casi nulo,
independientemente de qué escenario de negocio (categoría 17) se elija después. Confianza: media.

**13.3 — Registro de marca "UniWheels".**
Conclusión: de baja prioridad mientras el proyecto sea académico/piloto — el costo/beneficio
de un registro marcario formal ante la SIC solo se justifica si se decide el Escenario A o B de
la categoría 17 (spin-off comercial o licenciamiento). No recomiendo invertir en esto antes de
validar el modelo de negocio. Confianza: media-alta.

**13.4 — Estructura societaria (SAS).**
Conclusión: prematuro en esta fase; es un tema a resolver únicamente si el proyecto avanza hacia
el Escenario A de la categoría 17, con asesoría legal especializada en ese momento, no como
parte de la tesis. Confianza: alta (juicio de secuenciación, no requiere investigación externa).

---

## 16. Estrategia Go-to-Market, Lanzamiento y Liquidez Espacial

**16.1 — Flota semilla.**
Conclusión: fuertemente recomendado — sin una masa crítica inicial de conductores (el problema
clásico del "huevo y la gallina", ya identificado en mi propia v1 categoría 8.3), cualquier
lanzamiento fracasará por falta de oferta visible en los primeros días. El incentivo debe ser
no-monetario si es posible (dado el hallazgo 3.11 sobre desconfianza en dinero no retirable) —
mejor un incentivo en especie (3.9) que saldo en la app.

**16.2 — Densidad en corredores troncales.**
Conclusión: totalmente coherente con el hallazgo 4.8 (restricciones de matching de 500m/15min)
— lanzar disperso geográficamente garantiza que el matching falle por falta de densidad. Esta es
probablemente la decisión de lanzamiento más importante de toda la categoría 16. Confianza: alta.

**16.3 — Activación en semanas de inducción.**
Conclusión: ventana de oportunidad de bajo costo y alto alcance (audiencia cautiva de
primíparos) — recomiendo coordinarlo directamente con 7.1 (Bienestar Universitario) como
canal oficial de comunicación, no como campaña independiente del estudiante. Confianza:
media-alta.

**16.4 — Referidos.**
Conclusión: mecánica estándar y de bajo riesgo, pero su efectividad depende de que el usuario
referido perciba valor real e inmediato (choca de nuevo con 3.11 — si el incentivo es saldo no
retirable, el atractivo del referido es menor). Confianza: media.

---

## 17. Escenarios de Salida, Pivote y Continuidad Post-Tesis

Conclusión consolidada sobre los 5 escenarios (A-E): dado el tamaño de mercado real (un solo
campus universitario, ticket promedio bajísimo), el **Escenario C (open source académico) y el
Escenario B (SaaS B2B a otras universidades) son los más realistas y de menor riesgo**; el
Escenario A (spin-off comercial con capital de riesgo) requiere una tesis de inversión que
probablemente no se sostiene con el tamaño de mercado de Bucaramanga solamente (necesitaría
validar tracción multi-campus primero, lo cual es exactamente lo que el Escenario B permite
probar de forma más barata). El Escenario D (pivote B2B corporativo) es interesante como
opción de diversificación de largo plazo, pero es esencialmente un producto distinto (otro
público, otras reglas) y no debería absorber esfuerzo antes de validar el modelo universitario.
El Escenario E (liquidación ordenada) debe existir por escrito independientemente de cuál de
los otros se persiga — es una responsabilidad ética mínima dado que hay dinero real de terceros
(saldos prepago) involucrado. **RIESGO CRITICO**: no tener un protocolo de liquidación
documentado ANTES de manejar dinero real de usuarios es una omisión seria, no un detalle —
recomiendo escribirlo antes del primer piloto con dinero real, no después. Confianza: alta.

---

## 19. Integración Físico-Espacial en los Campus UNAB

Conclusión: de las 3 sub-propuestas, **19.2 (parqueadero preferencial HOV) es la de mayor
relación costo/beneficio** (ver también 7.6 — no cuesta dinero a la universidad, es solo
asignación de espacio ya existente, y es visible diariamente). 19.1 (bahías señalizadas) es
importante para seguridad física real pero requiere inversión de infraestructura menor
(señalización, pintura) que alguien debe presupuestar y aprobar. 19.3 (QR en porterías) es
la de menor prioridad — valor incremental bajo frente a simplemente que el vigilante vea la
app abierta en el celular del conductor. Confianza: media.

---

## 24. Gestión de producto, ejecución y due diligence comercial

**24.1 — "Piloto real" vs. demostración académica.**
Conclusión: esta es la pregunta que estructura todo lo demás. Recomiendo definir explícitamente
un checklist mínimo antes de aceptar el primer pago real de un usuario no controlado (compañero
de clase de prueba): (1) protocolo de incidentes firmado con Bienestar (6.2), (2) protocolo de
liquidación por escrito (17, Escenario E), (3) presupuesto de contingencia de hosting pagado al
menos 1 mes (4.5), (4) aviso de privacidad/términos aceptados explícitamente (5.17 de Codex).
Sin estos 4, cualquier "piloto" debería tratarse como demostración cerrada entre personas de
máxima confianza (amigos del tesista), no como piloto real. Confianza: alta.

**24.2 — Priorización del backlog por riesgo de negocio.**
Conclusión: de todo el backlog técnico identificado en esta auditoría por Codex, priorizaría en
este orden para des-bloquear negocio real (no solo por dificultad técnica): (1) claridad sobre
si el saldo es retirable o no y comunicarlo honestamente (3.11), (2) backups externos ya
identificados como pendientes en sesiones previas, (3) automatización de conciliación básica
(4.10), y dejar explícitamente para después: push nativo móvil, ruteo turn-by-turn perfecto, y
refactor de modularidad de frontend (ya scoped aparte en `specs/`).

**24.3 — Métrica norte.**
Ver 11.3 — mismas métricas aplican.

**24.4 — Disposición de conductores a pagar por usar.**
Conclusión: la encuesta actual (módulo 6) mide disposición a USAR la plataforma, no
específicamente disposición a mantener saldo prepago y aceptar penalizaciones — recomiendo a
Santiago considerar agregar una pregunta específica sobre esto antes de aplicar la encuesta, ya
que es una fricción de negocio distinta a la de adopción general. Confianza: media (depende de
si aún es editable el instrumento).

**24.5 — Due diligence para B2B/SaaS.**
Conclusión: coherente con el Escenario B de la categoría 17 — el código ya tiene bastante
parametrización natural (multi-institución en el modelo de datos, según lo visto en sesiones
anteriores con `InstitutionSeeder`), lo cual es una señal técnica positiva para ese camino de
negocio, más de lo que un tesista promedio suele tener sin planearlo. Confianza: media-alta.
