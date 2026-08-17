import React, { useState, useEffect, useRef } from 'react';
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

  // 5. Parámetros
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
        () => alert('No se pudo obtener tu ubicación actual.')
      );
    }
  };

  const campusOrigenObj = sedesInstitucion.find((s) => s.name === sedeSeleccionada);
  const coordsSedeOrigen =
    campusOrigenObj && campusOrigenObj.latitude && campusOrigenObj.longitude
      ? [campusOrigenObj.latitude, campusOrigenObj.longitude]
      : [7.119346, -73.104278];

  const campusDestinoObj = sedesInstitucion.find((s) => s.name === sedeDestinoSeleccionada);
  const coordsSedeDestino =
    campusDestinoObj && campusDestinoObj.latitude && campusDestinoObj.longitude
      ? [campusDestinoObj.latitude, campusDestinoObj.longitude]
      : [7.066491, -73.103789];

  const manejarPublicarTrayecto = (e) => {
    e.preventDefault();
    if (driverWalletBalance < 2000) {
      setModalSaldoInsuficiente(true);
      return;
    }

    let origenTexto = direccionLugar;
    let destinoTexto = sedeSeleccionada;
    let coordsOrigen = puntoCoords;
    let coordsDestino = coordsSedeOrigen;

    if (sentidoViaje === 'desde_campus') {
      origenTexto = sedeSeleccionada;
      destinoTexto = direccionLugar;
      coordsOrigen = coordsSedeOrigen;
      coordsDestino = puntoCoords;
    } else if (sentidoViaje === 'entre_campus') {
      origenTexto = sedeSeleccionada;
      destinoTexto = sedeDestinoSeleccionada;
      coordsOrigen = coordsSedeOrigen;
      coordsDestino = coordsSedeDestino;
    }

    publishDriverTrip({
      direction: sentidoViaje,
      campus: sedeSeleccionada,
      destinationCampus: sentidoViaje === 'entre_campus' ? sedeDestinoSeleccionada : null,
      meetingPoint: (sentidoViaje === 'desde_campus' || sentidoViaje === 'entre_campus') ? puntoEncuentroCampus : null,
      origin: origenTexto,
      destination: destinoTexto,
      originCoords: coordsOrigen,
      destinationCoords: coordsDestino,
      departureTime: horaSalida,
      seats: Number(cupos),
      fare: `$ ${Number(tarifa).toLocaleString('es-CO')}`,
      fare_cop: Number(tarifa),
    });
  };

  if (activeDriverTrip) {
    return <DriverLiveNavigationCockpit activeTrip={activeDriverTrip} />;
  }

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. HERO CARD CON TOGGLE DE SENTIDO Y CORREDOR ORIGEN-DESTINO */}
      <section
        className={`rounded-3xl p-5 border shadow-sm space-y-4 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Cabina del Conductor
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Publicar Nuevo Trayecto</h2>
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
                {sentidoViaje === 'hacia_campus' ? direccionLugar : sedeSeleccionada}
              </p>
              {(sentidoViaje === 'desde_campus' || sentidoViaje === 'entre_campus') && (
                <p className="text-[10px] text-lochmara-600 dark:text-lochmara-400 font-bold truncate mt-0.5">
                  Punto de Encuentro: {puntoEncuentroCampus}
                </p>
              )}
            </div>
          </div>

          <div className={`border-l-2 border-dashed h-3 ml-1 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} />

          {/* DESTINO */}
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Punto de Destino (Llegada)
              </span>
              <p className="text-xs font-black truncate">
                {sentidoViaje === 'hacia_campus'
                  ? sedeSeleccionada
                  : sentidoViaje === 'desde_campus'
                  ? direccionLugar
                  : sedeDestinoSeleccionada}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FORMULARIO PRINCIPAL */}
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
        horaSalida={horaSalida}
        setHoraSalida={setHoraSalida}
        cupos={cupos}
        setCupos={setCupos}
        tarifa={tarifa}
        setTarifa={setTarifa}
        manejarPublicarTrayecto={manejarPublicarTrayecto}
        isDark={isDark}
      />

      {/* 3. MODAL DE AJUSTE EN MAPA */}
      <LocationPickerModal
        isOpen={showDriverMapModal}
        onClose={() => setShowDriverMapModal(false)}
        initialLocation={{ lat: puntoCoords[0], lng: puntoCoords[1] }}
        title={sentidoViaje === 'hacia_campus' ? 'Selecciona tu Punto de Salida' : 'Selecciona tu Punto de Llegada'}
        onConfirmLocation={(coords, address) => {
          setPuntoCoords([coords.lat, coords.lng]);
          setDireccionLugar(address || 'Ubicación seleccionada en el mapa');
          setShowDriverMapModal(false);
        }}
      />

      {/* 4. MODAL DE SALDO INSUFICIENTE */}
      <InsufficientBalanceModal
        isOpen={modalSaldoInsuficiente}
        onClose={() => setModalSaldoInsuficiente(false)}
        balance={driverWalletBalance}
      />
    </div>
  );
};
