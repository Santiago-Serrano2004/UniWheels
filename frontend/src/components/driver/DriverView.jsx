import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService, LUGARES_POPULARES_AMB } from '../../services/placesApiService';
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
  Loader2,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Coordenadas oficiales de las sedes
const SEDES_COORDENADAS = {
  'Campus El Jardín': [7.1193, -73.1227],
  'Campus El Bosque': [7.0625, -73.1028],
  'CSU — Centro de Servicios Universitarios': [7.1145, -73.1189],
  'Campus La Casona': [7.1245, -73.1215],
};

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
  const { user } = useAppStore();

  // 1. Sentido del Viaje: 'hacia_campus' | 'desde_campus' (Estructura cerrada)
  const [sentidoViaje, setSentidoViaje] = useState('hacia_campus');

  // 2. Lista de sedes oficiales cargadas desde la base de datos
  const [sedesInstitucion, setSedesInstitucion] = useState([
    { id: 1, name: 'Campus El Jardín' },
    { id: 2, name: 'Campus El Bosque' },
    { id: 3, name: 'CSU — Centro de Servicios Universitarios' },
    { id: 4, name: 'Campus La Casona' },
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
  const [trayectoPublicado, setTrayectoPublicado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const buscadorRef = useRef(null);

  // Cargar sedes dinámicas desde la API
  useEffect(() => {
    authService.getInstitutions().then((instituciones) => {
      if (instituciones && instituciones.length > 0 && instituciones[0].campuses) {
        setSedesInstitucion(instituciones[0].campuses);
        if (user?.campus) {
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
      }, 300);

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

  // Coordenadas de la sede seleccionada
  const coordsSedeActual = SEDES_COORDENADAS[sedeSeleccionada] || [7.1193, -73.1227];

  // Trazado de ruta
  const trazadoRuta =
    sentidoViaje === 'hacia_campus'
      ? [puntoCoords, coordsSedeActual]
      : [coordsSedeActual, puntoCoords];

  const publicarTrayecto = (e) => {
    e.preventDefault();
    setTrayectoPublicado(true);
    const origenTexto = sentidoViaje === 'hacia_campus' ? direccionLugar : sedeSeleccionada;
    const destinoTexto = sentidoViaje === 'hacia_campus' ? sedeSeleccionada : direccionLugar;
    setMensajeExito(`¡Trayecto publicado exitosamente! Ruta: ${origenTexto} ➔ ${destinoTexto} (${horaSalida} AM)`);
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. HERO BANNER MODO CONDUCTOR */}
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

        {/* Selector Cerrado de Sentido del Viaje */}
        <div className="p-1 bg-white/10 backdrop-blur-md rounded-2xl flex items-center gap-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setSentidoViaje('hacia_campus')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sentidoViaje === 'hacia_campus'
                ? 'bg-lochmara-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Hacia el Campus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSentidoViaje('desde_campus')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sentidoViaje === 'desde_campus'
                ? 'bg-lochmara-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Desde el Campus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. MENSAJE DE ÉXITO */}
      {mensajeExito && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Trayecto Activo</p>
            <p className="text-[11px] text-emerald-700 leading-snug">{mensajeExito}</p>
          </div>
        </motion.div>
      )}

      {/* 3. FORMULARIO ESTRUCTURADO: CAMPUS Y DIRECCIÓN */}
      <form onSubmit={publicarTrayecto} className="space-y-4">
        {/* SELECCIÓN OBLIGATORIA DEL CAMPUS UNIVERSITARIO */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-lochmara-600" />
              <span>Campus Universitario ({sentidoViaje === 'hacia_campus' ? 'Destino Fijo' : 'Origen Fijo'})</span>
            </label>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Sede Oficial
            </span>
          </div>

          <select
            value={sedeSeleccionada}
            onChange={(e) => setSedeSeleccionada(e.target.value)}
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 rounded-2xl px-3.5 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 shadow-2xs cursor-pointer"
          >
            {sedesInstitucion.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </section>

        {/* SELECCIÓN DEL PUNTO EN EL AMB (ORIGEN O DESTINO SEGÚN CORRESPONDA) */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
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
              {cargandoGeocodificacion && (
                <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-lochmara-600 animate-spin" />
              )}
            </div>

            {/* Menú Desplegable de Sugerencias Photon / Nominatim */}
            {mostrandoSugerencias && (
              <div className="absolute top-full left-0 right-0 z-40 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl divide-y divide-slate-100 overflow-hidden max-h-56 overflow-y-auto">
                <div className="p-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sugerencias en Bucaramanga y AMB
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

          {/* Dirección Fijada Automáticamente (Desde el mapa o búsqueda) */}
          <div className="p-3 rounded-2xl bg-lochmara-50/80 border border-lochmara-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-2.5 h-2.5 rounded-full bg-lochmara-600 shrink-0" />
              <div>
                <span className="text-[10px] text-lochmara-700 font-bold block uppercase">
                  {sentidoViaje === 'hacia_campus' ? 'Punto de Partida Fijado' : 'Punto de Llegada Fijado'}
                </span>
                <span className="font-bold text-slate-900 truncate">{direccionLugar}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-lochmara-700 bg-white px-2 py-0.5 rounded-full border border-lochmara-200 shrink-0">
              Coordenada Activa
            </span>
          </div>
        </section>

        {/* 4. SELECTOR DIDÁCTICO EN EL MAPA LEAFLET */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-2">
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

        {/* 5. PARÁMETROS DE SALIDA, CUPOS Y APORTE */}
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

        {/* 6. BOTÓN PARA PUBLICAR */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
        >
          <Car className="w-4 h-4" />
          <span>Publicar Trayecto en Mi Corredor</span>
        </button>
      </form>
    </div>
  );
};
