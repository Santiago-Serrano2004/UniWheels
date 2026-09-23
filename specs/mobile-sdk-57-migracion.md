# Migración de mobile/ de Expo SDK 54 a SDK 57

**Documento:** `specs/mobile-sdk-57-migracion.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago — en implementación

---

## Contexto mínimo (ya investigado, no repetir)

- `mobile/` está fijado a Expo SDK 54 (`expo ^54.0.37`, `react-native 0.81.5`, `react 19.1.0`, `react-native-reanimated ~4.1.1`, `react-native-worklets 0.5.1`, `expo-router ~6.0.24`, `nativewind ^4.2.6` + `tailwindcss ^3.4.19`, `typescript ~5.9.2`).
- El motivo del pin (ver `mobile/AGENTS.md`) era que Expo Go del App Store solo soportaba hasta SDK 54. Hoy Expo Go de iOS solo soporta **SDK 57** (confirmado por Santiago en su iPhone), y en iOS no se puede instalar una versión vieja de Expo Go. Es el mismo motivo, ahora en la dirección contraria.
- SDK 57 = React Native 0.86, React 19.2, Reanimated 4.3–4.5, Worklets 0.8–0.10. Fuente: https://expo.dev/changelog/sdk-57, más las notas de SDK 55 y 56 para los cambios intermedios.
- Cambios que rompen entre 54 y 57 revisados **contra el código real** de `mobile/`. **Ninguno aplica**:
  - SDK 55: se eliminó la Legacy Architecture y `newArchEnabled`, `edgeToEdgeEnabled` y el campo `notification` de `app.json`. Ninguna de esas claves está en `app.json`. `expo-av` no se usa.
  - SDK 56: se quitó `@expo/vector-icons` del paquete `expo`, que no se usa (usamos `lucide-react-native`). Las operaciones copy/move de `expo-file-system` pasaron a ser async, y no se usan. expo-router pasó a ser un fork de React Navigation, y no hay imports directos de `@react-navigation`. `expo/fetch` pasó a ser el `fetch` global; la app usa axios, así que no le afecta.
  - Mínimos nuevos: Node 20.19.4+ (la máquina tiene Node 24.16) y TypeScript 6.0.3.
- `babel.config.js` no declara el plugin de Reanimated/Worklets a mano, porque lo incluye `babel-preset-expo`. `metro.config.js` fuerza una sola copia de `node_modules` para `@uniwheels/shared` (ver su comentario); **no tocar esa lógica**.
- Todas las animaciones auditadas en `specs/mobile-paridad-09-paridad-visual.md` (splash `BrandedSplash` + `AnimatedUniWheelsLogo`, `PassengerActiveTripCard`, `SosEmergencyModal`, `DriverCockpitCard`, `LiveTripIslandWidget`) usan APIs estables de Reanimated 4.x: `useSharedValue`, `useAnimatedStyle`, `useAnimatedProps`, `withTiming`, `withSpring`, `withRepeat`, `withSequence`, `withDelay`, `cancelAnimation`, `Easing`, `createAnimatedComponent`, `FadeIn`/`FadeOut`. **No deben cambiar ni un valor numérico** de esas animaciones.

## Alcance de esta v1 (explícitamente fuera de alcance)

- Subir NativeWind a v5 o Tailwind a v4. Se queda en NativeWind 4 + Tailwind 3; los colores rose/amber/emerald ya están fijados a mano en `tailwind.config.js`.
- Cambiar lógica, UI o animaciones de la app. Esto es solo una actualización de versiones: el único código que se toca es el necesario para que compile con las versiones nuevas.
- `frontend/` (web): congelado, no se toca.
- Builds nativos (EAS o `expo run:*`). El objetivo es Expo Go en iPhone.

## Tareas

### Tarea 1 — Subir el SDK con la herramienta oficial

En `mobile/`: `npx expo install expo@^57.0.0 --fix`. Esto alinea `expo`, todos los `expo-*`, `react`, `react-native`, `react-native-reanimated`, `react-native-worklets`, `react-native-svg`, `react-native-maps`, etc. con las versiones compatibles con SDK 57. No subir ningún paquete a mano a una versión distinta de la que elige `expo install`.

**Verificación**: `package.json` muestra `expo ^57.x` y `react-native 0.86.x`. `npm ls react react-native` no muestra copias duplicadas. Commit: `build(mobile): subir a Expo SDK 57 con expo install --fix`.

### Tarea 2 — Resolver todo lo que reporte `expo-doctor`

En `mobile/`: `npx expo-doctor@latest`. Arreglar cada chequeo que falle: versiones incompatibles, dependencias duplicadas, claves de config obsoletas. Si algún aviso viene de `packages/shared` (por ejemplo, un peer dependency de `react` o `zustand` que choca), arreglarlo en `packages/shared/package.json` sin cambiar código de `packages/shared/src`.

**Verificación**: `npx expo-doctor@latest` termina sin checks fallidos. Si queda alguno que no se puede resolver, documentarlo en el reporte final con el motivo exacto. Commit: `fix(mobile): resolver chequeos de expo-doctor tras SDK 57`.

### Tarea 3 — Typecheck y lint con TypeScript 6

En `mobile/`: `npx tsc --noEmit && npm run lint`. Arreglar solo los errores que aparecieron por la migración: tipos que cambiaron en React 19.2, RN 0.86, expo-router o TypeScript 6. El arreglo tiene que ser mínimo y local, sin refactors. No usar `@ts-ignore` ni `as any` para tapar errores nuevos, salvo que sea un bug confirmado de tipos de una librería, y en ese caso con un comentario de una línea que lo explique.

**Verificación**: `tsc` sin errores. `lint` con 0 errores; los 6 warnings preexistentes pueden quedar. Commit: `fix(mobile): ajustes de tipos para RN 0.86 / TS 6`.

### Tarea 4 — Smoke test de bundle sin dispositivo

En `mobile/`: `npx expo export --platform ios --output-dir /tmp/uniwheels-export-ios` y lo mismo con `--platform android` en otro directorio. Esto compila el bundle JS completo (Babel + Metro + NativeWind + Reanimated/Worklets) como lo va a cargar Expo Go, sin necesitar un teléfono. Borrar esos directorios en `/tmp` al terminar; no se commitean.

**Verificación**: ambos exports terminan sin errores. Si falla, arreglar la causa raíz (config de Babel/Metro/NativeWind) y volver a correr las tareas 3 y 4. Sin commit propio, salvo que haya habido un arreglo, que se commitea con un mensaje que explique la causa.

### Tarea 5 — Actualizar la documentación del pin de versión

- `mobile/AGENTS.md`: reemplazar la nota de SDK 54 por SDK 57, explicando el motivo (Expo Go iOS del App Store solo soporta la última versión de SDK y no permite instalar versiones viejas; migración hecha el 2026-09-23). Mantener la instrucción de leer la documentación versionada: cambiar el link a `https://docs.expo.dev/versions/v57.0.0/`.
- `mobile/README.md`: actualizar las versiones mencionadas (SDK, React Native).

**Verificación**: `grep -rn "54" mobile/AGENTS.md mobile/README.md` ya no muestra referencias al SDK 54 como versión actual. Commit: `docs(mobile): documentar el pin a Expo SDK 57`.

---

## Verificación final (manual, la hace Santiago)

Abrir la app en Expo Go en el iPhone con `npx expo start --tunnel` desde `mobile/`, y revisar el splash y las pantallas principales. Claude captura y compara el resultado contra la web.
