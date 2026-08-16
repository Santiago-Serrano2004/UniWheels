import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService } from '../../services/api';
import { ReputationStatsModal } from './ReputationStatsModal';
import {
  User,
  ShieldCheck,
  Mail,
  BookOpen,
  FileText,
  Lock,
  LogOut,
  ChevronRight,
  Car,
  Star,
} from 'lucide-react';

export const ProfileView = () => {
  const { user, logout, setActiveTab } = useAppStore();
  const isDriverVerified = Boolean(user?.isDriver);

  const [modalReputacionAbierto, setModalReputacionAbierto] = useState(false);
  const [estadisticasData, setEstadisticasData] = useState(null);

  const institutionLabel = user?.institution?.code || user?.institution || 'Universitaria';

  useEffect(() => {
    tripsService.getUserReputationStats().then((data) => {
      if (data) {
        setEstadisticasData(data);
      }
    });
  }, []);

  const menuOptions = [
    {
      id: 'reputation',
      title: 'Reputación y Calificaciones',
      subtitle: 'Puntaje promedio y variables evaluadas por la comunidad',
      icon: Star,
      iconBg: 'bg-amber-100 text-amber-700',
      action: () => setModalReputacionAbierto(true),
    },
    ...(isDriverVerified
      ? [
          {
            id: 'docs',
            title: 'Documentos Vehiculares (SOAT / Tecno)',
            subtitle: 'Verificados bajo Ley 1581',
            icon: FileText,
            iconBg: 'bg-slate-100 text-slate-700',
          },
        ]
      : []),
    {
      id: 'privacy',
      title: 'Privacidad y Habeas Data',
      subtitle: 'Descargas firmadas temporalmente',
      icon: Lock,
      iconBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'rules',
      title: `Reglas de Convivencia ${institutionLabel}`,
      subtitle: 'Protocolo de seguridad universitaria',
      icon: ShieldCheck,
      iconBg: 'bg-slate-100 text-slate-700',
    },
  ];

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. TARJETA DE IDENTIDAD UNIVERSITARIA */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs text-center relative overflow-hidden space-y-3">
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-lochmara-600 to-lochmara-400 p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden font-extrabold text-lochmara-800 text-2xl">
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
          <h2 className="text-base font-extrabold text-slate-900">{user?.name || 'Santiago Serrano'}</h2>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-0.5">
            <Mail className="w-3 h-3 text-lochmara-500" />
            <span>{user?.email || 'sserrano28@unab.edu.co'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lochmara-50 border border-lochmara-200 text-lochmara-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Código: {user?.studentCode || 'U00123456'}</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span>{isDriverVerified ? 'Conductor Verificado' : 'Pasajero Institucional'}</span>
          </div>
        </div>
      </section>

      {/* 2. REGISTRO DE CONDUCTOR SI ES SOLO PASAJERO */}
      {!isDriverVerified && (
        <section
          onClick={() => setActiveTab('driver')}
          className="bg-lochmara-50/80 hover:bg-lochmara-100 border border-lochmara-200/80 rounded-3xl p-4 shadow-2xs transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center shadow-md shadow-lochmara-600/20 group-hover:scale-105 transition-transform shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">¿Tienes vehículo propio?</p>
                <p className="text-[11px] text-slate-600">
                  Regístrate como conductor para compartir tus gastos de transporte
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-lochmara-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </section>
      )}

      {/* 3. MENÚ DE CONFIGURACIÓN Y ESTADÍSTICAS */}
      <section className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {menuOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.action || undefined}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${option.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{option.title}</p>
                  <p className="text-[10px] text-slate-500">{option.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </section>

      {/* 4. BOTÓN DE CERRAR SESIÓN */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>

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
