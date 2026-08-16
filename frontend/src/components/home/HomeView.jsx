import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService, tripsService } from '../../services/api';
import { DriverCockpitCard } from '../driver/DriverCockpitCard';
import { PassengerActiveTripCard } from '../trips/PassengerActiveTripCard';
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
  const { user, activeRole, activePassengerBooking, setActiveTab } = useAppStore();
  const [destination, setDestination] = useState('');
  const [campuses, setCampuses] = useState([]);
  const [nearbyRides, setNearbyRides] = useState([]);

  // Cargar sedes dinámicas y viajes disponibles desde el backend
  useEffect(() => {
    authService.getInstitutions().then((instituciones) => {
      if (instituciones && instituciones.length > 0) {
        const inst = instituciones[0];
        if (inst.campuses && inst.campuses.length > 0) {
          setCampuses(inst.campuses);
        }
      }
    });

    tripsService.getAvailableTrips().then((trips) => {
      if (trips && trips.length > 0) {
        setNearbyRides(
          trips.map((t) => ({
            id: t.id,
            driverName: t.driver_name,
            vehicle: t.vehicle,
            plate: t.plate,
            rating: t.rating,
            origin: t.origin,
            destination: t.destination,
            departureTime: t.departure_time,
            availableSeats: t.available_seats,
            fare: t.fare,
            detourMinutes: t.detour_minutes,
          }))
        );
      }
    });
  }, []);

  // Si el rol activo es CONDUCTOR, mostrar su panel de conductor
  if (activeRole === 'driver') {
    return <DriverCockpitCard />;
  }

  // Si es PASAJERO y tiene una reserva activa, mostrar ÚNICAMENTE su tarjeta de viaje activo
  if (activePassengerBooking) {
    return <PassengerActiveTripCard />;
  }

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Tarjeta de Bienvenida y Busqueda Rapida */}
      <section className="bg-gradient-to-br from-[#082f49] to-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-lochmara-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-lochmara-300 font-medium">
                Hola, {user?.name ? user.name.split(' ')[0] : 'Estudiante'}
              </p>
              <h2 className="text-lg font-extrabold tracking-tight">¿A dónde viajas hoy?</h2>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-lochmara-500/20 border border-lochmara-400/30 flex items-center justify-center overflow-hidden shadow-xs">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <Navigation className="w-5 h-5 text-lochmara-300" />
              )}
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

      {/* Sedes Oficiales Dinámicas desde Base de Datos */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sedes Principales</h3>
          <span
            onClick={() => setActiveTab('map')}
            className="text-[11px] text-lochmara-600 font-semibold cursor-pointer hover:underline"
          >
            Ver mapa
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => setActiveTab('map')}
              className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col items-start justify-between shadow-2xs hover:border-lochmara-300 hover:shadow-xs transition-all text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-xl bg-lochmara-50 text-lochmara-600 flex items-center justify-center mb-2">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="w-full">
                <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                  {campus.name.replace('Campus ', '')}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {campus.code}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Rutas Compartidas Disponibles en tu Corredor */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rutas Disponibles</h3>
          <span className="text-[11px] text-slate-400 font-medium">Bucaramanga y AMB</span>
        </div>

        <div className="space-y-2.5">
          {nearbyRides.map((ride) => (
            <motion.div
              key={ride.id}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3 hover:border-lochmara-200 transition-all cursor-pointer"
            >
              {/* Conductor y Vehiculo */}
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

      {/* Invitación a Registrarse como Conductor (Solo para Pasajeros) */}
      {!user?.isDriver && (
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
                  Regístrate como conductor para compartir tus gastos de transporte
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-lochmara-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </section>
      )}
    </div>
  );
};
