# P2: lista de espera en la landing

- **Rama base:** `pivote/b2b-sin-pagos`, **después** de que se mergee P1, porque las dos tocan el panel. Crea `pivote/p2-lista-espera` y abre **un solo PR** contra la rama base.
- **Objetivo:** validar la demanda antes del lanzamiento. Meta: 150 inscritos en 3 semanas, al menos 30 de ellos conductores, concentrados en un corredor.
- **CI en verde obligatoria.** auth-service usa **Pest**.

## auth-service
1. **Migración** `waitlist_entries`:
   - `id` uuid;
   - `email` (único, en minúsculas);
   - `role` (`pasajero`, `conductor` o `ambos`);
   - `neighborhood` (string 80);
   - `campus_id` (FK `institution_campuses`, nullable);
   - `usual_time` (`06-08`, `08-10`, `10-12`, `12-14`, `14-16`, `16-18`, `18-20` o `20-22`);
   - `direction` (`hacia_campus`, `desde_campus` o `ambas`);
   - `consent_at` (timestamp);
   - `created_at`.
2. `POST /api/v1/waitlist`, **público**:
   - FormRequest con validaciones;
   - el correo tiene que pertenecer a un dominio institucional existente (reutiliza la regla `InstitutionalEmailRule`), pero **sin exigir que la institución esté elegida**: se deduce del dominio;
   - `consent` obligatorio (`accepted`);
   - throttle: 5 por minuto por IP y 3 por día por correo;
   - si el correo ya existe, responde **200** con el mismo mensaje de éxito, sin revelar que ya estaba inscrito.
3. **Admin**, con `jwt.auth` + `admin`:
   - `GET /api/v1/admin/waitlist`: paginado, con filtros por rol, sede y dirección, más los totales por rol, por sede, por barrio (top 10) y por franja horaria;
   - `GET /api/v1/admin/waitlist/export`: CSV con todas las columnas.
4. **Ley 1581:**
   - el correo de la lista solo se usa para avisar del lanzamiento;
   - `DELETE /api/v1/waitlist` con `{ email }` lo borra, siempre responde 200 y tiene throttle;
   - documéntalo en el mensaje de éxito.

## gateway
Agrega `/api/v1/waitlist` y `/api/v1/admin/waitlist` al bloque de auth-service en `gateway/api-locations.conf`, siguiendo el patrón actual.

## landing
1. **Sección nueva "Avísame cuando lancemos"** (`#lista-espera`), antes de las preguntas frecuentes, con un enlace en la navbar. Va **siempre en modo claro**, sin emojis, sin nombrar ninguna universidad en particular y con el estilo de las demás secciones.
2. **Formulario** con:
   - correo institucional;
   - "Quiero" (Viajar como pasajero / Llevar gente en mi carro o moto / Ambos);
   - barrio (texto con sugerencias de barrios de Bucaramanga y el área metropolitana);
   - sede (las sedes vienen de `GET /api/v1/institutions`, según el dominio del correo);
   - franja horaria habitual;
   - sentido;
   - casilla de autorización: "Autorizo el tratamiento de mi correo solo para avisarme del lanzamiento, según la política de datos", con un enlace al modal de privacidad existente.
3. **Mensajes:**
   - éxito: "Listo. Te avisaremos cuando UniWheels llegue a tu universidad.";
   - errores por campo, con el texto que devuelve el backend.

## admin
Página **"Lista de espera"** (`/lista-espera`):
- tarjetas con el total, los conductores, los pasajeros y "ambos";
- tablas de las 10 sedes, barrios y franjas con más inscritos;
- listado filtrable;
- botón "Exportar CSV".

## Tests
- **auth:**
  - inscripción válida → 201 o 200;
  - correo de un dominio no institucional → 422;
  - sin consentimiento → 422;
  - correo repetido → 200 sin duplicar;
  - throttle → 429;
  - el listado de admin trae los agregados correctos;
  - un usuario que no es admin recibe 403;
  - el CSV tiene el encabezado correcto;
  - la baja por correo funciona.
- **landing y admin:** `npm run build` en verde.

## Criterios de terminado
- CI en verde, con el link en el PR.
- **Nota de despliegue:** migración, gateway, landing y panel.
- Si algo falla dos veces por la misma causa, detente y documéntalo. Nada fuera de este alcance.
