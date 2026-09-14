/**
 * Constructores de deep links universales (Waze / Google Maps / Apple Maps) —
 * puros, sin efectos secundarios, portables tal cual entre web y mobile.
 *
 * Lo que SÍ es específico de plataforma es cómo se "abre" la URL resultante
 * (`window.open` en web, `Linking.openURL` en React Native) y cómo se detecta
 * el sistema operativo (`navigator.userAgent` no existe en RN, se usa
 * `Platform.OS` en su lugar) — por eso `openExternalNavigation` recibe la
 * función de apertura como parámetro en vez de asumir el navegador, y
 * `isIOS`/`isAndroid`/`isMobile` NO se migran aquí (cada plataforma ya tiene su
 * propia forma nativa y más confiable de saberlo).
 */

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
 * Arma la URL de navegación indicada y la abre vía la función `openFn` que da
 * cada plataforma: web pasa `(url) => window.open(url, '_blank', 'noopener,noreferrer')`,
 * mobile pasa `(url) => Linking.openURL(url)`.
 * @param {'google_maps'|'waze'|'apple_maps'} app
 * @param {{destLat:number, destLng:number, originLat?:number, originLng?:number}} coords
 * @param {(url: string) => void} openFn
 */
export function openExternalNavigation(app, coords, openFn) {
  const builder = URL_BUILDERS[app];
  if (!builder || coords?.destLat == null || coords?.destLng == null || !openFn) return;
  openFn(builder(coords));
}
