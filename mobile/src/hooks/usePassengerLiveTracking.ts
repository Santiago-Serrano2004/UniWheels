import { useEffect, useState, useCallback } from 'react';
import {
  tripLifecycleService,
  haversineDistanceMeters,
  formatDistance,
} from '@uniwheels/shared';

export interface DriverLiveCoords {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy?: number;
  recordedAt?: string;
}

export interface UsePassengerLiveTrackingOptions {
  tripId?: string | number | null;
  tripStatus?: string | null;
  pickupCoords?: [number, number] | { latitude: number; longitude: number } | null;
  pollingIntervalMs?: number;
}

export const ACTIVE_TRACKING_STATUSES = [
  'en_camino',
  'en_punto_encuentro',
  'recogido',
  'confirmed',
  'in_progress',
  'active',
  'STATUS_EN_CAMINO',
  'STATUS_EN_PUNTO_ENCUENTRO',
  'STATUS_RECOGIDO',
];

export const INACTIVE_TRACKING_STATUSES = [
  'completado',
  'completed',
  'cancelado',
  'cancelled',
  'STATUS_COMPLETADO',
  'STATUS_CANCELADO',
];

export function usePassengerLiveTracking({
  tripId,
  tripStatus,
  pickupCoords,
  pollingIntervalMs = 5000,
}: UsePassengerLiveTrackingOptions) {
  const [driverCoords, setDriverCoords] = useState<DriverLiveCoords | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isStatusActive = Boolean(
    tripStatus &&
    !INACTIVE_TRACKING_STATUSES.includes(tripStatus) &&
    (ACTIVE_TRACKING_STATUSES.includes(tripStatus) || tripStatus === 'active')
  );

  const normalizedPickup = useCallback((): [number, number] | null => {
    if (!pickupCoords) return null;
    if (Array.isArray(pickupCoords) && pickupCoords.length >= 2) {
      return [pickupCoords[0], pickupCoords[1]];
    }
    if (typeof pickupCoords === 'object' && 'latitude' in pickupCoords && 'longitude' in pickupCoords) {
      return [pickupCoords.latitude, pickupCoords.longitude];
    }
    return null;
  }, [pickupCoords]);

  const updateCalculations = useCallback(
    (coords: DriverLiveCoords) => {
      const pickup = normalizedPickup();
      if (!pickup) {
        setDistanceMeters(null);
        setEtaMinutes(null);
        return;
      }

      try {
        const dist = haversineDistanceMeters([coords.latitude, coords.longitude], pickup);
        setDistanceMeters(dist);

        const distKm = dist / 1000;
        // Velocidad efectiva para estimación de tiempo (mínimo 20 km/h tráfico urbano)
        const effectiveSpeed = coords.speed && coords.speed > 5 ? coords.speed : 25;
        const eta = Math.max(1, Math.round((distKm / effectiveSpeed) * 60));
        setEtaMinutes(eta);
      } catch {
        setDistanceMeters(null);
        setEtaMinutes(null);
      }
    },
    [normalizedPickup]
  );

  useEffect(() => {
    let timer: any = null;
    let isMounted = true;

    if (!tripId || !isStatusActive) {
      setIsTrackingActive(false);
      return;
    }

    setIsTrackingActive(true);

    async function fetchPosition() {
      try {
        const latest = await tripLifecycleService.getLatestPosition(tripId);
        if (!isMounted) return;

        if (latest && typeof latest.latitude === 'number' && typeof latest.longitude === 'number') {
          const coords: DriverLiveCoords = {
            latitude: latest.latitude,
            longitude: latest.longitude,
            heading: latest.heading_degrees ?? latest.heading ?? 0,
            speed: latest.speed_kmh ?? latest.speed ?? 0,
            accuracy: latest.accuracy_meters ?? latest.accuracy,
            recordedAt: latest.created_at || latest.recorded_at,
          };

          setDriverCoords(coords);
          setLastUpdated(new Date());
          setError(null);
          updateCalculations(coords);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error al obtener posición del conductor');
        }
      }
    }

    // Consulta inicial inmediata
    fetchPosition();

    // Polling periódico
    timer = setInterval(fetchPosition, pollingIntervalMs);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
      setIsTrackingActive(false);
    };
  }, [tripId, tripStatus, isStatusActive, pollingIntervalMs, updateCalculations]);

  return {
    driverCoords,
    isTrackingActive,
    lastUpdated,
    distanceMeters,
    distanceKm: distanceMeters != null ? Math.round((distanceMeters / 1000) * 10) / 10 : null,
    formattedDistance: distanceMeters != null ? formatDistance(distanceMeters) : null,
    etaMinutes,
    error,
  };
}
