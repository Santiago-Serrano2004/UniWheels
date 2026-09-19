import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AppMapTileLayer } from '../map/AppMapTileLayer';
import { createPickupMarker, createCampusMarker } from '../map/mapIcons';
import { getPlaceCoordinates } from '../../hooks/useOsrmRoute';
import { useTurnByTurnNavigation } from '../../hooks/useTurnByTurnNavigation';
import { haversineDistanceMeters, formatDistance } from '../../utils/geo';
import L from 'leaflet';
import { Volume2, VolumeX, ShieldAlert, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { speechGuidanceService } from '../../services/speechGuidanceService';
import { SosEmergencyModal } from '../common/SosEmergencyModal';
import { tripLifecycleService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

// Marcador Vectorial 2D Cenital de Vehículo con Faro Iluminado
const createNavCarIcon = (heading = 0) =>
  L.divIcon({
    className: 'custom-nav-vehicle',
    html: `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.25s linear;">
        <div class="gps-beacon-ring"></div>
        <svg width="52" height="52" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 6px 14px rgba(0,0,0,0.55));">
          <polygon points="50,15 10,-28 90,-28" fill="rgba(254,240,138,0.55)" />
          <rect x="22" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="69" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="22" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="69" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="27" y="14" width="46" height="74" rx="15" fill="#0284c7" stroke="#ffffff" stroke-width="3.2" />
          <path d="M 33 34 Q 50 28 67 34 L 64 45 Q 50 41 36 45 Z" fill="#e0f2fe" opacity="0.95" />
          <rect x="34" y="45" width="32" height="22" rx="6" fill="rgba(0,0,0,0.22)" />
          <path d="M 36 69 Q 50 66 64 69 L 62 75 Q 50 73 38 75 Z" fill="#bae6fd" opacity="0.9" />
          <circle cx="34" cy="18" r="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
          <circle cx="66" cy="18" r="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
          <rect x="32" y="84" width="8" height="3.5" rx="1.5" fill="#ef4444" />
          <rect x="60" y="84" width="8" height="3.5" rx="1.5" fill="#ef4444" />
        </svg>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });

function CameraFollower({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 17, { animate: true, duration: 0.9 });
    }
  }, [position, map]);
  return null;
}

// Nota: este navegador ya no simula maniobras — muestra la posición GPS real
// del conductor y la distancia real al próximo punto (punto de encuentro o
// destino). No hay todavía un motor de ruteo con indicaciones giro a giro
// (requeriría integrar algo como OSRM con steps=true); eso queda para una
// iteración futura, ver specs/gps-tracking-real.md.
export const InAppGpsNavigator = ({ trip, route, onExit, onComplete }) => {
  const { user } = useAppStore();
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [modalSosOpen, setModalSosOpen] = useState(false);
  const [driverCoords, setDriverCoords] = useState(
    route?.origin_lat != null ? [route.origin_lat, route.origin_lng] : [7.0856, -73.1142]
  );
  const [speedKmh, setSpeedKmh] = useState(0);
  const [heading, setHeading] = useState(0);

  const pickupCoords = trip?.pickup_address ? getPlaceCoordinates(trip.pickup_address, false) : null;
  const campusCoords = route?.destination_lat != null
    ? [route.destination_lat, route.destination_lng]
    : getPlaceCoordinates(route?.destination, true);
  const destinoActualNav = trip?.is_pin_verified || !pickupCoords ? campusCoords : pickupCoords;

  const pickupIcon = createPickupMarker(trip?.pickup_address || 'Punto de recogida');
  const campusIcon = createCampusMarker(route?.destination || 'Campus');

  // Salir de pantalla completa al desmontar el navegador
  useEffect(() => {
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Posición GPS real en vivo: actualiza el marcador propio y reporta a
  // trip-service cada ~5s (mismo mecanismo que la cabina compacta).
  const ultimoReporteRef = useRef(0);
  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverCoords([pos.coords.latitude, pos.coords.longitude]);
        setSpeedKmh(pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : 0);
        if (pos.coords.heading != null) setHeading(pos.coords.heading);

        const ahora = Date.now();
        if (trip?.id && ahora - ultimoReporteRef.current >= 5000) {
          ultimoReporteRef.current = ahora;
          tripLifecycleService.reportPosition(trip.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed_kmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
            heading_degrees: pos.coords.heading,
            accuracy_meters: pos.coords.accuracy,
          });
        }
      },
      () => {}
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip?.id]);

  const distanciaAlDestino = destinoActualNav ? haversineDistanceMeters(driverCoords, destinoActualNav) : null;
  const turnByTurn = useTurnByTurnNavigation(driverCoords, destinoActualNav);
  const textoDistanciaAproximada = distanciaAlDestino == null ? 'Calculando posición…' : formatDistance(distanciaAlDestino);
  const textoObjetivoAproximado = trip?.is_pin_verified ? 'Rumbo al destino' : 'Rumbo al punto de encuentro';
  const textoDistancia = turnByTurn.tieneIndicacionesReales
    ? turnByTurn.distanciaFormateada || textoDistanciaAproximada
    : textoDistanciaAproximada;
  const textoObjetivo = turnByTurn.tieneIndicacionesReales ? turnByTurn.instruccion : textoObjetivoAproximado;

  const toggleVoice = () => {
    const muted = speechGuidanceService.toggleMute();
    setIsVoiceMuted(muted);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none pointer-events-auto">
      {/* 1. SEÑALÉTICA SUPERIOR: DISTANCIA REAL AL PRÓXIMO PUNTO */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-auto p-3 sm:p-5">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto bg-slate-900/95 text-white p-4 sm:p-5 rounded-3xl border-b-4 border-lochmara-500 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <span className="text-2xl sm:text-4xl font-black tracking-tight text-white font-mono">
              {textoDistancia}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-lochmara-300 uppercase tracking-wide">
              {textoObjetivo}
            </h2>
          </div>

          {/* Botón Salir de Navegación */}
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
              onExit();
            }}
            className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 shadow-md"
            title="Salir de Navegación Completa"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
        </motion.div>
      </div>

      {/* 2. MAPA 100% PANTALLA COMPLETA 2D CON CÁMARA SEGUIDORA */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={driverCoords}
          zoom={17}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <AppMapTileLayer />

          <CameraFollower position={driverCoords} />

          {/* Línea recta hacia el objetivo actual (sin motor de ruteo turn-by-turn en esta v1) */}
          {destinoActualNav && (
            <Polyline positions={[driverCoords, destinoActualNav]} pathOptions={{ color: '#0284c7', weight: 6, opacity: 0.8, dashArray: '2, 10' }} />
          )}

          {/* Vehículo en Movimiento (posición real) */}
          <Marker position={driverCoords} icon={createNavCarIcon(heading)} />

          {/* Punto de recogida (solo si el pasajero aún no ha abordado) */}
          {pickupCoords && !trip?.is_pin_verified && <Marker position={pickupCoords} icon={pickupIcon} />}

          {/* Destino */}
          {campusCoords && <Marker position={campusCoords} icon={campusIcon} />}
        </MapContainer>
      </div>

      {/* 3. BARRA INFERIOR PANORÁMICA DE TELEMETRÍA (VELOCÍMETRO REAL + SOS) */}
      <div className="absolute bottom-4 left-0 right-0 z-[500] pointer-events-auto p-3 sm:p-5">
        <div className="w-full max-w-4xl mx-auto bg-slate-950/95 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800 backdrop-blur-2xl flex items-center justify-between gap-4">
          {/* Velocímetro Circular */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-none">
                {speedKmh}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">km/h</span>
            </div>

            <div>
              <span className="text-sm sm:text-base font-bold text-white block">{textoObjetivo}</span>
              <span className="text-xs sm:text-sm text-slate-400 font-mono">{textoDistancia} restantes</span>
            </div>
          </div>

          {/* Botones de Control Rápido */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Silencio / Voz */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                isVoiceMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-lochmara-600/30 border-lochmara-500 text-lochmara-300'
              }`}
              title={isVoiceMuted ? 'Activar Voz' : 'Silenciar'}
            >
              {isVoiceMuted ? <VolumeX className="w-5 sm:w-6 h-5 sm:h-6" /> : <Volume2 className="w-5 sm:w-6 h-5 sm:h-6" />}
            </button>

            {/* Botón SOS de Emergencia */}
            <button
              type="button"
              onClick={() => setModalSosOpen(true)}
              className="p-3 sm:p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg border border-rose-400 cursor-pointer animate-pulse"
              title="Botón de Pánico SOS"
            >
              <ShieldAlert className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>

            {/* Finalizar Viaje */}
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                }
                onComplete();
              }}
              className="py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>

      {/* MODAL SOS */}
      <SosEmergencyModal
        isOpen={modalSosOpen}
        onClose={() => setModalSosOpen(false)}
        currentCoords={driverCoords}
        tripInfo={{ driverName: trip?.driver_name || user?.name, plate: trip?.vehicle_plate }}
      />
    </div>,
    document.body
  );
};
