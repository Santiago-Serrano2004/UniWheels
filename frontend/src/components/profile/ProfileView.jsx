import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService, authService } from '../../services/api';
import { ReputationStatsModal } from './ReputationStatsModal';
import { PaymentMethodsManagerModal } from './PaymentMethodsManagerModal';
import {
  ShieldCheck,
  Award,
  CreditCard,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  GraduationCap,
  Car,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Loader2,
  Star,
  FileText,
  Lock,
  Mail,
  X,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileView = () => {
  const { user, logout, setActiveTab, savedCards, theme } = useAppStore();
  const isDark = theme === 'dark';
  const isDriverVerified = Boolean(user?.isDriver);

  const [modalReputacionAbierto, setModalReputacionAbierto] = useState(false);
  const [modalPagosAbierto, setModalPagosAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [estadisticasData, setEstadisticasData] = useState(null);

  const institutionLabel = user?.institution?.code || user?.institution || 'Universitaria';

  useEffect(() => {
    tripsService.getUserReputationStats().then((data) => {
      if (data) {
        setEstadisticasData(data);
      }
    });
  }, []);

  const confirmarEliminarCuenta = async () => {
    setEliminandoCuenta(true);
    try {
      await authService.deleteAccount(user?.email);
    } catch (err) {
      console.warn('Error al procesar eliminación en backend:', err);
    } finally {
      setEliminandoCuenta(false);
      setModalEliminarAbierto(false);
      logout();
    }
  };

  const menuOptions = [
    {
      id: 'payments',
      title: 'Métodos de Pago y Tarjetas',
      subtitle: `${savedCards.length} tarjeta(s) guardada(s) • Nequi`,
      icon: CreditCard,
      iconBg: isDark ? 'bg-slate-800 text-lochmara-400 border border-slate-700' : 'bg-lochmara-50 text-lochmara-700 border border-lochmara-200',
      action: () => setModalPagosAbierto(true),
    },
    {
      id: 'reputation',
      title: 'Reputación y Calificaciones',
      subtitle: 'Puntaje promedio y variables evaluadas por la comunidad',
      icon: Star,
      iconBg: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200',
      action: () => setModalReputacionAbierto(true),
    },
    ...(isDriverVerified
      ? [
          {
            id: 'docs',
            title: 'Documentos Vehiculares (SOAT / Tecno)',
            subtitle: 'Verificados bajo Ley 1581',
            icon: FileText,
            iconBg: isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200',
          },
        ]
      : []),
    {
      id: 'privacy',
      title: 'Privacidad y Habeas Data',
      subtitle: 'Descargas firmadas temporalmente',
      icon: Lock,
      iconBg: isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    {
      id: 'rules',
      title: `Reglas de Convivencia ${institutionLabel}`,
      subtitle: 'Protocolo de seguridad universitaria',
      icon: ShieldCheck,
      iconBg: isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200',
    },
  ];

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. TARJETA DE IDENTIDAD UNIVERSITARIA */}
      <section
        className={`rounded-3xl p-5 border text-center relative overflow-hidden space-y-3 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-full bg-lochmara-600 p-1 shadow-md">
            <div
              className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden font-extrabold text-2xl ${
                isDark ? 'bg-slate-950 text-lochmara-300' : 'bg-white text-lochmara-800'
              }`}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : user?.name ? (
                user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
              ) : (
                'UN'
              )}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'Santiago Serrano'}</h2>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-0.5">
            <Mail className="w-3 h-3 text-lochmara-500" />
            <span>{user?.email || 'sserrano28@unab.edu.co'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-lochmara-300'
                : 'bg-lochmara-50 border-lochmara-200 text-lochmara-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Código: {user?.studentCode || 'U00123456'}</span>
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span>{isDriverVerified ? 'Conductor Verificado' : 'Pasajero Institucional'}</span>
          </div>
        </div>
      </section>

      {/* 2. REGISTRO DE CONDUCTOR SI ES SOLO PASAJERO */}
      {!isDriverVerified && (
        <section
          onClick={() => setActiveTab('driver')}
          className={`border rounded-3xl p-4 shadow-sm transition-all cursor-pointer text-left group ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white'
              : 'bg-lochmara-50 hover:bg-lochmara-100 border-lochmara-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center shadow-md shadow-lochmara-600/20 group-hover:scale-105 transition-transform shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>¿Tienes vehículo propio?</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Regístrate como conductor para compartir tus gastos de transporte
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-lochmara-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </section>
      )}

      {/* 3. MENÚ DE CONFIGURACIÓN Y ESTADÍSTICAS */}
      <section
        className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 divide-slate-800 text-white shadow-md'
            : 'bg-white border-slate-200 divide-slate-100 text-slate-900 shadow-sm'
        }`}
      >
        {menuOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.action}
              className={`w-full p-3.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${option.iconBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{option.title}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{option.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </section>

      {/* 4. ACCIONES DE SESIÓN Y CUENTA */}
      <div className="space-y-2 pt-1">
        {/* BOTÓN DE CERRAR SESIÓN */}
        <button
          onClick={logout}
          className={`w-full py-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Cerrar Sesión</span>
        </button>

        {/* BOTÓN DE ELIMINAR CUENTA */}
        <button
          onClick={() => setModalEliminarAbierto(true)}
          className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Cuenta</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CUENTA */}
      <AnimatePresence>
        {modalEliminarAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  onClick={() => setModalEliminarAbierto(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-rose-500">¿Deseas eliminar tu cuenta?</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Esta acción desactivará tu perfil, tus estadísticas de viaje y tus métodos de pago bajo el cumplimiento de la Ley 1581 (Habeas Data).
                </p>
              </div>

              <div
                className={`p-3 rounded-2xl border text-xs space-y-1 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <p className="font-semibold text-slate-700 dark:text-slate-300">📧 Te enviaremos un correo de despedida:</p>
                <p className="text-[11px] font-mono text-lochmara-600 dark:text-lochmara-400">{user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={eliminandoCuenta}
                  onClick={() => setModalEliminarAbierto(false)}
                  className={`py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={eliminandoCuenta}
                  onClick={confirmarEliminarCuenta}
                  className="py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {eliminandoCuenta ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <span>Sí, Eliminar</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE MÉTODOS DE PAGO Y TARJETAS */}
      <PaymentMethodsManagerModal
        isOpen={modalPagosAbierto}
        onClose={() => setModalPagosAbierto(false)}
      />

      {/* MODAL DE REPUTACIÓN Y DESEMPEÑO BAJO DEMANDA */}
      <ReputationStatsModal
        isOpen={modalReputacionAbierto}
        onClose={() => setModalReputacionAbierto(false)}
        isDriverVerified={isDriverVerified}
        estadisticasData={estadisticasData}
      />
    </div>
  );
};
