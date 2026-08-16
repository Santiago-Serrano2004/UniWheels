import axios from 'axios';

// URL base del API Gateway o Microservicio Auth
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

// Interceptor para inyectar el Bearer Token en cada solicitud
apiClient.interceptors.request.use((config) => {
  try {
    const sessionData = localStorage.getItem('uniwheels_session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch {}
  return config;
});

/**
 * Normalizador de errores del backend a lenguaje natural en español
 */
export const parseBackendError = (err) => {
  if (!err) return 'Ocurrió un error inesperado. Intenta nuevamente.';

  if (err.errors && typeof err.errors === 'object') {
    const rawError = Object.values(err.errors)[0]?.[0];
    if (rawError) {
      if (rawError.includes('validation.min.string')) return 'El campo no cumple con el número mínimo de caracteres requerido.';
      if (rawError.includes('validation.max.string')) return 'El campo excede la longitud máxima permitida.';
      if (rawError.includes('validation.required')) return 'Este campo es obligatorio.';
      if (rawError.includes('validation.unique')) return 'Ya existe un registro con esta información en el sistema.';
      if (rawError.includes('validation.after')) return 'La fecha de vigencia debe ser estrictamente futura (posterior a hoy).';
      if (rawError.includes('validation.in')) return 'La opción seleccionada no es válida.';
      if (rawError.includes('validation.regex')) return 'El formato del campo no es válido para Colombia.';
      return rawError;
    }
  }

  if (err.message) {
    if (err.message.includes('Unauthenticated') || err.message.includes('401')) {
      return 'Credenciales incorrectas o correo no registrado.';
    }
    if (err.message.includes('validation.')) {
      return 'Por favor revisa los campos señalados en el formulario.';
    }
    return err.message;
  }

  return 'No se pudo conectar con el servidor. Intenta de nuevo.';
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
      { id: 1, name: 'Campus El Jardín', code: 'JARDIN' },
      { id: 2, name: 'Campus El Bosque', code: 'BOSQUE' },
      { id: 3, name: 'CSU — Centro de Servicios Universitarios', code: 'CSU' },
      { id: 4, name: 'Campus La Casona', code: 'CASONA' },
    ],
  },
];

// Servicios de Autenticación
export const authService = {
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
};

// Servicios de Viajes, Historial y Calificaciones alimentados desde el Backend
export const tripsService = {
  async getAvailableTrips() {
    try {
      const response = await apiClient.get('/trips/available');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getDriverHistory() {
    try {
      const response = await apiClient.get('/driver/history');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getPassengerHistory() {
    try {
      const response = await apiClient.get('/passenger/history');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async getWalletTransactions() {
    try {
      const response = await apiClient.get('/wallet/transactions');
      return response.data?.data || { balance_cop: 25000, transactions: [] };
    } catch {
      return { balance_cop: 25000, transactions: [] };
    }
  },

  async submitRating(ratingPayload) {
    try {
      const response = await apiClient.post('/ratings', ratingPayload);
      return response.data;
    } catch (error) {
      if (error.response?.data) throw error.response.data;
      return { success: true };
    }
  },
};
