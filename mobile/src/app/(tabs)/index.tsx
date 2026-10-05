import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Search,
  X,
  Building2,
  ChevronRight,
  Navigation,
  Car,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Home,
  MapPin,
  Power,
  Plus,
} from 'lucide-react-native';
import { authService, fechaColombiaStr, fechaLocalStr, placesApiService, routesService, tripLifecycleService, useAppStore } from '@uniwheels/shared';
import { CampusSelectorModal, type Campus } from '@/components/CampusSelectorModal';
import { SetHomeLocationModal } from '@/components/SetHomeLocationModal';
import { LocationPickerModal } from '@/components/LocationPickerModal';
import { AnimatedSegmentedControl } from '@/components/AnimatedSegmentedControl';
import { ActiveRoleConflictBlocker } from '@/components/ActiveRoleConflictBlocker';
import { DriverOnboardingView } from '@/components/driver/DriverOnboardingView';
import { DriverCockpitCard } from '@/components/driver/DriverCockpitCard';
import { DriverRoutePublishForm } from '@/components/driver/DriverRoutePublishForm';
import { InAppGpsNavigator } from '@/components/driver/InAppGpsNavigator';
import { CancelTripPenaltyModal } from '@/components/driver/CancelTripPenaltyModal';
import { PassengerActiveTripCard } from '@/components/PassengerActiveTripCard';
import { usePassengerBookingSync } from '@/hooks/usePassengerBookingSync';
import { useDriverRoutesSync } from '@/hooks/useDriverRoutesSync';

const CAMPUS_COORDINATES: Record<string, [number, number]> = {
  'Campus El Jardín': [7.1166, -73.1054],
  'Campus El Bosque': [7.066491, -73.103789],
  'CSU — Centro de Servicios Universitarios': [7.113821, -73.106842],
  'Campus La Casona': [7.118210, -73.116520],
};

const DEFAULT_CAMPUSES: Campus[] = [
  { id: 1, name: 'Campus El Jardín' },
  { id: 2, name: 'Campus El Bosque' },
  { id: 3, name: 'CSU — Centro de Servicios Universitarios' },
  { id: 4, name: 'Campus La Casona' },
];

const todayStr = () => fechaColombiaStr();
// Colombia no tiene horario de verano: sumar 24 h equivale a un dia calendario.
const tomorrowStr = () => fechaColombiaStr(new Date(Date.now() + 24 * 60 * 60 * 1000));
const formatCustomDateLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

// Mismo cálculo que frontend/src/components/home/HomeView.jsx — convierte
// "06:45 AM" / "17:15" a minutos desde medianoche para comparar ventanas.
const parseTimeToMinutes = (timeStr?: string | null) => {
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
const isWithinOneHour = (rideTimeStr: string | null | undefined, targetTimeStr: string) => {
  if (!targetTimeStr) return true;
  const rideMins = parseTimeToMinutes(rideTimeStr);
  const targetMins = parseTimeToMinutes(targetTimeStr);
  if (rideMins === null || targetMins === null) return true;
  return Math.abs(rideMins - targetMins) <= 60;
};

export default function HomeScreen() {
  const user = useAppStore((state) => state.user);
  const activeRole = useAppStore((state) => state.activeRole);
  const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);
  const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
  const toggleRole = useAppStore((state) => state.toggleRole);
  const setSelectedSearchRoute = useAppStore((state) => state.setSelectedSearchRoute);
  const savedHomeLocation = useAppStore((state) => state.savedHomeLocation);
  const publishedDriverTrips = useAppStore((state) => state.publishedDriverTrips);
  const recurringDriverTrips = useAppStore((state) => state.recurringDriverTrips);
  const finishActiveDriverTrip = useAppStore((state) => state.finishActiveDriverTrip);
  // Rutas y pasajeros reales del conductor desde el servidor (no solo memoria local).
  usePassengerBookingSync(activeRole === 'passenger');
  const { sincronizar: sincronizarRutasConductor } = useDriverRoutesSync(activeRole === 'driver' && Boolean(user?.isDriver));
  const startPublishedTrip = useAppStore((state) => state.startPublishedTrip);
  const cancelPublishedTrip = useAppStore((state) => state.cancelPublishedTrip);
  const toggleRecurringDriverTrip = useAppStore((state) => state.toggleRecurringDriverTrip);

  const [showPublishForm, setShowPublishForm] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [direction, setDirection] = useState<'towards' | 'from' | 'inter_campus'>('towards');
  const [campuses, setCampuses] = useState<Campus[]>(DEFAULT_CAMPUSES);
  const [selectedCampus, setSelectedCampus] = useState('Campus El Jardín');
  const [selectedOriginCampus, setSelectedOriginCampus] = useState(user?.campus?.name || 'Campus El Jardín');
  const [selectedDestinationCampus, setSelectedDestinationCampus] = useState('Campus El Bosque');
  const [campusModalTarget, setCampusModalTarget] = useState<'origin' | 'destination'>('destination');
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passengerTimeFilter, setPassengerTimeFilter] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [editablePointName, setEditablePointName] = useState('');
  const [editableCoords, setEditableCoords] = useState<[number, number] | null>(null);
  // Punto de recogida usado en la última búsqueda: se pasa a la vista previa del viaje.
  const ultimoPickupRef = useRef<[number, number] | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const [rawMatches, setRawMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [searchErrorMsg, setSearchErrorMsg] = useState('');

  // Sedes reales (mismo catálogo que consume la web vía authService.getInstitutions)
  useEffect(() => {
    authService.getInstitutions().then((res: any) => {
      const list = Array.isArray(res) ? res[0]?.campuses : res?.data?.[0]?.campuses;
      if (list?.length) setCampuses(list);
    });
  }, []);

  const campusIdByName = useMemo(() => {
    const map: Record<string, number> = {};
    campuses.forEach((c) => (map[c.name] = c.id));
    return map;
  }, [campuses]);

  // Búsqueda real contra route-matching-service (PostGIS + IA + TomTom) para todas las modalidades
  useEffect(() => {
    let pickup: [number, number];
    let destCampusId: number;

    if (direction === 'towards') {
      pickup = editableCoords || [7.0678, -73.1066]; // Cañaveral (AMB) por defecto
      destCampusId = campusIdByName[selectedCampus] || 1;
    } else if (direction === 'from') {
      const originCampus = campuses.find((c) => c.name === selectedOriginCampus);
      pickup = originCampus?.latitude && originCampus?.longitude
        ? [Number(originCampus.latitude), Number(originCampus.longitude)]
        : CAMPUS_COORDINATES[selectedOriginCampus] || [7.1166, -73.1054];
      destCampusId = campusIdByName[selectedOriginCampus] || 1;
    } else {
      // inter_campus
      const originCampus = campuses.find((c) => c.name === selectedOriginCampus);
      pickup = originCampus?.latitude && originCampus?.longitude
        ? [Number(originCampus.latitude), Number(originCampus.longitude)]
        : CAMPUS_COORDINATES[selectedOriginCampus] || [7.1166, -73.1054];
      destCampusId = campusIdByName[selectedDestinationCampus] || 2;
    }

    ultimoPickupRef.current = pickup;
    const timer = setTimeout(async () => {
      setIsLoadingMatches(true);
      setSearchErrorMsg('');
      try {
        const results = await routesService.searchMatches(
          pickup[0],
          pickup[1],
          destCampusId,
          passengerTimeFilter || null
        );
        setRawMatches(results);
      } catch {
        setSearchErrorMsg('No se pudo conectar con el buscador de rutas. Intenta nuevamente.');
      } finally {
        setIsLoadingMatches(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    direction,
    selectedCampus,
    selectedOriginCampus,
    selectedDestinationCampus,
    editableCoords,
    campusIdByName,
    passengerTimeFilter,
    campuses,
  ]);

  // Adaptar el contrato del backend al shape que consume la tarjeta de resultado.
  const rides = useMemo(() => {
    return rawMatches.map((match) => {
      const vehicleDesc = [match.vehicle_description, match.vehicle_color ? `(${match.vehicle_color})` : null]
        .filter(Boolean)
        .join(' ');
      const arrivalTime = match.estimated_arrival_time
        ? new Date(match.estimated_arrival_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
        : null;
      return {
        id: match.route_id,
        driver_name: match.driver_name,
        driver_avatar_initials: match.driver_avatar_initials,
        vehicle: vehicleDesc || null,
        plate: match.vehicle_plate,
        origin: match.origin_name,
        destination: match.destination_campus_name,
        scheduled_date: match.departure_timestamp ? match.departure_timestamp.split('T')[0] : todayStr(),
        departure_time: match.scheduled_departure_time,
        arrival_time: arrivalTime,
        available_seats: match.available_seats,
        fare: `$ ${Number(match.suggested_fare_cop || 0).toLocaleString('es-CO')}`,
        fare_cop: match.suggested_fare_cop,
        detour_minutes: match.detour_label,
        is_detour_feasible: match.is_viable !== false,
        is_direct: match.modality === 'modalidad_1_directa',
      };
    });
  }, [rawMatches]);

  const filteredRides = rides.filter((r) => {
    if (selectedDate && r.scheduled_date && r.scheduled_date !== selectedDate) return false;
    if (passengerTimeFilter) {
      const timeToCheck = direction === 'towards' ? r.arrival_time : r.departure_time;
      if (!isWithinOneHour(timeToCheck, passengerTimeFilter)) return false;
    }
    return true;
  });

  // Búsqueda de lugares con debounce (mismo patrón que la web).
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const results = await placesApiService.searchPlaces(searchQuery);
        setSuggestions(results.slice(0, 5));
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const completarViaje = async () => {
    const tripId = activeDriverTrip?.id || activeDriverTrip?.route_id;
    if (tripId) {
      try {
        await tripLifecycleService.completeTrip(tripId);
      } catch (err) {
        console.warn('Notice from completeTrip:', err);
      }
    }
    finishActiveDriverTrip();
    Alert.alert('Viaje completado', 'Viaje completado.');
  };

  const handleSelectSuggestion = (item: any) => {
    const name = item.nombre || item.name || 'Ubicación seleccionada';
    const coords = item.coords || [item.latitude, item.longitude];
    setEditablePointName(name);
    setEditableCoords([Number(coords[0]), Number(coords[1])]);
    setSearchQuery('');
    setSuggestions([]);
  };

  const usarCasa = () => {
    if (savedHomeLocation) {
      handleSelectSuggestion({
        nombre: savedHomeLocation.name,
        direccion: savedHomeLocation.address,
        coords: savedHomeLocation.coords,
      });
    } else {
      setIsHomeModalOpen(true);
    }
  };

  const handleSelectRide = (ride: (typeof rides)[number]) => {
    setSelectedSearchRoute({
      id: ride.id,
      driverName: ride.driver_name,
      vehicle: ride.vehicle,
      plate: ride.plate,
      origin: ride.origin,
      destination: ride.destination,
      scheduled_date: ride.scheduled_date,
      departureTime: ride.departure_time,
      arrivalTime: ride.arrival_time,
      availableSeats: ride.available_seats,
      fare: ride.fare,
      fare_cop: ride.fare_cop,
      pickup_lat: ultimoPickupRef.current?.[0],
      pickup_lng: ultimoPickupRef.current?.[1],
    });
    // setActiveTab en el store es un campo heredado de la web (renderActiveView
    // por estado) que en mobile no mueve nada por sí solo — la navegación real
    // de Expo Router es esta.
    router.push('/(tabs)/map');
  };

  if (activeRole === 'passenger' && activeDriverTrip) {
    return (
      <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
        <ActiveRoleConflictBlocker
          conflictType="driver_active"
          activeTrip={activeDriverTrip}
          onRedirect={() => {
            toggleRole();
            router.replace('/(tabs)');
          }}
        />
      </SafeAreaView>
    );
  }

  if (activeRole === 'driver' && activePassengerBooking) {
    return (
      <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
        <ActiveRoleConflictBlocker
          conflictType="passenger_active"
          activeTrip={activePassengerBooking}
          onRedirect={() => {
            toggleRole();
            router.replace('/(tabs)/history');
          }}
        />
      </SafeAreaView>
    );
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'UN';

  if (activeRole === 'driver') {
    if (!user?.isDriver) {
      return (
        <View className="flex-1 bg-slate-100 dark:bg-slate-950">
          <DriverOnboardingView onBack={() => useAppStore.setState({ activeRole: 'passenger' })} />
        </View>
      );
    }

    if (activeDriverTrip) {
      if (showNavigator) {
        return (
          <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
            <InAppGpsNavigator
              trip={activeDriverTrip}
              onExit={() => setShowNavigator(false)}
              onComplete={() => {
                setShowNavigator(false);
                completarViaje();
              }}
            />
          </SafeAreaView>
        );
      }

      return (
        <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
          <DriverCockpitCard
            onOpenNavigator={() => setShowNavigator(true)}
            onCompleteTrip={completarViaje}
            onOpenCancelModal={() => setShowCancelModal(true)}
          />
          <CancelTripPenaltyModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            passengersCount={activeDriverTrip.passengers?.length || 0}
          />
        </SafeAreaView>
      );
    }

    if (showPublishForm) {
      return (
        <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
          <DriverRoutePublishForm
            onBack={() => setShowPublishForm(false)}
            onPublished={() => {
              setShowPublishForm(false);
              sincronizarRutasConductor();
            }}
          />
        </SafeAreaView>
      );
    }

    const driverPlate =
      user?.driverApplication?.plate_number ||
      user?.driverInfo?.plate_number ||
      user?.vehiclePlate ||
      'Vehículo Registrado';
    const pendingPublishedTrips = publishedDriverTrips.filter((t: any) => t.status === 'publicado');

    return (
      <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 14 }}>
          {/* Tarjeta de Bienvenida y Estado del Conductor */}
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <Text className="text-base font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    Hola, {user?.name?.split(' ')[0] || 'Conductor'}
                  </Text>
                  <ShieldCheck size={16} color="#10b981" />
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {driverPlate} • Conductor Verificado
                </Text>
              </View>
              <View className="w-10 h-10 rounded-2xl bg-emerald-600 items-center justify-center">
                <Text className="text-white font-black text-xs">{initials}</Text>
              </View>
            </View>
          </View>

          {/* Botón Destacado: Publicar Nueva Ruta */}
          <Pressable
            onPress={() => setShowPublishForm(true)}
            className="w-full py-4 rounded-3xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Plus size={18} color="#ffffff" />
            <Car size={18} color="#ffffff" />
            <Text className="text-sm font-black text-white ml-1">Publicar Nueva Ruta</Text>
          </Pressable>

          {/* Próximas Salidas Programadas */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-1.5">
                <Car size={13} color="#10b981" />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Próximas Salidas ({pendingPublishedTrips.length})
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/history')}>
                <Text className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Ver Todas</Text>
              </Pressable>
            </View>

            {pendingPublishedTrips.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center gap-2">
                <Car size={20} color="#10b981" />
                <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                  No tienes salidas programadas hoy
                </Text>
                <Text className="text-[11px] text-slate-400 text-center">
                  Publica tu ruta hacia la universidad para empezar a compartir vehículo.
                </Text>
              </View>
            ) : (
              pendingPublishedTrips.slice(0, 3).map((trip: any) => (
                <View
                  key={trip.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 gap-2.5"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Calendar size={10} color="#10b981" />
                        <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{trip.date}</Text>
                      </View>
                      <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-lochmara-500/10 border border-lochmara-500/20">
                        <Clock size={10} color="#0284c7" />
                        <Text className="text-[9px] font-bold text-lochmara-600 dark:text-lochmara-400">{trip.departure_time}</Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(trip.fare_cop || 0).toLocaleString('es-CO')} COP
                    </Text>
                  </View>

                  <View className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                      {trip.origin} → {trip.destination}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {trip.passengers?.length || 0} de {trip.available_seats || 3} puestos reservados
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => startPublishedTrip(trip.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-1.5"
                    >
                      <Navigation size={12} color="#ffffff" />
                      <Text className="text-xs font-black text-white">Abrir Cabina GPS</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => cancelPublishedTrip(trip.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20"
                    >
                      <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Cancelar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Rutas Recurrentes Activas */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-1.5">
                <Calendar size={13} color="#0284c7" />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rutinas Recurrentes ({recurringDriverTrips.length})
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/history')}>
                <Text className="text-[11px] font-extrabold text-lochmara-600 dark:text-lochmara-400">Gestionar</Text>
              </Pressable>
            </View>

            {recurringDriverTrips.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center gap-2">
                <Calendar size={20} color="#0284c7" />
                <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                  Sin rutinas semanales
                </Text>
                <Text className="text-[11px] text-slate-400 text-center">
                  Crea plantillas automáticas en la pestaña de historial para publicar tus viajes diarios.
                </Text>
              </View>
            ) : (
              recurringDriverTrips.slice(0, 2).map((routine: any) => (
                <View
                  key={routine.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                      {routine.title}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {routine.days?.join(', ')} • {routine.departure_time}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleRecurringDriverTrip(routine.id)}
                    className={`flex-row items-center gap-1 px-2.5 py-1 rounded-xl border ${
                      routine.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-500/10 border-slate-500/20'
                    }`}
                  >
                    <Power size={11} color={routine.isActive ? '#10b981' : '#94a3b8'} />
                    <Text
                      className={`text-[10px] font-bold ${
                        routine.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {routine.isActive ? 'Activa' : 'Pausada'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isToday = selectedDate === todayStr();
  const isTomorrow = selectedDate === tomorrowStr();
  const isCustomDate = !isToday && !isTomorrow;
  const dateMode: 'today' | 'tomorrow' | 'custom' = isToday ? 'today' : isTomorrow ? 'tomorrow' : 'custom';

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
        {activePassengerBooking && <PassengerActiveTripCard />}

        {/* Cabecera con saludo + avatar */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-black text-slate-900 dark:text-white" numberOfLines={1}>
                Hola, {user?.name?.split(' ')[0] || 'Estudiante'}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">¿Cuál es tu trayecto universitario?</Text>
            </View>
            <View className="w-10 h-10 rounded-2xl bg-lochmara-600 items-center justify-center">
              <Text className="text-white font-black text-xs">{initials}</Text>
            </View>
          </View>

          {/* Toggle de 3 sentidos — con pill deslizante (spring), igual que
              layoutId="direction-pill-home" en HomeHeroRouteCard.jsx */}
          <View className="mb-3">
            <AnimatedSegmentedControl
              segments={[
                { key: 'towards', label: 'Hacia Campus' },
                { key: 'from', label: 'Desde Campus' },
                { key: 'inter_campus', label: 'Entre Sedes' },
              ]}
              value={direction}
              onChange={setDirection}
            />
          </View>

          {/* Corredor origen/destino */}
          <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {/* ORIGEN */}
            <View className="flex-row items-center gap-2.5">
              <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500" />
              <View className="flex-1">
                <Text className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Origen</Text>
                {direction === 'from' || direction === 'inter_campus' ? (
                  <Pressable
                    onPress={() => {
                      setCampusModalTarget('origin');
                      setIsCampusModalOpen(true);
                    }}
                    className="flex-row items-center justify-between mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
                  >
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Building2 size={14} color="#0284c7" />
                      <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                        {selectedOriginCampus}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-[10px] font-bold text-lochmara-500">Cambiar</Text>
                      <ChevronRight size={12} color="#0284c7" />
                    </View>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View className="relative flex-1">
                      <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                        <Search size={13} color="#94a3b8" />
                        <TextInput
                          value={searchQuery || editablePointName}
                          onChangeText={setSearchQuery}
                          placeholder="¿Dónde te recogemos?"
                          placeholderTextColor="#94a3b8"
                          className="flex-1 text-xs font-bold text-slate-900 dark:text-white ml-1.5 py-0"
                        />
                        {isSearchingPlaces ? (
                          <ActivityIndicator size="small" color="#0284c7" />
                        ) : (searchQuery || editablePointName) ? (
                          <Pressable onPress={() => { setSearchQuery(''); setEditablePointName(''); setEditableCoords(null); }} hitSlop={6}>
                            <X size={13} color="#94a3b8" />
                          </Pressable>
                        ) : null}
                      </View>
                      {suggestions.length > 0 && (
                        <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden z-10">
                          {suggestions.map((item, idx) => (
                            <Pressable
                              key={idx}
                              onPress={() => handleSelectSuggestion(item)}
                              className="p-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                            >
                              <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                {item.nombre || item.name}
                              </Text>
                              <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                                {item.direccion || item.address}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={usarCasa}
                      className={`px-2 py-1 rounded-xl flex-row items-center gap-1 border shrink-0 ${
                        savedHomeLocation
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-slate-500/10 border-slate-500/20'
                      }`}
                    >
                      <Home size={11} color={savedHomeLocation ? '#f59e0b' : '#94a3b8'} />
                      <Text className={`text-[10px] font-extrabold ${savedHomeLocation ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Casa
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setIsMapPickerOpen(true)}
                      className="px-2 py-1 rounded-xl bg-lochmara-500/10 flex-row items-center gap-1 shrink-0"
                    >
                      <MapPin size={11} color="#0284c7" />
                      <Text className="text-[10px] font-extrabold text-lochmara-600 dark:text-lochmara-400">Mapa</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            <View className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-2.5 ml-1 my-1" />

            {/* DESTINO */}
            <View className="flex-row items-center gap-2.5">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <View className="flex-1">
                <Text className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Destino</Text>
                {direction === 'towards' ? (
                  <Pressable
                    onPress={() => {
                      setCampusModalTarget('destination');
                      setIsCampusModalOpen(true);
                    }}
                    className="flex-row items-center justify-between mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
                  >
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Building2 size={14} color="#0284c7" />
                      <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                        {selectedCampus}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-[10px] font-bold text-lochmara-500">Cambiar</Text>
                      <ChevronRight size={12} color="#0284c7" />
                    </View>
                  </Pressable>
                ) : direction === 'inter_campus' ? (
                  <Pressable
                    onPress={() => {
                      setCampusModalTarget('destination');
                      setIsCampusModalOpen(true);
                    }}
                    className="flex-row items-center justify-between mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
                  >
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Building2 size={14} color="#10b981" />
                      <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                        {selectedDestinationCampus}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-[10px] font-bold text-lochmara-500">Cambiar</Text>
                      <ChevronRight size={12} color="#0284c7" />
                    </View>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View className="relative flex-1">
                      <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                        <Search size={13} color="#94a3b8" />
                        <TextInput
                          value={searchQuery || editablePointName}
                          onChangeText={setSearchQuery}
                          placeholder="¿A dónde te diriges?"
                          placeholderTextColor="#94a3b8"
                          className="flex-1 text-xs font-bold text-slate-900 dark:text-white ml-1.5 py-0"
                        />
                        {isSearchingPlaces ? (
                          <ActivityIndicator size="small" color="#0284c7" />
                        ) : (searchQuery || editablePointName) ? (
                          <Pressable onPress={() => { setSearchQuery(''); setEditablePointName(''); setEditableCoords(null); }} hitSlop={6}>
                            <X size={13} color="#94a3b8" />
                          </Pressable>
                        ) : null}
                      </View>
                      {suggestions.length > 0 && (
                        <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden z-10">
                          {suggestions.map((item, idx) => (
                            <Pressable
                              key={idx}
                              onPress={() => handleSelectSuggestion(item)}
                              className="p-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                            >
                              <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                {item.nombre || item.name}
                              </Text>
                              <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                                {item.direccion || item.address}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={usarCasa}
                      className={`px-2 py-1 rounded-xl flex-row items-center gap-1 border shrink-0 ${
                        savedHomeLocation
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-slate-500/10 border-slate-500/20'
                      }`}
                    >
                      <Home size={11} color={savedHomeLocation ? '#f59e0b' : '#94a3b8'} />
                      <Text className={`text-[10px] font-extrabold ${savedHomeLocation ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Casa
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setIsMapPickerOpen(true)}
                      className="px-2 py-1 rounded-xl bg-lochmara-500/10 flex-row items-center gap-1 shrink-0"
                    >
                      <MapPin size={11} color="#0284c7" />
                      <Text className="text-[10px] font-extrabold text-lochmara-600 dark:text-lochmara-400">Mapa</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Barra de fecha + horario — mismo bloque que "BARRA DE CONTROL DE
              FECHA Y HORARIO" en HomeHeroRouteCard.jsx: 3 opciones de fecha
              (Hoy/Mañana/Fecha personalizada) con pill deslizante + selector
              de hora compacto aparte. */}
          <View className="flex-row items-center gap-2 mt-3">
            <View className="flex-1">
              <AnimatedSegmentedControl
                segments={[
                  { key: 'today', label: 'Hoy' },
                  { key: 'tomorrow', label: 'Mañana' },
                  {
                    key: 'custom',
                    label: dateMode === 'custom' ? formatCustomDateLabel(selectedDate) : 'Fecha',
                    icon: <Calendar size={10} color={dateMode === 'custom' ? '#ffffff' : '#94a3b8'} />,
                  },
                ]}
                value={dateMode}
                onChange={(mode) => {
                  if (mode === 'today') setSelectedDate(todayStr());
                  else if (mode === 'tomorrow') setSelectedDate(tomorrowStr());
                  else setShowDatePicker(true);
                }}
              />
            </View>

            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="shrink-0 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-row items-center gap-1.5"
            >
              <Clock size={14} color="#0284c7" />
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                {passengerTimeFilter || '--:--'}
              </Text>
              {passengerTimeFilter ? (
                <Pressable onPress={() => setPassengerTimeFilter(null)} hitSlop={6}>
                  <X size={12} color="#94a3b8" />
                </Pressable>
              ) : null}
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={isCustomDate ? new Date(`${selectedDate}T00:00:00`) : new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_e, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(fechaLocalStr(date));
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={(() => {
                const d = new Date();
                if (passengerTimeFilter) {
                  const [h, m] = passengerTimeFilter.split(':').map(Number);
                  d.setHours(h, m, 0, 0);
                }
                return d;
              })()}
              mode="time"
              is24Hour
              onChange={(_e, date) => {
                setShowTimePicker(false);
                if (date) {
                  const hh = String(date.getHours()).padStart(2, '0');
                  const mm = String(date.getMinutes()).padStart(2, '0');
                  setPassengerTimeFilter(`${hh}:${mm}`);
                }
              }}
            />
          )}
        </View>

        {/* Resultados */}
        <View className="flex-row items-center justify-between px-1 mt-2">
          <View className="flex-row items-center gap-1.5">
            <Navigation size={13} color="#10b981" />
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Viajes Disponibles ({filteredRides.length})
            </Text>
          </View>
        </View>

        {isLoadingMatches ? (
          <View className="items-center py-10 gap-2">
            <ActivityIndicator color="#0284c7" />
            <Text className="text-[11px] text-slate-400 font-semibold">Buscando rutas cercanas con PostGIS...</Text>
          </View>
        ) : searchErrorMsg ? (
          <View className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/50">
            <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">{searchErrorMsg}</Text>
          </View>
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride) => {
            const isDirect = ride.detour_minutes === '+0 min' || ride.is_direct;
            return (
              <Pressable
                key={ride.id}
                onPress={() => handleSelectRide(ride)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 gap-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <View className="w-9 h-9 rounded-xl bg-lochmara-100 dark:bg-lochmara-500/20 items-center justify-center">
                      <Text className="text-xs font-black text-lochmara-800 dark:text-lochmara-300">
                        {ride.driver_avatar_initials || ride.driver_name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                          {ride.driver_name}
                        </Text>
                        <ShieldCheck size={13} color="#0284c7" />
                      </View>
                      <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                        {ride.vehicle} • {ride.plate}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">{ride.fare}</Text>
                    <Text className="text-[9px] text-slate-400 font-medium">{ride.available_seats} cupo(s)</Text>
                  </View>
                </View>

                <View className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-lochmara-500" />
                    <Text className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">De:</Text>
                    <Text className="text-xs font-black text-slate-900 dark:text-slate-100 flex-1" numberOfLines={1}>
                      {ride.origin}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">A:</Text>
                    <Text className="text-xs font-black text-slate-900 dark:text-slate-100 flex-1" numberOfLines={1}>
                      {ride.destination}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-wrap flex-1">
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#0284c7" />
                      <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Llegada: {ride.arrival_time || '—'}
                      </Text>
                    </View>
                    {isDirect ? (
                      <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                        <CheckCircle2 size={10} color="#10b981" />
                        <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Ruta directa</Text>
                      </View>
                    ) : ride.is_detour_feasible ? (
                      <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10">
                        <Sparkles size={10} color="#f59e0b" />
                        <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          Desvío viable ({ride.detour_minutes})
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-500/10">
                        <AlertCircle size={10} color="#64748b" />
                        <Text className="text-[9px] font-bold text-slate-500">Desvío no disponible</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    <Text className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400">Ver Ruta</Text>
                    <ArrowRight size={13} color="#0284c7" />
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-2">
            <Car size={20} color="#0284c7" />
            <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
              ¡Pronto habrá nuevos viajes disponibles!
            </Text>
            <Text className="text-[11px] text-slate-400 text-center">
              Los conductores universitarios publican rutas continuamente.
            </Text>
          </View>
        )}
      </ScrollView>

      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
        campuses={campuses}
        selectedCampus={
          campusModalTarget === 'origin'
            ? selectedOriginCampus
            : direction === 'inter_campus'
            ? selectedDestinationCampus
            : selectedCampus
        }
        onSelectCampus={(c) => {
          if (campusModalTarget === 'origin') {
            setSelectedOriginCampus(c.name);
          } else {
            setSelectedCampus(c.name);
            setSelectedDestinationCampus(c.name);
          }
        }}
      />

      <SetHomeLocationModal isOpen={isHomeModalOpen} onClose={() => setIsHomeModalOpen(false)} onLocationSaved={handleSelectSuggestion} />

      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialCoords={editableCoords}
        initialPlaceName={editablePointName}
        title={direction === 'from' ? 'Ajustar Punto de Destino' : 'Ajustar Punto de Recogida'}
        confirmButtonText={direction === 'from' ? 'Confirmar punto de destino' : 'Confirmar punto de recogida'}
        onConfirm={(loc) => handleSelectSuggestion({ nombre: loc.address, direccion: loc.address, coords: loc.coords })}
      />
    </SafeAreaView>
  );
}
