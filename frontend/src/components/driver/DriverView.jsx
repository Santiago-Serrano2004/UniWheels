import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import { placesApiService, LUGARES_POPULARES_AMB } from '../../services/placesApiService';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { DriverLiveNavigationCockpit } from './DriverLiveNavigationCockpit';
import { LocationPickerModal } from '../map/LocationPickerModal';
import { DriverRoutePublishForm } from './DriverRoutePublishForm';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';

export const DriverView = () => {
  const {
    activeDriverTrip,
    publishDriverTrip,
    driverWalletBalance,
    setActiveTab,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';

  // 1. Sentido del Viaje
  const [sentidoViaje, setSentidoViaje] = useState('hacia_campus');

  // 2. Sedes Universitarias
  const [sedesInstitucion, setSedesInstitucion] = useState([
    { id: 1, name: 'Campus El Jardín', is_main_campus: true, latitude: 7.119346, longitude: -73.104278 },
    { id: 2, name: 'Campus El Bosque', is_main_campus: false, latitude: 7.066491, longitude: -73.103789 },
    { id: 3, name: 'CSU — Centro de Servicios Universitarios', is_main_campus: false, latitude: 7.113821, longitude: -73.106842 },
    { id: 4, name: 'Campus La Casona', is_main_campus: false, latitude: 7.118210, longitude: -73.116520 },
  ]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('Campus El Jardín');

  // 3. Punto Personalizado
  const [puntoCoords, setPuntoCoords] = useState([7.0678, -73.1066]);
  const [direccionLugar, setDireccionLugar] = useState('Centro Comercial Cañaveral, Floridablanca');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [cargandoGeocodificacion, setCargandoGeocodificacion] = useState(false);

  // 4. Parámetros
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
      if (res?.data?.[0]?.campuses && res.data[0].campuses.length > 0) {
        setSedesInstitucion(res.data[0].campuses);
        const sedePrincipal = res.data[0].campuses.find((c) => c.is_main_campus);
        if (sedePrincipal) setSedeSeleccionada(sedePrincipal.name);
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

  const campusObjActual = sedesInstitucion.find((s) => s.name === sedeSeleccionada);
  const coordsSedeActual =
    campusObjActual && campusObjActual.latitude && campusObjActual.longitude
      ? [campusObjActual.latitude, campusObjActual.longitude]
      : [7.119346, -73.104278];

  const manejarPublicarTrayecto = (e) => {
    e.preventDefault();
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20 shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Toggle de Sentido */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
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
                layoutId="direction-pill-driver"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Hacia el Campus</span>
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
                layoutId="direction-pill-driver"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Desde el Campus</span>
          </button>
        </div>

        {/* Visualización del Corredor Origen-Destino */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-lochmara-500 mt-1 shrink-0 ring-4 ring-lochmara-500/20" />
            <div className="min-w-0">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Punto de Origen
              </label>
              <p className="text-xs font-black truncate">
                {sentidoViaje === 'hacia_campus' ? direccionLugar : sedeSeleccionada}
              </p>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-3 ml-1.5 my-0.5" />

          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
            <div className="min-w-0">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Punto de Destino
              </label>
              <p className="text-xs font-black truncate">
                {sentidoViaje === 'hacia_campus' ? sedeSeleccionada : direccionLugar}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FORMULARIO MODULAR DE PUBLICACIÓN */}
      <DriverRoutePublishForm
        sedesInstitucion={sedesInstitucion}
        sedeSeleccionada={sedeSeleccionada}
        setSedeSeleccionada={setSedeSeleccionada}
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

      {/* MODAL DE MAPA PARA AJUSTAR PUNTO */}
      <LocationPickerModal
        isOpen={showDriverMapModal}
        onClose={() => setShowDriverMapModal(false)}
        initialLocation={{ lat: puntoCoords[0], lng: puntoCoords[1] }}
        title={sentidoViaje === 'hacia_campus' ? 'Selecciona tu Punto de Origen' : 'Selecciona tu Punto de Destino'}
        onConfirmLocation={(coords, address) => {
          setPuntoCoords([coords.lat, coords.lng]);
          setDireccionLugar(address || 'Punto Seleccionado en Mapa');
          setShowDriverMapModal(false);
        }}
      />

      {/* MODAL DE SALDO INSUFICIENTE */}
      <InsufficientBalanceModal
        isOpen={modalSaldoInsuficiente}
        onClose={() => setModalSaldoInsuficiente(false)}
        saldoActual={driverWalletBalance}
        onRecargar={() => {
          setModalSaldoInsuficiente(false);
          setActiveTab('wallet');
        }}
      />
    </div>
  );
};
