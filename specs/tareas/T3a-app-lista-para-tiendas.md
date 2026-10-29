# T3a: app lista para App Store y Google Play (configuración)

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/t3a-tiendas` y abre **un solo PR** contra la rama base.
- **Antes de empezar:** lee `mobile/AGENTS.md`. Expo SDK 57 está fijado; **no subas versiones** de dependencias.
- **CI en verde obligatoria.** Haz push después de cada commit.

## 1. Identificador permanente
En `mobile/app.json`:
- `ios.bundleIdentifier` y `android.package` → **`org.uniwheels.app`**;
- `scheme` se queda en `uniwheels`.

Busca con grep `co.edu.unab` en todo el repo y cámbialo donde sea configuración de la app. **No toques** `docs/`, la tesis, ni la referencia a la institución en el seeder.

## 2. Textos de permisos (español, coherentes y fieles a lo que hace la app)
Hoy los textos de `ios.infoPlist` contradicen a los de los plugins: el de la cámara dice "documentos vehiculares y foto de perfil" en un lugar y solo "foto de perfil" en otro, y el de la galería menciona "tarjeta de propiedad". **Unifícalos**: deja una sola fuente, preferiblemente los plugins `expo-location` y `expo-image-picker`, y quita del `infoPlist` lo que esté duplicado.
- **Ubicación:** "UniWheels usa tu ubicación mientras usas la app para mostrarte en el mapa, encontrar rutas cercanas y compartirla en una emergencia (SOS)."
- **Cámara:** "UniWheels usa la cámara para que fotografíes los documentos de tu vehículo y tu foto de perfil."
- **Fotos:** "UniWheels accede a tus fotos para que adjuntes los documentos de tu vehículo o elijas tu foto de perfil."

Revisa con grep si la app usa ubicación en segundo plano. **Si no la usa, no declares permisos de background.** Si la usa, repórtalo en el PR y no lo cambies.

## 3. Manifiesto de privacidad de iOS
- Agrega `ios.privacyManifests` en `app.json`, según la documentación de Expo SDK 57.
- Declara `NSPrivacyAccessedAPITypes` para las APIs con *required reason* que usan Expo y React Native: como mínimo `NSPrivacyAccessedAPICategoryUserDefaults` (CA92.1), `FileTimestamp` (C617.1), `SystemBootTime` (35F9.1) y `DiskSpace` (E174.1). Revisa la documentación de Expo de tu versión y ajusta la lista.
- `NSPrivacyTracking: false`.

## 4. `eas.json`
- En los tres perfiles (`development`, `preview` y `production`), agrega las variables públicas que lee `mobile/src/lib/env.ts`:
  - `EXPO_PUBLIC_VEHICLE_API_URL`, `EXPO_PUBLIC_ROUTE_API_URL`, `EXPO_PUBLIC_TRIP_API_URL` y `EXPO_PUBLIC_NOTIFICATION_API_URL`, todas con valor `https://uniwheels.org/api/v1`;
  - **no** pongas `EXPO_PUBLIC_TOMTOM_API_KEY` en el repo: documenta en `mobile/README.md` que se configura como variable de entorno de EAS (`eas env:create`).
- En la sección `submit`, quita los datos inventados (`appleId` y `ascAppId: "1234567890"`) y deja **placeholders explícitos** con un comentario en el README. Como `eas.json` no admite comentarios, escribe la guía en el README.
- `appVersionSource: remote` se mantiene, y `production` lleva `autoIncrement: true`.

## 5. Limpieza de assets
- Borra de `mobile/assets/images` los archivos de plantilla que nadie usa: `expo-badge*.png`, `expo-logo.png` y `react-logo*.png`. **Antes de borrar, verifica con grep** que no se usen.
- Verifica que existan y sean válidos: `icon.png` (1024×1024, **sin transparencia**, porque iOS la rechaza), el splash, el ícono adaptativo de Android y el de notificaciones. Comprueba las dimensiones con `python3 -c` y PIL, o con `file`. Si `icon.png` tiene canal alfa, genera una versión con fondo `#020617` **sin cambiar el diseño**.

## 6. Páginas públicas que exigen las tiendas (landing)
Las tiendas piden **URL** de la política de privacidad y de soporte. Hoy la política solo existe como modal.
- Ruta **`/privacidad`**: página completa con **el mismo texto** de `PrivacyModal.jsx`. Extrae el contenido a un componente compartido; no dupliques el texto.
- Ruta **`/soporte`**: correo de contacto (`uniwheelscontact@gmail.com`), cómo eliminar la cuenta (Perfil > Eliminar cuenta) y un enlace a `/privacidad`.
- Que nginx de la landing sirva esas rutas, con *fallback* a `index.html` si es SPA. Revisa `docker/landing.Dockerfile` o su config de nginx.
- Pon enlaces a las dos páginas en el footer.
- Modo claro, sin emojis y sin nombrar universidades.
- **Términos de uso: NO los escribas.** El texto lo redacta y aprueba el usuario aparte.

## 7. Versión visible y eliminación de cuenta
- Verifica que **Perfil > Eliminar cuenta** se pueda encontrar sin tener viajes activos. Es un requisito de Apple (5.1.1(v)).
- Si existe una pantalla "Acerca de", que muestre la versión desde `expo-constants`. **Si no existe, no la crees.**

## Verificación
- `cd mobile && npm ci && npm run lint && npx tsc --noEmit`: sin errores nuevos.
- `npx expo config --type public`: sin errores, y muestra `org.uniwheels.app` y `privacyManifests`.
- `npx expo export --platform ios` y `--platform android`: compilan. Si la sesión no puede, dilo en el PR.
- `cd landing && npm run build` en verde.
- **Nada de** `eas build` ni `eas submit`: eso lo hace el usuario con su cuenta.

## Criterios de terminado
- CI en verde, con el link en el PR.
- Una lista en el PR de lo que tiene que hacer el usuario: cuentas de desarrollador, `eas env:create` para TomTom y `appleId`/`ascAppId`.
- Si algo falla dos veces por la misma causa, detente y documéntalo. Nada fuera de este alcance.
