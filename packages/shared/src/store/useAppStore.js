import { create } from 'zustand';
import { getStorageAdapter } from '../platform.js';
import { readStoredSession, writeStoredSession, removeStoredSession } from '../session.js';
import { notificationsService } from '../api.js';

/**
 * @file useAppStore.js
 * @description Gestor de Estado Global compartido entre frontend/ (web) y
 * mobile/ (Expo). Autenticación, rol activo, ciclo de vida de viajes activos,
 * navegación por pestañas.
 *
 * Diferencia clave frente al store original de la web: NO lee la sesión de
 * storage de forma síncrona al crear el store (localStorage es síncrono, pero
 * AsyncStorage de React Native no lo es). El store arranca siempre en estado
 * "sin sesión" y cada plataforma llama a `hydrateSession()` una vez al iniciar
 * la app, antes de renderizar cualquier pantalla que dependa de `isAuthenticated`.
 */

const THEME_KEY = 'uniwheels_app_theme';
const HOME_LOCATION_KEY = 'uniwheels_home_location';
const PASSENGER_ALERTS_KEY = 'uniwheels_recurring_passenger_alerts';
const SAVED_CARDS_KEY = 'uniwheels_saved_cards';

const persistTheme = (tema) => {
  getStorageAdapter().setItem(THEME_KEY, tema).catch(() => {});
};

const persistHomeLocation = (location) => {
  getStorageAdapter().setItem(HOME_LOCATION_KEY, JSON.stringify(location)).catch(() => {});
};

const persistPassengerAlerts = (alerts) => {
  getStorageAdapter().setItem(PASSENGER_ALERTS_KEY, JSON.stringify(alerts)).catch(() => {});
};

const persistSavedCards = (cards) => {
  getStorageAdapter().setItem(SAVED_CARDS_KEY, JSON.stringify(cards)).catch(() => {});
};

export const useAppStore = create((set, get) => ({
  // --- AUTENTICACIÓN Y USUARIO ---
  // Arranca sin sesión siempre — ver `hydrateSession()` más abajo.
  isAuthenticated: false,
  user: null,
  isHydrating: true,

  // --- TEMA VISUAL DE LA APLICACIÓN (Light / Dark) ---
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const nuevoTema = state.theme === 'dark' ? 'light' : 'dark';
      persistTheme(nuevoTema);
      return { theme: nuevoTema };
    }),
  setTheme: (nuevoTema) => {
    persistTheme(nuevoTema);
    set({ theme: nuevoTema });
  },

  // Modal de Mascota Institucional de Bienvenida
  showWelcomeMascot: false,
  closeWelcomeMascot: () => set({ showWelcomeMascot: false }),
  openWelcomeMascot: () => set({ showWelcomeMascot: true }),

  // Modal de Invitación a Registro de Conductor
  showDriverInviteModal: false,
  closeDriverInviteModal: () => set({ showDriverInviteModal: false }),
  openDriverInviteModal: () => set({ showDriverInviteModal: true }),

  // --- UBICACIÓN FAVORITA GLOBAL (CASA) ---
  savedHomeLocation: null,
  setSavedHomeLocation: (location) => {
    persistHomeLocation(location);
    set({ savedHomeLocation: location });
  },

  // --- NAVEGACIÓN Y PESTAÑAS ---
  // Pestañas disponibles: 'home' | 'map' | 'driver' | 'history' | 'trips' | 'profile'
  activeTab: 'home',
  setActiveTab: (pestaña) => set({ activeTab: pestaña }),

  // Ruta seleccionada desde la búsqueda para visualizar en el mapa
  selectedSearchRoute: null,
  setSelectedSearchRoute: (route) => set({ selectedSearchRoute: route, activeTab: 'map' }),
  clearSelectedSearchRoute: () => set({ selectedSearchRoute: null }),

  // --- ROL ACTIVO (Pasajero o Conductor) ---
  activeRole: 'passenger',
  toggleRole: () =>
    set((state) => {
      if (!state.user?.isDriver) {
        return { activeRole: 'passenger' };
      }
      const nuevoRol = state.activeRole === 'passenger' ? 'driver' : 'passenger';
      const usuarioActualizado = { ...state.user, role: nuevoRol };
      writeStoredSession(usuarioActualizado);
      return {
        activeRole: nuevoRol,
        user: usuarioActualizado,
        activeTab: 'home',
      };
    }),

  // --- VIAJE ACTIVO DEL CONDUCTOR ---
  activeDriverTrip: null,
  setActiveDriverTrip: (trip) => set({ activeDriverTrip: trip }),
  currentRoutePassengerTrips: [],
  setCurrentRoutePassengerTrips: (trips) => set({ currentRoutePassengerTrips: trips || [] }),

  // --- RESERVA ACTIVA DEL PASAJERO ---
  activePassengerBooking: null,

  bookPassengerTrip: (datosViaje) => {
    const reserva = {
      id: 'book_' + Date.now(),
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      boardingPin: '4829',
      ...datosViaje,
    };
    set({ activePassengerBooking: reserva, activeTab: 'history' });
    return reserva;
  },

  cancelPassengerBooking: () => set({ activePassengerBooking: null }),

  startPassengerTrip: () => {
    set((state) => ({
      activePassengerBooking: state.activePassengerBooking
        ? { ...state.activePassengerBooking, status: 'in_progress', isStarted: true, startedAt: new Date().toISOString() }
        : null,
    }));
  },

  completePassengerTrip: () => {
    set((state) => ({
      activePassengerBooking: state.activePassengerBooking
        ? { ...state.activePassengerBooking, status: 'completed', isStarted: false, completedAt: new Date().toISOString() }
        : null,
    }));
  },

  // --- VIAJES PUBLICADOS DEL CONDUCTOR ---
  publishedDriverTrips: [],
  setPublishedDriverTrips: (trips) => set({ publishedDriverTrips: trips || [] }),
  cancelPublishedTrip: (tripId) => {
    set((state) => ({
      publishedDriverTrips: state.publishedDriverTrips.map((t) => (t.id === tripId ? { ...t, status: 'cancelado' } : t)),
    }));
  },
  startPublishedTrip: (tripId) => {
    const trip = get().publishedDriverTrips.find((t) => t.id === tripId);
    if (!trip) return;
    set({
      activeDriverTrip: { ...trip, status: 'active', passengers: trip.passengers || [], availableSeats: trip.available_seats },
      activeTab: 'home',
    });
  },

  // --- PLANTILLAS DE VIAJES RECURRENTES DEL CONDUCTOR ---
  recurringDriverTrips: [],
  setRecurringDriverTrips: (trips) => set({ recurringDriverTrips: trips || [] }),
  toggleRecurringDriverTrip: (templateId) =>
    set((state) => ({
      recurringDriverTrips: state.recurringDriverTrips.map((t) =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      ),
    })),
  addRecurringDriverTrip: (nuevoTemplate) =>
    set((state) => ({
      recurringDriverTrips: [
        { id: 'rec_d_' + Date.now(), isActive: true, ...nuevoTemplate },
        ...state.recurringDriverTrips,
      ],
    })),
  deleteRecurringDriverTrip: (templateId) =>
    set((state) => ({
      recurringDriverTrips: state.recurringDriverTrips.filter((t) => t.id !== templateId),
    })),

  // --- ALERTAS DE TRAYECTOS RECURRENTES DEL PASAJERO (SMART MATCH ALERTS) ---
  recurringPassengerAlerts: [],
  setRecurringPassengerAlerts: (alerts) => {
    persistPassengerAlerts(alerts || []);
    set({ recurringPassengerAlerts: alerts || [] });
  },
  togglePassengerAlert: (alertId) =>
    set((state) => {
      const updated = state.recurringPassengerAlerts.map((a) =>
        a.id === alertId ? { ...a, isActive: !a.isActive } : a
      );
      persistPassengerAlerts(updated);
      return { recurringPassengerAlerts: updated };
    }),
  addPassengerAlert: (nuevaAlerta) =>
    set((state) => {
      const updated = [
        { id: `alert_${Date.now()}`, isActive: true, ...nuevaAlerta },
        ...state.recurringPassengerAlerts,
      ];
      persistPassengerAlerts(updated);
      return { recurringPassengerAlerts: updated };
    }),
  deletePassengerAlert: (alertId) =>
    set((state) => {
      const updated = state.recurringPassengerAlerts.filter((a) => a.id !== alertId);
      persistPassengerAlerts(updated);
      return { recurringPassengerAlerts: updated };
    }),
  removePassengerAlert: (alertId) =>
    set((state) => {
      const updated = state.recurringPassengerAlerts.filter((a) => a.id !== alertId);
      persistPassengerAlerts(updated);
      return { recurringPassengerAlerts: updated };
    }),

  // --- MÉTODOS DE PAGO GUARDADOS ---
  savedCards: [],
  setSavedCards: (cards) => {
    persistSavedCards(cards || []);
    set({ savedCards: cards || [] });
  },
  addCard: (nuevaTarjeta) =>
    set((state) => {
      const updated = [
        ...state.savedCards.map((c) => (nuevaTarjeta.isDefault ? { ...c, isDefault: false } : c)),
        { id: `card_${Date.now()}`, ...nuevaTarjeta },
      ];
      persistSavedCards(updated);
      return { savedCards: updated };
    }),
  addSavedCard: (nuevaTarjeta) =>
    set((state) => {
      const updated = [
        ...state.savedCards.map((c) => (nuevaTarjeta.isDefault ? { ...c, isDefault: false } : c)),
        { id: `card_${Date.now()}`, ...nuevaTarjeta },
      ];
      persistSavedCards(updated);
      return { savedCards: updated };
    }),
  deleteCard: (cardId) =>
    set((state) => {
      const updated = state.savedCards.filter((c) => c.id !== cardId);
      persistSavedCards(updated);
      return { savedCards: updated };
    }),
  removeSavedCard: (cardId) =>
    set((state) => {
      const updated = state.savedCards.filter((c) => c.id !== cardId);
      persistSavedCards(updated);
      return { savedCards: updated };
    }),
  setDefaultCard: (cardId) =>
    set((state) => {
      const updated = state.savedCards.map((c) => ({ ...c, isDefault: c.id === cardId }));
      persistSavedCards(updated);
      return { savedCards: updated };
    }),
  linkedNequi: null,

  publishDriverTrip: (datosTrayecto) => {
    const nuevoViaje = {
      id: 'trip_' + Date.now(),
      createdAt: new Date().toISOString(),
      date: datosTrayecto.departure_date || new Date().toISOString().split('T')[0],
      departure_time: datosTrayecto.departure_time || '06:45 AM',
      direction: datosTrayecto.direction || 'hacia_campus',
      available_seats: datosTrayecto.available_seats || 3,
      total_seats: datosTrayecto.available_seats || 3,
      fare_cop: datosTrayecto.fare_cop ?? 0,
      status: 'publicado',
      passengers: [],
      ...datosTrayecto,
    };
    set((state) => ({
      publishedDriverTrips: [nuevoViaje, ...state.publishedDriverTrips],
      activeTab: 'history',
    }));
    return nuevoViaje;
  },

  cancelDriverTrip: () => {
    set({ activeDriverTrip: null, currentRoutePassengerTrips: [] });
  },

  finishActiveDriverTrip: () => set({ activeDriverTrip: null, currentRoutePassengerTrips: [] }),

  // --- SESIÓN ---

  /**
   * Se llama UNA VEZ al arrancar la app (antes de renderizar pantallas que
   * dependan de `isAuthenticated`) para recuperar la sesión persistida de forma
   * asíncrona. En web, el adaptador envuelve `localStorage` en una promesa ya
   * resuelta, así que esto se resuelve en el siguiente microtask; en mobile,
   * espera a `AsyncStorage` de verdad.
   */
  hydrateSession: async () => {
    const sesion = await readStoredSession();
    let storedAlerts = [];
    let storedCards = [];
    try {
      const rawAlerts = await getStorageAdapter().getItem(PASSENGER_ALERTS_KEY);
      if (rawAlerts) storedAlerts = JSON.parse(rawAlerts);
    } catch {}
    try {
      const rawCards = await getStorageAdapter().getItem(SAVED_CARDS_KEY);
      if (rawCards) storedCards = JSON.parse(rawCards);
    } catch {}

    const isDriver = Boolean(
      sesion?.isDriver ||
      sesion?.is_driver ||
      sesion?.driverStatus === 'approved' ||
      sesion?.driver_status === 'approved'
    );
    set({
      isAuthenticated: Boolean(sesion),
      user: sesion ? { ...sesion, isDriver } : null,
      activeRole: isDriver ? sesion?.role || 'passenger' : 'passenger',
      recurringPassengerAlerts: storedAlerts.length > 0 ? storedAlerts : get().recurringPassengerAlerts,
      savedCards: storedCards.length > 0 ? storedCards : get().savedCards,
      isHydrating: false,
    });
  },

  login: (datosUsuario) => {
    const isDriver = Boolean(
      datosUsuario?.isDriver ||
      datosUsuario?.is_driver ||
      datosUsuario?.driverStatus === 'approved' ||
      datosUsuario?.driver_status === 'approved'
    );
    const driverStatus =
      datosUsuario?.driverStatus ||
      datosUsuario?.driver_status ||
      (isDriver ? 'approved' : 'unregistered');
    const usuarioAGuardar = {
      ...datosUsuario,
      isDriver,
      driverStatus,
      role: isDriver ? (datosUsuario?.role || 'passenger') : 'passenger',
    };
    writeStoredSession(usuarioAGuardar);
    set({
      isAuthenticated: true,
      user: usuarioAGuardar,
      activeRole: 'passenger',
      activeTab: 'home',
      showWelcomeMascot: true,
    });
  },

  updateDriverStatus: (estado, datosConductor = {}) => {
    const state = get();
    if (!state.user) return;
    const estaAprobado = estado === 'approved';
    const driverStatus = estaAprobado ? 'approved' : 'pending';
    const usuarioActualizado = {
      ...state.user,
      isDriver: estaAprobado,
      driverStatus,
      driverApplication: { ...datosConductor, submittedAt: new Date().toISOString() },
      driverInfo: datosConductor,
      role: estaAprobado ? 'driver' : state.user.role || 'passenger',
    };
    writeStoredSession(usuarioActualizado);
    set({
      user: usuarioActualizado,
      activeRole: estaAprobado ? 'driver' : state.activeRole || 'passenger',
    });
  },

  // --- TOKEN DE NOTIFICACIONES PUSH MÓVILES ---
  pushDeviceToken: null,
  setPushDeviceToken: (token) => set({ pushDeviceToken: token }),

  logout: () => {
    const pushToken = get().pushDeviceToken;
    if (pushToken) {
      notificationsService.unregisterDeviceToken(pushToken).catch(() => {});
    }
    removeStoredSession();
    set({
      isAuthenticated: false,
      user: null,
      activeTab: 'home',
      activeRole: 'passenger',
      activeDriverTrip: null,
      activePassengerBooking: null,
      showWelcomeMascot: false,
      pushDeviceToken: null,
    });
  },
}));
