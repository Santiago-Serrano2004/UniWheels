# Preguntas probables del jurado (5 min de Q&A)

Origen de cada respuesta: **[Doc Lxx]** = `tesis/export/proyecto-de-grado_latest.md`; **[Repo]** = código y documentación del repositorio; **[Pendiente]** = el documento aún no lo desarrolla, la respuesta es una propuesta que Santiago debe confirmar antes de exponer.

1. **¿Cómo garantizan la seguridad de los pasajeros?**
   Solo entra la comunidad con correo institucional vigente, y el emparejamiento es entre conductores y pasajeros verificados de la UNAB [Doc L124, L67, L135]. En el producto, el viaje inicia con una verificación por PIN y los conductores pasan por un flujo de revisión de documentos [Repo: README]. La seguridad se medirá con la guía OWASP de pruebas móviles [Doc L424].

2. **¿Cuál es el modelo de negocio y cómo se sostiene?**
   B2B: la universidad paga una licencia y la app es gratis para estudiantes y personal; la plataforma no procesa pagos ni cobra comisión [Repo: README, ADR 0001]. El documento solo habla de bajo costo operativo en el piloto por usar tecnologías de código abierto [Doc L100]; el modelo B2B **no está desarrollado en el documento** [Pendiente].

2b. **¿No es un servicio de transporte informal o remunerado?**
   El propósito es compartir gastos de trayectos que el conductor ya hace, sin ánimo de lucro mercantil ni prestación de servicio de transporte remunerado [Doc L95, L135]. En el producto, el aporte al conductor se acuerda fuera de la app y tiene un tope sugerido [Repo: ADR 0001]. El propio repo marca el riesgo legal como alto y pendiente de validación con un abogado [Pendiente].

3. **¿Por qué no usar Uber, DiDi o Waze Carpool?**
   El documento no analiza esas plataformas [Doc L166-220 es texto de ejemplo]. Lo que sí dice: el carpooling universitario opera como comunidad cerrada y solidaria, a diferencia del ride-hailing comercial [Doc L135], y el diferencial de UniWheels es emparejar trayectorias sobre el mapa vial y proponer paradas óptimas con DARP-TW, ALNS y XGBoost [Doc L96-98]. Referente real citado: Vai, de la Universidad de los Andes [Doc L96]. **Falta una comparación formal de competidores** [Pendiente].

4. **¿Cómo protegen los datos personales?**
   El marco normativo del documento es texto de ejemplo y no cubre UniWheels [Doc L222-271]. Lo que existe en el producto: control de acceso por correo institucional y borrado de cuenta contemplado conforme a la ley colombiana de protección de datos [Repo: README]. Recomendación: citar la Ley 1581 de 2012 y describir qué datos se recogen antes de la sustentación [Pendiente].

5. **¿Escala a otras universidades?**
   El alcance del anteproyecto se limita a la UNAB y su área metropolitana, periodo 2026-2 [Doc L124]. El documento deja la base para futuras fases de escalamiento [Doc L426]. El diseño multi-institución está especificado en el repo y se implementará cuando haya un segundo cliente [Repo: specs/pivote-b2b-sin-pagos.md].

6. **¿Han validado con usuarios reales?**
   Todavía no hay resultados reportados en el documento. La validación prevista es evaluación de campo con la comunidad UNAB, escala SUS y pruebas de carga [Doc L114, L422-424]. Si hay datos nuevos (usuarios, pruebas, despliegue), agréguenlos a la diapositiva 11 antes de exponer [Pendiente].

7. **¿Cuáles son las limitaciones del proyecto?**
   Delimitado a la comunidad UNAB con correo institucional, al perímetro urbano de Bucaramanga y su área metropolitana, y al periodo 2026-2 [Doc L124]. Desarrollo a cargo de una sola persona [Doc L346]. La eficacia de la optimización depende de datos de tráfico en tiempo real de un tercero (TomTom) [Doc L100].

8. **¿Qué nivel de madurez (TRL) tiene y cuál esperan?**
   Parte de TRL 3 (prueba de concepto) y apunta a TRL 6: prototipo integrado y validado en un entorno relevante [Doc L121]. Ojo: el documento contiene dos metas distintas (TRL 5 en L398 y L404-408, TRL 3-5 en L436-440) que son texto de ejemplo; usar siempre TRL 3 → 6.

9. **¿Cuánto cuesta construirlo y operarlo?**
   Sin licencias: Laravel, FastAPI, PostgreSQL/PostGIS y Redis son de código abierto, lo que da bajo costo operativo en el piloto [Doc L100]. El documento no incluye presupuesto detallado (se menciona como anexo opcional [Doc L317]) [Pendiente].

10. **¿Por qué microservicios y no un monolito?**
    Permite escalar de forma independiente cargas distintas (identidad, vehículos, consultas espaciales, optimización) y aislar fallos [Doc L138-140]. En la práctica cada servicio tiene su base de datos y se despliega y migra por separado [Repo: README, decisiones de diseño].

11. **¿Por qué móvil primero y no web?**
    Quienes viajan lo hacen desde el celular: el pasajero fija su punto de recogida con coordenadas reales y el conductor inicia, finaliza o cancela el viaje desde la app [Repo: historial de commits]. El documento no justifica formalmente la elección móvil (su comparación de alternativas es texto de ejemplo, L352-367) [Pendiente]. El documento aún habla de una "plataforma web con React" (L112, L120) por una versión anterior del alcance; el producto actual es la app móvil y la SPA web quedó congelada [Pendiente: actualizar el documento].

12. **¿Qué falta para lanzarlo?**
    Según el alcance: pasar de TRL 3 a TRL 6 con validación de campo [Doc L121]. Según el repo: acuerdo con la universidad (B2B), validación legal del aporte al conductor y publicación en tiendas [Repo: specs/pivote-b2b-sin-pagos.md, specs/tareas/T3a].

13. **¿Cómo funciona la optimización de rutas?**
    Un modelo XGBoost predice el tiempo de llegada con telemetría de tráfico, y una heurística ALNS resuelve la inserción de paradas bajo el problema de recogida y entrega con ventanas de tiempo (DARP-TW), que es NP-duro [Doc L67, L161-164]. Un desvío solo se sugiere si es óptimo para el pasajero y queda dentro del umbral tolerado por el conductor [Doc L97-98].

14. **¿Qué pasa si hay pocos usuarios al inicio (arranque en frío)?**
    El documento no lo trata [Pendiente]. Argumento defendible desde el documento: la demanda preexistente es alta (alto uso de motos y carros con un solo ocupante, parqueaderos desbordados) y la comunidad es cerrada, lo que concentra los trayectos en las mismas cuatro sedes [Doc L71-73, L95].

15. **¿Por qué solo 3 riesgos?**
    La tabla del documento es genérica y no incluye probabilidad [Doc L412-416]. Reconocerlo y ofrecer ampliarla (seguridad física, arranque en frío, cumplimiento legal del aporte) en la versión final [Pendiente].
