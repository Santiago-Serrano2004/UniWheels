import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  useColorScheme,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Navigation,
  MapPin,
  X,
  Compass,
  ArrowUpRight,
  Gauge,
  CheckCircle2,
} from 'lucide-react-native';
import {
  tripLifecycleService,
  getPlaceCoordinates,
  openExternalNavigation,
  getMapTileProvider,
} from '@uniwheels/shared';
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
  const colorScheme = useColorScheme();
  const tileProvider = getMapTileProvider(colorScheme === 'dark' ? 'dark' : 'light');
  const mapRef = useRef<MapView>(null);

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
  const pickupCoords = trip?.pickup_address
    ? getPlaceCoordinates(trip.pickup_address, false)
    : null;

  const campusCoords = route?.destination_coords
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
            if (mapRef.current) {
              mapRef.current.animateCamera(
                {
                  center: { latitude: lat, longitude: lng },
                  heading: currentHeading,
                  pitch: 45,
                  zoom: 17,
                },
                { duration: 800 }
              );
            }

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

  const routePolyline = turnByTurn.routeCoordinates.length >= 2
    ? turnByTurn.routeCoordinates.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
    : targetCoords
    ? [
        { latitude: driverCoords[0], longitude: driverCoords[1] },
        { latitude: targetCoords[0], longitude: targetCoords[1] },
      ]
    : [];

  return (
    <View className="flex-1 bg-slate-950">
      {/* 1. MAPA NAVEGADOR COMPLETO */}
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        initialRegion={{
          latitude: driverCoords[0],
          longitude: driverCoords[1],
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsCompass={false}
        showsScale={false}
        showsUserLocation={false}
      >
        <UrlTile
          urlTemplate={tileProvider.url}
          maximumZ={19}
          flipY={false}
          zIndex={1}
        />

        {/* Polilínea de la ruta */}
        {routePolyline.length >= 2 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#0284c7"
            strokeWidth={6}
            zIndex={2}
          />
        )}

        {/* Marcador del Vehículo */}
        <Marker
          coordinate={{ latitude: driverCoords[0], longitude: driverCoords[1] }}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={heading}
          zIndex={10}
        >
          <View className="w-12 h-12 rounded-full bg-lochmara-600 border-2 border-white items-center justify-center shadow-lg">
            <Navigation size={22} color="#ffffff" />
          </View>
        </Marker>

        {/* Marcador de Destino */}
        {targetCoords && (
          <Marker
            coordinate={{ latitude: targetCoords[0], longitude: targetCoords[1] }}
            zIndex={5}
          >
            <View className="p-2 rounded-2xl bg-emerald-600 border border-white items-center justify-center shadow-md">
              <MapPin size={18} color="#ffffff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* 2. HUD SUPERIOR: PRÓXIMA MANIOBRA & SALIR */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 p-4 pointer-events-box-none">
        <View className="p-4 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-2xl bg-lochmara-600 items-center justify-center shadow-md">
                <ArrowUpRight size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-lochmara-400">
                  {turnByTurn.distanciaFormateada ? `${turnByTurn.distanciaFormateada} restantes` : 'Ruta Activa'}
                </Text>
                <Text className="text-sm font-black text-white" numberOfLines={2}>
                  {turnByTurn.instruccion || (trip?.is_pin_verified ? 'Rumbo al Campus' : 'Rumbo al Punto de Encuentro')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onExit}
              hitSlop={8}
              className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 items-center justify-center active:scale-95"
            >
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>

          {permissionError ? (
            <View className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <Text className="text-[11px] font-bold text-amber-300">{permissionError}</Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {/* 3. HUD INFERIOR: VELOCÍMETRO, EXTERNAL LINKS Y BOTÓN FINALIZAR */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 p-4 pointer-events-box-none">
        <View className="p-4 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl gap-3">
          {/* Fila con Velocímetro y Apps Externas */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <Gauge size={16} color="#0284c7" />
              <Text className="text-base font-mono font-black text-white">
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
                className="px-3 py-2 rounded-2xl bg-white items-center justify-center"
              >
                <Text className="text-xs font-black text-slate-900">Maps</Text>
              </Pressable>

              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={handleOpenAppleMaps}
                  className="px-3 py-2 rounded-2xl bg-slate-800 items-center justify-center border border-slate-700"
                >
                  <Compass size={16} color="#ffffff" />
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
      </SafeAreaView>
    </View>
  );
}
