import axios from 'axios';
import { getApiConfig, notifySessionExpired } from './platform.js';
import { readStoredSession, writeStoredSessionToken, removeStoredSession } from './session.js';

// Cliente crudo (sin interceptores) exclusivo para la llamada de refresh — evita
// que su propio 401 dispare de nuevo el interceptor de refresh (recursión).
const rawRefreshClient = axios.create({ timeout: 8000 });

// Deduplica refrescos concurrentes: si varias peticiones reciben 401 al mismo
// tiempo (ej. la app recién reabierta con el token vencido), todas comparten
// la misma promesa en vez de pedir 3-4 tokens nuevos en paralelo.
let refreshInFlight = null;

const solicitarNuevoToken = () => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const tokenActual = (await readStoredSession())?.token;
      const res = await rawRefreshClient.post(
        `${getApiConfig().apiBaseUrl}/auth/refresh`,
        {},
        { headers: tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {} }
      );
      const nuevoToken = res.data?.data?.access_token;
      if (!nuevoToken) throw new Error('Respuesta de refresh sin token.');
      await writeStoredSessionToken(nuevoToken);
      return nuevoToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

/**
 * Inyecta el Bearer Token (JWT emitido por auth-service) en cada solicitud de
 * un cliente axios. Se aplica a TODOS los clientes de microservicios — antes
 * solo lo tenía apiClient, dejando el resto de llamadas sin autenticar.
 *
 * También intenta renovar la sesión una vez si el backend responde 401 (token
 * vencido a mitad de un viaje, por ejemplo) y reintenta la petición original;
 * si la renovación también falla, cierra la sesión para que el usuario vea el
 * gateway de login en vez de errores silenciosos indefinidamente.
 */
const attachAuthInterceptor = (client) => {
  client.interceptors.request.use(async (config) => {
    try {
      const parsed = await readStoredSession();
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {}
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      const esNoAutenticado = error.response?.status === 401;
      const yaReintentado = config?._reintentadoTrasRefresh;
      const sesionActual = await readStoredSession();

      if (!esNoAutenticado || !config || yaReintentado || !sesionActual?.token) {
        return Promise.reject(error);
      }

      config._reintentadoTrasRefresh = true;

      try {
        const nuevoToken = await solicitarNuevoToken();
        config.headers.Authorization = `Bearer ${nuevoToken}`;
        return client(config);
      } catch {
        await removeStoredSession();
        notifySessionExpired();
        return Promise.reject(error);
      }
    }
  );

  return client;
};

const jsonHeaders = { 'Content-Type': 'application/json', Accept: 'application/json' };

// baseURL se resuelve en cada petición (no al crear el cliente): si algo toca un
// cliente antes de que la plataforma llame a setApiConfig, sin esto queda atado
// para siempre a la URL por defecto (localhost) — pasó en iPhone con SDK 57.
const crearCliente = (claveUrl, timeout) => {
  const client = axios.create({ headers: jsonHeaders, timeout });
  client.interceptors.request.use((config) => {
    config.baseURL = getApiConfig()[claveUrl];
    return config;
  });
  return attachAuthInterceptor(client);
};

// Los 5 clientes se crean perezosamente (getters) para que `setApiConfig` — que
// cada plataforma llama una vez al arrancar — ya esté aplicado antes de fijar
// el `baseURL` de cada uno. Crearlos de forma eager al importar el módulo (como
// en el original de la web, donde import.meta.env ya está resuelto en build
// time) rompería en mobile, donde la config puede llegar un instante después.
let _apiClient, _vehicleApiClient, _routeApiClient, _tripLifecycleClient, _notificationApiClient;

export const apiClient = new Proxy({}, {
  get(_target, prop) {
    if (!_apiClient) {
      _apiClient = crearCliente('apiBaseUrl', 8000);
    }
    return _apiClient[prop];
  },
});

export const vehicleApiClient = new Proxy({}, {
  get(_target, prop) {
    if (!_vehicleApiClient) {
      _vehicleApiClient = crearCliente('vehicleApiBaseUrl', 8000);
    }
    return _vehicleApiClient[prop];
  },
});

export const routeApiClient = new Proxy({}, {
  get(_target, prop) {
    if (!_routeApiClient) {
      _routeApiClient = crearCliente('routeApiBaseUrl', 6000);
    }
    return _routeApiClient[prop];
  },
});

export const tripLifecycleClient = new Proxy({}, {
  get(_target, prop) {
    if (!_tripLifecycleClient) {
      _tripLifecycleClient = crearCliente('tripApiBaseUrl', 6000);
    }
    return _tripLifecycleClient[prop];
  },
});

export const notificationApiClient = new Proxy({}, {
  get(_target, prop) {
    if (!_notificationApiClient) {
      _notificationApiClient = crearCliente('notificationApiBaseUrl', 6000);
    }
    return _notificationApiClient[prop];
  },
});

/**
 * Normalizador avanzado de errores del backend a lenguaje natural en español
 */
export const parseBackendError = (err) => {
  if (!err) return 'Ocurrió un error inesperado. Intenta nuevamente.';

  if (err.errors && typeof err.errors === 'object') {
    const errorEntries = Object.entries(err.errors);
    if (errorEntries.length > 0) {
      const messages = errorEntries.map(([field, fieldErrors]) => {
        const raw = Array.isArray(fieldErrors) ? fieldErrors[0] : String(fieldErrors);

        if (field === 'email' || field === 'email_prefix') {
          if (raw.includes('unique') || raw.includes('ya existe') || raw.includes('already')) {
            return 'El correo institucional ya se encuentra registrado en UniWheels. Por favor inicia sesión o recupera tu contraseña.';
          }
          if (raw.includes('regex') || raw.includes('domain') || raw.includes('institutional')) {
            return 'El correo debe ser institucional válido (@unab.edu.co).';
          }
          return 'Revisa tu correo institucional: ' + raw;
        }

        if (field === 'student_code') {
          if (raw.includes('regex') || raw.includes('format') || raw.includes('U')) {
            return 'El código estudiantil debe iniciar con la letra "U" seguida de 8 dígitos (ejemplo: U00123456).';
          }
          if (raw.includes('unique')) {
            return 'Este código estudiantil ya se encuentra registrado en el sistema.';
          }
          return 'Código institucional: ' + raw;
        }

        if (field === 'id_document_number') {
          if (raw.includes('unique')) {
            return 'Este número de documento de identidad ya está registrado con otra cuenta.';
          }
          return 'Documento de identidad: ' + raw;
        }

        if (field === 'phone_number') {
          if (raw.includes('regex') || raw.includes('digits') || raw.includes('min')) {
            return 'El número de teléfono debe ser un celular válido de 10 dígitos (ej: 3151234567).';
          }
          return 'Teléfono celular: ' + raw;
        }

        if (field === 'password') {
          if (raw.includes('min') || raw.includes('mixed') || raw.includes('letters') || raw.includes('symbols') || raw.includes('numbers')) {
            return 'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo especial (@$!%*?&#).';
          }
          return 'Contraseña: ' + raw;
        }

        if (field === 'password_confirmation') {
          return 'La confirmación de la contraseña no coincide con la contraseña ingresada.';
        }

        if (field === 'has_extra_helmet') {
          return 'Para registrar una motocicleta debes confirmar que cuentas con un casco adicional reglamentario para tu pasajero.';
        }

        if (field === 'plate_number') {
          return 'El formato de la placa vehicular no es válido para Colombia (ej: KLU492 para carro o ABC12D para moto).';
        }

        if (raw.includes('validation.min.string')) return `El campo ${field} no cumple con el mínimo de caracteres.`;
        if (raw.includes('validation.required')) return `El campo ${field} es obligatorio.`;
        if (raw.includes('validation.unique')) return `El valor ingresado para ${field} ya existe en el sistema.`;
        if (raw.includes('validation.after')) return 'La fecha de vencimiento debe ser posterior a la fecha actual.';

        return raw;
      });

      return messages.join(' | ');
    }
  }

  if (err.message) {
    if (err.message.includes('Unauthenticated') || err.message.includes('401')) {
      return 'Credenciales incorrectas o correo institucional no registrado.';
    }
    if (err.message.includes('validation.')) {
      return 'Por favor revisa los datos ingresados en el formulario.';
    }
    return err.message;
  }

  return 'No se pudo conectar con el servidor. Por favor verifica tu conexión e intenta de nuevo.';
};

// Catálogo institucional oficial UNAB (fallback si /institutions no responde)
export const INSTITUCIONES_PREDETERMINADAS = [
  {
    id: 1,
    name: 'Universidad Autónoma de Bucaramanga',
    code: 'UNAB',
    domain: 'unab.edu.co',
    welcome_image_url: '/assets/institutions/unab-mascot.png',
    campuses: [
      { id: 1, name: 'Campus El Jardín', code: 'JARDIN', image_url: '/assets/institutions/campuses/el-jardin.webp', is_main_campus: true },
      { id: 2, name: 'Campus El Bosque', code: 'BOSQUE', image_url: '/assets/institutions/campuses/el-bosque.webp', is_main_campus: false },
      { id: 3, name: 'CSU — Centro de Servicios Universitarios', code: 'CSU', image_url: '/assets/institutions/campuses/csu.webp', is_main_campus: false },
      { id: 4, name: 'Campus La Casona', code: 'CASONA', image_url: '/assets/institutions/campuses/la-casona.webp', is_main_campus: false },
    ],
  },
];

export const authService = {
  async me() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  async sendSmsCode(phoneNumber) {
    try {
      const response = await apiClient.post('/auth/send-sms-code', { phone_number: phoneNumber });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al enviar el código de verificación por SMS.' };
    }
  },

  async refreshToken() {
    try {
      await solicitarNuevoToken();
      return true;
    } catch {
      return false;
    }
  },

  async getInstitutions() {
    try {
      const response = await apiClient.get('/institutions');
      if (response.data?.success && response.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
      return INSTITUCIONES_PREDETERMINADAS;
    } catch {
      return INSTITUCIONES_PREDETERMINADAS;
    }
  },

  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error de conexión con el servidor.' };
    }
  },

  async sendVerificationCode(email) {
    try {
      const response = await apiClient.post('/auth/send-verification-code', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al enviar el código de verificación.' };
    }
  },

  async register(datosRegistro) {
    try {
      const response = await apiClient.post('/auth/register', datosRegistro);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al procesar el registro.' };
    }
  },

  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      return { success: true, message: 'Código de verificación enviado al correo institucional.', data: { email } };
    }
  },

  async resetPassword(email, code, password) {
    try {
      const response = await apiClient.post('/auth/reset-password', { email, code, password });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      return { success: true, message: 'Contraseña actualizada correctamente.' };
    }
  },

  async registerDriver(datosConductor) {
    try {
      const response = await apiClient.post('/driver/register', datosConductor);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al procesar la solicitud de conductor.' };
    }
  },

  async deleteAccount(email) {
    try {
      const response = await apiClient.post('/auth/delete-account-direct', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al eliminar la cuenta.' };
    }
  },
};

export const vehicleService = {
  async registerVehicle(datosVehiculo) {
    try {
      const isFormData = typeof FormData !== 'undefined' && datosVehiculo instanceof FormData;
      const config = isFormData
        ? {
            headers: { 'Content-Type': 'multipart/form-data' },
            transformRequest: (data) => data,
          }
        : {};
      const response = await vehicleApiClient.post('/vehicles', datosVehiculo, config);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al registrar el vehículo.' };
    }
  },

  async checkApprovedVehicle(userId, plateNumber) {
    try {
      const response = await vehicleApiClient.get('/vehicles/check-approved', {
        params: { user_id: userId, plate_number: plateNumber },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) return error.response.data;
      return { success: false, has_approved_vehicle: false };
    }
  },

  async uploadDocument(vehicleId, formData) {
    try {
      const response = await vehicleApiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Evitar serializaciones JSON en React Native
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al subir el archivo del documento.' };
    }
  },

  async uploadVehicleDocument(vehicleId, documentType, archivo, { documentNumber, expiresAt, fileName, mimeType } = {}) {
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      if (documentNumber) {
        formData.append('document_number', documentNumber);
      }
      if (expiresAt) {
        formData.append('expires_at', expiresAt);
      }
      if (typeof archivo === 'object' && archivo !== null && !archivo.uri) {
        formData.append('document_file', archivo);
      } else {
        const uri = typeof archivo === 'string' ? archivo : archivo?.uri;
        const resolvedFileName = fileName || archivo?.fileName || archivo?.name || `${documentType}.jpg`;
        const resolvedMimeType = mimeType || archivo?.mimeType || archivo?.type || 'image/jpeg';
        formData.append('document_file', {
          uri,
          name: resolvedFileName,
          type: resolvedMimeType,
        });
      }
      const response = await vehicleApiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw error.message ? error : { message: 'Error al subir el documento del vehículo.' };
    }
  },

  async getCatalogBrands(tipoVehiculo = 'carro') {
    try {
      const type = (tipoVehiculo === 'motorcycle' || tipoVehiculo === 'moto') ? 'moto' : 'carro';
      const response = await vehicleApiClient.get('/vehicles/catalog/brands', { params: { type } });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getCatalogModels(marca) {
    try {
      const response = await vehicleApiClient.get('/vehicles/catalog/models', { params: { brand: marca } });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getAllVehiclesForAdmin() {
    try {
      const response = await vehicleApiClient.get('/vehicles');
      return response.data?.data || [];
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al cargar los vehículos pendientes de revisión.' };
    }
  },

  async verifyDocument(vehicleId, documentId, isVerified, rejectionNotes = null) {
    try {
      const response = await vehicleApiClient.patch(
        `/vehicles/${vehicleId}/documents/${documentId}/verify`,
        { is_verified: isVerified, rejection_notes: rejectionNotes || undefined }
      );
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al actualizar el estado del documento.' };
    }
  },

  // NOTA para mobile: `URL.createObjectURL` es una API de navegador. En RN, usar
  // `vehicleApiClient.get(url, {responseType: 'arraybuffer'})` + `expo-file-system`
  // para escribir a disco y obtener una URI local — no portar este método tal cual.
  async fetchDocumentBlob(secureDownloadUrl) {
    const response = await vehicleApiClient.get(secureDownloadUrl, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};

export const tripsService = {
  async getDriverHistory() {
    try {
      const response = await tripLifecycleClient.get('/driver/history');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getPassengerHistory() {
    try {
      const response = await tripLifecycleClient.get('/passenger/history');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getActiveTripsForRoute(routeId) {
    if (!routeId) return [];
    const historial = await this.getDriverHistory();
    const estadosActivos = ['confirmado', 'en_camino', 'en_punto_encuentro', 'recogido'];
    return historial.filter((t) => t.route_id === routeId && estadosActivos.includes(t.status));
  },

  async getWalletTransactions() {
    try {
      const response = await apiClient.get('/wallet/transactions');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async submitRating(ratingPayload) {
    try {
      const response = await notificationApiClient.post('/ratings', ratingPayload);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      return { success: true };
    }
  },

  async getUserReputationStats() {
    try {
      const response = await apiClient.get('/user/reputation-stats');
      if (response.data?.data) return response.data.data;
    } catch {
      // Fallback
    }
    return {
      rating_average: 5.0,
      total_trips: 0,
      puntualidad: 5.0,
      amabilidad: 5.0,
      conduccion_segura: 5.0,
      vehiculo_limpio: 5.0,
      comunicacion: 5.0,
      reviews_count: 0,
    };
  },
};

export const routesService = {
  async publishRoute(routePayload) {
    try {
      const response = await routeApiClient.post('/routes', routePayload);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al publicar la ruta.' };
    }
  },

  async optimizePassengers(routeId, passengers) {
    try {
      const response = await routeApiClient.post(`/routes/${routeId}/optimize-passengers`, { passengers });
      return response.data;
    } catch {
      return null;
    }
  },

  async getMyRoutes() {
    try {
      const response = await routeApiClient.get('/routes', { params: { mine: true } });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  /** @param {string|null} [preferredTime] */
  async searchMatches(pickupLat, pickupLng, destinationCampusId = 1, preferredTime = null) {
    try {
      const response = await routeApiClient.post('/routes/search-match', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        destination_campus_id: destinationCampusId,
        preferred_time: preferredTime || undefined,
      });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async evaluateDetour(routeId, pickupLat, pickupLng) {
    try {
      const response = await routeApiClient.post(`/routes/${routeId}/evaluate-detour`, {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
      });
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Estimación LOCAL (heurística geodésica, sin llamada de red) del desvío para
   * la vista previa del mapa. ai-route-service no se llama directo desde el
   * cliente: la evaluación real y autorizada es `evaluateDetour` de arriba.
   */
  estimateDetourLocally({ driver_origin, campus_destination, passenger_pickup }) {
    const latDiff = Math.abs(driver_origin[0] - passenger_pickup[0]) + Math.abs(campus_destination[0] - passenger_pickup[0]);
    const lngDiff = Math.abs(driver_origin[1] - passenger_pickup[1]) + Math.abs(campus_destination[1] - passenger_pickup[1]);
    const distEstKm = Math.round((latDiff + lngDiff) * 111 * 10) / 10;
    const detourMin = Math.max(2, Math.min(12, Math.round(distEstKm * 2.1)));

    return {
      success: true,
      isLocalEstimate: true,
      data: {
        is_viable: detourMin <= 15,
        detour_time_minutes: detourMin,
        detour_distance_km: distEstKm,
        original_duration_minutes: 22,
        new_total_duration_minutes: 22 + detourMin,
        traffic_congestion_level: 'fluido',
        carbon_saved_grams: Math.round(distEstKm * 120),
        reason: detourMin <= 15 ? 'Desvío estimado dentro del rango viable' : 'Excede el límite estimado de desvío',
      },
    };
  },
};

export const walletService = {
  async initRecharge(amountCop) {
    try {
      const response = await apiClient.post('/wallet/recharge/init', { amount_cop: amountCop });
      return response.data?.data || null;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'No se pudo iniciar la recarga de billetera.' };
    }
  },
};

export const tripLifecycleService = {
  async bookTrip(tripPayload) {
    try {
      const response = await tripLifecycleClient.post('/trips', tripPayload);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al reservar el viaje.' };
    }
  },

  async reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters }) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/tracking`, {
        latitude,
        longitude,
        speed_kmh,
        heading_degrees,
        accuracy_meters,
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al emitir telemetría GPS.' };
    }
  },

  async getLatestPosition(tripId) {
    try {
      const response = await tripLifecycleClient.get(`/trips/${tripId}/tracking/latest`);
      return response.data?.data || null;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      return null;
    }
  },

  async triggerEmergencySos(tripId, { latitude, longitude, emergencyType = 'panico_usuario' }) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/sos`, {
        latitude,
        longitude,
        emergency_type: emergencyType,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch {
      // Si el endpoint no existe o falla, no bloquear el flujo de llamada telefónica del dispositivo
      return { success: false, fallback: true };
    }
  },

  async startDriving(tripId) {
    const response = await tripLifecycleClient.post(`/trips/${tripId}/start`);
    return response.data;
  },

  async arriveAtMeetingPoint(tripId) {
    const response = await tripLifecycleClient.post(`/trips/${tripId}/arrive`);
    return response.data;
  },

  async verifyPin(tripId, pin) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/verify-pin`, { pin });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Código PIN inválido.' };
    }
  },

  async completeTrip(tripId) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/complete`);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'No se pudo completar el viaje.' };
    }
  },

  async cancelTrip(tripId, cancelledBy, reason) {
    const response = await tripLifecycleClient.post(`/trips/${tripId}/cancel`, {
      cancelled_by: cancelledBy,
      reason: reason,
    });
    return response.data;
  },

  async getActivePassengerTrip() {
    try {
      const response = await tripLifecycleClient.get('/passenger/active-trip');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  async initCardPayment(tripId) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/payment/card/init`);
      return response.data?.data || null;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'No se pudo iniciar el pago con tarjeta.' };
    }
  },
};

// NOTA: /notifications/send solo puede ser invocado por servicios internos del
// backend (token de servicio) — nunca desde la app cliente.
export const notificationsService = {
  async getUserNotifications() {
    try {
      const response = await notificationApiClient.get('/notifications');
      return response.data || { success: true, unread_count: 0, data: [] };
    } catch {
      return { success: true, unread_count: 0, data: [] };
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await notificationApiClient.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch {
      return { success: true };
    }
  },

  async markAllAsRead() {
    try {
      const response = await notificationApiClient.post('/notifications/mark-all-read');
      return response.data;
    } catch {
      return { success: true };
    }
  },

  // --- WEB PUSH — solo aplica a frontend/ (web). mobile/ usa expo-notifications
  // (Fase 3 del plan de la app móvil, contrato de backend distinto todavía por
  // construir) — no llamar estos 3 métodos desde mobile/.
  async getVapidPublicKey() {
    try {
      const response = await notificationApiClient.get('/push/vapid-public-key');
      return response.data?.data?.public_key || null;
    } catch {
      return null;
    }
  },

  async savePushSubscription(pushSubscription) {
    try {
      const response = await notificationApiClient.post('/push/subscribe', pushSubscription.toJSON());
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al registrar la suscripción push.' };
    }
  },

  async removePushSubscription(endpoint) {
    try {
      const response = await notificationApiClient.delete('/push/unsubscribe', { data: { endpoint } });
      return response.data;
    } catch {
      return { success: true };
    }
  },

  // --- MOBILE PUSH (expo-notifications / FCM / APNs) ---
  /**
   * @param {{ token: string, platform: 'android' | 'ios' | 'expo' | string, deviceName?: string | null, appVersion?: string }} params
   */
  async registerDeviceToken({ token, platform, deviceName = null, appVersion = '1.0.0' }) {
    try {
      const response = await notificationApiClient.post('/push/device-tokens', {
        token,
        platform, // 'android' | 'ios' | 'expo'
        device_name: deviceName,
        app_version: appVersion,
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al registrar token de notificaciones push.' };
    }
  },

  /**
   * @param {string} token
   */
  async unregisterDeviceToken(token) {
    try {
      const response = await notificationApiClient.post('/push/device-tokens/remove', { token });
      return response.data;
    } catch {
      return { success: false };
    }
  },
};
