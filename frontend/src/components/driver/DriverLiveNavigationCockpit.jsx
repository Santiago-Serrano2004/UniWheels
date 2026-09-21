import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripLifecycleService } from '../../services/api';
import { getPlaceCoordinates } from '../../hooks/useOsrmRoute';
import { useTurnByTurnNavigation } from '../../hooks/useTurnByTurnNavigation';
import { openExternalNavigation, isIOS } from '../../utils/mapNavigation';
import { haversineDistanceMeters, formatDistance } from '../../utils/geo';
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
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SosEmergencyModal } from '../common/SosEmergencyModal';
import { InAppGpsNavigator } from './InAppGpsNavigator';
import { TripSettlementModal } from './TripSettlementModal';

export const DriverLiveNavigationCockpit = ({ route, trip, onFinishTrip, onCancelTrip }) => {
  const { user, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [modoNavegadorCompleto, setModoNavegadorCompleto] = useState(false);
  const [pinIngresado, setPinIngresado] = useState('');
  const [pinVerificado, setPinVerificado] = useState(Boolean(trip?.is_pin_verified));
  const [errorPin, setErrorPin] = useState('');
  const [verificandoPin, setVerificandoPin] = useState(false);
  const [modalSosAbierto, setModalSosAbierto] = useState(false);
  const [modalQrAbierto, setModalQrAbierto] = useState(false);
  const [modalLiquidacionAbierto, setModalLiquidacionAbierto] = useState(false);
  const [errorLiquidacion, setErrorLiquidacion] = useState('');
  const [liquidando, setLiquidando] = useState(false);
  const [driverCoords, setDriverCoords] = useState(
    route?.origin_lat != null ? [route.origin_lat, route.origin_lng] : [7.0856, -73.1142]
  );

  const pickupIcon = createPickupMarker(trip?.pickup_address || 'Punto de recogida');
  const campusIcon = createCampusMarker(route?.destination || 'Campus');

  // Reflejar el estado real del PIN si cambia el trip activo (ej. al pasar al siguiente pasajero)
  useEffect(() => {
    setPinVerificado(Boolean(trip?.is_pin_verified));
    setPinIngresado('');
    setErrorPin('');
  }, [trip?.id]);

  // Punto de recogida: coordenadas aproximadas por dirección de texto (trip-service
  // no persiste lat/lng por viaje) — hasta tener pasajero abordado se navega hacia él;
  // ya verificado el PIN, se navega hacia el destino final de la ruta publicada.
  const pickupCoords = trip?.pickup_address ? getPlaceCoordinates(trip.pickup_address, false) : null;
  const campusCoords = route?.destination_lat != null
    ? [route.destination_lat, route.destination_lng]
    : getPlaceCoordinates(route?.destination, true);

  const destinoActualNav = pinVerificado || !pickupCoords ? campusCoords : pickupCoords;

  // Ubicación real del conductor, seguida en vivo mientras dure el viaje (no una sola
  // lectura): actualiza el marcador propio y reporta la posición a trip-service cada
  // ~5s (throttle vía ref) para que el pasajero pueda ver la posición real, no una
  // animación de demostración.
  const ultimoReporteRef = useRef(0);
  const [errorUbicacion, setErrorUbicacion] = useState('');
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorUbicacion('Este dispositivo no soporta geolocalización.');
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setErrorUbicacion('');
        setDriverCoords([pos.coords.latitude, pos.coords.longitude]);

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
      (err) => {
        // Motivo más común en un dispositivo real: la app se sirve por HTTP en
        // vez de HTTPS — los navegadores bloquean la Geolocation API fuera de
        // un contexto seguro (localhost es la única excepción).
        setErrorUbicacion(
          err.code === err.PERMISSION_DENIED
            ? 'Ubicación no disponible: permiso denegado o la app no se abrió por una conexión segura (HTTPS).'
            : 'No se pudo obtener tu ubicación real en este momento.'
        );
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip?.id]);

  const distanciaAlDestinoActual = destinoActualNav ? haversineDistanceMeters(driverCoords, destinoActualNav) : null;
  const turnByTurn = useTurnByTurnNavigation(driverCoords, destinoActualNav);
  const currentManeuver = turnByTurn.tieneIndicacionesReales
    ? `${turnByTurn.distanciaFormateada ? `${turnByTurn.distanciaFormateada} · ` : ''}${turnByTurn.instruccion}`
    : distanciaAlDestinoActual == null
    ? 'Calculando posición…'
    : pinVerificado
    ? `A ${formatDistance(distanciaAlDestinoActual)} del destino`
    : `A ${formatDistance(distanciaAlDestinoActual)} del punto de encuentro`;

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
        route={route}
        onExit={() => setModoNavegadorCompleto(false)}
        onComplete={() => {
          setModoNavegadorCompleto(false);
          setModalLiquidacionAbierto(true);
        }}
      />
    );
  }

  const routePolyline = turnByTurn.routeCoordinates.length >= 2
    ? turnByTurn.routeCoordinates
    : route?.route_path && route.route_path.length >= 2
    ? route.route_path
    : [driverCoords, campusCoords];

  // Enlaces de navegación externa (Waze / Google Maps / Apple Maps)
  const abrirWaze = () => {
    openExternalNavigation('waze', { destLat: destinoActualNav[0], destLng: destinoActualNav[1] });
  };

  const abrirGoogleMaps = () => {
    openExternalNavigation('google_maps', {
      destLat: destinoActualNav[0],
      destLng: destinoActualNav[1],
      originLat: driverCoords[0],
      originLng: driverCoords[1],
    });
  };

  const abrirAppleMaps = () => {
    openExternalNavigation('apple_maps', { destLat: destinoActualNav[0], destLng: destinoActualNav[1] });
  };

  const validarPinAbordaje = async (e) => {
    e.preventDefault();
    if (!trip?.id) {
      setErrorPin('No hay un pasajero pendiente de abordaje en este momento.');
      return;
    }
    setVerificandoPin(true);
    setErrorPin('');
    try {
      await tripLifecycleService.verifyPin(trip.id, pinIngresado.trim());
      setPinVerificado(true);
    } catch (err) {
      setErrorPin(err?.message || 'PIN incorrecto. Pide al pasajero el código de 4 dígitos de su app.');
    } finally {
      setVerificandoPin(false);
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
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-lochmara-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-lochmara-300' : 'text-lochmara-600'}`}>Siguiente Maniobra</p>
            <h3 className={`text-xs font-extrabold break-words leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentManeuver}</h3>
          </div>
        </div>

        {/* Botones de Integración Externa: Waze, Google Maps y (en iOS) Apple Maps */}
        <div className={`grid gap-2 pt-1 ${isIOS() ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={abrirWaze}
            className="py-2.5 px-2 rounded-2xl bg-[#33ccff] hover:bg-[#29b8e6] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Waze</span>
          </button>

          <button
            type="button"
            onClick={abrirGoogleMaps}
            className="py-2.5 px-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border border-slate-200"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Google Maps</span>
          </button>

          {isIOS() && (
            <button
              type="button"
              onClick={abrirAppleMaps}
              className="py-2.5 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border border-slate-700"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Apple Maps</span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso si no se pudo obtener la ubicación real del dispositivo */}
      {errorUbicacion && (
        <div className="p-3 rounded-2xl bg-amber-500/95 text-amber-950 text-xs font-semibold flex items-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="break-words">{errorUbicacion}</span>
        </div>
      )}

      {/* 2. MAPA DE NAVEGACIÓN EN TIEMPO REAL */}
      {/* `isolate` contiene el z-[400] del botón SOS dentro de esta tarjeta —
          sin esto, se sale por encima de modales renderizados después (ej.
          TripSettlementModal) que usan un z-index menor pero se pintan más
          tarde en el DOM. */}
      <div className={`relative isolate w-full h-56 rounded-3xl overflow-hidden border shadow-md ${
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

          {/* Parada de Recogida (solo si hay pasajero pendiente de abordar) */}
          {pickupCoords && !pinVerificado && (
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>{trip?.pickup_address || 'Punto de recogida'} (Pasajero: {trip?.passenger_name || 'por confirmar'})</Popup>
            </Marker>
          )}

          {/* Campus de Destino */}
          <Marker position={campusCoords} icon={campusIcon}>
            <Popup>{route?.destination || 'Destino'}</Popup>
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
        {trip ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-2xl font-bold text-xs flex items-center justify-center border ${
                  isDark
                    ? 'bg-slate-800 text-lochmara-300 border-slate-700'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {(trip.passenger_name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.passenger_name || 'Pasajero'}</h4>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Parada: {trip.pickup_address || 'Por confirmar'} • $ {Number(trip.fare_cop || 0).toLocaleString('es-CO')} COP
                  </p>
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
                  <span>Pasajero a bordo (PIN verificado)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Rumbo al destino</span>
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
                    disabled={verificandoPin}
                    className="py-2 px-4 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {verificandoPin ? 'Validando...' : 'Validar Abordaje'}
                  </button>
                </div>

                {errorPin && <p className="text-[10px] text-rose-500 font-semibold">{errorPin}</p>}
              </form>
            )}
          </>
        ) : (
          <p className={`text-xs text-center py-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ningún pasajero pendiente de abordaje en este momento.
          </p>
        )}
      </div>

      {/* 4. BOTONES DE ACCIÓN: COMPLETAR / CANCELAR */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModalLiquidacionAbierto(true)}
          disabled={!trip}
          className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
        onClose={() => {
          setModalLiquidacionAbierto(false);
          setErrorLiquidacion('');
        }}
        trip={trip}
        isProcessing={liquidando}
        errorMessage={errorLiquidacion}
        onConfirmSettlement={async () => {
          setLiquidando(true);
          setErrorLiquidacion('');
          try {
            await onFinishTrip();
            setModalLiquidacionAbierto(false);
          } catch (err) {
            setErrorLiquidacion(err?.message || 'No se pudo finalizar el viaje. Intenta de nuevo.');
          } finally {
            setLiquidando(false);
          }
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
        tripInfo={{ driverName: trip?.driver_name || user?.name, plate: trip?.vehicle_plate }}
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
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Código QR Ilustrativo */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-900" />
                </div>
                <p className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'Conductor'}</p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nequi / Daviplata: {user?.phone_number || user?.phone || 'No registrado'}</p>
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
