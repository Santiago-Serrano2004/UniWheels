/**
 * @file osrmRoute.js
 * @description Ruteo vehicular calle por calle vía OSRM y resolución geoespacial
 * aproximada por nombre de lugar — mismas funciones puras que
 * frontend/src/hooks/useOsrmRoute.js (no se modificó ese archivo web para no
 * arriesgar nada ahí; esta es la copia consumida por mobile).
 */

// Suavizado angular de rumbo (Lerp más corto).
export function lerpAngle(current, target, factor = 0.18) {
  let diff = ((target - current + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return current + diff * factor;
}

// Coordenadas aproximadas según el nombre del sector o sede en el AMB —
// misma tabla que la web usa para ubicar el origen de un resultado de
// búsqueda en el mapa (el backend de búsqueda no devuelve lat/lng reales del
// punto de origen del conductor, solo el nombre).
/** @returns {[number, number]} */
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

/** Consultar geometría vehicular real calle por calle en OSRM. */
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
  } catch {
    // Sin red / OSRM caído — se usa el fallback lineal (los dos puntos tal cual).
  }

  return points;
}
