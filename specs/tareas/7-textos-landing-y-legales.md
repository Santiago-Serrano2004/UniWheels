# Fase 7: textos de la landing y textos legales (BORRADOR PARA APROBACIÓN)

> **Estado: APROBADO** por el usuario el 2026-10-05. El responsable del tratamiento queda pendiente. Esto no es asesoría legal: conviene que el abogado lo revise junto con el tema D12.
>
> ⚠️ **Responsable del tratamiento: PENDIENTE.** UniWheels aún no es una empresa constituida. Mientras tanto se publica "UniWheels" como responsable. **Antes del lanzamiento comercial** hay que reemplazarlo por la persona natural o la empresa, con su identificación.

## Correcciones de afirmaciones falsas en los textos actuales
| Dónde | Texto actual | Problema |
|---|---|---|
| Landing `PrivacyModal`, app `HabeasDataModal` | "Tus trayectorias se procesan bajo cifrado y anonimización geoespacial." | La anonimización no está implementada. El cifrado solo existe en tránsito (HTTPS) |
| App `HabeasDataSignatureStep` | "validar la autenticidad de los documentos vehiculares en el RUNT, SIMIT y entidades de tránsito" y "consulta de antecedentes" | No hay integración con RUNT ni SIMIT, ni consulta de antecedentes. Bienestar revisa los documentos manualmente |
| Landing y app | "revocar la autorización desde la sección de Perfil" | La app solo permite **eliminar la cuenta**. Hay que decirlo así |

---

## A. Política de tratamiento de datos (landing `PrivacyModal.jsx` y app `HabeasDataModal.tsx`)

**Título:** Tratamiento de datos personales
**Subtítulo:** Ley 1581 de 2012 y Decreto 1377 de 2013

**Responsable del tratamiento.** UniWheels. Contacto: uniwheelscontact@gmail.com. La institución educativa que ofrece UniWheels a su comunidad accede a los datos necesarios para administrar el servicio desde su panel de Bienestar.

**1. Qué datos tratamos**
- Nombre, correo institucional, código o rol en la universidad, sede y teléfono si lo registras.
- Rutas publicadas, reservas y ubicación durante los viajes activos.
- Si eres conductor: datos del vehículo y documentos (licencia de conducción, SOAT, revisión técnico-mecánica) y tu firma de autorización.
- Calificaciones, cancelaciones y reportes de seguridad (SOS).

**2. Para qué los usamos**
- Verificar que perteneces a la comunidad universitaria.
- Conectar conductores y pasajeros con rutas compatibles.
- Permitir la revisión de los documentos del conductor por parte de Bienestar Universitario.
- Atender emergencias reportadas con el botón SOS y mejorar la seguridad de los viajes.
- Aplicar las reglas de uso, como las cancelaciones tardías y las suspensiones.

**3. Lo que no hacemos**
- No vendemos ni compartimos tus datos con terceros para publicidad.
- No procesamos pagos ni guardamos datos de tarjetas o cuentas bancarias: los aportes se pagan directamente entre usuarios.

**4. Seguridad y conservación**
- La comunicación entre la app y nuestros servidores viaja cifrada (HTTPS).
- El acceso a los documentos del conductor está restringido al personal autorizado de la institución.
- Los puntos de ubicación de los viajes se eliminan 7 días después de terminado el viaje.

**5. Tus derechos**
Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de la autorización, presentar quejas ante la Superintendencia de Industria y Comercio, y revocar la autorización o pedir que se eliminen tus datos. Para eliminarlos, usa **Perfil > Eliminar cuenta** en la app, o escribe a uniwheelscontact@gmail.com. Respondemos en los plazos de ley: 10 días hábiles para consultas y 15 para reclamos.

## B. Autorización del conductor (`HabeasDataSignatureStep.tsx`)

**Encabezado de firma (l. ≈332):**
> Para enviar tus documentos a revisión debes firmar esta autorización.

**Texto de autorización (l. ≈398):**
> Autorizo a UniWheels y a mi institución educativa a tratar los datos y documentos de mi vehículo y mi licencia de conducción, con el fin de que el personal de Bienestar Universitario verifique su vigencia y autenticidad antes de aprobarme como conductor, conforme a la política de tratamiento de datos (Ley 1581 de 2012). Declaro que la información y los documentos que envío son verdaderos y están vigentes.

**Mensaje final (l. ≈533):** sin cambios. Ya dice que Bienestar revisará los documentos.

## C. Landing: preguntas frecuentes (`FAQ.jsx`)

| Pregunta | Respuesta nueva |
|---|---|
| **¿Cómo se paga el viaje?** | El conductor indica un aporte por cupo al publicar su ruta. La app sugiere un valor máximo según la distancia, y el conductor puede cobrar menos o llevarte gratis. Le pagas el aporte directamente, en efectivo o por Nequi. UniWheels no cobra comisión ni procesa pagos. |
| **¿Puedo cancelar una reserva?** | Sí, desde la app y antes de que empiece el viaje. Si cancelas a menos de 2 minutos de la salida (o, siendo conductor, a menos de 15 minutos con pasajeros confirmados), se registra una cancelación tardía. Con 3 cancelaciones tardías en 30 días, la cuenta se suspende por 30 días. |
| **¿Qué pasa con mis datos?** | Los tratamos según la Ley 1581 de 2012. Los usamos solo para operar el servicio y para la seguridad de los viajes; no los vendemos ni procesamos pagos. La comunicación con nuestros servidores viaja cifrada. *(se mantiene el enlace a la política)* |
| **¿Cuánto cuesta usar UniWheels?** *(nueva)* | Nada. La app es gratis para estudiantes, docentes y personal: la licencia la paga tu universidad. |
| Las demás | Sin cambios |

## D. Landing: nueva sección "Para universidades"
Va entre `ForDrivers` y `FAQ`, con ancla `#universidades` y enlace en el `Navbar`.

**Título:** Para universidades

**Texto:** UniWheels es una plataforma de viajes compartidos solo para tu comunidad: cada persona se verifica con su correo institucional y cada conductor, con sus documentos.

**Dos puntos:**
- **Panel de Bienestar:** revisa los documentos de los conductores, atiende las alertas SOS y gestiona suspensiones.
- **Comunidad verificada:** solo entran personas con correo de tu institución. Nadie de afuera ve las rutas.

**Llamado a la acción:** botón "Escríbenos" con `mailto:uniwheelscontact@gmail.com?subject=UniWheels%20para%20mi%20universidad`.

## E. `HowItWorks.jsx` (paso 3 del pasajero)
> Cuando llega el conductor, le dictas tu PIN de 4 dígitos. Le pagas el aporte directamente, en efectivo o por Nequi.

Se quita "o con tarjeta desde la app".

---

## Instrucciones para el ejecutor (solo cuando esté APROBADO)
- Aplica los textos **literalmente**, sin reescribirlos.
- Landing: `cd landing && npm run build`, sin errores. App: `npm run lint` sin errores nuevos.
- Reglas de UI: cero emojis, la landing siempre en modo claro y sin mencionar ninguna universidad específica.
- Grep en `landing/src` y `mobile/src`: sin resultados para `anonimiz|RUNT|SIMIT|antecedentes|tarjeta desde la app`.
