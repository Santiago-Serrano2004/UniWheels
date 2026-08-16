import { create } from 'zustand';

/**
 * @file useAppStore.js
 * @description Gestor de Estado Global para la Aplicación UniWheels (Zustand)
 * Gestiona autenticación, rol activo (pasajero/conductor), ciclo de vida de viajes activos,
 * saldo prepago de conductor, reservas y navegación entre vistas.
 */

// Recuperar sesión previa almacenada localmente en el dispositivo
const obtenerSesionAlmacenada = () => {
  try {
    const sesion = localStorage.getItem('uniwheels_session');
    return sesion ? JSON.parse(sesion) : null;
  } catch {
    return null;
  }
};

const usuarioInicial = obtenerSesionAlmacenada();

export const useAppStore = create((set, get) => ({
  // --- AUTENTICACIÓN Y USUARIO ---
  isAuthenticated: Boolean(usuarioInicial),
  user: usuarioInicial,

  // Modal de Mascota Institucional de Bienvenida
  showWelcomeMascot: false,
  closeWelcomeMascot: () => set({ showWelcomeMascot: false }),
  openWelcomeMascot: () => set({ showWelcomeMascot: true }),

  // --- NAVEGACIÓN Y PESTAÑAS ---
  // Pestañas disponibles: 'home' | 'map' | 'driver' | 'history' | 'trips' | 'wallet' | 'profile'
  activeTab: 'home',
  setActiveTab: (pestaña) => set({ activeTab: pestaña }),

  // --- ROL ACTIVO (Pasajero o Conductor) ---
  activeRole: usuarioInicial?.isDriver ? usuarioInicial?.role || 'passenger' : 'passenger',
  toggleRole: () =>
    set((state) => {
      if (!state.user?.isDriver) {
        return { activeRole: 'passenger' };
      }
      const nuevoRol = state.activeRole === 'passenger' ? 'driver' : 'passenger';
      const usuarioActualizado = { ...state.user, role: nuevoRol };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(usuarioActualizado));
      } catch {}
      return {
        activeRole: nuevoRol,
        user: usuarioActualizado,
        activeTab: 'home', // Al alternar rol, regresar a la pestaña de inicio correspondiente
      };
    }),

  // --- VIAJE ACTIVO DEL CONDUCTOR ---
  activeDriverTrip: null,

  // --- RESERVA ACTIVA DEL PASAJERO ---
  activePassengerBooking: null,

  // Reservar un viaje como pasajero
  bookPassengerTrip: (datosViaje) => {
    const reserva = {
      id: 'book_' + Date.now(),
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      boardingPin: '4829', // PIN de 4 dígitos para verificación en el abordaje
      ...datosViaje,
    };
    set({
      activePassengerBooking: reserva,
      activeTab: 'history',
    });
    return reserva;
  },

  // Cancelar reserva de pasajero
  cancelPassengerBooking: () => {
    set({ activePassengerBooking: null });
  },

  // --- BILLETERA PREPAGO DEL CONDUCTOR ---
  driverWalletBalance: 25000,

  // Publicar un nuevo viaje de conductor
  publishDriverTrip: (datosTrayecto) => {
    const nuevoViaje = {
      id: 'trip_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'active',
      passengers: [], // Pasajeros confirmados
      ...datosTrayecto,
    };
    set({
      activeDriverTrip: nuevoViaje,
      activeTab: 'home', // Llevar al conductor a su panel de viaje activo
    });
    return nuevoViaje;
  },

  // Cancelar viaje del conductor (con penalización si tiene pasajeros confirmados)
  cancelDriverTrip: (aplicarPenalizacion = false, montoPenalizacion = 3000) => {
    const saldoActual = get().driverWalletBalance;
    const nuevoSaldo = aplicarPenalizacion
      ? Math.max(0, saldoActual - montoPenalizacion)
      : saldoActual;

    set({
      activeDriverTrip: null,
      driverWalletBalance: nuevoSaldo,
    });
  },

  // Simular aceptación de pasajero en el viaje activo (para pruebas)
  addPassengerToActiveTrip: (pasajero) => {
    const viaje = get().activeDriverTrip;
    if (!viaje) return;
    const pasajerosActualizados = [...(viaje.passengers || []), pasajero];
    set({
      activeDriverTrip: {
        ...viaje,
        passengers: pasajerosActualizados,
        availableSeats: Math.max(0, (viaje.seats || viaje.availableSeats) - pasajerosActualizados.length),
      },
    });
  },

  // Recargar Billetera del Conductor
  rechargeDriverWallet: (monto) => {
    set((state) => ({
      driverWalletBalance: state.driverWalletBalance + Number(monto),
    }));
  },

  // Iniciar Sesión
  login: (datosUsuario) => {
    const usuarioAGuardar = datosUsuario || {
      id: 'u1',
      name: 'Santiago Serrano',
      email: 'sserrano28@unab.edu.co',
      studentCode: 'U00123456',
      isDriver: false,
      driverStatus: 'unregistered',
      role: 'passenger',
      institution: 'Universidad Autónoma de Bucaramanga',
      campus: 'Campus El Jardín',
      institutionWelcomeImage: '/assets/institutions/unab-mascot.png',
      rating: 5.0,
      tripsCount: 0,
    };

    if (!usuarioAGuardar.isDriver) {
      usuarioAGuardar.role = 'passenger';
      usuarioAGuardar.driverStatus = usuarioAGuardar.driverStatus || 'unregistered';
    }

    try {
      localStorage.setItem('uniwheels_session', JSON.stringify(usuarioAGuardar));
    } catch {}
    set({
      isAuthenticated: true,
      user: usuarioAGuardar,
      activeRole: 'passenger',
      activeTab: 'home',
      showWelcomeMascot: true,
    });
  },

  // Actualizar estado de verificación del conductor
  updateDriverStatus: (estado, datosConductor = {}) =>
    set((state) => {
      if (!state.user) return {};
      const estaAprobado = estado === 'approved';
      const usuarioActualizado = {
        ...state.user,
        isDriver: estaAprobado,
        driverStatus: estado,
        driverInfo: datosConductor,
        role: estaAprobado ? 'driver' : 'passenger',
      };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(usuarioActualizado));
      } catch {}
      return {
        user: usuarioActualizado,
        activeRole: estaAprobado ? 'driver' : 'passenger',
        activeTab: estaAprobado ? 'driver' : 'home',
      };
    }),

  // Cerrar Sesión
  logout: () => {
    try {
      localStorage.removeItem('uniwheels_session');
    } catch {}
    set({
      isAuthenticated: false,
      user: null,
      activeTab: 'home',
      activeRole: 'passenger',
      activeDriverTrip: null,
      activePassengerBooking: null,
      showWelcomeMascot: false,
    });
  },
}));
