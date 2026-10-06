import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Car,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  Building2,
  Navigation,
  Home,
  ArrowRight,
  ChevronDown,
} from 'lucide-react-native';
import {
  useAppStore,
  routesService,
  placesApiService,
  authService,
  vehicleService,
  parseBackendError,
  INSTITUCIONES_PREDETERMINADAS,
  fechaColombiaStr,
} from '@uniwheels/shared';
import { CampusSelectorModal, type Campus } from '@/components/CampusSelectorModal';
import { LocationPickerModal } from '@/components/LocationPickerModal';
import { SetHomeLocationModal } from '@/components/SetHomeLocationModal';
import { AlertBanner } from '@/components/AlertBanner';

const DEFAULT_CAMPUSES: Campus[] = INSTITUCIONES_PREDETERMINADAS[0].campuses;

const todayStr = () => fechaColombiaStr();
// Colombia no tiene horario de verano: sumar 24 h equivale a un dia calendario.
const tomorrowStr = () => fechaColombiaStr(new Date(Date.now() + 24 * 60 * 60 * 1000));

// Zona horaria fija de la operación (Colombia, sin horario de verano).
const ZONA_COLOMBIA = '-05:00';
const DURACION_VENTANA_MIN = 60;

// Convierte fecha 'YYYY-MM-DD' + hora local de Colombia a ISO con zona -05:00.
const aIsoColombia = (fecha: string, horas: number, minutos: number, sumarMinutos = 0) => {
  const [y, m, d] = fecha.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d, horas, minutos + sumarMinutos);
  return new Date(ms).toISOString().slice(0, 19) + ZONA_COLOMBIA;
};

// Interpreta 'hh:mm AM/PM' en horas y minutos de 24 h.
const parsearHora = (texto: string) => {
  const limpio = texto.trim().toUpperCase();
  const partes = limpio.replace(/(AM|PM)/, '').trim().split(':');
  let horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1] || '0', 10);
  if (limpio.includes('PM') && horas < 12) horas += 12;
  if (limpio.includes('AM') && horas === 12) horas = 0;
  return { horas, minutos };
};

const coordenadasDeSede = (campus?: Campus): [number, number] | null => {
  if (campus?.latitude == null || campus?.longitude == null) return null;
  const lat = Number(campus.latitude);
  const lng = Number(campus.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const redondearCentena = (valor: number) => Math.round(valor / 100) * 100;
const formatearCop = (valor: number) => valor.toLocaleString('es-CO');

type PuntosRuta = {
  originName: string;
  originLat: number;
  originLng: number;
  destCampus: Campus;
  destLat: number;
  destLng: number;
};

type SugerenciaAporte = {
  key: string;
  data?: { distance_km: number; suggested_contribution_cop: number; max_contribution_cop: number };
  error?: string;
};

export interface DriverRoutePublishFormProps {
  onBack?: () => void;
  onPublished?: (trip: any) => void;
}

export function DriverRoutePublishForm({ onBack, onPublished }: DriverRoutePublishFormProps) {
  const { user, savedHomeLocation, publishDriverTrip } = useAppStore();

  const [direction, setDirection] = useState<'hacia_campus' | 'desde_campus' | 'entre_campus'>('hacia_campus');
  const [selectedCampus, setSelectedCampus] = useState<Campus>(DEFAULT_CAMPUSES[0]);
  const [destinationCampus, setDestinationCampus] = useState<Campus>(DEFAULT_CAMPUSES[1] || DEFAULT_CAMPUSES[0]);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'origin' | 'destination'>('destination');

  // Punto fuera de campus (origen si hacia_campus, destino si desde_campus)
  const [customPointName, setCustomPointName] = useState('Centro Comercial Cañaveral, Floridablanca');
  const [customCoords, setCustomCoords] = useState<[number, number]>([7.0682, -73.1065]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modales
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);

  // Punto de encuentro en campus
  const [meetingPoint, setMeetingPoint] = useState('Portería Principal');

  // Fecha y Hora
  const [departureDate, setDepartureDate] = useState(todayStr());
  const [departureTime, setDepartureTime] = useState('06:45 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Cupos y Tarifa
  const vehicleMaxSeats = user?.driverApplication?.available_seats || user?.vehicle?.available_seats || 3;
  const isMoto = (user?.driverApplication?.vehicle_type || user?.vehicle?.vehicle_type) === 'moto';
  const [availableSeats, setAvailableSeats] = useState(isMoto ? 1 : Math.min(3, vehicleMaxSeats));

  // Sedes reales (con coordenadas) del catálogo de auth-service
  const [campuses, setCampuses] = useState<Campus[]>(DEFAULT_CAMPUSES);

  // Vehículo aprobado del conductor (null = verificando)
  const [vehiculo, setVehiculo] = useState<{ id: string | null } | null>(null);

  // Aporte sugerido por el backend y valor editable por el conductor
  const [sugerencia, setSugerencia] = useState<SugerenciaAporte | null>(null);
  const [reintentos, setReintentos] = useState(0);
  const [aporteTexto, setAporteTexto] = useState('');
  const [avisoMaximo, setAvisoMaximo] = useState(false);

  // Estados de carga y error
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    authService.getInstitutions().then((res: any) => {
      const lista: Campus[] | undefined = Array.isArray(res) ? res[0]?.campuses : res?.data?.[0]?.campuses;
      if (!lista?.length) return;
      setCampuses(lista);
      setSelectedCampus((prev) => lista.find((c) => c.id === prev.id) ?? lista[0]);
      setDestinationCampus((prev) => lista.find((c) => c.id === prev.id) ?? lista[1] ?? lista[0]);
    });
  }, []);

  useEffect(() => {
    let cancelado = false;
    vehicleService
      .checkApprovedVehicle()
      .then((res: any) => {
        if (!cancelado) setVehiculo({ id: res?.has_approved_vehicle && res?.vehicle?.id ? String(res.vehicle.id) : null });
      })
      .catch(() => {
        if (!cancelado) setVehiculo({ id: null });
      });
    return () => {
      cancelado = true;
    };
  }, [user?.id, user?.driverApplication?.plate_number, user?.driverInfo?.plate_number]);

  // Puntos de la ruta con coordenadas reales. null si falta alguna coordenada de sede.
  // Dirección 'desde_campus': el backend modela el destino como sede
  // (destination_campus_*), así que se envía la sede de salida como
  // destination_campus_* y el punto real del conductor en destination_lat/lng.
  const puntos = useMemo<PuntosRuta | null>(() => {
    const coordsSedeSalida = coordenadasDeSede(selectedCampus);
    const coordsSedeDestino = coordenadasDeSede(destinationCampus);
    if (direction === 'hacia_campus') {
      if (!coordsSedeSalida) return null;
      return {
        originName: customPointName,
        originLat: customCoords[0],
        originLng: customCoords[1],
        destCampus: selectedCampus,
        destLat: coordsSedeSalida[0],
        destLng: coordsSedeSalida[1],
      };
    }
    if (direction === 'desde_campus') {
      if (!coordsSedeSalida) return null;
      return {
        originName: selectedCampus.name,
        originLat: coordsSedeSalida[0],
        originLng: coordsSedeSalida[1],
        destCampus: selectedCampus,
        destLat: customCoords[0],
        destLng: customCoords[1],
      };
    }
    if (!coordsSedeSalida || !coordsSedeDestino) return null;
    return {
      originName: selectedCampus.name,
      originLat: coordsSedeSalida[0],
      originLng: coordsSedeSalida[1],
      destCampus: destinationCampus,
      destLat: coordsSedeDestino[0],
      destLng: coordsSedeDestino[1],
    };
  }, [direction, selectedCampus, destinationCampus, customPointName, customCoords]);

  const vehicleId = vehiculo?.id ?? null;
  const sugerenciaKey =
    puntos && vehicleId
      ? `${vehicleId}|${puntos.originLat},${puntos.originLng}|${puntos.destLat},${puntos.destLng}|${reintentos}`
      : null;

  // Aporte sugerido con debounce de 400 ms al cambiar los puntos
  useEffect(() => {
    if (!sugerenciaKey || !puntos || !vehicleId) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        const data = await routesService.getContributionSuggestion({
          vehicleId,
          originLat: puntos.originLat,
          originLng: puntos.originLng,
          destinationLat: puntos.destLat,
          destinationLng: puntos.destLng,
        });
        if (cancelado) return;
        setSugerencia({ key: sugerenciaKey, data });
        setAporteTexto(String(Math.max(0, Math.round(Number(data.suggested_contribution_cop)))));
        setAvisoMaximo(false);
      } catch (e: any) {
        if (cancelado) return;
        setSugerencia({
          key: sugerenciaKey,
          error:
            e?.status === 503
              ? 'No se pudo validar tu vehículo para calcular el aporte sugerido.'
              : e?.message || 'No se pudo calcular el aporte sugerido.',
        });
      }
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [sugerenciaKey, puntos, vehicleId]);

  const sugerenciaActual = sugerencia && sugerencia.key === sugerenciaKey ? sugerencia : null;
  const cargandoSugerencia = Boolean(sugerenciaKey) && !sugerenciaActual;
  const maxAporte = sugerenciaActual?.data ? Number(sugerenciaActual.data.suggested_contribution_cop) : null;
  const aporteCop = parseInt(aporteTexto || '0', 10) || 0;

  const handleCambioAporte = (texto: string) => {
    if (maxAporte == null) return;
    const digitos = texto.replace(/[^0-9]/g, '');
    const valor = parseInt(digitos || '0', 10);
    if (valor > maxAporte) {
      setAporteTexto(String(maxAporte));
      setAvisoMaximo(true);
    } else {
      setAporteTexto(digitos);
      setAvisoMaximo(false);
    }
  };

  const aplicarAporte = (valor: number) => {
    if (maxAporte == null) return;
    setAporteTexto(String(Math.min(maxAporte, Math.max(0, valor))));
    setAvisoMaximo(false);
  };

  const sinVehiculo = vehiculo !== null && !vehicleId;
  const sedesSinCoordenadas = puntos === null;
  const puedePublicar =
    !isPublishing && Boolean(vehicleId) && !sedesSinCoordenadas && maxAporte != null && aporteTexto !== '';

  // Búsqueda de lugares con debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const results = await placesApiService.searchPlaces(searchQuery);
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (place: any) => {
    setCustomPointName(place.nombre || place.direccion || place.name);
    if (place.coords) {
      setCustomCoords([Number(place.coords[0]), Number(place.coords[1])]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleUseHome = () => {
    if (savedHomeLocation) {
      setCustomPointName(savedHomeLocation.name || savedHomeLocation.address);
      if (savedHomeLocation.coords) {
        setCustomCoords(savedHomeLocation.coords);
      }
    } else {
      setIsHomeModalOpen(true);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Permiso de ubicación denegado.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCustomCoords([lat, lng]);
      const geo = await placesApiService.reverseGeocode(lat, lng);
      setCustomPointName(geo?.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch {
      setErrorMessage('No se pudo obtener la ubicación GPS.');
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      let hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
      setDepartureTime(formatted);
    }
  };

  const handlePublish = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validar hora de salida si la fecha es hoy
    if (departureDate === todayStr()) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const timeClean = departureTime.trim().toUpperCase();
      const isPM = timeClean.includes('PM');
      const isAM = timeClean.includes('AM');
      const parts = timeClean.replace(/(AM|PM)/, '').trim().split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      const departureMinutes = hours * 60 + minutes;

      if (departureMinutes <= currentMinutes + 5) {
        setErrorMessage('La hora de salida debe ser al menos 5 minutos posterior a la hora actual.');
        return;
      }
    }

    if (!vehicleId || !puntos || maxAporte == null) {
      setErrorMessage(
        sinVehiculo ? 'Necesitas un vehículo aprobado para publicar rutas.' : 'Completa los datos de la ruta para publicar.'
      );
      return;
    }

    setIsPublishing(true);

    const { horas, minutos } = parsearHora(departureTime);

    const payload = {
      vehicle_id: vehicleId,
      origin_name: puntos.originName,
      origin_lat: puntos.originLat,
      origin_lng: puntos.originLng,
      destination_campus_id: puntos.destCampus.id,
      destination_campus_name: puntos.destCampus.name,
      destination_lat: puntos.destLat,
      destination_lng: puntos.destLng,
      scheduled_departure_time: aIsoColombia(departureDate, horas, minutos),
      target_arrival_time: aIsoColombia(departureDate, horas, minutos, DURACION_VENTANA_MIN),
      available_seats: availableSeats,
      base_contribution_cop: Math.min(aporteCop, maxAporte),
    };

    try {
      const respuesta = await routesService.publishRoute(payload);
      const ruta = respuesta?.data;
      if (!ruta?.id) {
        throw { message: 'El servidor no confirmó la ruta publicada. Intenta nuevamente.' };
      }

      const tripData = {
        ...ruta,
        direction,
        origin: puntos.originName,
        destination: direction === 'desde_campus' ? customPointName : puntos.destCampus.name,
        meeting_point: direction !== 'hacia_campus' ? meetingPoint : undefined,
        departure_date: departureDate,
        departure_time: departureTime,
        available_seats: availableSeats,
        total_seats: availableSeats,
        fare_cop: payload.base_contribution_cop,
        id: ruta.id,
        route_id: ruta.id,
      };

      publishDriverTrip(tripData);
      setSuccessMessage('¡Ruta universitaria publicada exitosamente!');

      setTimeout(() => {
        if (onPublished) {
          onPublished(tripData);
        }
      }, 700);
    } catch (err: any) {
      // 422: errors.base_contribution_cop[0], o el primer error, o message.
      const primerError = err?.errors ? (Object.values(err.errors)[0] as any) : null;
      setErrorMessage(
        err?.errors?.base_contribution_cop?.[0] ||
          (Array.isArray(primerError) ? primerError[0] : primerError) ||
          err?.message ||
          parseBackendError(err)
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const isToday = departureDate === todayStr();
  const isTomorrow = departureDate === tomorrowStr();

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-4"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Encabezado */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
              <Car size={18} color="#0284c7" />
            </View>
            <View>
              <Text className="text-base font-black text-slate-900 dark:text-white">
                Publicar Nueva Ruta
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                Comparte tu recorrido con la comunidad
              </Text>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <AlertBanner type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
        ) : null}

        {successMessage ? (
          <AlertBanner type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        ) : null}

        {/* 1. Selector de Sentido de Viaje */}
        <View className="p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 flex-row">
          <Pressable
            onPress={() => setDirection('hacia_campus')}
            className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
              direction === 'hacia_campus' ? 'bg-lochmara-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                direction === 'hacia_campus' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Hacia Campus
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDirection('desde_campus')}
            className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
              direction === 'desde_campus' ? 'bg-lochmara-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                direction === 'desde_campus' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Desde Campus
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDirection('entre_campus')}
            className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
              direction === 'entre_campus' ? 'bg-lochmara-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                direction === 'entre_campus' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Entre Sedes
            </Text>
          </Pressable>
        </View>

        {/* 2. Sedes Universitaria(s) */}
        <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
          <View className="flex-row items-center gap-2">
            <Building2 size={16} color="#0284c7" />
            <Text className="text-xs font-black text-slate-900 dark:text-white">
              {direction === 'entre_campus'
                ? 'Sedes Universitarias'
                : direction === 'hacia_campus'
                ? 'Campus de Destino'
                : 'Campus de Salida'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setSelectingTarget('origin');
              setIsCampusModalOpen(true);
            }}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedCampus.name}
              </Text>
            </View>
            <ChevronDown size={16} color="#64748b" />
          </Pressable>

          {direction === 'entre_campus' && (
            <Pressable
              onPress={() => {
                setSelectingTarget('destination');
                setIsCampusModalOpen(true);
              }}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#10b981" />
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  Destino: {destinationCampus.name}
                </Text>
              </View>
              <ChevronDown size={16} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* 3. Punto en Bucaramanga / AMB (si no es entre_campus) */}
        {direction !== 'entre_campus' && (
          <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#10b981" />
                <Text className="text-xs font-black text-slate-900 dark:text-white">
                  {direction === 'hacia_campus' ? 'Punto de Salida (AMB)' : 'Punto de Destino (AMB)'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleUseHome}
                  className="px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex-row items-center gap-1"
                >
                  <Home size={12} color="#f59e0b" />
                  <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    {savedHomeLocation ? 'Casa' : 'Configurar Casa'}
                  </Text>
                </Pressable>
                <Pressable onPress={handleUseCurrentLocation}>
                  <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">
                    GPS
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Buscador de lugar */}
            <View className="relative">
              <View className="flex-row items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    setShowSuggestions(true);
                  }}
                  placeholder="Buscar barrio, centro comercial o dirección..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2 text-xs font-bold text-slate-900 dark:text-white"
                />
                {isSearchingPlaces && <ActivityIndicator size="small" color="#0284c7" />}
              </View>

              {/* Lista de sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <View className="mt-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-lg">
                  {suggestions.map((sug, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSelectSuggestion(sug)}
                      className="p-3 flex-row items-center gap-2.5"
                    >
                      <MapPin size={14} color="#10b981" />
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                          {sug.nombre || sug.name}
                        </Text>
                        <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                          {sug.direccion || sug.address}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Ubicación Confirmada */}
            <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <CheckCircle2 size={16} color="#10b981" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                  {customPointName}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsMapPickerOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-lochmara-50 dark:bg-slate-800"
              >
                <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">
                  Ajustar Mapa
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 4. Punto de encuentro en campus (si sale de un campus) */}
        {direction !== 'hacia_campus' && (
          <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-2 shadow-xs">
            <View className="flex-row items-center gap-2">
              <Navigation size={16} color="#0284c7" />
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Punto de Encuentro en Campus
              </Text>
            </View>
            <TextInput
              value={meetingPoint}
              onChangeText={setMeetingPoint}
              placeholder="Ej: Portería Principal Calle 48, Bahía Parqueadero..."
              placeholderTextColor="#94a3b8"
              className="py-2.5 px-3.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </View>
        )}

        {/* 5. Parámetros: Fecha, Hora, Cupos y Tarifa */}
        <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3.5 shadow-xs">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Clock size={16} color="#0284c7" />
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Horario y Disponibilidad
              </Text>
            </View>

            {/* Selector de fecha rápido */}
            <View className="flex-row rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
              <Pressable
                onPress={() => setDepartureDate(todayStr())}
                className={`px-2 py-1 rounded-lg ${isToday ? 'bg-emerald-600' : 'bg-transparent'}`}
              >
                <Text className={`text-[10px] font-bold ${isToday ? 'text-white' : 'text-slate-500'}`}>
                  Hoy
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDepartureDate(tomorrowStr())}
                className={`px-2 py-1 rounded-lg ${isTomorrow ? 'bg-emerald-600' : 'bg-transparent'}`}
              >
                <Text className={`text-[10px] font-bold ${isTomorrow ? 'text-white' : 'text-slate-500'}`}>
                  Mañana
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Hora de Salida */}
          <View className="flex-row gap-2">
            <View className="flex-1 gap-1">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Hora de Salida:
              </Text>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                className="py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-row items-center justify-between"
              >
                <Text className="text-xs font-black text-slate-900 dark:text-white">
                  {departureTime}
                </Text>
                <Clock size={14} color="#64748b" />
              </Pressable>
            </View>

            {/* Cupos */}
            <View className="flex-1 gap-1">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Cupos Libres:
              </Text>
              <View className="flex-row gap-1">
                {(isMoto ? [1] : [1, 2, 3, 4]).map((num) => (
                  <Pressable
                    key={num}
                    onPress={() => setAvailableSeats(num)}
                    className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                      availableSeats === num
                        ? 'bg-lochmara-600 border-lochmara-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        availableSeats === num ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Aporte sugerido */}
          <View className="gap-2">
            <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Aporte por Pasajero:
            </Text>

            {sinVehiculo ? (
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                El aporte se calcula cuando tienes un vehículo aprobado.
              </Text>
            ) : sedesSinCoordenadas ? (
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                El aporte se calcula cuando la sede elegida tiene coordenadas.
              </Text>
            ) : cargandoSugerencia || vehiculo === null ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#0284c7" />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">Calculando aporte sugerido...</Text>
              </View>
            ) : sugerenciaActual?.error ? (
              <View className="gap-1.5 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
                <Text className="text-[11px] text-amber-800 dark:text-amber-300">{sugerenciaActual.error}</Text>
                <Pressable onPress={() => setReintentos((n) => n + 1)} className="self-start">
                  <Text className="text-[11px] font-bold text-lochmara-600 dark:text-lochmara-400">Reintentar</Text>
                </Pressable>
              </View>
            ) : maxAporte != null && sugerenciaActual?.data ? (
              <>
                <View className="gap-0.5">
                  <Text className="text-xs font-black text-slate-900 dark:text-white">
                    Aporte sugerido: $ {formatearCop(maxAporte)} por cupo (máximo)
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                    Distancia: {sugerenciaActual.data.distance_km} km
                  </Text>
                </View>

                <TextInput
                  value={aporteTexto}
                  onChangeText={handleCambioAporte}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  className="py-2.5 px-3.5 rounded-2xl text-xs font-black border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                {avisoMaximo ? (
                  <Text className="text-[11px] text-amber-700 dark:text-amber-300">
                    El máximo para esta ruta es $ {formatearCop(maxAporte)}
                  </Text>
                ) : null}

                <View className="flex-row gap-1.5">
                  {[
                    { etiqueta: 'Sugerido', valor: maxAporte },
                    { etiqueta: '75 %', valor: redondearCentena(maxAporte * 0.75) },
                    { etiqueta: '50 %', valor: redondearCentena(maxAporte * 0.5) },
                    { etiqueta: 'Gratis', valor: 0 },
                  ].map((opcion) => {
                    const activo = aporteTexto !== '' && aporteCop === Math.min(maxAporte, opcion.valor);
                    return (
                      <Pressable
                        key={opcion.etiqueta}
                        onPress={() => aplicarAporte(opcion.valor)}
                        className={`flex-1 py-2 rounded-xl border items-center justify-center ${
                          activo
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-black ${
                            activo ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opcion.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tus pasajeros te pagan este aporte directamente, en efectivo o Nequi. UniWheels no cobra comisión.
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {sinVehiculo ? (
          <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
            Necesitas un vehículo aprobado para publicar rutas.
          </Text>
        ) : null}
        {sedesSinCoordenadas ? (
          <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
            La sede elegida no tiene coordenadas registradas, por ahora no se puede publicar con ella.
          </Text>
        ) : null}

        {/* Botón de Publicar */}
        <Pressable
          disabled={!puedePublicar}
          onPress={handlePublish}
          className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg ${
            !puedePublicar
              ? 'bg-emerald-600/50'
              : 'bg-emerald-600 active:bg-emerald-700 shadow-emerald-600/30'
          }`}
        >
          {isPublishing ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-xs font-bold text-white">Publicando ruta universitaria...</Text>
            </>
          ) : (
            <>
              <Car size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Publicar Trayecto Universitario</Text>
              <ArrowRight size={16} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>

      {/* Modales auxiliares */}
      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
        campuses={campuses}
        selectedCampus={selectingTarget === 'origin' ? selectedCampus.name : destinationCampus.name}
        onSelectCampus={(campus: Campus) => {
          if (selectingTarget === 'origin') {
            setSelectedCampus(campus);
          } else {
            setDestinationCampus(campus);
          }
          setIsCampusModalOpen(false);
        }}
      />

      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialCoords={customCoords}
        initialPlaceName={customPointName}
        onConfirm={(loc) => {
          setCustomCoords(loc.coords);
          setCustomPointName(loc.address);
          setIsMapPickerOpen(false);
        }}
      />

      <SetHomeLocationModal
        isOpen={isHomeModalOpen}
        onClose={() => setIsHomeModalOpen(false)}
        onLocationSaved={(loc) => {
          setCustomPointName(loc.address || loc.name);
          if (loc.coords) setCustomCoords(loc.coords);
          setIsHomeModalOpen(false);
        }}
      />

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}
