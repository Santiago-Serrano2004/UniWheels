import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarCheck, MapPin, Clock, Car, Navigation, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const PassengerTripsView = () => {
  const { setActiveTab } = useAppStore();

  return (
    <div className="space-y-4 pb-6 select-none">
      <div className="bg-gradient-to-br from-[#082f49] via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-md space-y-1">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-lochmara-300">
          Mis Reservas y Viajes
        </span>
        <h2 className="text-lg font-extrabold">Tus Recorridos Universitarios</h2>
        <p className="text-xs text-slate-300">
          Consulta el estado de tus cupos reservados y tu historial de trayectos.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-lochmara-50 border border-lochmara-200 text-lochmara-600 flex items-center justify-center mx-auto shadow-2xs">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">No tienes viajes activos</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
            Busca conductores de tu institución que compartan ruta hacia tu campus o de regreso a casa.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('map')}
          className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all shadow-md shadow-lochmara-600/20 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Buscar Rutas Disponibles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
