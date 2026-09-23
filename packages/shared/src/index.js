// Punto de entrada de @uniwheels/shared — ver README.md para el contrato de
// inicialización que cada plataforma (frontend/, mobile/) debe cumplir antes
// de usar cualquier cosa exportada aquí.

export { setStorageAdapter, setApiConfig, setOnSessionExpired } from './platform.js';

export {
  apiClient,
  vehicleApiClient,
  routeApiClient,
  tripLifecycleClient,
  notificationApiClient,
  parseBackendError,
  INSTITUCIONES_PREDETERMINADAS,
  authService,
  vehicleService,
  tripsService,
  routesService,
  walletService,
  tripLifecycleService,
  notificationsService,
} from './api.js';

export { useAppStore } from './store/useAppStore.js';

export {
  buildGoogleMapsUrl,
  buildWazeUrl,
  buildAppleMapsUrl,
  openExternalNavigation,
} from './utils/mapNavigation.js';

export { MAP_TILE_PROVIDERS, getMapTileProvider } from './utils/mapTileProviders.js';

export {
  lerpAngle,
  getPlaceCoordinates,
  fetchRoadGeometry,
  fetchTurnByTurnRoute,
  maniobraATexto,
  haversineDistanceMeters,
  formatDistance,
} from './utils/osrmRoute.js';

export {
  FORMATO_PLACA_CARRO,
  FORMATO_PLACA_MOTO,
  COLORES_VEHICULOS,
  ANOS_VEHICULOS,
  validarPlacaColombiana,
  formatearPlacaVisual,
  requiereTecnomecanica,
  haExpiradoFecha,
} from './utils/colombianVehicleRules.js';

export { placesApiService, LUGARES_POPULARES_AMB } from './placesApiService.js';
