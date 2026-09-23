import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';

const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 16,
  },
  light: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 16,
  },
};

const createSosIcon = (isAttended) => {
  const bgClass = isAttended ? 'bg-slate-600' : 'bg-rose-600';
  const pingClass = isAttended ? '' : '<div class="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>';

  return L.divIcon({
    className: 'custom-sos-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${pingClass}
        <div class="relative w-7 h-7 rounded-full ${bgClass} border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs">
          !
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const AdminMiniMap = ({ latitude, longitude, label = 'Ubicación SOS', isAttended = false }) => {
  const { isDark } = useTheme();

  const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude) || 7.1193;
  const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude) || -73.1227;

  const provider = isDark ? MAP_TILE_PROVIDERS.dark : MAP_TILE_PROVIDERS.light;
  const icon = useMemo(() => createSosIcon(isAttended), [isAttended]);

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={true}
        className="w-full h-full"
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={provider.url}
          attribution={provider.attribution}
          maxZoom={provider.maxZoom}
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <div className="text-xs font-semibold p-1">
              <p className="font-bold">{label}</p>
              <p className="text-slate-500 text-[10px] font-mono">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
