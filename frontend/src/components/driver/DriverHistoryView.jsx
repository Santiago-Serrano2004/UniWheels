import React, { useState } from 'react';
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
  Navigation,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DriverHistoryView = () => {
  const [modalCalificacion, setModalCalificacion] = useState({
    abierto: false,
    pasajero: null,
    tripId: null,
  });

  const [viajesHistorial, setViajesHistorial] = useState([
    {
      id: 'dtrip_1',
      date: 'Hoy, 06:45 AM',
      origin: 'Cañaveral - C.C. Cañaveral',
      destination: 'Campus El Jardín',
      duration: '24 min',
      distance: '8.4 km',
      totalEarned: 13500,
      commissionPaid: 1620,
      passengers: [
        { id: 'p_1', name: 'Laura Gómez', program: 'Medicina', pickup: 'Parque San Pío', rated: false },
        { id: 'p_2', name: 'Mateo Cárdenas', program: 'Ingeniería de Sistemas', pickup: 'Estación Provenza', rated: true, ratingScore: 5 },
        { id: 'p_3', name: 'Camila Duarte', program: 'Derecho', pickup: 'Cañaveral', rated: false },
      ],
      routePolyline: [
        [7.0678, -73.1066],
        [7.0856, -73.1142],
        [7.1186, -73.1102],
        [7.1193, -73.1227],
      ],
    },
    {
      id: 'dtrip_2',
      date: 'Ayer, 01:15 PM',
      origin: 'Campus El Jardín',
      destination: 'Cabecera - Parque Santander',
      duration: '18 min',
      distance: '6.2 km',
      totalEarned: 9000,
      commissionPaid: 1080,
      passengers: [
        { id: 'p_4', name: 'Andrés Suárez', program: 'Administración', pickup: 'El Jardín', rated: true, ratingScore: 5 },
        { id: 'p_5', name: 'Sofía Rueda', program: 'Psicología', pickup: 'El Jardín', rated: true, ratingScore: 5 },
      ],
      routePolyline: [
        [7.1193, -73.1227],
        [7.1205, -73.1145],
        [7.1225, -73.1285],
      ],
    },
  ]);

  const [viajeExpandido, setViajeExpandido] = useState('dtrip_1');

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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-lochmara-600" />
          <span>Historial de Conducción</span>
        </h3>
        <span className="text-[10px] font-bold text-slate-400">
          {viajesHistorial.length} viajes completados
        </span>
      </div>

      <div className="space-y-3">
        {viajesHistorial.map((viaje) => {
          const isExpanded = viajeExpandido === viaje.id;

          return (
            <div
              key={viaje.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Cabecera del Viaje */}
              <div
                onClick={() => setViajeExpandido(isExpanded ? null : viaje.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-900">{viaje.date}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Completado
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                    {viaje.origin.split('-')[0]} ➔ {viaje.destination}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-700">
                      +$ {viaje.totalEarned.toLocaleString('es-CO')}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">
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
                    className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3"
                  >
                    {/* Estadísticas de Cobro */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Total Recibido</span>
                        <span className="text-xs font-extrabold text-slate-900">
                          ${viaje.totalEarned.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Comisión (12%)</span>
                        <span className="text-xs font-extrabold text-rose-600">
                          -${viaje.commissionPaid.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Ganancia Neta</span>
                        <span className="text-xs font-extrabold text-emerald-600">
                          +${(viaje.totalEarned - viaje.commissionPaid).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Pasajeros y Calificación Individual */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-700">
                        Pasajeros Transportados ({viaje.passengers.length}):
                      </p>

                      <div className="space-y-2 divide-y divide-slate-100">
                        {viaje.passengers.map((pasajero) => (
                          <div
                            key={pasajero.id}
                            className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-lochmara-100 text-lochmara-800 font-bold text-[10px] flex items-center justify-center">
                                {pasajero.name.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{pasajero.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {pasajero.program} • {pasajero.pickup}
                                </p>
                              </div>
                            </div>

                            {pasajero.rated ? (
                              <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
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
