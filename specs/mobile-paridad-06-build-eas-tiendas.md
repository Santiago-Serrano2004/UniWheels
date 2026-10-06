> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Spec: Paridad móvil 06 — Pipeline de Compilación EAS Build y Publicación en Tiendas (Google Play / App Store)

## Contexto mínimo (ya investigado, no repetir)

Actualmente en el repositorio:
1. `mobile/app.json` tiene configuraciones incompletas: `apiKey: ""` vacía en `googleMaps`, carece de cadenas de justificación de permisos en iOS (`infoPlist`), y no define variables de compilación seguras.
2. No existe el archivo de configuración `mobile/eas.json` para compilación remota o local con **Expo Application Services (EAS)**.
3. No existen scripts en `mobile/package.json` para empaquetar binarios de prueba (`APK` para Android / `IPA` para TestFlight) ni binarios optimizados de producción (`AAB` - Android App Bundle).
4. El archivo `mobile/README.md` es la plantilla por defecto generada por `create-expo-app`, sin instrucciones sobre dependencias nativas, variables de entorno requeridas ni proceso de despliegue.

Esta especificación formaliza la configuración de compilación, gestión de secretos, manifiestos nativos y la guía de publicación en Google Play Store y Apple App Store para UniWheels.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Pagos de cuentas de desarrollador de Apple Developer Program ($99 USD/año) y Google Play Console ($25 USD pago único) — esto corresponde a la gestión administrativa institucional de la UNAB.
- **Fuera de alcance:** Automatización completa de CI/CD vía GitHub Actions (se implementará como un workflow independiente una vez que las credenciales EAS institucionales estén configuradas).

---

## Tareas

### Tarea 1 — Crear configuración de perfiles EAS (`mobile/eas.json`)

**Archivo nuevo:** `mobile/eas.json`.

**Instrucciones:**
1. Definir los perfiles de compilación estándar de la industria:
   ```json
   {
     "cli": {
       "version": ">= 15.0.0",
       "appVersionSource": "remote"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "channel": "development",
         "env": {
           "EXPO_PUBLIC_API_URL": "https://uniwheels.org/api/v1",
           "EXPO_PUBLIC_APP_ENV": "development"
         }
       },
       "preview": {
         "distribution": "internal",
         "channel": "preview",
         "android": {
           "buildType": "apk"
         },
         "ios": {
           "simulator": false
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://uniwheels.org/api/v1",
           "EXPO_PUBLIC_APP_ENV": "staging"
         }
       },
       "production": {
         "distribution": "store",
         "channel": "production",
         "android": {
           "buildType": "app-bundle"
         },
         "ios": {
           "simulator": false
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://uniwheels.org/api/v1",
           "EXPO_PUBLIC_APP_ENV": "production"
         }
       }
     },
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./google-service-account.json",
           "track": "internal"
         },
         "ios": {
           "appleId": "santiago@unab.edu.co",
           "ascAppId": "1234567890"
         }
       }
     }
   }
   ```

**Verificación:** Ejecutar `npx eas-cli config` o validar sintaxis JSON.

**Mensaje de commit:** `config(mobile): definir perfiles de compilacion eas.json para dev, preview y production`

---

### Tarea 2 — Hardening y manifiestos nativos en `mobile/app.json`

**Archivo:** `mobile/app.json`.

**Instrucciones:**
1. Completar la configuración de **Android**:
   - `package`: `"co.edu.unab.uniwheels"`.
   - `versionCode`: `1`.
   - `permissions`:
     - `ACCESS_FINE_LOCATION` (GPS de alta precisión).
     - `ACCESS_COARSE_LOCATION` (Ubicación aproximada).
     - `POST_NOTIFICATIONS` (Notificaciones push en Android 13+).
     - `CAMERA` (Foto de perfil y captura de documentos).
     - `READ_MEDIA_IMAGES` (Galería fotográfica).
   - Inyección de API Key de Google Maps para Android mediante variable de entorno:
     ```json
     "config": {
       "googleMaps": {
         "apiKey": "${EXPO_PUBLIC_GOOGLE_MAPS_KEY}"
       }
     }
     ```
2. Completar la configuración de **iOS**:
   - `bundleIdentifier`: `"co.edu.unab.uniwheels"`.
   - `buildNumber`: `"1"`.
   - `infoPlist` con explicaciones claras de privacidad en español para revisión de Apple:
     ```json
     "infoPlist": {
       "NSLocationWhenInUseUsageDescription": "UniWheels requiere tu ubicación para conectarte con conductores y mostrarte rutas seguras en tiempo real hacia tu campus.",
       "NSCameraUsageDescription": "UniWheels necesita tu cámara para fotografiar tus documentos vehiculares y foto de perfil.",
       "NSPhotoLibraryUsageDescription": "UniWheels requiere acceso a tu galería para adjuntar los certificados de SOAT y tarjeta de propiedad.",
       "UIBackgroundModes": ["remote-notification"]
     }
     ```

**Verificación:** Ejecutar `npx expo config --type public` y confirmar que no hay errores de validación en el schema.

**Mensaje de commit:** `config(mobile): completar permisos y manifiestos nativos de Android e iOS en app.json`

---

### Tarea 3 — Scripts de compilación y empaquetado en `mobile/package.json`

**Archivo:** `mobile/package.json`.

**Instrucciones:**
1. Añadir scripts de build directo en `scripts`:
   ```json
   "scripts": {
     "start": "expo start",
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
     "lint": "expo lint",
     "build:android:preview": "eas build --platform android --profile preview",
     "build:android:prod": "eas build --platform android --profile production",
     "build:ios:preview": "eas build --platform ios --profile preview",
     "build:ios:prod": "eas build --platform ios --profile production",
     "build:all": "eas build --platform all --profile production"
   }
   ```

**Verificación:** Validar `package.json` con `npm run`.

**Mensaje de commit:** `build(mobile): agregar scripts npm para builds EAS de Android e iOS`

---

### Tarea 4 — Documentación técnica completa en `mobile/README.md`

**Archivo:** `mobile/README.md`.

**Instrucciones:**
1. Sobrescribir el README genérico de Expo con una guía completa del proyecto UniWheels Mobile:
   - **Descripción y Arquitectura:** Expo SDK 54, React Native 0.81, NativeWind, Zustand (`@uniwheels/shared`).
   - **Requisitos de entorno:** Node 20+, Expo Go o EAS Dev Client, Android Studio / Xcode para emuladores.
   - **Variables de Entorno (`.env.local` y `.env.production`):**
     - `EXPO_PUBLIC_API_URL=https://uniwheels.org/api/v1`
     - `EXPO_PUBLIC_GOOGLE_MAPS_KEY`
     - `EXPO_PUBLIC_TOMTOM_KEY`
     - `EXPO_PUBLIC_WOMPI_PUBLIC_KEY`
   - **Guía de Ejecución Local:**
     - `npm install`
     - `npm start`
   - **Guía de Generación de Binarios:**
     - Generación de APK instalable para pruebas en campo con estudiantes.
     - Generación de AAB para Google Play Console.

**Verificación:** Leer `mobile/README.md` formateado.

**Mensaje de commit:** `docs(mobile): documentar arquitectura, variables de entorno y flujo de build en README.md`

---

## Checklist de Cumplimiento para Publicación en Tiendas

### Google Play Store (Android)
- [ ] **Políticas de Datos de Ubicación:** Declaración explícita de uso de ubicación precisa solo durante viajes activos para emparejamiento y seguridad.
- [ ] **Declaración de Permisos Sensibles:** Justificación de `CAMERA` y `READ_MEDIA_IMAGES` para registro y validación documental de conductores.
- [ ] **Eliminación de Cuenta (Habeas Data):** Flujo de eliminación de cuenta visible y accesible dentro de la app (`ProfileView` → `POST /auth/delete-account`).
- [ ] **Capturas de Pantalla:** Mínimo 4 capturas en teléfonos de 6.5 pulgadas y tablets mostrando búsqueda, tarjeta de viaje con PIN, y cabina de conductor.

### Apple App Store (iOS - App Store Review Guidelines)
- [ ] **Directriz 5.1.1(v) - Eliminación de Cuenta:** Botón de eliminación directa e irrevocable con confirmación implementado en `profile.tsx`.
- [ ] **Directriz 2.1 - Información de Prueba:** Usuario y contraseña demo pre-creados en el backend para los revisores de Apple (`reviewer@unab.edu.co` con rol de estudiante y conductor).
- [ ] **Directriz 5.1.2 - Privacidad y Consentimiento:** Modal de Política de Privacidad y Tratamiento de Datos (Ley 1581) visible antes del registro (`HabeasDataModal.tsx`).
- [ ] **Página Web de Soporte y Privacidad:** Enlace público activo a `https://uniwheels.org/privacidad` y `https://uniwheels.org/terminos`.
