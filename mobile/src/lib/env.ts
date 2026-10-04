/**
 * Config de URLs de backend para @uniwheels/shared. Equivalente a las
 * VITE_*_API_URL de frontend/.env, pero con el prefijo EXPO_PUBLIC_ que Expo
 * embebe en el bundle de la misma forma que Vite hace con VITE_.
 *
 * IMPORTANTE para desarrollo local: `localhost` NO sirve desde un teléfono
 * físico (ni desde el emulador de Android sin el mapeo especial 10.0.2.2) —
 * apunta estas variables a la IP de tu máquina en la red local (ej.
 * 192.168.1.50), la misma que usa `./uniwheels start` en la máquina de
 * desarrollo. Configúralas en un `.env` en la raíz de mobile/ (Expo lo lee
 * automáticamente, no hace falta ninguna librería adicional).
 */
export const apiConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001/api/v1',
  vehicleApiBaseUrl: process.env.EXPO_PUBLIC_VEHICLE_API_URL ?? 'http://localhost:8002/api/v1',
  routeApiBaseUrl: process.env.EXPO_PUBLIC_ROUTE_API_URL ?? 'http://localhost:8003/api/v1',
  tripApiBaseUrl: process.env.EXPO_PUBLIC_TRIP_API_URL ?? 'http://localhost:8004/api/v1',
  notificationApiBaseUrl: process.env.EXPO_PUBLIC_NOTIFICATION_API_URL ?? 'http://localhost:8005/api/v1',
  tomtomApiKey: process.env.EXPO_PUBLIC_TOMTOM_API_KEY ?? '',
};
