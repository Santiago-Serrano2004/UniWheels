# Mapa de mobile con Leaflet en WebView (paridad con la web, sin Apple/Google Maps)

**Documento:** `specs/mobile-mapa-leaflet-webview.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago — en implementación

---

## Contexto mínimo (ya investigado, no repetir)

- Mobile usa `react-native-maps` 1.27.2 con `mapType="none"` + `<UrlTile>` de Esri, las mismas capas que la web (`packages/shared/src/utils/mapTileProviders.js`). **En iOS `mapType="none"` no existe** (documentado en `node_modules/react-native-maps/src/MapView.tsx:269-270`, solo Android). Por eso, en iPhone, debajo de las capas de Esri se dibuja Apple Maps con su logo y el link "Legal", que no se pueden ocultar. En Android pasa lo mismo con el logo de Google. Santiago quiere el mapa igual al de la web, sin esas marcas.
- La web usa **Leaflet 1.9.4** (`react-leaflet 5`) con las capas de `AppMapTileLayer.jsx` / `mapTileProviders.js`, y **`attributionControl={false}`** (`frontend/src/components/map/TripMapView.jsx:510`, `LocationPickerModal.jsx:193`). Los íconos de marcadores están en `frontend/src/components/map/mapIcons.js` y el marcador del vehículo (SVG cenital, rotación suavizada con LERP) en `frontend/src/components/map/VehicleGpsMarker.jsx`.
- `react-native-webview` 13.16.1 ya está instalado y viene incluido en Expo Go. No hace falta un build nativo.
- Usos actuales de `react-native-maps` en `mobile/src`:
  - `components/AppMapView.tsx` (58 líneas): `MapView` + `UrlTile` + `Marker`, con `ref`. Lo usa `TripRouteMap.tsx`.
  - `components/TripRouteMap.tsx` (61): marcadores + `Polyline` de la ruta. Lo usa `(tabs)/map.tsx:567`.
  - `components/LocationPickerModal.tsx` (156): elegir ubicación tocando el mapa, `ref`. Lo usan `(tabs)/index.tsx:1042` y `driver/DriverRoutePublishForm.tsx:642`.
  - `components/driver/InAppGpsNavigator.tsx` (343): navegación en vivo, `Polyline`, marcador con `rotation`, `animateCamera` para seguir al conductor. Lo usa `(tabs)/index.tsx:342`.
  - `app/(tabs)/map.tsx` (695): `MapView` directo con marcadores, `Polyline`, marcador del conductor con `flat` + `rotation`, `animateCamera` y `fitToCoordinates`.
  - Existen variantes `.web.tsx` (`AppMapView.web.tsx`, `LocationPickerModal.web.tsx`, `TripRouteMap.web.tsx`) para el target web de Expo. Se dejan como están.

## Alcance de esta v1 (explícitamente fuera de alcance)

- `frontend/` (web): congelado, no se toca. Mobile replica su comportamiento.
- Mapas offline, clustering, capas nuevas o cualquier función que la web no tenga.
- MapLibre u otro SDK nativo: requiere development build y cuenta de Apple.

## Diseño

Un solo componente reutilizable, `mobile/src/components/map/LeafletMap.tsx`, que envuelve una `WebView` con un HTML de Leaflet 1.9.4, la misma versión que la web. Leaflet se carga desde cdnjs o jsdelivr con la versión fija y SRI, o se incrusta en el HTML (elegir uno y justificarlo en el commit). La comunicación va en los dos sentidos: RN → web con `injectJavaScript` y mensajes JSON; web → RN con `window.ReactNativeWebView.postMessage`.

API declarativa (props), para que migrar sea mecánico:
- `tileProvider` (objeto de `getMapTileProvider` de `@uniwheels/shared`, según el tema claro/oscuro, igual que hoy).
- `initialCenter: [lat, lng]`, `initialZoom`.
- `markers: Array<{ id: string; coordinate: [lat, lng]; kind: 'origin' | 'destination' | 'pickup' | 'user' | 'vehicle-car' | 'vehicle-moto' | 'pin'; rotation?: number }>`. El HTML/SVG de cada `kind` se copia **tal cual** de `mapIcons.js` / `VehicleGpsMarker.jsx` como `L.divIcon`, para que se vean idénticos a la web. La rotación del vehículo se suaviza con la misma interpolación (LERP) que usa `VehicleGpsMarker.jsx`.
- `polylines: Array<{ id: string; coordinates: [lat, lng][]; color: string; weight?: number; dashArray?: string }>`, con los mismos colores y grosores que la web.
- Eventos: `onMapPress(lat, lng)`, `onRegionChangeComplete(center, zoom)`, `onReady()`.
- Métodos imperativos por `ref` (reemplazan los de `react-native-maps`): `animateTo(center, zoom?)`, `fitToCoordinates(coords, paddingPx)`.
- Actualizaciones incrementales: cuando cambian `markers` o `polylines`, se manda solo el diff (agregar, mover o quitar por `id`). **No se recarga la WebView.** El GPS actualiza cada ~5 s y recargar causaría parpadeo.
- `attributionControl: false` y los mismos controles de zoom que la web. Sin el logo de Leaflet, igual que la web.
- Fondo de la WebView transparente o del color del tema, para que no haya destello blanco al cargar en modo oscuro.

## Tareas

### Tarea 1 — Componente `LeafletMap`

Crear `mobile/src/components/map/LeafletMap.tsx` (y, si hace falta, `mobile/src/components/map/leafletHtml.ts` con la plantilla HTML/JS) según el diseño anterior. Incluir una variante `LeafletMap.web.tsx` mínima para el target web de Expo, que puede mostrar el mismo aviso que las variantes `.web.tsx` actuales.

**Verificación**: `npx tsc --noEmit && npm run lint` sin errores nuevos. Commit: `feat(mobile): componente LeafletMap en WebView con la misma version y capas que la web`.

### Tarea 2 — Migrar `LocationPickerModal.tsx`

Reemplazar `MapView`/`UrlTile`/`Marker` por `LeafletMap`, conservando el comportamiento actual (tocar el mapa elige la ubicación y mueve el marcador; centrar en la ubicación del usuario si ya lo hace hoy). Mismas props hacia afuera: no tocar a quien lo usa.

**Verificación**: tsc/lint. Commit: `refactor(mobile): LocationPickerModal con LeafletMap`.

### Tarea 3 — Migrar `TripRouteMap.tsx` y eliminar `AppMapView.tsx`

`TripRouteMap` pasa a usar `LeafletMap` (marcadores + ruta + encuadre de la ruta, igual que hoy). Si `AppMapView.tsx` queda sin uso, eliminarlo junto con `AppMapView.web.tsx`.

**Verificación**: tsc/lint. Commit: `refactor(mobile): TripRouteMap con LeafletMap`.

### Tarea 4 — Migrar `app/(tabs)/map.tsx`

Reemplazar el `MapView` directo: marcadores, `Polyline`, marcador del conductor con rotación (antes `flat` + `rotation`), `animateCamera` → `animateTo`, `fitToCoordinates` → método del ref. Mismo comportamiento de seguimiento que hoy.

**Verificación**: tsc/lint. Commit: `refactor(mobile): mapa de viaje con LeafletMap`.

### Tarea 5 — Migrar `driver/InAppGpsNavigator.tsx`

Navegación en vivo: ruta, marcador del vehículo con rotación por heading y cámara que sigue al conductor (`animateCamera` → `animateTo`). Las posiciones llegan cada ~5 s: se mueve el marcador con el diff incremental, sin recargar.

**Verificación**: tsc/lint. Commit: `refactor(mobile): navegador GPS con LeafletMap`.

### Tarea 6 — Quitar `react-native-maps`

Cuando no quede ningún `import` de `react-native-maps` en `mobile/src`, desinstalarlo (`npm uninstall react-native-maps`, respetando el `.npmrc`) y quitar `android.config.googleMaps` de `mobile/app.json`. Con esto deja de hacer falta `EXPO_PUBLIC_GOOGLE_MAPS_KEY`, uno de los pendientes del build de EAS. Actualizar el README de mobile si lo menciona.

**Verificación**: `grep -rn "react-native-maps" mobile/src` vacío; tsc/lint; `npx expo export --platform ios` y `--platform android` compilan (borrar los directorios de export al terminar). Commit: `build(mobile): quitar react-native-maps y la config de Google Maps`.

## Verificación final (manual, Santiago + Claude)

En el iPhone con Expo Go: elegir ubicación, ver una ruta y ver el mapa de viaje. No tiene que aparecer el logo de Apple Maps, las capas tienen que ser las mismas de la web en claro y en oscuro, y el marcador del vehículo tiene que rotar suave.

## Nota de licencias

La web oculta la atribución de Esri (`attributionControl={false}`) y mobile la replica por paridad. Los términos de uso de Esri piden mostrar la atribución; queda anotado para decidirlo aparte.
