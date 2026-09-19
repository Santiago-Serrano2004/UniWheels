/**
 * @file useOsrmRoute.js
 * @description Hook y utilidades para ruteo vehicular calle por calle vía OSRM y resolución geoespacial.
 */

// Suavizado angular de rumbo (Lerp más corto)
export function lerpAngle(current, target, factor = 0.18) {
  let diff = ((target - current + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return current + diff * factor;
}

// Obtener coordenadas aproximadas según el nombre del sector o sede en el AMB
export const getPlaceCoordinates = (placeName, isCampusFallback = false) => {
  if (!placeName) return isCampusFallback ? [7.1193, -73.1042] : [7.0678, -73.1066];
  const name = placeName.toLowerCase();
  if (name.includes('jardín') || name.includes('jardin')) return [7.1193, -73.1042];
  if (name.includes('bosque')) return [7.0664, -73.1037];
  if (name.includes('csu')) return [7.1138, -73.1068];
  if (name.includes('casona')) return [7.1182, -73.1165];
  if (name.includes('cañaveral') || name.includes('floridablanca')) return [7.0678, -73.1066];
  if (name.includes('piedecuesta') || name.includes('puente')) return [7.0012, -73.0489];
  if (name.includes('san pío') || name.includes('san pio') || name.includes('cabecera')) return [7.1186, -73.1102];
  if (name.includes('provenza')) return [7.0856, -73.1142];
  if (name.includes('minas') || name.includes('victoria')) return [7.1080, -73.1250];
  if (name.includes('puerta del sol')) return [7.1023, -73.1185];
  return isCampusFallback ? [7.1193, -73.1042] : [7.0678, -73.1066];
};

/**
 * Consultar geometría vehicular real calle por calle en OSRM (OpenStreetMap Routing)
 */
export async function fetchRoadGeometry(points) {
  if (!points || points.length < 2) return [];

  const coordsParam = points.map((p) => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) return points;

    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map((pt) => [pt[1], pt[0]]);
    }
  } catch (e) {
    console.warn('Fallo OSRM client-side, usando fallback lineal:', e);
  }

  return points;
}

const MODIFICADOR_ES = {
  uturn: 'da la vuelta en U',
  'sharp right': 'gira fuertemente a la derecha',
  right: 'gira a la derecha',
  'slight right': 'mantente a la derecha',
  straight: 'continúa recto',
  'slight left': 'mantente a la izquierda',
  left: 'gira a la izquierda',
  'sharp left': 'gira fuertemente a la izquierda',
};

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Traduce una maniobra OSRM (type/modifier) a una instrucción legible en español
export function maniobraATexto(maneuver, streetName) {
  const { type, modifier } = maneuver || {};
  const calle = streetName ? ` hacia ${streetName}` : '';
  switch (type) {
    case 'depart':
      return `Inicia el recorrido${calle}`;
    case 'arrive':
      return 'Has llegado a tu destino';
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn':
      return `Toma la rotonda${calle}`;
    case 'merge':
      return `Incorpórate${calle}`;
    case 'fork':
      return `${modifier ? capitalizar(MODIFICADOR_ES[modifier] || 'continúa') : 'Continúa'} en la bifurcación${calle}`;
    case 'end of road':
      return `Al final de la vía, ${MODIFICADOR_ES[modifier] || 'continúa'}${calle}`;
    case 'continue':
    case 'new name':
      return `Continúa${calle}`;
    case 'turn':
    default:
      return `${capitalizar(MODIFICADOR_ES[modifier] || 'continúa')}${calle}`;
  }
}

/**
 * Consultar ruta con indicaciones giro a giro reales (turn-by-turn) en OSRM
 * (mismo servidor demo público que ya usa fetchRoadGeometry, con steps=true).
 * Devuelve la geometría completa y cada maniobra con su ubicación, distancia
 * e instrucción ya traducida a español.
 */
export async function fetchTurnByTurnRoute(points) {
  if (!points || points.length < 2) return { coordinates: [], steps: [] };

  const coordsParam = points.map((p) => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) return { coordinates: points, steps: [] };

    const data = await response.json();
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) return { coordinates: points, steps: [] };

    const coordinates = route.geometry.coordinates.map((pt) => [pt[1], pt[0]]);
    const steps = (route.legs || []).flatMap((leg) =>
      (leg.steps || []).map((step) => ({
        distanceMeters: step.distance,
        streetName: step.name || '',
        instruction: maniobraATexto(step.maneuver, step.name),
        maneuverLocation: [step.maneuver.location[1], step.maneuver.location[0]],
      }))
    );

    return { coordinates, steps };
  } catch (e) {
    console.warn('Fallo OSRM turn-by-turn, usando fallback lineal:', e);
    return { coordinates: points, steps: [] };
  }
}

export function useOsrmRoute() {
  return {
    fetchRoadGeometry,
    fetchTurnByTurnRoute,
    lerpAngle,
    getPlaceCoordinates,
  };
}

export default useOsrmRoute;
