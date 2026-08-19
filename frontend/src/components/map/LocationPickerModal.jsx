import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AppMapTileLayer } from './AppMapTileLayer';
import {
  createTeardropPin,
  createCampusMarker,
  isUniversityCampusLocation,
} from './mapIcons';
import { placesApiService } from '../../services/placesApiService';
import { useAppStore } from '../../store/useAppStore';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper para normalizar coordenadas entrantes (array u objeto)
function normalizarCoordsEntrantes(raw) {
  if (!raw) return [7.1193, -73.1042];
  if (Array.isArray(raw) && raw.length >= 2) {
    return [Number(raw[0]), Number(raw[1])];
  }
  if (typeof raw === 'object' && raw.lat !== undefined) {
    return [Number(raw.lat), Number(raw.lng ?? raw.lon)];
  }
  return [7.1193, -73.1042];
}

// Componente interactivo para capturar clics y arrastres en el mapa Leaflet
function MapInteractivePin({ coords, label, onCoordsChange }) {
  const map = useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      onCoordsChange(newPos);
      map.panTo(newPos, { animate: true, duration: 0.35 });
    },
  });

  useEffect(() => {
    if (map && coords) {
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.setView(coords, map.getZoom() || 16, { animate: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [coords, map]);

  const customMarkerIcon = createTeardropPin(
    '#0284c7',
    '#ffffff',
    label || 'Punto fijado',
    false,
    isUniversityCampusLocation(label)
  );

  return (
    <Marker
      position={coords}
      icon={customMarkerIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onCoordsChange([pos.lat, pos.lng]);
        },
      }}
    />
  );
}

export const LocationPickerModal = ({
  isOpen,
  onClose,
  initialCoords,
  initialLocation,
  initialPlaceName = '',
  initialAddress = '',
  title = 'Ajustar Punto en el Mapa',
  subtitle = 'Punto seleccionado',
  confirmButtonText = 'Confirmar ubicación',
  onConfirm,
  onConfirmLocation,
  destinationCoords = null,
  destinationName = '',
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const defaultCoords = normalizarCoordsEntrantes(initialCoords || initialLocation);
  const defaultName = initialPlaceName || initialAddress || '';

  const [coords, setCoords] = useState(defaultCoords);
  const [placeName, setPlaceName] = useState(defaultName);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const freshCoords = normalizarCoordsEntrantes(initialCoords || initialLocation);
      const freshName = initialPlaceName || initialAddress || '';
      setCoords(freshCoords);
      setPlaceName(freshName);
      setShowHint(true);

      // Si no hay nombre pero hay coordenadas, geocodificar de inmediato
      if (!freshName && freshCoords) {
        placesApiService.reverseGeocode(freshCoords[0], freshCoords[1]).then((res) => {
          if (res) setPlaceName(res);
        });
      }

      const timer = setTimeout(() => setShowHint(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialCoords, initialLocation, initialPlaceName, initialAddress]);

  if (!isOpen) return null;

  const handleCoordsChange = async (newCoords) => {
    const lat = Number(Array.isArray(newCoords) ? newCoords[0] : newCoords.lat);
    const lng = Number(Array.isArray(newCoords) ? newCoords[1] : newCoords.lng);
    const pos = [lat, lng];

    setCoords(pos);
    setIsGeocoding(true);
    try {
      const name = await placesApiService.reverseGeocode(lat, lng);
      if (name) {
        setPlaceName(name);
      }
    } catch (err) {
      console.warn('Error en reverse geocoding:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    const coordsObj = { lat: coords[0], lng: coords[1] };
    const coordsArr = [coords[0], coords[1]];
    const resolvedName = placeName || `Sector (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`;

    // Soporte para firma onConfirmLocation(coordsObj, name)
    if (onConfirmLocation) {
      onConfirmLocation(coordsObj, resolvedName);
    }

    // Soporte para firma onConfirm(payload, name)
    if (onConfirm) {
      onConfirm(
        {
          coords: coordsArr,
          lat: coords[0],
          lng: coords[1],
          latitude: coords[0],
          longitude: coords[1],
          address: resolvedName,
          title: resolvedName,
          name: resolvedName,
          nombre: resolvedName,
          direccion: resolvedName,
        },
        resolvedName
      );
    }

    onClose();
  };

  const campusDestCoords = destinationCoords ? normalizarCoordsEntrantes(destinationCoords) : null;
  const campusDestIcon = destinationName ? createCampusMarker(destinationName) : null;

  return (
    <div
      className={`fixed sm:absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Contenedor del Mapa Leaflet a Pantalla Completa (Fondo) */}
      <div className={`absolute inset-0 z-0 w-full h-full ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
        <MapContainer
          center={coords}
          zoom={16}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
        >
          <AppMapTileLayer />

          {/* Pin Interactivo del Punto */}
          <MapInteractivePin
            coords={coords}
            label={placeName || subtitle}
            onCoordsChange={handleCoordsChange}
          />

          {/* Destino / Campus Secundario si aplica */}
          {campusDestCoords && campusDestIcon && (
            <Marker position={campusDestCoords} icon={campusDestIcon} />
          )}

          {/* Línea de Trayecto Conectora si aplica */}
          {campusDestCoords && (
            <Polyline
              positions={[coords, campusDestCoords]}
              pathOptions={{ color: '#0284c7', weight: 4, opacity: 0.8, dashArray: '6, 6' }}
            />
          )}
        </MapContainer>
      </div>

      {/* Encabezado Superior Flotante Dinámico */}
      <div
        className={`relative z-20 p-3.5 m-3 rounded-2xl flex items-center justify-between shadow-xl transition-colors border ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-md'
            : 'bg-white/95 border-slate-200/90 text-slate-900 backdrop-blur-md'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-center flex-1 mx-2">
          <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {title}
          </h3>
          <div className="flex items-center justify-center gap-1">
            {isGeocoding && <Loader2 className="w-3 h-3 animate-spin text-lochmara-500" />}
            <p
              className={`text-[10px] font-bold truncate max-w-[200px] ${
                isDark ? 'text-lochmara-400' : 'text-lochmara-600'
              }`}
            >
              {isGeocoding ? 'Detectando dirección...' : placeName || 'Punto fijado'}
            </p>
          </div>
        </div>

        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs ${
            isDark
              ? 'bg-slate-800 text-lochmara-400 border-slate-700'
              : 'bg-lochmara-50 text-lochmara-600 border-lochmara-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </div>
      </div>

      {/* Hint Flotante */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 mx-auto pointer-events-none px-4"
          >
            <div
              className={`text-[11px] font-medium py-1.5 px-3.5 rounded-full shadow-lg border text-center flex items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-slate-900/95 text-slate-200 border-slate-700/80 backdrop-blur-sm'
                  : 'bg-white/95 text-slate-800 border-slate-200/90 backdrop-blur-sm'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-lochmara-400 animate-pulse" />
              <span>Toca en cualquier calle o arrastra el pin</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Inferior Flotante de Confirmación */}
      <div
        className={`relative z-20 p-4 m-3 rounded-3xl space-y-3 shadow-2xl transition-colors border ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-md'
            : 'bg-white/98 border-slate-200/90 text-slate-900 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between text-xs px-1">
          <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
            Ubicación fijada:
          </span>
          <span className={`font-bold truncate max-w-[220px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isGeocoding ? 'Detectando dirección...' : placeName || 'Punto fijado en el mapa'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 px-4 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:scale-98 text-white font-black text-xs shadow-lg shadow-lochmara-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{confirmButtonText}</span>
        </button>
      </div>
    </div>
  );
};
