# UniWheels Mobile 🚗📱

Aplicación móvil nativa de **UniWheels — Plataforma de Movilidad Universitaria Compartida (UNAB)**, construida con React Native y Expo.

---

## 🏗️ Arquitectura y Tecnologías

- **Framework:** [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) / [React Native 0.86](https://reactnative.dev/)
- **Enrutamiento:** [Expo Router v6](https://docs.expo.dev/router/introduction/) (enrutamiento declarativo basado en sistema de archivos)
- **Estilos:** [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS adaptado para React Native con soporte dark mode)
- **Estado Global:** [Zustand v5](https://github.com/pmndrs/zustand) con sincronización de estado y dominio compartido vía `@uniwheels/shared`
- **Módulos Nativos:**
  - `expo-location`: Rastreo GPS y geolocalización en primer plano para matching y navegación en vivo.
  - `expo-notifications` & `expo-device`: Recepción de notificaciones push remotas (FCM v1 / APNs) y canales nativos Android.
  - `expo-image-picker`: Captura de fotos de perfil y documentación vehicular (SOAT, tarjeta de propiedad).
  - `react-native-webview`: Renderizado de mapas interactivos con Leaflet 1.9.4, marcadores vectoriales y rutas con las mismas capas que la web.
  - `react-native-reanimated`: Animaciones fluidas a 60/120 fps en el hilo nativo de UI.

---

## 📋 Requisitos de Entorno

- **Node.js:** `>= 20.0.0`
- **Gestor de Paquetes:** `npm` `>= 10.0.0`
- **Herramientas de Ejecución:**
  - [Expo Go](https://expo.dev/go) (versión compatible con SDK 57) para pruebas rápidas en dispositivo físico.
  - Opcional: **Android Studio** (SDK de Android 14/15, Emulador con Google Play Services) o **Xcode** (iOS Simulator en macOS).
  - [EAS CLI](https://docs.expo.dev/eas-cli/): `npm install -g eas-cli` para compilación remota y local.

---

## 🔐 Variables de Entorno

Crea un archivo `.env` o `.env.local` en el directorio `mobile/` basado en la siguiente plantilla:

```bash
# URL base del API Gateway / Backend UniWheels
EXPO_PUBLIC_API_URL=https://uniwheels.org/api/v1

# URLs de cada microservicio (valores por defecto en src/lib/env.ts: localhost:8002 a 8005)
EXPO_PUBLIC_VEHICLE_API_URL=https://uniwheels.org/api/v1
EXPO_PUBLIC_ROUTE_API_URL=https://uniwheels.org/api/v1
EXPO_PUBLIC_TRIP_API_URL=https://uniwheels.org/api/v1
EXPO_PUBLIC_NOTIFICATION_API_URL=https://uniwheels.org/api/v1

# Clave de TomTom (tráfico y geocodificación)
EXPO_PUBLIC_TOMTOM_API_KEY=tu_tomtom_api_key
```

> **Nota:** Las variables con prefijo `EXPO_PUBLIC_` se incrustan en tiempo de empaquetado por Expo CLI / EAS Build.

---

## 🚀 Guía de Ejecución Local

1. **Instalar dependencias:**
   ```bash
   cd mobile
   npm install
   ```

2. **Iniciar el servidor de desarrollo Expo:**
   ```bash
   npm start
   ```

3. **Ejecutar en plataformas específicas:**
   - **Android:** Presiona `a` en la terminal o ejecuta `npm run android`.
   - **iOS:** Presiona `i` en la terminal o ejecuta `npm run ios`.
   - **Web:** Presiona `w` en la terminal o ejecuta `npm run web`.

4. **Verificación de código:**
   ```bash
   # Typecheck con TypeScript
   npx tsc --noEmit

   # Linting con ESLint y Expo
   npm run lint
   ```

---

## 📦 Guía de Generación de Binarios (EAS Build)

El proyecto utiliza perfiles configurados en `eas.json` para compilar binarios reproducibles en la nube de Expo Application Services o localmente con `--local`.

### 1. Perfiles Disponibles

| Perfil | Tipo de Salida | Canal | Uso Principal |
| :--- | :--- | :--- | :--- |
| `development` | Development Client | `development` | Depuración profunda con módulos nativos personalizados. |
| `preview` (Android) | **APK** (`buildType: "apk"`) | `preview` | Instalable directo para pruebas de campo con estudiantes y docentes UNAB. |
| `preview` (iOS) | IPA Ad-hoc / TestFlight | `preview` | Distribución interna para validadores en iOS. |
| `production` (Android) | **AAB** (`buildType: "app-bundle"`) | `production` | Formato optimizado para publicación en Google Play Console. |
| `production` (iOS) | **IPA** de Producción | `production` | Distribución oficial a través de App Store Connect / TestFlight. |

### 2. Comandos de Compilación (NPM Scripts)

```bash
# Generar APK de Android para pruebas en campo
npm run build:android:preview

# Generar Android App Bundle (AAB) para Google Play Store
npm run build:android:prod

# Generar compilación iOS para pruebas internas
npm run build:ios:preview

# Generar compilación iOS para producción / App Store
npm run build:ios:prod

# Compilar producción para ambas plataformas simultáneamente
npm run build:all
```

---

## 🏪 Checklist para Publicación en Tiendas

### Google Play Store (Android)
- [x] Identificador de paquete configurado: `org.uniwheels.app`.
- [x] Versión y `versionCode` sincronizados en `app.json`.
- [x] Permisos declarados estrictamente necesarios (`ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `CAMERA`, `READ_MEDIA_IMAGES`).
- [ ] Declaración de política de datos de ubicación en segundo plano y primer plano para emparejamiento de viajes.
- [ ] Ficha técnica, descripción y capturas de pantalla de 6.5" y 10" listas en Google Play Console.

### Apple App Store (iOS)
- [x] Bundle Identifier configurado: `org.uniwheels.app`.
- [x] Cadenas explicativas de privacidad en español, definidas una sola vez en los plugins `expo-location` y `expo-image-picker` de `app.json` (generan `NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`).
- [x] `infoPlist` solo declara `UIBackgroundModes` con `remote-notification`.
- [x] Flujo de eliminación de cuenta (Habeas Data / Ley 1581 / Directriz Apple 5.1.1(v)) disponible desde el perfil del usuario.
- [ ] Credenciales de usuario demo (`reviewer@unab.edu.co`) configuradas para los revisores de Apple.

---

## Configuración de EAS para publicar (T3a)

- **Variables públicas**: `eas.json` define en los tres perfiles las URLs de los servicios (`EXPO_PUBLIC_*_API_URL` apuntando a `https://uniwheels.org/api/v1`).
- **TomTom**: `EXPO_PUBLIC_TOMTOM_API_KEY` NO está en el repo. Configúrala como variable de entorno de EAS, por ejemplo: `eas env:create --name EXPO_PUBLIC_TOMTOM_API_KEY --value <tu-clave> --environment production --visibility sensitive` (repite para `preview` y `development`).
- **`submit` en `eas.json`** (no admite comentarios, por eso la guía va aquí): `appleId` y `ascAppId` son placeholders (`REEMPLAZAR_APPLE_ID_EMAIL`, `REEMPLAZAR_ASC_APP_ID`). Reemplázalos con el correo de tu cuenta de Apple Developer y el ID numérico de la app en App Store Connect antes de `eas submit`. `serviceAccountKeyPath` apunta a `./google-service-account.json` (no se commitea): descárgalo de Google Cloud / Play Console.
- `appVersionSource` es `remote` y el perfil `production` usa `autoIncrement`.
