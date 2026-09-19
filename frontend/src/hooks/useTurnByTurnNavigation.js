import { useState, useEffect, useRef } from 'react';
import { fetchTurnByTurnRoute } from './useOsrmRoute';
import { haversineDistanceMeters, formatDistance } from '../utils/geo';

const UMBRAL_AVANCE_METROS = 25;

/**
 * Sigue el progreso de una ruta giro a giro (OSRM, steps=true) contra la
 * posición GPS real del conductor. Solo vuelve a consultar OSRM cuando cambia
 * el destino objetivo (ej. de "punto de encuentro" a "campus" tras verificar
 * el PIN) — el avance de una maniobra a la siguiente se calcula localmente
 * comparando la posición real contra la ubicación de cada maniobra, sin
 * volver a llamar al servidor en cada movimiento.
 */
export function useTurnByTurnNavigation(driverCoords, destino) {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const destinoConsultadoRef = useRef(null);

  useEffect(() => {
    if (!driverCoords || !destino) return undefined;
    const key = `${destino[0]},${destino[1]}`;
    if (destinoConsultadoRef.current === key) return undefined;
    destinoConsultadoRef.current = key;

    let activo = true;
    fetchTurnByTurnRoute([driverCoords, destino]).then(({ steps: nuevosSteps }) => {
      if (activo) {
        setSteps(nuevosSteps);
        setCurrentStepIndex(0);
      }
    });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino?.[0], destino?.[1]]);

  // Avanzar de maniobra según la posición real, sin volver a consultar OSRM.
  useEffect(() => {
    if (!driverCoords || steps.length === 0 || currentStepIndex >= steps.length - 1) return;
    const distancia = haversineDistanceMeters(driverCoords, steps[currentStepIndex].maneuverLocation);
    if (distancia < UMBRAL_AVANCE_METROS) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [driverCoords, steps, currentStepIndex]);

  const pasoActual = steps[currentStepIndex] || null;
  const distanciaAlPaso = pasoActual && driverCoords
    ? haversineDistanceMeters(driverCoords, pasoActual.maneuverLocation)
    : null;

  return {
    tieneIndicacionesReales: steps.length > 0,
    instruccion: pasoActual?.instruction || null,
    calle: pasoActual?.streetName || null,
    distanciaFormateada: distanciaAlPaso != null ? formatDistance(distanciaAlPaso) : null,
    haLlegado: currentStepIndex === steps.length - 1 && pasoActual?.instruction === 'Has llegado a tu destino',
  };
}
