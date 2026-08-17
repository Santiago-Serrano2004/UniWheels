import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { SplashScreen } from './components/common/SplashScreen';
import { AuthGatewayView } from './components/auth/AuthGatewayView';
import { InstitutionalWelcomeModal } from './components/common/InstitutionalWelcomeModal';
import { DriverInviteModal } from './components/common/DriverInviteModal';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeView } from './components/home/HomeView';
import { TripMapView } from './components/map/TripMapView';
import { DriverView } from './components/driver/DriverView';
import { DriverOnboardingView } from './components/driver/DriverOnboardingView';
import { WalletView } from './components/wallet/WalletView';
import { ProfileView } from './components/profile/ProfileView';
import { PassengerTripsView } from './components/trips/PassengerTripsView';
import { DriverHistoryView } from './components/driver/DriverHistoryView';
import { ActiveRoleConflictBlocker } from './components/common/ActiveRoleConflictBlocker';
import { LiveTripIslandWidget } from './components/common/LiveTripIslandWidget';
import { RotateCcw, Smartphone, LogOut, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const {
    user,
    isAuthenticated,
    activeTab,
    setActiveTab,
    activeRole,
    toggleRole,
    activeDriverTrip,
    activePassengerBooking,
    logout,
    showWelcomeMascot,
    closeWelcomeMascot,
    showDriverInviteModal,
    closeDriverInviteModal,
    theme,
    toggleTheme,
  } = useAppStore();

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const renderActiveView = () => {
    // 1. La pestaña de Perfil SIEMPRE es accesible independientemente del rol o estado
    if (activeTab === 'profile') {
      return <ProfileView />;
    }

    // 2. Validación de conflicto: Si tiene viaje activo como conductor e intenta interactuar como pasajero
    if (activeRole === 'passenger' && activeDriverTrip) {
      return (
        <ActiveRoleConflictBlocker
          conflictType="driver_active"
          activeTrip={activeDriverTrip}
          onRedirect={() => {
            toggleRole();
            setActiveTab('home');
          }}
        />
      );
    }

    // 3. Validación de conflicto: Si tiene reserva activa como pasajero e intenta operar como conductor
    if (activeRole === 'driver' && activePassengerBooking) {
      return (
        <ActiveRoleConflictBlocker
          conflictType="passenger_active"
          activeTrip={activePassengerBooking}
          onRedirect={() => {
            toggleRole();
            setActiveTab('history');
          }}
        />
      );
    }

    // 4. Vistas estándar según activeTab
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'map':
        return <TripMapView />;
      case 'history':
      case 'trips':
        return activeRole === 'driver' ? <DriverHistoryView /> : <PassengerTripsView />;
      case 'driver':
        return user?.isDriver ? (
          <DriverView />
        ) : (
          <DriverOnboardingView onBack={() => setActiveTab('home')} />
        );
      case 'wallet':
        return <WalletView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center justify-center p-0 sm:p-6 selection:bg-lochmara-500 selection:text-white ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-200/70 text-slate-800'
      }`}
    >
      {/* Controles flotantes de desarrollo en Desktop / Web Wrapper */}
      <div className="hidden sm:flex items-center gap-2.5 mb-3 select-none">
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full backdrop-blur-md border transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 bg-slate-900/90 border-slate-800'
              : 'text-slate-600 bg-white/90 border-slate-300 shadow-2xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-lochmara-500" />
          <span>Vista Móvil (390 x 844)</span>
        </div>

        {/* Alternador Global de Tema de la App (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer shadow-xs ${
            theme === 'dark'
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          }`}
          title="Alternar entre modo Claro y Oscuro de UniWheels"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Tema Oscuro</span>
            </>
          )}
        </button>

        {isAuthenticated && (
          <button
            onClick={logout}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <LogOut className="w-3 h-3" />
            <span>Cerrar Sesión</span>
          </button>
        )}

        <button
          onClick={() => setShowSplash(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white transition-all cursor-pointer shadow-md shadow-lochmara-600/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar Splash</span>
        </button>
      </div>

      {/* Marco de Smartphone Móvil */}
      <div
        data-theme={theme}
        className={`relative w-full sm:max-w-[392px] h-[100dvh] sm:h-[844px] transition-all overflow-hidden flex flex-col justify-between sm:rounded-[44px] sm:border-[8px] ${
          theme === 'dark'
            ? 'dark bg-slate-950 text-slate-100 sm:border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]'
            : 'bg-slate-100 text-slate-900 sm:border-slate-800 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)]'
        }`}
      >
        {/* Dynamic Island simulada en Desktop */}
        <div className="hidden sm:flex absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-24 h-4 bg-black rounded-full items-center justify-end px-2.5">
          <div className="w-2 h-2 rounded-full bg-[#0a192f] border border-slate-800" />
        </div>

        {/* 1. Splash Screen Animada con Salida hacia la Derecha */}
        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} durationMs={3600} />
        )}

        {/* 2. Transición Fluida hacia Auth Gateway o App Principal */}
        <AnimatePresence mode="wait">
          {!showSplash && !isAuthenticated && (
            <motion.div
              key="auth-gateway"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center overflow-hidden"
            >
              <AuthGatewayView />
            </motion.div>
          )}

          {!showSplash && isAuthenticated && (
            <motion.div
              key="main-app"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between overflow-hidden relative"
            >
              {/* Encabezado Móvil */}
              <Header />

              {/* Isla Dinámica / Live Activity de Viaje Activo */}
              <LiveTripIslandWidget />

              {/* Contenido Principal */}
              <main className="flex-1 overflow-y-auto px-4 py-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderActiveView()}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Barra de Navegación Inferior */}
              <BottomNav />

              {/* Modal de Bienvenida con Mascota Institucional (Post-Login / Registro) */}
              <InstitutionalWelcomeModal
                isOpen={showWelcomeMascot}
                onClose={closeWelcomeMascot}
              />

              {/* Modal de Invitación a Conductor Centrado en Pantalla */}
              <DriverInviteModal
                isOpen={showDriverInviteModal}
                onClose={closeDriverInviteModal}
                onRegister={() => {
                  closeDriverInviteModal();
                  setActiveTab('driver');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
