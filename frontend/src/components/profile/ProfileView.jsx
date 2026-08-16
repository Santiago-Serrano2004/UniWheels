import React from 'react';
import { useAppStore } from '../../store/useAppStore';
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
} from 'lucide-react';

export const ProfileView = () => {
  const { user, logout, setActiveTab } = useAppStore();

  const isDriverVerified = Boolean(user?.isDriver);

  const institutionLabel = user?.institution?.code || user?.institution || 'Universitaria';

  const menuOptions = isDriverVerified
    ? [
        { title: 'Documentos Vehiculares (SOAT / Tecno)', subtitle: 'Verificados bajo Ley 1581', icon: FileText },
        { title: 'Privacidad y Habeas Data', subtitle: 'Descargas firmadas temporalmente', icon: Lock },
        { title: `Reglas de Convivencia ${institutionLabel}`, subtitle: 'Protocolo de seguridad universitaria', icon: ShieldCheck },
      ]
    : [
        { title: 'Privacidad y Habeas Data', subtitle: 'Descargas firmadas temporalmente', icon: Lock },
        { title: `Reglas de Convivencia ${institutionLabel}`, subtitle: 'Protocolo de seguridad universitaria', icon: ShieldCheck },
      ];

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Tarjeta de Identidad Universitaria */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs text-center relative overflow-hidden space-y-3">
        <div className="w-18 h-18 rounded-full bg-lochmara-100 border-2 border-lochmara-300 text-lochmara-800 font-extrabold text-xl flex items-center justify-center mx-auto overflow-hidden shadow-xs">
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

        <div>
          <h2 className="text-base font-extrabold text-slate-900">{user?.name || 'Miembro de la Comunidad'}</h2>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-0.5">
            <Mail className="w-3 h-3 text-lochmara-500" />
            <span>{user?.email || 'usuario@universidad.edu.co'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lochmara-50 border border-lochmara-200 text-lochmara-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Código: {user?.studentCode || 'U00XXXXXX'}</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span>{isDriverVerified ? 'Conductor' : 'Pasajero'}</span>
          </div>
        </div>
      </section>

      {/* Apartado para Registrarse como Conductor si el usuario aún no lo es */}
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

      {/* Menú de Configuración */}
      <section className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {menuOptions.map((option, idx) => {
          const Icon = option.icon;
          return (
            <button
              key={idx}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{option.title}</p>
                  <p className="text-[10px] text-slate-500">{option.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </section>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
};
