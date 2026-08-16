import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { routesService, tripLifecycleService } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Car,
  Bike,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Activity,
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  Layers,
  Play,
  Square,
  Moon,
  Sun,
  Globe,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Catálogo de estilos visuales profesionales para Leaflet
const MAP_STYLES = [
  {
    id: 'positron',
    name: 'Minimalista Claro (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    icon: Sun,
    badge: 'Recomendado',
  },
  {
    id: 'voyager',
    name: 'Urbano Detallado (Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    icon: Compass,
  },
  {
    id: 'dark',
    name: 'Modo Noche (Dark Matter)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    icon: Moon,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Estándar',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    icon: Globe,
  },
  {
    id: 'satellite',
    name: 'Satélite HD (Esri World)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Maxar, Earthstar Geographics',
    icon: Layers,
  },
];

// Modelo Vectorial SVG Superior de Carro (Alta Definición)
const createCarVehicleMarker = (heading = 0, isMoving = false, color = '#0284c7') =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.08s linear;">
        ${isMoving ? '<div class="gps-beacon-ring"></div>' : ''}
        <svg width="46" height="46" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));">
          <!-- Cono de iluminación de faros delanteros -->
          ${isMoving ? '<polygon points="50,15 18,-15 82,-15" fill="rgba(254,240,138,0.38)"/>' : ''}
          <!-- Ruedas -->
          <rect x="22" y="24" width="9" height="18" rx="3.5" fill="#0f172a"/>
          <rect x="69" y="24" width="9" height="18" rx="3.5" fill="#0f172a"/>
          <rect x="22" y="62" width="9" height="18" rx="3.5" fill="#0f172a"/>
          <rect x="69" y="62" width="9" height="18" rx="3.5" fill="#0f172a"/>
          <!-- Chasis aerodinámico -->
          <rect x="27" y="14" width="46" height="74" rx="15" fill="${color}" stroke="#ffffff" stroke-width="2.8"/>
          <!-- Parabrisas Delantero -->
          <path d="M 33 34 Q 50 28 67 34 L 64 45 Q 50 41 36 45 Z" fill="#e0f2fe" opacity="0.95"/>
          <!-- Techo panorámico -->
          <rect x="34" y="45" width="32" height="22" rx="6" fill="rgba(0,0,0,0.18)"/>
          <!-- Parabrisas Trasero -->
          <path d="M 36 69 Q 50 66 64 69 L 62 75 Q 50 73 38 75 Z" fill="#bae6fd" opacity="0.9"/>
          <!-- Faros delanteros LED -->
          <circle cx="34" cy="18" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
          <circle cx="66" cy="18" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
          <!-- Luces de freno traseras -->
          <rect x="32" y="84" width="8" height="3" rx="1.5" fill="#ef4444"/>
          <rect x="60" y="84" width="8" height="3" rx="1.5" fill="#ef4444"/>
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

// Modelo Vectorial SVG Superior de Motocicleta (Alta Definición)
const createMotoVehicleMarker = (heading = 0, isMoving = false, color = '#f59e0b') =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.08s linear;">
        ${isMoving ? '<div class="gps-beacon-ring" style="background: rgba(245, 158, 11, 0.45);"></div>' : ''}
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));">
          <!-- Haz de luz del faro -->
          ${isMoving ? '<polygon points="50,14 24,-12 76,-12" fill="rgba(254,240,138,0.42)"/>' : ''}
          <!-- Rueda delantera -->
          <rect x="46" y="8" width="8" height="22" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
          <!-- Manubrio y Espejos -->
          <rect x="27" y="25" width="46" height="4.5" rx="2" fill="#334155" stroke="#ffffff" stroke-width="1"/>
          <circle cx="27" cy="27" r="3.5" fill="${color}"/>
          <circle cx="73" cy="27" r="3.5" fill="${color}"/>
          <!-- Tanque de combustible y chasis -->
          <path d="M 43 32 Q 50 26 57 32 L 60 48 Q 50 53 40 48 Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <!-- Casco del Piloto con Visor -->
          <circle cx="50" cy="52" r="10.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.8"/>
          <path d="M 43 49 Q 50 45 57 49 L 56 53 Q 50 50 44 53 Z" fill="#38bdf8"/>
          <!-- Chaqueta / Torso del conductor -->
          <path d="M 37 61 Q 50 57 63 61 L 59 71 Q 50 68 41 71 Z" fill="#1e293b"/>
          <!-- Rueda trasera y escape -->
          <rect x="46" y="70" width="8" height="24" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
          <rect x="56" y="72" width="3.5" height="15" rx="1.5" fill="#94a3b8"/>
          <!-- Luz stop trasera -->
          <circle cx="50" cy="92" r="3" fill="#ef4444"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const createCustomPin = (bgColor, iconText, borderColor = '#ffffff') =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer;">
          ${iconText}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const pickupIcon = createCustomPin('#f59e0b', '📍', '#fef3c7');
const directPickupIcon = createCustomPin('#10b981', '📍', '#d1fae5');
const campusIcon = createCustomPin('#082f49', '🎓', '#ffffff');

const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

// Componente para capturar clics en el mapa
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

/**
 * Consultar geometría vehicular real calle por calle en OSRM (OpenStreetMap Routing)
 */
async function fetchRoadGeometry(points) {
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
  } catch (e) {
    console.warn('Fallo OSRM client-side, usando fallback:', e);
  }

  return points;
}

// Suavizado angular de rumbo (Lerp más corto)
function lerpAngle(current, target, factor = 0.18) {
  let diff = ((target - current + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return current + diff * factor;
}

export const TripMapView = () => {
  const {
    user,
    activePassengerBooking,
    bookPassengerTrip,
    cancelPassengerBooking,
    setActiveTab,
  } = useAppStore();

  const isBooked = Boolean(activePassengerBooking);
  const campusName = user?.campus?.name || user?.campus || 'Campus El Jardín';

  // Coordenadas fijas
  const driverOrigin = [7.0678, -73.1066]; // C.C. Cañaveral
  const campusDestination = [7.1193, -73.1042]; // Campus El Jardín UNAB

  // Estados visuales y de configuración del mapa
  const [selectedStyleId, setSelectedStyleId] = useState('positron');
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [vehicleType, setVehicleType] = useState('car'); // 'car' | 'motorcycle'

  // Estados de telemetría y ruteo
  const [selectedPickup, setSelectedPickup] = useState([7.1186, -73.1102]); // Parque San Pío
  const [pickupName, setPickupName] = useState('Parque San Pío (Cabecera)');
  const [mainRouteCoords, setMainRouteCoords] = useState([]);
  const [detourRouteCoords, setDetourRouteCoords] = useState([]);
  const [matchingData, setMatchingData] = useState({
    modality: 'modalidad_2_desvio',
    detour_minutes: 4.5,
    suggested_fare_cop: 5800,
    traffic_status: 'Tráfico fluido en tiempo real',
    traffic_source: 'tomtom_live',
    is_viable: true,
    estimated_arrival_time: '07:15 AM',
  });
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  // Animación continua a 60 FPS con Interpolación Lineal (LERP)
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [vehiclePos, setVehiclePos] = useState(driverOrigin);
  const [vehicleHeading, setVehicleHeading] = useState(0);

  const animStateRef = useRef({
    progressIndex: 0,
    subT: 0,
    currentHeading: 0,
    targetHeading: 0,
    animFrameId: null,
  });

  const activeStyle = MAP_STYLES.find((s) => s.id === selectedStyleId) || MAP_STYLES[0];

  // Puntos rápidos predefinidos en Bucaramanga
  const quickPoints = [
    { name: 'Parque San Pío (Desvío)', coords: [7.1186, -73.1102] },
    { name: 'Provenza (En Ruta)', coords: [7.0856, -73.1142] },
    { name: 'C.C. Cuarta Etapa', coords: [7.1215, -73.1125] },
    { name: 'Puerta del Sol', coords: [7.1023, -73.1185] },
  ];

  // 1. Cargar ruta principal en el montaje
  useEffect(() => {
    let isMounted = true;
    async function loadMainRoute() {
      const coords = await fetchRoadGeometry([driverOrigin, campusDestination]);
      if (isMounted && coords.length > 0) {
        setMainRouteCoords(coords);
        setVehiclePos(coords[0]);
      }
    }
    loadMainRoute();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Evaluar y cargar desvío cuando cambia el punto de recogida
  const handleSelectPickup = useCallback(
    async (coords, name = 'Punto seleccionado en el mapa') => {
      setSelectedPickup(coords);
      setPickupName(name);
      setIsLoadingEvaluation(true);

      try {
        const detourGeometry = await fetchRoadGeometry([driverOrigin, coords, campusDestination]);
        if (detourGeometry.length > 0) {
          setDetourRouteCoords(detourGeometry);
        }

        const matches = await routesService.searchMatches(coords[0], coords[1], 1);
        if (matches && matches.length > 0) {
          const topMatch = matches[0];
          setMatchingData({
            modality: topMatch.modality || 'modalidad_2_desvio',
            detour_minutes: topMatch.detour_minutes ?? 4.0,
            suggested_fare_cop: topMatch.suggested_fare_cop ?? (vehicleType === 'motorcycle' ? 3500 : 4500),
            traffic_status: topMatch.traffic_status || 'Telemetría TomTom en vivo',
            traffic_source: topMatch.traffic_source || 'tomtom_live',
            is_viable: topMatch.is_viable !== false,
            estimated_arrival_time: '07:15 AM',
          });
        } else {
          const esDirecto = Math.abs(coords[0] - 7.0856) < 0.003;
          const basePrice = vehicleType === 'motorcycle' ? 3500 : 4500;
          setMatchingData({
            modality: esDirecto ? 'modalidad_1_directa' : 'modalidad_2_desvio',
            detour_minutes: esDirecto ? 0.0 : 4.2,
            suggested_fare_cop: esDirecto ? basePrice : basePrice + 1200,
            traffic_status: 'Tráfico fluido en tiempo real',
            traffic_source: 'tomtom_live',
            is_viable: true,
            estimated_arrival_time: '07:15 AM',
          });
        }
      } catch (err) {
        console.error('Error evaluando desvío:', err);
      } finally {
        setIsLoadingEvaluation(false);
      }
    },
    [driverOrigin, campusDestination, vehicleType]
  );

  useEffect(() => {
    handleSelectPickup(selectedPickup, pickupName);
  }, [vehicleType]);

  // 3. Bucle de animación fluida a 60 FPS (Interpolación continua LERP)
  const startSmoothGpsSimulation = () => {
    const activePath =
      matchingData.modality === 'modalidad_2_desvio' && detourRouteCoords.length > 1
        ? detourRouteCoords
        : mainRouteCoords;

    if (!activePath || activePath.length < 2) return;

    setIsSimulatingGps(true);

    const stepSpeed = vehicleType === 'motorcycle' ? 0.065 : 0.045; // Velocidad de avance por frame

    const animateFrame = () => {
      const state = animStateRef.current;
      state.subT += stepSpeed;

      if (state.subT >= 1.0) {
        state.subT = 0;
        state.progressIndex = (state.progressIndex + 1) % (activePath.length - 1);
      }

      const p1 = activePath[state.progressIndex];
      const p2 = activePath[Math.min(state.progressIndex + 1, activePath.length - 1)];

      // Interpolación lineal exacta
      const lat = p1[0] + (p2[0] - p1[0]) * state.subT;
      const lng = p1[1] + (p2[1] - p1[1]) * state.subT;

      // Cálculo y suavizado del rumbo (Bearing angle)
      const dLat = p2[0] - p1[0];
      const dLng = p2[1] - p1[1];
      if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
        state.targetHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      }
      state.currentHeading = lerpAngle(state.currentHeading, state.targetHeading, 0.2);

      setVehiclePos([lat, lng]);
      setVehicleHeading(state.currentHeading);

      state.animFrameId = requestAnimationFrame(animateFrame);
    };

    animStateRef.current.animFrameId = requestAnimationFrame(animateFrame);
  };

  const stopSmoothGpsSimulation = () => {
    if (animStateRef.current.animFrameId) {
      cancelAnimationFrame(animStateRef.current.animFrameId);
      animStateRef.current.animFrameId = null;
    }
    setIsSimulatingGps(false);
  };

  const toggleGpsSimulation = () => {
    if (isSimulatingGps) {
      stopSmoothGpsSimulation();
    } else {
      startSmoothGpsSimulation();
    }
  };

  useEffect(() => {
    return () => {
      if (animStateRef.current.animFrameId) {
        cancelAnimationFrame(animStateRef.current.animFrameId);
      }
    };
  }, []);

  const manejarReserva = async () => {
    try {
      await tripLifecycleService.bookTrip({
        route_id: '01a00000-0000-0000-0000-000000000001',
        driver_id: '01a00000-0000-0000-0000-000000000002',
        passenger_id: user?.id || '01a00000-0000-0000-0000-000000000003',
        driver_name: vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza',
        passenger_name: user?.name || 'Pasajero UniWheels',
        vehicle_plate: vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492',
        vehicle_model: vehicleType === 'motorcycle' ? 'Yamaha MT-03 (Negra)' : 'Mazda 3 (Rojo)',
        pickup_address: pickupName,
        dropoff_address: campusName,
        total_fare_cop: matchingData.suggested_fare_cop,
        scheduled_pickup_time: new Date().toISOString(),
        boarding_pin: '4829',
      });
    } catch {
      // Fallback
    }

    bookPassengerTrip({
      driverName: vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza',
      vehicle: vehicleType === 'motorcycle' ? 'Yamaha MT-03 (Negra)' : 'Mazda 3 (Rojo)',
      plate: vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492',
      origin: 'Cañaveral (Floridablanca)',
      pickup: pickupName,
      destination: campusName,
      departureTime: '06:45 AM',
      estimatedPickupTime: matchingData.modality === 'modalidad_1_directa' ? '06:55 AM' : '07:08 AM',
      fare: `$ ${matchingData.suggested_fare_cop.toLocaleString('es-CO')}`,
      boardingPin: '4829',
    });
  };

  return (
    <div className="relative w-full h-[calc(100dvh-135px)] sm:h-[720px] flex flex-col justify-between overflow-hidden rounded-3xl select-none">
      {/* Contenedor del Mapa Leaflet */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[7.098, -73.112]}
          zoom={13}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Capa Base Seleccionada */}
          <TileLayer
            key={activeStyle.id}
            attribution={activeStyle.attribution}
            url={activeStyle.url}
          />

          {/* Capa Satelital de Tráfico en Vivo TomTom (Overlay) */}
          {showTrafficLayer && TOMTOM_KEY && (
            <TileLayer
              attribution='&copy; <a href="https://www.tomtom.com/">TomTom Traffic</a>'
              url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`}
              opacity={0.8}
            />
          )}

          {/* Captura de clics en el mapa */}
          <MapClickHandler onLocationSelect={(coords) => handleSelectPickup(coords)} />

          {/* Polilínea Base: Resplandor de la ruta */}
          {mainRouteCoords.length > 1 && (
            <Polyline
              positions={mainRouteCoords}
              pathOptions={{
                color: vehicleType === 'motorcycle' ? '#f59e0b' : '#0284c7',
                weight: 6,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Polilínea Vehicular Real con Flujo Animado */}
          {mainRouteCoords.length > 1 && (
            <Polyline
              positions={mainRouteCoords}
              pathOptions={{
                color: vehicleType === 'motorcycle' ? '#f59e0b' : '#0284c7',
                weight: 4,
                opacity: 0.95,
                dashArray: '10, 10',
                className: 'animated-route-flow',
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Polilínea Vehicular Real del Desvío de IA */}
          {matchingData.modality === 'modalidad_2_desvio' && detourRouteCoords.length > 1 && (
            <Polyline
              positions={detourRouteCoords}
              pathOptions={{
                color: '#f59e0b',
                weight: 5,
                dashArray: '8, 8',
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Marcador del Vehículo en Vivo (Modelo Carro o Moto de Alta Definición) */}
          <Marker
            position={vehiclePos}
            icon={
              vehicleType === 'motorcycle'
                ? createMotoVehicleMarker(vehicleHeading, isSimulatingGps, '#f59e0b')
                : createCarVehicleMarker(vehicleHeading, isSimulatingGps, '#0284c7')
            }
          >
            <Popup>
              <strong>{vehicleType === 'motorcycle' ? '🏍️ Moto: Yamaha MT-03' : '🚗 Carro: Mazda 3'}</strong>
              <br />
              Conductor: <strong>{vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza'}</strong>
              <br />
              Placa: <strong>{vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492'}</strong>
              <br />
              {isSimulatingGps ? '⚡ En movimiento a 60 FPS' : '📍 Punto de partida: Cañaveral'}
            </Popup>
          </Marker>

          {/* Marcador del Punto de Recogida */}
          <Marker
            position={selectedPickup}
            icon={matchingData.modality === 'modalidad_1_directa' ? directPickupIcon : pickupIcon}
          >
            <Popup>
              <strong>📍 {pickupName}</strong>
              <br />
              {matchingData.modality === 'modalidad_1_directa'
                ? '⚡ Abordaje directo (0 min desvío)'
                : `✨ Desvío asistido (+${matchingData.detour_minutes} min)`}
            </Popup>
          </Marker>

          {/* Marcador de Destino Universitario */}
          <Marker position={campusDestination} icon={campusIcon}>
            <Popup>
              <strong>🎓 Destino Universitario</strong>
              <br />
              {campusName}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Controles Flotantes Superiores */}
      <div className="relative z-10 m-3 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Badge de Telemetría en Tiempo Real */}
          <div className="bg-slate-950/85 backdrop-blur-md text-white border border-slate-800 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{matchingData.traffic_status}</span>
          </div>

          {/* Selector de Tipo de Vehículo: Carro / Moto */}
          <div className="flex items-center bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full p-0.5 shadow-md">
            <button
              type="button"
              onClick={() => setVehicleType('car')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === 'car'
                  ? 'bg-lochmara-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Carro</span>
            </button>

            <button
              type="button"
              onClick={() => setVehicleType('motorcycle')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === 'motorcycle'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Moto</span>
            </button>
          </div>
        </div>

        {/* Barra de Acciones del Mapa */}
        <div className="flex items-center justify-between gap-2">
          {/* Puntos Rápidos de Abordaje */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {quickPoints.map((pt) => {
              const isSelected = pickupName === pt.name;
              return (
                <button
                  key={pt.name}
                  type="button"
                  onClick={() => handleSelectPickup(pt.coords, pt.name)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm border ${
                    isSelected
                      ? 'bg-lochmara-600 text-white border-lochmara-500 shadow-lochmara-600/30'
                      : 'bg-white/90 text-slate-700 border-slate-200/90 hover:bg-white'
                  }`}
                >
                  {pt.name}
                </button>
              );
            })}
          </div>

          {/* Botones de Estilo de Mapa + GPS + Tráfico */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Selector de Estilo de Mapa */}
            <button
              type="button"
              onClick={() => setShowStyleModal(true)}
              className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-md backdrop-blur-md transition-all cursor-pointer"
              title="Estilo gráfico del mapa"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Botón Simulación GPS Ultra Fluida a 60 FPS */}
            <button
              type="button"
              onClick={toggleGpsSimulation}
              className={`px-2.5 py-1 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md border ${
                isSimulatingGps
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              {isSimulatingGps ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isSimulatingGps ? 'Pausar' : 'GPS en Vivo'}</span>
            </button>

            {/* Toggle Tráfico TomTom */}
            <button
              type="button"
              onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              className={`p-1.5 rounded-full shadow-md text-xs font-bold flex items-center transition-all cursor-pointer backdrop-blur-md border ${
                showTrafficLayer
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
              title="Alternar capa de tráfico TomTom"
            >
              <Activity className={`w-3.5 h-3.5 ${showTrafficLayer ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Selector de Estilo de Mapa */}
      <AnimatePresence>
        {showStyleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-lochmara-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Estilo Gráfico de Leaflet</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStyleModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {MAP_STYLES.map((style) => {
                  const isCurrent = style.id === selectedStyleId;
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyleId(style.id);
                        setShowStyleModal(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-lochmara-600 bg-lochmara-50/70 text-lochmara-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isCurrent ? 'bg-lochmara-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{style.name}</p>
                          {style.badge && (
                            <span className="text-[10px] text-lochmara-600 font-bold">{style.badge}</span>
                          )}
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-lochmara-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer Inferior Flotante */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 m-3 bg-white/95 backdrop-blur-lg rounded-3xl p-4 border border-slate-200/90 shadow-xl space-y-3 pointer-events-auto"
      >
        {isBooked ? (
          /* ESTADO: YA TIENE UN VIAJE RESERVADO */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tienes una solicitud activa</span>
              </div>

              <span className="text-xs font-mono font-bold text-slate-700">
                PIN: {activePassengerBooking.boardingPin || '4829'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Ya tienes una reserva activa con <strong>{activePassengerBooking.driverName || 'Carlos Mendoza'}</strong> ({activePassengerBooking.plate || 'KLU-492'}). Para reservar otra ruta, primero debes cancelar tu viaje actual.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('trips')}
                className="flex-1 py-2.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-lochmara-600/20 cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Ver Mi Viaje</span>
              </button>

              <button
                type="button"
                onClick={() => cancelPassengerBooking()}
                className="py-2.5 px-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* ESTADO: DISPONIBLE PARA RESERVAR CON EVALUACIÓN DE IA */
          <>
            {/* Cabecera del Conductor y Tarifa */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${vehicleType === 'motorcycle' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-lochmara-100 text-lochmara-800 border-lochmara-200'} font-extrabold text-sm flex items-center justify-center border`}>
                  {vehicleType === 'motorcycle' ? 'MS' : 'CM'}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">
                      {vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza'}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600" />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {vehicleType === 'motorcycle' ? 'Yamaha MT-03 • ' : 'Mazda 3 • '}
                    <span className="font-bold">{vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492'}</span>
                    <span className="text-slate-400"> ({vehicleType === 'motorcycle' ? '1 cupo libre' : '3 cupos libres'})</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-lochmara-700">
                  $ {matchingData.suggested_fare_cop.toLocaleString('es-CO')}
                </span>
                <p className="text-[10px] text-slate-400">
                  {matchingData.modality === 'modalidad_1_directa' ? 'Tarifa fija directa' : 'Incluye recargo por desvío'}
                </p>
              </div>
            </div>

            {/* Tarjeta de Desglose de Desvío con IA */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 truncate">
                  <MapPin className="w-3.5 h-3.5 text-lochmara-600 shrink-0" />
                  <span className="truncate">{pickupName}</span>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  matchingData.modality === 'modalidad_1_directa'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {matchingData.modality === 'modalidad_1_directa' ? 'En Ruta (0 min)' : `+${matchingData.detour_minutes} min desvío`}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Llegada al campus: <strong>~ 07:15 AM</strong>
                </span>
                <span className="text-slate-600">
                  Destino: <strong>{campusName}</strong>
                </span>
              </div>
            </div>

            {/* Botón de Acción de Reserva */}
            <button
              onClick={manejarReserva}
              disabled={isLoadingEvaluation}
              className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/30 disabled:opacity-50"
            >
              {vehicleType === 'motorcycle' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              <span>{isLoadingEvaluation ? 'Calculando con IA...' : `Confirmar y Reservar Cupo en ${vehicleType === 'motorcycle' ? 'Moto' : 'Carro'}`}</span>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
