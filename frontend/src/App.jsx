import React, { useState, useEffect } from 'react';
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
    showWelcomeMascot,
    closeWelcomeMascot,
    showDriverInviteModal,
    closeDriverInviteModal,
    theme,
  } = useAppStore();

  useEffect(() => {
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
      data-theme={theme}
      className={`min-h-[100dvh] w-full max-w-lg mx-auto flex flex-col justify-between overflow-hidden relative transition-colors duration-200 ${
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Splash Screen Animada */}
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
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

            {/* Modal de Invitación a Conductor */}
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
  );
}
