import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService, LUGARES_POPULARES_AMB } from '../../services/placesApiService';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Navigation,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Building2,
  CalendarCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Pines vectoriales personalizados para Leaflet
const createCustomPin = (color, emoji) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 15px;">
        ${emoji}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const pointIcon = createCustomPin('#0284c7', '📍');
const campusIcon = createCustomPin('#082f49', '🎓');

// Componente interactivo para capturar clics o arrastre del marcador en Leaflet
function MapLocationPicker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          onPositionChange([latlng.lat, latlng.lng]);
        },
      }}
      icon={pointIcon}
    >
      <Popup>Punto seleccionado (Toca o arrastra para mover)</Popup>
    </Marker>
  );
}

export const DriverView = () => {
  const {
    user,
    activeDriverTrip,
    publishDriverTrip,
    driverWalletBalance,
    setActiveTab,
  } = useAppStore();

  // 1. Sentido del Viaje: 'hacia_campus' | 'desde_campus'
  const [sentidoViaje, setSentidoViaje] = useState('hacia_campus');

  // 2. Lista de sedes oficiales cargadas desde la base de datos
  const [sedesInstitucion, setSedesInstitucion] = useState([
    { id: 1, name: 'Campus El Jardín', is_main_campus: true },
    { id: 2, name: 'Campus El Bosque', is_main_campus: false },
    { id: 3, name: 'CSU — Centro de Servicios Universitarios', is_main_campus: false },
    { id: 4, name: 'Campus La Casona', is_main_campus: false },
  ]);

  // Sede seleccionada
  const [sedeSeleccionada, setSedeSeleccionada] = useState('Campus El Jardín');

  // 3. Punto personalizado (Barrio/Lugar en el AMB)
  const [puntoCoords, setPuntoCoords] = useState([7.0678, -73.1066]); // Cañaveral por defecto
  const [direccionLugar, setDireccionLugar] = useState('Centro Comercial Cañaveral, Floridablanca');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [cargandoGeocodificacion, setCargandoGeocodificacion] = useState(false);

  // 4. Parámetros del Viaje
  const [horaSalida, setHoraSalida] = useState('06:45');
  const [cupos, setCupos] = useState(3);
  const [tarifa, setTarifa] = useState('4500');
  const [modalSaldoInsuficiente, setModalSaldoInsuficiente] = useState(false);

  const buscadorRef = useRef(null);

  // Cerrar sugerencias al hacer clic fuera del buscador
  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrandoSugerencias(false);
      }
    };
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, []);

  // Cargar sedes dinámicas desde la base de datos
  useEffect(() => {
    authService.getInstitutions().then((instituciones) => {
      if (instituciones && instituciones.length > 0 && instituciones[0].campuses) {
        setSedesInstitucion(instituciones[0].campuses);
        const sedePrincipal = instituciones[0].campuses.find((c) => c.is_main_campus);
        if (sedePrincipal) {
          setSedeSeleccionada(sedePrincipal.name);
        } else if (user?.campus) {
          setSedeSeleccionada(user.campus);
        }
      }
    });
  }, [user]);

  // Buscar sugerencias en vivo con Photon / Nominatim API
  useEffect(() => {
    if (busquedaTexto.trim().length >= 2) {
      setCargandoGeocodificacion(true);
      const timer = setTimeout(() => {
        placesApiService.searchPlaces(busquedaTexto).then((res) => {
          setSugerencias(res);
          setCargandoGeocodificacion(false);
          setMostrandoSugerencias(true);
        });
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setSugerencias(LUGARES_POPULARES_AMB.slice(0, 4));
    }
  }, [busquedaTexto]);

  // Manejar selección de lugar desde la lista desplegable
  const seleccionarLugarSugerido = (lugar) => {
    setPuntoCoords(lugar.coords);
    setDireccionLugar(`${lugar.nombre} (${lugar.direccion.split(',')[0]})`);
    setBusquedaTexto('');
    setMostrandoSugerencias(false);
  };

  // Manejar selección en el mapa Leaflet -> Reverse Geocoding automático
  const manejarCambioPuntoMapa = async (nuevasCoords) => {
    setPuntoCoords(nuevasCoords);
    const direccionObtenida = await placesApiService.reverseGeocode(nuevasCoords[0], nuevasCoords[1]);
    setDireccionLugar(direccionObtenida);
  };

  // Usar geolocalización actual
  const usarUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPuntoCoords([lat, lon]);
          const dir = await placesApiService.reverseGeocode(lat, lon);
          setDireccionLugar(dir);
        },
        () => {
          alert('No se pudo obtener tu ubicación actual.');
        }
      );
    }
  };

  // Coordenadas dinámicas de la sede seleccionada desde la base de datos
  const campusObjActual = sedesInstitucion.find((s) => s.name === sedeSeleccionada);
  const coordsSedeActual =
    campusObjActual && campusObjActual.latitude && campusObjActual.longitude
      ? [campusObjActual.latitude, campusObjActual.longitude]
      : [7.119346, -73.104278];

  // Trazado de ruta
  const trazadoRuta =
    sentidoViaje === 'hacia_campus'
      ? [puntoCoords, coordsSedeActual]
      : [coordsSedeActual, puntoCoords];

  // Validar y publicar trayecto
  const manejarPublicarTrayecto = (e) => {
    e.preventDefault();

    // 1. Validación de saldo mínimo de conductor ($ 2.000 COP)
    if (driverWalletBalance < 2000) {
      setModalSaldoInsuficiente(true);
      return;
    }

    const origenTexto = sentidoViaje === 'hacia_campus' ? direccionLugar : sedeSeleccionada;
    const destinoTexto = sentidoViaje === 'hacia_campus' ? sedeSeleccionada : direccionLugar;

    publishDriverTrip({
      direction: sentidoViaje,
      campus: sedeSeleccionada,
      origin: origenTexto,
      destination: destinoTexto,
      originCoords: sentidoViaje === 'hacia_campus' ? puntoCoords : coordsSedeActual,
      destinationCoords: sentidoViaje === 'hacia_campus' ? coordsSedeActual : puntoCoords,
      departureTime: horaSalida,
      seats: Number(cupos),
      availableSeats: Number(cupos),
      price: Number(tarifa),
    });
  };

  // SI YA EXISTE UN VIAJE ACTIVO, MOSTRAR MENSAJE Y BLOQUEAR NUEVA PUBLICACIÓN
  if (activeDriverTrip) {
    return (
      <div className="space-y-4 pb-6 select-none">
        <div className="bg-gradient-to-br from-[#082f49] via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Publicación Activa</span>
            </div>
            <span className="text-xs font-mono font-bold text-lochmara-300">
              {activeDriverTrip.departureTime}
            </span>
          </div>

          <h2 className="text-base font-extrabold">Ya tienes un viaje publicado</h2>
          <p className="text-xs text-slate-300">
            Tu vehículo ya tiene un trayecto activo programado. Para publicar una nueva ruta, primero debes finalizar o cancelar el viaje actual.
          </p>

          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-xs space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Ruta Actual</p>
            <p className="font-bold text-white truncate">
              {activeDriverTrip.origin} ➔ {activeDriverTrip.destination}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="w-full py-3 rounded-2xl bg-lochmara-500 hover:bg-lochmara-400 active:bg-lochmara-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Ir a Mi Panel de Viaje</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. HERO BANNER CON BOTÓN DESLIZANTE TIPO ON/OFF */}
      <section className="bg-gradient-to-br from-[#082f49] via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cabina del Conductor</span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Publicar Nuevo Trayecto</h2>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-lochmara-600/30 border border-lochmara-400/30 flex items-center justify-center text-white">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* Alternador con Animación Suave de Desplazamiento (Sliding Pill) */}
        <div className="relative p-1 bg-white/10 backdrop-blur-md rounded-2xl flex items-center border border-white/10 text-xs select-none">
          <button
            type="button"
            onClick={() => setSentidoViaje('hacia_campus')}
            className={`relative flex-1 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 z-10 cursor-pointer ${
              sentidoViaje === 'hacia_campus' ? 'text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {sentidoViaje === 'hacia_campus' && (
              <motion.div
                layoutId="pill-direction"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-lochmara-500 rounded-xl shadow-xs z-[-1]"
              />
            )}
            <span>Hacia el Campus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSentidoViaje('desde_campus')}
            className={`relative flex-1 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 z-10 cursor-pointer ${
              sentidoViaje === 'desde_campus' ? 'text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {sentidoViaje === 'desde_campus' && (
              <motion.div
                layoutId="pill-direction"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-lochmara-500 rounded-xl shadow-xs z-[-1]"
              />
            )}
            <span>Desde el Campus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. FORMULARIO ESTRUCTURADO */}
      <form onSubmit={manejarPublicarTrayecto} className="space-y-4">
        {/* SELECCIÓN LIMPIA DEL CAMPUS UNIVERSITARIO */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-lochmara-600" />
            <span>Campus Universitario</span>
          </label>

          <select
            value={sedeSeleccionada}
            onChange={(e) => setSedeSeleccionada(e.target.value)}
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 rounded-2xl px-3.5 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 shadow-2xs cursor-pointer"
          >
            {sedesInstitucion.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} {s.is_main_campus ? '• (Sede Principal)' : ''}
              </option>
            ))}
          </select>
        </section>

        {/* SELECCIÓN DEL PUNTO EN EL AMB (CON DESPLEGABLE EN CAPA SUPERIOR Z-50) */}
        <section className="relative z-30 bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {sentidoViaje === 'hacia_campus' ? 'Desde (Punto de Partida)' : 'Hacia (Punto de Llegada)'}
            </h3>
            <button
              type="button"
              onClick={usarUbicacionActual}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-lochmara-600 hover:underline cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              <span>Mi Ubicación</span>
            </button>
          </div>

          {/* Input de Búsqueda de Lugar / Dirección */}
          <div className="relative" ref={buscadorRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaTexto}
                onFocus={() => setMostrandoSugerencias(true)}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                placeholder="Buscar barrio, dirección o punto en el AMB..."
                className="w-full bg-slate-50 text-xs rounded-2xl pl-10 pr-9 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium"
              />
              {cargandoGeocodificacion ? (
                <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-lochmara-600 animate-spin" />
              ) : busquedaTexto ? (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaTexto('');
                    setMostrandoSugerencias(false);
                  }}
                  className="p-1 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Menú Desplegable de Sugerencias en Capa Superior z-50 */}
            {mostrandoSugerencias && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl divide-y divide-slate-100 overflow-hidden max-h-56 overflow-y-auto">
                <div className="p-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Sugerencias en Bucaramanga y AMB</span>
                  <button
                    type="button"
                    onClick={() => setMostrandoSugerencias(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {sugerencias.map((lugar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seleccionarLugarSugerido(lugar)}
                    className="w-full p-2.5 flex items-start gap-2.5 hover:bg-lochmara-50 text-left transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-lochmara-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{lugar.nombre}</p>
                      <p className="text-[10px] text-slate-500 truncate">{lugar.direccion}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dirección Sincronizada Automáticamente con el Mapa */}
          <div className="p-3 rounded-2xl bg-lochmara-50/80 border border-lochmara-200 flex items-center gap-2.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-600 shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[10px] text-lochmara-700 font-bold block uppercase">
                {sentidoViaje === 'hacia_campus' ? 'Desde (Punto de Partida Fijado)' : 'Hacia (Punto de Llegada Fijado)'}
              </span>
              <span className="font-bold text-slate-900 truncate block">{direccionLugar}</span>
            </div>
          </div>
        </section>

        {/* 3. SELECTOR DIDÁCTICO EN EL MAPA LEAFLET */}
        <section className="relative z-10 bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Seleccionar en el Mapa
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Toca o arrastra el pin</span>
          </div>

          <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200">
            <MapContainer
              center={puntoCoords}
              zoom={14}
              zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Trazado de Ruta Bidireccional */}
              <Polyline
                positions={trazadoRuta}
                pathOptions={{ color: '#0284c7', weight: 4, opacity: 0.8, dashArray: '6, 6' }}
              />

              {/* Marcador del Punto en el AMB */}
              <MapLocationPicker
                position={puntoCoords}
                onPositionChange={manejarCambioPuntoMapa}
              />

              {/* Marcador del Campus Universitario */}
              <Marker position={coordsSedeActual} icon={campusIcon}>
                <Popup>{sedeSeleccionada}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </section>

        {/* 4. PARÁMETROS DE SALIDA, CUPOS Y APORTE */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detalles del Trayecto
          </h3>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Hora de Salida */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-lochmara-600" />
                <span>Salida</span>
              </label>
              <input
                type="time"
                required
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                className="w-full bg-slate-50 text-xs font-bold text-slate-900 rounded-xl px-2.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              />
            </div>

            {/* Cupos */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Users className="w-3 h-3 text-lochmara-600" />
                <span>Cupos</span>
              </label>
              <select
                value={cupos}
                onChange={(e) => setCupos(Number(e.target.value))}
                className="w-full bg-slate-50 text-xs font-bold text-slate-900 rounded-xl px-2.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 cursor-pointer"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'cupo' : 'cupos'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarifa / Aporte */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-600" />
                <span>Aporte</span>
              </label>
              <select
                value={tarifa}
                onChange={(e) => setTarifa(e.target.value)}
                className="w-full bg-slate-50 text-xs font-bold text-emerald-700 rounded-xl px-2 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 cursor-pointer"
              >
                <option value="3500">$ 3.500</option>
                <option value="4000">$ 4.000</option>
                <option value="4500">$ 4.500</option>
                <option value="5000">$ 5.000</option>
              </select>
            </div>
          </div>
        </section>

        {/* 5. BOTÓN PARA PUBLICAR */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
        >
          <Car className="w-4 h-4" />
          <span>Publicar Trayecto en Mi Corredor</span>
        </button>
      </form>

      {/* MODAL DE SALDO INSUFICIENTE EN BILLETERA DE CONDUCTOR */}
      <InsufficientBalanceModal
        isOpen={modalSaldoInsuficiente}
        onClose={() => setModalSaldoInsuficiente(false)}
        currentBalance={driverWalletBalance}
        minRequired={2000}
        onGoToRecharge={() => setActiveTab('wallet')}
      />
    </div>
  );
};
