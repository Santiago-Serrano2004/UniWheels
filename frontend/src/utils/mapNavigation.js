/**
 * Navegación externa (Waze / Google Maps / Apple Maps) vía deep links universales.
 *
 * Usa los formatos universales oficiales de cada proveedor (https://...), que el
 * propio sistema operativo resuelve: si la app nativa está instalada, la abre
 * directo con los datos del viaje; si no, cae automáticamente a la versión web o
 * a la tienda de apps. No requiere detectar ni el SO ni si la app está instalada
 * — ese fallback ya lo maneja el enlace universal por diseño.
 */

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export function isMobile() {
  return isIOS() || isAndroid();
}

export function buildGoogleMapsUrl({ destLat, destLng, originLat, originLng, travelmode = 'driving' }) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destLat},${destLng}`,
    travelmode,
  });
  if (originLat != null && originLng != null) {
    params.set('origin', `${originLat},${originLng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildWazeUrl({ destLat, destLng }) {
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
}

export function buildAppleMapsUrl({ destLat, destLng, travelmode = 'd' }) {
  return `https://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=${travelmode}`;
}

const URL_BUILDERS = {
  google_maps: buildGoogleMapsUrl,
  waze: buildWazeUrl,
  apple_maps: buildAppleMapsUrl,
};

/**
 * Abre la app de navegación indicada con las coordenadas de destino del viaje.
 * @param {'google_maps'|'waze'|'apple_maps'} app
 * @param {{destLat:number, destLng:number, originLat?:number, originLng?:number}} coords
 */
export function openExternalNavigation(app, coords) {
  const builder = URL_BUILDERS[app];
  if (!builder || coords?.destLat == null || coords?.destLng == null) return;
  window.open(builder(coords), '_blank', 'noopener,noreferrer');
}
