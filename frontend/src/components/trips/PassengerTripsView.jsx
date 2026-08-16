import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  CalendarCheck,
  MapPin,
  Clock,
  Car,
  Navigation,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const PassengerTripsView = () => {
  const { activePassengerBooking, cancelPassengerBooking, setActiveTab } = useAppStore();
  const [modalCancelar, setModalCancelar] = useState(false);

  if (!activePassengerBooking) {
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
  }

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Tarjeta del Viaje Reservado */}
      <section className="bg-gradient-to-br from-slate-900 via-[#082f49] to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cupo Confirmado</span>
          </div>

          <span className="text-xs font-mono font-bold text-lochmara-300">
            {activePassengerBooking.departureTime || '06:45 AM'}
          </span>
        </div>

        {/* Conductor Asignado */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-lochmara-100 text-lochmara-800 font-extrabold text-sm flex items-center justify-center border border-lochmara-200">
              CM
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white">
                  {activePassengerBooking.driverName || 'Carlos Mendoza'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-lochmara-400" />
              </div>
              <p className="text-[11px] text-slate-300">
                {activePassengerBooking.vehicle || 'Mazda 3 (Rojo)'} •{' '}
                <strong className="text-white font-mono">{activePassengerBooking.plate || 'KLU-492'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-extrabold text-emerald-300">
              {activePassengerBooking.fare || '$ 4.500'}
            </span>
            <p className="text-[10px] text-slate-400">Aporte acordado</p>
          </div>
        </div>

        {/* PIN de Abordaje Seguro de 4 Dígitos */}
        <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-300" />
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold block">PIN de Abordaje</span>
              <p className="text-[11px] text-slate-300">Entrégalo al conductor al subir</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-white text-slate-900 rounded-xl font-mono text-base font-extrabold tracking-widest shadow-xs">
            {activePassengerBooking.boardingPin || '4829'}
          </div>
        </div>

        {/* Puntos de Ruta */}
        <div className="space-y-2 bg-white/5 rounded-2xl p-3 border border-white/10 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-400 mt-1 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Tu Punto de Abordaje</span>
              <p className="font-bold text-white">{activePassengerBooking.pickup || 'Parque San Pío'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Campus Universitario</span>
              <p className="font-bold text-white">{activePassengerBooking.destination || 'Campus El Jardín'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Botón de Cancelar Reserva */}
      <button
        type="button"
        onClick={() => cancelPassengerBooking()}
        className="w-full py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <AlertTriangle className="w-4 h-4 text-rose-600" />
        <span>Cancelar Mi Reserva de Cupo</span>
      </button>
    </div>
  );
};
