import React from 'react';
import { TileLayer } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';

const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

export const AppMapTileLayer = ({ preferredStyle = null }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // Si no se especifica un estilo forzado, seleccionar según el tema actual
  const effectiveStyleKey = preferredStyle || (isDark ? 'dark' : 'light');
  const provider = MAP_TILE_PROVIDERS[effectiveStyleKey] || MAP_TILE_PROVIDERS.light;

  return (
    <TileLayer
      key={effectiveStyleKey}
      url={provider.url}
      attribution={provider.attribution}
      subdomains={provider.subdomains || 'abc'}
      maxZoom={provider.maxZoom || 19}
    />
  );
};
