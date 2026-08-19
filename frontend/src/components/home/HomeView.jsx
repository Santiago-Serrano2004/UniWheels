import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService } from '../../services/placesApiService';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { CampusSelectorModal } from './CampusSelectorModal';
import { HomeHeroRouteCard } from './HomeHeroRouteCard';
import { AvailableRideCard } from './AvailableRideCard';
import { Navigation, Car, Sparkles, CheckCircle2, X, Calendar } from 'lucide-react';

export const HomeView = () => {
  const {
    user,
    setSelectedSearchRoute,
    activePassengerBooking,
    cancelPassengerBooking,
    smartMatchAlerts,
    recurringPassengerAlerts,
    acceptSmartMatchAlert,
    dismissSmartMatchAlert,
    setActiveTab,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';

  // Días que coinciden entre la ruta del conductor y las rutinas del pasajero
  const passengerDaysSet = useMemo(() => {
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

  // Fechas de referencia dinámica (Hoy y Mañana)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Sentido del viaje: 'towards' | 'from' | 'inter_campus'
  const [directionFilter, setDirectionFilter] = useState('towards');

  // Modalidad seleccionada en Smart Match ('meeting_point' | 'door_pickup')
  const [smartMatchModality, setSmartMatchModality] = useState('meeting_point');

  // 2. Programación de Fecha: 'todayStr', 'tomorrowStr', o 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 3. Campus Seleccionados y Modal
  const [selectedCampus, setSelectedCampus] = useState('Campus El Jardín');
  const [selectedDestinationCampus, setSelectedDestinationCampus] = useState('Campus El Bosque');
  const [modalCampusTarget, setModalCampusTarget] = useState('origin'); // 'origin' | 'destination'
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  const [sedesDisponibles, setSedesDisponibles] = useState([
    {
      id: 1,
      name: 'Campus El Jardín',
      code: 'JARDIN',
      address: 'Avenida 42 No. 48 - 11, Bucaramanga',
      image_url: '/assets/institutions/campuses/el-jardin.webp',
      latitude: 7.119346,
      longitude: -73.104278,
      is_main_campus: true,
    },
    {
      id: 2,
      name: 'Campus El Bosque',
      code: 'BOSQUE',
      address: 'Calle 158 No. 20 - 40, Cañaveral, Floridablanca',
      image_url: '/assets/institutions/campuses/el-bosque.webp',
      latitude: 7.066491,
      longitude: -73.103789,
      is_main_campus: false,
    },
    {
      id: 3,
      name: 'CSU — Centro de Servicios Universitarios',
      code: 'CSU',
      address: 'Carrera 45 No. 44 - 15, Terrazas, Bucaramanga',
      image_url: '/assets/institutions/campuses/csu.webp',
      latitude: 7.113821,
      longitude: -73.106842,
      is_main_campus: false,
    },
    {
      id: 4,
      name: 'Campus La Casona',
      code: 'CASONA',
      address: 'Calle 42 No. 34 - 14, Bucaramanga',
      image_url: '/assets/institutions/campuses/la-casona.webp',
      latitude: 7.118210,
      longitude: -73.116520,
      is_main_campus: false,
    },
  ]);

  // 4. Punto Personalizado (Origen si 'towards', Destino si 'from')
  const [editablePointName, setEditablePointName] = useState('');
  const [editableCoords, setEditableCoords] = useState(null);
  const [isSelectingPointOnMap, setIsSelectingPointOnMap] = useState(false);

  // 5. Búsqueda y Sugerencias
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 6. Filtro de Horario del Pasajero (Ventana < 1 hora)
  const [passengerTimeFilter, setPassengerTimeFilter] = useState('');

  // 7. Catálogo Dinámico de Viajes (Con soporte multi-día y recurrencia)
  const [allAvailableRides] = useState([
    {
      id: 'ride_101',
      driver_name: 'Carlos Mendoza',
      vehicle: 'Mazda 3 (Rojo)',
      plate: 'KLU-492',
      rating: 4.95,
      direction: 'towards',
      origin: 'Cañaveral - C.C. Cañaveral',
      destination: 'Campus El Jardín',
      meeting_point: null,
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '06:30 AM',
      arrival_time: '06:55 AM',
      available_seats: 3,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+3 min',
      is_detour_feasible: true,
      is_direct: false,
      driver_avatar_initials: 'CM',
    },
    {
      id: 'ride_102',
      driver_name: 'Valentina Ríos',
      vehicle: 'Chevrolet Onix (Gris)',
      plate: 'WYX-810',
      rating: 4.88,
      direction: 'towards',
      origin: 'Cabecera - Parque San Pío',
      destination: 'CSU — Centro de Servicios Universitarios',
      meeting_point: null,
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '07:05 AM',
      arrival_time: '07:20 AM',
      available_seats: 2,
      fare: '$ 4.000',
      fare_cop: 4000,
      detour_minutes: '+0 min',
      is_detour_feasible: true,
      is_direct: true,
      driver_avatar_initials: 'VR',
    },
    {
      id: 'ride_103',
      driver_name: 'Juan Pablo Duarte',
      vehicle: 'Renault Duster (Blanco)',
      plate: 'LMN-304',
      rating: 4.92,
      direction: 'from',
      origin: 'Campus El Jardín',
      destination: 'Provenza - Estación Metrolínea',
      meeting_point: 'Portería Principal Calle 48',
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '05:15 PM',
      arrival_time: '05:40 PM',
      available_seats: 4,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+4 min',
      is_detour_feasible: true,
      is_direct: false,
      driver_avatar_initials: 'JD',
    },
    {
      id: 'ride_104',
      driver_name: 'Mateo Silva',
      vehicle: 'Yamaha MT-03 (Negro)',
      plate: 'WTR-82F',
      rating: 4.97,
      direction: 'towards',
      origin: 'Piedecuesta - Centro',
      destination: 'Campus El Jardín',
      meeting_point: null,
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '06:10 AM',
      arrival_time: '06:45 AM',
      available_seats: 1,
      fare: '$ 3.500',
      fare_cop: 3500,
      detour_minutes: '+1 min',
      is_detour_feasible: true,
      is_direct: false,
      driver_avatar_initials: 'MS',
    },
    {
      id: 'ride_105',
      driver_name: 'Laura Gómez',
      vehicle: 'Kia Picanto (Plateado)',
      plate: 'HWP-931',
      rating: 4.96,
      direction: 'inter_campus',
      origin: 'Campus El Jardín',
      destination: 'Campus El Bosque',
      meeting_point: 'Bahía de Parqueadero Edificio Central',
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '11:30 AM',
      arrival_time: '11:55 AM',
      available_seats: 3,
      fare: '$ 3.500',
      fare_cop: 3500,
      detour_minutes: '+0 min',
      is_detour_feasible: true,
      is_direct: true,
      driver_avatar_initials: 'LG',
    },
    {
      id: 'ride_106',
      driver_name: 'Andrés Felipe Correa',
      vehicle: 'Chevrolet Spark GT (Azul)',
      plate: 'USK-412',
      rating: 4.89,
      direction: 'inter_campus',
      origin: 'Campus El Bosque',
      destination: 'Campus El Jardín',
      meeting_point: 'Portería Principal Cañaveral',
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '01:45 PM',
      arrival_time: '02:10 PM',
      available_seats: 2,
      fare: '$ 3.500',
      fare_cop: 3500,
      detour_minutes: '+0 min',
      is_detour_feasible: true,
      is_direct: true,
      driver_avatar_initials: 'AC',
    },
    {
      id: 'ride_107',
      driver_name: 'Diana Marcela Torres',
      vehicle: 'Suzuki Swift (Blanco)',
      plate: 'RZT-155',
      rating: 4.93,
      direction: 'from',
      origin: 'Campus El Bosque',
      destination: 'Cabecera del Llano',
      meeting_point: 'Kiosco Cafetería Central',
      scheduled_date: todayStr,
      is_recurring_daily: true,
      departure_time: '06:00 PM',
      arrival_time: '06:30 PM',
      available_seats: 3,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+2 min',
      is_detour_feasible: true,
      is_direct: false,
      driver_avatar_initials: 'DT',
    },
    {
      id: 'ride_108',
      driver_name: 'Santiago Serrano',
      vehicle: 'Mazda CX-30 (Gris)',
      plate: 'GHT-921',
      rating: 5.0,
      direction: 'towards',
      origin: 'Girón - Casco Antiguo',
      destination: 'Campus El Jardín',
      meeting_point: null,
      scheduled_date: tomorrowStr,
      is_recurring_daily: true,
      departure_time: '06:15 AM',
      arrival_time: '06:50 AM',
      available_seats: 3,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+2 min',
      is_detour_feasible: true,
      is_direct: false,
      driver_avatar_initials: 'SS',
    },
    {
      id: 'ride_109',
      driver_name: 'Natalia Castro',
      vehicle: 'Renault Kwid (Naranja)',
      plate: 'KPB-714',
      rating: 4.94,
      direction: 'from',
      origin: 'Campus El Jardín',
      destination: 'Floridablanca - Cañaveral',
      meeting_point: 'Portería Principal Calle 48',
      scheduled_date: tomorrowStr,
      is_recurring_daily: true,
      departure_time: '06:15 PM',
      arrival_time: '06:45 PM',
      available_seats: 2,
      fare: '$ 4.000',
      fare_cop: 4000,
      detour_minutes: '+0 min',
      is_detour_feasible: true,
      is_direct: true,
      driver_avatar_initials: 'NC',
    },
  ]);

  // Cargar sedes dinámicas
  useEffect(() => {
    authService.getInstitutions().then((res) => {
      const campuses = Array.isArray(res) ? res[0]?.campuses : res?.data?.[0]?.campuses;
      if (campuses && campuses.length > 0) {
        setSedesDisponibles(campuses);
      }
    }).catch(() => {});
  }, []);

  // Búsqueda reactiva con debounce de 300ms
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await placesApiService.searchPlaces(searchQuery);
        setSuggestions(results.slice(0, 5));
      } catch (e) {
        console.warn('Error en búsqueda de lugares:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    if (!item) return;
    const name = item.nombre || item.name || item.direccion || item.address || 'Ubicación seleccionada';
    const coords = item.coords || [item.latitude || item.lat, item.longitude || item.lng || item.lon];
    setEditablePointName(name);
    setEditableCoords([Number(coords[0]), Number(coords[1])]);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleOpenCampusModal = (target = 'origin') => {
    setModalCampusTarget(target);
    setIsCampusModalOpen(true);
  };

  const handleSelectCampus = (sede) => {
    if (modalCampusTarget === 'origin') {
      setSelectedCampus(sede.name);
    } else {
      setSelectedDestinationCampus(sede.name);
    }
  };

  const handleLocationPickedOnMap = (coords, addressName) => {
    const lat = Number(Array.isArray(coords) ? coords[0] : coords?.lat);
    const lng = Number(Array.isArray(coords) ? coords[1] : (coords?.lng ?? coords?.lon));
    setEditableCoords([lat, lng]);
    setEditablePointName(addressName || 'Punto Seleccionado en Mapa');
    setSearchQuery('');
    setIsSelectingPointOnMap(false);
  };

  const handleSelectRide = (ride) => {
    setSelectedSearchRoute({
      id: ride.id,
      driverName: ride.driver_name,
      vehicle: ride.vehicle,
      plate: ride.plate,
      origin: ride.origin,
      destination: ride.destination,
      meeting_point: ride.meeting_point,
      scheduled_date: ride.scheduled_date || selectedDate,
      departureTime: ride.departure_time,
      arrivalTime: ride.arrival_time,
      availableSeats: ride.available_seats,
      fare: ride.fare,
      fare_cop: ride.fare_cop,
    });
    setActiveTab('map');
  };

  // Convertir string de hora (ej: "06:45 AM", "17:15") a minutos desde medianoche
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parts = clean.replace(/(AM|PM)/, '').trim().split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Validación de ventana de tiempo (< 1 hora = 60 minutos)
  const isWithinOneHour = (rideTimeStr, targetTimeStr) => {
    if (!targetTimeStr) return true;
    const rideMins = parseTimeToMinutes(rideTimeStr);
    const targetMins = parseTimeToMinutes(targetTimeStr);
    if (rideMins === null || targetMins === null) return true;
    const diff = Math.abs(rideMins - targetMins);
    return diff <= 60;
  };

  // Filtrar viajes disponibles según Fecha Programada, Modalidad, Sedes y Ventana de Tiempo (< 1 hr)
  const filteredRides = allAvailableRides.filter((ride) => {
    // 1. Filtro por Fecha (Coincidencia de fecha específica o rutas rutinarias recurrentes)
    if (selectedDate) {
      const matchExactDate = ride.scheduled_date === selectedDate;
      const isRecurring = Boolean(ride.is_recurring_daily);
      if (!matchExactDate && !isRecurring) {
        return false;
      }
    }

    // 2. Filtro por sentido
    if (directionFilter === 'towards') {
      if (ride.direction !== 'towards') return false;
      const campusKey = selectedCampus.toLowerCase().replace('campus ', '');
      if (!ride.destination.toLowerCase().includes(campusKey)) return false;
    } else if (directionFilter === 'from') {
      if (ride.direction !== 'from') return false;
      const campusKey = selectedCampus.toLowerCase().replace('campus ', '');
      if (!ride.origin.toLowerCase().includes(campusKey)) return false;
    } else if (directionFilter === 'inter_campus') {
      if (ride.direction !== 'inter_campus') return false;
      const originKey = selectedCampus.toLowerCase().replace('campus ', '');
      const destKey = selectedDestinationCampus.toLowerCase().replace('campus ', '');
      if (!ride.origin.toLowerCase().includes(originKey) || !ride.destination.toLowerCase().includes(destKey)) {
        return false;
      }
    }

    // 3. Filtro de rango de tiempo (< 1 hora)
    if (passengerTimeFilter) {
      const timeToCheck = directionFilter === 'towards' ? ride.arrival_time : ride.departure_time;
      if (!isWithinOneHour(timeToCheck, passengerTimeFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden select-none">
      {/* SECCIÓN SUPERIOR ESTÁTICA / FIJA */}
      <div className="shrink-0 space-y-2 pb-1">
        {/* 1. BANNER PROACTIVO DE COINCIDENCIA EN RUTA */}
        {!activePassengerBooking && smartMatchAlerts && smartMatchAlerts.length > 0 && (() => {
          const activeMatch = smartMatchAlerts[0];
          const isDoorEligible = Boolean(activeMatch.is_door_pickup_eligible);
          const meetingPointName = activeMatch.meeting_point_name || activeMatch.pickup_point || activeMatch.pickup || activeMatch.origin || 'Punto de Encuentro Cercano';
          const meetingPointFare = activeMatch.meeting_point_fare || activeMatch.fare || '$ 4.000';
          const doorPickupFare = activeMatch.door_pickup_fare || '$ 4.500';
          const walkingMeters = activeMatch.walking_distance_meters || 80;
          const walkingMins = activeMatch.walking_time_minutes || 1;
          const detourMins = activeMatch.additional_detour_minutes || 2;
          const effectiveModality = isDoorEligible ? smartMatchModality : 'meeting_point';
          const effectiveFare = effectiveModality === 'meeting_point' ? meetingPointFare : doorPickupFare;

          return (
            <div
              className={`rounded-3xl p-4 border transition-all space-y-3 relative overflow-hidden ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xl'
                  : 'bg-white border-slate-200 text-slate-900 shadow-md'
              }`}
            >
              {/* Cabecera: Insignia Coincidencia + Días de Coincidencia de Rutina + Descarte */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1.5 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Coincidencia en ruta</span>
                  </span>

                  {activeMatch.is_recurring ? (
                    <div className="flex items-center gap-1.5 bg-lochmara-500/10 border border-lochmara-500/20 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">Coincide:</span>
                      <div className="flex items-center gap-0.5">
                        {getMatchingDays(activeMatch.driver_days).map((dia) => (
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
                    <span className="text-[10px] text-slate-400 font-bold">Viaje único hoy</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismissSmartMatchAlert(activeMatch.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Descartar sugerencia"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conductor y Horarios */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 flex items-center justify-center text-lochmara-500 font-black text-xs shrink-0 overflow-hidden">
                    {activeMatch.driver_avatar ? (
                      <img src={activeMatch.driver_avatar} alt={activeMatch.driver_name} className="w-full h-full object-cover" />
                    ) : (
                      activeMatch.driver_avatar_initials || 'CD'
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-black truncate text-xs">{activeMatch.driver_name}</p>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                        {activeMatch.rating} ★
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {activeMatch.vehicle} • <strong className="font-mono text-slate-300">{activeMatch.plate}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">Llegada estimada:</p>
                  <span className="text-xs font-black text-lochmara-600 dark:text-lochmara-400">{activeMatch.arrival_time}</span>
                  <p className="text-[9px] text-slate-400 font-bold">{activeMatch.available_seats} cupos libres</p>
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
                        {activeMatch.ai_advisory || 'Caminar al punto de encuentro ahorra dinero y reduce tiempo en tráfico.'}
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
                        onClick={() => setSmartMatchModality('meeting_point')}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                          smartMatchModality === 'meeting_point'
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
                        onClick={() => setSmartMatchModality('door_pickup')}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                          smartMatchModality === 'door_pickup'
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

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => acceptSmartMatchAlert(activeMatch.id, effectiveModality)}
                  className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Aceptar Cupo ({effectiveFare})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-3 py-2.5 rounded-2xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-xs font-black transition-all cursor-pointer shrink-0"
                >
                  Ver Todas ({smartMatchAlerts.length})
                </button>
              </div>
            </div>
          );
        })()}

        {/* 2. HERO CARD CON 3 SENTIDOS, CORREDOR, SELECTOR DE DÍA Y HORA */}
        <HomeHeroRouteCard
          user={user}
          isDark={isDark}
          directionFilter={directionFilter}
          setDirectionFilter={setDirectionFilter}
          selectedCampus={selectedCampus}
          selectedDestinationCampus={selectedDestinationCampus}
          onOpenCampusModal={handleOpenCampusModal}
          editablePointName={editablePointName}
          setIsSelectingPointOnMap={setIsSelectingPointOnMap}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestions={suggestions}
          isSearching={isSearching}
          handleSelectSuggestion={handleSelectSuggestion}
          passengerTimeFilter={passengerTimeFilter}
          setPassengerTimeFilter={setPassengerTimeFilter}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
        />
      </div>

      {/* 3. SECCIÓN ESCROLEABLE: VIAJES DISPONIBLES */}
      <section className="flex-1 min-h-0 flex flex-col space-y-2 mt-1">
        {/* Cabecera fija de la lista */}
        <div className="shrink-0 flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            <span>Viajes Disponibles ({filteredRides.length})</span>
          </h3>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            {selectedDate === tomorrowStr ? 'Programados para Mañana' : passengerTimeFilter ? 'Ventana < 1h activa' : 'Rutas Verificadas'}
          </span>
        </div>

        {/* Contenedor escroleable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-2.5 pb-6">
          {filteredRides.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredRides.map((ride) => (
                <AvailableRideCard
                  key={ride.id}
                  ride={ride}
                  onSelectRide={handleSelectRide}
                  isDark={isDark}
                  directionFilter={directionFilter}
                  selectedDate={selectedDate}
                  todayStr={todayStr}
                  tomorrowStr={tomorrowStr}
                />
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-3xl border text-center space-y-2 transition-colors ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 text-lochmara-500 flex items-center justify-center mx-auto">
                <Car className="w-5 h-5" />
              </div>
              <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ¡Pronto habrá nuevos viajes disponibles!
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Los conductores universitarios publican rutas continuamente. Te notificaremos en cuanto haya un cupo ideal para tu horario y destino.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. MODAL POP-UP DE SELECCIÓN DINÁMICA DE SEDES */}
      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
        sedesDisponibles={sedesDisponibles}
        selectedCampus={modalCampusTarget === 'origin' ? selectedCampus : selectedDestinationCampus}
        onSelectCampus={handleSelectCampus}
        isDark={isDark}
        institutionName={user?.institution?.name || user?.institution || 'Universidad Autónoma de Bucaramanga'}
      />

      {/* 5. MODAL DE SELECCIÓN EN MAPA */}
      <LocationPickerModal
        isOpen={isSelectingPointOnMap}
        onClose={() => setIsSelectingPointOnMap(false)}
        initialCoords={editableCoords}
        initialPlaceName={editablePointName}
        title={directionFilter === 'towards' ? 'Selecciona tu Punto de Partida' : 'Selecciona tu Punto de Llegada'}
        onConfirm={handleLocationPickedOnMap}
        onConfirmLocation={handleLocationPickedOnMap}
      />
    </div>
  );
};
