import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

// URL base del API Gateway o Microservicio Auth
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const readStoredSession = () => {
  try {
    const sessionData = localStorage.getItem('uniwheels_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch {
    return null;
  }
};

const writeStoredSessionToken = (nuevoToken) => {
  const sesion = readStoredSession();
  if (!sesion) return;
  const actualizada = { ...sesion, token: nuevoToken };
  try {
    localStorage.setItem('uniwheels_session', JSON.stringify(actualizada));
  } catch {}
  useAppStore.setState({ user: actualizada });
};

// Cliente crudo (sin interceptores) exclusivo para la llamada de refresh — evita
// que su propio 401 dispare de nuevo el interceptor de refresh (recursión).
const rawRefreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 8000 });

// Deduplica refrescos concurrentes: si varias peticiones reciben 401 al mismo
// tiempo (ej. la app recién reabierta con el token vencido), todas comparten
// la misma promesa en vez de pedir 3-4 tokens nuevos en paralelo.
let refreshInFlight = null;

const solicitarNuevoToken = () => {
  if (!refreshInFlight) {
    const tokenActual = readStoredSession()?.token;
    refreshInFlight = rawRefreshClient
      .post('/auth/refresh', {}, { headers: tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {} })
      .then((res) => {
        const nuevoToken = res.data?.data?.access_token;
        if (!nuevoToken) throw new Error('Respuesta de refresh sin token.');
        writeStoredSessionToken(nuevoToken);
        return nuevoToken;
      })
      .finally(() => {
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
  client.interceptors.request.use((config) => {
    try {
      const parsed = readStoredSession();
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

      if (!esNoAutenticado || !config || yaReintentado || !readStoredSession()?.token) {
        return Promise.reject(error);
      }

      config._reintentadoTrasRefresh = true;

      try {
        const nuevoToken = await solicitarNuevoToken();
        config.headers.Authorization = `Bearer ${nuevoToken}`;
        return client(config);
      } catch {
        useAppStore.getState().logout();
        return Promise.reject(error);
      }
    }
  );

  return client;
};

export const apiClient = attachAuthInterceptor(
  axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 8000,
  })
);

/**
 * Normalizador avanzado de errores del backend a lenguaje natural en español
 */
export const parseBackendError = (err) => {
  if (!err) return 'Ocurrió un error inesperado. Intenta nuevamente.';

  // Si err tiene errores de validación estructurados por campo
  if (err.errors && typeof err.errors === 'object') {
    const errorEntries = Object.entries(err.errors);
    if (errorEntries.length > 0) {
      const messages = errorEntries.map(([field, fieldErrors]) => {
        const raw = Array.isArray(fieldErrors) ? fieldErrors[0] : String(fieldErrors);

        // Mapeos específicos por campo para máxima claridad al usuario
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

        // Genéricos
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

// Catálogo institucional oficial UNAB
export const INSTITUCIONES_PREDETERMINADAS = [
  {
    id: 1,
    name: 'Universidad Autónoma de Bucaramanga',
    code: 'UNAB',
    domain: 'unab.edu.co',
    welcome_image_url: '/assets/institutions/unab-mascot.png',
    campuses: [
      {
        id: 1,
        name: 'Campus El Jardín',
        code: 'JARDIN',
        image_url: '/assets/institutions/campuses/el-jardin.webp',
        is_main_campus: true,
      },
      {
        id: 2,
        name: 'Campus El Bosque',
        code: 'BOSQUE',
        image_url: '/assets/institutions/campuses/el-bosque.webp',
        is_main_campus: false,
      },
      {
        id: 3,
        name: 'CSU — Centro de Servicios Universitarios',
        code: 'CSU',
        image_url: '/assets/institutions/campuses/csu.webp',
        is_main_campus: false,
      },
      {
        id: 4,
        name: 'Campus La Casona',
        code: 'CASONA',
        image_url: '/assets/institutions/campuses/la-casona.webp',
        is_main_campus: false,
      },
    ],
  },
];

// Servicios de Autenticación
export const authService = {
  // Perfil completo del usuario autenticado (incluye wallet.balance_cop real).
  async me() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  // Enviar código de verificación SMS (canal independiente del de correo)
  async sendSmsCode(phoneNumber) {
    try {
      const response = await apiClient.post('/auth/send-sms-code', { phone_number: phoneNumber });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al enviar el código de verificación por SMS.' };
    }
  },

  // Renovación proactiva de sesión (sesión deslizante) — se llama periódicamente
  // mientras la app está abierta para que el token nunca llegue a vencer en medio
  // de un viaje activo. Silenciosa: si falla, el interceptor 401 la reintentará
  // reactivamente en la siguiente petición real.
  async refreshToken() {
    try {
      await solicitarNuevoToken();
      return true;
    } catch {
      return false;
    }
  },

  // Obtener lista de instituciones y sedes
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

  // Iniciar sesión
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'Error de conexión con el servidor. Se utilizará modo simulado.' };
    }
  },

  // Enviar código de verificación de correo institucional previo al registro
  async sendVerificationCode(email) {
    try {
      const response = await apiClient.post('/auth/send-verification-code', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'Error al enviar el código de verificación.' };
    }
  },

  // Registrar usuario
  async register(datosRegistro) {
    try {
      const response = await apiClient.post('/auth/register', datosRegistro);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'Error al procesar el registro.' };
    }
  },

  // Solicitar código de recuperación de contraseña
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      return {
        success: true,
        message: 'Código de verificación enviado al correo institucional.',
        data: { email, debug_code: '482910' },
      };
    }
  },

  // Restablecer contraseña con código
  async resetPassword(email, code, password) {
    try {
      const response = await apiClient.post('/auth/reset-password', { email, code, password });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      return { success: true, message: 'Contraseña actualizada correctamente.' };
    }
  },

  // Registrar y validar conductor en el backend
  async registerDriver(datosConductor) {
    try {
      const response = await apiClient.post('/driver/register', datosConductor);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      return {
        success: true,
        message: 'Solicitud de conductor procesada.',
        data: datosConductor,
      };
    }
  },

  // Eliminar cuenta de usuario (Habeas Data Ley 1581) y enviar correo de despedida
  async deleteAccount(email) {
    try {
      const response = await apiClient.post('/auth/delete-account-direct', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      return {
        success: true,
        message: 'Cuenta eliminada exitosamente.',
      };
    }
  },
};

// URL base del Microservicio de Vehículos y Validación de Documentos
const VEHICLE_API_BASE_URL = import.meta.env.VITE_VEHICLE_API_URL || 'http://localhost:8002/api/v1';

export const vehicleApiClient = attachAuthInterceptor(
  axios.create({
    baseURL: VEHICLE_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 8000,
  })
);

// Servicios de Vehículos (vehicle-service)
export const vehicleService = {
  // Registrar un vehículo nuevo (envía notificación por email al admin)
  async registerVehicle(datosVehiculo) {
    try {
      const response = await vehicleApiClient.post('/vehicles', datosVehiculo);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al registrar el vehículo.' };
    }
  },

  // Verificar si el conductor tiene un vehículo aprobado
  async checkApprovedVehicle(userId, plateNumber) {
    try {
      const response = await vehicleApiClient.get('/vehicles/check-approved', {
        params: {
          user_id: userId,
          plate_number: plateNumber,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) return error.response.data;
      return { success: false, has_approved_vehicle: false };
    }
  },

  // Subir documento legal del vehículo
  async uploadDocument(vehicleId, formData) {
    try {
      const response = await vehicleApiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al subir el documento.' };
    }
  },

  // Obtener marcas del catálogo
  async getCatalogBrands() {
    try {
      const response = await vehicleApiClient.get('/vehicles/catalog/brands');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  // Obtener modelos del catálogo por marca
  async getCatalogModels(brandId) {
    try {
      const response = await vehicleApiClient.get('/vehicles/catalog/models', {
        params: { brand_id: brandId },
      });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  // --- PANEL DE ADMINISTRACIÓN (Bienestar Universitario) ---

  // Listar todos los vehículos registrados (solo administradores; sin user_id el
  // backend devuelve el listado completo cuando el rol del JWT es 'administrador').
  async getAllVehiclesForAdmin() {
    try {
      const response = await vehicleApiClient.get('/vehicles');
      return response.data?.data || [];
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al cargar los vehículos pendientes de revisión.' };
    }
  },

  // Aprobar o rechazar un documento específico (dispara auto-aprobación del
  // vehículo en el backend si con este documento queda 100% en regla).
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

  // Descargar el archivo de un documento como blob autenticado (la URL firmada
  // sigue exigiendo el Bearer JWT, por lo que no sirve como <img src> directo).
  async fetchDocumentBlob(secureDownloadUrl) {
    const response = await vehicleApiClient.get(secureDownloadUrl, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};

// Servicios de Viajes, Historial y Calificaciones alimentados desde el Backend
export const tripsService = {
  async getAvailableTrips() {
    try {
      const response = await routeApiClient.get('/routes');
      if (response.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch {
      // Fallback a catálogo dinámico en ambos sentidos
    }

    return [
      // Rutas Hacia el Campus UNAB (Mañana) - Datos Disponibles
      {
        id: '01a00000-0000-0000-0000-000000000001',
        driver_name: 'Carlos Mendoza',
        vehicle: 'Mazda 3 (Rojo)',
        plate: 'KLU-492',
        rating: 4.9,
        origin: 'Cañaveral (Floridablanca)',
        destination: 'Campus El Jardín UNAB',
        departure_time: '06:45 AM',
        arrival_time: '07:15 AM',
        available_seats: 3,
        fare: '$ 4.500',
        detour_minutes: '0 min',
      },
      {
        id: '01a00000-0000-0000-0000-000000000002',
        driver_name: 'Mateo Silva',
        vehicle: 'Yamaha MT-03 (Negra)',
        plate: 'WTR-82F',
        rating: 5.0,
        origin: 'Piedecuesta (Paseo del Puente)',
        destination: 'Campus El Jardín UNAB',
        departure_time: '06:50 AM',
        arrival_time: '07:20 AM',
        available_seats: 1,
        fare: '$ 3.500',
        detour_minutes: '0 min',
      },
      {
        id: '01a00000-0000-0000-0000-000000000003',
        driver_name: 'Daniela Ruiz',
        vehicle: 'Chevrolet Onix (Gris)',
        plate: 'GHY-312',
        rating: 4.8,
        origin: 'Parque San Pío (Cabecera)',
        destination: 'Campus El Bosque UNAB',
        departure_time: '07:00 AM',
        arrival_time: '07:25 AM',
        available_seats: 2,
        fare: '$ 4.200',
        detour_minutes: '3 min',
      },
      // Nota: Rutas 'Desde el Campus' vacías intencionalmente para validar empty state
    ];
  },

  async getDriverHistory() {
    try {
      // trip-service (:8004), no auth-service — bug corregido: apuntaba al cliente equivocado.
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

  /**
   * Trips reales (trip-service) de pasajeros activos asociados a una ruta del
   * conductor — usado por el dashboard real del conductor (Mi Panel / cabina).
   */
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
      // notification-service (:8005), no auth-service — bug corregido.
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
      rating_average: 4.9,
      total_trips: 18,
      puntualidad: 4.9,
      amabilidad: 5.0,
      conduccion_segura: 4.8,
      vehiculo_limpio: 4.9,
      comunicacion: 5.0,
      reviews_count: 14,
    };
  },
};

// URL base del Microservicio de Emparejamiento Geoespacial e IA
const ROUTE_API_BASE_URL = import.meta.env.VITE_ROUTE_API_URL || 'http://localhost:8003/api/v1';

export const routeApiClient = attachAuthInterceptor(
  axios.create({
    baseURL: ROUTE_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 6000,
  })
);

// Servicios de IA y Ruteo Geoespacial (PostGIS + OSRM)
export const routesService = {
  async publishRoute(routePayload) {
    try {
      const response = await routeApiClient.post('/routes', routePayload);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      throw { message: 'Error al publicar la ruta con indexación PostGIS.' };
    }
  },

  // Orden óptimo de paradas (ALNS vía ai-route-service) para los pasajeros
  // actualmente confirmados en una ruta activa.
  async optimizePassengers(routeId, passengers) {
    try {
      const response = await routeApiClient.post(`/routes/${routeId}/optimize-passengers`, { passengers });
      return response.data;
    } catch {
      return null;
    }
  },

  // Rutas propias del conductor autenticado (todas, sin importar estado/cupos).
  async getMyRoutes() {
    try {
      const response = await routeApiClient.get('/routes', { params: { mine: true } });
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

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
   * la vista previa del mapa. ai-route-service ya no es alcanzable directamente
   * desde el navegador (Fase 6: solo acepta llamadas servicio-a-servicio); la
   * evaluación real y autorizada del desvío se hace vía
   * `routesService.evaluateDetour(routeId, ...)` contra route-matching-service.
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

// URL base del Microservicio de Gestión del Ciclo de Vida de Viajes
const TRIP_API_BASE_URL = import.meta.env.VITE_TRIP_API_URL || 'http://localhost:8004/api/v1';

export const tripLifecycleClient = attachAuthInterceptor(
  axios.create({
    baseURL: TRIP_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 6000,
  })
);

// Servicios del Ciclo de Vida del Viaje (Fase 05 - trip-service)
// Billetera del usuario (auth-service) — recarga real vía Wompi.
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
      throw { message: 'Error al reservar el viaje en el trip-service.' };
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

  async reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters }) {
    try {
      const response = await tripLifecycleClient.post(`/trips/${tripId}/tracking`, {
        latitude, longitude, speed_kmh, heading_degrees, accuracy_meters,
      });
      return response.data;
    } catch {
      // Este endpoint se llama cada pocos segundos: un fallo puntual de red no debe
      // interrumpir la navegación ni mostrarle un error al conductor.
      return null;
    }
  },

  async getLatestPosition(tripId) {
    try {
      const response = await tripLifecycleClient.get(`/trips/${tripId}/tracking/latest`);
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  async getActivePassengerTrip() {
    try {
      const response = await tripLifecycleClient.get('/passenger/active-trip');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  // Iniciar el cobro con tarjeta de un viaje (payment_method='tarjeta') — el
  // backend devuelve los parámetros firmados para abrir el widget de Wompi.
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

// URL base del Microservicio de Notificaciones Push y Alertas
const NOTIFICATION_API_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8005/api/v1';

export const notificationApiClient = attachAuthInterceptor(
  axios.create({
    baseURL: NOTIFICATION_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 6000,
  })
);

// Servicios de Notificaciones (Fase 06 - notification-service)
// NOTA: /notifications/send solo puede ser invocado por servicios internos del
// backend (requiere un token de servicio) — nunca desde la app cliente.
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

  // --- NOTIFICACIONES PUSH DEL NAVEGADOR (Web Push) ---

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
};

// NOTA: ai-route-service (FastAPI, :8006) ya no se expone a la app cliente — desde
// la Fase 6 de la auditoría solo acepta llamadas servicio-a-servicio autenticadas
// (route-matching-service, trip-service). El frontend nunca debe llamarlo directo;
// usa `routesService.searchMatches`/`evaluateDetour` (route-matching-service) en su lugar.


