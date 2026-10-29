# Sugerencias para la tesis tras el pivote B2B sin pagos (fase 10)

- **Fecha:** 2026-10-05.
- **Base:** `tesis/export/proyecto-de-grado_latest.md` (exportado el **2026-09-10**). Si editaste el Doc después, vuelve a exportar con `tesis/scripts/snapshot.py` y revisa que las líneas citadas sigan iguales.
- **Uso:** pega cada cambio como **Sugerencia** en el Google Doc. Desde aquí no se edita el Doc. Las fuentes ya presentes están protegidas (`tesis/notas/protegido.md`): no se tocan sus citas.
- **Contexto técnico:** `docs/adr/0001-pivote-b2b-sin-pagos.md` y `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`.

> **Ojo con el alcance académico:** la tesis evalúa una solución técnica, no un plan de negocio. No hace falta meter el modelo B2B entero; basta con que el documento **no contradiga** el sistema construido. Los cambios de abajo son los mínimos para eso, más las incoherencias graves que encontré de paso.

---

## A. Cambios por el pivote (obligatorios)

### A1. §5 Alcance y delimitación, párrafo "Desde el punto de vista funcional…" (l. 126)
- **Texto actual (resumen):** "se incluyen la integración de pasarelas de pago bancario con moneda de curso legal y la consulta automatizada a bases de datos gubernamentales externas en tiempo real".
- **Problema:**
  - ya no hay pagos;
  - la consulta a bases gubernamentales (RUNT/SIMIT) **nunca se implementó**: Bienestar revisa los documentos manualmente.
- **Propuesta:**
  > Desde el punto de vista funcional, la plataforma no procesa pagos: el aporte por los gastos del trayecto lo indica el conductor dentro de un tope que calcula el sistema según la distancia, y se paga directamente entre usuarios. La verificación de los documentos del conductor (licencia, SOAT y revisión técnico-mecánica) la realiza el personal de Bienestar Universitario desde un panel de administración, sin integración automatizada con bases de datos gubernamentales. La arquitectura se ejecuta sobre infraestructura y componentes de código abierto en contenedores, descartando rutas interdepartamentales y operaciones comerciales ajenas al esquema de transporte solidario universitario.
- **Justificación:** coherencia con el sistema real (ADR 0001) y eliminación de un alcance no cumplido, que un jurado detectaría en la demo.

### A2. §6.1 Marco teórico, párrafo de antecedentes (l. 96, cita Forbes, 2023)
- **No cambies la cita.** Opcional: agrega una oración al final del párrafo sobre el modelo de sostenibilidad:
  > A diferencia de esquemas que monetizan cada trayecto mediante comisiones, UniWheels adopta un modelo institucional: la universidad financia la plataforma y el uso es gratuito para su comunidad, lo que la aproxima a una herramienta de coordinación entre miembros y no a un servicio de transporte remunerado.
- **Si quieres citar** el riesgo regulatorio (infracción D12, Ley 769 de 2002, art. 131), hazlo con la fuente primaria (la ley), no con prensa. El agente `tesis-citas` puede verificarla.

### A3. §7.6 Análisis de factibilidad, viñeta "Económica" (l. 399)
- **Propuesta:**
  > **Económica:** bajo costo operativo al evitar licencias de software privativo y al no integrar pasarelas de pago, lo que elimina comisiones por transacción. La sostenibilidad se plantea mediante el financiamiento institucional de la plataforma, con uso gratuito para la comunidad universitaria.

### A4. Reglas del sistema (donde describas el funcionamiento, por ejemplo §7.4 Diseño de ingeniería)
Si el documento menciona tarifas, comisiones, billeteras o recargo por desvío, reemplázalos por:
- **aporte sugerido por cupo:** carro $2.000 + $400/km; moto $1.000 + $250/km;
- el conductor indica un aporte entre $0 y el sugerido;
- el desvío no tiene recargo;
- **cancelaciones tardías:** 3 en 30 días suspenden la cuenta por 30 días.

En el export del 2026-09-10 **no encontré** estas menciones fuera de A1. Confírmalo en tu versión actual del Doc.

---

## B. Incoherencias graves encontradas de paso (recomendado corregir antes de entregar)

### B1. §7.5 Identificación de variables (l. 369–394): la tabla parece de **otro proyecto**
- **Evidencia:**
  - la tabla habla de "solicitud de un documento hasta su apertura", "reducción de tiempos de búsqueda documental" y "trazabilidad documental";
  - mide "productividad administrativa".
- **Problema:** nada de eso corresponde a UniWheels. Además promete cosas no implementadas: "cifrado AES-256 de extremo a extremo" y "MFA en ≥ 90 % de los usuarios".
- **Propuesta:** reemplazar las filas de **Operativa** e **Impacto** por variables de movilidad, coherentes con el objetivo específico 4:

| Tipo | Variable | Métrica / indicador |
|---|---|---|
| Operativa | Tiempo de respuesta de la API | p95 < 2 s con 100 usuarios concurrentes |
| Operativa | Usabilidad | SUS ≥ 80/100 |
| Operativa | Tasa de emparejamiento | % de búsquedas con al menos una ruta compatible |
| Impacto | Ocupación vehicular | Pasajeros promedio por viaje publicado |
| Impacto | Ahorro para el pasajero | Aporte promedio frente a la tarifa de una app de transporte para la misma distancia |
| Impacto | Retención | % de usuarios que repiten un viaje en 14 días |

- **Filas técnicas:**
  - "Cifrado AES-256 de extremo a extremo" pasa a "**Cifrado en tránsito (HTTPS/TLS)** y control de acceso por roles con JWT", que es lo que existe;
  - "MFA ≥ 90 %" pasa a "**Verificación del correo institucional con código de 6 dígitos** en el 100 % de los registros", que es lo que existe.

### B2. §7.6 Factibilidad técnica y operativa (l. 398 y 400)
- **Actual:** "viable mediante **Flutter y Firebase**; TRL 5" y "implementación posible en **oficinas piloto** con dispositivos Android".
- **Problema:** el sistema usa Laravel, FastAPI, PostgreSQL/PostGIS y React Native (Expo), y el piloto es universitario.
- **Propuesta:**
  > **Técnica:** viable mediante microservicios en Laravel y FastAPI, PostgreSQL con PostGIS y una app móvil en React Native (Expo) para Android e iOS; TRL proyectado: TRL 6.
  >
  > **Operativa:** implementación posible en un piloto con la comunidad universitaria, con dispositivos Android e iOS y conectividad móvil básica.
- **Cuidado:** el TRL debe coincidir con §5 (allí dice TRL 6).

### B3. §7.8 Análisis de riesgos (l. 416): "Auditorías de código y cifrado extremo a extremo"
Cambia "cifrado extremo a extremo" por "cifrado en tránsito (TLS), control de acceso por roles y revisión de dependencias".

### B4. Objetivo específico 3 y §5 Alcance: "plataforma web… interfaz reactiva en React"
- **Hecho:** el producto final es **una app móvil** (React Native/Expo), más un panel web de administración y una landing. La SPA web está congelada.
- **Atención:** los objetivos suelen estar aprobados desde el anteproyecto. **Pregúntale al director** antes de cambiar el objetivo 3.
- **Si lo autoriza:**
  > Desarrollar la plataforma de transporte universitario compartido mediante servicios API RESTful en Laravel, una aplicación móvil en React Native para Android e iOS, un panel web de administración en React y la sincronización geoespacial en tiempo real, para el rastreo en vivo y la emisión de notificaciones.
- **Si no lo autoriza:** justifica el cambio en la metodología (mobile-first por adopción, como en la sección de riesgos) sin tocar el objetivo.

---

## C. Pendiente fuera del Doc
- `tesis/notas/protegido.md`: si el director ya aprobó §4 Objetivos, regístralo ahí para que `/tesis-auditar` no proponga cambios.
- Después de aplicar las sugerencias, corre `/tesis-auditar 5` y `/tesis-auditar 7` para validar formato y citas.
