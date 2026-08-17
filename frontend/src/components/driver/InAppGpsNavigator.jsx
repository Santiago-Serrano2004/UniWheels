import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AppMapTileLayer } from '../map/AppMapTileLayer';
import L from 'leaflet';
import {
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
  X,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { speechGuidanceService } from '../../services/speechGuidanceService';
import { SosEmergencyModal } from '../common/SosEmergencyModal';

// Geometría y señalética paso a paso
const WAYPOINTS_DATA = [
  {
    coords: [7.0678, -73.1066],
    street: 'Autopista Floridablanca',
    subText: 'Hacia el Norte • Bucaramanga',
    nextTurn: 'Luego: Viaducto García Cadena',
    maneuverText: 'Inicie el recorrido hacia el norte por la Autopista Floridablanca',
    iconType: 'straight',
    speed: 45,
    distanceToNext: 800,
  },
  {
    coords: [7.0856, -73.1142],
    street: 'Viaducto García Cadena',
    subText: 'Continúe por carril central',
    nextTurn: 'Luego: Salida a Carrera 33',
    maneuverText: 'En 300 metros, incorpórese al Viaducto García Cadena',
    iconType: 'straight',
    speed: 54,
    distanceToNext: 600,
  },
  {
    coords: [7.1023, -73.1185],
    street: 'Carrera 33',
    subText: 'Tome la salida derecha',
    nextTurn: 'Luego: Parque San Pío',
    maneuverText: 'En 250 metros, tome la salida derecha hacia la Carrera 33',
    iconType: 'turn-right',
    speed: 38,
    distanceToNext: 500,
  },
  {
    coords: [7.1145, -73.1100],
    street: 'Carrera 33 con Calle 45',
    subText: 'Rumbo a Cabecera del Llano',
    nextTurn: 'Luego: Parada en Parque San Pío',
    maneuverText: 'Continúe por Carrera 33 durante 400 metros hacia Parque San Pío',
    iconType: 'straight',
    speed: 34,
    distanceToNext: 400,
  },
  {
    coords: [7.1186, -73.1102],
    street: 'Parque San Pío',
    subText: 'Punto de Recogida • Santiago García',
    nextTurn: 'Luego: Calle 56 hacia UNAB',
    maneuverText: 'Ha llegado al punto de recogida: Parque San Pío. Solicite el PIN de abordaje a Santiago García.',
    iconType: 'pickup',
    speed: 0,
    distanceToNext: 600,
    isStop: true,
  },
  {
    coords: [7.1172, -73.1075],
    street: 'Calle 56',
    subText: 'Gire a la izquierda hacia Terrazas',
    nextTurn: 'Luego: Campus El Jardín',
    maneuverText: 'En 200 metros, gire a la izquierda en la Calle 56 rumbo a la UNAB',
    iconType: 'turn-left',
    speed: 35,
    distanceToNext: 450,
  },
  {
    coords: [7.1193, -73.1042],
    street: 'UNAB Campus El Jardín',
    subText: 'Destino Final Alcanzado',
    nextTurn: 'Llegada exitosa',
    maneuverText: 'Ha llegado a su destino final: Universidad Autónoma de Bucaramanga, Campus El Jardín.',
    iconType: 'destination',
    speed: 0,
    distanceToNext: 0,
    isStop: true,
  },
];

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

export const InAppGpsNavigator = ({ _trip, onExit, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [modalSosOpen, setModalSosOpen] = useState(false);

  const step = WAYPOINTS_DATA[currentStepIndex];
  const nextStep = WAYPOINTS_DATA[currentStepIndex + 1];

  const calcularRumbo = (p1, p2) => {
    if (!p1 || !p2) return 0;
    const dy = p2[0] - p1[0];
    const dx = Math.cos((Math.PI / 180) * p1[0]) * (p2[1] - p1[1]);
    const ang = Math.atan2(dx, dy) * (180 / Math.PI);
    return (ang + 360) % 360;
  };

  const vehicleHeading = nextStep ? calcularRumbo(step.coords, nextStep.coords) : 0;

  // Salir de pantalla completa al desmontar el navegador
  useEffect(() => {
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Guía por voz automática en cada maniobra
  useEffect(() => {
    if (step?.maneuverText && !isVoiceMuted) {
      speechGuidanceService.speak(step.maneuverText);
    }
  }, [currentStepIndex, isVoiceMuted, step]);

  // Simulación de avance constante en la ruta
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < WAYPOINTS_DATA.length - 1) {
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const toggleVoice = () => {
    const muted = speechGuidanceService.toggleMute();
    setIsVoiceMuted(muted);
  };

  const renderIconoManiobra = (type) => {
    switch (type) {
      case 'turn-right':
        return <CornerUpRight className="w-12 h-12 text-white stroke-[2.5]" />;
      case 'turn-left':
        return <CornerUpLeft className="w-12 h-12 text-white stroke-[2.5]" />;
      case 'pickup':
        return <MapPin className="w-12 h-12 text-amber-300 stroke-[2.5] animate-bounce" />;
      case 'destination':
        return <CheckCircle2 className="w-12 h-12 text-emerald-300 stroke-[2.5]" />;
      default:
        return <ArrowUp className="w-12 h-12 text-white stroke-[2.5]" />;
    }
  };

  const allRouteCoords = WAYPOINTS_DATA.map((w) => w.coords);
  const remainingCoords = WAYPOINTS_DATA.slice(currentStepIndex).map((w) => w.coords);

  return createPortal(
    <div className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none pointer-events-auto">
      {/* 1. SEÑALÉTICA SUPERIOR PANORÁMICA DE CARRETERA (HIGHWAY MANEUVER SIGN) */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-auto p-3 sm:p-5">
        <motion.div
          key={currentStepIndex}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto bg-slate-900/95 text-white p-4 sm:p-5 rounded-3xl border-b-4 border-lochmara-500 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4"
        >
          {/* Gran Icono de Señal de Giro */}
          <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl sm:rounded-3xl bg-lochmara-600 border-2 border-lochmara-400 flex items-center justify-center shrink-0 shadow-xl shadow-lochmara-600/40">
            {renderIconoManiobra(step.iconType)}
          </div>

          {/* Texto de Señalización de Carretera */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {step.distanceToNext > 0 ? `${step.distanceToNext} m` : 'Llegada'}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-bold uppercase">
                {step.subText}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white truncate leading-tight uppercase tracking-wide">
              {step.street}
            </h2>

            <p className="text-xs sm:text-sm text-lochmara-300 font-medium truncate pt-0.5">
              {step.nextTurn}
            </p>
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
          center={step.coords}
          zoom={17}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <AppMapTileLayer />

          <CameraFollower position={step.coords} />

          {/* Trazados: Ruta Recorrida en Gris, Restante en Azul Neón */}
          <Polyline positions={allRouteCoords} pathOptions={{ color: '#94a3b8', weight: 8, opacity: 0.4 }} />
          <Polyline positions={remainingCoords} pathOptions={{ color: '#0284c7', weight: 9, opacity: 0.95 }} />

          {/* Vehículo en Movimiento */}
          <Marker position={step.coords} icon={createNavCarIcon(vehicleHeading)} />

          {/* Parada: Parque San Pío */}
          <Marker position={[7.1186, -73.1102]} icon={L.divIcon({
            html: '<div style="background:#f59e0b; width:34px; height:34px; border-radius:50%; border:2.5px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.4);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          })} />

          {/* Destino: Campus */}
          <Marker position={[7.1193, -73.1042]} icon={L.divIcon({
            html: '<div style="background:#082f49; width:34px; height:34px; border-radius:50%; border:2.5px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.4);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          })} />
        </MapContainer>
      </div>

      {/* 3. BARRA INFERIOR PANORÁMICA DE TELEMETRÍA (VELOCÍMETRO + ETA + SOS) */}
      <div className="absolute bottom-4 left-0 right-0 z-[500] pointer-events-auto p-3 sm:p-5">
        <div className="w-full max-w-4xl mx-auto bg-slate-950/95 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800 backdrop-blur-2xl flex items-center justify-between gap-4">
          {/* Velocímetro Circular */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-none">
                {step.speed}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">km/h</span>
            </div>

            <div>
              <span className="text-sm sm:text-base font-bold text-white block">
                {step.isStop && step.distanceToNext === 0 ? 'Llegada a UNAB' : 'Rumbo a Campus'}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                ETA: <strong>07:12 AM</strong> • 2.4 km restantes
              </span>
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
        currentCoords={step.coords}
        tripInfo={{ driverName: 'Carlos Mendoza', plate: 'KLU-492' }}
      />
    </div>,
    document.body
  );
};
