import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import {
  X,
  Compass,
  ArrowUpRight,
  Gauge,
  CheckCircle2,
} from 'lucide-react-native';
import {
  tripLifecycleService,
  getPlaceCoordinates,
  routesService,
  openExternalNavigation,
} from '@uniwheels/shared';
import { LeafletMap, type LeafletMapRef, type LeafletMarker, type LeafletPolyline } from '@/components/map/LeafletMap';
import { useTurnByTurnNavigation } from '@/hooks/useTurnByTurnNavigation';

export interface InAppGpsNavigatorProps {
  trip?: any;
  route?: any;
  onExit: () => void;
  onComplete: () => void;
}

const DEFAULT_ORIGIN: [number, number] = [7.0856, -73.1142];

export function InAppGpsNavigator({
  trip,
  route,
  onExit,
  onComplete,
}: InAppGpsNavigatorProps) {
  const mapRef = useRef<LeafletMapRef>(null);

  const initialOrigin: [number, number] = route?.origin_coords
    ? [route.origin_coords[0], route.origin_coords[1]]
    : route?.origin_lat != null
    ? [route.origin_lat, route.origin_lng]
    : DEFAULT_ORIGIN;

  const [driverCoords, setDriverCoords] = useState<[number, number]>(initialOrigin);
  const [heading, setHeading] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [permissionError, setPermissionError] = useState('');

  // Destino actual: si el pasajero no ha sido verificado, navegar al punto de recogida; si ya abordó, navegar al campus/destino
  // Geometría real de la ruta publicada (OSRM en el servidor), no la adivinada por nombres.
  const [rutaReal, setRutaReal] = useState<[number, number][]>([]);
  const routeId = route?.id || trip?.route_id || trip?.id;
  useEffect(() => {
    if (!routeId) return undefined;
    let activo = true;
    routesService
      .getRoute(routeId)
      .then((detalle: any) => {
        const coords: [number, number][] = (detalle?.coordinates || []).map((c: any) => [Number(c[0]), Number(c[1])]);
        if (activo && coords.length > 1) setRutaReal(coords);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [routeId]);

  // Solo se navega al punto de recogida si se conocen sus coordenadas reales.
  const pickupLat = trip?.pickup_lat;
  const pickupLng = trip?.pickup_lng;
  const pickupCoords = useMemo<[number, number] | null>(
    () => (pickupLat != null && pickupLng != null ? [Number(pickupLat), Number(pickupLng)] : null),
    [pickupLat, pickupLng]
  );

  const campusCoords = rutaReal.length > 1
    ? rutaReal[rutaReal.length - 1]
    : route?.destination_coords
    ? [route.destination_coords[0], route.destination_coords[1]]
    : route?.destination_lat != null
    ? [route.destination_lat, route.destination_lng]
    : getPlaceCoordinates(route?.destination, true);

  const targetCoords: [number, number] = trip?.is_pin_verified || !pickupCoords
    ? (campusCoords as [number, number])
    : (pickupCoords as [number, number]);

  const turnByTurn = useTurnByTurnNavigation(driverCoords, targetCoords);

  // Telemetría GPS cada 5s y seguimiento de cámara
  const lastReportRef = useRef(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isActive = true;

    async function startGpsTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isActive) setPermissionError('Permiso de ubicación denegado para el GPS en vivo.');
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (loc) => {
            if (!isActive) return;
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            const currentHeading = loc.coords.heading || 0;
            const currentSpeed = loc.coords.speed != null && loc.coords.speed > 0
              ? Math.round(loc.coords.speed * 3.6)
              : 0;

            setDriverCoords([lat, lng]);
            setHeading(currentHeading);
            setSpeedKmh(currentSpeed);
            setPermissionError('');

            // Centrar cámara en el vehículo suavemente
            mapRef.current?.animateTo([lat, lng], 17, 800);

            // Reportar telemetría al backend cada 5s
            const now = Date.now();
            const tripIdToReport = trip?.id || route?.id;
            if (tripIdToReport && now - lastReportRef.current >= 5000) {
              lastReportRef.current = now;
              tripLifecycleService.reportPosition(tripIdToReport, {
                latitude: lat,
                longitude: lng,
                speed_kmh: currentSpeed,
                heading_degrees: currentHeading,
                accuracy_meters: loc.coords.accuracy || undefined,
              }).catch(() => {});
            }
          }
        );
      } catch (err: any) {
        if (isActive) setPermissionError(err?.message || 'Error al iniciar seguimiento GPS.');
      }
    }

    startGpsTracking();

    return () => {
      isActive = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [trip?.id, route?.id]);

  // Enlaces de navegación externa (Waze / Google Maps / Apple Maps)
  const handleOpenWaze = () => {
    if (targetCoords) {
      openExternalNavigation(
        'waze',
        { destLat: targetCoords[0], destLng: targetCoords[1] },
        (url: string) => Linking.openURL(url).catch(() => {})
      );
    }
  };

  const handleOpenGoogleMaps = () => {
    if (targetCoords) {
      openExternalNavigation(
        'google_maps',
        {
          destLat: targetCoords[0],
          destLng: targetCoords[1],
          originLat: driverCoords[0],
          originLng: driverCoords[1],
        },
        (url: string) => Linking.openURL(url).catch(() => {})
      );
    }
  };

  const handleOpenAppleMaps = () => {
    if (targetCoords) {
      openExternalNavigation(
        'apple_maps',
        { destLat: targetCoords[0], destLng: targetCoords[1] },
        (url: string) => Linking.openURL(url).catch(() => {})
      );
    }
  };

  const isMoto =
    route?.vehicle?.toLowerCase().includes('moto') ||
    trip?.vehicle_model?.toLowerCase().includes('moto') ||
    (trip?.vehicle_plate && trip.vehicle_plate.length === 6 && /[a-zA-Z]$/.test(trip.vehicle_plate)) ||
    (route?.plate && route.plate.length === 6 && /[a-zA-Z]$/.test(route.plate));

  const markers: LeafletMarker[] = useMemo(() => {
    const list: LeafletMarker[] = [
      {
        id: 'driver-vehicle',
        coordinate: driverCoords,
        kind: isMoto ? 'vehicle-moto' : 'vehicle-car',
        rotation: heading,
        isMoving: speedKmh > 0,
        color: '#0284c7',
      },
    ];

    if (targetCoords) {
      const isDestCampus = trip?.is_pin_verified || !pickupCoords;
      list.push({
        id: 'target-dest',
        coordinate: targetCoords,
        kind: isDestCampus ? 'campus' : 'pickup',
        label: isDestCampus ? 'Campus de destino' : 'Punto de encuentro',
        color: isDestCampus ? '#10b981' : '#f59e0b',
        forceBirrete: isDestCampus,
      });
    }

    return list;
  }, [driverCoords, heading, speedKmh, isMoto, targetCoords, trip?.is_pin_verified, pickupCoords]);

  const polylines: LeafletPolyline[] = useMemo(() => {
    const routeCoords = turnByTurn.routeCoordinates.length >= 2
      ? turnByTurn.routeCoordinates
      : rutaReal.length > 1
      ? rutaReal
      : targetCoords
      ? [driverCoords, targetCoords]
      : [];

    if (routeCoords.length >= 2) {
      return [
        {
          id: 'nav-route',
          coordinates: routeCoords,
          color: '#0284c7',
          weight: 6,
          opacity: 0.95,
        },
      ];
    }
    return [];
  }, [turnByTurn.routeCoordinates, rutaReal, targetCoords, driverCoords]);

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* 1. MAPA NAVEGADOR COMPLETO */}
      <LeafletMap
        ref={mapRef}
        initialCenter={driverCoords}
        initialZoom={17}
        markers={markers}
        polylines={polylines}
        style={{ width: '100%', height: '100%' }}
      />

      {/* El layout de pestañas ya aplica el área segura: no sumar insets aquí. */}
      {/* 2. HUD SUPERIOR: PRÓXIMA MANIOBRA & SALIR */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 8, paddingHorizontal: 16 }}>
        <View className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-2xl bg-lochmara-600 items-center justify-center shadow-md">
                <ArrowUpRight size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                  {turnByTurn.distanciaFormateada ? `${turnByTurn.distanciaFormateada} restantes` : 'Ruta Activa'}
                </Text>
                <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={2}>
                  {turnByTurn.instruccion || (trip?.is_pin_verified ? 'Rumbo al Campus' : 'Rumbo al Punto de Encuentro')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onExit}
              hitSlop={8}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </Pressable>
          </View>

          {permissionError ? (
            <View className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{permissionError}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 3. HUD INFERIOR: VELOCÍMETRO, EXTERNAL LINKS Y BOTÓN FINALIZAR */}
      <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 8, paddingHorizontal: 16 }}>
        <View className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl gap-3">
          {/* Fila con Velocímetro y Apps Externas */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Gauge size={16} color="#0284c7" />
              <Text className="text-base font-mono font-black text-slate-900 dark:text-white">
                {speedKmh} <Text className="text-[10px] font-sans font-bold text-slate-400">km/h</Text>
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleOpenWaze}
                className="px-3 py-2 rounded-2xl bg-[#33ccff] items-center justify-center"
              >
                <Text className="text-xs font-black text-slate-950">Waze</Text>
              </Pressable>

              <Pressable
                onPress={handleOpenGoogleMaps}
                className="px-3 py-2 rounded-2xl bg-white border border-slate-200 items-center justify-center"
              >
                <Text className="text-xs font-black text-slate-900">Maps</Text>
              </Pressable>

              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={handleOpenAppleMaps}
                  className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
                >
                  <Compass size={16} color="#64748b" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Botón de Finalización */}
          <Pressable
            onPress={onComplete}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <CheckCircle2 size={18} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Finalizar y Liquidar Viaje</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
