# @uniwheels/shared

Capa de API (`services/api.js` original) + estado global (`useAppStore`) compartida
entre `frontend/` (SPA web) y `mobile/` (Expo) de UniWheels. Ver el plan de la app
móvil para el contexto completo de por qué existe este paquete.

**No es un workspace.** `frontend/` no depende de este paquete (a propósito, para no
tocar nada de la web ya probada). Solo `mobile/` lo consume, vía:

```json
"dependencies": {
  "@uniwheels/shared": "file:../packages/shared"
}
```

## Contrato de inicialización (obligatorio antes de usar cualquier export)

Este paquete nunca asume `localStorage`, `import.meta.env`, ni ningún detalle de
plataforma directamente — cada consumidor debe llamar esto **antes** de renderizar
cualquier pantalla:

```js
import { setStorageAdapter, setApiConfig, setOnSessionExpired, useAppStore } from '@uniwheels/shared';

setStorageAdapter({
  getItem: (key) => AsyncStorage.getItem(key),      // debe devolver una Promise
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
});

setApiConfig({
  apiBaseUrl: 'http://192.168.1.50:8001/api/v1',        // auth-service
  vehicleApiBaseUrl: 'http://192.168.1.50:8002/api/v1', // vehicle-service
  routeApiBaseUrl: 'http://192.168.1.50:8003/api/v1',   // route-matching-service
  tripApiBaseUrl: 'http://192.168.1.50:8004/api/v1',    // trip-service
  notificationApiBaseUrl: 'http://192.168.1.50:8005/api/v1', // notification-service
});

setOnSessionExpired(() => {
  // qué hacer cuando el refresh de token falla de verdad (ej. navegar a /login)
});

// Recién después de lo anterior:
await useAppStore.getState().hydrateSession();
```

**Por qué `hydrateSession()` es async y explícito** (a diferencia del store original
de la web, que leía `localStorage` de forma síncrona al crear el store): `AsyncStorage`
de React Native es inherentemente asíncrono. El store arranca siempre con
`isAuthenticated: false` / `isHydrating: true`, y cada plataforma decide cuándo y cómo
mostrar un estado de carga mientras se resuelve la sesión guardada.

## Qué se dejó fuera a propósito (no es un olvido)

- `recurringDriverTrips`, `recurringPassengerAlerts`, `smartMatchAlerts`, `savedCards`,
  `tripsService.getAvailableTrips()` — datos de demo/mock de la web sin backend real
  detrás (`getAvailableTrips` ni siquiera se llama ya en la web, quedó huérfano tras
  conectar la búsqueda real vía `routesService.searchMatches`). No tiene sentido
  portarlos a un paquete que se supone debe ser la fuente de verdad reutilizable.
- `vehicleService.fetchDocumentBlob()` se mantiene tal cual (usa `URL.createObjectURL`,
  API de navegador) — mobile necesita su propia versión con `expo-file-system`, no
  reutilizar esta función.
- Push notifications (`notificationsService.getVapidPublicKey/savePushSubscription/removePushSubscription`)
  son Web Push — no llamarlas desde `mobile/`. Ver Fase 3 del plan de la app móvil.
- `colombianVehicleRules.js` y todo lo de registro/publicación de conductor no se
  portó todavía — es alcance de la Fase 2 (flujo de conductor), no de esta v1.
