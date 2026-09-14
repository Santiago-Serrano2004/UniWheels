**UniWheels: Diseño e implementación de una plataforma de carpooling en tiempo real para la optimización de la movilidad en la comunidad UNAB**

**Autor:**  
**Santiago Serrano Ortiz**

**Anteproyecto presentado para la asignatura Proyecto de Grado I**

**Director:**  
**Julian Santiago Santoyo Diaz**

**Asesor metodológico:**  
**Jorge Andrick Parra valencia**

**Universidad Autónoma de Bucaramanga**  
**Facultad de Ingeniería**   
**Ingeniería de Sistemas**  
**Bucaramanga, Santander**  
**Agosto de 2026**

**Tabla de Contenido**

*[1\. Introducción	2](#introducción)*

[*2\. Planteamiento del Problema	2*](#planteamiento-del-problema)

[*3\. Justificación del proyecto	8*](#justificación-del-proyecto)

[*4\. Objetivos	13*](#objetivos)

[**4.1. Objetivo general	13**](#objetivo-general)

[**4.2. Objetivos específicos	14**](#objetivos-específicos)

[*5\. Alcance y delimitación	15*](#alcance-y-delimitación)

[*6\. Marco de Referencia	17*](#marco-de-referencia)

[**6.1. Marco Teórico	17**](#marco-teórico)

[**6.2. Estado del Arte	20**](#estado-del-arte)

[**6.3. Marco Normativo y Legal	24**](#marco-normativo-y-legal)

[**6.3.1. Consideraciones éticas	27**](#consideraciones-éticas)

[*7\. Diseño Metodológico	29*](#diseño-metodológico)

[7.2 Adaptación de fases PMBOK	32](#7.2-adaptación-de-fases-pmbok)

[7.3 Metodología de desarrollo	32](#7.3-metodología-de-desarrollo)

[7.4 Diseño de Ingeniería	32](#7.4-diseño-de-ingeniería)

[7.8 Análisis de riesgos y planes de contingencia	41](#7.8-análisis-de-riesgos-y-planes-de-contingencia)

[7.9 Validación de resultados	42](#7.9-validación-de-resultados)

[*8\. Resultados Esperados	43*](#resultados-esperados)

[*9\. Referencias Bibliográficas	45*](#referencias-bibliográficas)

[*10\. Anexos	47*](#anexos)

1. # **Introducción** {#introducción}

La movilidad universitaria enfrenta desafíos crecientes debido al congestionamiento vehicular, los altos costos de transporte y la limitada disponibilidad de estacionamientos. En la Universidad Autónoma de Bucaramanga (UNAB), esta problemática incide negativamente en la puntualidad, la economía y la huella de carbono derivada del desplazamiento diario de estudiantes, docentes y personal administrativo.  
Para mitigar esta situación, se presenta UniWheels, una plataforma de transporte compartido (carpooling) institucional en tiempo real. El sistema integra un módulo de análisis geoespacial para la poda de trayectorias, acoplado a la ingesta de telemetría de tráfico en tiempo real, la cual alimenta un modelo de aprendizaje supervisado de árboles de decisión potenciados por gradiente (XGBoost) para la predicción dinámica del tiempo estimado de llegada (ETA) y un algoritmo heurístico de Búsqueda Adaptativa de Vecindario Grande (ALNS) para la optimización del problema de recogida y entrega con ventanas de tiempo (DARP-TW). Soportada sobre una arquitectura orientada a microservicios (APIs RESTful en Laravel y Python FastAPI, junto con un cliente web React SPA), UniWheels automatiza el emparejamiento entre conductores y pasajeros verificados de la comunidad universitaria, optimizando los trayectos hacia las sedes, desde los campus y entre sedes institucionales bajo un modelo colaborativo, seguro y sostenible.

2. # **Planteamiento del Problema** {#planteamiento-del-problema}

El crecimiento acelerado del parque automotor en las áreas metropolitanas de Colombia ha generado problemas como la congestión vehicular e ineficiencia en la movilidad urbana. En el área metropolitana de Bucaramanga y en la ciudad, según el Boletín 002 del RUNT (RUNT, 2026\) y la resolución 017 de la dirección de tránsito de Bucaramanga (Dirección de tránsito de Bucaramanga, 2025), circulan más de 640.000 motocicletas, es decir 44 por cada 100 habitantes y los vehículos siguen el paso.  
Esta problemática impacta directamente a la comunidad académica, cuyos estudiantes y colaboradores se desplazan hacia sus sedes (Campus el Jardín, CSU, La Casona y El Bosque). Durante las horas pico (5:30 \- 6:30 a.m y 5:30-6:30 p.m), las vías de acceso sufren estancamientos. Reportes oficiales de la institución (UNAB, 2026\) evidencian desbordamiento constante en la capacidad física de estacionamientos operados por la firma Parquearse*,* donde el costo mensual oscila entre los $125.000 y $150.000 COP para automóviles y entre $45.000 y $55.00 COP para motocicletas. Asimismo, investigaciones de mercado locales (UTS, 2024\) indican que el 70% de los usuarios de transporte alternativo y aplicaciones son menores de 29 años y un 54,4% recurre a ellos por incomodidad y falta de rutas en el transporte público.  
En este escenario, la movilidad representa una pesada carga logística y económica. Mediante los acuerdos Metropolitanos No. 002 y 004 de 2026 (Área Metropolitana de Bucaramanga, 2026), se fijó la tarifa del transporte colectivo y masivo en $3.000 COP en rutas cortas y 3.600 en rutas largas, sumado al precio por galón de la gasolina en Bucaramanga que alcanzó los $16.049 COP en promedio, según la Comisión de Regulación de Energía y Gas (CREG, 2026). Pese a estos sobrecostos, observaciones en accesos universitarios confirman que un alto porcentaje de vehículos particulares ingresa con un único ocupante y los estudiantes sin vehículo propio enfrentan demoras prolongadas y gastos elevados en pasajes o aplicaciones privadas. La universidad tiene un servicio de bus gratuito, pero este solo presenta dos o tres rutas y no son suficientes para cubrir la demanda de los estudiantes.  
**Análisis de Necesidades y Actores**

| Actor | Caracterización | Necesidades | Expectativas | Limitaciones actuales |
| ----- | ----- | ----- | ----- | ----- |
| **Estudiantes Pasajeros** (sin vehículo propio) | Estudiantes de pregrado/posgrado, dependientes del transporte público o colectivo. | Contar con alternativas de transporte eficientes, económicas, directas y seguras hacia los campus UNAB. | Reducir tiempos de viaje y costo mensual de pasajes; evitar el transporte informal de alto riesgo. | Largos tiempos de espera en paraderos, sobrecostos en aplicaciones privadas y rutas indirectas con múltiples transbordos. |
| **Estudiantes / Personal Conductor** (con vehículo propio) | Miembros UNAB que se desplazan diariamente en carro o moto en modalidad unipersonal. | Mitigar los altos costos diarios de combustible ($16.049–$16.248 COP/galón) y de parqueadero. | Compartir gastos de viaje con compañeros de la misma universidad sin desviarse significativamente de su ruta. | Parqueaderos institucionales saturados, cobros elevados, embotellamientos en accesos a sedes y falta de pasajeros verificados. |
| **Administración & Bienestar Universitario UNAB** | Dependencias encargadas de la infraestructura, seguridad, movilidad y bienestar estudiantil. | Descongestionar parqueaderos y vías de acceso en los campus (El Jardín, Terrazas, CSU) y promover la movilidad sostenible. | Mejorar la puntualidad, seguridad y calidad de vida estudiantil; reducir la huella de carbono institucional. | Espacio físico limitado para parqueaderos e imposibilidad de regular el transporte público urbano externo. |
| **Autoridades de Tránsito** (DTB / AMB) | Entidades reguladoras de la movilidad y el transporte público metropolitano. | Reducir la sobrecarga vial en corredores arteria y disminuir el uso del transporte informal desregulado. | Ordenamiento del flujo vehicular en horas pico y mayor ocupación de pasajeros por vehículo privado. | Crisis de cobertura del sistema de transporte masivo (Metrolínea) e incapacidad de ampliar la malla vial urbana. |

1. **Árbol del problema**

	

2. **Pregunta problema**

¿Cómo puede una plataforma de carpooling para la comunidad UNAB contribuir a la reducción de los costos de transporte, la optimización de los tiempos de desplazamiento, el aumento de la ocupación vehicular y la huella de carbono de cada estudiante?

3. # **Justificación del proyecto** {#justificación-del-proyecto}

En un contexto donde Bucaramanga y su área metropolitana enfrentan una crisis estructural de movilidad urbana, agravada por la inviabilidad operativa y cese del sistema Integrado de Transporte Masivo (Metrolínea), que dejó a la ciudadanía dependiente de un transporte colectivo con coberturas y frecuencias insuficientes, la comunidad de la UNAB asume directamente la ineficiencia en el desplazamiento hacia sus sedes. Los estudiantes sin vehículo      
propio afrontan prolongados tiempos de espera e incertidumbre en sus traslados, mientras que quienes disponen de vehículo particular absorben en solitario costos de combustible que superan los $16.000 COP por galón en medio de severas congestiones viales en los corredores de acceso durante las horas pico.  
Este proyecto es social y tecnológicamente relevante porque atiende una necesidad concreta y medible: la baja tasa de ocupación vehicular (en promedio un solo ocupante por vehículo) frente a una alta demanda de transporte estudiantil preexistente que carece de mecanismos formales de articulación. UniWheels es pertinente porque se alinea con las directrices de Bienestar Universitario y de la Dirección Administrativa de la UNAB orientadas a mitigar la saturación de los estacionamientos institucionales (cuyos costos oscilan entre $125.000 y $150.000 COP mensuales) y a fomentar una movilidad sostenible sin requerir inversiones en infraestructura física adicional. El impacto esperado es bidireccional y sinérgico: para el pasajero, representa una alternativa económica, segura y predecible frente a los riesgos del transporte informal; para el conductor, constituye un mecanismo colaborativo para compartir los gastos de rodamiento, combustible y parqueadero sin incurrir en una prestación de servicios mercantiles o de transporte remunerado no autorizado.  
El transporte compartido universitario no es una iniciativa inédita: plataformas como Vai, implementada en la Universidad de los Andes (Forbes, 2023\) con inversión ángel cercana a los US $530.000, evidencian la formalización de este esquema en instituciones colombianas. El valor diferencial de UniWheels frente a estos antecedentes no radica en la simple publicación de trayectos, proceso que suele gestionarse de manera precaria en redes sociales, sino en la correspondencia geoespacial de trayectorias continuas sobre grafos viales y en la resolución algorítmica de la inserción óptima de paradas bajo el problema dial-a-ride con ventanas  
de tiempo (DARP-TW), apoyado en una heurística de Búsqueda Adaptativa de Vecindario Grande (ALNS) y un modelo de Gradient Boosting (XGBoost) que garantiza que un     
desvío sólo se sugiera cuando resulte óptimo para el pasajero y permanezca dentro del umbral temporal previamente tolerado por el conductor.

El proyecto es técnica y económicamente viable dentro de los plazos académicos establecidos, al fundamentarse en tecnologías consolidadas de código abierto con nulo costo de licenciamiento: una arquitectura de microservicios distribuida con Laravel y Python FastAPI, base de datos geoespacial PostgreSQL con PostGIS 3.4, caché en Redis, consumo de telemetría vial en tiempo real mediante TomTom Traffic Flow API y una interfaz reactiva en React SPA. Esta selección tecnológica asegura un despliegue de bajo costo operativo durante la fase piloto y escalabilidad en la concurrencia.

4. # **Objetivos** {#objetivos}

   1. # **Objetivo general**  {#objetivo-general}

Desarrollar una plataforma desacoplada de carpooling asistida por Inteligencia Artificial para la comunidad de la Universidad Autónoma de Bucaramanga, optimizando los tiempos de desplazamiento diario, reduciendo sobrecostos de transporte e incrementando la ocupación vehicular durante el año 2026

2. # **Objetivos específicos** {#objetivos-específicos}

1. Diagnosticar los hábitos de movilidad y requerimientos de seguridad de la comunidad UNAB mediante encuestas y entrevistas para establecer las especificaciones funcionales y no funcionales del sistema.  
2. Modelar la arquitectura web modular y el componente de optimización vial mediante patrones desacoplados de microservicios, diseño de base de datos relacional y algoritmos de inteligencia artificial, para la predicción de tiempos de recorrido y paradas vehiculares.  
3. Desarrollar la plataforma web de transporte universitario compartido mediante la implementación de servicios API RESTful en Laravel, una interfaz de usuario reactiva en React y la sincronización bidireccional vía WebSockets con Redis, para el rastreo geoespacial en vivo y la emisión de notificaciones en tiempo real.  
     
4. Evaluar el rendimiento, la usabilidad y el impacto operativo de la plataforma mediante pruebas unitarias automatizadas, pruebas de carga y evaluaciones de campo con la comunidad de la Universidad Autónoma de Bucaramanga, para medir la reducción en los tiempos de desplazamiento, la tasa de ocupación vehicular y el índice de satisfacción basado en la escala SUS.

5. # **Alcance y delimitación** {#alcance-y-delimitación}

**Alcance**

	El proyecto comprende el diseño, desarrollo y validación de una plataforma web progresiva de transporte universitario compartido (carpooling) para la comunidad de la Universidad Autónoma de Bucaramanga (UNAB). Los entregables tangibles incluyen: una arquitectura backend modular de microservicios en Laravel, una interfaz de usuario reactiva en React, un componente de optimización de rutas con inteligencia artificial y el canal de sincronización geoespacial en tiempo real vía WebSockets y Redis.                                                                                       
  	En términos de madurez tecnológica, el proyecto parte de una prueba de concepto (TRL 3\) y busca alcanzar un nivel TRL 6 (Technology Readiness Level) (Ibañez Aldecoa Quintana, 2024), correspondiente a un prototipo de sistema plenamente integrado y validado en un entorno relevante mediante pruebas de rendimiento, cobertura de código y usabilidad con estudiantes y docentes.

**Delimitación**  
El proyecto se limita a la comunidad activa de la UNAB con cuenta de correo institucional vigente, abarcando exclusivamente el perímetro urbano de Bucaramanga y su área metropolitana para trayectos conectados con sus sedes universitarias durante el periodo 2026-2.

Desde el punto de vista funcional y de recursos, se incluyen la integración de pasarelas de pago bancario con moneda de curso legal y la consulta automatizada a bases de datos gubernamentales externas en tiempo real. La arquitectura se ejecuta sobre infraestructura y componentes de código abierto en contenedores, descartando rutas interdepartamentales y operaciones comerciales ajenas al esquema de transporte solidario universitario.

6. # **Marco de Referencia**  {#marco-de-referencia}

   1. # **Marco Teórico** {#marco-teórico}

# **1\. Movilidad Urbana Sostenible y Transporte Colaborativo Universitario**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      	El crecimiento demográfico y la concentración de actividades académicas en zonas metropolitanas generan presiones sobre la infraestructura vial. En centros urbanos de escala intermedia, la saturación del transporte público tradicional y el incremento en el uso de vehículos particulares con baja tasa de ocupación propician externalidades negativas: congestión vial, emisiones de gases de efecto invernadero (CO₂, NOₓ), accidentalidad y pérdida de tiempo productivo (Litman, 2020; Banco Interamericano de Desarrollo \[BID\], 2022).

                                                                                                                                                                                                                                                                             
  En este contexto, el transporte colaborativo universitario (carpooling o auto compartido) se fundamenta en la optimización del uso de la capacidad vehicular instalada. A diferencia de las plataformas comerciales de transporte a demanda (ride-hailing), el modelo colaborativo universitario opera bajo el principio de comunidad cerrada y solidaria: los conductores comparten trayectos cotidianos preexistentes hacia o desde su campus, dividiendo costos operativos de combustible y mantenimiento sin ánimo de lucro mercantil (Furuhata et al., 2013; Shaheen & Cohen, 2019). Esta dinámica exige mecanismos de confianza institucional y control de acceso basados en credenciales académicas oficiales para mitigar riesgos de seguridad física y jurídica.          
                                                                                                                                                                                                                                                                                                     
**2\. Arquitectura de Software Basada en Microservicios y Sistemas Distribuidos**                                                                                                                                                                                                                                                                                                                                                                                                                                               
  El desarrollo de plataformas web de movilidad requiere alta disponibilidad, tolerancia a fallos y capacidad de escalamiento independiente para cargas de trabajo heterogéneas. La arquitectura de microservicios descompone la aplicación en un conjunto de servicios    autónomos, débilmente acoplados y orientados a dominios de negocio específicos (Domain-Driven Design \[DDD\]), comunicados a través de interfaces de programación de aplicaciones (APIs) ligeras (Newman, 2021; Evans, 2004).                                                
                                                                                                                                                                                                                                                                             
  Conforme al estándar ISO/IEC/IEEE 42010 (2022) para la descripción de arquitecturas de software, la separación de responsabilidades permite que módulos con perfiles computacionales dispares operen en entornos aislados:                                                 
                                                                                                                                                                                                                                                                             
 • **Microservicio de Autenticación e Identidad**: Procesa la gestión de usuarios, ciclo de vida de sesiones y políticas de seguridad criptográfica.                                                                                                                            
  • **Microservicio Vehicular**: Administra la custodia documental, fichas técnicas y aprobaciones administrativas.                                                                                                                                                              
  • **Microservicio de Trayectos**: Ejecuta transacciones y consultas espaciales intensivas.                                                                                                                                                                                     
 • **Microservicio de Optimización**: Ejecuta algoritmos heurísticos y de aprendizaje automático sobre grafos viales.                                                                                                                                                           
                                                                                                                                                                                                                                                                             
  El despliegue mediante contenedores ligeros (Open Container Initiative \[OCI\]) garantiza la reproducibilidad de entornos de ejecución y la asignación eficiente de recursos computacionales sin dependencia de infraestructuras propietarias (Turnbull, 2018).          
                                                                                                                                                                                                                                                                    **3\. Computación Geoespacial y Modelado Relacional de Trayectorias**                                                                                                                                                                                                                                                                                                                                                                                                                                      
  La representación computacional de la movilidad física requiere modelos de datos relacionales con extensiones espaciales nativas. PostgreSQL, complementado con el motor geoespacial PostGIS, implementa el estándar Simple Features for SQL del Open Geospatial           
Consortium (OGC, 2011), permitiendo almacenar geometrías vectoriales (POINT,LINESTRING, POLYGON) referenciadas al elipsoide terrestre mediante el sistema WGS84 (SRID 4326\) (Obe & Hsu, 2021).                                                                            
                                                                                                                                                                                                                                                                             
  Para evaluar la cercanía entre la trayectoria de un conductor y el punto de origen o destino de un pasajero, el sistema emplea operadores métricos basados en distancias sobre la esfera terrestre:                                                                        
                                                                                 $$\\text{distancia}(P\_1, P\_2) \= \\text{ST\\\_DistanceSphere}(\\text{geom}\_1, \\text{geom}\_2)$$                                                                                                                                                                                            
                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                             
  La indexación espacial mediante árboles R generalizados (GiST \- Generalized Search Tree) optimiza la complejidad de búsqueda de O(N) a O(log N), habilitando consultas de proximidad espacial en ventanas temporales estrictas (ST\_DWithin) con latencias inferiores a 50  
  ms en conjuntos masivos de coordenadas viales (Rigaux et al., 2002; PostGIS Development Group, 2024).                                                                                                                                                                      
  ──────                                                                                                                                                                                                                                                                     
  \#\#\# 4\. Algoritmos de Ruteo Dinámico, Heurísticas DARP y Aprendizaje Automático                                                                                                                                                                                             
                                                                                                                                                                                                                                                                             
  El problema de emparejamiento de viajes en tiempo real se modela matemáticamente como una variante del Problema de Recogida y Entrega con Ventanas de Tiempo (Dial-a-Ride Problem with Time Windows \[DARP-TW\]) y del Problema de Ruteo de Vehículos (VRPTW) (Cordeau &     
  Laporte, 2007). Dado que DARP-TW pertenece a la clase de complejidad NP-duro (NP-hard), los enfoques analíticos exactos resultan computacionalmente inviables para decisiones en tiempo de ejecución.                                                                      
                                                                                                                                                                                                                                                                             
  Se implementan métodos metaheurísticos, específicamente la Búsqueda Adaptativa de Vecindario Amplio (Adaptive Large Neighborhood Search \[ALNS\]), para explorar y destruir/reconstruir rutas de manera iterativa, minimizando la función de costo multiobjetivo f(R)

2. # **Estado del Arte** {#estado-del-arte}

*Max. 1500 palabras*

**¿Qué debe contener esta sección?**  
El estado del arte es un análisis crítico y comparativo de soluciones, productos, investigaciones o desarrollos similares al proyecto propuesto. Su propósito es identificar lo que ya se ha hecho, cómo se ha hecho y en qué aspectos tu propuesta representa una mejora, innovación o adaptación.

**Diferencia clave con el Marco Teórico:**

* El marco teórico define los conceptos y fundamentos académicos y técnicos necesarios para comprender tu proyecto.  
* El estado del arte muestra qué ya existe (proyectos, productos, investigaciones, tecnologías, patentes, etc.) y cómo se posiciona tu propuesta frente a ello.

**¿Qué incluir?**

* Revisión de productos, prototipos, investigaciones o implementaciones reales: pueden ser locales, nacionales o internacionales.  
* Evaluación de sus características técnicas, metodológicas o de impacto.  
* Identificación de vacíos, limitaciones o aspectos no resueltos.  
* Comparación con tu propuesta, señalando mejoras o elementos diferenciadores.

**¿Dónde buscar referentes?**

* Bases de datos científicas: **Google Scholar, Scopus, Redalyc, Dialnet, IEEE Xplore, ACM, etc.**  
* Repositorios académicos institucionales  
* Plataformas de software y videojuegos: **Steam, itch.io, GitHub, EpicGames, Unity, etc.**  
* Documentos de proyectos públicos o privados (Minciencias, BID, UNESCO, etc.)  
* Libros o revistas  
* Portales web  
* Entre otros.

**Consejos de redacción:**

* Usa un enfoque analítico, no sólo descriptivo: no basta con listar, debes comparar y argumentar.  
* Utiliza cuadros comparativos si tienes varios referentes.  
* Cita correctamente fuentes (APA 7ma edición)  
* Asegúrate de que los referentes realmente tengan relación con tu proyecto (no uses ejemplos muy genéricos).

***Ejemplo:***

En los últimos años, diversas herramientas digitales han abordado la necesidad de gestionar documentos de forma electrónica. Sin embargo, la mayoría de estas soluciones están diseñadas para entornos corporativos complejos o requieren infraestructura tecnológica avanzada, lo cual dificulta su adopción por parte de oficinas pequeñas o medianas que necesitan soluciones simples, móviles y accesibles.

Una de las soluciones más conocidas es DocuWare Mobile, una aplicación que permite el escaneo, búsqueda y aprobación de documentos desde dispositivos móviles. Si bien ofrece funcionalidades completas, su uso está limitado por altos costos de licenciamiento y necesidad de infraestructura previa, lo que la hace poco viable para pequeñas empresas (DocuWare, 2023).

Por su parte, Adobe Scan y Microsoft Lens se enfocan en el escaneo móvil de documentos con OCR (reconocimiento óptico de caracteres), permitiendo convertir imágenes en texto editable. Sin embargo, estas aplicaciones no ofrecen un sistema completo de gestión documental: carecen de control de versiones, autenticación de usuarios o estructura organizativa de archivos (González & Herrera, 2022).

Otras plataformas como Evernote y Google Drive permiten almacenar y compartir archivos, pero no están diseñadas específicamente para procesos administrativos formales, y no cuentan con funciones como firma digital integrada o trazabilidad de acciones, elementos clave para garantizar validez jurídica y control documental (Ríos et al., 2021).

En el ámbito académico, proyectos como el desarrollado por Martínez y Suárez (2020) en la Universidad del Valle proponen sistemas de gestión documental para entornos universitarios, pero están diseñados para funcionar en escritorio y red local, sin adaptaciones móviles ni integración en la nube.

A nivel nacional, el Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC) ha promovido el uso de sistemas de gestión documental digital en entidades públicas, como ORFEO y AGORA, pero estos sistemas son complejos, requieren capacitación técnica y están limitados a plataformas web (MinTIC, 2022).

**Comparación con la propuesta**

A diferencia de las soluciones revisadas, el proyecto que se propone desarrolla un ecosistema de aplicaciones móviles orientadas a la simplicidad, modularidad y accesibilidad. Su diseño está enfocado en oficinas administrativas con baja infraestructura tecnológica, permitiendo escanear, almacenar, consultar y firmar documentos desde cualquier lugar, sin depender de servidores locales ni costos de licenciamiento. Además, su interfaz estará centrada en la usabilidad y será multiplataforma mediante tecnologías como Flutter y Firebase.

Este enfoque permite llenar vacíos identificados en el estado del arte: la falta de soluciones móviles integradas, adaptables y con funciones de control documental real para contextos con recursos limitados.

3. # **Marco Normativo y Legal**  {#marco-normativo-y-legal}

*Max. 300 palabras*  
**¿Qué debe contener esta sección?**  
El Marco Normativo y Legal presenta las leyes, decretos, normas técnicas o éticas que regulan, condicionan o respaldan el desarrollo del proyecto, ya sea en su construcción, uso, implementación o difusión.

**Este apartado es obligatorio si tu proyecto involucra:**

* Uso de datos personales (usuarios, estudiantes, encuestas)  
* Creación de productos digitales (software, juegos, apps)  
* Propiedad intelectual (uso de imágenes, música, código abierto, licencias)  
* Temas relacionados con accesibilidad, ciberseguridad, bioética o inclusión  
* Aplicación en contextos educativos, empresariales, gubernamentales o de salud

**¿Qué incluir?**

* Normas nacionales o internacionales que regulen la actividad del proyecto.  
* Leyes específicas aplicables en Colombia (o país del estudio).  
* Normas técnicas relacionadas (ISO, NTC, W3C, etc.).  
* Consideraciones éticas y/o de protección de derechos de los usuarios.  
* Políticas institucionales si el proyecto se desarrolla en una universidad, colegio o empresa.

**Consejos de redacción:**

* Menciona la ley o norma por su nombre completo y número.  
* Indica brevemente qué exige o permite, y cómo se relaciona con tu proyecto.  
* No transcribas artículos de ley. Resume su aplicación práctica.  
* Si no aplica ninguna normativa, justifica su omisión con claridad.

**Ejemplos de normas relevantes en Colombia:**

* Ley 1581 de 2012 – Protección de datos personales  
* Ley 23 de 1982 – Derechos de autor  
* Decreto 1074 de 2015 – Uso de software en el entorno empresarial  
* Ley 1341 de 2009 – Acceso a tecnologías de la información  
* Resolución 256 de 2016 (MinTIC) – Accesibilidad web  
* Normas ISO/IEC 25010 – Calidad del software  
* Guías W3C / WCAG 2.1 – Accesibilidad digital

**Ejemplo:**

El desarrollo e implementación de un sistema de gestión documental digital debe estar alineado con las normativas legales que rigen el manejo de la información, la protección de datos personales, la propiedad intelectual y el uso de firmas digitales. En el contexto colombiano, estas normativas son clave para garantizar la legalidad, seguridad y confiabilidad del sistema propuesto.

**Ley 1581 de 2012 – Protección de Datos Personales**

Esta ley establece disposiciones generales para la protección de los datos personales en Colombia, aplicando principios de legalidad, finalidad, libertad, veracidad y seguridad. En el contexto del proyecto, es esencial que el ecosistema garantice la confidencialidad de la información contenida en los documentos gestionados, mediante autenticación de usuarios, control de acceso y almacenamiento seguro en la nube.

**Normas ISO/IEC 27001 e ISO/IEC 25010**

Aunque no son de cumplimiento obligatorio, estas normas internacionales guían buenas prácticas en seguridad de la información (ISO 27001\) y calidad del software (ISO 25010). El sistema será diseñado teniendo en cuenta atributos como confiabilidad, usabilidad y mantenibilidad, lo cual fortalece su aplicabilidad y confiabilidad en entornos reales.

1. # **Consideraciones éticas** {#consideraciones-éticas}

*Max. 300 palabras*  
**¿Qué debe contener esta sección?**  
Este apartado aborda los principios éticos que guían el desarrollo del proyecto, especialmente si se involucran personas, datos sensibles, o se espera impacto social o educativo.  
Su propósito es garantizar que el proyecto respete la dignidad humana, la autonomía, la privacidad, la inclusión y los valores fundamentales, alineándose con prácticas responsables.

**¿Cuándo es obligatorio?**

* Si el proyecto involucra recopilación de datos personales (nombres, edades, correos, imágenes).  
* Si se trabaja con menores de edad, estudiantes, docentes u otras poblaciones vulnerables.  
* Si se desarrollan intervenciones en contextos reales (aulas, comunidades, empresas).  
* Si se utiliza IA generativa o herramientas automatizadas para analizar o tomar decisiones.  
* Si se expone a los usuarios a riesgos digitales (uso prolongado de pantallas, manipulación de emociones, etc.).

**Consejos de redacción:**

* Escribe en futuro o presente, como una declaración de principios y medidas.  
* No generalices: específica las acciones éticas adoptadas.  
* Relaciona las medidas éticas con los momentos concretos del desarrollo del proyecto (diagnóstico, pruebas, validación).  
* Especifica el nivel de riesgo de la investigación o proyecto.

**Ejemplo:**

El desarrollo de este proyecto implica la creación de un sistema que, en su aplicación real, podría involucrar el manejo de información sensible, datos personales y documentos de carácter privado. Por lo tanto, se contemplan medidas éticas orientadas a proteger la privacidad, garantizar la transparencia y promover el uso responsable de la tecnología.

Durante la fase de pruebas, no se utilizarán documentos reales ni datos personales de terceros. Todos los documentos incluidos en los escenarios de validación serán simulados, asegurando que no se vulneren derechos de privacidad ni se exponga información confidencial.

Este proyecto se considera *sin riesgo*, al no involucrar menores de edad, ni poblaciones vulnerables, ni datos sensibles en su etapa de desarrollo. Sin embargo, se asume el compromiso de ajustar sus lineamientos éticos en caso de futuras escalas del proyecto que impliquen una implementación más amplia.

7. # **Diseño Metodológico** {#diseño-metodológico}

*Max. 2000 palabras*

En esta sección se describe de manera estructurada cómo se desarrollará el proyecto para alcanzar los objetivos propuestos. Debe definir el enfoque y alcance de la investigación, la metodología de desarrollo que se empleará, las fases del proyecto, las técnicas e instrumentos para la recolección y análisis de la información, así como la estrategia de validación de la solución. El diseño metodológico debe garantizar la coherencia entre el problema planteado, los objetivos, las actividades de desarrollo y los resultados esperados.

| Apartado | Contenido mínimo esperado |
| :---- | :---- |
| 1\. Enfoque y tipo de investigación | Indicar el enfoque (cuantitativo, cualitativo o mixto), el tipo de investigación (aplicada, experimental, descriptiva, etc.) y justificar su elección. |
| 2\. Metodología de desarrollo | Describir la metodología que guiará el desarrollo de la solución (Scrum, Design Science Research, CRISP-DM, Design Thinking, Cascada, XP, etc.) y justificar por qué es adecuada para el proyecto. |
| 3\. Fases o procedimiento | Describir las etapas del proyecto, las actividades principales y los productos o entregables de cada fase. |
| 4\. Técnicas e instrumentos | Explicar cómo se obtendrá la información o cómo se evaluará la solución (encuestas, entrevistas, pruebas de software, casos de prueba, métricas, experimentos, observación, registros, etc.). |
| 5\. Estrategia de validación | Definir cómo se comprobará que la solución cumple los objetivos planteados (pruebas funcionales, métricas de desempeño, evaluación con usuarios, comparación con una línea base, juicio de expertos, entre otros). |

El estudiante deberá describir el proceso que seguirá para desarrollar y validar su proyecto. Como mínimo, deberá incluir: (1) el enfoque y tipo de investigación, (2) la metodología de desarrollo seleccionada y su justificación, (3) las fases o procedimiento de ejecución, (4) las técnicas e instrumentos para la recolección y análisis de la información o evaluación de la solución, y (5) la estrategia de validación que evidencie el cumplimiento de los objetivos del proyecto, como se expone en la tabla anterior, incluir como anexo a esta un cronograma de trabajo y presupuesto en caso de ser requerido.

**Referenciación en el diseño metodológico:** La metodología propuesta deberá estar sustentada en literatura científica, técnica o normativa que justifique la selección del enfoque de investigación, la metodología de desarrollo, las técnicas e instrumentos empleados y la estrategia de validación. No es suficiente mencionar metodologías como Scrum, Design Science Research, CRISP-DM o Design Thinking; el estudiante deberá citar las fuentes originales o referencias académicas reconocidas que respalden su aplicación.

Cada decisión metodológica deberá estar debidamente justificada mediante referencias bibliográficas pertinentes. El estudiante deberá citar las fuentes que fundamentan la selección del enfoque de investigación, la metodología de desarrollo, las técnicas de recolección y análisis de información, los instrumentos utilizados y la estrategia de validación propuesta.

**Ejemplo:**

**7\. Diseño Metodológico**

El diseño metodológico establece la ruta estructurada que seguirá el proyecto Ecosistema de aplicaciones móviles para gestión documental, desde su formulación hasta su ejecución final. Este desarrollo se enmarca en un proyecto tecnológico aplicado con validación en un entorno operativo relevante, cuyo objetivo es alcanzar un nivel de madurez tecnológica (TRL) entre 3 y 5\.

**7.1 Aplicación del ciclo PHVA**

* Planear: diagnóstico de necesidades en oficinas administrativas, análisis de flujos documentales, estudio comparativo de alternativas tecnológicas y planificación de la solución.  
* Hacer: desarrollo iterativo de los módulos de la aplicación (escaneo, consulta/organización, firma digital), integración con almacenamiento en la nube y pruebas preliminares.  
* Verificar: validación funcional, pruebas de rendimiento y seguridad en entorno piloto, revisión de trazabilidad documental.  
* Actuar: implementación de mejoras detectadas, documentación técnica y socialización de resultados.

### **7.2 Adaptación de fases PMBOK** {#7.2-adaptación-de-fases-pmbok}

* **Inicio:** definición del alcance, objetivos y entregables del proyecto.  
* **Planificación:** elaboración de la EDT (Estructura Desglosada del Trabajo), cronograma y análisis de riesgos.  
* **Ejecución:** desarrollo técnico de cada módulo y configuración del entorno en la nube.  
* **Monitoreo y Control:** seguimiento a hitos y validaciones parciales alineadas al TRL proyectado.  
* **Cierre:** entrega final del ecosistema, documentación técnica y sustentación.

### **7.3 Metodología de desarrollo** {#7.3-metodología-de-desarrollo}

Dado que el desarrollo será realizado por una sola persona, se propone un **enfoque iterativo-incremental** que permita avanzar por incrementos funcionales validados progresivamente. Este enfoque puede apoyarse en herramientas visuales como **Kanban** para la gestión de tareas, pero la metodología definitiva será elegida y justificada por el desarrollador según sus preferencias y experiencia.

En todos los casos, la metodología seleccionada deberá integrarse con **PHVA** y **PMBOK**, asegurando control sobre el alcance, el tiempo y la calidad.

### **7.4 Diseño de Ingeniería** {#7.4-diseño-de-ingeniería}

**Análisis comparativo de alternativas**

| Criterio / Alternativa | A. Sistemas comerciales existentes (Google Drive, SharePoint, Dropbox Business) | B. Aplicación web responsiva (HTML5, ReactJS, Node.js) | C. Ecosistema de aplicaciones móviles multiplataforma (Flutter/Firebase) |
| :---- | :---- | :---- | :---- |
| **Integración con hardware nativo** | Limitada o nula; requiere apps externas | Limitada; acceso restringido por navegador | Completa; acceso directo a APIs nativas del dispositivo |
| **Operación offline y sincronización diferida** | Depende de plan empresarial; almacenamiento local limitado | Limitada; requiere almacenamiento en caché del navegador | Completa; sincronización automática en segundo plano |
| **Personalización de flujos documentales** | Muy baja; plantillas y procesos predefinidos | Media; requiere desarrollo adicional | Alta; arquitectura modular adaptada a procesos internos |
| **Escalabilidad** | Alta, pero dependiente de licencias y costos | Alta; depende de infraestructura propia o contratada | Alta; infraestructura cloud escalable bajo demanda |
| **Seguridad y control de acceso** | Alta; cifrado y gestión de permisos centralizada | Media-alta; depende de la configuración del servidor | Alta; cifrado extremo a extremo y autenticación multifactor integrada |
| **Costo de implementación** | Alto; licencias por usuario y almacenamiento | Medio; infraestructura y desarrollo propios | Bajo-medio; desarrollo inicial mayor, pero sin licencias por usuario |
| **Mantenimiento y evolución** | Bajo; gestionado por el proveedor | Medio; requiere equipo técnico propio | Medio; requiere actualizaciones periódicas y soporte |
| **Tiempo de desarrollo** | Nulo (ya disponible) | Medio; depende de complejidad de funcionalidades | Medio-alto; desarrollo iterativo por módulos |
| **Compatibilidad multiplataforma** | Alta; apps oficiales para múltiples sistemas | Alta; compatible con navegadores modernos | Alta; compilación nativa para Android/iOS |

**Conclusión técnica:**  
 Aunque las alternativas **A** y **B** presentan menor tiempo de adopción inicial, su capacidad de integración con hardware nativo, personalización y operación offline es limitada. La alternativa **C** —ecosistema de aplicaciones móviles multiplataforma— ofrece la mayor flexibilidad, integración con funcionalidades nativas, posibilidad de trabajo sin conexión, escalabilidad y control de seguridad, lo que la hace más adecuada para el contexto del proyecto.

**7.5 Identificación de variables**

La identificación de las variables técnicas, operativas y de impacto se realizó a partir de un proceso sistemático de levantamiento y análisis de requerimientos, combinando fuentes primarias y fuentes secundarias.

En la primera etapa, se efectuó un diagnóstico funcional de los procesos actuales de gestión documental en oficinas administrativas, mediante observación directa, entrevistas semiestructuradas con usuarios clave y revisión de flujos de trabajo existentes. Este diagnóstico permitió detectar deficiencias recurrentes, como la falta de integración con dispositivos móviles, tiempos elevados de búsqueda documental y limitaciones en la trazabilidad de la información.

En paralelo, se consultaron estándares técnicos internacionales y buenas prácticas de la industria en materia de seguridad, interoperabilidad y experiencia de usuario. Entre ellos destacan las guías de seguridad de OWASP Mobile Security Project, las recomendaciones de la norma ISO/IEC 27001 en cuanto a protección de datos y controles de acceso, y la *System Usability Scale (SUS)* como referencia para medir la facilidad de uso.

Asimismo, se revisaron estudios académicos y reportes técnicos que abordan la optimización de la gestión documental digital y su impacto en la productividad (Laudon & Laudon, 2020; Ulrich & Eppinger, 2016). Esto permitió contextualizar el diseño del sistema dentro de prácticas probadas y garantizar que las variables seleccionadas respondieran a criterios de ingeniería de software, diseño centrado en el usuario y seguridad de la información.

Finalmente, la priorización de las variables se realizó aplicando un criterio de relevancia (impacto esperado sobre los objetivos del proyecto) y un criterio de viabilidad (capacidad de medición y validación dentro del alcance del trabajo de grado). Como resultado, se definieron las variables presentadas en la tabla anterior, agrupadas en tres categorías: técnicas, operativas y de impacto.

Estas variables servirán como ejes de evaluación durante todo el desarrollo del proyecto, permitiendo medir de forma objetiva el avance hacia el nivel de madurez tecnológica (TRL) previsto, así como la efectividad de la solución implementada.

| Tipo de variable | Variable | Descripción técnica | Métrica / Indicador | Justificación ingenieril |
| :---- | :---- | :---- | :---- | :---- |
| **Técnica** | Compatibilidad Android/iOS | Capacidad de la aplicación para ejecutarse de manera estable y con igual funcionalidad en ambos sistemas operativos móviles. | Pruebas de compatibilidad en ≥ 2 versiones recientes de Android e iOS. | Garantiza alcance multiplataforma, aumentando la adopción y evitando dependencia de un único sistema operativo. |
| **Técnica** | Seguridad (Cifrado AES-256) | Implementación de cifrado de extremo a extremo para datos almacenados y transmitidos. | Validación mediante auditoría de seguridad y herramientas OWASP. | AES-256 es estándar de la industria para alta seguridad en aplicaciones móviles y cumple con normativas internacionales (ISO/IEC 27001, GDPR). |
| **Técnica** | Autenticación multifactor (MFA) | Requiere al menos dos métodos de verificación antes de conceder acceso. | Porcentaje de usuarios configurados con MFA ≥ 90 %. | Reduce significativamente el riesgo de accesos no autorizados y protege información sensible. |
| **Técnica** | Rendimiento bajo diferentes cargas | Capacidad de respuesta de la aplicación en escenarios de baja, media y alta demanda. | Tiempo de respuesta \< 2 s con 100 usuarios concurrentes. | Asegura operatividad óptima incluso en picos de uso, evitando degradación del servicio. |
| **Operativa** | Tiempo de respuesta | Intervalo desde la solicitud de un documento hasta su apertura en pantalla. | ≤ 2 s en promedio. | Mejora la eficiencia operativa y la experiencia del usuario. |
| **Operativa** | Facilidad de uso | Nivel de comprensión y aprendizaje de la interfaz por parte de usuarios finales. | Escala SUS ≥ 80/100. | Una interfaz intuitiva reduce capacitación y errores de operación. |
| **Operativa** | Adaptabilidad a distintos perfiles de usuario | Capacidad del sistema para ajustarse a roles y permisos diferenciados. | Configuración de ≥ 3 perfiles operativos (administrador, usuario estándar, auditor). | Permite control de acceso granular y personalización de la experiencia. |
| **Impacto** | Reducción de tiempos de búsqueda documental | Disminución porcentual en el tiempo necesario para localizar un documento. | ≥ 40 % de reducción respecto al proceso actual. | Impacta directamente en la productividad administrativa. |
| **Impacto** | Mejora en trazabilidad documental | Capacidad de registrar y consultar el historial de cambios y accesos a documentos. | 100 % de eventos relevantes registrados. | Facilita auditorías internas y cumplimiento normativo. |
| **Impacto** | Incremento en productividad | Aumento de tareas completadas por usuario en el mismo periodo de tiempo. | ≥ 20 % de incremento en productividad medida. | Refleja eficiencia generada por la digitalización y automatización de procesos. |

**7.6 Análisis de factibilidad**

* **Técnica:** viable mediante Flutter y Firebase; TRL proyectado: **TRL 5**.  
* **Económica:** bajo costo operativo al evitar licencias de software privativo; inversión inicial limitada a desarrollo y pruebas.  
* **Operativa:** implementación posible en oficinas piloto con dispositivos móviles Android de gama media y conectividad básica.

**7.7 Hitos y TRL esperados**

| Incremento / Entrega | TRL alcanzado | Entregable clave |
| :---- | :---- | :---- |
| Incremento 1 | TRL 3 | Módulo de escaneo funcional validado en entorno de prueba |
| Incremento 2 | TRL 4 | Módulos de consulta y organización integrados con almacenamiento en nube |
| Incremento 3 | TRL 5 | Ecosistema completo validado en oficina piloto |

### **7.8 Análisis de riesgos y planes de contingencia** {#7.8-análisis-de-riesgos-y-planes-de-contingencia}

| Riesgo | Impacto | Plan de contingencia |
| :---- | :---- | :---- |
| Fallos en sincronización nube-móvil | Alto | Implementar almacenamiento local temporal y reintentos automáticos |
| Baja adopción del sistema | Medio | Capacitación previa y mejoras en la interfaz |
| Vulnerabilidades de seguridad | Alto | Auditorías de código y cifrado extremo a extremo |

### **7.9 Validación de resultados** {#7.9-validación-de-resultados}

Cada incremento funcional será evaluado mediante:

* **Usabilidad:** *System Usability Scale (SUS)*.  
* **Rendimiento:** tiempo de respuesta y consumo de recursos.  
* **Seguridad:** *OWASP Mobile Security Testing Guide*.

Los resultados obtenidos servirán para implementar mejoras y garantizar que la solución alcance el TRL definido, dejando la base para futuras fases de escalamiento.

8. # **Resultados Esperados** {#resultados-esperados}

Max. 500 palabras

Este apartado debe **mostrar lo que se espera lograr** en el proyecto y alineado con los objetivos, la pregunta, el estado del arte y la literatura revisada, describe de forma clara, realista y concreta lo que se espera obtener al finalizar el proyecto de grado, tanto a nivel técnico como en términos de impacto práctico. No se trata solo de listar entregables, sino de proyectar el alcance funcional de la propuesta, su aplicabilidad y su nivel de desarrollo al concluir la etapa de trabajo de grado.

El texto debe ir más allá de promesas generales: debe anticipar qué funcionalidades, mejoras o soluciones serán alcanzadas, en qué condiciones se probarán, y cuál será el estado de madurez tecnológica de la solución construida.

En el caso de proyectos con enfoque en innovación, desarrollo tecnológico y/o investigación aplicada (I+D+i), es indispensable identificar el nivel de madurez tecnológica (TRL) que se pretende alcanzar. Para efectos de un trabajo de grado, el nivel TRL aspirado debe estar entre 3 y 5, es decir:

* **TRL 3:** Pruebas experimentales o validación de concepto en laboratorio.  
* **TRL 4:** Prototipo funcional validado en entorno controlado.  
* **TRL 5:** Sistema validado en entorno relevante o simulado, con retroalimentación de usuarios reales.

Este nivel debe corresponder con la complejidad del desarrollo, el tiempo disponible y la naturaleza del problema abordado. Si el proyecto busca implementar un sistema, se debe especificar qué tanto de ese sistema funcionará, cómo se medirá su desempeño, y en qué condiciones será evaluado.

Usa un lenguaje técnico narrativo, claro, explicando los resultados tanto técnicos como los beneficios esperados para los usuarios o el contexto intervenido. Evita frases vagas o demasiado ambiciosas; enfócate en lo factible, útil y demostrable.

**Ejemplo:**

Como resultado del desarrollo del ecosistema de aplicaciones móviles para gestión documental, se espera obtener una solución tecnológica funcional que atienda las principales necesidades identificadas en oficinas administrativas con altos volúmenes de manejo documental. El sistema permitirá realizar tareas como escaneo, organización, consulta y firma digital de documentos desde dispositivos móviles, integrando estas funcionalidades de forma segura, modular y multiplataforma.

Se proyecta que con la implementación del sistema se optimicen significativamente los tiempos de búsqueda y gestión de documentos, al mismo tiempo que se fortalezca la seguridad, trazabilidad y control de acceso a la información digital. La inclusión de mecanismos de autenticación para firma digital, así como el uso de servicios en la nube para almacenamiento, busca además mejorar la continuidad operativa y reducir la dependencia de recursos físicos.

Desde el punto de vista técnico, el proyecto busca alcanzar un nivel de madurez tecnológica TRL 5, es decir, una versión beta funcional validada en un entorno relevante o con usuarios reales que trabajen en un contexto de oficina, que permita evaluar la viabilidad del ecosistema en condiciones similares a su futura aplicación definitiva. Este nivel implica que todos los módulos estarán integrados, operativos y sometidos a pruebas de usabilidad, eficiencia y seguridad con usuarios reales.

El resultado esperado no se limita a la entrega de una solución técnica, sino a la generación de una herramienta adaptable y escalable, susceptible de evolucionar hacia un producto replicable en otras instituciones con condiciones documentales similares. Asimismo, se espera contribuir a la apropiación tecnológica por parte de los usuarios administrativos mediante interfaces intuitivas, ajustadas a sus flujos de trabajo cotidianos.

En conjunto, el proyecto aportará tanto valor práctico como aprendizajes en procesos de diseño centrado en el usuario, validación en campo y desarrollo ágil de aplicaciones móviles orientadas a contextos institucionales reales.

9. # **Referencias Bibliográficas** {#referencias-bibliográficas}

   

   **References**

   Area Metropolitana de Bucarmanga. (2026, Enero 7). *Tarifas oficiales del servicio público de transporte colectivo, masivo e individual en el Área Metropolitana de Bucaramanga para la vigencia 2026*. ACUERDOS METROPOLITANOS AÑO 2026\. Retrieved Agosto 09, 2026, from https://www.amb.gov.co/acuerdos-metropolitanos-ano-2026/

   Bucaramanga Metropolitana Cómo Vamos. (2025, Diciembre 23). *Informe Especial sobre Movilidad en el área metropolitana de Bucaramanga*. Informe Especial sobre Movilidad en el área metropolitana de Bucaramanga. Retrieved Agosto 9, 2026, from https://www.bucaramangacomovamos.org/post/informe-especial-sobre-movilidad-en-el-%C3%A1rea-metropolitana-de-bucaramanga-1

   CREG. (2026, Mayo 4). *Precios de combustibles líquidos*. Precios de combustibles líquidos. Retrieved Agosto 9, 2026, from https://creg.gov.co/publicaciones/15565/precios-de-combustibles-liquidos/

   Dirección de tránsito de Bucaramanga. (2025, Enero 16). *Resolución No. ( 017\) de 2025*. PROCESO DIRECCIÓN DEL SISTEMA INTEGRADO DE GESTIÓN. Retrieved Agosto 9, 2026, from https://transitobucaramanga.gov.co/dtb/wp-content/uploads/2025/01/RESOLUCION-017-2025-PICO-Y-PLACA.pdf

   Forbes. (2023, Febrero 7). *Esta aplicación de carros compartidos para universitarios inicia con US$530.000*. Forbes Colombia. Retrieved Agosto 12, 2026, from https://forbes.co/emprendedores/esta-aplicacion-de-carros-compartidos-para-universitarios-inicia-con-us530-00

   Ibañez Aldecoa Quintana, J. M. (2024, Octubre 10). *NIVELES DE MADUREZ DE LA TECNOLOGÍATECHNOLOGY READINESS LEVELS.TRLS.UNA INTRODUCCIÓN*. NIVELES DE MADUREZ DE LA TECNOLOGÍATECHNOLOGY READINESS LEVELS.TRLS.UNA INTRODUCCIÓN. Retrieved Agosto 19, 2026, from https://www.researchgate.net/publication/400942062\_Niveles\_de\_madurez\_de\_la\_tecnologia\_Technology\_readiness\_levels\_Una\_introduccion

   RUNT. (2026, Mayo 8). *Boletín de Prensa 002 de 2026*. Boletín de Prensa 002 de 2026\. Retrieved Agosto 9, 2026, from https://www.runt.gov.co/sites/default/files/Bolet%C3%ADn%20de%20Prensa%20002%20de%202026.pdf

   UNAB. (2026, Febrero 17). *Parquearse mejor es pensar en todos*. Parquearse mejor es pensar en todos. Retrieved Agosto 18, 2026, from https://unab.edu.co/parquearse-mejor-es-pensar-en-todos/

   UTS. (2024). *Investigación de mercados para conocer el comportamiento del usuario de medios de transporte informal en el Municipio de Bucaramanga, año 2024*. Repositorio Institucional RI-UTS. Retrieved Agosto 9, 2026, from http://repositorio.uts.edu.co:8080/xmlui/

   

   

   

   

   

   

   

   

   

   

 


10. # **Anexos** {#anexos}

* Cronograma de ejecución del proyecto  
* Diagramas completos, diseños o planos  
* Mecanismos de recolección de datos   
* Redacción de consentimientos y/o asentimientos informados plantillas institucionales  
* Actas de bitácora general y bitácora de tutorías firmadas

