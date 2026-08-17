import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Star,
  X,
  User,
  Car,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const ReputationStatsModal = ({
  isOpen,
  onClose,
  isDriverVerified,
  estadisticasData,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [rolEstadisticas, setRolEstadisticas] = useState('passenger');

  if (!isOpen) return null;

  const statsPasajero = estadisticasData?.passenger || {
    score: 4.9,
    total_ratings: 28,
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
    metrics: [
      { label: 'Manejo Prudente y Seguro', score_pct: 99, positive_count: 41 },
      { label: 'Vehículo Limpio y Cómodo', score_pct: 98, positive_count: 40 },
      { label: 'Puntualidad en las Salidas', score_pct: 96, positive_count: 39 },
      { label: 'Ruta Eficiente y Directa', score_pct: 97, positive_count: 40 },
      { label: 'Excelente Música y Ambiente', score_pct: 95, positive_count: 38 },
    ],
  };

  const statsActuales =
    rolEstadisticas === 'driver' && isDriverVerified ? statsConductor : statsPasajero;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`w-full max-w-[340px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border overflow-y-auto mx-auto space-y-4 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reputación y Desempeño</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Evaluaciones universitarias</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Rol con Iconos Vectoriales */}
          {isDriverVerified && (
            <div className={`flex p-1 rounded-2xl border text-[10px] font-bold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setRolEstadisticas('passenger')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rolEstadisticas === 'passenger'
                    ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pasajero</span>
              </button>
              <button
                type="button"
                onClick={() => setRolEstadisticas('driver')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rolEstadisticas === 'driver'
                    ? 'bg-lochmara-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Conductor</span>
              </button>
            </div>
          )}

          {/* Tarjeta de Resumen de Puntuación */}
          <div className={`rounded-2xl p-4 shadow-xs border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'}`}>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lochmara-400">
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
          </div>

          {/* Gráfico Estético de Variables Evaluadas */}
          <div className="space-y-3 pt-1">
            <div className={`flex items-center justify-between text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>Variables de Calificación</span>
              <span className="text-[10px] text-slate-400">Satisfacción</span>
            </div>

            <div className="space-y-2.5">
              {statsActuales.metrics.map((metrica, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{metrica.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({metrica.positive_count} votos)
                      </span>
                      <span className={`font-extrabold ${isDark ? 'text-lochmara-400' : 'text-lochmara-700'}`}>{metrica.score_pct}%</span>
                    </div>
                  </div>

                  {/* Barra de Progreso con Gradiente Suave */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrica.score_pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-lochmara-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            Cerrar Estadísticas
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
