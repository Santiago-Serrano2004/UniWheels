import { useState, useEffect, useRef } from 'react';
import {
  fetchTurnByTurnRoute,
  haversineDistanceMeters,
  formatDistance,
} from '@uniwheels/shared';
import type { ManeuverStep } from './useOsrmRoute';

const UMBRAL_AVANCE_METROS = 25;

export interface TurnByTurnNavigationState {
  tieneIndicacionesReales: boolean;
  instruccion: string | null;
  calle: string | null;
  distanciaFormateada: string | null;
  haLlegado: boolean;
  routeCoordinates: [number, number][];
  currentStepIndex: number;
  steps: ManeuverStep[];
  totalDistanceMeters?: number;
  totalDurationSeconds?: number;
}

export function useTurnByTurnNavigation(
  driverCoords: [number, number] | null,
  destino: [number, number] | null
): TurnByTurnNavigationState {
  const [steps, setSteps] = useState<ManeuverStep[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState<number | undefined>(undefined);
  const [totalDuration, setTotalDuration] = useState<number | undefined>(undefined);
  const destinoConsultadoRef = useRef<string | null>(null);

  const destLat = destino?.[0];
  const destLng = destino?.[1];

  useEffect(() => {
    if (!driverCoords || destLat == null || destLng == null) return undefined;
    const key = `${destLat},${destLng}`;
    if (destinoConsultadoRef.current === key) return undefined;
    destinoConsultadoRef.current = key;

    let activo = true;
    fetchTurnByTurnRoute([driverCoords, [destLat, destLng]]).then((res: any) => {
      if (activo) {
        setSteps(res.steps || []);
        setRouteCoordinates(res.coordinates || []);
        setTotalDistance(res.totalDistanceMeters);
        setTotalDuration(res.totalDurationSeconds);
        setCurrentStepIndex(0);
      }
    });

    return () => {
      activo = false;
    };
  }, [driverCoords, destLat, destLng]);

  // Avanzar de maniobra según la posición real
  useEffect(() => {
    if (!driverCoords || steps.length === 0 || currentStepIndex >= steps.length - 1) return;
    const stepActual = steps[currentStepIndex];
    if (!stepActual?.maneuverLocation) return;
    const distancia = haversineDistanceMeters(driverCoords, stepActual.maneuverLocation);
    if (distancia < UMBRAL_AVANCE_METROS) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [driverCoords, steps, currentStepIndex]);

  const pasoActual = steps[currentStepIndex] || null;
  const distanciaAlPaso = pasoActual && driverCoords && pasoActual.maneuverLocation
    ? haversineDistanceMeters(driverCoords, pasoActual.maneuverLocation)
    : null;

  return {
    tieneIndicacionesReales: steps.length > 0,
    instruccion: pasoActual?.instruction || null,
    calle: pasoActual?.streetName || null,
    distanciaFormateada: distanciaAlPaso != null ? formatDistance(distanciaAlPaso) : null,
    haLlegado: currentStepIndex === steps.length - 1 && pasoActual?.instruction === 'Has llegado a tu destino',
    routeCoordinates,
    currentStepIndex,
    steps,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
  };
}

export default useTurnByTurnNavigation;
