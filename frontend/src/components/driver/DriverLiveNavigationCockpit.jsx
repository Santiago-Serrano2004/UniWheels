import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripLifecycleService } from '../../services/api';
import { MapContainer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AppMapTileLayer } from '../map/AppMapTileLayer';
import { createVehicleMarker, createPickupMarker, createCampusMarker } from '../map/mapIcons';
import {
  Navigation,
  ExternalLink,
  MapPin,
  Clock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  Users,
  Compass,
  ArrowUpRight,
  ShieldAlert,
  Car,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SosEmergencyModal } from '../common/SosEmergencyModal';
import { InAppGpsNavigator } from './InAppGpsNavigator';
import { TripSettlementModal } from './TripSettlementModal';

const pickupIcon = createPickupMarker('Parque San Pío');
const campusIcon = createCampusMarker('Campus El Jardín');

export const DriverLiveNavigationCockpit = ({ trip, onFinishTrip, onCancelTrip }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [modoNavegadorCompleto, setModoNavegadorCompleto] = useState(false);
  const [currentManeuver, setCurrentManeuver] = useState('En 350m gire a la derecha hacia Carrera 33');
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState(2400);
  const [speedKmh, setSpeedKmh] = useState(38);
  const [pinIngresado, setPinIngresado] = useState('');
  const [pinVerificado, setPinVerificado] = useState(false);
  const [errorPin, setErrorPin] = useState('');
  const [modalSosAbierto, setModalSosAbierto] = useState(false);
  const [modalQrAbierto, setModalQrAbierto] = useState(false);
  const [modalLiquidacionAbierto, setModalLiquidacionAbierto] = useState(false);

  const iniciarNavegacion = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setModoNavegadorCompleto(true);
  };

  // Si el conductor activa el navegador asistido interactivo en la app
  if (modoNavegadorCompleto) {
    return (
      <InAppGpsNavigator
        trip={trip}
        onExit={() => setModoNavegadorCompleto(false)}
        onComplete={() => {
          setModoNavegadorCompleto(false);
          setModalLiquidacionAbierto(true);
        }}
      />
    );
  }

  // Coordenadas fijas de la ruta
  const driverCoords = [7.0856, -73.1142]; // Provenza
  const pickupCoords = [7.1186, -73.1102]; // Parque San Pío
  const campusCoords = [7.1193, -73.1042]; // Campus El Jardín

  const routePolyline = [
    [7.0678, -73.1066], // Cañaveral
    [7.0856, -73.1142], // Provenza
    [7.1023, -73.1185], // Puerta del Sol
    [7.1145, -73.1100], // Cra 33
    [7.1186, -73.1102], // San Pío
    [7.1193, -73.1042], // Campus
  ];

  // Enlaces de navegación externa a Waze y Google Maps
  const abrirWaze = () => {
    const lat = pickupCoords[0];
    const lng = pickupCoords[1];
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const abrirGoogleMaps = () => {
    const lat = pickupCoords[0];
    const lng = pickupCoords[1];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  const abrirAppleMaps = () => {
    const lat = pickupCoords[0];
    const lng = pickupCoords[1];
    window.open(`maps://?daddr=${lat},${lng}&dirflg=d`, '_blank');
  };

  const validarPinAbordaje = (e) => {
    e.preventDefault();
    if (pinIngresado.trim() === '4829') {
      setPinVerificado(true);
      setErrorPin('');
    } else {
      setErrorPin('PIN incorrecto. Pide al pasajero el código de 4 dígitos de su app.');
    }
  };

  return (
    <div className="space-y-3 pb-8 select-none">
      {/* BOTÓN PRINCIPAL: INICIAR NAVEGADOR ASISTIDO INTEGRADO */}
      <button
        type="button"
        onClick={iniciarNavegacion}
        className="w-full py-3.5 px-4 rounded-3xl bg-gradient-to-r from-lochmara-600 via-lochmara-500 to-emerald-600 hover:from-lochmara-500 hover:to-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-lochmara-600/25 cursor-pointer transition-all hover:scale-[1.01]"
      >
        <Navigation className="w-4 h-4 fill-current animate-pulse" />
        <span>Iniciar Navegador Asistido en la App (GPS + Voz)</span>
      </button>

      {/* 1. HUD DE NAVEGACIÓN PASO A PASO (TURN-BY-TURN) */}
      <div className={`rounded-3xl p-4 shadow-xl border space-y-3 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lochmara-600 flex items-center justify-center text-white shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-lochmara-300 font-bold uppercase">Siguiente Maniobra</p>
              <h3 className="text-xs font-extrabold text-white">{currentManeuver}</h3>
            </div>
          </div>

          <div className="text-right bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="text-xs font-mono font-extrabold text-emerald-400">{speedKmh} km/h</span>
          </div>
        </div>

        {/* Botones de Integración Externa: Waze y Google Maps */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={abrirWaze}
            className="py-2.5 px-3 rounded-2xl bg-[#33ccff] hover:bg-[#29b8e6] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Navegar en Waze</span>
          </button>

          <button
            type="button"
            onClick={abrirGoogleMaps}
            className="py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border border-slate-200"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* 2. MAPA DE NAVEGACIÓN EN TIEMPO REAL */}
      <div className={`relative w-full h-56 rounded-3xl overflow-hidden border shadow-md ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <MapContainer
          center={driverCoords}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <AppMapTileLayer />

          <Polyline positions={routePolyline} pathOptions={{ color: '#0284c7', weight: 5, opacity: 0.85 }} />

          {/* Marcador del Carro en Navegación */}
          <Marker position={driverCoords} icon={createVehicleMarker(25, '#0284c7')}>
            <Popup>Tu ubicación en vivo (Conduciendo)</Popup>
          </Marker>

          {/* Parada de Recogida */}
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>Parque San Pío (Pasajero: Santiago García)</Popup>
          </Marker>

          {/* Campus de Destino */}
          <Marker position={campusCoords} icon={campusIcon}>
            <Popup>Campus El Jardín</Popup>
          </Marker>
        </MapContainer>

        {/* Botón Flotante SOS en Pantalla del Conductor */}
        <button
          type="button"
          onClick={() => setModalSosAbierto(true)}
          className="absolute bottom-3 right-3 z-[400] p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl flex items-center gap-1 text-xs font-bold transition-transform hover:scale-105 cursor-pointer border-2 border-white"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SOS</span>
        </button>
      </div>

      {/* 3. PANEL DE ABORDAJE Y VALIDACIÓN DE PIN */}
      <div className={`rounded-3xl p-4 border shadow-2xs space-y-3 transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-2xl font-bold text-xs flex items-center justify-center border ${
              isDark
                ? 'bg-slate-800 text-lochmara-300 border-slate-700'
                : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              SG
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Santiago García</h4>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Parada: Parque San Pío • $ 5.800 COP</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalQrAbierto(true)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isDark
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Mostrar QR Nequi / Daviplata para pago"
          >
            <QrCode className="w-3.5 h-3.5 text-lochmara-500" />
            <span>Cobro QR</span>
          </button>
        </div>

        {/* Formulario de Verificación de PIN */}
        {pinVerificado ? (
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
            isDark
              ? 'bg-slate-950 border-emerald-900/40 text-emerald-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pasajero a bordo (PIN 4829 verificado)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Rumbo al campus</span>
          </div>
        ) : (
          <form onSubmit={validarPinAbordaje} className="space-y-2">
            <label className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <KeyRound className="w-3 h-3 text-lochmara-500" />
              <span>Verificar PIN de 4 Dígitos del Pasajero</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                required
                placeholder="Ej. 4829"
                value={pinIngresado}
                onChange={(e) => setPinIngresado(e.target.value)}
                className={`flex-1 text-xs font-mono font-bold rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 text-center tracking-widest ${
                  isDark
                    ? 'bg-slate-950 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-900 border-slate-200'
                }`}
              />

              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Validar Abordaje
              </button>
            </div>

            {errorPin && <p className="text-[10px] text-rose-500 font-semibold">{errorPin}</p>}
          </form>
        )}
      </div>

      {/* 4. BOTONES DE ACCIÓN: COMPLETAR / CANCELAR */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModalLiquidacionAbierto(true)}
          className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finalizar Viaje y Cobrar</span>
        </button>

        <button
          type="button"
          onClick={onCancelTrip}
          className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-950 hover:bg-rose-500/10 text-rose-400 border-slate-800 hover:border-rose-500/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
          }`}
        >
          Cancelar
        </button>
      </div>

      {/* MODAL DE LIQUIDACIÓN Y COBRO CON QR */}
      <TripSettlementModal
        isOpen={modalLiquidacionAbierto}
        onClose={() => setModalLiquidacionAbierto(false)}
        trip={trip}
        onConfirmSettlement={() => {
          setModalLiquidacionAbierto(false);
          onFinishTrip();
        }}
        onReportIncident={() => {
          setModalLiquidacionAbierto(false);
          onFinishTrip();
        }}
      />

      {/* MODAL DE EMERGENCIA SOS */}
      <SosEmergencyModal
        isOpen={modalSosAbierto}
        onClose={() => setModalSosAbierto(false)}
        currentCoords={driverCoords}
        tripInfo={{ driverName: 'Carlos Mendoza', plate: 'KLU-492' }}
      />

      {/* MODAL DE COBRO QR NEQUI / DAVIPLATA */}
      <AnimatePresence>
        {modalQrAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-3xl p-5 w-full max-w-[310px] text-center space-y-3 shadow-2xl border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cobro Directo Nequi / Daviplata</h3>
                <button
                  onClick={() => setModalQrAbierto(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Código QR Ilustrativo */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-900" />
                </div>
                <p className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Carlos Mendoza</p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nequi / Daviplata: 315 892 4410</p>
              </div>

              <button
                type="button"
                onClick={() => setModalQrAbierto(false)}
                className="w-full py-2.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar Código QR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
