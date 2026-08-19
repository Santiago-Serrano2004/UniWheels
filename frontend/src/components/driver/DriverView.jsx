import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService, LUGARES_POPULARES_AMB } from '../../services/placesApiService';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { DriverLiveNavigationCockpit } from './DriverLiveNavigationCockpit';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { DriverRoutePublishForm } from './DriverRoutePublishForm';
import { Car, Building2, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export const DriverView = () => {
  const {
    activeDriverTrip,
    publishDriverTrip,
    driverWalletBalance,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';

  // Fechas dinámicas
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Sentido del Viaje: 'hacia_campus' | 'desde_campus' | 'entre_campus'
  const [sentidoViaje, setSentidoViaje] = useState('hacia_campus');

  // 2. Sedes Universitarias
  const [sedesInstitucion, setSedesInstitucion] = useState([
    { id: 1, name: 'Campus El Jardín', is_main_campus: true, latitude: 7.119346, longitude: -73.104278 },
    { id: 2, name: 'Campus El Bosque', is_main_campus: false, latitude: 7.066491, longitude: -73.103789 },
    { id: 3, name: 'CSU — Centro de Servicios Universitarios', is_main_campus: false, latitude: 7.113821, longitude: -73.106842 },
    { id: 4, name: 'Campus La Casona', is_main_campus: false, latitude: 7.118210, longitude: -73.116520 },
  ]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('Campus El Jardín');
  const [sedeDestinoSeleccionada, setSedeDestinoSeleccionada] = useState('Campus El Bosque');

  // 3. Punto de Encuentro en el Campus (para salidas de campus o entre campus)
  const [puntoEncuentroCampus, setPuntoEncuentroCampus] = useState('Portería Principal Calle 48');

  // 4. Punto Personalizado en el AMB (para Hacia o Desde Campus)
  const [puntoCoords, setPuntoCoords] = useState([7.0678, -73.1066]);
  const [direccionLugar, setDireccionLugar] = useState('Centro Comercial Cañaveral, Floridablanca');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [cargandoGeocodificacion, setCargandoGeocodificacion] = useState(false);

  // 5. Parámetros y Fecha Programada
  const [fechaSalida, setFechaSalida] = useState(todayStr);
  const [horaSalida, setHoraSalida] = useState('06:45');
  const [cupos, setCupos] = useState(3);
  const [tarifa, setTarifa] = useState('4500');
  const [modalSaldoInsuficiente, setModalSaldoInsuficiente] = useState(false);
  const [showDriverMapModal, setShowDriverMapModal] = useState(false);

  const buscadorRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Click outside detector
  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrandoSugerencias(false);
      }
    };
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, []);

  // Cargar sedes dinámicas
  useEffect(() => {
    authService.getInstitutions().then((res) => {
      const campuses = Array.isArray(res) ? res[0]?.campuses : res?.data?.[0]?.campuses;
      if (campuses && campuses.length > 0) {
        setSedesInstitucion(campuses);
        const sedePrincipal = campuses.find((c) => c.is_main_campus) || campuses[0];
        if (sedePrincipal) {
          setSedeSeleccionada(sedePrincipal.name);
          const otraSede = campuses.find((c) => c.name !== sedePrincipal.name) || campuses[1];
          if (otraSede) setSedeDestinoSeleccionada(otraSede.name);
        }
      }
    }).catch(() => {});
  }, []);

  // Búsqueda reactiva
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    if (busquedaTexto.trim().length >= 2) {
      setCargandoGeocodificacion(true);
      const timer = setTimeout(() => {
        placesApiService.searchPlaces(busquedaTexto).then((res) => {
          setSugerencias(res);
          setCargandoGeocodificacion(false);
          setMostrandoSugerencias(true);
        }).catch(() => setCargandoGeocodificacion(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSugerencias(LUGARES_POPULARES_AMB.slice(0, 4));
    }
  }, [busquedaTexto]);

  const seleccionarLugarSugerido = (lugar) => {
    isSelectingRef.current = true;
    setPuntoCoords(lugar.coords);
    setDireccionLugar(`${lugar.nombre} (${lugar.direccion.split(',')[0]})`);
    setBusquedaTexto('');
    setMostrandoSugerencias(false);
  };

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
        () => {}
      );
    }
  };

  const manejarCambioPuntoMapa = (coords, direccion) => {
    setPuntoCoords([coords.lat, coords.lng]);
    setDireccionLugar(direccion || 'Punto en el mapa');
  };

  // Coordenadas calculadas de la sede seleccionada
  const sedeActual = sedesInstitucion.find((s) => s.name === sedeSeleccionada) || sedesInstitucion[0];
  const sedeDestinoActual = sedesInstitucion.find((s) => s.name === sedeDestinoSeleccionada) || sedesInstitucion[1] || sedesInstitucion[0];

  const coordsSedeActual = [sedeActual?.latitude || 7.1193, sedeActual?.longitude || -73.1042];
  const coordsSedeDestino = [sedeDestinoActual?.latitude || 7.0664, sedeDestinoActual?.longitude || -73.1037];

  // Configuración de origen/destino según sentido
  const { origenTexto, destinoTexto, trazadoRuta } = useMemo(() => {
    if (sentidoViaje === 'hacia_campus') {
      return {
        origenTexto: direccionLugar,
        destinoTexto: sedeSeleccionada,
        trazadoRuta: [puntoCoords, coordsSedeActual],
      };
    } else if (sentidoViaje === 'desde_campus') {
      return {
        origenTexto: sedeSeleccionada,
        destinoTexto: direccionLugar,
        trazadoRuta: [coordsSedeActual, puntoCoords],
      };
    } else {
      return {
        origenTexto: sedeSeleccionada,
        destinoTexto: sedeDestinoSeleccionada,
        trazadoRuta: [coordsSedeActual, coordsSedeDestino],
      };
    }
  }, [sentidoViaje, direccionLugar, sedeSeleccionada, sedeDestinoSeleccionada, puntoCoords, coordsSedeActual, coordsSedeDestino]);

  // Manejar publicación del trayecto
  const manejarPublicarTrayecto = (e) => {
    e.preventDefault();

    if (driverWalletBalance < 1500) {
      setModalSaldoInsuficiente(true);
      return;
    }

    const nuevoViaje = {
      id: `TRIP-${Date.now().toString().slice(-4)}`,
      direction: sentidoViaje,
      origin: origenTexto,
      destination: destinoTexto,
      meeting_point: (sentidoViaje === 'desde_campus' || sentidoViaje === 'entre_campus') ? puntoEncuentroCampus : null,
      departure_date: fechaSalida,
      departure_time: horaSalida,
      available_seats: cupos,
      fare_cop: parseInt(tarifa, 10),
      route_path: trazadoRuta,
      status: 'publicado',
      passengers: [],
    };

    publishDriverTrip(nuevoViaje);
  };

  // Si el conductor tiene un viaje activo en curso, renderiza la cabina de navegación GPS en vivo
  if (activeDriverTrip) {
    return <DriverLiveNavigationCockpit />;
  }

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. HERO CARD DEL CONDUCTOR: SENTIDO Y CORREDOR */}
      <section
        className={`rounded-3xl p-4 border shadow-sm space-y-3 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1.5 w-fit mb-1 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cabina del Conductor
            </span>
            <h2 className="text-base font-black">Publicar Nuevo Trayecto</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Comparte tu cupo y reduce costos de movilidad
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Pill Selector de 3 Sentidos */}
        <div className={`flex p-1 rounded-2xl border relative ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setSentidoViaje('hacia_campus')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
              sentidoViaje === 'hacia_campus'
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sentidoViaje === 'hacia_campus' && (
              <motion.div
                layoutId="driver-direction-pill"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Hacia Campus</span>
          </button>

          <button
            type="button"
            onClick={() => setSentidoViaje('desde_campus')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
              sentidoViaje === 'desde_campus'
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sentidoViaje === 'desde_campus' && (
              <motion.div
                layoutId="driver-direction-pill"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Desde Campus</span>
          </button>

          <button
            type="button"
            onClick={() => setSentidoViaje('entre_campus')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
              sentidoViaje === 'entre_campus'
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sentidoViaje === 'entre_campus' && (
              <motion.div
                layoutId="driver-direction-pill"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Entre Sedes</span>
          </button>
        </div>

        {/* Resumen del Corredor Origen -> Destino */}
        <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          {/* ORIGEN */}
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500 mt-1 shrink-0 ring-4 ring-lochmara-500/20" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Punto de Origen (Partida)
              </span>
              <p className="text-xs font-black truncate">
                {origenTexto}
              </p>
            </div>
          </div>

          <div className={`border-l-2 border-dashed h-3 ml-1.5 ${isDark ? 'border-slate-800' : 'border-slate-300'}`} />

          {/* DESTINO */}
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Punto de Destino (Llegada)
              </span>
              <p className="text-xs font-black truncate">
                {destinoTexto}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FORMULARIO MODULAR DEL CONDUCTOR */}
      <DriverRoutePublishForm
        sedesInstitucion={sedesInstitucion}
        sedeSeleccionada={sedeSeleccionada}
        setSedeSeleccionada={setSedeSeleccionada}
        sedeDestinoSeleccionada={sedeDestinoSeleccionada}
        setSedeDestinoSeleccionada={setSedeDestinoSeleccionada}
        puntoEncuentroCampus={puntoEncuentroCampus}
        setPuntoEncuentroCampus={setPuntoEncuentroCampus}
        sentidoViaje={sentidoViaje}
        direccionLugar={direccionLugar}
        busquedaTexto={busquedaTexto}
        setBusquedaTexto={setBusquedaTexto}
        sugerencias={sugerencias}
        mostrandoSugerencias={mostrandoSugerencias}
        cargandoGeocodificacion={cargandoGeocodificacion}
        seleccionarLugarSugerido={seleccionarLugarSugerido}
        usarUbicacionActual={usarUbicacionActual}
        setShowDriverMapModal={setShowDriverMapModal}
        buscadorRef={buscadorRef}
        fechaSalida={fechaSalida}
        setFechaSalida={setFechaSalida}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        horaSalida={horaSalida}
        setHoraSalida={setHoraSalida}
        cupos={cupos}
        setCupos={setCupos}
        tarifa={tarifa}
        setTarifa={setTarifa}
        manejarPublicarTrayecto={manejarPublicarTrayecto}
        isDark={isDark}
      />

      {/* 3. MODAL SELECTOR DE PUNTO EN MAPA */}
      <LocationPickerModal
        isOpen={showDriverMapModal}
        onClose={() => setShowDriverMapModal(false)}
        initialLocation={{ lat: puntoCoords[0], lng: puntoCoords[1] }}
        title="Selecciona el punto de tu trayecto"
        onConfirmLocation={(c, dir) => {
          manejarCambioPuntoMapa(c, dir);
          setShowDriverMapModal(false);
        }}
      />

      {/* 4. MODAL SALDO INSUFICIENTE */}
      <InsufficientBalanceModal
        isOpen={modalSaldoInsuficiente}
        onClose={() => setModalSaldoInsuficiente(false)}
      />
    </div>
  );
};
