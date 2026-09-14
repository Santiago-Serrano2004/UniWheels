import { create } from 'zustand';

/**
 * @file useAppStore.js
 * @description Gestor de Estado Global para la Aplicación UniWheels (Zustand)
 * Gestiona autenticación, rol activo (pasajero/conductor), ciclo de vida de viajes activos,
 * viajes publicados, viajes recurrentes, alertas proactivas Smart Match IA, saldo y navegación.
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

  // --- TEMA VISUAL DE LA APLICACIÓN (Light / Dark) ---
  theme: (() => {
    try {
      return localStorage.getItem('uniwheels_app_theme') || 'light';
    } catch {
      return 'light';
    }
  })(),
  toggleTheme: () =>
    set((state) => {
      const nuevoTema = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('uniwheels_app_theme', nuevoTema);
      } catch {}
      return { theme: nuevoTema };
    }),
  setTheme: (nuevoTema) => {
    try {
      localStorage.setItem('uniwheels_app_theme', nuevoTema);
    } catch {}
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
  savedHomeLocation: (() => {
    try {
      const stored = localStorage.getItem('uniwheels_home_location');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  setSavedHomeLocation: (location) => {
    try {
      localStorage.setItem('uniwheels_home_location', JSON.stringify(location));
    } catch {}
    set({ savedHomeLocation: location });
  },

  // --- NAVEGACIÓN Y PESTAÑAS ---
  // Pestañas disponibles: 'home' | 'map' | 'driver' | 'history' | 'trips' | 'wallet' | 'profile'
  activeTab: 'home',
  setActiveTab: (pestaña) => set({ activeTab: pestaña }),

  // Ruta seleccionada desde la búsqueda para visualizar en el mapa
  selectedSearchRoute: null,
  setSelectedSearchRoute: (route) => set({ selectedSearchRoute: route, activeTab: 'map' }),
  clearSelectedSearchRoute: () => set({ selectedSearchRoute: null }),

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
        activeTab: 'home',
      };
    }),

  // --- VIAJE ACTIVO DEL CONDUCTOR ---
  activeDriverTrip: null,

  // Trips reales (trip-service) de pasajeros confirmados en la ruta activa del
  // conductor — poblado por DriverCockpitCard consultando el backend real.
  currentRoutePassengerTrips: [],
  setCurrentRoutePassengerTrips: (trips) => set({ currentRoutePassengerTrips: trips || [] }),

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

  // Iniciar viaje de pasajero (tras validar PIN de abordaje)
  startPassengerTrip: () => {
    set((state) => ({
      activePassengerBooking: state.activePassengerBooking
        ? {
            ...state.activePassengerBooking,
            status: 'in_progress',
            isStarted: true,
            startedAt: new Date().toISOString(),
          }
        : null,
    }));
  },

  // Finalizar viaje de pasajero
  completePassengerTrip: () => {
    set((state) => ({
      activePassengerBooking: state.activePassengerBooking
        ? {
            ...state.activePassengerBooking,
            status: 'completed',
            isStarted: false,
            completedAt: new Date().toISOString(),
          }
        : null,
    }));
  },

  // --- VIAJES PUBLICADOS DEL CONDUCTOR ---
  publishedDriverTrips: [
    {
      id: 'pub_101',
      date: new Date().toISOString().split('T')[0],
      departure_time: '06:45 AM',
      direction: 'hacia_campus',
      origin: 'Centro Comercial Cañaveral, Floridablanca',
      destination: 'Campus El Jardín',
      meeting_point: null,
      available_seats: 2,
      total_seats: 4,
      fare_cop: 4500,
      status: 'publicado', // 'publicado' | 'en_curso' | 'cancelado'
      passengers: [
        { id: 'p_1', name: 'Laura Mantilla', program: 'Medicina', pickup: 'Lagos II', pin: '8214' },
        { id: 'p_2', name: 'Felipe Santos', program: 'Derecho', pickup: 'La Isla', pin: '5192' },
      ],
    },
    {
      id: 'pub_102',
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })(),
      departure_time: '05:15 PM',
      direction: 'desde_campus',
      origin: 'Campus El Jardín',
      destination: 'Provenza - Estación Metrolínea',
      meeting_point: 'Portería Principal Calle 48',
      available_seats: 3,
      total_seats: 3,
      fare_cop: 4000,
      status: 'publicado',
      passengers: [],
    },
  ],

  // Reemplaza la lista completa de viajes publicados con datos reales del backend.
  setPublishedDriverTrips: (trips) => set({ publishedDriverTrips: trips || [] }),

  // Cancelar viaje publicado
  cancelPublishedTrip: (tripId) => {
    set((state) => ({
      publishedDriverTrips: state.publishedDriverTrips.map((t) =>
        t.id === tripId ? { ...t, status: 'cancelado' } : t
      ),
    }));
  },

  // Iniciar viaje publicado (lo pasa a cabina activa)
  startPublishedTrip: (tripId) => {
    const trip = get().publishedDriverTrips.find((t) => t.id === tripId);
    if (!trip) return;
    set({
      activeDriverTrip: {
        ...trip,
        status: 'active',
        passengers: trip.passengers || [],
        availableSeats: trip.available_seats,
      },
      activeTab: 'home',
    });
  },

  // --- PLANTILLAS DE VIAJES RECURRENTES DEL CONDUCTOR ---
  recurringDriverTrips: [
    {
      id: 'rec_d1',
      title: 'Ruta Matutina a Clases',
      days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
      direction: 'hacia_campus',
      departure_time: '06:30 AM',
      origin: 'Cañaveral - C.C. Parque Caracolí',
      destination: 'Campus El Jardín',
      seats: 3,
      fare_cop: 4500,
      isActive: true,
      autoPublishHoursBefore: 12,
    },
    {
      id: 'rec_d2',
      title: 'Retorno de la Tarde',
      days: ['Lun', 'Mié', 'Vie'],
      direction: 'desde_campus',
      departure_time: '05:30 PM',
      origin: 'Campus El Jardín',
      destination: 'Floridablanca - Cañaveral',
      meeting_point: 'Portería Principal Calle 48',
      seats: 4,
      fare_cop: 4000,
      isActive: true,
      autoPublishHoursBefore: 8,
    },
  ],

  toggleRecurringDriverTrip: (templateId) => {
    set((state) => ({
      recurringDriverTrips: state.recurringDriverTrips.map((t) =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      ),
    }));
  },

  addRecurringDriverTrip: (nuevoTemplate) => {
    set((state) => ({
      recurringDriverTrips: [
        {
          id: 'rec_d_' + Date.now(),
          isActive: true,
          ...nuevoTemplate,
        },
        ...state.recurringDriverTrips,
      ],
    }));
  },

  deleteRecurringDriverTrip: (templateId) => {
    set((state) => ({
      recurringDriverTrips: state.recurringDriverTrips.filter((t) => t.id !== templateId),
    }));
  },

  // --- ALERTAS DE TRAYECTOS RECURRENTES DEL PASAJERO (SMART MATCH ALERTS) ---
  recurringPassengerAlerts: [
    {
      id: 'alert_p1',
      title: 'Clases 7:00 AM El Jardín',
      days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
      direction: 'towards',
      target_time: '06:55 AM',
      origin: 'Provenza - Cra 27 #105',
      destination: 'Campus El Jardín',
      max_fare_cop: 5000,
      isActive: true,
    },
    {
      id: 'alert_p2',
      title: 'Salida de Talleres 6:00 PM',
      days: ['Mar', 'Jue'],
      direction: 'from',
      target_time: '06:15 PM',
      origin: 'Campus El Bosque',
      destination: 'Cabecera - Parque San Pío',
      max_fare_cop: 4500,
      isActive: true,
    },
  ],

  togglePassengerAlert: (alertId) => {
    set((state) => ({
      recurringPassengerAlerts: state.recurringPassengerAlerts.map((a) =>
        a.id === alertId ? { ...a, isActive: !a.isActive } : a
      ),
    }));
  },

  addPassengerAlert: (nuevaAlerta) => {
    set((state) => ({
      recurringPassengerAlerts: [
        {
          id: 'alert_p_' + Date.now(),
          isActive: true,
          ...nuevaAlerta,
        },
        ...state.recurringPassengerAlerts,
      ],
    }));
  },

  deletePassengerAlert: (alertId) => {
    set((state) => ({
      recurringPassengerAlerts: state.recurringPassengerAlerts.filter((a) => a.id !== alertId),
    }));
  },

  // --- NOTIFICACIONES PROACTIVAS SMART MATCH IA EN TIEMPO REAL ---
  smartMatchAlerts: [
    {
      id: 'smart_match_101',
      driver_name: 'Carlos Mendoza',
      vehicle: 'Mazda 3 (Rojo)',
      plate: 'KLU-492',
      rating: 4.95,
      direction: 'towards',
      origin: 'Cañaveral - C.C. Cañaveral',
      destination: 'Campus El Jardín',
      scheduled_date: new Date().toISOString().split('T')[0],
      is_recurring: true,
      driver_days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      departure_time: '06:30 AM',
      arrival_time: '06:55 AM',
      available_seats: 2,
      driver_avatar_initials: 'CM',
      driver_avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      
      // Asesoría del Motor de IA (ALNS + OSRM + TomTom)
      ai_advisory: 'Caminar 80m al punto de encuentro ahorra $500 COP y reduce 3 min el tiempo total de viaje.',
      
      // Opción 1: Punto de Encuentro (Virtual Bus Stop)
      meeting_point_name: 'Bahía Cra 27 con Calle 105 (Provenza)',
      walking_distance_meters: 80,
      walking_time_minutes: 1,
      meeting_point_fare_cop: 4000,
      meeting_point_fare: '$ 4.000',
      
      // Opción 2: Recogida a Domicilio / Puerta a Puerta
      is_door_pickup_eligible: true,
      door_pickup_address: 'Provenza - Cra 27 #105-20',
      door_pickup_fare_cop: 4500,
      door_pickup_fare: '$ 4.500',
      additional_detour_minutes: 2,
      
      timestamp: 'Detectado hace 3 min',
      isRead: false,
    },
  ],

  dismissSmartMatchAlert: (matchId) => {
    set((state) => ({
      smartMatchAlerts: state.smartMatchAlerts.filter((m) => m.id !== matchId),
    }));
  },

  acceptSmartMatchAlert: (matchId, selectedModality = 'meeting_point') => {
    const match = get().smartMatchAlerts.find((m) => m.id === matchId);
    if (!match) return;

    const isMeetingPoint = selectedModality === 'meeting_point';
    const finalFare = isMeetingPoint ? match.meeting_point_fare : match.door_pickup_fare;
    const finalFareCop = isMeetingPoint ? match.meeting_point_fare_cop : match.door_pickup_fare_cop;
    const finalPickup = isMeetingPoint
      ? `${match.meeting_point_name} (a ${match.walking_distance_meters}m de ti)`
      : match.door_pickup_address || match.origin;

    get().bookPassengerTrip({
      driverName: match.driver_name,
      vehicle: match.vehicle,
      plate: match.plate,
      origin: match.origin,
      destination: match.destination,
      pickup: finalPickup,
      departureTime: match.departure_time,
      arrivalTime: match.arrival_time,
      fare: finalFare,
      farePaid: finalFareCop,
      date: match.scheduled_date,
      modality: selectedModality,
    });

    get().dismissSmartMatchAlert(matchId);
  },

  // --- BILLETERA PREPAGO Y MÉTODOS DE PAGO ---
  driverWalletBalance: 25000,
  passengerWalletBalance: 18500,
  savedCards: [
    {
      id: 'card-1',
      brand: 'visa',
      last4: '4829',
      expMonth: '09',
      expYear: '28',
      holderName: 'Santiago Serrano',
      bank: 'Bancolombia',
      isDefault: true,
      color: 'from-blue-600 to-indigo-900',
    },
    {
      id: 'card-2',
      brand: 'mastercard',
      last4: '9012',
      expMonth: '11',
      expYear: '27',
      holderName: 'Santiago Serrano',
      bank: 'Nu Colombia',
      isDefault: false,
      color: 'from-purple-600 to-slate-900',
    },
  ],
  linkedNequi: '315 892 4410',
  pendingOpenPaymentManagerModal: false,

  setPendingOpenPaymentManagerModal: (val) => set({ pendingOpenPaymentManagerModal: val }),

  openPaymentSettings: () => {
    set({
      activeTab: 'profile',
      pendingOpenPaymentManagerModal: true,
    });
  },

  addCard: (nuevaTarjeta) => {
    set((state) => ({
      savedCards: [
        ...state.savedCards.map((c) => (nuevaTarjeta.isDefault ? { ...c, isDefault: false } : c)),
        {
          id: 'card-' + Date.now(),
          ...nuevaTarjeta,
        },
      ],
    }));
  },

  deleteCard: (cardId) => {
    set((state) => ({
      savedCards: state.savedCards.filter((c) => c.id !== cardId),
    }));
  },

  setDefaultCard: (cardId) => {
    set((state) => ({
      savedCards: state.savedCards.map((c) => ({
        ...c,
        isDefault: c.id === cardId,
      })),
    }));
  },

  // Publicar un nuevo viaje de conductor
  publishDriverTrip: (datosTrayecto) => {
    const nuevoViaje = {
      id: 'trip_' + Date.now(),
      createdAt: new Date().toISOString(),
      date: datosTrayecto.departure_date || new Date().toISOString().split('T')[0],
      departure_time: datosTrayecto.departure_time || '06:45 AM',
      direction: datosTrayecto.direction || 'hacia_campus',
      origin: datosTrayecto.origin,
      destination: datosTrayecto.destination,
      meeting_point: datosTrayecto.meeting_point,
      available_seats: datosTrayecto.available_seats || 3,
      total_seats: datosTrayecto.available_seats || 3,
      fare_cop: datosTrayecto.fare_cop || 4500,
      status: 'publicado',
      passengers: [],
      ...datosTrayecto,
    };

    set((state) => ({
      publishedDriverTrips: [nuevoViaje, ...state.publishedDriverTrips],
      activeTab: 'history', // Llevar al conductor a la vista de viajes publicados
    }));

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
      currentRoutePassengerTrips: [],
      driverWalletBalance: nuevoSaldo,
    });
  },

  // Cerrar la ruta activa del conductor tras completarla exitosamente (sin penalización).
  finishActiveDriverTrip: () => {
    set({
      activeDriverTrip: null,
      currentRoutePassengerTrips: [],
    });
  },

  // Recargar Billetera del Conductor
  rechargeDriverWallet: (monto) => {
    set((state) => ({
      driverWalletBalance: state.driverWalletBalance + Number(monto),
    }));
  },

  // Sincronizar el saldo local con el saldo real de auth-service (wallet.balance_cop)
  setDriverWalletBalance: (saldoReal) => {
    set({ driverWalletBalance: Number(saldoReal) });
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
      const driverStatus = estaAprobado ? 'approved' : 'pending';
      const usuarioActualizado = {
        ...state.user,
        isDriver: estaAprobado,
        driverStatus: driverStatus,
        driverApplication: {
          ...datosConductor,
          submittedAt: new Date().toISOString(),
        },
        driverInfo: datosConductor,
        role: estaAprobado ? 'driver' : (state.user.role || 'passenger'),
      };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(usuarioActualizado));
      } catch {}
      return {
        user: usuarioActualizado,
        activeRole: estaAprobado ? 'driver' : (state.activeRole || 'passenger'),
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
