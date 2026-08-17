import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService } from '../../services/api';
import { RatingFeedbackModal } from '../common/RatingFeedbackModal';
import { PassengerActiveTripCard } from './PassengerActiveTripCard';
import {
  History,
  Star,
  ChevronDown,
  ChevronUp,
  Car,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PassengerTripsView = () => {
  const { activePassengerBooking, theme } = useAppStore();

  const isDark = theme === 'dark';
  const [modalCalificacion, setModalCalificacion] = useState({
    abierto: false,
    conductor: null,
    tripId: null,
  });

  const [historialPasajero, setHistorialPasajero] = useState([]);
  const [viajeExpandido, setViajeExpandido] = useState(null);

  useEffect(() => {
    tripsService.getPassengerHistory().then((data) => {
      if (data && data.length > 0) {
        const formateados = data.map((d) => ({
          id: d.id,
          date: d.date,
          driverName: d.driver_name,
          vehicle: d.vehicle,
          plate: d.plate,
          pickup: d.pickup,
          destination: d.destination,
          duration: d.duration,
          distance: d.distance,
          farePaid: d.fare_paid,
          rated: d.rated,
          ratingScore: d.rating_score || 5,
        }));
        setHistorialPasajero(formateados);
        setViajeExpandido(formateados[0]?.id || null);
      }
    });
  }, []);

  const abrirCalificarConductor = (viaje) => {
    setModalCalificacion({
      abierto: true,
      conductor: {
        name: viaje.driverName,
        roleInfo: `${viaje.vehicle} • ${viaje.plate}`,
      },
      tripId: viaje.id,
    });
  };

  const guardarCalificacion = () => {
    if (!modalCalificacion.tripId) return;

    setHistorialPasajero((prev) =>
      prev.map((v) =>
        v.id === modalCalificacion.tripId ? { ...v, rated: true, ratingScore: 5 } : v
      )
    );
  };

  // Si tiene un viaje activo, mostrar ÚNICAMENTE la tarjeta de viaje activo
  if (activePassengerBooking) {
    return <PassengerActiveTripCard />;
  }

  return (
    <div className="space-y-3 pb-6 select-none">
      {/* HISTORIAL DE VIAJES COMPLETADOS DEL PASAJERO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <History className="w-3.5 h-3.5 text-lochmara-500" />
            <span>Historial de Viajes Pasajeros</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            {historialPasajero.length} viajes completados
          </span>
        </div>

        <div className="space-y-3">
          {historialPasajero.map((viaje) => {
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
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Completado
                      </span>
                    </div>

                    <p className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {viaje.pickup.split('-')[0]} ➔ {viaje.destination}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        $ {viaje.farePaid.toLocaleString('es-CO')}
                      </span>
                      <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
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
                      {/* Datos del Conductor y Vehículo */}
                      <div
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border ${
                              isDark
                                ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                                : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200'
                            }`}
                          >
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{viaje.driverName}</p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {viaje.vehicle} • <strong className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{viaje.plate}</strong>
                            </p>
                          </div>
                        </div>

                        {viaje.rated ? (
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{viaje.ratingScore || 5}.0</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirCalificarConductor(viaje)}
                            className="px-3 py-1.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            <span>Calificar Conductor</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Calificación a Conductor */}
      <RatingFeedbackModal
        isOpen={modalCalificacion.abierto}
        onClose={() => setModalCalificacion({ abierto: false, conductor: null, tripId: null })}
        targetType="driver"
        targetName={modalCalificacion.conductor?.name || 'Conductor Universitario'}
        targetRoleInfo={modalCalificacion.conductor?.roleInfo || 'Vehículo Verificado'}
        onSubmitRating={guardarCalificacion}
      />
    </div>
  );
};
