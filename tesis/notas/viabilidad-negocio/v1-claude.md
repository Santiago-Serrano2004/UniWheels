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
