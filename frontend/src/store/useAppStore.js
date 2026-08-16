import { create } from 'zustand';

// Recuperar sesión previa almacenada localmente en el dispositivo
const getStoredUser = () => {
  try {
    const data = localStorage.getItem('uniwheels_session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAppStore = create((set, get) => ({
  // Estado de Autenticación persistente
  isAuthenticated: !!initialUser,
  user: initialUser,

  // Control de Modal de Mascota Institucional de Bienvenida
  showWelcomeMascot: false,
  closeWelcomeMascot: () => set({ showWelcomeMascot: false }),
  openWelcomeMascot: () => set({ showWelcomeMascot: true }),

  // Tab activo de navegación: 'home' | 'map' | 'driver' | 'wallet' | 'profile' | 'trips'
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Rol activo (Solo alternable si el usuario es conductor verificado)
  activeRole: initialUser?.isDriver ? initialUser?.role || 'passenger' : 'passenger',
  toggleRole: () =>
    set((state) => {
      if (!state.user?.isDriver) {
        return { activeRole: 'passenger' };
      }
      const newRole = state.activeRole === 'passenger' ? 'driver' : 'passenger';
      const updatedUser = { ...state.user, role: newRole };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(updatedUser));
      } catch {}
      return {
        activeRole: newRole,
        user: updatedUser,
        activeTab: 'home', // Al alternar rol, regresar a la pestaña de inicio correspondiente
      };
    }),

  // Estado del Viaje Activo del Conductor (null si no hay viaje publicado)
  activeDriverTrip: null,

  // Saldo de Billetera del Conductor (Mínimo requerido para publicar: $ 2.000 COP)
  driverWalletBalance: 25000,

  // Publicar un nuevo viaje
  publishDriverTrip: (tripData) => {
    const newTrip = {
      id: 'trip_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'active',
      passengers: [], // Lista de pasajeros confirmados
      ...tripData,
    };
    set({
      activeDriverTrip: newTrip,
      activeTab: 'home', // Llevar al conductor a su panel principal de viaje activo
    });
    return newTrip;
  },

  // Cancelar viaje del conductor
  cancelDriverTrip: (applyPenalty = false, penaltyAmount = 3000) => {
    const currentBalance = get().driverWalletBalance;
    const newBalance = applyPenalty ? Math.max(0, currentBalance - penaltyAmount) : currentBalance;

    set({
      activeDriverTrip: null,
      driverWalletBalance: newBalance,
    });
  },

  // Simular aceptación/adición de pasajero al viaje activo (para pruebas)
  addPassengerToActiveTrip: (passenger) => {
    const trip = get().activeDriverTrip;
    if (!trip) return;
    const updatedPassengers = [...(trip.passengers || []), passenger];
    set({
      activeDriverTrip: {
        ...trip,
        passengers: updatedPassengers,
        availableSeats: Math.max(0, (trip.seats || trip.availableSeats) - updatedPassengers.length),
      },
    });
  },

  // Recargar Billetera del Conductor
  rechargeDriverWallet: (amount) => {
    set((state) => ({
      driverWalletBalance: state.driverWalletBalance + Number(amount),
    }));
  },

  // Iniciar Sesión
  login: (userData) => {
    const userToSave = userData || {
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

    if (!userToSave.isDriver) {
      userToSave.role = 'passenger';
      userToSave.driverStatus = userToSave.driverStatus || 'unregistered';
    }

    try {
      localStorage.setItem('uniwheels_session', JSON.stringify(userToSave));
    } catch {}
    set({
      isAuthenticated: true,
      user: userToSave,
      activeRole: 'passenger',
      activeTab: 'home',
      showWelcomeMascot: true,
    });
  },

  // Actualizar estado de conductor
  updateDriverStatus: (status, driverData = {}) =>
    set((state) => {
      if (!state.user) return {};
      const isApproved = status === 'approved';
      const updatedUser = {
        ...state.user,
        isDriver: isApproved,
        driverStatus: status,
        driverInfo: driverData,
        role: isApproved ? 'driver' : 'passenger',
      };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(updatedUser));
      } catch {}
      return {
        user: updatedUser,
        activeRole: isApproved ? 'driver' : 'passenger',
        activeTab: isApproved ? 'driver' : 'home',
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
      showWelcomeMascot: false,
    });
  },
}));
