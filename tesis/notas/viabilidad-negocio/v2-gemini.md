# Lista de temas — Deepsearch de negocio y viabilidad de UniWheels (v1, Claude)

Contexto para quien extienda esta lista: UniWheels es un anteproyecto de grado (PG-I, UNAB,
Bucaramanga) — una plataforma de carpooling en tiempo real para movilidad universitaria. El
código ya implementa: 6 microservicios Laravel + IA de ruteo en Python + SPA React + app móvil
Expo en construcción, con pagos reales vía Wompi (el conductor cobra al pasajero, la plataforma
retiene comisión), matching geoespacial con PostGIS, verificación de identidad (Habeas Data),
calificaciones bidireccionales, y un panel de aprobación de vehículos para Bienestar
Universitario. Ya existe una encuesta diseñada (`ENCUESTA_Y_METODOLOGIA_DIAGNOSTICO_TESIS.md`)
que cubre patrones de desplazamiento, costos de transporte, seguridad/confianza, disposición a
usar la plataforma y percepción de sostenibilidad — es decir, el lado de LA DEMANDA del usuario
ya tiene instrumento propio. Esta lista debe cubrir sobre todo el lado de NEGOCIO, MODELO,
REGULACIÓN, COMPETENCIA, RIESGO y EJECUCIÓN, complementando (no repitiendo) esa encuesta.

No se responde nada aquí todavía — esto es solo el mapa de qué investigar. Cada quien que reciba
este archivo debe: (1) no borrar nada de lo ya escrito, (2) agregar tantos temas/subtemas nuevos
como pueda pensar, (3) si lo desea, reorganizar en categorías nuevas, (4) firmar su aporte con un
encabezado `## Aportes de <nombre>` al final del archivo antes de agregar sus propios temas.

## 1. Mercado y demanda

1.1. Tamaño del mercado direccionable: número real de estudiantes/docentes/administrativos UNAB
     con vehículo propio vs. sin vehículo, por sede (El Jardín, El Bosque, Bucarica, Floridablanca).
1.2. Estacionalidad de la demanda (semestre académico, semanas de parciales, vacaciones,
     horarios pico de entrada/salida de clases).
1.3. Tamaño de mercado si se expande a otras universidades de Bucaramanga (UIS, UPB, Santo
     Tomás) o a nivel nacional (UNAB tiene sedes en otras ciudades).
1.4. Elasticidad de precio: ¿cuánto está dispuesto a pagar un estudiante por trayecto vs. el
     costo actual de transporte público/mototaxi/Uber?
1.5. Segmentación de usuarios: pasajero ocasional vs. recurrente, conductor ocasional vs.
     "semi-profesional" (alguien que maneja specifically para generar ingreso extra).

## 2. Competencia y panorama competitivo

2.1. Competencia directa: apps de carpooling universitario existentes en Colombia/LatAm (si
     las hay) y su tasa de éxito/fracaso.
2.2. Competencia indirecta: Uber, DiDi, InDriver, mototaxis informales, buses/Metrolínea,
     transporte propio de la universidad (rutas institucionales si existen).
2.3. Sustitutos de bajo costo: caminar, bicicleta, grupos informales de WhatsApp/Facebook para
     compartir carro que ya podrían existir orgánicamente en la comunidad UNAB.
2.4. Barreras de entrada para UniWheels vs. barreras de entrada para que alguien copie el
     modelo de UniWheels.
2.5. ¿Qué pasa si Uber/DiDi lanzan una función de "carpooling universitario" o descuentos
     dirigidos a estudiantes en la zona?

## 3. Modelo de negocio y monetización

3.1. Estructura de comisión actual (código: `platform_commission_cop` en trip-service) — ¿es
     competitiva frente a lo que cobran otras plataformas de movilidad?
3.2. Modelos alternativos de monetización: suscripción mensual plana, freemium (funciones
     premium como reserva prioritaria o rutas recurrentes), publicidad institucional, comisión
     variable por franja horaria.
3.3. ¿Debería la universidad subsidiar parte de la comisión como beneficio de bienestar
     estudiantil, en vez de que la plataforma cobre 100% al usuario?
3.4. Viabilidad de un modelo B2B2C: la universidad "compra" la plataforma como servicio de
     bienestar y la ofrece gratis o subsidiada a su comunidad.
3.5. Costos variables reales por viaje (procesamiento de pagos Wompi, infraestructura,
     soporte) vs. ingreso por comisión — ¿el unit economics es positivo por viaje desde el
     día uno o requiere volumen mínimo?

## 4. Unit economics y viabilidad financiera

4.1. CAC (costo de adquisición de usuario) estimado en un entorno universitario cerrado
     (¿es más barato que un mercado abierto, dado el efecto de red de campus?).
4.2. LTV (valor de vida) de un pasajero vs. de un conductor — ¿son roles intercambiables en
     el mismo usuario a lo largo del tiempo?
4.3. Punto de equilibrio: número mínimo de viajes/día para cubrir costos de infraestructura
     (servidor, base de datos, servicios externos: TomTom, Wompi, Cloudflare R2, SMS).
4.4. Costo real de los servicios externos a escala (TomTom Traffic API, envío de SMS de
     verificación, Wompi por transacción) — ¿escalan linealmente con el número de usuarios?
4.5. Presupuesto de infraestructura a 6/12/24 meses bajo distintos escenarios de crecimiento
     (esto además es una sección obligatoria de la tesis — "presupuesto" en las guías PG-I).
4.6. Necesidad de capital externo: ¿esto se sostiene con recursos propios/de la universidad,
     o requiere buscar financiamiento (ver sección 9)?

## 5. Regulación y cumplimiento legal (Colombia)

5.1. **Crítico**: clasificación legal del servicio bajo la normativa colombiana de
     transporte — dado que hay pago real de dinero entre conductor y pasajero (no es
     "compartir gastos" puramente informal), ¿esto se considera "transporte público
     individual no autorizado" (como el debate histórico de Uber en Colombia) y qué riesgo
     regulatorio/sancionatorio implica para conductores y para la plataforma?
5.2. Diferencia legal entre "carpooling con reparto de costos" (alegado por apps como BlaBlaCar)
     y "transporte remunerado individual" — ¿en qué categoría cae el modelo actual de UniWheels
     (con comisión de plataforma, tarifa fijada por el sistema, no negociada libremente)?
5.3. Responsabilidad civil y penal en caso de accidente durante un viaje — ¿el SOAT del
     conductor particular cubre un trayecto donde hubo pago? ¿Necesita la plataforma un
     seguro adicional (responsabilidad civil extracontractual, seguro de pasajero)?
5.4. Cumplimiento de Ley 1581 de 2012 (Habeas Data) más allá de lo ya implementado en código
     (auditoría de retención de datos, transferencia internacional de datos si se usan
     servicios cloud fuera de Colombia — Cloudflare R2, TomTom, Wompi).
5.5. Requisitos de la Superintendencia de Industria y Comercio (SIC) para plataformas
     digitales que procesan pagos y datos personales.
5.6. Postura y reglamento propio de la universidad (UNAB) sobre actividades comerciales
     dentro/relacionadas con el campus — ¿Bienestar Universitario tiene o necesita un
     reglamento específico para autorizar/regular esto formalmente?
5.7. Tributación: ¿los ingresos de los conductores por viajes son renta gravable? ¿la
     plataforma tiene obligaciones de retención en la fuente o reporte a la DIAN?
5.8. Precedentes regulatorios recientes en Colombia sobre plataformas de movilidad (decretos,
     proyectos de ley de "plataformas digitales de transporte" 2023-2026).

## 6. Seguridad, confianza y gestión de riesgo operativo

6.1. Verificación de antecedentes del conductor más allá de licencia/SOAT/tarjeta de
     propiedad — ¿debería incluir antecedentes judiciales (Policía Nacional, consulta
     pública)?
6.2. Protocolo de respuesta ante un incidente de seguridad real (acoso, accidente, robo)
     durante un viaje — ¿existe un protocolo institucional con Bienestar/Seguridad UNAB más
     allá del botón SOS ya implementado en código?
6.3. Gestión de disputas económicas (el pasajero dice que no llegó, el conductor dice que sí
     — ¿quién arbitra, con qué evidencia — GPS tracking ya implementado ayuda aquí?).
6.4. Cobertura de seguro de accidentes específico para pasajeros de la plataforma (aparte del
     SOAT del vehículo).
6.5. Política de suspensión/expulsión de usuarios con mal comportamiento repetido — ¿está
     definida más allá de las calificaciones?

## 7. Relación institucional y stakeholders

7.1. Rol formal de Bienestar Universitario: ¿aprobador puntual de vehículos (como ya está en
     código) o co-responsable operativo del servicio?
7.2. Postura del área jurídica/legal de la UNAB frente a la responsabilidad institucional si
     la universidad "avala" o promueve la plataforma.
7.3. Alianzas posibles: aseguradoras (descuento en SOAT/póliza para conductores UniWheels),
     Metrolínea/autoridad de movilidad de Bucaramanga, otras universidades para expansión.
7.4. Gobernanza a futuro: ¿quién es dueño del producto después de la tesis? ¿Se transfiere a
     la universidad, se constituye como spin-off/startup, se dona como proyecto open-source?
7.5. Sponsors o entidades de apoyo al emprendimiento universitario UNAB (si existen: unidad
     de emprendimiento, incubadora).

## 8. Escalabilidad técnica y operativa del negocio (no solo del código)

8.1. Costo marginal de agregar una nueva sede/universidad (¿cuánto trabajo NO técnico:
     validación institucional, aprobación de vehículos, marketing local?).
8.2. Estrategia de lanzamiento: ¿empezar con una sede piloto, con un grupo cerrado de
     usuarios beta, o abierto desde el día uno?
8.3. Efecto de red y "problema del huevo y la gallina": ¿cómo se garantiza masa crítica de
     conductores Y pasajeros simultáneamente en el lanzamiento (subsidios iniciales,
     conductores "semilla")?
8.4. Soporte al usuario: ¿quién atiende reclamos/incidentes en producción — es sostenible
     con recursos de un estudiante/tesista, o requiere personal dedicado a partir de cierto
     volumen?

## 9. Financiamiento y sostenibilidad del proyecto

9.1. Fondos de emprendimiento universitario o gubernamental en Colombia para proyectos de
     movilidad/tecnología social (MinTIC, iNNpulsa, fondos de la propia UNAB).
9.2. Concursos/convocatorias de innovación donde UniWheels podría aplicar (esto también
     fortalece la tesis como antecedente de impacto).
9.3. Modelo de sostenibilidad post-tesis: ¿quién paga el hosting/mantenimiento cuando el
     tesista se gradúe?
9.4. Costo de oportunidad: ¿vale la pena seguir invirtiendo tiempo/dinero en esto vs. otras
     alternativas, dado el tamaño real del mercado universitario de Bucaramanga?

## 10. Riesgos generales (matriz de riesgo del negocio)

10.1. Riesgo regulatorio (ver sección 5) — probabilidad e impacto.
10.2. Riesgo reputacional (un incidente de seguridad grave puede matar la confianza en la
      plataforma de forma irreversible, especialmente en un entorno universitario pequeño
      donde las noticias corren rápido).
10.3. Riesgo de abandono/baja adopción (validar contra los resultados reales de la encuesta
      cuando existan).
10.4. Riesgo de dependencia de terceros (Wompi, TomTom, Cloudflare, Oracle/Azure — ya se vio
      en esta misma sesión que el hosting gratuito es frágil).
10.5. Riesgo de "un solo desarrollador" (bus factor) — toda la plataforma depende de un
      tesista; ¿qué pasa si no puede seguir manteniéndola?

## 11. Alineación académica de la tesis (rigor PG-I)

11.1. Cómo estos hallazgos de viabilidad de negocio alimentan las secciones obligatorias de
      la tesis: justificación, TRL (nivel de madurez tecnológica), presupuesto, marco teórico.
11.2. Validación de la hipótesis de investigación contra los datos reales de la encuesta una
      vez recolectada (contraste demanda esperada vs. demanda declarada).
11.3. Definición de indicadores de éxito medibles para la fase de "piloto" que se puedan
      reportar como resultado de la tesis (no solo "se construyó el software", sino métricas
      de adopción/uso real si se alcanza a pilotear antes de la sustentación).

---

## Aportes de Gemini (agy)

Esta sección expande el mapa de investigación con temas y subtemas derivados del análisis técnico de la arquitectura implementada (microservicios Laravel, ruteo PostGIS/FastAPI, pasarela Wompi prepago, reglas de negocio de automóviles vs. motocicletas según Ley 2294 de 2023), la geografía urbana y crisis de transporte del Área Metropolitana de Bucaramanga (AMB), y los vacíos legales/operativos de plataformas colaborativas universitarias en Colombia.

---

### A. Ampliación de Categorías Existentes (1 a 8)

#### 1. Mercado y Demanda (Subtemas adicionales)
* **1.6. Geografía urbana del AMB y cuellos de botella viales:** Mapeo de flujos origen-destino de la comunidad UNAB a través de los corredores críticos del Área Metropolitana (Autopista Bucaramanga–Floridablanca, Anillo Vial Girón–Floridablanca, Viaducto García Cadena, Carrera 27, Carrera 33). ¿Cómo influye la distancia geográfica de los municipios satélite (Piedecuesta, Girón, Lebrija) en la disposición de conductores y pasajeros a compartir trayectos hacia los campus Terrazas/El Jardín, El Bosque y CSU?
* **1.7. Dinámica y adopción del segmento Motocicletas vs. Automóviles:** Bucaramanga tiene una de las densidades de motocicletas per cápita más altas del país. Dado que UniWheels soporta motos (máximo 1 pasajero, tarifa ~$3.500 COP, obligatoriedad de segundo casco reglamentario según normativa): ¿Existe mayor o menor fricción de adopción en motos que en carros por factores de clima (lluvia/calor), higiene del casco compartido, riesgo de accidentalidad y proximidad física?
* **1.8. Impacto del esquema de "Pico y Placa" Metropolitano:** Evaluación del esquema rotativo de restricción vehicular del AMB como factor exógeno. ¿Funciona el Pico y Placa como un catalizador de demanda de pasajeros los días de restricción, o como un inhibidor de oferta de conductores? ¿Debería la app incentivar el intercambio de roles (un usuario que conduce 4 días y es pasajero 1 día a la semana)?
* **1.9. Demanda atípica, jornadas nocturnas y programas de salud:** Patrones de viaje de estudiantes en rotaciones clínicas hospitalarias (Facultad de Medicina/Enfermería en FOSCAL, HIC, Hospital Universitario de Santander) y programas de posgrado/nocturnos donde el transporte público es escaso o inseguro a altas horas de la noche.

#### 2. Competencia y Panorama Competitivo (Subtemas adicionales)
* **2.6. Competencia con el transporte informal y "piratería" metropolitana:** Debido al deterioro y reducción de cobertura del Sistema Integrado de Transporte Masivo (Metrolínea), el AMB cuenta con un mercado informal altamente arraigado (colectivos piratas en Cañaveral/Provenza/Cabecera, mototaxis). ¿Cómo se posiciona UniWheels en términos de costo percibido ($3.500–$5.000 COP), tiempo de espera y seguridad frente a la inmediatez de la piratería?
* **2.7. Riesgo de Desintermediación (Leakage) hacia WhatsApp/Telegram:** En comunidades cerradas como la UNAB, una vez que un conductor y un pasajero hacen "match" repetido durante 1 o 2 semanas mediante la plataforma, ¿qué mecanismos de retención, seguro o beneficios impiden que coordinen directamente por WhatsApp evitando la comisión del 12%?
* **2.8. Relación con la micromovilidad y transporte no motorizado:** Coexistencia con ciclorrutas, bicicletas compartidas o caminatas en trayectos cortos dentro de las zonas universitarias (ej. Cabecera–Terrazas o Cañaveral–El Bosque). ¿Qué umbral de distancia mínima hace rentable y atractivo un viaje en UniWheels sin canibalizar viajes a pie/bici?

#### 3. Modelo de Negocio y Monetización (Subtemas adicionales)
* **3.6. Gestión del riesgo financiero y saldo deudor en Billetera Prepago:** UniWheels implementa un límite de crédito operativo de hasta -$5.000 COP para conductores antes de bloquear nuevas rutas. ¿Cuál es la tasa proyectada de incobrabilidad (conductores que alcanzan el saldo negativo y abandonan la app)? ¿Cuál es el costo administrativo de recuperación de cartera vs. exigir siempre saldo prepago positivo ($0)?
* **3.7. Fricción operativa del modelo de cobro híbrido (Efectivo/Nequi directo + débito de comisión):** El pasajero paga directamente al conductor ($5.000 / $3.500) y la plataforma debita la comisión ($600 / $400) de la billetera virtual previamente recargada vía Wompi. ¿Qué fricciones genera la indisponibilidad de efectivo/cambio, caídas de la red de Nequi/Daviplata en el punto de desembarque o disputas por transferencias no reflejadas?
* **3.8. Monetización de datos y reportes de Sostenibilidad / ESG a la Universidad:** Valorización B2B de los reportes de reducción de emisiones de gases de efecto invernadero (GEI Alcance 3) y métricas de movilidad sustentable que la UNAB puede utilizar para acreditaciones institucionales de alta calidad (CNA) o rankings internacionales (UI GreenMetric).
* **3.9. Gamificación e incentivos en especie articulados con la UNAB:** En lugar de monetización pura en efectivo, ¿es viable remunerar o incentivar a los conductores con beneficios institucionales: puntos canjeables en cafeterías universitarias, descuento porcentual en matrícula académica, prioridad en asignación de turnos de matrícula o créditos de horas de bienestar?
* **3.10. Tarificación dinámica por condiciones climáticas y congestión:** Bucaramanga sufre parálisis vial severa ante eventos de lluvia. ¿Debe el algoritmo de ruteo/tarificación de UniWheels incorporar recargos climáticos o de alta congestión para evitar que la oferta de conductores caiga a cero en días lluviosos?

#### 4. Unit Economics y Viabilidad Financiera (Subtemas adicionales)
* **4.7. Estructura de comisiones mínimas de pasarela (Wompi) en recargas prepago:** Wompi cobra costos fijos + porcentuales por transacción (PSE, Nequi, tarjetas). Si un conductor recarga montos pequeños (ej. $10.000 a $20.000 COP), ¿cuál es el porcentaje real que absorbe la pasarela de pagos sobre el recaudo total y cuál debe ser el monto mínimo obligatorio de recarga para no erosionar el margen de la plataforma?
* **4.8. Ratio óptimo de Conductores a Pasajeros (Driver-to-Rider Ratio) y costo de liquidez:** ¿Cuántos conductores activos por corredor vial se requieren para mantener el tiempo de espera y el desvío acumulado dentro de la restricción dura de $\le 15\text{ minutos}$ sin desincentivar al conductor?
* **4.9. Costos fijos y licencias anuales de publicación móvil:** Costos no despreciables para un proyecto de bajo presupuesto: membresía obligatoria de Apple Developer Program ($99 USD/año), Google Play Console ($25 USD pago único), mantenimiento de servidores PostgreSQL con extensión PostGIS, instancias FastAPI en producción y almacenamiento S3/R2 de documentación vehicular.

#### 5. Regulación y Cumplimiento Legal (Colombia) (Subtemas adicionales)
* **5.9. Conceptos vinculantes de MinTransporte y Supertransporte sobre "Aporte de Gastos" vs. "Servicio Público no Autorizado":** Análisis de los conceptos jurídicos emitidos por el Ministerio de Transporte de Colombia frente al principio de colaboración privada sin ánimo de lucro (compartir gastos operativos de gasolina y peajes) versus la fijación algorítmica de tarifas y comisiones porcentuales de una plataforma intermediaria.
* **5.10. Régimen legal de Restricción de Parrillero en Motocicletas:** Las alcaldías del Área Metropolitana de Bucaramanga emiten periódicamente decretos de prohibición de parrillero (hombre o mujer) por razones de seguridad ciudadana u orden público. ¿Cómo afecta esta incertidumbre normativa la viabilidad del módulo de motocicletas de UniWheels?
* **5.11. Estatuto del Consumidor (Ley 1480 de 2011) en saldos no consumidos:** Requisitos de reversión de saldos prepago en la billetera de conductores en caso de graduación, retiro de la universidad o cancelación de cuenta, y régimen de atención a Peticiones, Quejas y Reclamos (PQR).
* **5.12. Tratamiento de datos sensibles de geolocalización en menores de edad (16-17 años):** Un porcentaje significativo de primíparos universitarios en Colombia tienen 16 o 17 años. El tracking GPS en tiempo real y almacenamiento de coordenadas constituye tratamiento de datos de menores regulado de manera estricta por la Ley 1581 de 2012 y el Código de la Infancia y la Adolescencia (exigencia de autorización de tutores legales).

#### 6. Seguridad, Confianza y Gestión de Riesgo Operativo (Subtemas adicionales)
* **6.6. Protocolo de atención y cadena de custodia en siniestros viales en vivo:** Flujo de contingencia operativo ante un choque o accidente vial durante un viaje activo: coordinación con la Línea de Emergencias 123 de Bucaramanga, activación del seguro estudiantil colectivo UNAB, cobertura SOAT del vehículo particular y soporte legal de la universidad.
* **6.7. Detección de fraude documental y suplantación de identidad:** Riesgos asociados a la carga de SOAT adulterado, licencias de conducción vencidas o suplantación en el perfil del conductor (el estudiante registrado presta su usuario a un tercero no universitario para operar).
* **6.8. Normativa de elementos de protección personal en motos:** Responsabilidad civil y penal de la plataforma ante accidentes de motocicleta si el pasajero no portaba el casco reglamentario certificado con visor y cinta reflectiva exigido por la Resolución 23385 de 2020 del Ministerio de Transporte.

#### 7. Relación Institucional y Stakeholders (Subtemas adicionales)
* **7.6. Integración con el sistema de control de acceso y parqueaderos UNAB:** ¿Puede UniWheels coordinar con la administración de campus para ofrecer prioridad de parqueadero o tarifa reducida a vehículos que ingresen con cupo lleno (incentivo High-Occupancy Vehicle)?
* **7.7. Coordinación operativa con el cuerpo de vigilancia y seguridad privada:** Protocolo en porterías de los campus (El Jardín, El Bosque) para permitir el acceso rápido de vehículos verificados y validar puntos de desembarque seguros sin entorpecer el tráfico perimetral.
* **7.8. Articulación con el Área Metropolitana de Bucaramanga (AMB) y Direcciones de Tránsito:** Exploración de diálogos institucionales con la Dirección de Tránsito de Bucaramanga (DTB) y Tránsito Floridablanca para validar el piloto como una iniciativa académica de descongestión urbana amparada por la autonomía universitaria.

#### 8. Escalabilidad Técnica y Operativa del Negocio (Subtemas adicionales)
* **8.5. Transición de APIs propietarias a motores Open Source autohospedados:** Estrategia de sustitución de TomTom Traffic API por instancias de OSRM (Open Source Routing Machine) o GraphHopper con datos de OpenStreetMap sobre servidores locales/propios para eliminar la dependencia de costos variables por consulta de matrices de distancia.
* **8.6. Resiliencia offline y zonas de sombra celular en Bucaramanga:** Comportamiento de la aplicación móvil y el websocket de geolocalización en tramos con baja cobertura de red 4G (ej. tramos boscosos de Terrazas, cañones del Anillo Vial o parqueaderos subterráneos).
* **8.7. Capacidad de respuesta del panel administrativo de Bienestar Universitario:** Tiempos de respuesta para la revisión manual de documentos vehiculares (RTM, SOAT, Licencia) durante las semanas de matrícula masiva para evitar cuellos de botella en la habilitación de nuevos conductores.

---

### B. Nuevas Categorías de Investigación

---

### 12. Aspectos de Género, Inclusión y Seguridad Diferenciada

* **12.1. Modalidad "Carpooling Rosa" / Rutas exclusivas para mujeres:** Estudio de la demanda y necesidad de habilitar un filtro opcional que permita a estudiantes y docentes mujeres seleccionar exclusivamente conductoras mujeres y pasajeras mujeres, como medida para mitigar la percepción de inseguridad y el riesgo de acoso en trayectos compartidos.
* **12.2. Barreras culturales y proximidad física en viajes en motocicleta:** Análisis de la aceptación de estudiantes mujeres frente a viajar como parrilleras de conductores masculinos desconocidos (aunque pertenezcan a la misma universidad), evaluando el impacto en la liquidez del servicio de motos.
* **12.3. Accesibilidad para personas con movilidad reducida o discapacidad:** Mecanismos dentro de la plataforma para identificar vehículos adaptados o conductores dispuestos a brindar asistencia a personas con movilidad reducida (sillas de ruedas plegables, bastones, perros guía) en cumplimiento de políticas de inclusión educativa.

---

### 13. Propiedad Intelectual, Activos Intangibles y Aspectos Societarios

* **13.1. Titularidad de derechos de autor sobre el código y modelos de IA en la UNAB:** Análisis del Reglamento de Propiedad Intelectual de la UNAB respecto a software desarrollado como proyecto de grado: ¿Los derechos patrimoniales pertenecen al estudiante autor, a la universidad, o existe una cotitularidad con derecho de explotación comercial para el tesista?
* **13.2. Registro de soporte lógico ante la Dirección Nacional de Derecho de Autor (DNDA):** Procedimiento, tiempos y requisitos para el depósito formal del código fuente (microservicios Laravel, ruteo FastAPI, SPA React, app móvil) ante la DNDA en Colombia como protección previa a cualquier despliegue público o comercial.
* **13.3. Registro de marca comercial "UniWheels" ante la SIC:** Viabilidad de registro marcario bajo la Clasificación Internacional de Niza: Clase 9 (Software y aplicaciones móviles), Clase 39 (Coordinación de transporte y viajes) y Clase 42 (Servicios tecnológicos SaaS). Búsqueda de anterioridades para evitar litigios con marcas similares.
* **13.4. Estructura societaria para una Spin-off / Startup:** Requisitos legales y estatutarios para la constitución de una Sociedad por Acciones Simplificada (S.A.S.), acuerdos de accionistas (Cap Table), cesión formal de derechos de autor desde el autor hacia la empresa y régimen de *vesting* en caso de incorporar cofundadores o inversores.

---

### 14. Benchmarking Internacional y Casos de Estudio Comparativos

* **14.1. Análisis post-mortem de casos fallidos (Waze Carpool):** Lecciones aprendidas del cierre global de Waze Carpool en 2022 por Google: falta de rentabilidad por comisiones bajas, desbalance entre costos de soporte/infraestructura y retorno por viaje, y dificultades para sostener la masa crítica fuera de horas pico.
* **14.2. Casos exitosos con subsidio público y corporativo en Europa:** Estudio de modelos como *Hoop Carpool* (España/México), *Karos* (Francia/Alemania) y *BlaBlaCar Daily*, donde los viajes son cofinanciados por ayuntamientos y fondos estatales de transición ecológica (*Forfait Mobilités Durables*). ¿Es extrapolable un esquema de subsidio metropolitano en Colombia?
* **14.3. Experiencias en Latinoamérica (Wheels, AllRide, Try My Ride):** Estudio comparativo de startups de carpooling universitario y corporativo en Chile, Colombia y México: modelos de cobro a universidades mediante licencias B2B mensuales fijas vs. cobro de comisiones transaccionales a usuarios finales.

---

### 15. Impacto Ambiental, Sostenibilidad y Créditos de Carbono

* **15.1. Cuantificación de emisiones evitadas ($CO_2e$):** Modelación matemática y adopción de factores de emisión oficiales de la UPME (Unidad de Planeación Minero Energética) y el FECOC para estimar la huella de carbono mitigada por pasajero-kilómetro compartido vs. uso de vehículo particular individual o taxi.
* **15.2. Articulación con la Ley de Acción Climática (Ley 2169 de 2021) y PIMS UNAB:** Integración formal del impacto de UniWheels en el Plan Integral de Movilidad Sostenible de la UNAB y su contribución a las metas de carbono neutralidad institucional.
* **15.3. Monetización de atributos ambientales y patrocinios ESG:** Viabilidad de certificar las reducciones de emisiones para generar alianzas comerciales con empresas de la región de Santander (Ecopetrol, ESSA, sector bancario) interesadas en patrocinar la plataforma como parte de sus metas de responsabilidad social y reducción de huella indirecta (Scope 3).

---

### 16. Estrategia Go-to-Market, Lanzamiento y Liquidez Espacial

* **16.1. Táctica de captación de la "Flota Semilla":** Estrategias para reclutar los primeros 50 conductores verificados antes del lanzamiento público (ej. bono de saldo prepago de bienvenida, subsidio de combustible, convenios con servitecas locales o cupos garantizados en parqueaderos UNAB).
* **16.2. Estrategia de densidad en corredores troncales prioritarios:** Focalización del lanzamiento exclusivamente en 2 o 3 corredores de alta demanda (ej. Piedecuesta–Autopista–UNAB El Bosque; Cañaveral–Carrera 33–UNAB Terrazas) para garantizar matches inmediatos y evitar la frustración de búsquedas sin conductor.
* **16.3. Activación estacional en semanas de inducción universitaria:** Campaña de adquisición masiva dirigida a estudiantes de primer ingreso ("primíparos") y padres de familia durante las jornadas de matrícula e inducción, posicionando la plataforma como la alternativa más segura frente al transporte público y la informalidad.
* **16.4. Mecánica de referidos y viralidad campus:** Implementación de programas de recomendación (Refer-a-Friend) donde los usuarios activos obtienen saldo en su billetera o viajes gratis al lograr que compañeros registren su vehículo o completen su primer viaje.

---

### 17. Escenarios de Salida, Pivote y Continuidad Post-Tesis

* **17.1. Escenario A — Spin-off Universitaria Comercial:** Transformación de UniWheels en una startup independiente incubada en Santander, levantando capital semilla a través de fondos de capital de riesgo ángel o convocatorias de iNNpulsa / MinTIC.
* **17.2. Escenario B — Licenciamiento SaaS B2B / Marca Blanca:** Venta del software bajo modelo de suscripción anual a la UNAB y expansión a otras universidades privadas del oriente colombiano (UPB Bucaramanga, UDES, UNICIENCIA, Santo Tomás).
* **17.3. Escenario C — Proyecto Open Source Comunitario Académico:** Donación formal del repositorio a la Facultad de Ingeniería de Sistemas de la UNAB para su mantenimiento mediante semilleros de investigación, pasantías académicas y proyectos integradores futuros.
* **17.4. Escenario D — Pivote a Carpooling Corporativo B2B:** Adaptación del software para zonas francas y parques empresariales de Santander (Zona Franca Santander en Floridablanca, Parque Tecnológico Guatiguará en Piedecuesta, complejos médicos FOSCAL Internacional).
* **17.5. Protocolo de contingencia y liquidación (Graceful Shutdown):** Procedimiento de cierre formal si el proyecto no alcanza sostenibilidad: devolución íntegra de saldos prepago a conductores vía transferencia bancaria, borrado seguro de documentos e identidades según Habeas Data y desmantelamiento ordenado de servidores cloud.

---

### 18. Resiliencia Técnica, Optimización de Infraestructura y Costos Ocultos

* **18.1. Soberanía tecnológica y migración a OSRM/PostGIS:** Análisis de costo-beneficio de sustituir servicios de geocodificación y ruteo de pago (TomTom / Mapbox / Google Maps) por instancias dedicadas de OSRM compiladas sobre mapas de OpenStreetMap de Santander, reduciendo el costo marginal por petición a casi $0.
* **18.2. Caching geoespacial y throttling inteligente:** Implementación de estrategias de almacenamiento en caché de rutas frecuentes en Redis y PostGIS para evitar cálculos redundantes en el microservicio FastAPI ante solicitudes simultáneas en horas pico de salida de clase (12:00 m y 6:00 pm).
* **18.3. Costos operacionales de almacenamiento documental:** Modelación del crecimiento de archivos binarios en Cloudflare R2 (fotos de tarjetas de propiedad, licencias, SOAT y comprobantes de revisión técnico-mecánica) y políticas de retención con expiración automática de documentos obsoletos.

---

### 19. Integración Físico-Espacial en los Campus UNAB

* **19.1. Bahías y Puntos Seguros de Abordaje/Desembarque (Drop-off / Pick-up Points):** Delimitación y señalización de puntos específicos dentro o en el perímetro inmediato de los campus (Terrazas, El Bosque, CSU) para que el abordaje de pasajeros no genere trancones en vías públicas ni riesgos de atropellamiento.
* **19.2. Carriles de Alta Ocupación (HOV) y Parqueadero Preferencial:** Coordinación con el departamento de infraestructura física de la UNAB para otorgar espacios de estacionamiento preferenciales y cercanos a los edificios de clases para vehículos que certifiquen el ingreso con 3 o más ocupantes vía UniWheels.
* **19.3. Integración con el sistema de seguridad física institucional:** Habilitación de códigos QR o validación digital en porterías para que el personal de vigilancia reconozca de manera inmediata que un vehículo particular está prestando un servicio de carpooling universitario validado.
