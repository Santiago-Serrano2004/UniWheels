import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const SESSION_KEY = 'uniwheels_admin_session';

// Estado de sesión en memoria
let inMemorySession = null;
const authListeners = new Set();

const notifyAuthChange = () => {
  authListeners.forEach((listener) => {
    try {
      listener(inMemorySession);
    } catch {}
  });
};

export const subscribeAuth = (listener) => {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
};

export const getSession = () => {
  if (inMemorySession) return inMemorySession;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      inMemorySession = JSON.parse(raw);
      return inMemorySession;
    }
  } catch {
    inMemorySession = null;
  }
  return null;
};

export const setSession = (sessionData) => {
  inMemorySession = sessionData;
  try {
    if (sessionData) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {}
  notifyAuthChange();
};

export const clearSession = () => {
  setSession(null);
};

// Formatea la URL para garantizar que siempre lleve el prefijo /api/v1
const formatApiUrl = (url) => {
  if (!url) return '/api/v1';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/v1')) return url;
  return `/api/v1${url.startsWith('/') ? '' : '/'}${url}`;
};

// Cliente sin interceptores para evitar recursión al refrescar token
const rawRefreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

rawRefreshClient.interceptors.request.use((config) => {
  config.url = formatApiUrl(config.url);
  return config;
});

let refreshInFlight = null;

const solicitarNuevoToken = () => {
  if (!refreshInFlight) {
    const currentSession = getSession();
    const token = currentSession?.token;
    refreshInFlight = rawRefreshClient
      .post('/auth/refresh', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const nuevoToken = res.data?.data?.access_token;
        if (!nuevoToken) throw new Error('Respuesta de refresh sin token.');
        const updated = {
          ...currentSession,
          token: nuevoToken,
        };
        setSession(updated);
        return nuevoToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

// Interceptor de autenticación y prefijo para Axios
const attachAuthInterceptor = (client) => {
  client.interceptors.request.use((config) => {
    config.url = formatApiUrl(config.url);
    try {
      const session = getSession();
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
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

      if (!esNoAutenticado || !config || yaReintentado || !getSession()?.token) {
        return Promise.reject(error);
      }

      config._reintentadoTrasRefresh = true;

      try {
        const nuevoToken = await solicitarNuevoToken();
        config.headers.Authorization = `Bearer ${nuevoToken}`;
        return client(config);
      } catch {
        clearSession();
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
    timeout: 10000,
  })
);

export const parseBackendError = (err) => {
  if (!err) return 'Ocurrió un error inesperado. Intenta nuevamente.';
  if (typeof err === 'string') return err;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  if (err.errors && typeof err.errors === 'object') {
    const firstKey = Object.keys(err.errors)[0];
    if (firstKey && Array.isArray(err.errors[firstKey])) {
      return err.errors[firstKey][0];
    }
  }
  return 'Ocurrió un error en la solicitud.';
};

// ==========================================
// Cache en memoria para User Lookup
// ==========================================
const userLookupCache = new Map();

export const userLookupService = {
  getCachedUser(id) {
    return userLookupCache.get(id) || null;
  },

  async lookupUsers(ids = []) {
    const cleanIds = Array.from(new Set(ids.filter(Boolean)));
    const missing = cleanIds.filter((id) => !userLookupCache.has(id));

    if (missing.length === 0) {
      const result = {};
      cleanIds.forEach((id) => {
        result[id] = userLookupCache.get(id);
      });
      return result;
    }

    // Dividir en bloques de máximo 100 (límite del backend)
    const chunkSize = 100;
    for (let i = 0; i < missing.length; i += chunkSize) {
      const chunk = missing.slice(i, i + chunkSize);
      try {
        const response = await apiClient.post('/admin/users/lookup', { ids: chunk });
        const users = response.data?.data || [];
        users.forEach((u) => {
          userLookupCache.set(u.id, u);
        });
      } catch (err) {
        console.warn('Error en user lookup batch:', err);
      }
    }

    const result = {};
    cleanIds.forEach((id) => {
      result[id] = userLookupCache.get(id) || { id, name: `Usuario (${id.slice(0, 8)})`, email: '' };
    });
    return result;
  },
};

// ==========================================
// Servicios de Autenticación
// ==========================================
export const authService = {
  async login(email, password) {
    try {
      const response = await rawRefreshClient.post('/auth/login', { email, password });
      const data = response.data?.data;
      const user = data?.user;
      const token = data?.access_token;

      if (!user || !token) {
        throw new Error('Respuesta de autenticación incompleta.');
      }

      const roles = Array.isArray(user.roles)
        ? user.roles
        : typeof user.role === 'string'
        ? [user.role]
        : [];

      const isAdmin = roles.includes('administrador');

      if (!isAdmin) {
        throw new Error('Esta cuenta no tiene acceso al panel');
      }

      const sessionData = {
        user,
        token,
      };

      setSession(sessionData);
      return sessionData;
    } catch (err) {
      if (err.message === 'Esta cuenta no tiene acceso al panel') {
        throw err;
      }
      throw new Error(parseBackendError(err));
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorar errores al cerrar sesión
    } finally {
      clearSession();
    }
  },

  async me() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },
};

// ==========================================
// Servicios de Vehículos y Documentos
// ==========================================
export const vehicleService = {
  async getVehicles({ status = '', search = '', page = 1, per_page = 15 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'todos') params.append('status', status);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const response = await apiClient.get(`/admin/vehicles?${params.toString()}`);
    return response.data;
  },

  async getVehicleById(id) {
    const response = await apiClient.get(`/admin/vehicles/${id}`);
    return response.data?.data;
  },

  async verifyDocument(vehicleId, documentId, isVerified, rejectionNotes = null) {
    const payload = {
      is_verified: isVerified,
    };
    if (!isVerified && rejectionNotes) {
      payload.rejection_notes = rejectionNotes;
    }
    const response = await apiClient.patch(
      `/vehicles/${vehicleId}/documents/${documentId}/verify`,
      payload
    );
    return response.data;
  },

  async fetchDocumentBlob(secureDownloadUrl) {
    const response = await apiClient.get(secureDownloadUrl, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};

// ==========================================
// Servicios de Alertas SOS
// ==========================================
export const sosService = {
  async getSosEvents({ status = 'pending', page = 1, per_page = 15 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'todos') params.append('status', status);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const response = await apiClient.get(`/admin/sos-events?${params.toString()}`);
    return response.data;
  },

  async attendSosEvent(id, notes = '') {
    const response = await apiClient.patch(`/admin/sos-events/${id}/attend`, {
      notes,
    });
    return response.data;
  },
};

// ==========================================
// Servicios de Usuarios
// ==========================================
export const adminUserService = {
  async getUsers({ search = '', role = '', active = '', page = 1, per_page = 15 } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'todos') params.append('role', role);
    if (active !== '' && active !== 'todos') params.append('active', active);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const response = await apiClient.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  async getUserById(id) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data?.data;
  },

  async updateSuspension(id, { suspended, reason = '' }) {
    const payload = {
      suspended: Boolean(suspended),
    };
    if (suspended && reason) {
      payload.reason = reason;
    }
    const response = await apiClient.patch(`/admin/users/${id}/suspension`, payload);
    return response.data;
  },
};

// ==========================================
// Servicios de Viajes y Pagos
// ==========================================
export const adminTripService = {
  async getTrips({ status = '', from = '', to = '', page = 1, per_page = 15 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'todos') params.append('status', status);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const response = await apiClient.get(`/admin/trips?${params.toString()}`);
    return response.data;
  },
};

// ==========================================
// Servicios de Métricas del Piloto
// ==========================================
export const pilotService = {
  // trip-service: viajes, cancelaciones, repetición y usuarios activos únicos (unión).
  async getTripMetrics(weeks = 12) {
    const response = await apiClient.get(`/admin/metrics/weekly?weeks=${weeks}`);
    return response.data;
  },

  // route-matching-service: búsquedas y conductores que publican. El gateway reescribe
  // este alias a /admin/metrics/weekly de route-matching (las dos rutas comparten path).
  async getMatchingMetrics(weeks = 12) {
    const response = await apiClient.get(`/admin/metrics/matching?weeks=${weeks}`);
    return response.data;
  },
};
