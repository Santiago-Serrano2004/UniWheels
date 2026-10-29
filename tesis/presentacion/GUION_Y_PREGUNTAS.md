# UniWheels: guion de 10 minutos y preparación de preguntas

Semana de la Ingeniería UNAB 2026. Exposición de 10:00 y 5:00 de preguntas.
Ritmo: unas 125 palabras por minuto. **Negrita** = frase que tiene que salir sí o sí. *(Cursiva)* = acción en escena.

---

## Parte 1. Guion (10:00)

### 1. Portada · 0:00 → 0:30
*(Ponte de frente al público, no a la pantalla. Haz una pausa de 2 s antes de empezar.)*
"Buenas tardes. Soy Santiago Serrano Ortiz, de Ingeniería de Sistemas, y mi director es el profesor Julián Santiago Santoyo. Les presento **UniWheels: carpooling en tiempo real para la comunidad UNAB**. En diez minutos les cuento qué problema resolvemos, cómo lo construimos y cómo lo vamos a validar."

### 2. El problema · 0:30 → 1:20
*(Señala la cifra grande y deja un segundo de silencio.)*
"**Más de seiscientas cuarenta mil motocicletas.** Son las que circulan en Bucaramanga: cuarenta y cuatro por cada cien habitantes. A eso súmenle los carros. Para llegar a cualquiera de las sedes (El Jardín, CSU, La Casona, El Bosque) entre las cinco y media y las seis y media hay que pasar por estancamientos. Un parqueadero mensual cuesta desde ciento veinticinco mil pesos.
Y el dato que más me importa: **en promedio, cada carro llega con un solo ocupante.** Mucha gente necesita llegar y hay asientos vacíos yendo al mismo lugar. Lo que falta es algo que los conecte."

### 3. ¿Por qué importa? · 1:20 → 2:00
"Esto pesa en cuatro frentes. **Congestión**, en las vías de acceso. **Costo**: el galón está en dieciséis mil cuarenta y nueve pesos y los parqueaderos ya no dan abasto. **Seguridad**: quien no tiene vehículo termina en transporte informal. Y **sostenibilidad**: cada carro con una sola persona aumenta la huella de carbono de la universidad."

### 4. Objetivos · 2:00 → 2:50
"Por eso el objetivo general es **desarrollar una plataforma de carpooling asistida por inteligencia artificial que reduzca tiempos y sobrecostos y aumente la ocupación vehicular de la comunidad UNAB.**
*(Marca cada número con la mano.)*
Lo dividimos en cuatro pasos. **Diagnosticar** los hábitos de movilidad y lo que la gente exige en seguridad. **Modelar** una arquitectura modular con un componente que optimiza rutas. **Desarrollar** la plataforma con rastreo en vivo y notificaciones. Y **evaluar** su rendimiento, su usabilidad y su impacto."

### 5. Estado del arte · 2:50 → 3:30
"Hoy el carpooling universitario funciona así: o alguien publica su trayecto en un grupo de redes sociales y todo depende de la suerte, o existe una plataforma formal como **Vai, de la Universidad de los Andes**. UniWheels suma tres cosas: **una comunidad cerrada y verificada con correo institucional, emparejamiento por ruta sobre el mapa vial real, y paradas sugeridas.** Y está pensado para la geografía de la UNAB."

### 6. La solución · 3:30 → 4:20
*(Señala el teléfono.)*
"Esto es UniWheels, una **aplicación móvil**, y esa pantalla es una captura real. Conecta conductores y pasajeros de la comunidad hacia las sedes, desde ellas y entre ellas.
Hay dos decisiones de diseño. La primera: **solo entra quien tiene un correo de una institución autorizada.** La segunda: **la app no maneja dinero.** El modelo es B2B, es decir, la universidad adopta la plataforma y los estudiantes la usan gratis. Lo que se comparte entre conductor y pasajero son gastos, no tarifas."

### 7. Cómo funciona · 4:20 → 5:00
"Un viaje tiene cuatro pasos. **Uno**: el conductor publica la ruta que ya hace todos los días. **Dos**: el pasajero reserva y marca su punto de recogida en el mapa con coordenadas reales. **Tres**: al subir, el viaje empieza **con un PIN** que confirma que es la persona correcta. **Cuatro**: el conductor cierra el viaje. Todo ese ciclo lo controla una máquina de estados en el servidor, no el celular."

### 8. Arquitectura · 5:00 → 5:50
*(Recorre el diagrama de izquierda a derecha con la mano.)*
"Por dentro funciona así. A la izquierda están los clientes: la app en React Native y un panel para Bienestar Universitario. Todo entra por **un gateway nginx**, que reparte las peticiones entre **cinco microservicios en Laravel**: identidad con JWT, vehículos, emparejamiento de rutas, viajes y notificaciones.
El emparejamiento corre sobre **PostGIS**, que hace consultas espaciales directamente en la base de datos. Además consulta un **servicio de inteligencia artificial en Python**, que predice tiempos de llegada con **XGBoost** y optimiza dónde parar con una heurística llamada **ALNS**. Cada servicio tiene su propia base de datos."

### 9. Metodología · 5:50 → 6:30
"Trabajo con el marco **PMBOK y un ciclo iterativo e incremental**. El repositorio deja los hitos registrados: el **23 de septiembre**, el primer commit con seis servicios e integración continua; el **4 de octubre**, el **pivote a B2B sin pagos**; y el **5 de octubre**, producción configurada y la app lista para tiendas. En madurez tecnológica partimos de **TRL 3**, prueba de concepto, y apuntamos a **TRL 6**, prototipo validado en un entorno relevante."

### 10. Comunidad verificada · 6:30 → 7:10
"En carpooling, la tecnología es lo de menos si no hay confianza. Por eso **el sistema valida el dominio del correo al registrarse**: si tu institución no está autorizada, no entras. Entre personas de la misma comunidad hacemos el emparejamiento. Y el modelo es colaborativo: **se comparten gastos de combustible y parqueadero, sin ánimo de lucro.** UniWheels no presta un servicio de transporte remunerado."

### 11. Validación · 7:10 → 8:00
*(Primero la mitad izquierda, luego la derecha.)*
"Mido el avance de dos formas. **Metas**: al menos **80 sobre 100 en la escala SUS** de usabilidad, **respuestas en menos de dos segundos con cien usuarios simultáneos**, y compatibilidad con al menos dos versiones de Android e iOS.
**Estado actual**, sacado del repositorio: **347 pruebas automatizadas, seis microservicios en producción y 198 ejecuciones de integración continua**, la última en verde. **uniwheels.org está en línea.**
Siendo honesto, **falta la evaluación de campo con usuarios reales**, y ese es el siguiente paso."

### 12. Riesgos · 8:00 → 8:40
"Identifico tres riesgos. **Adopción**: sin conductores no hay viajes, y lo enfrento con un piloto institucional en una comunidad cerrada. **Seguridad entre pares**, que es el de mayor impacto: lo mitigo con la verificación institucional y el PIN de cada viaje. Y **dependencia de servicios externos**: si cae el servicio de inteligencia artificial, el emparejamiento sigue funcionando con cálculo local en PostGIS."

### 13. Aporte · 8:40 → 9:20
"¿Qué gana cada uno? **El pasajero** tiene una forma económica, segura y predecible de llegar. **El conductor** comparte lo que ya gasta en combustible y parqueadero. **La universidad** reduce la presión sobre sus parqueaderos sin construir uno solo.
Lo que sigue es llevar UniWheels a **TRL 6**, con un prototipo validado con la comunidad UNAB."

### 14. QR · 9:20 → 9:40
*(Quédate en silencio 3 s para que alcancen a escanear.)*
"Si quieren verlo, escaneen el código o entren a **uniwheels.org**."

### 15. Cierre · 9:40 → 10:00
"**Hay asientos vacíos que van al mismo lugar que nosotros. UniWheels los conecta.** Muchas gracias. Con gusto respondo sus preguntas."

> **Si vas atrasado:** en el minuto 6:30 deberías estar entrando a la diapositiva 10. Si vas tarde, resume la 9 en una frase ("PMBOK iterativo, de TRL 3 a 6") y pasa la 13 en 20 s.

---

## Parte 2. Preguntas y respuestas

**Cómo responder:** usa la fórmula **respuesta directa → evidencia → límite honesto**, en 30–40 s como máximo. Si no sabes algo: "No lo tengo medido todavía; está contemplado en la fase de validación." **Nunca inventes una cifra.**
Diapositivas de respaldo ocultas: 16 Servicios · 17 Variables · 18 Actores.

### A. Las que casi seguro te van a hacer

**1. ¿Cómo garantizan la seguridad de los pasajeros?**
Hay tres capas. Solo entra quien tiene correo de una institución autorizada, porque el registro valida el dominio. Los vehículos pasan por una revisión de documentos. Y cada viaje se inicia con un PIN que el pasajero confirma al subir. Además, el ciclo del viaje lo controla el servidor y queda registrado.

**2. ¿Cuál es el modelo de negocio? ¿Cómo se sostiene si no cobran?**
Es B2B: la universidad adopta la plataforma como parte de su política de movilidad y la app es gratuita para estudiantes y personal. Quitamos los pagos a propósito: si la app cobrara por viaje, entraría en el terreno del transporte remunerado. Sostenerlo cuesta poco porque todo el stack es de código abierto.

**3. ¿Por qué no usar Uber, DiDi o Waze Carpool?**
Uber y DiDi son transporte comercial: un conductor profesional que cobra tarifa. Nosotros conectamos gente que ya hace el trayecto y comparte gastos dentro de una comunidad verificada. Waze Carpool se cerró a nivel mundial en 2022. La diferencia es la confianza: viajas con alguien de tu universidad.
*(Ojo: el documento no tiene una comparación formal de competidores. No inventes cifras de ellos.)*

**4. ¿Ya lo probaron con usuarios reales?**
Todavía no se ha hecho la evaluación de campo, y lo digo así en la presentación. Lo que sí está medido es la parte técnica: 347 pruebas automatizadas, integración continua y el sistema en producción en uniwheels.org. El siguiente paso es el piloto con la comunidad UNAB, que se va a medir con la escala SUS.

**5. ¿Dónde está la inteligencia artificial, concretamente?**
Hay dos piezas en un microservicio en Python. La primera es un modelo **XGBoost** que predice el tiempo de llegada. La segunda es una heurística **ALNS** que decide dónde insertar paradas en una ruta. Ese es el problema DARP con ventanas de tiempo, que es NP-duro, así que no se resuelve de forma exacta en tiempo real. Solo se sugiere un desvío si sirve al pasajero y está dentro de lo que el conductor tolera.

**6. ¿Con qué datos entrenaron el modelo?** ⚠️ *Pregunta trampa: no la esquives.*
Hoy el modelo está entrenado con un **dataset sintético**, porque todavía no hay viajes reales suficientes. Fue una decisión deliberada: un modelo entrenado con pocos registros reales generaliza peor. Ya existe el script de reentrenamiento, que traduce los viajes reales al mismo formato. Cuando el piloto genere datos, se reentrena. Y si el servicio de IA falla, el emparejamiento sigue con PostGIS.

**7. ¿Por qué microservicios y no un monolito? ¿No es excesivo para un proyecto de grado?**
Las cargas son muy distintas: autenticación, consultas espaciales pesadas y optimización en Python. Separarlas permite escalarlas y fallar de forma aislada. Por ejemplo, si cae la IA, el resto sigue funcionando. Sí, aumenta la complejidad de operación, y por eso hay un CLI que levanta todo, Docker Compose e integración continua por servicio.

**8. ¿Cómo protegen los datos personales?**
Aplica la **Ley 1581 de 2012** de habeas data. Recogemos lo mínimo: correo institucional, datos del vehículo del conductor y ubicaciones del viaje. Está contemplado el borrado de la cuenta. *(Si vas a mencionar URLs firmadas para los documentos, verifica antes que estén implementadas.)*
*(Ojo: el marco legal del documento todavía es texto de ejemplo. Corrígelo en el Doc.)*

### B. Técnicas

**9. ¿Qué hace PostGIS exactamente?**
Guarda las rutas como geometrías y responde preguntas como "¿qué conductores pasan a menos de X metros de mi punto?" con `ST_DWithin`, usando índices espaciales GiST. El emparejamiento se hace en la base de datos, no recorriendo rutas una por una en el código.

**10. ¿Cómo se comunican y se autentican los servicios?**
Solo auth-service emite el token JWT. Los demás lo validan con un secreto compartido, sin consultar a auth en cada petición. Todo el tráfico externo entra por el gateway nginx.

**11. ¿Cómo hacen el seguimiento en tiempo real?**
La app envía la ubicación durante el viaje activo y el servidor gobierna los estados (iniciar, finalizar, cancelar). Las notificaciones push las envía notification-service.

**12. ¿Escala? ¿Qué pasa con 1.000 usuarios?**
La meta formal es responder en menos de 2 s con 100 usuarios simultáneos, y todavía no está medida con pruebas de carga. La arquitectura deja escalar por separado el servicio que se sature, que normalmente es el emparejamiento.

**13. ¿Por qué solo app móvil y no web?**
Quien viaja usa el celular: GPS, punto de recogida, PIN y notificaciones. Al principio había una SPA web y la congelamos para concentrar el esfuerzo en el producto real. Bienestar sí tiene un panel web de administración.

**14. ¿Qué pasa si no hay internet en el viaje?**
*(Respuesta honesta.)* El viaje depende del servidor para cambiar de estado. Una mejora planeada es el reintento automático cuando vuelva la conexión. Hoy no tiene un modo offline completo.

### C. De proyecto, negocio y legal

**15. ¿Qué pasa al principio, si hay pocos conductores?**
Ese es el riesgo de adopción. Lo atacamos con un piloto institucional: la comunidad es cerrada y los destinos son solo cuatro sedes, así que los trayectos se concentran mucho. Ya hay demanda, porque hay muchos carros con un solo ocupante.

**16. ¿No es transporte informal o ilegal?**
No se cobra tarifa ni hay lucro. Es compartir los gastos de un trayecto que el conductor ya iba a hacer, y la app no mueve dinero. Aun así, este punto está marcado como riesgo legal y se va a validar con asesoría jurídica antes de abrirlo masivamente.

**17. ¿Cuánto cuesta?**
No hay licencias, porque Laravel, FastAPI, PostgreSQL, PostGIS y Redis son libres. El costo es el hosting y servicios como el correo. El documento todavía no tiene un presupuesto detallado.

**18. ¿Funciona en otras universidades?**
El alcance del proyecto es la UNAB en el periodo 2026-2. El diseño ya contempla varias instituciones, porque cada una tiene sus dominios de correo autorizados, y se activa cuando haya una segunda universidad.

**19. ¿Qué TRL tienen hoy, de verdad?**
Arrancamos en TRL 3. Hoy el sistema está integrado y desplegado, que técnicamente es TRL 4–5 en entorno de laboratorio y producción. TRL 6 requiere la validación con usuarios en el entorno real, que es el piloto.

**20. ¿Por qué el pivote a "sin pagos"?**
Por tres razones: el riesgo legal de cobrar por transporte, la complejidad y el costo de la pasarela, y que el cliente real es la institución. Quedó documentado en un registro de decisión de arquitectura (ADR 0001).

**21. Trabajaste solo: ¿cómo manejaste el alcance?**
Con hitos pequeños y verificables en el repositorio, integración continua desde el primer commit, y decisiones de recorte explícitas: el pivote sin pagos y congelar la web.

### D. Si te preguntan por el documento ⚠️
El documento tiene partes heredadas de la plantilla de la rúbrica: marco legal, estado del arte, variables de gestión documental y tres metas de TRL distintas. **No lo niegues.** Responde: *"El documento de anteproyecto tiene secciones que estoy reescribiendo para la versión final; lo que les presento es el estado real del proyecto."* Y corrígelo en el Google Doc antes de la sustentación formal (ver `revision_autor.md`).

---

## Parte 3. Antes de subir al escenario
- [ ] **Diapositiva 5 rota:** la matriz muestra "—" en todas las celdas, incluida la de UniWheels. Llénala (UniWheels: ✓ comunidad verificada, ✓ emparejamiento por ruta, ✓ paradas sugeridas, ✓ enfoque UNAB) o vuelve a las tres tarjetas.
- [ ] Borra las notas "[Nota de revisión…]" de las diapositivas 6, 7, 9 y 12.
- [ ] Prueba el QR con tu celular y abre uniwheels.org en la sala.
- [ ] Ensaya dos veces con cronómetro. Objetivo: 9:40, y usa los 20 s que sobran para respirar.
- [ ] Ten la app abierta en el teléfono por si piden una demo.
- [ ] Instala Open Sans en el equipo de la sala o lleva el PDF.
