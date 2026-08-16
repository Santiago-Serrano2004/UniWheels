import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService } from '../../services/api';
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
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileView = () => {
  const { user, logout, setActiveTab } = useAppStore();
  const isDriverVerified = Boolean(user?.isDriver);

  // Tab de estadísticas seleccionado en perfil: 'passenger' | 'driver'
  const [rolEstadisticas, setRolEstadisticas] = useState('passenger');
  const [estadisticasData, setEstadisticasData] = useState(null);

  const institutionLabel = user?.institution?.code || user?.institution || 'Universitaria';

  useEffect(() => {
    tripsService.getUserReputationStats().then((data) => {
      if (data) {
        setEstadisticasData(data);
      }
    });
  }, []);

  // Fallback defaults mientras carga
  const statsPasajero = estadisticasData?.passenger || {
    score: 4.9,
    total_ratings: 28,
    level: 'Pasajero Ejemplar',
    metrics: [
      { label: 'Puntualidad en el Abordaje', score_pct: 98, positive_count: 27 },
      { label: 'Amabilidad y Respeto', score_pct: 100, positive_count: 28 },
      { label: 'Pago Rápido y Exacto', score_pct: 96, positive_count: 26 },
      { label: 'Comunicación Clara', score_pct: 95, positive_count: 25 },
      { label: 'Excelente Compañero de Viaje', score_pct: 99, positive_count: 27 },
    ],
  };

  const statsConductor = estadisticasData?.driver || {
    score: 4.95,
    total_ratings: 42,
    level: 'Conductor Élite',
    metrics: [
      { label: 'Manejo Prudente y Seguro', score_pct: 99, positive_count: 41 },
      { label: 'Vehículo Limpio y Cómodo', score_pct: 98, positive_count: 40 },
      { label: 'Puntualidad en las Salidas', score_pct: 96, positive_count: 39 },
      { label: 'Ruta Eficiente y Directa', score_pct: 97, positive_count: 40 },
      { label: 'Excelente Música y Ambiente', score_pct: 95, positive_count: 38 },
    ],
  };

  const statsActuales = rolEstadisticas === 'driver' && isDriverVerified ? statsConductor : statsPasajero;

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
      {/* 1. TARJETA DE IDENTIDAD UNIVERSITARIA CON FOTO Y DATOS */}
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

      {/* 2. SECCIÓN DE REPUTACIÓN Y ESTADÍSTICAS DE CALIFICACIONES */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
        {/* Encabezado y Selector de Rol de Estadísticas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Reputación y Desempeño</h3>
              <p className="text-[10px] text-slate-400">Evaluaciones de la comunidad</p>
            </div>
          </div>

          {/* Selector de Rol si es Conductor */}
          {isDriverVerified && (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setRolEstadisticas('passenger')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  rolEstadisticas === 'passenger'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pasajero
              </button>
              <button
                type="button"
                onClick={() => setRolEstadisticas('driver')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  rolEstadisticas === 'driver'
                    ? 'bg-lochmara-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Conductor
              </button>
            </div>
          )}
        </div>

        {/* Tarjeta de Resumen de Puntuación */}
        <div className="bg-gradient-to-br from-slate-900 to-[#082f49] text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-lochmara-300">
              {rolEstadisticas === 'driver' && isDriverVerified
                ? 'Puntaje de Conductor'
                : 'Puntaje de Pasajero'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {statsActuales.score?.toFixed(2) || '5.00'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-300">
              Basado en <strong className="text-white">{statsActuales.total_ratings} calificaciones</strong> recibidas
            </p>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{statsActuales.level}</span>
            </div>
          </div>
        </div>

        {/* Gráfico Estético de Variables Evaluadas */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>Variables de Calificación</span>
            <span className="text-[10px] text-slate-400">Satisfacción</span>
          </div>

          <div className="space-y-2.5">
            {statsActuales.metrics.map((metrica, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800">{metrica.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({metrica.positive_count} votos)
                    </span>
                    <span className="font-extrabold text-lochmara-700">{metrica.score_pct}%</span>
                  </div>
                </div>

                {/* Barra de Progreso con Gradiente Suave */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrica.score_pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-lochmara-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. APARTADO PARA REGISTRARSE COMO CONDUCTOR SI AÚN NO LO ES */}
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
                  Regístrate como conductor para habilitar tu perfil y estadísticas de conducción
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-lochmara-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </section>
      )}

      {/* 4. MENÚ DE CONFIGURACIÓN Y PRIVACIDAD */}
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

      {/* 5. BOTÓN DE CERRAR SESIÓN */}
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
