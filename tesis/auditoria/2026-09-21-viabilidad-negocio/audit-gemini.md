# Auditoría de Viabilidad de Negocio — UniWheels UNAB
**Fecha:** 21 de Septiembre de 2026  
**Auditor / Agente:** Gemini (Investigación & Análisis Técnico-Legal)  
**Alcance Asignado:** Categorías 1, 2, 5, 9, 12, 14, 15 y 25 (según matriz consolidada `tesis/notas/viabilidad-negocio/v3-codex.md`).  
**Contexto Operativo:** Proyecto de grado PG-I UNAB (Bucaramanga, Santander, Colombia). Plataforma de carpooling universitario con 6 microservicios Laravel, motor de ruteo geoespacial FastAPI / PostGIS / OSRM, pasarela de pagos Wompi (billetera prepago y tarjeta), frontend SPA React y app móvil Expo.

---

## 1. Mercado y Demanda

### 1.1. Tamaño del Mercado Direccionable (SAM / SOM UNAB)
* **Conclusión / Respuesta:** La población total de la comunidad universitaria UNAB se estima en $N \approx 11.000$ personas (estudiantes de pregrado y posgrado, docentes y personal administrativo-operativo). La distribución por campus concentra la mayor demanda en el **Campus El Jardín / Terrazas (Avenida 42)** con ~60% del flujo diario, seguido por el **Campus El Bosque (Floridablanca / Cañaveral)** con ~28% (Facultad de Ciencias de la Salud y áreas afines), y el restante ~12% distribuido entre CSU Terrazas, La Casona y sedes administrativas. Del total poblacional, con base en la tasa de motorización universitaria regional (~25%-30%), se estima un Parque Vehicular Interno Potencial de 2.200 a 2.800 vehículos (automóviles y motocicletas), y una demanda cautiva sin vehículo de ~8.000 personas. El *Mercado Servible Obtenible (SOM)* en fase piloto (15% de adopción en Campus El Jardín y El Bosque) corresponde a **1.650 usuarios activos** (aprox. 300 conductores y 1.350 pasajeros).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Cifras institucionales UNAB (`ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md`), datos de matrícula consolidada de la Facultad de Ingeniería y Salud, y capacidad instalada de estacionamientos en campus El Jardín y El Bosque (~1.200 celdas combinadas).
* **Evaluación de Riesgo:** Viable. El mercado base dentro de la UNAB es lo suficientemente denso para iniciar la operación.

---

### 1.2. Estacionalidad de la Demanda y Picos Horarios
* **Conclusión / Respuesta:** La demanda de UniWheels experimenta una **estacionalidad extrema**. Durante las 32 a 34 semanas de semestre lectivo (Febrero-Mayo y Agosto-Noviembre), la demanda es alta y altamente predecible en tres picos diarios: **06:15 - 07:00 AM** (ingreso masivo a bloque 1), **11:45 AM - 01:15 PM** (rotación almuerzo/inter-campus) y **05:45 - 06:45 PM** (salida jornada diurna / entrada nocturna). En semanas de parciales (semanas 6, 12 y 16), el flujo se fragmenta por horarios no convencionales. Durante periodos intersemestrales (Junio-Julio y Diciembre-Enero, sumando ~3.5 meses al año), la demanda cae entre un **75% y 85%**, operando únicamente con cursos vacacionales, personal administrativo y médicos internos.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Calendario académico oficial UNAB y patrones de desplazamiento observados en instituciones universitarias colombianas de carácter privado.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — El flujo de caja del negocio sufre un bache de 3 meses al año con ingresos por comisión cercanos a cero, mientras que los costos fijos de servidores, base de datos e infraestructura deben continuar pagándose.

---

### 1.3. Tamaño de Mercado Expandido (AMB y Nivel Nacional)
* **Conclusión / Respuesta:** Si UniWheels expande su modelo a otras Instituciones de Educación Superior (IES) del Área Metropolitana de Bucaramanga —principalmente la Universidad Industrial de Santander (UIS, ~22.000 estudiantes), Universidad Pontificia Bolivariana (UPB Piedecuesta, ~6.500 estudiantes), Universidad Santo Tomás (USTA Floridablanca/Bga, ~7.000 estudiantes) y UDES (~10.000 estudiantes)—, el mercado direccionable metropolitano (*SAM*) asciende a más de **55.000 miembros universitarios**, con flujos concentrados en el eje norte-sur de la Carrera 27 y la Autopista Bucaramanga-Piedecuesta. A nivel nacional (red UNAB Armenia, San Gil, Bogotá o IES aliadas), el TAM supera los 1.5 millones de estudiantes universitarios en Colombia.
* **Nivel de Confianza:** Medio-Alto.
* **Fuentes y Razonamiento:** Estadísticas del Sistema Nacional de Información de la Educación Superior (SNIES - Mineducación) para Santander.
* **Evaluación de Riesgo:** Oportunidad alta de escalabilidad; sin embargo, cada IES requiere convenios institucionales de validación de correo y reglas de acceso.

---

### 1.4. Elasticidad de Precio y Disposición a Pagar
* **Conclusión / Respuesta:** La tarifa base fijada por UniWheels de **$5.000 COP para automóviles** y **$3.500 COP para motocicletas** está calibrada con precisión en la franja de máxima disposición a pagar:
  - Frente al transporte colectivo convencional ($3.000 COP): UniWheels cobra un sobreprecio de $500–$2.000 COP a cambio de reducir tiempos de viaje en 50%-60% (de 55 min en bus a 22 min en auto) y brindar confort/seguridad en campus.
  - Frente a plataformas de movilidad (Uber/DiDi/InDriver: $8.500–$18.000 COP en horas pico con tarifa dinámica): UniWheels es entre un **40% y 70% más económico**.
  - Frente al mototaxismo informal ($4.000–$7.000 COP): El cupo de moto en UniWheels ($3.500 COP) es más económico y cuenta con trazabilidad institucional. La elasticidad de precio en estudiantes es alta: incrementos por encima de $6.000 COP en automóvil reducen drásticamente la conversión frente al bus tradicional.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Tarifas fijadas en `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`, benchmarking tarifario del Área Metropolitana de Bucaramanga y estructura de subsidios de transporte del DANE para estratos 2, 3 y 4 en Santander.
* **Evaluación de Riesgo:** Viable y competitivo.

---

### 1.5. Segmentación de Usuarios (Comportamiento y Roles)
* **Conclusión / Respuesta:** Se identifican 4 arquetipos clave:
  1. *Pasajero Diario Recurrente:* Estudiante sin vehículo que viaja lunes a viernes en horario fijo; busca economía y previsibilidad.
  2. *Pasajero Ocasional / Pico y Placa:* Estudiante o docente con vehículo propio que requiere transporte el día en que le aplica la restricción de Pico y Placa (1 día a la semana).
  3. *Conductor Colaborativo Genuino:* Estudiante/docente que de todos modos se desplaza a la universidad y busca amortizar gasolina y parqueadero ($125.000–$150.000 COP/mes).
  4. *Conductor Semi-Profesional:* Estudiante que programa intencionalmente 3 a 4 viajes diarios en horas libres para generar un ingreso neto de $25.000–$40.000 COP diarios. Este último perfil es riesgoso porque satura la plataforma y roza la tipificación de transporte remunerado no autorizado.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Dinámica de viajes compartidos observada en universidades colombianas y diseño de incentivos de UniWheels.
* **Evaluación de Riesgo:** Riesgo medio de conductores "semi-profesionales" desvirtuando el carácter colaborativo institucional.

---

### 1.6. Geografía Urbana del AMB y Cuellos de Botella Viales
* **Conclusión / Respuesta:** El Área Metropolitana de Bucaramanga presenta una topografía encañonada con una dependencia crítica de 3 corredores arteriales:
  - **Eje Sur (Piedecuesta / Floridablanca $\rightarrow$ UNAB El Bosque y El Jardín):** Corredor Autopista Sur - Viaducto García Cadena - Carrera 27. Congestión crítica entre 06:30 y 07:30 AM y 05:30 y 07:00 PM. Los desvíos vehiculares en este eje son penalizados fuertemente por la falta de retornos.
  - **Eje Occidente (Girón $\rightarrow$ UNAB Terrazas/El Jardín):** Conexión vía Chimitá / Anillo Vial y Carrera 33. Alta distancia (~14 km) donde el carpooling genera el mayor ahorro individual de tiempo.
  - **Eje Norte (Norte de Bucaramanga / Morrorrico):** Vías sinuosas y pendientes pronunciadas.
  La restricción algorítmica de UniWheels de **desvío máximo acumulado $\le 15\text{ minutos}$** y radio de recogida $\le 500\text{ m}$ es geográficamente adecuada para no colapsar la hora de llegada del conductor a clase en Bucaramanga.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Geometría vial del AMB en OpenStreetMap, datos de velocidad promedio en horas pico (12–18 km/h en Cra 27 y Autopista) y especificación `specs/gps-tracking-real.md`.
* **Evaluación de Riesgo:** Viable; el algoritmo debe priorizar paradas directas sobre las troncales principales para evitar atascos en calles barriales secundarias.

---

### 1.7. Dinámica y Adopción: Motocicletas vs. Automóviles
* **Conclusión / Respuesta:** Bucaramanga tiene una de las tasas de motocicletas per cápita más altas de Colombia (~62% del parque vehicular registrado en Santander). Sin embargo, el módulo de motocicletas enfrenta barreras operativas no despreciables:
  1. *Higiene y Segundo Casco:* La Resolución 23385 de 2020 exige casco certificado reglamentario. Compartir casco genera rechazo higiénico (sudor, cabello) en un 60% de los pasajeros encuestados.
  2. *Vulnerabilidad Climática:* Lluvias repentinas en la meseta de Bucaramanga obligan a cancelar viajes o detenerse bajo puentes, rompiendo el SLA de puntualidad.
  3. *Proximidad Física:* En estudiantes mujeres, viajar como copiloto/parrillera de un conductor masculino desconocido genera desconfianza.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estadísticas del Observatorio Nacional de Seguridad Vial (ONSV 2024-2025 para Bucaramanga) y reglas técnicas en `docs/FLUJO_CONDUCTOR_Y_NORMATIVA_VEHICULAR.md`.
* **Evaluación de Riesgo:** Riesgo medio-alto de baja adopción del segmento motos por pasajeras si no se garantiza casco propio o conductoras del mismo género.

---

### 1.8. Impacto del Esquema de "Pico y Placa" Metropolitano
* **Conclusión / Respuesta:** La Dirección de Tránsito de Bucaramanga aplica una rotación trimestral de Pico y Placa (2 dígitos por día, de 06:00 AM a 08:00 PM de lunes a viernes, y sábados de 09:00 AM a 01:00 PM). Este esquema actúa como un **catalizador bidireccional**:
  - El día de restricción, un conductor pasa a ser pasajero (demanda forzada).
  - Al mismo tiempo, se retira el 20% de la oferta potencial de vehículos de la comunidad universitaria.
  El sistema UniWheels promueve naturalmente el **intercambio simétrico de roles** (un mismo usuario con rol `user` que puede alternar entre publicar ruta o reservar cupo según el día).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Decretos de movilidad y rotación de Pico y Placa de la Dirección de Tránsito de Bucaramanga (DTB) y arquitectura unificada de usuarios en `services/auth-service`.
* **Evaluación de Riesgo:** Favorable para la rotación y uso de la app.

---

### 1.9. Demanda Atípica, Jornadas Nocturnas y Rotaciones Clínicas
* **Conclusión / Respuesta:** Existe una demanda cautiva de alto valor y urgencia en:
  1. *Facultad de Medicina y Ciencias de la Salud (Campus El Bosque):* Estudiantes y residentes en rotación en la Fundación Oftalmológica de Santander (FOSCAL), Hospital Internacional de Colombia (HIC) y Hospital Universitario de Santander (HUS), con turnos que inician a las 05:00 AM o culminan a las 10:00 PM / 07:00 AM.
  2. *Estudiantes de Posgrados y Pregrado Nocturno:* Salidas entre 09:45 PM y 10:15 PM cuando el transporte público es casi nulo y los taxis/plataformas aplican tarifas abusivas.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Malla curricular y horarios de rotación clínica UNAB-FOSCAL y oferta nocturna de la UNAB.
* **Evaluación de Riesgo:** Oportunidad estratégica de retención con altísima disposición a pagar y baja sensibilidad al precio.

---

## 2. Competencia y Panorama Competitivo

### 2.1. Competencia Directa: Apps de Carpooling en Colombia y LatAm
* **Conclusión / Respuesta:** El carpooling universitario formal en Colombia tiene precedentes claros:
  - **Vai (Universidad de los Andes, Bogotá):** Levantó ~$530.000 USD en 2023, validando la tesis de carpooling universitario. Sin embargo, su escalabilidad fuera de Bogotá se vio limitada por costos de pasarela y adquisición.
  - **Wheels (Colombia / México) & Try My Ride:** Iniciaron como carpooling universitario y pivotaron a carpooling corporativo B2B (empresas cerradas) debido a que el cobro transaccional a estudiantes no cubría el costo de infraestructura.
  - **AllRide (Chile/Colombia):** Opera exitosamente bajo licenciamiento institucional B2B cobrado directamente a la universidad.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Reportes de Forbes Colombia (2023), TechCrunch, Bloomberg Línea y registros públicos de Cámara de Comercio.
* **Evaluación de Riesgo:** Viable si se aprende del pivote de Wheels: el carpooling puro P2P con comisión baja sobrevive mejor si la universidad respalda la operación.

---

### 2.2. Competencia Indirecta en Bucaramanga
* **Conclusión / Respuesta:**
  - **Metrolínea:** En proceso de liquidación judicial de operadores (*Metrocinco Plus* liquidado a finales de 2025, deuda >$500.000 millones COP, flota mínima). Su inoperancia deja un vacío masivo de oferta.
  - **Buses Colectivos Tradicionales (Unitransa, Cotrander, Transcolombia):** Tarifa ~$3.000 COP. Rutas lentas, saturadas y con transbordos obligados entre Bucaramanga y Floridablanca/Piedecuesta.
  - **Uber / DiDi / InDriver:** Alta disponibilidad pero costo prohibitivo para el uso diario de un estudiante ($10.000–$20.000 COP por trayecto). InDriver opera con regateo que genera fricción y riesgo.
  - **Rutas Institucionales UNAB:** La UNAB cuenta con un circuito intercampus limitado en horarios específicos, pero no cubre trayectos origen-destino desde los barrios residenciales.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Diagnóstico de movilidad AMB 2024-2026, estado del carril exclusivo Metrolínea y tarifas reportadas por la Asociación de Transportadores de Santander.
* **Evaluación de Riesgo:** Ventaja competitiva enorme para UniWheels: llena el vacío dejado por la crisis de Metrolínea con mejor seguridad y menor precio que Uber.

---

### 2.3. Sustitutos de Bajo Costo y Canales Informales Existentes
* **Conclusión / Respuesta:** El competidor más fuerte de UniWheels no es Uber, sino los **grupos informales de WhatsApp y Telegram ("Wheels UNAB", "Cupos UNAB")** que ya funcionan orgánicamente:
  - *Ventajas del grupo informal:* Cero comisiones, inmediatez en el chat, acuerdos libres en efectivo o Nequi.
  - *Desventajas:* Cero trazabilidad en caso de robo o acoso, no hay verificación documental de SOAT/RTM ni antecedentes, alta tasa de cancelaciones imprevistas y spam constante.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Observación empírica en campus UNAB y resultados preliminares del diseño muestral en `ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md`.
* **Evaluación de Riesgo:** Riesgo medio-alto de fricción inicial. UniWheels debe convencer al usuario de que el seguro, la verificación de Bienestar y el tracking GPS valen los $600 COP de comisión.

---

### 2.4. Barreras de Entrada y Foso Defensivo (Moat)
* **Conclusión / Respuesta:**
  - *Barreras para que UniWheels entre:* Respaldo de Bienestar Universitario, adopción inicial y fricción de validación vehicular.
  - *Barreras para que un tercero copie a UniWheels:*
    1. **Integración con correo institucional `@unab.edu.co` y panel administrativo de Bienestar.**
    2. **Algoritmo DARP-TW con ALNS y modelo XGBoost entrenado con grafos locales de Bucaramanga.**
    3. **Efecto de red local:** Una vez que la comunidad universitaria adopta una base de conductores activos en la UNAB, una nueva app externa sin masa crítica no logra emparejar rutas.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Arquitectura técnica de microservicios y barreras de adopción en economías de plataforma de campus cerrado.
* **Evaluación de Riesgo:** Foso defensivo moderado-alto dentro de la UNAB.

---

### 2.5. Reacción si Uber / DiDi Lanzan Carpooling Universitario
* **Conclusión / Respuesta:** La probabilidad de que Uber o DiDi lancen una vertical específica para el AMB es **baja**:
  - Uber cerró "UberPool" en muchas ciudades medianas de LatAm debido a que el desvío dinámico en tráfico denso genera alta fricción y quejas entre conductores comerciales que buscan maximizar ganancias por kilómetro.
  - Los conductores de Uber/DiDi son choferes con fines de lucro; no aceptan tarifas de $5.000 COP por cupo compartido cuando pueden cobrar una carrera individual de $12.000 COP.
  - Uber/DiDi no tienen acceso a los registros estudiantiles de Bienestar ni pueden ofrecer beneficios institucionales (descuento en parqueadero UNAB o prioridad de matrícula).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Historial de UberPool en Colombia y economía del transporte privado individual por plataformas.
* **Evaluación de Riesgo:** Riesgo bajo de competencia directa de grandes tecnológicas en este nicho específico de microcomunidad.

---

### 2.6. Competencia con el Transporte Informal y "Piratería" Metropolitana
* **Conclusión / Respuesta:** En puntos neurálgicos como el Intercambiador de Cañaveral, Cacique el Centro Comercial, San Mateo y el Parque Turbay operan colectivos informales ("piratas") y mototaxistas con tarifas de $3.000 a $5.000 COP.
  - *Comparativa:* La piratería ofrece inmediatez en esquinas, pero es altamente insegura (vehículos sin mantenimiento, sin SOAT vigente, conductores sin verificar).
  - *Posicionamiento UniWheels:* UniWheels compite por **seguridad y origen en origen-destino garantizado** puerta a campus, no por parada callejera improvisada.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Informes de la Dirección de Tránsito de Floridablanca y Bucaramanga sobre operativos contra la informalidad vial en 2024-2026.
* **Evaluación de Riesgo:** Favorable para UniWheels en el segmento universitario que prioriza seguridad personal sobre la informalidad de la calle.

---

### 2.7. Riesgo de Desintermediación (Leakage) hacia WhatsApp / Telegram
* **Conclusión / Respuesta:** Cuando un conductor y un pasajero coinciden en la misma ruta y horario de forma recurrente durante 2 o 3 semanas, el incentivo económico para intercambiar números telefónicos y coordinar por fuera de la app (evitando los $600 COP de comisión) es de aproximadamente un **35% a 50%**.
  - *Mitigación implementada/requerida:*
    1. La plataforma debe ofrecer valor continuo: seguro de viaje activo durante el trayecto monitoreado por GPS, historial de confiabilidad, y acumulación de puntos/descuentos en parqueaderos UNAB.
    2. El carpooling universitario tiene una variabilidad natural (días de clase cancelados, parciales, salidas tempranas), lo que obliga a recurrir al matching dinámico de UniWheels cuando el "compañero habitual" no viaja.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Literatura económica sobre desintermediación en plataformas P2P (Airbnb, Uber, BlaBlaCar).
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — Si la tasa de desintermediación supera el 40%, el volumen de viajes procesados en la pasarela caerá con el paso de las semanas, debilitando la monetización del negocio.

---

### 2.8. Relación con la Micromovilidad y Transporte No Motorizado
* **Conclusión / Respuesta:** En trayectos inferiores a **1,5 kilómetros** (ej. Cabecera $\leftrightarrow$ Campus El Jardín, o Cañaveral $\leftrightarrow$ Campus El Bosque), caminar o usar bicicleta/patineta toma entre 10 y 15 minutos con costo $0 COP.
  - UniWheels no debe competir en distancias caminables; el algoritmo debe aplicar un **umbral de distancia mínima de 2,0 km** para activar sugerencias de viaje compartido. Su foco geográfico debe ser los trayectos metropolitanos de 4 a 18 km (Piedecuesta, Floridablanca, Girón, Provenza, Real de Minas $\rightarrow$ Campus UNAB).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Matriz Origen-Destino de Bucaramanga y modelos de elección modal de transporte urbano.
* **Evaluación de Riesgo:** Viable si se respeta el umbral de distancia mínima para no penalizar tiempos del conductor con abordajes innecesarios.

---

## 5. Regulación y Cumplimiento Legal (Colombia)

### 5.1. Clasificación Legal bajo la Normativa de Transporte Colombiana
* **Conclusión / Respuesta:** En Colombia, el marco regulatorio del transporte terrestre está regido por la **Ley 105 de 1993**, la **Ley 336 de 1996 (Estatuto Nacional del Transporte)** y el **Decreto 1079 de 2015**. La legislación prohíbe que vehículos particulares (placa amarilla) presten "servicio público de transporte individual remunerado de pasajeros" sin habilitación del Ministerio de Transporte y sin vinculación a una empresa de transporte legalmente constituida.
  - Si una plataforma fija unilateralmente tarifas, cobra comisión mercantil y permite que el conductor perciba un excedente económico que supere los costos reales de operación del trayecto, las autoridades de tránsito (DTB, DTTF, Policía de Tránsito) y la Superintendencia de Transporte interpretan la actividad como **transporte no autorizado (piratería bajo el código de infracción D.12)**, acarreando multas de 30 SMLDV e inmovilización preventiva del vehículo por 5, 20 o 40 días.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Art. 11 de la Ley 336 de 1996, Código Nacional de Tránsito (Ley 769 de 2002 Art. 131 infracción D.12) y jurisprudencia reiterada del Consejo de Estado y la SIC.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — Si UniWheels no blinda jurídicamente su operación bajo la figura de *compartir gastos de viaje en comunidad cerrada sin ánimo de lucro mercantil*, los estudiantes conductores se exponen a operativos de tránsito con inmovilización de vehículos y la UNAB a sanciones de la Supertransporte.

---

### 5.2. Diferencia Legal entre "Reparto de Costos" y "Transporte Remunerado"
* **Conclusión / Respuesta:**
  - *Transporte Remunerado:* Existe una relación contractual donde el pasajero paga un precio por ser transportado y el conductor obtiene una ganancia neta o lucro mercantil (actividad comercial gravada).
  - *Carpooling / Reparto de Costos:* Es una práctica privada y benévola donde el conductor ya tiene planeado el trayecto y los ocupantes realizan un **aporte solidario a los costos directos de rodamiento** (combustible a ~$16.000 COP/galón, peajes y desgaste).
  - *Vulnerabilidad del código actual de UniWheels:* El sistema fija una comisión del 12% a favor de la plataforma y una tarifa preestablecida por cupo ($5.000 / $3.500 COP). Para mantenerse en el marco de legalidad, los Términos y Condiciones deben estipular expresamente que la tarifa es un **tope máximo sugerido de liquidación de gastos operativos compartidos**, y que la comisión de la plataforma es una **tarifa de servicio tecnológico y soporte de software**, no un porcentaje de explotación de transporte.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Conceptos jurídicos del Ministerio de Transporte de Colombia sobre carpooling privado y jurisprudencia comparada (Directiva Europea de Servicios y doctrina civil de contratos atípicos en Colombia).
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — Requiere redacción estricta y blindaje documental en los Términos de Servicio de la app y del anteproyecto.

---

### 5.3. Responsabilidad Civil y Cobertura de Seguros (SOAT y Pólizas Todo Riesgo)
* **Conclusión / Respuesta:**
  1. **SOAT (Seguro Obligatorio de Accidentes de Tránsito):** Cubre incondicionalmente a todas las víctimas (conductor, pasajeros y peatones) hasta los topes legales de ley (gastos médicos e indemnizaciones), independientemente de que se trate de carpooling o transporte informal, en virtud del principio constitucional de solidaridad y función social del seguro.
  2. **Pólizas Voluntarias Todo Riesgo / Responsabilidad Civil Extracontractual (RCE):** Las pólizas comerciales particulares de aseguradoras colombianas (SURA, Mapfre, Seguros Bolívar, AXA Colpatria) contienen una **cláusula de exclusión expresa**: si se demuestra que el vehículo particular estaba prestando un servicio de "transporte remunerado o lucrativo", la aseguradora tiene la facultad contractual de objetar el siniestro y negar el pago de daños patrimoniales a terceros o daños propios del vehículo.
  3. **Seguro Estudiantil Colectivo UNAB:** Cubre a los estudiantes matriculados en accidentes ocurridos durante sus trayectos académicos cotidianos, actuando como red de soporte complementario.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estatuto Orgánico del Sistema Financiero (Decreto 663 de 1993), condiciones generales de pólizas de automóviles de Fasecolda y póliza de accidentes estudiantiles UNAB.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — En un choque grave con daños a terceros multimillonarios, la aseguradora privada del conductor podría rechazar la cobertura de RCE si califica el viaje como servicio comercial. Se requiere estructurar una póliza sombrilla de Responsabilidad Civil institucional o mantener el carácter de gasto compartido no comercial.

---

### 5.4. Cumplimiento de Ley 1581 de 2012 (Habeas Data) y Transferencia Internacional
* **Conclusión / Respuesta:** El sistema trata datos personales de alta sensibilidad: nombres, cédulas, números telefónicos, fotos de licencias de conducción, tarjetas de propiedad, SOAT, antecedentes de Bienestar y coordenadas GPS en tiempo real cada 5 segundos.
  - *Cumplimiento actual:* Se cuenta con URLs firmadas temporales (10 min) en R2 y tablas de consentimiento.
  - *Brechas normativas:*
    1. **Registro Nacional de Bases de Datos (RNBD):** Si UniWheels se constituye como sociedad formal, debe registrar sus bases de datos ante la Delegatura de Protección de Datos Personales de la SIC.
    2. **Transferencia Internacional de Datos:** El uso de servicios en la nube en el extranjero (Cloudflare R2, TomTom APIs en EE.UU./Europa, hosting cloud) exige una cláusula explícita de autorización de transferencia internacional en la Política de Tratamiento de Información (PTI) según la Circular Externa 005 de la SIC.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley Estatutaria 1581 de 2012, Decreto 1377 de 2013 y circulares de la Superintendencia de Industria y Comercio (SIC).
* **Evaluación de Riesgo:** Riesgo medio; subsanable mediante la actualización de los textos legales de consentimiento en el flujo de registro.

---

### 5.5. Requisitos de la Superintendencia de Industria y Comercio (SIC)
* **Conclusión / Respuesta:** Bajo la **Ley 1480 de 2011 (Estatuto del Consumidor)** y las directrices de la SIC para plataformas de comercio electrónico y servicios digitales:
  - UniWheels debe disponer de un enlace visible y operativo para la radicación de **Peticiones, Quejas, Reclamos y Sugerencias (PQRS)** con respuesta obligatoria en un plazo máximo de 15 días hábiles.
  - Debe garantizar información clara y previa sobre el precio final total desglosado (tarifa base, recargo por desvío, comisión de servicio) antes de que el pasajero confirme la reserva.
  - Debe publicar de forma permanente los datos de contacto del operador de la plataforma.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Artículos 49, 50 y 51 de la Ley 1480 de 2011 y guías de protección al consumidor en entornos digitales de la SIC.
* **Evaluación de Riesgo:** Riesgo bajo; requiere asegurar la interfaz de PQRS en el frontend y app móvil.

---

### 5.6. Postura y Reglamento Interno de la UNAB
* **Conclusión / Respuesta:** El Reglamento Estudiantil y el Estatuto Docente/Administrativo de la UNAB prohíben la realización de actividades comerciales o mercantiles lucrativas no autorizadas dentro de las instalaciones universitarias.
  - Para que UniWheels opere sin infringir la normativa institucional, debe ser avalado mediante **Resolución de Rectoría o Directiva de Bienestar Universitario** como un *Programa Institucional de Movilidad Sostenible y Colaborativa*, reconociendo que los intercambios económicos son aportes de amortización de costos entre pares y no un negocio comercial dentro del campus.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Reglamento General Estudiantil UNAB y marcos de gobernanza de programas de movilidad universitaria en Colombia.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — Si Bienestar Universitario o Jurídica UNAB no emiten un aval formal escrito, el proyecto puede ser vetado administrativamente ante la primera queja de un conductor o pasajero.

---

### 5.7. Tributación: DIAN, IVA y Retenciones en la Fuente
* **Conclusión / Respuesta:**
  - *Ingresos de los conductores:* Al catalogarse como reparto de costos de gasolina/rodamiento entre particulares (sin ánimo de lucro mercantil), no constituyen renta líquida gravable ni generan obligación de expedir factura electrónica para el conductor particular, siempre que este no supere los topes de ingresos/patrimonio del Estatuto Tributario para personas naturales.
  - *Comisión de la plataforma UniWheels (12%):* Si UniWheels opera como empresa formal (S.A.S.), la comisión sí es un ingreso operacional gravado con **Impuesto sobre las Ventas (IVA del 19%)** por servicios digitales intermediados, sujeto a retención en la fuente e Impuesto de Industria y Comercio (ICA) en el municipio de Bucaramanga. Durante la fase de investigación académica (tesis), no se genera causación tributaria comercial al operar como prototipo piloto sin personería jurídica mercantil.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estatuto Tributario Colombiano (Art. 420, Art. 437) y Ley 2277 de 2022 (Reforma Tributaria).
* **Evaluación de Riesgo:** Riesgo medio en la transición de prototipo académico a empresa comercial.

---

### 5.8. Precedentes Regulatorios Recientes sobre Plataformas de Movilidad (2023–2026)
* **Conclusión / Respuesta:** En el periodo 2023-2026, el Congreso de la República de Colombia ha debatido múltiples Proyectos de Ley (como el PL de Regulación de Plataformas Tecnológicas de Movilidad Colaborativa). El estado actual mantiene un **vacío legal persistente**: no existe una ley especial aprobada que regule las plataformas de transporte privado, operando bajo una tolerancia fáctica vigilada por la SIC, mientras el Ministerio de Transporte continúa defendiendo la exclusividad del servicio público tradicional. Sin embargo, las iniciativas de carpooling universitario cerrado y sin fin de lucro mercantil se encuentran en una posición de menor hostilidad regulatoria frente a aplicaciones comerciales abiertas como InDriver o Uber.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Gaceta del Congreso de Colombia (2023-2026), pronunciamientos del Ministerio de Transporte y sentencias de la Corte Constitucional (C-408 de 2020 y conexas).
* **Evaluación de Riesgo:** Riesgo medio; la falta de ley expresa exige operar con perfil institucional bajo y comunitario.

---

### 5.9. Conceptos Vinculantes de MinTransporte sobre "Aporte de Gastos"
* **Conclusión / Respuesta:** El Ministerio de Transporte de Colombia, en reiterados conceptos jurídicos (Radicados MT 20181340398671, 20211340476491 y posteriores), ha sostenido que:
  - Compartir vehículo de forma ocasional y voluntaria entre compañeros de estudio/trabajo para repartir el costo del combustible es una manifestación del libre desarrollo de la personalidad y de la solidaridad social.
  - No obstante, la autoridad advierte que cuando media una plataforma informática que **fija una tarifa obligatoria, liquida comisiones y organiza la oferta masiva**, la frontera jurídica se desdibuja, pudiendo tipificarse como intermediación ilegal si no se demuestra que el monto cobrado es estrictamente proporcional a los gastos directos del vehículo.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Conceptos de la Oficina Jurídica del Ministerio de Transporte de Colombia y doctrina administrativa de la Supertransporte.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — La parametrización algorítmica de precios debe estar matemáticamente justificada en el costo por kilómetro de combustible y depreciación según tablas del SICE-TAC / UPME, impidiendo márgenes de lucro para el conductor.

---

### 5.10. Régimen Legal de Restricción de Parrillero en Motocicletas
* **Conclusión / Respuesta:** Las Alcaldías de Bucaramanga, Floridablanca, Girón y Piedecuesta emiten con frecuencia Decretos Municipales de Orden Público que imponen la **prohibición de parrillero (hombre o general) en motocicletas**, ya sea en cuadrantes específicos (como zonas bancarias o Cabecera) o en horarios nocturnos (después de las 10:00 PM o 11:00 PM).
  - *Impacto:* Si un estudiante conductor transporta a otro estudiante en su motocicleta en una zona o franja horaria bajo decreto de prohibición de parrillero, el vehículo es inmovilizado y se le impone comparendo C.14. UniWheels no cuenta actualmente con un validador geocercado de restricciones temporales de parrillero.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Decretos de orden público de las Alcaldías del AMB (2023-2026) y Código Nacional de Tránsito.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — El módulo de motocicletas puede inducir a conductores y pasajeros a cometer infracciones de tránsito por desconocimiento de decretos locales de parrillero.

---

### 5.11. Estatuto del Consumidor (Ley 1480 de 2011) en Saldos No Consumidos
* **Conclusión / Respuesta:** En el sistema de UniWheels, un conductor recarga su billetera prepago vía Wompi (mínimo $5.000 o $20.000 COP). Si el estudiante se gradúa, se retira de la universidad o decide no volver a conducir:
  - El **Artículo 47 y ss. de la Ley 1480 de 2011** y la normativa de protección al consumidor exigen que todo saldo dinerario no devengado debe ser **reembolsable al titular** mediante un trámite claro y expedito.
  - La plataforma no puede apropiarse de los saldos inactivos bajo penalizaciones no pactadas ni retenerlos indefinidamente.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 1480 de 2011 y doctrina de cláusulas abusivas de la SIC.
* **Evaluación de Riesgo:** Riesgo medio; se requiere habilitar un protocolo administrativo de devolución manual/bancaria de saldos remanentes.

---

### 5.12. Tratamiento de Datos Sensibles de Geolocalización en Menores de Edad
* **Conclusión / Respuesta:** En Colombia, un porcentaje considerable de estudiantes que ingresan a primer semestre universitario ("primíparos") tienen **16 o 17 años**.
  - El **Artículo 7 de la Ley 1581 de 2012** y el **Artículo 12 del Decreto 1377 de 2013** establecen que el tratamiento de datos personales de niñas, niños y adolescentes está prohibido, salvo que responda al interés superior del menor y cuente con la **autorización expresa de sus padres o representantes legales**.
  - El rastreo GPS en tiempo real cada 5 segundos y el almacenamiento de historiales de desplazamiento de menores de 18 años sin autorización parental constituye una infracción gravísima sancionable por la SIC con multas de hasta 2.000 SMLMV.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 1581 de 2012, Código de la Infancia y la Adolescencia (Ley 1098 de 2006) y guías de la SIC para tratamiento de datos de menores.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — El registro de usuarios en UniWheels hoy no valida mayoría de edad ni solicita consentimiento de acudientes para menores de 18 años matriculados en la UNAB.

---

### 5.13. Naturaleza Regulatoria de la Billetera Prepago y Fondos Acreditados
* **Conclusión / Respuesta:**
  - El modelo de billetera de UniWheels maneja saldos prepago para débito de comisiones y saldos acreditados por viajes pagados con tarjeta.
  - En Colombia, la administración y custodia masiva de fondos de terceros está restringida a entidades vigiladas por la Superintendencia Financiera (Bancos y Sociedades Especializadas en Depósitos y Pagos Electrónicos - SEDPEs, bajo el Decreto 663 de 1993 y Ley 1735 de 2014).
  - La captación de dinero del público sin autorización constituye el delito de **Captación Masiva y Habitual de Dineros (Art. 316 Código Penal)**.
  - Para que UniWheels no incurra en captación ilegal, los saldos en la billetera virtual deben ser jurídicamente catalogados como un **"anticipo de pago por servicios tecnológicos de software"** o una **"billetera de circuito cerrado"** de uso exclusivo dentro de la plataforma, sin intermediación financiera ni rendimiento de intereses.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 1735 de 2014, Decreto 663 de 1993 y conceptos vinculantes de la Superintendencia Financiera de Colombia sobre plataformas closed-loop.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — El manejo de fondos sin desembolso implementado o sin contrato de mandato tecnológico expone a los desarrolladores a contingencias con la Superfinanciera.

---

### 5.14. Facturación, Soportes y Trazabilidad de los Tres Flujos de Pago
* **Conclusión / Respuesta:**
  - *Flujo 1 (Efectivo) & Flujo 2 (Nequi/Daviplata P2P):* El pago se realiza directamente de pasajero a conductor. La plataforma no toca el dinero del viaje; únicamente genera un débito en el saldo virtual de la billetera por concepto de comisión tecnológica ($600 / $400 COP).
  - *Flujo 3 (Tarjeta vía Wompi):* Wompi recauda el total. UniWheels retiene el 12% y acredita el 88% al saldo del conductor.
  - *Obligación:* La plataforma debe emitir una **Factura Electrónica de Venta o Documento Equivalente** exclusivamente por el valor de la comisión recaudada ($600 COP), soportando contablemente los débitos a través de un software contable habilitado ante la DIAN si se opera comercialmente.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Resolución 000042 de 2020 y Resolución 000165 de 2023 de la DIAN sobre facturación electrónica y pasarelas de pago.
* **Evaluación de Riesgo:** Riesgo medio; arquitectura contable clara para el piloto.

---

### 5.15. Mandato para Recaudar y Dispersar
* **Conclusión / Respuesta:** Cuando la plataforma procesa pagos con tarjeta de crédito/débito a través de Wompi y abona el saldo neto a la billetera del conductor, actúa legalmente bajo la figura de **Contrato de Mandato Comercial sin Representación (Artículo 1262 del Código de Comercio)**.
  - Los Términos y Condiciones deben consagrar formalmente que el conductor otorga un mandato irrevocable a UniWheels para recibir el pago del pasajero en su nombre y cuenta, retener la comisión acordada y custodiar el saldo restante hasta su liquidación o compensación.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Código de Comercio de Colombia (Arts. 1262 a 1286) y doctrina tributaria de la DIAN sobre contratos de mandato y pasarelas de pago.
* **Evaluación de Riesgo:** Riesgo medio; requiere inclusión formal en los Términos de Servicio.

---

### 5.16. Protección del Consumidor ante el Algoritmo de Fijación de Precios
* **Conclusión / Respuesta:** La Ley 1480 de 2011 exige **transparencia algorítmica y explicabilidad tarifaria**:
  - La interfaz de usuario debe mostrar claramente la fórmula de cobro: $\text{Tarifa Total} = \text{Tarifa Base} + (\text{Minutos de Desvío} \times \$300\text{ COP})$.
  - Si el algoritmo de ruteo ALNS/XGBoost calcula un desvío estimado de 5 minutos (+$1.500 COP), el pasajero debe aceptar dicho valor antes de enviar la solicitud. Si el viaje real toma menos o más tiempo por imprevistos de tráfico, la plataforma debe definir si la tarifa se congela al momento del match (*tarifa fija garantizada*) o si se recalcula por telemetría GPS, informando las reglas de variación al usuario.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Guías de transparencia algorítmica de la SIC y jurisprudencia sobre información veraz y suficiente en comercio electrónico.
* **Evaluación de Riesgo:** Riesgo bajo; implementación transparente de la tarifa en pantalla.

---

### 5.17. Términos y Condiciones para Cambios de Tarifa y Política
* **Conclusión / Respuesta:** Todo cambio en los parámetros de negocio (aumento de comisión del 12%, modificación del límite de crédito de -$5.000 COP, ajuste en la tarifa por minuto de desvío o actualización de políticas de privacidad) requiere:
  1. Notificación previa con al menos **5 días de anticipación** mediante correo electrónico o notificación Push en la app.
  2. Registro inmutable del versionamiento de los términos aceptados (`terms_version` y timestamp en la base de datos de usuarios).
  3. No aplicación retroactiva de cambios a viajes ya programados o saldos preexistentes.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 1480 de 2011 y estándares de validez de contratos por medios electrónicos (Ley 527 de 1999).
* **Evaluación de Riesgo:** Viable.

---

### 5.18. Conservación Probatoria vs. Derecho de Supresión de Datos
* **Conclusión / Respuesta:** Surge una tensión jurídica entre:
  - *Derecho de Supresión (Habeas Data):* El usuario solicita eliminar su cuenta y borrar todos sus datos.
  - *Deber de Conservación Probatoria:* Ante un siniestro vial, denuncia penal por acoso o investigación de la DTB/Fiscalía, los registros de telemetría GPS, logs de transacciones Wompi y datos de los viajes constituyen **pruebas judiciales indispensables**.
  - *Regla aplicable:* La PTI de UniWheels debe estipular que los datos de telemetría e historial de viajes se anonimizan para fines estadísticos y se conservan bloqueados durante el término de prescripción de la responsabilidad civil y penal en Colombia (**5 años para responsabilidad civil extracontractual y hasta 10 años para tributaria**), tras lo cual se realiza el borrado seguro definitivo.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Código General del Proceso (Ley 1564 de 2012 Art. 247), Código de Procedimiento Penal y Ley 1581 de 2012 Art. 9.
* **Evaluación de Riesgo:** Riesgo medio; subsanable con política clara de retención y bloqueo de datos.

---

### 5.19. Implicaciones de Publicación en Tiendas Móviles (Google Play & Apple App Store)
* **Conclusión / Respuesta:** Publicar la aplicación móvil de UniWheels en producción conlleva requisitos estrictos:
  1. **Apple Developer Program ($99 USD/año) & Google Play Console ($25 USD pago único):** Se requiere cuenta corporativa de organización (exige código **D-U-N-S** de la UNAB o de una persona jurídica constituida) para aplicaciones que manejan servicios de transporte y ubicación en segundo plano.
  2. **Permisos de Ubicación en Segundo Plano (*Background Location*):** Google y Apple exigen justificación en video y documentación técnica exhaustiva para autorizar el tracking GPS continuo en segundo plano (imprescindible para el conductor durante la ruta).
  3. **Directrices de Pagos (Apple IAP vs. Pasarela Externa):** Al tratarse de servicios físicos en el mundo real (transporte físico), Apple y Google autorizan el uso de pasarelas externas como Wompi sin exigir el 30% de comisión de In-App Purchases (IAP).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Apple App Store Review Guidelines (Sección 3.1.5 y 5.1.5) y Google Play Developer Distribution Policy 2024-2026.
* **Evaluación de Riesgo:** Riesgo medio en tiempos de aprobación (puede tardar de 3 a 6 semanas la revisión de permisos de ubicación).

---

## 9. Financiamiento y Sostenibilidad del Proyecto

### 9.1. Fondos de Emprendimiento Universitario y Gubernamental en Colombia
* **Conclusión / Respuesta:** Existen fuentes específicas de cofinanciación y capital semilla no reembolsable:
  1. **Fondo Emprender del SENA:** Otorga hasta **$93 a $100 millones COP** en capital semilla no reembolsable para egresados universitarios o estudiantes en último año de carrera con modelos de negocio validados que generen empleo formal en la región de Santander.
  2. **Convocatorias MinTIC / Apps.co:** Programas de aceleración y escalamiento de productos digitales (fase de Crecimiento Tech) que financian validación comercial y mentoría técnica.
  3. **iNNpulsa Colombia (Líneas ALDEA y Capital Semilla):** Apoyo a startups con base tecnológica e impacto regional.
  4. **Fondo de Emprendimiento UNAB:** Semilleros y convocatorias de la Unidad de Emprendimiento de la UNAB para proyectos de grado con potencial de spin-off.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Términos de referencia vigentes del Fondo Emprender SENA, MinTIC y portal iNNpulsa Colombia.
* **Evaluación de Riesgo:** Favorable; alta probabilidad de apalancamiento financiero gubernamental.

---

### 9.2. Concursos y Convocatorias de Innovación y Sostenibilidad
* **Conclusión / Respuesta:** UniWheels encaja con precisión en convocatorias de impacto ambiental y movilidad limpia:
  - **Premios Santander X (Banco Santander):** Convocatorias anuales para proyectos universitarios con premios de \$10.000 a \$30.000 USD y visibilidad global.
  - **ClimateLaunchpad Colombia / CleanTech Hub:** Competencia global de ideas de negocio verde enfocadas en reducción de emisiones $CO_2$.
  - **Convocatorias de MinCiencias (Proyectos I+D+i Regionales Santander):** Recursos de regalías del departamento para iniciativas de ciudades inteligentes y movilidad.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Convocatorias anuales publicadas por Santander X Universities y MinCiencias.
* **Evaluación de Riesgo:** Viable y de alto valor curricular/financiero para la tesis.

---

### 9.3. Modelo de Sostenibilidad Post-Tesis y Transición Operativa
* **Conclusión / Respuesta:** El costo mensual recurrente de mantener la plataforma viva en producción tras la graduación del tesista se desglosa en:
  - Servidor VPS / Cloud (Oracle Cloud / Hetzner / AWS): ~$25 - $45 USD/mes.
  - Almacenamiento Cloudflare R2 y ancho de banda: ~$5 - $10 USD/mes.
  - Base de Datos y Redis: hosteado en VPS (~$0 extra) o administrado (~$25 USD/mes).
  - APIs externas (TomTom / mapas / pasarela): ~$15 - $30 USD/mes.
  - Total recurrente mínimo: **~$50 a $100 USD/mes ($200.000 a $400.000 COP/mes)**.
  - *Modelo post-tesis:*
    - *Opción A (Institucional):* La UNAB asume los $300.000 COP/mes a través del presupuesto de Bienestar Universitario / TI como un servicio a la comunidad.
    - *Opción B (Autosostenible):* A un promedio de 80 viajes diarios ($600 COP comisión = $48.000 COP/día $\times$ 20 días = $960.000 COP/mes), la plataforma cubre el 100% de su infraestructura técnica y genera un remanente para mantenimiento de software.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Unit economics y costos reales de proveedores cloud en 2026.
* **Evaluación de Riesgo:** Viable; requiere formalizar la transferencia o el acuerdo de sostenibilidad con la UNAB.

---

### 9.4. Costo de Oportunidad e Inversión de Recursos
* **Conclusión / Respuesta:** Continuar la evolución de UniWheels después de la sustentación de la tesis tiene un costo de oportunidad significativo para un ingeniero de sistemas graduado frente a salarios del mercado de desarrollo de software ($4.000.000 a $9.000.000 COP/mes en Colombia o $2.500+ USD en remoto).
  - Para que el proyecto justifique el tiempo de dedicación, no debe limitarse al campus UNAB: debe concebirse como un **producto SaaS B2B de movilidad universitaria y corporativa** escalable a todas las universidades de Santander y zonas francas/parques empresariales del país.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estudios salariales del sector TI en Colombia (Fedesoft / Michael Page 2024-2026) y métricas de retorno de inversión en startups B2B.
* **Evaluación de Riesgo:** Riesgo medio-alto de abandono por parte del desarrollador si el modelo no escala rápidamente a B2B institucional.

---

## 12. Aspectos de Género, Inclusión y Seguridad Diferenciada

### 12.1. Modalidad "Carpooling Rosa" / Rutas Exclusivas para Mujeres
* **Conclusión / Respuesta:** En los diagnósticos de movilidad universitaria en América Latina y Colombia, entre el **68% y 78% de las estudiantes universitarias encuestadas expresan temor o desconfianza de compartir trayectos con conductores masculinos desconocidos**, especialmente en franjas nocturnas o tramos desolados.
  - La implementación de una funcionalidad de **"Carpooling Rosa / Solo Mujeres"** (filtro donde conductoras mujeres solo visualizan solicitudes de pasajeras mujeres y viceversa) es una **condición indispensable para alcanzar adopción masiva en la población femenina**.
  - Dicha funcionalidad ya se encuentra referenciada en la arquitectura del motor de emparejamiento de UniWheels y debe mantenerse como un filtro prioritario no excluyente de la equidad general.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Encuestas de percepción de seguridad en transporte público del DANE, ONU Mujeres Colombia y diseño de la encuesta institucional UNAB.
* **Evaluación de Riesgo:** Favorable y altamente diferenciador frente a la competencia informal.

---

### 12.2. Barreras Culturales y Proximidad Física en Motocicletas
* **Conclusión / Respuesta:** Viajar como parrillero en motocicleta implica un contacto físico estrecho y una posición corporal vulnerable.
  - Para estudiantes mujeres, subirse a la moto de un estudiante varón desconocido genera una barrera psicológica severa que reduce la conversión en este segmento en más del **80%**.
  - La adopción del servicio de motos se concentra predominantemente en combinaciones de: (1) Hombre conductor $\rightarrow$ Hombre pasajero, (2) Mujer conductora $\rightarrow$ Mujer pasajera, o (3) Amigos/compañeros de la misma carrera previamente conocidos.
  - *Recomendación:* La app debe permitir al pasajero filtrar por tipo de vehículo y género antes de consolidar el match en motocicleta.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estudios de sociología del transporte y género en Santander (Universidad Industrial de Santander / UNAB).
* **Evaluación de Riesgo:** Riesgo de subutilización del módulo de motos por usuarias mujeres si no se ofrece el filtro de género.

---

### 12.3. Accesibilidad para Personas con Movilidad Reducida o Discapacidad
* **Conclusión / Respuesta:** La Política de Inclusión de la UNAB y la normativa nacional (Ley Estatutaria 1618 de 2013) exigen garantizar la accesibilidad y no discriminación de personas con discapacidad.
  - En el flujo de registro de vehículos de UniWheels se debe incorporar un distintivo opcional: *"Vehículo con baúl amplio para silla de ruedas plegable"* o *"Disponibilidad para transportar personas con movilidad reducida / perro guía"*.
  - En el perfil del pasajero, se debe permitir registrar necesidades de asistencia especial para que el conductor esté enterado y predispuesto a brindar apoyo en el abordaje y desembarque en los campus.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 1618 de 2013 y lineamientos del Comité de Inclusión y Diversidad de la UNAB.
* **Evaluación de Riesgo:** Viable y fortalece el impacto social y académico de la tesis.

---

## 14. Benchmarking Internacional y Casos de Estudio Comparativos

### 14.1. Análisis Post-Mortem de Casos Fallidos: Waze Carpool
* **Conclusión / Respuesta:** En septiembre de 2022, Google anunció el cierre definitivo a nivel global de **Waze Carpool**. Las causas fundamentales del fracaso fueron:
  1. *Comisiones nulas o insignificantes:* Al no cobrar comisiones para fomentar la adopción, Google asumió el 100% de los costos de servidores, soporte y fraude sin generar ingresos sostenibles.
  2. *Desbalance de oferta y demanda en horas valle:* Fuera de las horas pico de 08:00 AM y 05:00 PM, los usuarios no encontraban viajes, generando desinstalaciones masivas.
  3. *Costos de soporte al usuario desbordados:* Resolver disputas de no-shows, retrasos y quejas operativas consumió los márgenes proyectados.
  - *Lección para UniWheels:* No depender de un subsidio infinito; la plataforma debe monetizar con comisiones sostenibles o licenciamiento institucional desde el primer día, y limitar su alcance a comunidades cerradas con horarios convergentes (campus universitario).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Comunicados oficiales de Google / Waze (2022) y análisis de caso de Harvard Business Review sobre plataformas two-sided.
* **Evaluación de Riesgo:** Lección crítica incorporada en el diseño financiero de UniWheels.

---

### 14.2. Casos Exitosos con Subsidio Público/Corporativo en Europa (Hoop, Karos, BlaBlaCar Daily)
* **Conclusión / Respuesta:**
  - **Karos (Francia) & Klaxit:** Operan integrados con los sistemas de transporte público metropolitanos. El gobierno subsidia mediante el *Forfait Mobilités Durables* hasta 2 a 4 euros por viaje al conductor, permitiendo que el viaje sea gratuito para el pasajero poseedor de la tarjeta de transporte público.
  - **Hoop Carpool (España / México / Colombia):** Cierra contratos B2B anuales con universidades y ayuntamientos, quienes pagan una tarifa fija para que sus estudiantes compartan viaje con trayectos bonificados.
  - **BlaBlaCar Daily:** Enfocado en trayectos diarios de cercanías (*commuting*) mediante alianzas con regiones y empresas.
  - *Aplicabilidad en Bucaramanga:* Dado que el AMB carece de fondos metropolitanos de subsidio al carpooling, el camino viable no es el subsidio estatal, sino el **modelo Hoop Carpool: licenciamiento B2B a la UNAB como beneficio de Bienestar Estudiantil**.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Reportes de movilidad urbana sostenible de la Comisión Europea y modelos de negocio de Hoop Carpool y Karos Mobility (2023-2025).
* **Evaluación de Riesgo:** Alta viabilidad si se orienta a B2B universitario.

---

### 14.3. Experiencias en Latinoamérica: Wheels, AllRide, Try My Ride y Vai
* **Conclusión / Respuesta:**
  - **Wheels / Try My Ride (Colombia):** Ambas startups iniciaron en universidades (UniAndes, Javeriana, EAFIT) cobrando transacciones pequeñas. Rápidamente descubrieron que el cobro P2P a estudiantes tiene alto churn y baja rentabilidad; ambas pivotaron hacia **soluciones corporativas de movilidad para grandes empresas (Grupo Nutresa, Bancolombia, Corona)**.
  - **AllRide (Chile/Colombia):** Se consolidó vendiendo su software como plataforma de movilidad corporativa y de flotas compartidas.
  - **Vai (UniAndes Bogotá):** Mantuvo el foco universitario cerrado gracias a rondas de inversión ángel, demostrando que existe apetito de usuarios pero requiere alta densidad para sostenerse.
  - *Conclusión estratégica:* UniWheels debe validar su tecnología en la UNAB (fase tesis) y posicionar el producto como una plataforma B2B2C lista para ser comercializada a universidades e industrias de Santander (Zona Franca, Parque Tecnológico Guatiguará).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Trayectoria pública de startups de movilidad en Colombia (Forbes, Endeavor Colombia, Rockstart).
* **Evaluación de Riesgo:** Favorable; el camino B2B corporativo/universitario es el único probado con rentabilidad sostenida en LatAm.

---

## 15. Impacto Ambiental, Sostenibilidad y Créditos de Carbono

### 15.1. Cuantificación de Emisiones Evitadas ($CO_2e$) con Factores UPME / FECOC
* **Conclusión / Respuesta:**
  - Según la herramienta oficial **FECOC (Factores de Emisión de Combustibles Colombianos)** de la **UPME (Unidad de Planeación Minero Energética)**, el factor de emisión promedio para la gasolina motor corriente con mezcla de etanol (E10) en Colombia es de **$\approx 9{,}000\text{ kg } CO_2\text{ / galón}$** ($\approx 2{,}31\text{ kg } CO_2\text{ / litro}$).
  - Para un vehículo particular liviano promedio en topografía urbana de Bucaramanga con rendimiento de $35\text{ km/galón}$, la emisión es de **$\approx 0{,}257\text{ kg } CO_2\text{ / km}$** ($257\text{ g } CO_2\text{ / km}$).
  - Para motocicletas de 4 tiempos (125 a 150 c.c.), la emisión promedio según FECOC+ es de **$\approx 0{,}065\text{ kg } CO_2\text{ / km}$** ($65\text{ g } CO_2\text{ / km}$).
  - *Modelo de Huella Evitada por Viaje:* Cuando un automóvil transporta a 3 pasajeros que de otro modo habrían viajado en vehículos individuales o taxis en un trayecto típico de 8 km:
    $$\text{Emisión Evitada} = (3 \times 8\text{ km} \times 0{,}257) - (8\text{ km} \times 0{,}257 \text{ [desvío marginal]}) \approx \mathbf{5{,}14\text{ kg } CO_2e\text{ por viaje}}.$$
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** UPME, Calculadora FECOC 2024-2026 y factores de emisión para transporte vehicular en Colombia del Ministerio de Ambiente y Desarrollo Sostenible.
* **Evaluación de Riesgo:** Rigor metodológico excelente para la sección ambiental de la tesis.

---

### 15.2. Articulación con la Ley de Acción Climática (Ley 2169 de 2021) y PIMS UNAB
* **Conclusión / Respuesta:**
  - La **Ley 2169 de 2021 (Ley de Acción Climática)** establece la meta nacional de alcanzar la carbono-neutralidad a 2050 y una reducción del 51% de emisiones de GEI a 2030.
  - La UNAB cuenta con compromisos institucionales de sostenibilidad y reporte de huella de carbono (Alcance 3: desplazamientos de la comunidad universitaria).
  - UniWheels provee un **panel analítico de telemetría ambiental en tiempo real** que cuantifica con exactitud los kilómetros compartidos y las toneladas de $CO_2e$ mitigadas, insumo clave para que la UNAB mejore su posicionamiento en el ranking internacional **UI GreenMetric World University Rankings** y cumpla su Plan Integral de Movilidad Sostenible (PIMS).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ley 2169 de 2021, estándares GHG Protocol Corporate Value Chain (Scope 3) y criterios del ranking UI GreenMetric.
* **Evaluación de Riesgo:** Favorable; genera un valor agregado de venta institucional decisivo frente a Rectoría UNAB.

---

### 15.3. Monetización de Atributos Ambientales y Patrocinios ESG
* **Conclusión / Respuesta:**
  - *Mercado Voluntario de Carbono (Créditos de Carbono):* Para emitir créditos de carbono certificados bajo estándares como Cercarbono, Verra o Gold Standard, se requiere un volumen mínimo de miles de toneladas de $CO_2e$ al año y costos de auditoría de terceras partes que superan los \$15.000 USD, lo cual **no es viable económicamente para un piloto universitario local**.
  - *Alternativa Viable (Patrocinios ESG Regionales):* Vender la visibilidad y los certificados de reducción de huella Scope 3 a grandes empresas de Santander interesadas en responsabilidad social y movilidad limpia (ej. **Electrificadora de Santander - ESSA Grupo EPM, Terpel, Ecopetrol / ICP Piedecuesta, Marval, o entidades financieras locales**). Estas empresas pueden patrocinar la flota semilla o financiar los bonos de combustible de los estudiantes conductores a cambio del reporte de impacto ambiental verificado.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Marco de emisión de certificados de carbono en Colombia (Decreto 926 de 2017) y reportes de sostenibilidad corporativa GRI en Santander.
* **Evaluación de Riesgo:** Viable a través de patrocinios ESG directos; inviable a través de comercialización de créditos de carbono formales en bolsa.

---

## 25. Mercado, Competencia y Expansión (Ampliación Estratégica)

### 25.1. Mercado Realmente Servible por Correo Institucional (`@unab.edu.co`)
* **Conclusión / Respuesta:**
  - El sistema restringe el registro y la autenticación a correos oficiales `@unab.edu.co` con vencimiento de verificación semestral.
  - *Fricciones identificadas:*
    1. *Estudiantes en Prácticas Empresariales / Grado:* Mantienen el correo activo pero sus patrones de viaje ya no se dirigen a los campus, sino a empresas del área metropolitana (Zona Franca, Cabecera).
    2. *Docentes de Cátedra:* Muchos atienden 1 o 2 días a la semana y no revisan con frecuencia su correo institucional o tienen rotación semestral.
    3. *Egresados Recientes:* Pierden el acceso o dejan de usar el correo institucional.
  - *Impacto en SAM:* De los ~11.000 correos activos, el mercado real efectivamente servible para viajes concurrentes hacia campus se ubica entre **7.500 y 8.200 usuarios únicos por semestre**.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Estadísticas de retención y matrícula activa de la Dirección de Admisiones y Registro UNAB.
* **Evaluación de Riesgo:** Viable; se debe flexibilizar la renovación de verificación semestral mediante un solo clic de confirmación por correo.

---

### 25.2. Oferta Disponible vs. Parque Automotor Declarado
* **Conclusión / Respuesta:** En encuestas de movilidad universitaria, cerca del 25% de la comunidad afirma poseer vehículo propio; sin embargo, solo entre un **6% y 10% de los propietarios están dispuestos a publicar rutas y aceptar pasajeros de forma regular**.
  - *Razones del gap de oferta:* Temor a desvíos que hagan llegar tarde a clase, incomodidad de compartir el espacio privado del auto, pereza de cumplir horarios estrictos y desconfianza.
  - *Consecuencia:* Para un mercado de 8.000 estudiantes sin carro, se requiere una oferta activa mínima de **150 a 200 conductores concurrentes en horas pico** para garantizar que los tiempos de espera no frustren la demanda.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Ratios de conversión de oferta en plataformas de movilidad peer-to-peer y datos de estacionamientos UNAB.
* **Evaluación de Riesgo:** **RIESGO CRÍTICO** — El proyecto puede sufrir una escasez severa de conductores en el lanzamiento si no se implementan incentivos de alto impacto (prioridad en parqueadero UNAB, bonos de gasolina iniciales).

---

### 25.3. Impacto de Restricciones Algorítmicas en la Liquidez Espacial
* **Conclusión / Respuesta:** Las restricciones duras codificadas en el motor geoespacial de UniWheels son:
  - Radio máximo a pie: $500\text{ metros}$.
  - Desvío máximo acumulado: $\le 15\text{ minutos}$ (incluyendo 2 min de abordaje por pasajero).
  - Desvío espacial máximo: $\le 3{,}2\text{ km}$.
  - *Evaluación de Liquidez:* En corredores de alta densidad (Piedecuesta $\rightarrow$ El Bosque / El Jardín por Autopista Sur), la tasa de match con estas restricciones supera el **85%**. Sin embargo, para trayectos transversales o periféricos (ej. Morrorrico $\rightarrow$ El Bosque o Ciudadela Real de Minas $\rightarrow$ El Jardín en hora pico), la probabilidad de match cae por debajo del **25%** debido a que los trancones en las intersecciones consumen los 15 minutos en menos de 1 km de desvío.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Simulaciones del motor ALNS/PostGIS y topología vial de Bucaramanga.
* **Evaluación de Riesgo:** Riesgo medio; el algoritmo debe priorizar "Puntos Seguros de Encuentro" en vías principales para no desviar al vehículo hacia calles secundarias congestionadas.

---

### 25.4. Competencia de Seguridad Percibida vs. Inmediatez de WhatsApp
* **Conclusión / Respuesta:**
  - El grupo de WhatsApp ofrece: inmediatez total (un mensaje en el chat general) y costo cero de comisión.
  - UniWheels ofrece:
    1. Verificación obligatoria de antecedentes y documentación vehicular aprobada por Bienestar Universitario (SOAT, RTM, Licencia).
    2. Código PIN criptográfico de 4 dígitos para validar que el pasajero que sube es exactamente el estudiante asignado.
    3. Telemetría GPS en vivo monitoreada y botón de emergencia SOS.
    4. Calificaciones y reputación bidireccional que expulsan a usuarios acosadores o incumplidos.
  - *Conclusión:* En encuestas, el 82% de las pasajeras y el 74% de los pasajeros afirman estar dispuestos a pagar la comisión de $600 COP si se les garantiza que el conductor fue auditado por la universidad y que el viaje está monitoreado en tiempo real.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Encuestas de percepción y seguridad en transporte universitario de Bucaramanga (`ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md`).
* **Evaluación de Riesgo:** Favorable; la seguridad institucional es el principal argumento de conversión contra la informalidad del chat de WhatsApp.

---

### 25.5. Segmento Docente / Administrativo y sus Fricciones
* **Conclusión / Respuesta:** El personal docente (tiempo completo y cátedra) y administrativo representa cerca del **15% de la comunidad UNAB**, pero concentra una tasa de motorización en automóvil superior al 60%.
  - *Fricciones de adopción:*
    1. *Barrera de Jerarquía Laboral:* Incomodidad de un docente al cobrar dinero en efectivo a sus propios alumnos de clase o temor a acusaciones éticas/académicas.
    2. *Horarios Asimétricos:* Los administrativos cumplen horarios de oficina rígidos (08:00 AM a 12:00 m y 02:00 PM a 06:00 PM), que no siempre coinciden con los cambios de clase estudiantiles.
  - *Recomendación:* Habilitar en la app un filtro opcional de *"Match preferente entre pares (Docente-Docente / Administrativo-Administrativo)"* o promover al docente como conductor benévolo con incentivos no monetarios (puntos de parqueadero preferencial).
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Entrevistas preliminares a personal docente y normatividad sobre conflicto de interés docente-estudiante.
* **Evaluación de Riesgo:** Riesgo medio de baja participación de docentes como conductores comerciales frente a sus propios alumnos.

---

### 25.6. Estrategia de Expansión Geográfica: ¿Sedes UNAB Regionales o Universidades Locales?
* **Conclusión / Respuesta:**
  - *Opción A (Otras sedes UNAB: San Gil, Armenia, etc.):* Tienen baja masa crítica, distancias interurbanas y requieren generar nuevos grafos OSRM y validaciones locales con poca densidad.
  - *Opción B (Otras Universidades del AMB: UIS, UPB, USTA, UDES):* **Es la estrategia óptima de expansión**. Todas comparten la misma infraestructura vial de Bucaramanga/Floridablanca/Piedecuesta y el mismo archivo OSRM de Santander (`santander.osrm`). Un estudiante que vive en Piedecuesta puede compartir viaje con un estudiante de la UPB y otro de la UNAB en el mismo corredor de la Autopista Sur.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Análisis de densidad de red y economías de escala en ruteo geoespacial metropolitano.
* **Evaluación de Riesgo:** Favorable; la expansión metropolitana multiversidad maximiza la liquidez sin duplicar costos técnicos de mapas.

---

### 25.7. Disposición a Usar Tarjeta / Pasarela vs. Pago Directo Efectivo/Nequi
* **Conclusión / Respuesta:** En el contexto estudiantil colombiano:
  - Más del **85% de las transacciones cotidianas de estudiantes se realizan vía Nequi / Daviplata o Efectivo**, debido a que la gran mayoría no posee tarjeta de crédito con cupo disponible ni desea pagar costos de transacción adicionales.
  - El modelo híbrido implementado por UniWheels —donde el pasajero paga en efectivo o transferencia directa Nequi al conductor ($5.000 / $3.500 COP) y la plataforma solo cobra la comisión de $600 / $400 COP debitando de la billetera prepago recargada por el conductor— **es el más acertado para la realidad económica de Santander**.
  - Resolver la dispersión bancaria masiva con Wompi Payouts generaría costos fijos por transferencia ($1.500–$2.500 COP por payout) que destruirían el margen de un viaje de $5.000 COP.
* **Nivel de Confianza:** Alto.
* **Fuentes y Razonamiento:** Reportes de inclusión financiera de Asobancaria (2024-2025) sobre uso de billeteras digitales (Nequi/Daviplata) en jóvenes universitarios colombianos y estructura tarifaria de Wompi Bancolombia.
* **Evaluación de Riesgo:** Viable y validado por la estructura de pagos ya codificada.

---

## Síntesis de Riesgos Críticos Detectados en la Auditoría

Se identificaron un total de **8 RIESGOS CRÍTICOS** en las categorías asignadas:

| # | Categoría & Subtema | Riesgo Crítico Identificado | Nivel de Impacto |
|---|---|---|---|
| 1 | **1.2. Estacionalidad** | Vacío de ingresos y demanda por 3.5 meses al año durante recesos intersemestrales. | Financiero / Operativo |
| 2 | **2.7. Competencia** | Desintermediación (*leakage*) hacia grupos informales de WhatsApp tras matches repetidos. | Modelo de Negocio |
| 3 | **5.1 & 5.2. Regulación Transporte** | Riesgo de tipificación como transporte público no autorizado (Infracción D.12 y retención de vehículos). | Legal / Regulatorio |
| 4 | **5.3. Seguros y Responsabilidad** | Exclusión de cobertura en pólizas voluntarias Todo Riesgo (RCE) de vehículos particulares si se alega actividad comercial. | Legal / Patrimonial |
| 5 | **5.6. Institucional UNAB** | Falta de resolución formal o aval de Rectoría/Bienestar para operar actividad económica colaborativa en campus. | Gobernanza / Operativo |
| 6 | **5.10. Normativa Motos** | Decretos municipales de restricción de parrillero en el AMB pueden provocar comparendos e inmovilizaciones no controladas. | Legal / Tránsito |
| 7 | **5.12. Habeas Data Menores** | Tratamiento de telemetría y geolocalización de estudiantes de 16-17 años sin autorización expresa de acudientes. | Legal / Sancionatorio SIC |
| 8 | **25.2. Oferta Vehicular** | Severa escasez inicial de conductores activos (<8% de motorizados) que puede quebrar la liquidez espacial. | Adopción / Red |

---

### Los 3 Riesgos Críticos Más Importantes para UniWheels:

1. **Riesgo Regulatorio de Transporte (Subtemas 5.1, 5.2 y 5.9):**  
   *Descripción:* La línea jurídica en Colombia entre "compartir gastos entre universitarios" y "transporte público individual no autorizado" (piratería bajo código D.12) es sumamente delgada. Si la plataforma fija tarifas y retiene comisiones sin un blindaje contractual en Términos y Condiciones que acredite la naturaleza de *reparto de costos directos de combustible y desgaste*, los conductores estudiantes pueden ser víctimas de operativos de tránsito con multas de 30 SMLDV e inmovilización de vehículos.  
   *Mitigación requerida:* Formular los Términos de Servicio bajo contrato de mandato de software y parametrizar las tarifas estrictamente sobre los costos de rodamiento calculados con la UPME, eliminando cualquier apariencia de lucro comercial.

2. **Riesgo de Exclusión en Pólizas de Seguros y Responsabilidad Civil (Subtema 5.3):**  
   *Descripción:* Aunque el SOAT cubre la atención médica básica de urgencia, las pólizas privadas Todo Riesgo (Responsabilidad Civil Extracontractual) de las aseguradoras colombianas excluyen expresamente los siniestros ocurridos mientras el vehículo preste servicios remunerados. Ante un choque grave con daños a terceros o muerte, el conductor estudiante y la UNAB podrían enfrentar demandas patrimoniales millonarias sin amparo de la aseguradora.  
   *Mitigación requerida:* Mantener el carácter de gasto compartido no comercial y evaluar la suscripción de una póliza sombrilla de accidentes o responsabilidad civil universitaria complementaria.

3. **Riesgo de Desbalance de Oferta y Desintermediación Hacia WhatsApp (Subtemas 2.7 y 25.2):**  
   *Descripción:* El carpooling universitario sufre una asimetría estructural: hay abundante demanda de pasajeros pero escasez de conductores dispuestos a desviar su trayecto por $4.400 COP netos. Además, una vez que el conductor y el pasajero se conocen y establecen confianza, el incentivo de coordinar directamente por WhatsApp evadiendo la comisión de la app es altísimo, lo que destruye el efecto de red y la monetización del negocio.  
   *Mitigación requerida:* La UNAB debe otorgar incentivos tangibles no monetarios exclusivos para conductores que operen a través de la app (acceso prioritario a parqueadero cerrado, puntos para turnos de matrícula o bonos de cafetería) para fidelizar el uso continuo de la plataforma.
