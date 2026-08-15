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

  // Tab activo de navegacion movil: 'home' | 'map' | 'driver' | 'wallet' | 'profile'
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Rol activo (Alternancia entre Pasajero y Conductor)
  activeRole: initialUser?.role || 'passenger',
  toggleRole: () =>
    set((state) => {
      const newRole = state.activeRole === 'passenger' ? 'driver' : 'passenger';
      if (state.user) {
        const updatedUser = { ...state.user, role: newRole };
        try {
          localStorage.setItem('uniwheels_session', JSON.stringify(updatedUser));
        } catch {}
        return { activeRole: newRole, user: updatedUser };
      }
      return { activeRole: newRole };
    }),

  // Iniciar Sesion y persistir en el dispositivo
  login: (userData) => {
    const userToSave = userData || {
      id: 'u1',
      name: 'Santiago Serrano',
      email: 'sserrano@unab.edu.co',
      studentCode: 'U00123456',
      role: 'passenger',
      campus: 'Campus El Jardín',
      rating: 4.95,
      tripsCount: 28,
      walletBalance: 45000,
    };
    try {
      localStorage.setItem('uniwheels_session', JSON.stringify(userToSave));
    } catch {}
    set({
      isAuthenticated: true,
      user: userToSave,
    });
  },

  // Cerrar Sesion y limpiar persistencia
  logout: () => {
    try {
      localStorage.removeItem('uniwheels_session');
    } catch {}
    set({
      isAuthenticated: false,
      user: null,
      activeTab: 'home',
    });
  },
}));
