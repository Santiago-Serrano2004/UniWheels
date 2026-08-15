import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Car, Plus, Users, Clock, MapPin, DollarSign, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const DriverView = () => {
  const { user } = useAppStore();
  const [seats, setSeats] = useState(3);
  const [isRouteActive, setIsRouteActive] = useState(true);

  return (
    <div className="space-y-4 pb-6">
      {/* Resumen del Conductor y Estado de Ruta */}
      <section className="bg-gradient-to-br from-slate-900 via-[#082f49] to-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-lochmara-300">
                Panel del Conductor
              </span>
              <h2 className="text-base font-extrabold">{user.name}</h2>
              <p className="text-xs text-slate-300 font-medium">Mazda 3 • KLU-492</p>
            </div>

            <button
              onClick={() => setIsRouteActive(!isRouteActive)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isRouteActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isRouteActive ? 'En Ruta Activa' : 'Fuera de Línea'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium">Ganancias del Mes</span>
              <p className="text-base font-extrabold text-lochmara-300">$ 148.000</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium">Pasajeros Llevados</span>
              <p className="text-base font-extrabold text-emerald-300">34 viajes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gestion de Cupos Disponibles */}
      <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Cupos Disponibles para el Viaje</h3>
            <p className="text-[11px] text-slate-500">Capacidad máxima autorizada en SOAT: 4</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setSeats(num)}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  seats === num
                    ? 'bg-lochmara-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Visualizador de Asientos */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[1, 2, 3, 4].map((seatNumber) => {
            const isOccupied = seatNumber > seats;
            return (
              <div
                key={seatNumber}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isOccupied
                    ? 'bg-slate-100 border-slate-200 text-slate-400'
                    : 'bg-lochmara-50 border-lochmara-200 text-lochmara-800 font-bold'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px]">{isOccupied ? 'Ocupado' : `Cupo ${seatNumber}`}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Solicitudes de Pasajeros Entrantes */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Solicitudes Entrantes (Desvío Óptimo)
        </h3>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                AP
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Andres Perez</p>
                <p className="text-[10px] text-slate-500">Ingeniería de Sistemas • 4.9 ★</p>
              </div>
            </div>
            <span className="text-xs font-bold text-lochmara-700">+$ 4.500</span>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            📍 Punto de recogida: <strong>Parque San Pío (+2 min)</strong>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
              Rechazar
            </button>
            <button className="py-2 rounded-xl text-xs font-bold bg-lochmara-600 text-white hover:bg-lochmara-500 shadow-xs">
              Aceptar Pasajero
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
