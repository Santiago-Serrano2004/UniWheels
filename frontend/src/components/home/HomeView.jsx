import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
  Navigation,
  Car,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const HomeView = () => {
  const { user, activeRole, setActiveTab } = useAppStore();
  const [destination, setDestination] = useState('');

  const campusDestinations = [
    { name: 'Campus El Jardín', address: 'Avenida 42 # 48 - 11', time: '12 min' },
    { name: 'Campus CSU Floridablanca', address: 'Calle 107 # 42 - 33', time: '22 min' },
    { name: 'Campus El Bosque', address: 'Calle 158 # 20 - 40', time: '18 min' },
  ];

  const nearbyRides = [
    {
      id: 'r1',
      driverName: 'Carlos Mendoza',
      vehicle: 'Mazda 3 (Rojo)',
      plate: 'KLU-492',
      rating: 4.95,
      origin: 'Cañaveral - La Florida',
      destination: 'Campus El Jardín',
      departureTime: '06:45 AM',
      availableSeats: 3,
      fare: '$ 4.500',
      detourMinutes: '+4 min',
    },
    {
      id: 'r2',
      driverName: 'Valentina Rios',
      vehicle: 'Chevrolet Onix (Gris)',
      plate: 'WYX-810',
      rating: 4.88,
      origin: 'Cabecera - Parque San Pio',
      destination: 'Campus CSU',
      departureTime: '07:15 AM',
      availableSeats: 2,
      fare: '$ 4.000',
      detourMinutes: '+2 min',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Tarjeta de Bienvenida y Busqueda Rapida */}
      <section className="bg-gradient-to-br from-[#082f49] to-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-lochmara-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-lochmara-300 font-medium">Hola, {user.name.split(' ')[0]}</p>
              <h2 className="text-lg font-extrabold tracking-tight">¿A dónde viajas hoy?</h2>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-lochmara-500/20 border border-lochmara-400/30 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-lochmara-300" />
            </div>
          </div>

          {/* Input de Busqueda de Destino */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Buscar punto de encuentro o campus..."
              className="w-full bg-white/10 text-white placeholder-slate-400 text-xs rounded-2xl pl-10 pr-4 py-3 border border-white/15 focus:outline-none focus:ring-2 focus:ring-lochmara-400 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Sedes UNAB Frecuentes */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sedes Principales</h3>
          <span className="text-[11px] text-lochmara-600 font-semibold cursor-pointer">Ver mapa</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {campusDestinations.map((campus, index) => (
            <button
              key={index}
              onClick={() => setActiveTab('map')}
              className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col items-start justify-between shadow-2xs hover:border-lochmara-300 hover:shadow-xs transition-all text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-xl bg-lochmara-50 text-lochmara-600 flex items-center justify-center mb-2">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight truncate w-full">
                  {campus.name.replace('Campus ', '')}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">{campus.time}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Rutas Compartidas Disponibles en tu Corredor */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rutas Cercanas Disponibles
            </h3>
            <p className="text-[10px] text-slate-600">Emparejamiento espacial en tu radio</p>
          </div>
          <span className="text-[11px] font-semibold text-lochmara-600 cursor-pointer">Filtrar</span>
        </div>

        <div className="space-y-2.5">
          {nearbyRides.map((ride) => (
            <motion.div
              key={ride.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('map')}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:border-lochmara-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
            >
              {/* Encabezado del Conductor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-lochmara-100 text-lochmara-800 font-extrabold text-xs flex items-center justify-center border border-lochmara-200">
                    {ride.driverName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{ride.driverName}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {ride.vehicle} • <span className="font-semibold">{ride.plate}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-lochmara-700">{ride.fare}</span>
                  <p className="text-[10px] text-emerald-600 font-bold">{ride.detourMinutes} desvío</p>
                </div>
              </div>

              {/* Trazado Origen - Destino */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-lochmara-500" />
                  <span className="text-slate-700 font-medium truncate">{ride.origin}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1.5" />
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-900 font-bold truncate">{ride.destination}</span>
                </div>
              </div>

              {/* Footer con Cupos y Hora */}
              <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Salida: <strong className="text-slate-700">{ride.departureTime}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-lochmara-500" />
                    <strong className="text-slate-700">{ride.availableSeats} cupos</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-lochmara-600 font-bold text-xs">
                  <span>Solicitar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
