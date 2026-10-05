import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LeafletMap, type LeafletMapRef, type LeafletMarker, type LeafletPolyline } from '@/components/map/LeafletMap';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronUp,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Car,
  MapPin,
  Locate,
  Radio,
  ShieldAlert,
} from 'lucide-react-native';
import {
  fetchRoadGeometry,
  getPlaceCoordinates,
  routesService,
  tripLifecycleService,
  useAppStore,
} from '@uniwheels/shared';
import { TripRouteMap } from '@/components/TripRouteMap';
import { ActiveRoleConflictBlocker } from '@/components/ActiveRoleConflictBlocker';
import { usePassengerLiveTracking } from '@/hooks/usePassengerLiveTracking';
import { SosEmergencyModal } from '@/components/SosEmergencyModal';

const initialsOf = (name?: string) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';

export default function MapScreen() {
  const activeRole = useAppStore((s) => s.activeRole);
  const activeDriverTrip = useAppStore((s) => s.activeDriverTrip);
  const activePassengerBooking = useAppStore((s) => s.activePassengerBooking);
  const toggleRole = useAppStore((s) => s.toggleRole);
  const selectedSearchRoute = useAppStore((s) => s.selectedSearchRoute);
  const clearSelectedSearchRoute = useAppStore((s) => s.clearSelectedSearchRoute);
  const bookPassengerTrip = useAppStore((s) => s.bookPassengerTrip);

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

  // 1. Si el pasajero tiene un viaje activo/confirmado, mostrar mapa interactivo de telemetría en vivo
  if (activePassengerBooking && activeRole === 'passenger') {
    return <PassengerLiveTrackingMapView booking={activePassengerBooking} />;
  }

  // 2. Si hay una ruta seleccionada desde el buscador, mostrar vista de reserva
  if (selectedSearchRoute) {
    return (
      <RouteBookingView route={selectedSearchRoute} onClear={clearSelectedSearchRoute} onBooked={bookPassengerTrip} />
    );
  }

  // 3. Estado vacío si no hay ruta ni reserva activa
  return (
    <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950 items-center justify-center p-6">
      <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-4">
        <View className="w-16 h-16 rounded-3xl bg-lochmara-500/10 border border-lochmara-500/20 items-center justify-center">
          <RouteIcon size={30} color="#0284c7" />
        </View>
        <View className="items-center gap-1.5">
          <Text className="text-base font-black text-slate-900 dark:text-white text-center">
            No tienes ninguna ruta activa
          </Text>
          <Text className="text-xs text-slate-400 text-center leading-relaxed">
            Aún no has seleccionado una ruta para explorar. Elige un trayecto en el inicio para ver el mapa y reservar tu
            cupo.
          </Text>
        </View>
        <View className="w-full gap-2">
          <Pressable
            onPress={() => router.push('/(tabs)')}
            className="w-full py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2"
          >
            <Search size={16} color="#ffffff" />
            <Text className="text-white text-xs font-black">Explorar Viajes en Inicio</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/history')}
            className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center gap-1.5"
          >
            <Calendar size={14} color="#64748b" />
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Ver Mi Historial</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Vista de Seguimiento GPS en Tiempo Real para Pasajero
 * Muestra el vehículo del conductor rotando según heading, polilínea de ruta,
 * cálculo de ETA en vivo, recentrado de cámara y botón de pánico SOS.
 */
function PassengerLiveTrackingMapView({ booking }: { booking: any }) {
  const colorScheme = useColorScheme();
  const mapRef = useRef<LeafletMapRef>(null);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [cameraMode, setCameraMode] = useState<'driver' | 'pickup' | 'overview'>('overview');

  // Coordenadas de recogida y destino
  const pickupCoord: [number, number] = useMemo(() => [
    booking.pickup_lat != null ? booking.pickup_lat : getPlaceCoordinates(booking.origin, false)[0],
    booking.pickup_lng != null ? booking.pickup_lng : getPlaceCoordinates(booking.origin, false)[1],
  ], [booking.pickup_lat, booking.pickup_lng, booking.origin]);

  const destinationCoord: [number, number] = useMemo(() => [
    booking.destination_lat != null ? booking.destination_lat : getPlaceCoordinates(booking.destination, true)[0],
    booking.destination_lng != null ? booking.destination_lng : getPlaceCoordinates(booking.destination, true)[1],
  ], [booking.destination_lat, booking.destination_lng, booking.destination]);

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Hook de telemetría reactiva cada 5 segundos
  const {
    driverCoords,
    isTrackingActive,
    formattedDistance,
    etaMinutes,
  } = usePassengerLiveTracking({
    tripId: booking.id,
    tripStatus: booking.status || 'in_progress',
    pickupCoords: pickupCoord,
  });

  // Trazar polilínea de la ruta
  useEffect(() => {
    fetchRoadGeometry([pickupCoord, destinationCoord]).then(setRouteCoords);
  }, [pickupCoord, destinationCoord]);

  // Tipo de vehículo
  const isMoto =
    booking.vehicle?.toLowerCase().includes('moto') ||
    (booking.plate && booking.plate.length === 6 && /[a-zA-Z]$/.test(booking.plate));

  // Coordenadas efectivas del conductor (o punto de recogida como inicial)
  const currentDriverPos: [number, number] = useMemo(() => {
    return driverCoords
      ? [driverCoords.latitude, driverCoords.longitude]
      : pickupCoord;
  }, [driverCoords, pickupCoord]);

  const currentHeading = driverCoords?.heading || 0;
  const currentSpeed = driverCoords?.speed || 0;

  // Recentrado de cámara inteligente
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;

    if (cameraMode === 'overview') {
      // Enfocar vehículo del conductor
      setCameraMode('driver');
      mapRef.current.animateTo(currentDriverPos, 17, 600);
    } else if (cameraMode === 'driver') {
      // Enfocar punto de recogida del pasajero
      setCameraMode('pickup');
      mapRef.current.animateTo(pickupCoord, 17, 600);
    } else {
      // Vista general de todos los puntos
      setCameraMode('overview');
      mapRef.current.fitToCoordinates(
        [currentDriverPos, pickupCoord, destinationCoord],
        { top: 120, right: 60, bottom: 240, left: 60 },
        600
      );
    }
  }, [cameraMode, currentDriverPos, pickupCoord, destinationCoord]);

  const lineColor = colorScheme === 'dark' ? '#38bdf8' : '#0284c7';

  const markers: LeafletMarker[] = useMemo(
    () => [
      {
        id: 'pickup',
        coordinate: pickupCoord,
        kind: 'pickup',
        label: booking.origin || 'Tu punto de recogida',
        color: '#f59e0b',
      },
      {
        id: 'destination',
        coordinate: destinationCoord,
        kind: 'destination',
        label: booking.destination || 'Campus de destino',
        color: '#10b981',
        forceBirrete: true,
      },
      {
        id: 'driver-vehicle',
        coordinate: currentDriverPos,
        kind: isMoto ? 'vehicle-moto' : 'vehicle-car',
        rotation: currentHeading,
        isMoving: currentSpeed > 0,
        label: booking.driverName ? `Conductor: ${booking.driverName}` : 'Conductor',
        color: '#0284c7',
      },
    ],
    [
      pickupCoord,
      destinationCoord,
      currentDriverPos,
      isMoto,
      currentHeading,
      currentSpeed,
      booking.origin,
      booking.destination,
      booking.driverName,
    ]
  );

  const polylines: LeafletPolyline[] = useMemo(() => {
    if (routeCoords && routeCoords.length > 1) {
      return [
        {
          id: 'live-route',
          coordinates: routeCoords,
          color: lineColor,
          weight: 5,
          opacity: 0.9,
        },
      ];
    }
    return [];
  }, [routeCoords, lineColor]);

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <LeafletMap
        ref={mapRef}
        initialCenter={[(pickupCoord[0] + destinationCoord[0]) / 2, (pickupCoord[1] + destinationCoord[1]) / 2]}
        initialZoom={13}
        markers={markers}
        polylines={polylines}
      />

      {/* Cabecera Flotante con ETA y Telemetría en Vivo */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0" pointerEvents="box-none">
        <View className="px-3 pt-2 gap-2" pointerEvents="box-none">
          <View className="flex-row items-center justify-between" pointerEvents="box-none">
            <Pressable
              onPress={() => router.push('/(tabs)')}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md"
            >
              <ArrowLeft size={15} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-800 dark:text-white">Inicio</Text>
            </Pressable>

            {/* Botón SOS de Pánico en el Mapa */}
            <Pressable
              onPress={() => setSosModalOpen(true)}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-600 active:bg-rose-700 border border-rose-500 shadow-lg shadow-rose-950/40"
            >
              <ShieldAlert size={15} color="#ffffff" />
              <Text className="text-white text-xs font-black tracking-wide">SOS</Text>
            </Pressable>
          </View>

          {/* Banner de Estado en Vivo */}
          <View className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between shadow-lg">
            <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
              <View className="w-9 h-9 rounded-xl bg-lochmara-500/15 border border-lochmara-500/30 items-center justify-center">
                <Radio size={16} color="#0284c7" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                  {etaMinutes != null ? `Llegada estimada en ~${etaMinutes} min` : 'Conductor en camino'}
                </Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  {formattedDistance ? `A ${formattedDistance} de tu punto de abordaje` : 'Sincronizando GPS en vivo...'}
                </Text>
              </View>
            </View>

            <View className="items-end pl-2">
              <View className="flex-row items-center gap-1">
                <View className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <Text
                  className={`text-[10px] font-mono font-black ${
                    isTrackingActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                  }`}
                >
                  {isTrackingActive ? 'GPS ACTIVO' : 'CONECTANDO'}
                </Text>
              </View>
              {driverCoords?.speed != null && (
                <Text className="text-[9px] font-mono text-slate-400">{driverCoords.speed} km/h</Text>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Controles Flotantes Laterales: Recentrado */}
      <View className="absolute right-4 bottom-52 gap-2" pointerEvents="box-none">
        <Pressable
          onPress={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center shadow-lg active:scale-95"
        >
          {cameraMode === 'driver' ? (
            <Car size={18} color="#0284c7" />
          ) : cameraMode === 'pickup' ? (
            <MapPin size={18} color="#0284c7" />
          ) : (
            <Locate size={18} color="#0284c7" />
          )}
        </Pressable>
      </View>

      {/* Tarjeta Flotante Inferior de Viaje Activo */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-4 border-t border-slate-200 dark:border-slate-800 gap-3"
        style={{ paddingBottom: 28 }}
      >
        <Pressable onPress={() => setDetailsExpanded((e) => !e)} className="items-center py-0.5 -mt-1">
          <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </Pressable>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-11 h-11 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 items-center justify-center shrink-0">
              <Text className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">
                {initialsOf(booking.driverName)}
              </Text>
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                  {booking.driverName || 'Tu conductor'}
                </Text>
                <ShieldCheck size={13} color="#0284c7" />
              </View>
              <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                {booking.vehicle || 'Vehículo'} • <Text className="font-mono font-bold text-slate-300">{booking.plate || ''}</Text>
              </Text>
            </View>
          </View>

          {/* PIN de Abordaje Destacado */}
          {booking.boardingPin && (
            <View className="items-end shrink-0 pl-2">
              <View className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center">
                <Text className="text-[9px] font-bold text-amber-500 uppercase">PIN Abordaje</Text>
                <Text className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
                  {booking.boardingPin}
                </Text>
              </View>
            </View>
          )}
        </View>

        {detailsExpanded ? (
          <View className="gap-2.5 pt-1">
            <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500 shrink-0" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                  {booking.origin}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                  {booking.destination}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/history')}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center justify-center gap-2"
            >
              <Calendar size={14} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-800 dark:text-white">Ver Detalles y Comprobante</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setDetailsExpanded(true)}
            className="py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex-row items-center justify-center gap-1.5"
          >
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Ver Detalles del Viaje</Text>
            <ChevronUp size={14} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {/* Modal de Emergencia SOS */}
      <SosEmergencyModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        currentCoords={currentDriverPos}
        tripInfo={{
          id: booking.id,
          driverName: booking.driverName,
          vehicle: booking.vehicle,
          plate: booking.plate,
        }}
      />
    </View>
  );
}

function RouteBookingView({
  route,
  onClear,
  onBooked,
}: {
  route: NonNullable<ReturnType<typeof useAppStore.getState>['selectedSearchRoute']>;
  onClear: () => void;
  onBooked: (payload: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Ruta real que guardó el conductor (PostGIS). Los nombres de lugar solo se usan si el
  // backend no responde, como respaldo.
  const [originCoord, setOriginCoord] = useState<[number, number]>(() => getPlaceCoordinates(route.origin, false));
  const [destinationCoord, setDestinationCoord] = useState<[number, number]>(() => getPlaceCoordinates(route.destination, true));
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const pickupCoord: [number, number] | null =
    route.pickup_lat != null && route.pickup_lng != null ? [Number(route.pickup_lat), Number(route.pickup_lng)] : null;

  useEffect(() => {
    let activo = true;
    routesService
      .getRoute(route.id)
      .then((detalle: any) => {
        const coords: [number, number][] = (detalle?.coordinates || []).map((c: any) => [Number(c[0]), Number(c[1])]);
        if (!activo) return;
        if (coords.length > 1) {
          setRouteCoords(coords);
          setOriginCoord(coords[0]);
          setDestinationCoord(coords[coords.length - 1]);
        } else {
          fetchRoadGeometry([originCoord, destinationCoord]).then((c: [number, number][]) => activo && setRouteCoords(c));
        }
      })
      .catch(() => {
        fetchRoadGeometry([originCoord, destinationCoord]).then((c: [number, number][]) => activo && setRouteCoords(c));
      });
    return () => {
      activo = false;
    };
    // Solo al abrir la vista previa de esta ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.id]);

  const fareCop = Number(route.fare_cop ?? 0);

  const confirmarReserva = async () => {
    setIsBooking(true);
    try {
      const respuesta = await tripLifecycleService.bookTrip({
        route_id: route.id,
        passenger_name: useAppStore.getState().user?.name,
        driver_name: route.driverName,
        vehicle_plate: route.plate,
        vehicle_model: route.vehicle,
        pickup_address: route.origin,
        dropoff_address: route.destination,
        total_fare_cop: fareCop,
        scheduled_pickup_time: route.scheduled_date ? `${route.scheduled_date}T00:00:00` : new Date().toISOString(),
      });

      const tripIdReal = respuesta?.data?.trip_id;
      if (!tripIdReal) {
        throw new Error('El servidor no devolvió el id del viaje.');
      }

      onBooked({
        id: tripIdReal,
        driverName: route.driverName,
        vehicle: route.vehicle,
        plate: route.plate,
        departureTime: route.departureTime,
        origin: route.origin,
        destination: route.destination,
        fare: fareCop,
        boardingPin: respuesta?.data?.boarding_pin,
        pickup_lat: pickupCoord ? pickupCoord[0] : originCoord[0],
        pickup_lng: pickupCoord ? pickupCoord[1] : originCoord[1],
        destination_lat: destinationCoord[0],
        destination_lng: destinationCoord[1],
      });

      onClear();
      router.push('/(tabs)/history');
    } catch (err: any) {
      Alert.alert('No se pudo reservar', err?.message || 'Intenta nuevamente en unos segundos.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <TripRouteMap originCoord={originCoord} destinationCoord={destinationCoord} routeCoords={routeCoords} pickupCoord={pickupCoord} />

      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0" pointerEvents="box-none">
        <View className="px-3 pt-2">
          <Pressable
            onPress={() => {
              onClear();
              router.push('/(tabs)');
            }}
            className="self-start flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft size={15} color="#0284c7" />
            <Text className="text-xs font-bold text-slate-800 dark:text-white">Inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-4 border-t border-slate-200 dark:border-slate-800 gap-3"
        style={{ paddingBottom: 28 }}
      >
        <Pressable onPress={() => setExpanded((e) => !e)} className="items-center py-0.5 -mt-1">
          <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </Pressable>

        <Pressable onPress={() => setExpanded((e) => !e)} className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-11 h-11 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 items-center justify-center shrink-0">
              <Text className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">
                {initialsOf(route.driverName)}
              </Text>
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                  {route.driverName}
                </Text>
                <ShieldCheck size={13} color="#0284c7" />
              </View>
              <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                {route.vehicle} • {route.plate} • {route.availableSeats} cupos
              </Text>
            </View>
          </View>
          <View className="items-end shrink-0 pl-2">
            <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400">{route.fare}</Text>
            <Text className="text-[9px] text-slate-400 font-bold">Aporte por cupo</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2"
        >
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500 shrink-0" />
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                {route.origin}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-slate-400 shrink-0">Salida {route.departureTime || '—'}</Text>
          </View>
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                {route.destination}
              </Text>
            </View>
            <Text className="text-[10px] font-black text-emerald-500 shrink-0">Llegada ~{route.arrivalTime || '—'}</Text>
          </View>
        </Pressable>

        {expanded ? (
          <>
            <Pressable
              onPress={confirmarReserva}
              disabled={isBooking}
              className="py-3.5 rounded-2xl bg-emerald-600 flex-row items-center justify-center gap-2 disabled:opacity-60"
            >
              {isBooking ? <ActivityIndicator color="#ffffff" /> : <CheckCircle2 size={16} color="#ffffff" />}
              <Text className="text-white text-xs font-black">Reservar cupo</Text>
            </Pressable>
            <Text className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              {fareCop > 0
                ? `Aporte al conductor: $${fareCop.toLocaleString('es-CO')}, en efectivo o Nequi, directo.`
                : 'Viaje gratis'}
            </Text>
          </>
        ) : (
          <Pressable
            onPress={() => setExpanded(true)}
            className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-1.5"
          >
            <Text className="text-white text-xs font-black">Ver Opciones y Reservar</Text>
            <ChevronUp size={16} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
