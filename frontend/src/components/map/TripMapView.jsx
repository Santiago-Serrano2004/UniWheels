import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ShieldCheck, Users, Clock, ArrowRight, CheckCircle2, Car } from 'lucide-react';
import { motion } from 'framer-motion';

// Creacion de iconos SVG para los pines del mapa
const createCustomPin = (bgColor, label) =>
  L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="background-color: ${bgColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const driverIcon = createCustomPin('#0284c7', '🚗');
const pickupIcon = createCustomPin('#0ea5e9', '📍');
const unabIcon = createCustomPin('#082f49', '🎓');

export const TripMapView = () => {
  const [isBooked, setIsBooked] = useState(false);

  // Coordenadas reales del corredor de Bucaramanga a UNAB Campus El Jardin
  const driverOrigin = [7.0982, -73.1116]; // Cañaveral
  const passengerPickup = [7.1145, -73.1189]; // Parque San Pio
  const unabDestination = [7.1193, -73.1227]; // UNAB El Jardín

  const routeCorridor = [
    [7.0982, -73.1116],
    [7.1045, -73.1152],
    [7.1145, -73.1189],
    [7.1172, -73.1215],
    [7.1193, -73.1227],
  ];

  return (
    <div className="relative w-full h-[calc(100dvh-135px)] sm:h-[720px] flex flex-col justify-between overflow-hidden rounded-3xl">
      {/* Contenedor del Mapa Leaflet */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[7.114, -73.118]}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Trazado de Ruta en Lochmara Blue */}
          <Polyline
            positions={routeCorridor}
            pathOptions={{
              color: '#0284c7',
              weight: 5,
              opacity: 0.9,
              dashArray: '8, 8',
            }}
          />

          {/* Marcadores */}
          <Marker position={driverOrigin} icon={driverIcon}>
            <Popup>Origen del Conductor (Cañaveral)</Popup>
          </Marker>
          <Marker position={passengerPickup} icon={pickupIcon}>
            <Popup>Tu Punto de Abordaje (San Pío)</Popup>
          </Marker>
          <Marker position={unabDestination} icon={unabIcon}>
            <Popup>Destino: UNAB Campus El Jardín</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Chip Flotante Superior: Telemetría de Matching Espacial */}
      <div className="relative z-10 m-3 flex items-center justify-between">
        <div className="bg-slate-950/85 backdrop-blur-md text-white border border-slate-800 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold">Matching Geoespacial: 98%</span>
        </div>

        <div className="bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 px-3 py-1.5 rounded-full shadow-md text-xs font-bold">
          +3 min desvío
        </div>
      </div>

      {/* Drawer Inferior Flotante con Detalles del Viaje */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 m-3 bg-white/95 backdrop-blur-lg rounded-3xl p-4 border border-slate-200/90 shadow-xl space-y-3"
      >
        {/* Informacion del Conductor */}
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
            <span className="text-base font-extrabold text-lochmara-700">$ 4.500</span>
            <p className="text-[10px] text-slate-400">Tarifa fija UNAB</p>
          </div>
        </div>

        {/* Punto de Recogida Seleccionado */}
        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500" />
            <span className="font-semibold text-slate-800 truncate">Punto: Parque San Pío</span>
          </div>
          <span className="text-[11px] text-slate-500">Llegada ~ 07:05 AM</span>
        </div>

        {/* Boton de Accion de Reserva */}
        <button
          onClick={() => setIsBooked(!isBooked)}
          className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            isBooked
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white shadow-lochmara-600/30'
          }`}
        >
          {isBooked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Cupo Confirmado (Monitoreando en Vivo)</span>
            </>
          ) : (
            <>
              <Car className="w-4 h-4" />
              <span>Confirmar y Reservar Cupo</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
