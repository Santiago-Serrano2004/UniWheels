import {
  fetchRoadGeometry,
  fetchTurnByTurnRoute,
  lerpAngle,
  getPlaceCoordinates,
  maniobraATexto,
  haversineDistanceMeters,
  formatDistance,
} from '@uniwheels/shared';

export interface ManeuverStep {
  distanceMeters: number;
  durationSeconds?: number;
  streetName: string;
  instruction: string;
  maneuverLocation: [number, number];
}

export interface TurnByTurnRouteResult {
  coordinates: [number, number][];
  steps: ManeuverStep[];
  totalDistanceMeters?: number;
  totalDurationSeconds?: number;
}

export function useOsrmRoute() {
  return {
    fetchRoadGeometry,
    fetchTurnByTurnRoute,
    lerpAngle,
    getPlaceCoordinates,
    maniobraATexto,
    haversineDistanceMeters,
    formatDistance,
  };
}

export {
  fetchRoadGeometry,
  fetchTurnByTurnRoute,
  lerpAngle,
  getPlaceCoordinates,
  maniobraATexto,
  haversineDistanceMeters,
  formatDistance,
};

export default useOsrmRoute;
