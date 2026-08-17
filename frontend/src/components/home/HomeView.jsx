import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService } from '../../services/placesApiService';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { CampusSelectorModal } from './CampusSelectorModal';
import { ActiveTripCompactBanner } from './ActiveTripCompactBanner';
import { HomeHeroRouteCard } from './HomeHeroRouteCard';
import { AvailableRideCard } from './AvailableRideCard';
import { Navigation, Car, Building2, Clock } from 'lucide-react';

export const HomeView = () => {
  const {
    user,
    setSelectedSearchRoute,
    activePassengerBooking,
    cancelPassengerBooking,
    setActiveTab,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';

  // 1. Sentido del viaje: 'towards' | 'from' | 'inter_campus'
  const [directionFilter, setDirectionFilter] = useState('towards');

  // 2. Campus Seleccionados y Modal
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

  // 3. Punto Personalizado (Origen si 'towards', Destino si 'from')
  const [editablePointName, setEditablePointName] = useState('');
  const [editableCoords, setEditableCoords] = useState(null);
  const [isSelectingPointOnMap, setIsSelectingPointOnMap] = useState(false);

  // 4. Búsqueda y Sugerencias
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 5. Filtro de Horario del Pasajero (Ventana < 1 hora)
  const [passengerTimeFilter, setPassengerTimeFilter] = useState('');

  // 6. Catálogo Dinámico de Viajes
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
    setEditablePointName(item.name);
    setEditableCoords([item.latitude, item.longitude]);
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
    setEditableCoords([coords.lat, coords.lng]);
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

  // Filtrar viajes disponibles según Modalidad, Sedes y Ventana de Tiempo (< 1 hr)
  const filteredRides = allAvailableRides.filter((ride) => {
    // 1. Filtro por sentido
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

    // 2. Filtro de rango de tiempo (< 1 hora)
    if (passengerTimeFilter) {
      const timeToCheck = directionFilter === 'towards' ? ride.arrival_time : ride.departure_time;
      if (!isWithinOneHour(timeToCheck, passengerTimeFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-3 pb-6 select-none">
      {/* 1. BANNER COMPACTO DE VIAJE ACTIVO */}
      <ActiveTripCompactBanner
        activePassengerBooking={activePassengerBooking}
        isDark={isDark}
        setActiveTab={setActiveTab}
        cancelPassengerBooking={cancelPassengerBooking}
      />

      {/* 2. HERO CARD CON 3 SENTIDOS, CORREDOR Y FILTRO DE HORARIO */}
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
      />

      {/* 3. VIAJES DISPONIBLES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            <span>Viajes Disponibles ({filteredRides.length})</span>
          </h3>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            {passengerTimeFilter ? 'Ventana < 1 hora activa' : 'Rutas Verificadas'}
          </span>
        </div>

        {filteredRides.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredRides.map((ride) => (
              <AvailableRideCard
                key={ride.id}
                ride={ride}
                onSelectRide={handleSelectRide}
                isDark={isDark}
                directionFilter={directionFilter}
              />
            ))}
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border text-center space-y-1.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <Car className="w-6 h-6 mx-auto text-slate-400" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              No hay viajes disponibles para este trayecto u horario.
            </p>
            <p className="text-[10px] text-slate-400">
              {passengerTimeFilter
                ? 'Prueba ampliando el filtro de hora o seleccionando "Todas".'
                : 'Prueba cambiando el sentido o la sede seleccionada.'}
            </p>
          </div>
        )}
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
        initialLocation={editableCoords ? { lat: editableCoords[0], lng: editableCoords[1] } : { lat: 7.1193, lng: -73.1042 }}
        title={directionFilter === 'towards' ? 'Selecciona tu Punto de Partida' : 'Selecciona tu Punto de Llegada'}
        onConfirmLocation={handleLocationPickedOnMap}
      />
    </div>
  );
};
