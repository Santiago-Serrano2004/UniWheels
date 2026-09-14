import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService } from '../../services/api';
import { placesApiService } from '../../services/placesApiService';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { SetHomeLocationModal } from '../common/SetHomeLocationModal';
import { RatingFeedbackModal } from '../common/RatingFeedbackModal';
import {
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  Car,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Power,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  X,
  Navigation,
  History,
  Home,
  Building2,
  Search,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PassengerTripsView = () => {
  const {
    theme,
    savedHomeLocation,
    setSavedHomeLocation,
    activePassengerBooking,
    cancelPassengerBooking,
    recurringPassengerAlerts,
    togglePassengerAlert,
    addPassengerAlert,
    deletePassengerAlert,
    smartMatchAlerts,
    acceptSmartMatchAlert,
    dismissSmartMatchAlert,
    setActiveTab,
  } = useAppStore();

  const isDark = theme === 'dark';

  // Días que coinciden entre la ruta del conductor y las rutinas del pasajero
  const passengerDaysSet = React.useMemo(() => {
    const set = new Set();
    (recurringPassengerAlerts || [])
      .filter((a) => a.isActive)
      .forEach((a) => (a.days || []).forEach((d) => set.add(d)));
    return set;
  }, [recurringPassengerAlerts]);

  const getMatchingDays = (driverDays) => {
    if (!driverDays || !Array.isArray(driverDays)) return [];
    if (passengerDaysSet.size === 0) return driverDays;
    return driverDays.filter((d) => passengerDaysSet.has(d));
  };

  // Sub-pestañas: 'bookings' | 'alerts' | 'history'
  const [activeSection, setActiveSection] = useState(
    activePassengerBooking ? 'bookings' : smartMatchAlerts.length > 0 ? 'alerts' : 'bookings'
  );

  // Modal de Calificación
  const [modalCalificacion, setModalCalificacion] = useState({
    abierto: false,
    conductor: null,
    tripId: null,
  });

  // Modalidades de Smart Match seleccionadas por match id
  const [matchModalities, setMatchModalities] = useState({});

  // Modal para Crear Alerta Recurrente
  const [modalNuevaAlerta, setModalNuevaAlerta] = useState(false);
  const [nuevoSentido, setNuevoSentido] = useState('towards'); // 'towards' | 'from' | 'inter_campus'
  const [nuevaSedePrincipal, setNuevaSedePrincipal] = useState('Campus El Jardín');
  const [nuevaSedeDestinoInter, setNuevaSedeDestinoInter] = useState('Campus El Bosque');
  const [nuevoPuntoEditable, setNuevoPuntoEditable] = useState(savedHomeLocation?.address || 'Provenza - Cra 27 #105');
  const [nuevoTitulo, setNuevoTitulo] = useState('Clases 7:00 AM El Jardín');
  const [nuevosDias, setNuevosDias] = useState(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [nuevaHora, setNuevaHora] = useState('06:55');
  const [nuevaTarifaMax, setNuevaTarifaMax] = useState('5000');

  // Búsqueda y Sugerencias dentro del modal
  const [busquedaLugar, setBusquedaLugar] = useState('');
  const [sugerenciasLugar, setSugerenciasLugar] = useState([]);
  const [buscandoLugar, setBuscandoLugar] = useState(false);
  const [abrirModalMapa, setAbrirModalMapa] = useState(false);
  const [modalConfigurarCasa, setModalConfigurarCasa] = useState(false);

  // Buscar lugares con debounce
  useEffect(() => {
    if (!busquedaLugar || busquedaLugar.trim().length < 2) {
      setSugerenciasLugar([]);
      setBuscandoLugar(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoLugar(true);
      try {
        const res = await placesApiService.buscarLugares(busquedaLugar.trim());
        setSugerenciasLugar(res || []);
      } catch (err) {
        console.error('Error buscando lugares en rutina:', err);
      } finally {
        setBuscandoLugar(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [busquedaLugar]);

  const seleccionarSugerencia = (sug) => {
    setNuevoPuntoEditable(sug.direccion || sug.nombre);
    setBusquedaLugar('');
    setSugerenciasLugar([]);
  };

  const aplicarUbicacionCasa = () => {
    if (savedHomeLocation) {
      setNuevoPuntoEditable(savedHomeLocation.address);
      setBusquedaLugar('');
      setSugerenciasLugar([]);
    } else {
      setModalConfigurarCasa(true);
    }
  };

  const confirmarUbicacionMapa = (loc, placeName) => {
    const dir = loc?.address || loc?.title || loc?.name || placeName || (typeof loc === 'string' ? loc : '');
    if (dir) {
      setNuevoPuntoEditable(dir);
    }
    setAbrirModalMapa(false);
  };

  // Historial de viajes completados
  const [historialPasajero, setHistorialPasajero] = useState([]);
  const [viajeExpandido, setViajeExpandido] = useState(null);

  useEffect(() => {
    tripsService.getPassengerHistory().then((data) => {
      if (data && data.length > 0) {
        const formateados = data.map((d) => ({
          id: d.id,
          driverId: d.driver_id,
          date: d.date,
          driverName: d.driver_name,
          vehicle: d.vehicle_model,
          plate: d.vehicle_plate,
          pickup: d.origin,
          destination: d.destination,
          farePaid: d.fare_cop,
          rated: false,
          ratingScore: 5,
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
        id: viaje.driverId,
        name: viaje.driverName,
        roleInfo: `${viaje.vehicle} • ${viaje.plate}`,
      },
      tripId: viaje.id,
    });
  };

  const guardarCalificacion = async ({ rating = 5, comment = '' } = {}) => {
    if (!modalCalificacion.tripId || !modalCalificacion.conductor?.id) return;

    try {
      await tripsService.submitRating({
        trip_id: modalCalificacion.tripId,
        rated_user_id: modalCalificacion.conductor.id,
        role_rated: 'conductor',
        score: rating,
        optional_comment: comment || undefined,
      });
    } catch (err) {
      console.warn('No se pudo registrar la calificación:', err);
    }

    setHistorialPasajero((prev) =>
      prev.map((v) =>
        v.id === modalCalificacion.tripId ? { ...v, rated: true, ratingScore: rating } : v
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

  const handleCrearAlerta = (e) => {
    e.preventDefault();

    let origin = '';
    let destination = '';

    if (nuevoSentido === 'towards') {
      origin = nuevoPuntoEditable || 'Punto de Partida';
      destination = nuevaSedePrincipal;
    } else if (nuevoSentido === 'from') {
      origin = nuevaSedePrincipal;
      destination = nuevoPuntoEditable || 'Punto de Llegada';
    } else {
      origin = nuevaSedePrincipal;
      destination = nuevaSedeDestinoInter;
    }

    addPassengerAlert({
      title: nuevoTitulo || `Rutina ${nuevoSentido === 'towards' ? 'hacia' : 'desde'} ${nuevaSedePrincipal}`,
      days: nuevosDias,
      direction: nuevoSentido,
      target_time: nuevaHora,
      origin,
      destination,
      max_fare_cop: Number(nuevaTarifaMax),
    });

    setModalNuevaAlerta(false);
    setBusquedaLugar('');
    setSugerenciasLugar([]);
  };

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. HEADER CON SELECTOR DE SECCIONES */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black tracking-tight flex items-center gap-2">
          <Navigation className="w-4 h-4 text-lochmara-500" />
          <span>Mis Viajes y Rutinas</span>
        </h2>
        <span className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400 bg-lochmara-500/10 px-2 py-0.5 rounded-full border border-lochmara-500/20">
          Modo Pasajero
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
          onClick={() => setActiveSection('bookings')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            activeSection === 'bookings'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeSection === 'bookings' && (
            <motion.div
              layoutId="passenger-manager-tab"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Reservas ({activePassengerBooking ? 1 : 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('alerts')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            activeSection === 'alerts'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeSection === 'alerts' && (
            <motion.div
              layoutId="passenger-manager-tab"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Smart Match ({smartMatchAlerts.length})</span>
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
              layoutId="passenger-manager-tab"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Historial ({historialPasajero.length})</span>
        </button>
      </div>

      {/* 3. CONTENIDO SEGÚN SECCIÓN */}
      {/* SECCIÓN A: RESERVAS ACTIVAS / PRÓXIMAS */}
      {activeSection === 'bookings' && (
        <div className="space-y-3">
          {activePassengerBooking ? (
            <div
              className={`rounded-3xl p-4 border transition-all space-y-3.5 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              {/* Badge y PIN de Abordaje */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1.5 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cupo Confirmado
                </span>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-500/20 font-mono font-black text-xs">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PIN: {activePassengerBooking.boardingPin || '4829'}</span>
                </div>
              </div>

              {/* Conductor y Vehículo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-lochmara-600/10 text-lochmara-500 flex items-center justify-center font-black text-sm shrink-0 border border-lochmara-500/20">
                    {activePassengerBooking.driverName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black">{activePassengerBooking.driverName}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {activePassengerBooking.vehicle} • <strong className="font-mono text-slate-300">{activePassengerBooking.plate}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-lochmara-500">
                    {activePassengerBooking.fare || '$ 4.500'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold">1 cupo asegurado</p>
                </div>
              </div>

              {/* Corredor y Punto de Recogida */}
              <div className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>Horario de Salida:</span>
                  <span className="text-lochmara-500 font-black">{activePassengerBooking.departureTime || '06:30 AM'}</span>
                </div>
                <div className="flex items-center gap-2 truncate pt-1 border-t dark:border-slate-800/80 border-slate-200/80">
                  <div className="w-2 h-2 rounded-full bg-lochmara-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Recogida:</span>
                  <span className="font-black truncate">{activePassengerBooking.pickup || activePassengerBooking.origin}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Destino:</span>
                  <span className="font-black truncate">{activePassengerBooking.destination}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="flex-1 py-2 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ver en Mapa en Vivo</span>
                </button>

                <button
                  type="button"
                  onClick={cancelPassengerBooking}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-8 rounded-3xl border text-center space-y-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Car className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-black">No tienes ninguna reserva activa.</p>
              <p className="text-[10px] text-slate-400">Busca rutas disponibles en el inicio para reservar tu cupo.</p>
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 rounded-xl bg-lochmara-600 text-white text-xs font-black transition-all cursor-pointer"
              >
                Buscar Viajes Disponibles
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN B: SMART MATCH IA Y ALERTAS RECURRENTES */}
      {activeSection === 'alerts' && (
        <div className="space-y-4">
          {/* 1. COINCIDENCIAS INTELIGENTES EN TIEMPO REAL (SMART MATCH ALERTS) */}
          {smartMatchAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Coincidencias de ruta ({smartMatchAlerts.length})</span>
                </span>
              </div>

              {smartMatchAlerts.map((match) => {
                const isDoorEligible = Boolean(match.is_door_pickup_eligible);
                const meetingPointName = match.meeting_point_name || match.pickup_point || match.pickup || match.origin || 'Punto de Encuentro Cercano';
                const meetingPointFare = match.meeting_point_fare || match.fare || '$ 4.000';
                const doorPickupFare = match.door_pickup_fare || '$ 4.500';
                const walkingMeters = match.walking_distance_meters || 80;
                const walkingMins = match.walking_time_minutes || 1;
                const detourMins = match.additional_detour_minutes || 2;
                const currentModality = isDoorEligible ? (matchModalities[match.id] || 'meeting_point') : 'meeting_point';
                const currentFare = currentModality === 'meeting_point' ? meetingPointFare : doorPickupFare;

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl p-4 border transition-all space-y-3 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white shadow-xl'
                        : 'bg-white border-slate-200 text-slate-900 shadow-md'
                    }`}
                  >
                    {/* Cabecera: Insignia Coincidencia + Días de Coincidencia de Rutina + Descarte */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Coincidencia en ruta</span>
                        </span>

                        {match.is_recurring ? (
                          <div className="flex items-center gap-1.5 bg-lochmara-500/10 border border-lochmara-500/20 px-2 py-0.5 rounded-full">
                            <span className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">Coincide:</span>
                            <div className="flex items-center gap-0.5">
                              {getMatchingDays(match.driver_days).map((dia) => (
                                <span
                                  key={dia}
                                  className="px-1.5 py-0.2 rounded-md bg-lochmara-600 text-white text-[9px] font-black"
                                >
                                  {dia}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold flex items-center gap-1 border border-lochmara-500/20">
                            <Calendar className="w-3 h-3" />
                            <span>{match.scheduled_date}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => dismissSmartMatchAlert(match.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        title="Descartar coincidencia"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Información del Conductor */}
                    <div className="flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border overflow-hidden shadow-xs ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {match.driver_avatar_url ? (
                            <img src={match.driver_avatar_url} alt={match.driver_name} className="w-full h-full object-cover" />
                          ) : (
                            match.driver_avatar_initials || match.driver_name?.charAt(0) || 'C'
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-black truncate text-xs">{match.driver_name}</p>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                              {match.rating} ★
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {match.vehicle} • <strong className="font-mono text-slate-300">{match.plate}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-400">Llegada estimada:</p>
                        <span className="text-xs font-black text-lochmara-600 dark:text-lochmara-400">{match.arrival_time}</span>
                        <p className="text-[9px] text-slate-400 font-bold">{match.available_seats} cupos libres</p>
                      </div>
                    </div>

                    {/* SI ES ELEGIBLE PARA PUERTA A PUERTA: MOSTRAR RECOMENDACIÓN DE RUTA + SELECTOR DE 2 OPCIONES */}
                    {isDoorEligible ? (
                      <>
                        {/* RECOMENDACIÓN DE RUTA (COMERCIAL) */}
                        <div className={`p-2.5 rounded-2xl border text-xs flex items-start gap-2 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <Sparkles className="w-4 h-4 text-lochmara-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                              Recomendación de Ruta
                            </p>
                            <p className="text-[11px] font-medium leading-snug">
                              {match.ai_advisory || 'Caminar al punto de encuentro ahorra dinero y reduce tiempo en tráfico.'}
                            </p>
                          </div>
                        </div>

                        {/* SELECTOR DE MODALIDAD: PUNTO DE ENCUENTRO VS PUERTA A PUERTA */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Modalidad de Abordaje:
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Opción 1: Encuentro */}
                            <button
                              type="button"
                              onClick={() => setMatchModalities({ ...matchModalities, [match.id]: 'meeting_point' })}
                              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                                currentModality === 'meeting_point'
                                  ? 'bg-lochmara-500/10 border-lochmara-500 shadow-2xs'
                                  : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase tracking-wider truncate text-lochmara-600 dark:text-lochmara-400">
                                  Encuentro
                                </span>
                                <span className="text-xs font-black shrink-0 whitespace-nowrap text-emerald-500">
                                  {meetingPointFare}
                                </span>
                              </div>
                              <p className="text-[10px] font-black truncate text-slate-950 dark:text-white">
                                {meetingPointName}
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium">
                                A {walkingMeters}m • {walkingMins} min a pie
                              </p>
                            </button>

                            {/* Opción 2: Recogida */}
                            <button
                              type="button"
                              onClick={() => setMatchModalities({ ...matchModalities, [match.id]: 'door_pickup' })}
                              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                                currentModality === 'door_pickup'
                                  ? 'bg-lochmara-500/10 border-lochmara-500 shadow-2xs'
                                  : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase tracking-wider truncate text-lochmara-600 dark:text-lochmara-400">
                                  Recogida
                                </span>
                                <span className="text-xs font-black shrink-0 whitespace-nowrap text-emerald-500">
                                  {doorPickupFare}
                                </span>
                              </div>
                              <p className="text-[10px] font-black truncate text-slate-950 dark:text-white">
                                En tu dirección
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium">
                                +{detourMins} min tiempo adicional
                              </p>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* SI NO ES ELEGIBLE PARA PUERTA A PUERTA: SOLO TARJETA LIMPIA DE ENCUENTRO */
                      <div className={`p-3 rounded-2xl border text-left space-y-1 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                            Encuentro
                          </span>
                          <span className="text-xs font-black text-emerald-500 shrink-0 whitespace-nowrap">
                            {meetingPointFare}
                          </span>
                        </div>
                        <p className="text-[10px] font-black truncate text-slate-950 dark:text-white">
                          {meetingPointName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          A {walkingMeters}m de tu ubicación • {walkingMins} min a pie
                        </p>
                      </div>
                    )}

                    {/* Botones de Acción de 1-Tap */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => acceptSmartMatchAlert(match.id, currentModality)}
                        className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aceptar Cupo ({currentFare})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          acceptSmartMatchAlert(match.id, currentModality);
                          setActiveTab('map');
                        }}
                        className="px-3 py-2.5 rounded-2xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Ver Ruta</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. TRAYECTOS HABITUALES / ALERTAS RECURRENTES */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black">Tus Rutinas Semanales de Clases</h3>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Te avisamos cuando un conductor publique una ruta compatible
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaAlerta(true)}
                className="px-2.5 py-1.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0 self-start"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva Rutina</span>
              </button>
            </div>

            <div className="space-y-3">
              {recurringPassengerAlerts.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`rounded-3xl p-4 border transition-all space-y-3 ${
                    !alerta.isActive
                      ? 'opacity-60 bg-slate-900/30 border-slate-800/40'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black">{alerta.title}</h4>
                      <p className="text-[10px] text-slate-400">
                        Llegada deseada: {alerta.target_time}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePassengerAlert(alerta.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                          alerta.isActive
                            ? 'bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-500/30'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{alerta.isActive ? 'Alerta Activa' : 'Pausada'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePassengerAlert(alerta.id)}
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
                      const isDiaActivo = alerta.days.includes(dia);
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

                  {/* Corredor Visual Origen / Destino */}
                  <div className={`p-3 rounded-2xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Origen */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500 shrink-0 ring-4 ring-lochmara-500/20 mt-1" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Origen
                        </span>
                        <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                          {alerta.origin}
                        </p>
                      </div>
                    </div>

                    {/* Línea conectora */}
                    <div className="ml-1.25 my-1 w-0.5 h-3 border-l-2 border-dashed border-slate-300 dark:border-slate-700" />

                    {/* Destino */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-500/20 mt-1" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Destino
                        </span>
                        <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                          {alerta.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN C: HISTORIAL DE VIAJES COMPLETADOS */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">
              Registro histórico de tus viajes como pasajero
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

                    <div className="text-right">
                      <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        $ {viaje.farePaid?.toLocaleString('es-CO')}
                      </span>
                      <p className="text-[10px] font-medium text-slate-400">
                        {viaje.vehicle} • {viaje.plate}
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
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border bg-lochmara-500/10 text-lochmara-500 border-lochmara-500/20">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{viaje.driverName}</p>
                              <p className="text-[10px] text-slate-400">
                                {viaje.vehicle} • <strong className="font-mono text-slate-300">{viaje.plate}</strong>
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
                              className="px-3 py-1.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
      )}

      {/* 4. MODAL PARA CREAR NUEVA ALERTA RECURRENTE */}
      <AnimatePresence>
        {modalNuevaAlerta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 border shadow-2xl space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lochmara-500" />
                  <h3 className="text-sm font-black">Nueva Rutina de Clases</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNuevaAlerta(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SELECTOR DE SENTIDO DE VIAJE (Hacia / Desde / Entre Sedes) */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sentido de la Rutina:
                </label>
                <div
                  className={`flex p-1 rounded-2xl border relative ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setNuevoSentido('towards')}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all relative z-10 cursor-pointer text-center ${
                      nuevoSentido === 'towards'
                        ? 'text-white'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {nuevoSentido === 'towards' && (
                      <motion.div
                        layoutId="routine-direction-pill"
                        className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span>Hacia Campus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoSentido('from')}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all relative z-10 cursor-pointer text-center ${
                      nuevoSentido === 'from'
                        ? 'text-white'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {nuevoSentido === 'from' && (
                      <motion.div
                        layoutId="routine-direction-pill"
                        className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span>Desde Campus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoSentido('inter_campus')}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all relative z-10 cursor-pointer text-center ${
                      nuevoSentido === 'inter_campus'
                        ? 'text-white'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {nuevoSentido === 'inter_campus' && (
                      <motion.div
                        layoutId="routine-direction-pill"
                        className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span>Entre Sedes</span>
                  </button>
                </div>
              </div>

              {/* CORREDOR VISUAL ORIGEN / DESTINO */}
              <div className={`p-3 rounded-2xl border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* ORIGEN */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500 ring-4 ring-lochmara-500/20 shrink-0" />
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      Punto de Origen
                    </span>
                  </div>

                  {nuevoSentido === 'from' || nuevoSentido === 'inter_campus' ? (
                    <select
                      value={nuevaSedePrincipal}
                      onChange={(e) => setNuevaSedePrincipal(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-black border cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <option value="Campus El Jardín">Campus El Jardín (UNAB)</option>
                      <option value="Campus El Bosque">Campus El Bosque (UNAB)</option>
                      <option value="CSU Terrazas">CSU Terrazas (UNAB)</option>
                      <option value="La Casona">La Casona (UNAB)</option>
                    </select>
                  ) : (
                    <div className="space-y-1 relative">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1 flex items-center">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                          <input
                            type="text"
                            value={busquedaLugar || nuevoPuntoEditable}
                            onChange={(e) => setBusquedaLugar(e.target.value)}
                            placeholder="¿De dónde sales? Barrio, dirección..."
                            className={`w-full py-1.5 pl-7 pr-7 rounded-xl text-xs font-bold border transition-all focus:outline-hidden ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-lochmara-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-lochmara-500 shadow-2xs'
                            }`}
                          />
                          {buscandoLugar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-lochmara-500 absolute right-2" />
                          ) : (busquedaLugar || nuevoPuntoEditable) ? (
                            <button
                              type="button"
                              onClick={() => { setBusquedaLugar(''); setNuevoPuntoEditable(''); }}
                              className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={aplicarUbicacionCasa}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                            savedHomeLocation
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20'
                          }`}
                          title={savedHomeLocation ? `Usar ${savedHomeLocation.address}` : 'Configurar dirección de Casa'}
                        >
                          <Home className="w-3.5 h-3.5" />
                          <span>Casa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAbrirModalMapa(true)}
                          className="px-2 py-1.5 rounded-xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          title="Seleccionar en el mapa"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Mapa</span>
                        </button>
                      </div>

                      {/* Dropdown de Sugerencias */}
                      {sugerenciasLugar.length > 0 && (
                        <div className={`absolute left-0 right-0 top-full mt-1 rounded-2xl border shadow-xl z-20 max-h-36 overflow-y-auto p-1 space-y-0.5 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          {sugerenciasLugar.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => seleccionarSugerencia(sug)}
                              className={`w-full p-2 text-left rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <MapPin className="w-3 h-3 text-lochmara-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{sug.nombre}</p>
                                <p className="text-[10px] text-slate-400 truncate">{sug.direccion}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Línea conectora */}
                <div className="ml-1 my-0.5 w-0.5 h-2.5 border-l-2 border-dashed border-slate-300 dark:border-slate-700" />

                {/* DESTINO */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0" />
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      Punto de Destino
                    </span>
                  </div>

                  {nuevoSentido === 'towards' ? (
                    <select
                      value={nuevaSedePrincipal}
                      onChange={(e) => setNuevaSedePrincipal(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-black border cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <option value="Campus El Jardín">Campus El Jardín (UNAB)</option>
                      <option value="Campus El Bosque">Campus El Bosque (UNAB)</option>
                      <option value="CSU Terrazas">CSU Terrazas (UNAB)</option>
                      <option value="La Casona">La Casona (UNAB)</option>
                    </select>
                  ) : nuevoSentido === 'inter_campus' ? (
                    <select
                      value={nuevaSedeDestinoInter}
                      onChange={(e) => setNuevaSedeDestinoInter(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-black border cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <option value="Campus El Bosque">Campus El Bosque (UNAB)</option>
                      <option value="Campus El Jardín">Campus El Jardín (UNAB)</option>
                      <option value="CSU Terrazas">CSU Terrazas (UNAB)</option>
                      <option value="La Casona">La Casona (UNAB)</option>
                    </select>
                  ) : (
                    <div className="space-y-1 relative">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1 flex items-center">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                          <input
                            type="text"
                            value={busquedaLugar || nuevoPuntoEditable}
                            onChange={(e) => setBusquedaLugar(e.target.value)}
                            placeholder="¿A dónde te diriges? Barrio, dirección..."
                            className={`w-full py-1.5 pl-7 pr-7 rounded-xl text-xs font-bold border transition-all focus:outline-hidden ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-lochmara-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-lochmara-500 shadow-2xs'
                            }`}
                          />
                          {buscandoLugar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-lochmara-500 absolute right-2" />
                          ) : (busquedaLugar || nuevoPuntoEditable) ? (
                            <button
                              type="button"
                              onClick={() => { setBusquedaLugar(''); setNuevoPuntoEditable(''); }}
                              className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={aplicarUbicacionCasa}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                            savedHomeLocation
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20'
                          }`}
                          title={savedHomeLocation ? `Usar ${savedHomeLocation.address}` : 'Configurar dirección de Casa'}
                        >
                          <Home className="w-3.5 h-3.5" />
                          <span>Casa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAbrirModalMapa(true)}
                          className="px-2 py-1.5 rounded-xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          title="Seleccionar en el mapa"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Mapa</span>
                        </button>
                      </div>

                      {/* Dropdown de Sugerencias */}
                      {sugerenciasLugar.length > 0 && (
                        <div className={`absolute left-0 right-0 top-full mt-1 rounded-2xl border shadow-xl z-20 max-h-36 overflow-y-auto p-1 space-y-0.5 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          {sugerenciasLugar.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => seleccionarSugerencia(sug)}
                              className={`w-full p-2 text-left rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <MapPin className="w-3 h-3 text-lochmara-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{sug.nombre}</p>
                                <p className="text-[10px] text-slate-400 truncate">{sug.direccion}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleCrearAlerta} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre de la Rutina:</label>
                  <input
                    type="text"
                    required
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    placeholder="Ej: Clases 7:00 AM El Jardín"
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Días de Clase:</label>
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
                              ? 'bg-lochmara-600 text-white shadow-2xs'
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
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Llegada deseada:</label>
                    <input
                      type="time"
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Aporte Máximo:</label>
                    <select
                      value={nuevaTarifaMax}
                      onChange={(e) => setNuevaTarifaMax(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="4000">$ 4.000 COP</option>
                      <option value="4500">$ 4.500 COP</option>
                      <option value="5000">$ 5.000 COP</option>
                      <option value="6000">$ 6.000 COP</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-lochmara-600/30"
                >
                  Activar Rutina y Monitoreo Automático
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Selección en Mapa */}
      <LocationPickerModal
        isOpen={abrirModalMapa}
        onClose={() => setAbrirModalMapa(false)}
        onConfirm={confirmarUbicacionMapa}
        onConfirmLocation={(c, dir) => confirmarUbicacionMapa({ address: dir }, dir)}
        initialPlaceName={nuevoPuntoEditable}
        initialAddress={nuevoPuntoEditable}
        title="Ubicar Punto de Rutina en el Mapa"
      />

      {/* Modal de Configuración de Casa si no ha sido guardada */}
      <SetHomeLocationModal
        isOpen={modalConfigurarCasa}
        onClose={() => setModalConfigurarCasa(false)}
        onLocationSaved={(loc) => {
          setNuevoPuntoEditable(loc.address);
          setBusquedaLugar('');
        }}
      />

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
