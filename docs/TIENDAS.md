# Publicación en App Store y Google Play

- **Identificador:** `org.uniwheels.app` (definitivo, no se puede cambiar después de publicar).
- **Estado:** la configuración de la app está en la tarea T3a. Este documento cubre lo que hace el usuario y los textos de las fichas.

## 1. Lo que hace el usuario (una sola vez)
| Paso | Costo | Notas |
|---|---|---|
| Cuenta **Apple Developer** (persona natural) | US$99/año | developer.apple.com/programs. La verificación de identidad tarda de 1 a 2 días. El nombre del vendedor que se ve en la tienda es tu nombre legal |
| Cuenta **Google Play Console** (personal) | US$25 una vez | play.google.com/console. Las cuentas personales nuevas tienen que hacer una **prueba cerrada con 12 testers durante 14 días** antes de poder publicar en producción |
| Cuenta **Expo** (EAS) | Gratis | Plan gratuito: unas 15 builds de iOS y 15 de Android al mes, en cola de baja prioridad. Suficiente |
| Llave de TomTom como variable de EAS | — | `eas env:create --name EXPO_PUBLIC_TOMTOM_API_KEY --value <llave> --environment production --visibility plaintext` |

**iOS desde Linux:** las builds de iOS se hacen en EAS, en la nube (`eas build -p ios`), porque compilar iOS en local exige macOS. Las de Android se pueden hacer en la nube o en local (`eas build -p android --local`).

## 2. Comandos (cuando las cuentas estén listas)
```bash
cd mobile
npx eas login
npx eas build:configure          # vincula el proyecto (crea projectId en app.json)
npx eas build -p android --profile preview      # APK para probar en tu teléfono
npx eas build -p all --profile production       # builds para las tiendas
npx eas submit -p ios --latest                   # sube a App Store Connect (TestFlight)
npx eas submit -p android --latest               # sube a la pista interna de Play
```

## 3. Cuenta de prueba para la revisión (obligatoria)
Apple y Google revisan la app iniciando sesión, y **sus revisores no tienen un correo universitario**. Hay que darles una cuenta lista:
1. Crea en producción un usuario de revisión con un correo institucional que controles, por ejemplo `revision.uniwheels@<dominio de la institución piloto>`. Si no tienes uno, pídele a Bienestar un correo de prueba.
2. Hazlo conductor con un vehículo aprobado y publica una ruta futura. Así el revisor ve la búsqueda con resultados.
3. Pon el usuario y la contraseña **solo** en el campo "Notas para el revisor" de App Store Connect y en "Acceso a la app" de Play Console. **Nunca en el repo.**

**Texto para las notas de revisión:**
> UniWheels es una plataforma de viajes compartidos exclusiva para comunidades universitarias: solo pueden registrarse personas con correo institucional verificado. Para revisarla, use la cuenta de prueba indicada. La app no procesa pagos: los usuarios acuerdan un aporte de gastos que se paga directamente entre ellos, fuera de la app. La ubicación se usa solo con la app abierta. La cuenta se puede eliminar en Perfil > Eliminar cuenta.

## 4. Ficha de la tienda (es-CO)
- **Nombre:** UniWheels (App Store, 30 caracteres máx.) / UniWheels: viajes universitarios (Play, 30 caracteres máx.)
- **Subtítulo (iOS, 30 caracteres):** Viaja con tu comunidad
- **Descripción corta (Play, 80 caracteres):** Comparte el viaje a la universidad con personas verificadas de tu comunidad.
- **Descripción:**
  > UniWheels conecta a estudiantes, docentes y personal de tu universidad que van hacia o desde el campus, para compartir el viaje.
  >
  > • Solo personas de tu comunidad: cada cuenta se verifica con el correo institucional.
  > • Conductores revisados: Bienestar Universitario aprueba los documentos de cada vehículo (licencia, SOAT y revisión técnico-mecánica).
  > • Busca rutas cerca de ti y reserva tu cupo en segundos.
  > • Sube con un PIN de 4 dígitos que confirma que es el viaje correcto.
  > • Botón SOS para avisar a tus contactos y a la universidad en una emergencia.
  > • Aporte justo: el conductor indica un aporte de gastos por cupo, menor que el de una app de transporte. Se paga directamente al conductor. UniWheels no cobra comisión.
  >
  > Disponible para las instituciones aliadas. Si tu universidad aún no está, avísanos en uniwheels.org.
- **Palabras clave (iOS, 100 caracteres):** carpooling,universidad,viaje compartido,campus,estudiantes,ruta,transporte,movilidad
- **Categoría:** Viajes (iOS) / Mapas y navegación (Play)
- **URL de privacidad:** https://uniwheels.org/privacidad
- **URL de soporte:** https://uniwheels.org/soporte
- **Clasificación por edad:** 17+ en iOS, por el contenido generado por usuarios y los encuentros con terceros. En Play, completa el cuestionario IARC (sin violencia ni compras). Restringir a mayores de edad es coherente con el tipo de servicio.

## 5. Capturas de pantalla
- **iOS:** iPhone de 6.9" (1320 × 2868) es obligatorio. Las demás medidas se generan a partir de esa.
- **Android:** al menos 2 capturas de teléfono (mínimo 1080 px en el lado corto) y el gráfico de funciones (1024 × 500).
- **Pantallas sugeridas, en orden:** búsqueda con resultados, publicar ruta con aporte sugerido, viaje activo con PIN, botón SOS y perfil verificado.

## 6. Privacidad declarada en las tiendas (refleja lo que hace el código el 2026-10-05)
**App Store, "App Privacy"** (todo vinculado al usuario y **sin seguimiento**):

| Dato | Se recopila | Uso |
|---|---|---|
| Nombre, correo y teléfono | Sí | Funcionalidad de la app |
| Ubicación precisa | Sí, con la app abierta | Funcionalidad de la app (rutas, mapa, SOS) |
| Fotos | Sí (documentos del vehículo y foto de perfil) | Funcionalidad de la app |
| Identificadores (id de usuario y token de notificaciones) | Sí | Funcionalidad de la app |
| Contenido generado por el usuario (calificaciones y datos del vehículo) | Sí | Funcionalidad de la app |
| Documento de identidad y código estudiantil | Sí ("Otros datos") | Funcionalidad de la app (verificación) |
| Datos de pago, salud, contactos, historial de navegación y analítica | **No** | — |

**Google Play, "Seguridad de los datos":**
- Recopila los mismos tipos de datos.
- **No los comparte con terceros**: los servicios propios no cuentan.
- Los datos se cifran en tránsito.
- **El usuario puede pedir que se eliminen** (desde la app, y en https://uniwheels.org/soporte).
- No se usan para publicidad ni analítica.

> Si se agrega analítica o algún SDK de terceros (Sentry, Firebase, etc.), hay que **actualizar estas declaraciones antes** de publicar la versión.

## 7. Términos de uso (BORRADOR, pendiente de aprobación del usuario y de revisión legal)
Se publicarán en `/terminos` cuando estén aprobados.

1. **Qué es UniWheels.** Una herramienta para que miembros verificados de una comunidad universitaria coordinen viajes compartidos. UniWheels **no presta servicios de transporte** ni es empleador de los conductores.
2. **Quién puede usarla.** Mayores de edad con correo institucional vigente de una institución aliada.
3. **Aporte de gastos.** El conductor indica un aporte por cupo, que no puede superar el valor sugerido por la app. Se paga directamente entre usuarios, fuera de la app. UniWheels no cobra comisión, no procesa pagos y no media en disputas de dinero.
4. **Obligaciones del conductor.** Licencia vigente, SOAT y revisión técnico-mecánica al día, un vehículo en buen estado y cumplir las normas de tránsito. Bienestar Universitario verifica los documentos, pero **la responsabilidad sobre el vehículo y la conducción es del conductor**.
5. **Conducta.** Respeto, puntualidad y uso del PIN de abordaje. Está prohibido el acoso, la discriminación y el uso comercial (transportar personas ajenas a la comunidad o cobrar por encima del aporte).
6. **Cancelaciones.** Las cancelaciones tardías se registran. Con 3 en 30 días la cuenta se suspende 30 días.
7. **Seguridad.** El botón SOS avisa a los contactos y a la institución, pero **no reemplaza a las líneas de emergencia (123)**.
8. **Suspensión.** La institución o UniWheels pueden suspender cuentas que incumplan estos términos.
9. **Datos personales.** Se tratan según la política de privacidad (https://uniwheels.org/privacidad).
10. **Limitación de responsabilidad.** UniWheels no responde por los actos de los usuarios ni por accidentes durante los viajes, en la medida permitida por la ley colombiana.
11. **Cambios.** Los términos pueden cambiar. Si el cambio es importante, se avisa en la app.
12. **Ley y contacto.** Leyes de Colombia. Contacto: uniwheelscontact@gmail.com.

> ⚠️ Los puntos 1, 3, 4 y 10 son los que más importan frente al riesgo D12 y a la responsabilidad civil: **llévalos al abogado** junto con el concepto sobre el aporte.
