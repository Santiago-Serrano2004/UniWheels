import React, { useState, useEffect } from 'react';
import { tripsService } from '../../services/api';
import { RatingFeedbackModal } from '../common/RatingFeedbackModal';
import {
  History,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DriverHistoryView = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [modalCalificacion, setModalCalificacion] = useState({
    abierto: false,
    pasajero: null,
    tripId: null,
  });

  const [viajesHistorial, setViajesHistorial] = useState([]);
  const [viajeExpandido, setViajeExpandido] = useState(null);

  useEffect(() => {
    tripsService.getDriverHistory().then((data) => {
      if (data && data.length > 0) {
        const formateados = data.map((d) => ({
          id: d.id,
          date: d.date,
          origin: d.origin,
          destination: d.destination,
          duration: d.duration,
          distance: d.distance,
          totalEarned: d.total_earned,
          commissionPaid: d.commission_paid,
          passengers: d.passengers.map((p) => ({
            id: p.id,
            name: p.name,
            program: p.program,
            pickup: p.pickup,
            rated: p.rated,
            ratingScore: p.rating_score || 5,
          })),
        }));
        setViajesHistorial(formateados);
        setViajeExpandido(formateados[0]?.id || null);
      }
    });
  }, []);

  const abrirCalificarPasajero = (pasajero, tripId) => {
    setModalCalificacion({
      abierto: true,
      pasajero,
      tripId,
    });
  };

  const guardarCalificacion = () => {
    if (!modalCalificacion.pasajero || !modalCalificacion.tripId) return;

    setViajesHistorial((prev) =>
      prev.map((viaje) => {
        if (viaje.id === modalCalificacion.tripId) {
          return {
            ...viaje,
            passengers: viaje.passengers.map((p) =>
              p.id === modalCalificacion.pasajero.id
                ? { ...p, rated: true, ratingScore: 5 }
                : p
            ),
          };
        }
        return viaje;
      })
    );
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <History className="w-3.5 h-3.5 text-lochmara-500" />
          <span>Historial de Conducción</span>
        </h3>
        <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {viajesHistorial.length} viajes completados
        </span>
      </div>

      <div className="space-y-3">
        {viajesHistorial.map((viaje) => {
          const isExpanded = viajeExpandido === viaje.id;

          return (
            <div
              key={viaje.id}
              className={`rounded-3xl border overflow-hidden transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              {/* Cabecera del Viaje */}
              <div
                onClick={() => setViajeExpandido(isExpanded ? null : viaje.id)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{viaje.date}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Completado
                    </span>
                  </div>

                  <p className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {viaje.origin.split('-')[0]} ➔ {viaje.destination}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400">
                      +$ {viaje.totalEarned.toLocaleString('es-CO')}
                    </span>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {viaje.duration} • {viaje.distance}
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Detalles Desplegables del Viaje */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`px-4 pb-4 pt-1 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
                  >
                    {/* Estadísticas de Cobro */}
                    <div
                      className={`grid grid-cols-3 gap-2 p-2.5 rounded-2xl border text-center ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Recibido</span>
                        <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          ${viaje.totalEarned.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Comisión (12%)</span>
                        <span className="text-xs font-extrabold text-rose-500">
                          -${viaje.commissionPaid.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ganancia Neta</span>
                        <span className="text-xs font-extrabold text-emerald-400">
                          +${(viaje.totalEarned - viaje.commissionPaid).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Pasajeros y Calificación Individual */}
                    <div className="space-y-2">
                      <p className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Pasajeros Transportados ({viaje.passengers.length}):
                      </p>

                      <div className={`space-y-2 divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {viaje.passengers.map((pasajero) => (
                          <div
                            key={pasajero.id}
                            className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center border ${
                                  isDark
                                    ? 'bg-slate-800 text-lochmara-300 border-slate-700'
                                    : 'bg-lochmara-100 text-lochmara-800 border-lochmara-200'
                                }`}
                              >
                                {pasajero.name.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{pasajero.name}</p>
                                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {pasajero.program} • {pasajero.pickup}
                                </p>
                              </div>
                            </div>

                            {pasajero.rated ? (
                              <div className="flex items-center gap-1 text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{pasajero.ratingScore || 5}.0</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => abrirCalificarPasajero(pasajero, viaje.id)}
                                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Star className="w-3 h-3 fill-white text-white" />
                                <span>Calificar</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Modal de Calificación */}
      <RatingFeedbackModal
        isOpen={modalCalificacion.abierto}
        onClose={() => setModalCalificacion({ abierto: false, pasajero: null, tripId: null })}
        targetType="passenger"
        targetName={modalCalificacion.pasajero?.name || 'Estudiante'}
        targetRoleInfo={modalCalificacion.pasajero?.program || 'Comunidad Universitaria'}
        onSubmitRating={guardarCalificacion}
      />
    </div>
  );
};
