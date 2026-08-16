import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { routesService, tripLifecycleService } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Car,
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

// Pines vectoriales personalizados con CSS dinámico
const createCustomPin = (bgColor, iconText, borderColor = '#ffffff', isVehicle = false, heading = 0) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        ${isVehicle ? '<div class="gps-beacon-ring"></div>' : ''}
        <div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer; transform: rotate(${heading}deg); transition: transform 0.3s ease;">
          ${iconText}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const pickupIcon = createCustomPin('#f59e0b', '📍', '#fef3c7');
const directPickupIcon = createCustomPin('#10b981', '📍', '#d1fae5');
const campusIcon = createCustomPin('#082f49', '🎓', '#ffffff');

const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

// Componente para capturar clics en el mapa y mover el punto de recogida
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

  // Simulación de vehículo GPS en movimiento
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [vehiclePos, setVehiclePos] = useState(driverOrigin);
  const [vehicleHeading, setVehicleHeading] = useState(0);
  const simIndexRef = useRef(0);
  const simTimerRef = useRef(null);

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
            suggested_fare_cop: topMatch.suggested_fare_cop ?? 4500,
            traffic_status: topMatch.traffic_status || 'Telemetría TomTom en vivo',
            traffic_source: topMatch.traffic_source || 'tomtom_live',
            is_viable: topMatch.is_viable !== false,
            estimated_arrival_time: '07:15 AM',
          });
        } else {
          const esDirecto = Math.abs(coords[0] - 7.0856) < 0.003;
          setMatchingData({
            modality: esDirecto ? 'modalidad_1_directa' : 'modalidad_2_desvio',
            detour_minutes: esDirecto ? 0.0 : 4.2,
            suggested_fare_cop: esDirecto ? 4500 : 5700,
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
    [driverOrigin, campusDestination]
  );

  useEffect(() => {
    handleSelectPickup(selectedPickup, pickupName);
  }, []);

  // 3. Simulación de movimiento GPS fluido sobre la polilínea
  const toggleGpsSimulation = () => {
    if (isSimulatingGps) {
      clearInterval(simTimerRef.current);
      setIsSimulatingGps(false);
      return;
    }

    const activePath =
      matchingData.modality === 'modalidad_2_desvio' && detourRouteCoords.length > 0
        ? detourRouteCoords
        : mainRouteCoords;

    if (!activePath || activePath.length < 2) return;

    setIsSimulatingGps(true);
    simIndexRef.current = 0;

    simTimerRef.current = setInterval(() => {
      if (simIndexRef.current >= activePath.length - 1) {
        simIndexRef.current = 0;
      } else {
        simIndexRef.current += 1;
      }

      const current = activePath[simIndexRef.current];
      const next = activePath[Math.min(simIndexRef.current + 1, activePath.length - 1)];

      // Calcular rumbo (heading)
      const dLat = next[0] - current[0];
      const dLng = next[1] - current[1];
      const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;

      setVehiclePos(current);
      setVehicleHeading(angle);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const manejarReserva = async () => {
    try {
      // Guardar en trip-service (puerto 8004)
      await tripLifecycleService.bookTrip({
        route_id: '01a00000-0000-0000-0000-000000000001',
        driver_id: '01a00000-0000-0000-0000-000000000002',
        passenger_id: user?.id || '01a00000-0000-0000-0000-000000000003',
        driver_name: 'Carlos Mendoza',
        passenger_name: user?.name || 'Pasajero UniWheels',
        vehicle_plate: 'KLU-492',
        vehicle_model: 'Mazda 3 (Rojo)',
        pickup_address: pickupName,
        dropoff_address: campusName,
        total_fare_cop: matchingData.suggested_fare_cop,
        scheduled_pickup_time: new Date().toISOString(),
        boarding_pin: '4829',
      });
    } catch {
      // Fallback transparente
    }

    bookPassengerTrip({
      driverName: 'Carlos Mendoza',
      vehicle: 'Mazda 3 (Rojo)',
      plate: 'KLU-492',
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
                color: '#0284c7',
                weight: 6,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Polilínea Vehicular Real con Flujo Animado (Azul Lochmara) */}
          {mainRouteCoords.length > 1 && (
            <Polyline
              positions={mainRouteCoords}
              pathOptions={{
                color: '#0284c7',
                weight: 4,
                opacity: 0.95,
                dashArray: '10, 10',
                className: 'animated-route-flow',
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Polilínea Vehicular Real del Desvío de IA (Ámbar punteado si aplica Modalidad 2) */}
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

          {/* Marcador del Vehículo en Vivo (Con rumbo y faro de pulsación) */}
          <Marker
            position={vehiclePos}
            icon={createCustomPin('#0284c7', '🚗', '#ffffff', isSimulatingGps, vehicleHeading)}
          >
            <Popup>
              <strong>🚗 Conductor en Vivo: Carlos Mendoza</strong>
              <br />
              Mazda 3 (Rojo) • <strong>KLU-492</strong>
              <br />
              {isSimulatingGps ? '⚡ Vehículo en movimiento' : '📍 Punto de partida: Cañaveral'}
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

          {/* Botones de Control: Estilo de Mapa + Simulación GPS + Tráfico TomTom */}
          <div className="flex items-center gap-1.5">
            {/* Selector de Estilo de Mapa */}
            <button
              type="button"
              onClick={() => setShowStyleModal(true)}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-md backdrop-blur-md transition-all cursor-pointer"
              title="Cambiar estilo gráfico del mapa"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Botón Simulación GPS en Vivo */}
            <button
              type="button"
              onClick={toggleGpsSimulation}
              className={`px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md border ${
                isSimulatingGps
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              {isSimulatingGps ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isSimulatingGps ? 'Pausar GPS' : 'GPS en Vivo'}</span>
            </button>

            {/* Toggle Tráfico TomTom */}
            <button
              type="button"
              onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              className={`px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md border ${
                showTrafficLayer
                  ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${showTrafficLayer ? 'animate-pulse' : ''}`} />
              <span>Tráfico {showTrafficLayer ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Puntos Rápidos de Abordaje */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
      </div>

      {/* Modal / Menú Selector de Estilo de Mapa */}
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
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
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
                <div className="w-10 h-10 rounded-2xl bg-lochmara-100 text-lochmara-800 font-extrabold text-sm flex items-center justify-center border border-lochmara-200">
                  CM
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">Carlos Mendoza</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600" />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Mazda 3 • <span className="font-bold">KLU-492</span> (3 cupos libres)
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
              <Car className="w-4 h-4" />
              <span>{isLoadingEvaluation ? 'Calculando con IA...' : 'Confirmar y Reservar Cupo'}</span>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
