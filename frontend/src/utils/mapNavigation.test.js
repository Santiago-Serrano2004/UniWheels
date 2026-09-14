import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isIOS,
  isAndroid,
  isMobile,
  buildGoogleMapsUrl,
  buildWazeUrl,
  buildAppleMapsUrl,
  openExternalNavigation,
} from './mapNavigation';

const setUserAgent = (ua) => {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
};

describe('detección de plataforma', () => {
  afterEach(() => {
    setUserAgent('');
  });

  it('detecta iOS por el user agent (iPhone)', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isIOS()).toBe(true);
    expect(isAndroid()).toBe(false);
  });

  it('detecta Android por el user agent', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)');
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
  });

  it('isMobile es true en iOS y Android, false en escritorio', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isMobile()).toBe(true);

    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(isMobile()).toBe(false);
  });
});

describe('construcción de deep links de navegación', () => {
  it('Google Maps: incluye destino, origen y modo de viaje', () => {
    const url = buildGoogleMapsUrl({ destLat: 7.1193, destLng: -73.1042, originLat: 7.0678, originLng: -73.1066 });
    expect(url).toContain('https://www.google.com/maps/dir/?');
    expect(url).toContain('destination=7.1193%2C-73.1042');
    expect(url).toContain('origin=7.0678%2C-73.1066');
    expect(url).toContain('travelmode=driving');
  });

  it('Google Maps: omite el origen si no se provee (deja que el dispositivo use la ubicación actual)', () => {
    const url = buildGoogleMapsUrl({ destLat: 7.1193, destLng: -73.1042 });
    expect(url).not.toContain('origin=');
  });

  it('Waze: formato ll=lat,lng&navigate=yes', () => {
    const url = buildWazeUrl({ destLat: 7.1193, destLng: -73.1042 });
    expect(url).toBe('https://waze.com/ul?ll=7.1193,-73.1042&navigate=yes');
  });

  it('Apple Maps: formato daddr con dirflg de conducción por defecto', () => {
    const url = buildAppleMapsUrl({ destLat: 7.1193, destLng: -73.1042 });
    expect(url).toBe('https://maps.apple.com/?daddr=7.1193,-73.1042&dirflg=d');
  });
});

describe('openExternalNavigation', () => {
  let openSpy;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('abre la URL correcta según la app solicitada', () => {
    openExternalNavigation('waze', { destLat: 7.1193, destLng: -73.1042 });
    expect(openSpy).toHaveBeenCalledWith(
      'https://waze.com/ul?ll=7.1193,-73.1042&navigate=yes',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('no abre nada si faltan coordenadas de destino (evita un deep link roto)', () => {
    openExternalNavigation('waze', { destLat: null, destLng: null });
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('no abre nada si la app solicitada no existe', () => {
    openExternalNavigation('mapas_inventados', { destLat: 7.1193, destLng: -73.1042 });
    expect(openSpy).not.toHaveBeenCalled();
  });
});
