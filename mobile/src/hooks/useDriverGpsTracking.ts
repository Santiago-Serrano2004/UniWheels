import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { tripLifecycleService } from '@uniwheels/shared';

export interface DriverGpsLocation {
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  accuracy?: number;
}

export interface UseDriverGpsTrackingOptions {
  tripId?: string | number | null;
  isActive?: boolean;
  timeInterval?: number;
  distanceInterval?: number;
  onLocationUpdate?: (location: DriverGpsLocation) => void;
}

export function useDriverGpsTracking({
  tripId,
  isActive = true,
  timeInterval = 5000,
  distanceInterval = 10,
  onLocationUpdate,
}: UseDriverGpsTrackingOptions) {
  const [currentLocation, setCurrentLocation] = useState<DriverGpsLocation | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [lastReportedAt, setLastReportedAt] = useState<number | null>(null);

  const lastReportTimeRef = useRef<number>(0);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  onLocationUpdateRef.current = onLocationUpdate;

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    if (!isActive || !tripId) {
      setIsTracking(false);
      return;
    }

    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setPermissionError('Permiso de ubicación denegado para el GPS del conductor.');
            setIsTracking(false);
          }
          return;
        }

        if (!isMounted) return;
        setPermissionError(null);
        setIsTracking(true);

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval,
            distanceInterval,
          },
          async (loc) => {
            if (!isMounted) return;

            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            const rawSpeed = loc.coords.speed;
            const currentSpeedKmh = rawSpeed != null && rawSpeed > 0 ? Math.round(rawSpeed * 3.6) : 0;
            const currentHeading = loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : 0;
            const currentAccuracy = loc.coords.accuracy ?? undefined;

            const locData: DriverGpsLocation = {
              latitude: lat,
              longitude: lng,
              speedKmh: currentSpeedKmh,
              heading: currentHeading,
              accuracy: currentAccuracy,
            };

            setCurrentLocation(locData);
            setSpeedKmh(currentSpeedKmh);
            setHeading(currentHeading);
            setAccuracy(currentAccuracy ?? null);

            if (onLocationUpdateRef.current) {
              onLocationUpdateRef.current(locData);
            }

            // Emisión de telemetría periódica al backend
            const now = Date.now();
            if (tripId && (now - lastReportTimeRef.current >= 4500 || lastReportTimeRef.current === 0)) {
              lastReportTimeRef.current = now;
              try {
                await tripLifecycleService.reportPosition(tripId, {
                  latitude: lat,
                  longitude: lng,
                  speed_kmh: currentSpeedKmh,
                  heading_degrees: currentHeading,
                  accuracy_meters: currentAccuracy,
                });
                if (isMounted) {
                  setLastReportedAt(now);
                }
              } catch (err) {
                // Registrar sin interrumpir la interfaz del conductor
                console.warn('[useDriverGpsTracking] Error al emitir posición GPS:', err);
              }
            }
          }
        );
      } catch (err) {
        console.warn('[useDriverGpsTracking] Error al iniciar suscripción de ubicación:', err);
        if (isMounted) {
          setPermissionError('No se pudo acceder al hardware GPS del dispositivo.');
          setIsTracking(false);
        }
      }
    }

    startTracking();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
      setIsTracking(false);
    };
  }, [tripId, isActive, timeInterval, distanceInterval]);

  return {
    currentLocation,
    speedKmh,
    heading,
    accuracy,
    isTracking,
    permissionError,
    lastReportedAt,
  };
}
