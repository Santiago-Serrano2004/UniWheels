import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService, routesService } from '../../services/api';
import { RatingFeedbackModal } from '../common/RatingFeedbackModal';
import {
  Car,
  Clock,
  Calendar,
  Users,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Power,
  Navigation,
  Play,
  X,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DriverHistoryView = () => {
  const {
    theme,
    publishedDriverTrips,
    setPublishedDriverTrips,
    cancelPublishedTrip,
    startPublishedTrip,
    recurringDriverTrips,
    toggleRecurringDriverTrip,
    addRecurringDriverTrip,
    deleteRecurringDriverTrip,
    setActiveTab,
  } = useAppStore();

  const isDark = theme === 'dark';

  // Sub-pestañas: 'published' | 'recurring' | 'history'
  const [activeSection, setActiveSection] = useState('published');

  // Modal de Calificación
  const [modalCalificacion, setModalCalificacion] = useState({
    abierto: false,
    pasajero: null,
    tripId: null,
  });

  // Modal para Crear Rutina Recurrente
  const [modalNuevaRutina, setModalNuevaRutina] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('Ruta a Clases');
  const [nuevosDias, setNuevosDias] = useState(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [nuevaHora, setNuevaHora] = useState('06:30');
  const [nuevoSentido, setNuevoSentido] = useState('hacia_campus');
  const [nuevoOrigen, setNuevoOrigen] = useState('Cañaveral - C.C. Parque Caracolí');
  const [nuevoDestino, setNuevoDestino] = useState('Campus El Jardín');
  const [nuevosCupos, setNuevosCupos] = useState(3);
  const [nuevaTarifa, setNuevaTarifa] = useState('4500');

  // Historial de viajes completados
  const [viajesHistorial, setViajesHistorial] = useState([]);
  const [viajeExpandido, setViajeExpandido] = useState(null);

  // Historial: cada tarjeta es UN viaje real completado (trip-service no agrupa
  // varios pasajeros bajo una misma ruta en esta respuesta).
  useEffect(() => {
    tripsService.getDriverHistory().then((data) => {
      const completados = (data || []).filter((d) => d.status === 'completado');
      const formateados = completados.map((d) => ({
        id: d.id,
        date: d.date,
        origin: d.origin,
        destination: d.destination,
        totalEarned: Number(d.fare_cop) || 0,
        driverEarnings: Number(d.earnings_cop) || 0,
        passenger: {
          id: d.passenger_id,
          name: d.passenger_name || 'Pasajero',
          pickup: d.pickup_address,
          rated: false,
        },
      }));
      setViajesHistorial(formateados);
      setViajeExpandido(formateados[0]?.id || null);
    });
  }, []);

  // Publicados: rutas reales del conductor (route-matching-service), enriquecidas
  // con los pasajeros confirmados de cada una (trip-service).
  useEffect(() => {
    routesService.getMyRoutes().then(async (rutas) => {
      if (!rutas || rutas.length === 0) return;

      const enriquecidas = await Promise.all(
        rutas.map(async (r) => {
          const pasajeros = await tripsService.getActiveTripsForRoute(r.id);
          return {
            id: r.id,
            origin: r.origin_name || r.origin,
            destination: r.destination_campus_name || r.destination,
            departure_time: r.departure_time,
            departure_date: r.scheduled_departure_time ? r.scheduled_departure_time.split('T')[0] : '',
            available_seats: r.available_seats,
            fare_cop: r.base_contribution_cop,
            origin_lat: r.origin_lat,
            origin_lng: r.origin_lng,
            destination_lat: r.destination_lat,
            destination_lng: r.destination_lng,
            route_path: r.route_path,
            status: r.status === 'publicada' ? 'publicado' : r.status,
            passengers: pasajeros.map((p) => ({
              id: p.id,
              name: p.passenger_name || 'Pasajero',
              pickup: p.pickup_address,
              isPinVerified: p.is_pin_verified,
            })),
          };
        })
      );

      setPublishedDriverTrips(enriquecidas);
    });
  }, [setPublishedDriverTrips]);

  const abrirCalificarPasajero = (pasajero, tripId) => {
    setModalCalificacion({
      abierto: true,
      pasajero,
      tripId,
    });
  };

  const guardarCalificacion = async ({ rating = 5, comment = '' } = {}) => {
    if (!modalCalificacion.pasajero || !modalCalificacion.tripId) return;

    try {
      await tripsService.submitRating({
        trip_id: modalCalificacion.tripId,
        rated_user_id: modalCalificacion.pasajero.id,
        role_rated: 'pasajero',
        score: rating,
        optional_comment: comment || undefined,
      });
    } catch (err) {
      console.warn('No se pudo registrar la calificación:', err);
    }

    setViajesHistorial((prev) =>
      prev.map((viaje) =>
        viaje.id === modalCalificacion.tripId
          ? { ...viaje, passenger: { ...viaje.passenger, rated: true, ratingScore: rating } }
          : viaje
      )
    );
  };

  const toggleDiaSeleccionado = (dia) => {
    if (nuevosDias.includes(dia)) {
      if (nuevosDias.length > 1) {
        setNuevosDias(nuevosDias.filter((d) => d !== dia));
      }
    } else {
      setNuevosDias([...nuevosDias, dia]);
    }
  };

  const handleCrearRutina = (e) => {
    e.preventDefault();
    addRecurringDriverTrip({
      title: nuevoTitulo,
      days: nuevosDias,
      direction: nuevoSentido,
      departure_time: nuevaHora,
      origin: nuevoOrigen,
      destination: nuevoDestino,
      seats: Number(nuevosCupos),
      fare_cop: Number(nuevaTarifa),
    });
    setModalNuevaRutina(false);
  };

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. HEADER CON SELECTOR DE SECCIONES (Pill Bar) */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black tracking-tight flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-500" />
          <span>Gestión de Viajes</span>
        </h2>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Modo Conductor
        </span>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS */}
      <div
        className={`flex p-1 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveSection('published')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            activeSection === 'published'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeSection === 'published' && (
            <motion.div
              layoutId="driver-manager-tab"
              className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Publicados ({publishedDriverTrips.filter((t) => t.status === 'publicado').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('recurring')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            activeSection === 'recurring'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeSection === 'recurring' && (
            <motion.div
              layoutId="driver-manager-tab"
              className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Recurrentes ({recurringDriverTrips.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            activeSection === 'history'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeSection === 'history' && (
            <motion.div
              layoutId="driver-manager-tab"
              className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Historial ({viajesHistorial.length})</span>
        </button>
      </div>

      {/* 3. CONTENIDO SEGÚN SECCIÓN */}
      {/* SECCIÓN A: VIAJES PUBLICADOS PUNTUALES */}
      {activeSection === 'published' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">
              Viajes activos y programados para hoy o próximos días
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('driver')}
              className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Publicar Nuevo</span>
            </button>
          </div>

          {publishedDriverTrips.length > 0 ? (
            publishedDriverTrips.map((viaje) => {
              const isCancelado = viaje.status === 'cancelado';

              return (
                <div
                  key={viaje.id}
                  className={`rounded-3xl p-4 border transition-all space-y-3 ${
                    isCancelado
                      ? 'opacity-60 bg-slate-900/40 border-slate-800/50'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  {/* Cabecera del Viaje Publicado */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/20">
                        <Calendar className="w-3 h-3" />
                        <span>{viaje.date}</span>
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold flex items-center gap-1 border border-lochmara-500/20">
                        <Clock className="w-3 h-3" />
                        <span>{viaje.departure_time}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-500">
                        $ {viaje.fare_cop?.toLocaleString('es-CO')}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold">
                        {viaje.available_seats} cupos libres
                      </p>
                    </div>
                  </div>

                  {/* Corredor de Ruta */}
                  <div className={`p-2.5 rounded-2xl border text-xs space-y-1.5 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-lochmara-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">De:</span>
                      <span className="font-black truncate">{viaje.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">A:</span>
                      <span className="font-black truncate">{viaje.destination}</span>
                    </div>
                  </div>

                  {/* Pasajeros Confirmados */}
                  {viaje.passengers && viaje.passengers.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-500" />
                        <span>Pasajeros Confirmados ({viaje.passengers.length})</span>
                      </p>
                      <div className="space-y-1">
                        {viaje.passengers.map((p) => (
                          <div
                            key={p.id}
                            className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-black truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                Recogida: {p.pickup}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                              {p.isPinVerified ? 'A bordo' : 'Confirmado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Aún no hay pasajeros reservados en este trayecto.
                    </p>
                  )}

                  {/* Acciones */}
                  {!isCancelado && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startPublishedTrip(viaje.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Iniciar en Cabina GPS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelPublishedTrip(viaje.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={`p-8 rounded-3xl border text-center space-y-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Car className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-black">No tienes viajes publicados pendientes.</p>
              <button
                type="button"
                onClick={() => setActiveTab('driver')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black transition-all cursor-pointer"
              >
                Publicar un Trayecto
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN B: PLANTILLAS DE VIAJES RECURRENTES */}
      {activeSection === 'recurring' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">
              Plantillas que se publican automáticamente cada semana
            </span>
            <button
              type="button"
              onClick={() => setModalNuevaRutina(true)}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Nueva Rutina</span>
            </button>
          </div>

          <div className="space-y-3">
            {recurringDriverTrips.map((plantilla) => (
              <div
                key={plantilla.id}
                className={`rounded-3xl p-4 border transition-all space-y-3 ${
                  !plantilla.isActive
                    ? 'opacity-60 bg-slate-900/30 border-slate-800/40'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                {/* Título y Switch de Activación */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black">{plantilla.title}</h4>
                    <p className="text-[10px] text-slate-400">
                      Salida fija a las {plantilla.departure_time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRecurringDriverTrip(plantilla.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                        plantilla.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{plantilla.isActive ? 'Activa' : 'Pausada'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRecurringDriverTrip(plantilla.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Días Activos */}
                <div className="flex items-center gap-1">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => {
                    const isDiaActivo = plantilla.days.includes(dia);
                    return (
                      <span
                        key={dia}
                        className={`w-7 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-colors ${
                          isDiaActivo
                            ? 'bg-lochmara-600 text-white shadow-2xs'
                            : isDark
                            ? 'bg-slate-950 text-slate-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {dia}
                      </span>
                    );
                  })}
                </div>

                {/* Corredor y Tarifa */}
                <div className={`p-2.5 rounded-2xl border text-xs space-y-1 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Ruta:</span>
                    <span className="font-extrabold text-emerald-500">
                      $ {plantilla.fare_cop?.toLocaleString('es-CO')} • {plantilla.seats} cupos
                    </span>
                  </div>
                  <p className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="truncate">{plantilla.origin}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 opacity-70" />
                    <span className="truncate">{plantilla.destination}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN C: HISTORIAL DE VIAJES COMPLETADOS */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">
              Registro histórico de carreras finalizadas y liquidaciones
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
                      <p className={`flex items-center gap-1 text-xs font-bold max-w-[200px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="truncate">{viaje.origin.split('-')[0]}</span>
                        <ArrowRight className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="truncate">{viaje.destination}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400">
                        +$ {viaje.driverEarnings.toLocaleString('es-CO')}
                      </span>
                      <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {viaje.passenger?.name}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`px-4 pb-4 pt-1 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
                      >
                        <div
                          className={`grid grid-cols-3 gap-2 p-2.5 rounded-2xl border text-center ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-semibold block text-slate-400">Total Cobrado</span>
                            <span className="text-xs font-extrabold">${viaje.totalEarned.toLocaleString('es-CO')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold block text-slate-400">Comisión (12%)</span>
                            <span className="text-xs font-extrabold text-rose-500">-${(viaje.totalEarned - viaje.driverEarnings).toLocaleString('es-CO')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold block text-slate-400">Ganancia Neta</span>
                            <span className="text-xs font-extrabold text-emerald-400">+${viaje.driverEarnings.toLocaleString('es-CO')}</span>
                          </div>
                        </div>

                        {/* Pasajero */}
                        {viaje.passenger && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400">Pasajero Transportado:</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="min-w-0">
                                <p className="font-bold truncate">{viaje.passenger.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{viaje.passenger.pickup}</p>
                              </div>
                              {viaje.passenger.rated ? (
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{viaje.passenger.ratingScore || 5}.0</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => abrirCalificarPasajero(viaje.passenger, viaje.id)}
                                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Star className="w-3 h-3 fill-white text-white" />
                                  <span>Calificar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MODAL PARA CREAR NUEVA RUTINA RECURRENTE */}
      <AnimatePresence>
        {modalNuevaRutina && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-black">Nueva Rutina Semanal</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNuevaRutina(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCrearRutina} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre de la Rutina:</label>
                  <input
                    type="text"
                    required
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    placeholder="Ej: Clases 7:00 AM El Jardín"
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Días de Salida:</label>
                  <div className="flex items-center gap-1 justify-between">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => {
                      const sel = nuevosDias.includes(dia);
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDiaSeleccionado(dia)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            sel
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : isDark
                              ? 'bg-slate-950 text-slate-500'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Hora de Salida:</label>
                    <input
                      type="time"
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Cupos:</label>
                    <select
                      value={nuevosCupos}
                      onChange={(e) => setNuevosCupos(Number(e.target.value))}
                      className={`w-full p-2 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value={1}>1 Cupo</option>
                      <option value={2}>2 Cupos</option>
                      <option value={3}>3 Cupos</option>
                      <option value={4}>4 Cupos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Aporte por Pasajero:</label>
                  <select
                    value={nuevaTarifa}
                    onChange={(e) => setNuevaTarifa(e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="3500">$ 3.500 COP</option>
                    <option value="4000">$ 4.000 COP</option>
                    <option value="4500">$ 4.500 COP</option>
                    <option value="5000">$ 5.000 COP</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  Guardar Rutina Recurrente
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
