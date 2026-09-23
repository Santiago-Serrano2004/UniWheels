# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

(Subido de SDK 54 a SDK 57 el 2026-09-23 porque Expo Go del App Store solo
soporta la última versión de SDK y en iOS no se puede instalar una versión
vieja de Expo Go. Antes se había bajado de 57 a 54 el 2026-08-29 por el mismo
motivo, en la dirección contraria. El SDK del proyecto tiene que coincidir con
el que soporta Expo Go en el iPhone de prueba. Detalle y pendientes en
specs/mobile-sdk-57-migracion.md.)

## NativeWind: trampas conocidas

- `space-x-*` / `space-y-*` no funcionan en nativo (dependen de selectores de hijos de CSS): usar `gap-*`.
- `font-mono` está mapeado a Menlo (iOS) / monospace (Android) en `tailwind.config.js`; no usar listas de fuentes CSS.
- Modales: usar `<Modal transparent>` con tarjeta centrada y `useSafeAreaInsets` (ver `SosEmergencyModal.tsx`). No usar `presentationStyle="fullScreen"` con `SafeAreaView`: rompió con "Couldn't find a navigation context".
