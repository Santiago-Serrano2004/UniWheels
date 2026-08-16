import { create } from 'zustand';

// Recuperar sesion previa almacenada localmente en el dispositivo
const getStoredUser = () => {
  try {
    const data = localStorage.getItem('uniwheels_session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAppStore = create((set) => ({
  // Estado de Autenticacion persistente
  isAuthenticated: !!initialUser,
  user: initialUser,

  // Control de Modal de Mascota Institucional de Bienvenida
  showWelcomeMascot: false,
  closeWelcomeMascot: () => set({ showWelcomeMascot: false }),
  openWelcomeMascot: () => set({ showWelcomeMascot: true }),

  // Tab activo de navegacion movil: 'home' | 'map' | 'driver' | 'wallet' | 'profile'
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Rol activo (Solo alternable si el usuario es conductor verificado)
  activeRole: initialUser?.isDriver ? initialUser?.role || 'passenger' : 'passenger',
  toggleRole: () =>
    set((state) => {
      // Si el usuario no es conductor aprobado, no puede alternar
      if (!state.user?.isDriver) {
        return { activeRole: 'passenger' };
      }
      const newRole = state.activeRole === 'passenger' ? 'driver' : 'passenger';
      const updatedUser = { ...state.user, role: newRole };
      try {
        localStorage.setItem('uniwheels_session', JSON.stringify(updatedUser));
      } catch {}
      return { activeRole: newRole, user: updatedUser };
    }),

  // Iniciar Sesion y persistir en el dispositivo (por defecto estrictamente Pasajero)
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
      walletBalance: 0,
    };

    // Asegurar que si isDriver es falso, el rol sea estrictamente passenger
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

  // Actualizar estado de conductor del usuario
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
      };
    }),

  // Cerrar Sesion y limpiar persistencia
  logout: () => {
    try {
      localStorage.removeItem('uniwheels_session');
    } catch {}
    set({
      isAuthenticated: false,
      user: null,
      activeTab: 'home',
      activeRole: 'passenger',
      showWelcomeMascot: false,
    });
  },
}));
