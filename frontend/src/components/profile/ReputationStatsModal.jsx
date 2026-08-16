import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  X,
  Award,
  ShieldCheck,
  TrendingUp,
  Heart,
  Sparkles,
} from 'lucide-react';

export const ReputationStatsModal = ({
  isOpen,
  onClose,
  isDriverVerified,
  estadisticasData,
}) => {
  const [rolEstadisticas, setRolEstadisticas] = useState('passenger');

  if (!isOpen) return null;

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
          className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-y-auto text-slate-900 mx-auto space-y-4"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Reputación y Desempeño</h3>
                <p className="text-[10px] text-slate-400">Evaluaciones universitarias</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Rol si es Conductor */}
          {isDriverVerified && (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setRolEstadisticas('passenger')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  rolEstadisticas === 'passenger'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎓 Pasajero
              </button>
              <button
                type="button"
                onClick={() => setRolEstadisticas('driver')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  rolEstadisticas === 'driver'
                    ? 'bg-lochmara-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🚗 Conductor
              </button>
            </div>
          )}

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
                Basado en <strong className="text-white">{statsActuales.total_ratings} calificaciones</strong>
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
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar Estadísticas
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
