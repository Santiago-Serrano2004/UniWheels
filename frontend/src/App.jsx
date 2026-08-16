import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { SplashScreen } from './components/common/SplashScreen';
import { AuthGatewayView } from './components/auth/AuthGatewayView';
import { InstitutionalWelcomeModal } from './components/common/InstitutionalWelcomeModal';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeView } from './components/home/HomeView';
import { TripMapView } from './components/map/TripMapView';
import { DriverView } from './components/driver/DriverView';
import { DriverOnboardingView } from './components/driver/DriverOnboardingView';
import { WalletView } from './components/wallet/WalletView';
import { ProfileView } from './components/profile/ProfileView';
import { RotateCcw, Smartphone, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, isAuthenticated, activeTab, setActiveTab, logout, showWelcomeMascot, closeWelcomeMascot } = useAppStore();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'map':
        return <TripMapView />;
      case 'driver':
        return user?.isDriver ? (
          <DriverView />
        ) : (
          <DriverOnboardingView onBack={() => setActiveTab('home')} />
        );
      case 'wallet':
        return <WalletView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-6 selection:bg-lochmara-500 selection:text-white">
      {/* Controles flotantes de desarrollo en Desktop */}
      <div className="hidden sm:flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full backdrop-blur-md">
          <Smartphone className="w-3.5 h-3.5 text-lochmara-400" />
          <span>Vista Móvil (390 x 844)</span>
        </div>

        {isAuthenticated && (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
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
      <div className="relative w-full sm:max-w-[392px] h-[100dvh] sm:h-[844px] bg-slate-50 text-slate-900 sm:rounded-[44px] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col justify-between">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
