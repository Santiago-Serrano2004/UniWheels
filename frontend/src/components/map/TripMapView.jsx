import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { routesService } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  Clock,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Crear pines vectoriales personalizados para el mapa
const createCustomPin = (bgColor, iconText, borderColor = '#ffffff') =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer; transition: transform 0.2s ease;">
        ${iconText}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const driverIcon = createCustomPin('#0284c7', '🚗');
const pickupIcon = createCustomPin('#f59e0b', '📍', '#fef3c7');
const directPickupIcon = createCustomPin('#10b981', '📍', '#d1fae5');
const campusIcon = createCustomPin('#082f49', '🎓');

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

  // Estados de control del mapa y telemetría de IA
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState([7.1186, -73.1102]); // Parque San Pío (Desvío)
  const [pickupName, setPickupName] = useState('Parque San Pío (Cabecera)');
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

  // Coordenadas fijas de la ruta principal (Cañaveral -> Campus El Jardín)
  const driverOrigin = [7.0678, -73.1066]; // Cañaveral
  const campusDestination = [7.1193, -73.1042]; // Campus El Jardín

  // Corredor principal original
  const directCorridor = [
    [7.0678, -73.1066], // Cañaveral
    [7.0856, -73.1142], // Provenza
    [7.1023, -73.1185], // Puerta del Sol
    [7.1145, -73.1100], // Carrera 33
    [7.1193, -73.1042], // Campus El Jardín
  ];

  // Corredor con desvío asistido por IA (hacia Parque San Pío / Cabecera)
  const detourCorridor = [
    [7.1023, -73.1185], // Puerta del Sol
    [7.1145, -73.1100], // Cra 33
    [7.1186, -73.1102], // Parada de Desvío (San Pío)
    [7.1193, -73.1042], // Llegada al Campus
  ];

  // Puntos rápidos predefinidos en Bucaramanga
  const quickPoints = [
    { name: 'Parque San Pío (Desvío)', coords: [7.1186, -73.1102] },
    { name: 'Provenza (En Ruta)', coords: [7.0856, -73.1142] },
    { name: 'C.C. Cuarta Etapa', coords: [7.1215, -73.1125] },
    { name: 'Puerta del Sol', coords: [7.1023, -73.1185] },
  ];

  // Evaluar desvío cuando cambia el punto de abordaje
  const handleSelectPickup = async (coords, name = 'Punto seleccionado en el mapa') => {
    setSelectedPickup(coords);
    setPickupName(name);
    setIsLoadingEvaluation(true);

    try {
      // Consultar endpoint del microservicio de IA en puerto 8003
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
        // Modo local inteligente si no hay rutas activas en la BD
        const esDirecto = Math.abs(coords[0] - 7.0856) < 0.005;
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
    } catch {
      // Fallback seguro
      setMatchingData({
        modality: 'modalidad_2_desvio',
        detour_minutes: 4.5,
        suggested_fare_cop: 5800,
        traffic_status: 'Estimación con modelo horario',
        traffic_source: 'hourly_model',
        is_viable: true,
        estimated_arrival_time: '07:18 AM',
      });
    } finally {
      setIsLoadingEvaluation(false);
    }
  };

  const manejarReserva = () => {
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
          {/* Capa Base de Mapa OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Capa Satelital de Tráfico en Vivo TomTom (Overlay) */}
          {showTrafficLayer && TOMTOM_KEY && (
            <TileLayer
              attribution='&copy; <a href="https://www.tomtom.com/">TomTom Traffic</a>'
              url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`}
              opacity={0.75}
            />
          )}

          {/* Captura de clics en el mapa */}
          <MapClickHandler onLocationSelect={(coords) => handleSelectPickup(coords)} />

          {/* Polilínea de la Ruta Principal (Azul Lochmara) */}
          <Polyline
            positions={directCorridor}
            pathOptions={{
              color: '#0284c7',
              weight: 5,
              opacity: 0.9,
            }}
          />

          {/* Polilínea del Desvío de IA (Ámbar punteado si aplica Modalidad 2) */}
          {matchingData.modality === 'modalidad_2_desvio' && (
            <Polyline
              positions={detourCorridor}
              pathOptions={{
                color: '#f59e0b',
                weight: 6,
                dashArray: '8, 8',
                opacity: 0.95,
              }}
            />
          )}

          {/* Marcadores */}
          <Marker position={driverOrigin} icon={driverIcon}>
            <Popup>
              <strong>Origen del Conductor</strong>
              <br />Cañaveral (Floridablanca)
            </Popup>
          </Marker>

          <Marker
            position={selectedPickup}
            icon={matchingData.modality === 'modalidad_1_directa' ? directPickupIcon : pickupIcon}
          >
            <Popup>
              <strong>{pickupName}</strong>
              <br />
              {matchingData.modality === 'modalidad_1_directa' ? '⚡ Abordaje directo (0 min desvío)' : `✨ Desvío asistido (+${matchingData.detour_minutes} min)`}
            </Popup>
          </Marker>

          <Marker position={campusDestination} icon={campusIcon}>
            <Popup>
              <strong>Destino Universitario</strong>
              <br />{campusName}
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

          {/* Botón Toggle Capa de Tráfico TomTom */}
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
            <span>Tráfico TomTom {showTrafficLayer ? 'ON' : 'OFF'}</span>
          </button>
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
