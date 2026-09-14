import React from 'react';
import { TileLayer } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';

// CARTO retiró el acceso libre a basemaps.cartocdn.com (ahora exige API key y
// devuelve un tile "API KEY REQUIRED" en su lugar) — se reemplazó por los
// basemaps gratuitos de Esri/ArcGIS Online, que no requieren ninguna clave.
const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 16,
  },
  light: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 16,
  },
  voyager: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 19,
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
