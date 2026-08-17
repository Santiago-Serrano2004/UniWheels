import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService } from '../../services/placesApiService';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { CampusSelectorModal } from './CampusSelectorModal';
import { ActiveTripCompactBanner } from './ActiveTripCompactBanner';
import { HomeHeroRouteCard } from './HomeHeroRouteCard';
import { AvailableRideCard } from './AvailableRideCard';
import { Navigation, Car, Building2 } from 'lucide-react';

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

  // 1. Sentido del viaje
  const [directionFilter, setDirectionFilter] = useState('towards'); // 'towards' | 'from'

  // 2. Campus Seleccionado y Modal Popup
  const [selectedCampus, setSelectedCampus] = useState('Campus El Jardín');
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

  // 3. Punto Editable (Origen si directionFilter==='towards', Destino si directionFilter==='from')
  const [editablePointName, setEditablePointName] = useState('');
  const [editableCoords, setEditableCoords] = useState(null);
  const [isSelectingPointOnMap, setIsSelectingPointOnMap] = useState(false);

  // 4. Búsqueda y Sugerencias
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 5. Lista de Viajes
  const [allAvailableRides] = useState([
    {
      id: 'ride_101',
      driver_name: 'Carlos Mendoza',
      vehicle: 'Mazda 3 (Rojo)',
      plate: 'KLU-492',
      rating: 4.95,
      origin: 'Cañaveral - C.C. Cañaveral',
      destination: 'Campus El Jardín',
      departure_time: '06:45 AM',
      available_seats: 3,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+4 min',
      driver_avatar_initials: 'CM',
    },
    {
      id: 'ride_102',
      driver_name: 'Valentina Ríos',
      vehicle: 'Chevrolet Onix (Gris)',
      plate: 'WYX-810',
      rating: 4.88,
      origin: 'Cabecera - Parque San Pío',
      destination: 'CSU — Centro de Servicios Universitarios',
      departure_time: '07:15 AM',
      available_seats: 2,
      fare: '$ 4.000',
      fare_cop: 4000,
      detour_minutes: '+2 min',
      driver_avatar_initials: 'VR',
    },
    {
      id: 'ride_103',
      driver_name: 'Juan Pablo Duarte',
      vehicle: 'Renault Duster (Blanco)',
      plate: 'LMN-304',
      rating: 4.92,
      origin: 'Provenza - Estación Metrolínea',
      destination: 'Campus El Bosque',
      departure_time: '06:30 AM',
      available_seats: 4,
      fare: '$ 4.500',
      fare_cop: 4500,
      detour_minutes: '+3 min',
      driver_avatar_initials: 'JD',
    },
    {
      id: 'ride_104',
      driver_name: 'Mateo Silva',
      vehicle: 'Yamaha MT-03 (Negro)',
      plate: 'WTR-82F',
      rating: 4.97,
      origin: 'Piedecuesta - Centro',
      destination: 'Campus El Jardín',
      departure_time: '06:15 AM',
      available_seats: 1,
      fare: '$ 3.500',
      fare_cop: 3500,
      detour_minutes: '+1 min',
      driver_avatar_initials: 'MS',
    },
  ]);

  // Cargar sedes dinámicas desde la API institucional
  useEffect(() => {
    authService.getInstitutions().then((res) => {
      const campuses = Array.isArray(res) ? res[0]?.campuses : res?.data?.[0]?.campuses;
      if (campuses && campuses.length > 0) {
        setSedesDisponibles(campuses);
      }
    }).catch(() => {});
  }, []);

  // Búsqueda de lugares reactiva con debounce de 300ms
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

  const handleSelectCampus = (sede) => {
    setSelectedCampus(sede.name);
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
      departureTime: ride.departure_time,
      availableSeats: ride.available_seats,
      fare: ride.fare,
      fare_cop: ride.fare_cop,
    });
    setActiveTab('map');
  };

  // Filtrar viajes según el campus seleccionado y el sentido
  const filteredRides = allAvailableRides.filter((ride) => {
    const campusKey = selectedCampus.toLowerCase().replace('campus ', '');
    if (directionFilter === 'towards') {
      return ride.destination.toLowerCase().includes(campusKey);
    } else {
      return ride.origin.toLowerCase().includes(campusKey);
    }
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

      {/* 2. HERO CARD: CORREDOR ORIGEN-DESTINO CON BÚSQUEDA Y SELECTOR DE CAMPUS INTEGRADOS */}
      <HomeHeroRouteCard
        user={user}
        isDark={isDark}
        directionFilter={directionFilter}
        setDirectionFilter={setDirectionFilter}
        selectedCampus={selectedCampus}
        onOpenCampusModal={() => setIsCampusModalOpen(true)}
        sedesDisponibles={sedesDisponibles}
        editablePointName={editablePointName}
        setIsSelectingPointOnMap={setIsSelectingPointOnMap}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={suggestions}
        isSearching={isSearching}
        handleSelectSuggestion={handleSelectSuggestion}
      />

      {/* 3. VIAJES DISPONIBLES (INMEDIATAMENTE VISIBLES ABOVE THE FOLD) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            <span>Viajes Disponibles ({filteredRides.length})</span>
          </h3>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Rutas Verificadas</span>
        </div>

        {filteredRides.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredRides.map((ride) => (
              <AvailableRideCard
                key={ride.id}
                ride={ride}
                onSelectRide={handleSelectRide}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border text-center space-y-1.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <Car className="w-6 h-6 mx-auto text-slate-400" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              No hay conductores saliendo hacia {selectedCampus} en este momento.
            </p>
            <p className="text-[10px] text-slate-400">
              Prueba seleccionando otra sede o publicando tu propia ruta si tienes vehículo.
            </p>
          </div>
        )}
      </section>

      {/* 4. MODAL POP-UP DE SELECCIÓN DINÁMICA DE SEDES */}
      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
        sedesDisponibles={sedesDisponibles}
        selectedCampus={selectedCampus}
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
