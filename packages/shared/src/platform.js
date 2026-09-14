/**
 * Puntos de inyección por plataforma. `frontend/` (web) y `mobile/` (Expo) dan
 * cada uno su propio adaptador de storage y su propia config de URLs — este
 * paquete nunca asume `localStorage` ni `import.meta.env` directamente.
 *
 * Por qué un adaptador y no simplemente pasar los valores en cada llamada:
 * `AsyncStorage` (mobile) es inherentemente asíncrono, a diferencia de
 * `localStorage` (web). Para que el mismo código sirva a ambos, todo el acceso
 * a sesión aquí es async — incluso en web, donde el adaptador solo envuelve
 * `localStorage` en una promesa ya resuelta.
 */

// Adaptador de storage por defecto: no-op seguro (nunca falla, nunca persiste)
// para que nada reviente si una plataforma olvida llamar a `setStorageAdapter`
// antes de usar el SDK — mejor un fallo silencioso de persistencia que un crash.
let storageAdapter = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export function setStorageAdapter(adapter) {
  storageAdapter = adapter;
}

export function getStorageAdapter() {
  return storageAdapter;
}

// Config de URLs de los 5 microservicios expuestos al cliente (ai-route-service
// nunca se llama directo, ver nota histórica en api.js). Cada plataforma llama
// a `setApiConfig` una vez al arrancar con sus propias variables de entorno
// (VITE_* en web, EXPO_PUBLIC_* en mobile).
let apiConfig = {
  apiBaseUrl: 'http://localhost:8001/api/v1',
  vehicleApiBaseUrl: 'http://localhost:8002/api/v1',
  routeApiBaseUrl: 'http://localhost:8003/api/v1',
  tripApiBaseUrl: 'http://localhost:8004/api/v1',
  notificationApiBaseUrl: 'http://localhost:8005/api/v1',
  tomtomApiKey: '',
};

export function setApiConfig(partial) {
  apiConfig = { ...apiConfig, ...partial };
}

export function getApiConfig() {
  return apiConfig;
}

// Callback invocado cuando el refresh de sesión falla de verdad (token vencido
// sin forma de renovarlo) — cada plataforma decide qué hacer (web: limpiar el
// store y mostrar el gateway de login; mobile: lo mismo, vía navigation.replace
// a la pantalla de login). Evita que este paquete dependa directamente del store
// de ninguna plataforma en particular.
let onSessionExpired = () => {};

export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

export function notifySessionExpired() {
  onSessionExpired();
}
