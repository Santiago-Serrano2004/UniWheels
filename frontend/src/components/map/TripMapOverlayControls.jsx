import React, { useState } from 'react';
import {
  Car,
  Bike,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  Clock,
  Square,
  Play,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
  Star,
  Navigation,
  KeyRound,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMethodSelectorModal } from '../trips/PaymentMethodSelectorModal';
import { CancelTripModal } from '../trips/CancelTripModal';

export const TripMapOverlayControls = ({
  isDark,
  isBooked,
  activePassengerBooking,
  setActiveTab,
  cancelPassengerBooking,
  startPassengerTrip,
  selectedSearchRoute,
  clearSelectedSearchRoute,
  vehicleType,
  setVehicleType,
  quickPoints,
  pickupName,
  handleSelectPickup,
  isSimulatingGps,
  toggleGpsSimulation,
  activeFare = 4500,
  baseFare = 4500,
  detourFare = 5800,
  pickupMode = 'on_route',
  setPickupMode = () => {},
  matchingData = {},
  campusName = 'Campus El Jardín',
  isTowardsCampus = true,
  showPaymentModal = false,
  setShowPaymentModal = () => {},
  selectedPaymentMethod = 'nequi_direct',
  setSelectedPaymentMethod = () => {},
  manejarReserva = () => {},
  isLoadingEvaluation = false,
  isCardExpanded,
  setIsCardExpanded,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const expanded = typeof isCardExpanded === 'boolean' ? isCardExpanded : internalExpanded;

  const toggleExpanded = (val) => {
    if (typeof setIsCardExpanded === 'function') {
      setIsCardExpanded(typeof val === 'boolean' ? val : (prev) => !prev);
    } else {
      setInternalExpanded((prev) => (typeof val === 'boolean' ? val : !prev));
    }
  };

  const driverName = selectedSearchRoute?.driverName || (vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza');
  const vehicleName = selectedSearchRoute?.vehicle || (vehicleType === 'motorcycle' ? 'Yamaha MT-03' : 'Mazda 3');
  const plateNumber = selectedSearchRoute?.plate || (vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492');
  const availableSeats = selectedSearchRoute?.availableSeats || (vehicleType === 'motorcycle' ? 1 : 3);
  const ratingValue = selectedSearchRoute?.rating || '4.9';
  const originText = selectedSearchRoute?.origin || (isTowardsCampus ? 'Punto de Encuentro' : campusName);
  const destinationText = selectedSearchRoute?.destination || (isTowardsCampus ? campusName : 'Destino Final');
  const departureTime = selectedSearchRoute?.departureTime || '06:45 AM';
  const arrivalTime = selectedSearchRoute?.arrivalTime || (isTowardsCampus ? '07:15 AM' : '06:30 PM');

  return (
    <>
      {/* 1. CONTROLES SUPERIORES FLOTANTES (MINIMALISTAS) */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
        {/* Botón Volver al listado de inicio */}
        <button
          type="button"
          onClick={() => {
            if (clearSelectedSearchRoute) clearSelectedSearchRoute();
            setActiveTab('home');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-lg backdrop-blur-md text-xs font-bold transition-all cursor-pointer border ${
            isDark
              ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-white'
              : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-lochmara-500" />
          <span>Inicio</span>
        </button>

        {/* Controles de Simulación GPS y Tipo de Vehículo */}
        <div className="flex items-center gap-2">
          {/* Botón GPS en Vivo — solo es una previsualización de demostración antes de
              reservar; en un viaje ya reservado la posición es real y no se controla a mano. */}
          {!isBooked && (
            <button
              type="button"
              onClick={toggleGpsSimulation}
              className={`px-3 py-2 rounded-2xl shadow-lg backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isSimulatingGps
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : isDark
                  ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSimulatingGps ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="text-[11px]">{isSimulatingGps ? 'Pausar' : 'GPS'}</span>
            </button>
          )}

          {/* Badge del Vehículo */}
          <div
            className={`px-3 py-2 rounded-2xl shadow-lg backdrop-blur-md text-xs font-black flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            {vehicleType === 'motorcycle' ? (
              <Bike className="w-4 h-4 text-amber-500" />
            ) : (
              <Car className="w-4 h-4 text-lochmara-500" />
            )}
            <span className="uppercase text-[10px] tracking-wider">{vehicleType === 'motorcycle' ? 'Moto' : 'Carro'}</span>
          </div>
        </div>
      </div>

      {/* 2. TARJETA INFORMATIVA DEL VIAJE (PARTE INFERIOR DE LA PANTALLA) */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className={`absolute bottom-3 left-3 right-3 z-30 rounded-3xl p-4 border shadow-2xl space-y-3 pointer-events-auto transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-xl'
            : 'bg-white/98 border-slate-200 text-slate-900 backdrop-blur-xl'
        }`}
      >
        {isBooked ? (() => {
          const isStarted = activePassengerBooking?.status === 'in_progress' || Boolean(activePassengerBooking?.isStarted);
          const bookedDriverName = activePassengerBooking?.driverName || 'Carlos Mendoza';
          const bookedVehicle = activePassengerBooking?.vehicle || 'Mazda 3 (Rojo)';
          const bookedPlate = activePassengerBooking?.plate || 'KLU-492';
          const bookedPickup = activePassengerBooking?.pickup || activePassengerBooking?.origin || 'Parque San Pío';
          const bookedDestination = activePassengerBooking?.destination || campusName;
          const bookedPin = activePassengerBooking?.boardingPin || '4829';
          const bookedDeparture = activePassengerBooking?.departureTime || '06:45 AM';

          const pickupEtaMinutes = 4;
          const destinationEtaMinutes = 12;
          const progressPercent = isStarted ? 58 : 20;

          return (
            <div className="space-y-3">
              {/* 1. CABECERA: ESTADO EN VIVO Y ETA */}
              <div className="flex items-center justify-between">
                <div>
                  {isStarted ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-black shadow-2xs">
                      <Navigation className="w-3.5 h-3.5 fill-current" />
                      <span>A Bordo • Viaje en Curso</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lochmara-500/15 border border-lochmara-400/40 text-lochmara-700 dark:text-lochmara-300 text-[11px] font-black shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/40" />
                      <span>Conductor en Camino</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-950 dark:text-white">
                    {isStarted ? `~${destinationEtaMinutes} min restantes` : `Llega en ~${pickupEtaMinutes} min`}
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {isStarted ? `Rumbo a ${bookedDestination}` : `Hacia tu punto de recogida`}
                  </p>
                </div>
              </div>

              {/* 2. TARJETA DEL CONDUCTOR Y VEHÍCULO */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/25 flex items-center justify-center text-lochmara-600 font-black text-sm shrink-0 shadow-2xs">
                    {bookedDriverName.split(' ').map((n) => n[0]).join('') || 'CM'}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {bookedDriverName}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {bookedVehicle} • <strong className="font-mono text-slate-300 dark:text-slate-200">{bookedPlate}</strong>
                    </p>
                  </div>
                </div>

                {/* PIN de Abordaje cuando aún no ha iniciado el viaje */}
                {!isStarted && (
                  <div className="text-right shrink-0">
                    <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1 border-2 shadow-xs ${
                      isDark
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-amber-100/90 border-amber-400 text-amber-950 font-black'
                    }`}>
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-mono font-black tracking-wider">
                        {bookedPin}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. BARRA DE PROGRESO CON VEHÍCULO DESLIZANTE */}
              <div className="space-y-1.5 py-0.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-lochmara-500" />
                    {isStarted ? `Destino: ${bookedDestination}` : `Punto de recogida: ${bookedPickup}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isStarted ? `Llegada ~${destinationEtaMinutes} min` : `Salida: ${bookedDeparture}`}
                  </span>
                </div>

                <div className="relative w-full h-5 flex items-center">
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <motion.div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStarted
                          ? 'bg-gradient-to-r from-lochmara-500 to-emerald-400'
                          : 'bg-lochmara-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Carrito / Vehículo deslizante sobre la barra */}
                  <motion.div
                    className="absolute -top-0.5 -translate-x-1/2 flex items-center justify-center p-1 rounded-full bg-white dark:bg-slate-900 border-2 border-lochmara-500 shadow-md z-10"
                    style={{ left: `${Math.max(5, Math.min(95, progressPercent))}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {bookedVehicle.toLowerCase().includes('moto') || bookedVehicle.toLowerCase().includes('yamaha') ? (
                      <Bike className="w-3 h-3 text-amber-500" />
                    ) : (
                      <Car className="w-3 h-3 text-lochmara-600 dark:text-lochmara-400" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* 4. BOTONES DE ACCIÓN */}
              <div className="pt-1">
                {!isStarted ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Cancelar Reserva
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="flex-1 py-2.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-lochmara-600/25 cursor-pointer border border-lochmara-500"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Ver Mis Viajes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          /* ESTADO: VISUALIZACIÓN DE POSIBLE RUTA CON EXPANDIBLE DINÁMICO */
          <div className="space-y-3">
            {/* Handle táctil / Indicador de expansión al tocar */}
            <button
              type="button"
              onClick={() => toggleExpanded()}
              className="w-full flex items-center justify-center py-0.5 cursor-pointer -mt-1"
            >
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </button>

            {/* CABECERA: CONDUCTOR + VEHÍCULO + PRECIO SIN DESVÍO */}
            <div
              onClick={() => toggleExpanded()}
              className="flex items-center justify-between cursor-pointer"
            >
              {/* Conductor y Vehículo */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 flex items-center justify-center text-lochmara-500 font-black text-sm shrink-0 overflow-hidden shadow-2xs">
                  {selectedSearchRoute?.driver_avatar ? (
                    <img src={selectedSearchRoute.driver_avatar} alt={driverName} className="w-full h-full object-cover" />
                  ) : (
                    driverName.split(' ').map((n) => n[0]).join('') || 'CM'
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {driverName}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md shrink-0">
                      {ratingValue} ★
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">
                    {vehicleName} • <strong className="font-mono text-slate-300">{plateNumber}</strong> • <span className="text-emerald-500 font-bold">{availableSeats} cupos</span>
                  </p>
                </div>
              </div>

              {/* Precio Sin Desvío */}
              <div className="text-right shrink-0 pl-2">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  $ {baseFare.toLocaleString('es-CO')}
                </span>
                <p className="text-[9px] text-slate-400 font-bold">
                  Aporte por cupo
                </p>
              </div>
            </div>

            {/* ELEMENTO CARACTERÍSTICO: CORREDOR VISUAL DE PUNTO X A PUNTO Y */}
            <div
              onClick={() => toggleExpanded()}
              className={`p-3 rounded-2xl border space-y-2 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Origen */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500 ring-4 ring-lochmara-500/20 shrink-0" />
                  <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                    {originText}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                  Salida {departureTime}
                </span>
              </div>

              {/* Línea conectora */}
              <div className="ml-1 my-0.5 w-0.5 h-3 border-l-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center pl-3">
                <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                  Ruta directa universitaria
                </span>
              </div>

              {/* Destino */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0" />
                  <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                    {destinationText}
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-500 shrink-0">
                  Llegada ~{arrivalTime}
                </span>
              </div>
            </div>

            {/* SECCIÓN EXPANDIBLE CON DETALLES Y OPCIONES DE RESERVA */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3 overflow-hidden pt-1"
                >
                  {/* Selector de Modalidad: En la Ruta vs Con Desvío */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-0.5 flex items-center gap-1.5">
                      <span>Modalidad de Abordaje:</span>
                      {isLoadingEvaluation && (
                        <span className="inline-flex items-center gap-1 normal-case font-semibold text-lochmara-500">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-lochmara-500 border-t-transparent animate-spin" />
                          Calculando mejor opción...
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Opción 1: En Ruta */}
                      <button
                        type="button"
                        onClick={() => setPickupMode('on_route')}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          pickupMode === 'on_route'
                            ? 'bg-lochmara-500/10 border-lochmara-500 ring-1 ring-lochmara-500/30'
                            : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black uppercase text-lochmara-600 dark:text-lochmara-400">
                            En Ruta
                          </span>
                          <span className="text-xs font-black text-emerald-500">
                            $ {baseFare.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          En el corredor del conductor (0 min).
                        </p>
                      </button>

                      {/* Opción 2: Con Desvío (Validada por IA) */}
                      <button
                        type="button"
                        disabled={selectedSearchRoute?.isEligibleForDetour === false || matchingData?.is_viable === false}
                        onClick={() => setPickupMode('with_detour')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          selectedSearchRoute?.isEligibleForDetour === false || matchingData?.is_viable === false
                            ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/50'
                            : pickupMode === 'with_detour'
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/30 cursor-pointer'
                            : isDark ? 'bg-slate-950 border-slate-800 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black uppercase text-amber-500">
                            Recogida
                          </span>
                          <span className="text-xs font-black text-emerald-500">
                            {selectedSearchRoute?.isEligibleForDetour === false || matchingData?.is_viable === false
                              ? 'N/A'
                              : `$ ${detourFare.toLocaleString('es-CO')}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {selectedSearchRoute?.isEligibleForDetour === false || matchingData?.is_viable === false
                            ? 'No viable por distancia al corredor'
                            : `Recogida en tu ubicación (+${matchingData?.detour_minutes || 3.5} min)`}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Estado del Tráfico en Vivo (TomTom vía ai-route-service) */}
                  {matchingData?.traffic_status && (
                    <div
                      className={`px-2.5 py-1.5 rounded-2xl border flex items-center gap-2 text-[10px] font-bold ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Radio className={`w-3 h-3 shrink-0 ${matchingData?.ai_powered ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="truncate">{matchingData.traffic_status}</span>
                    </div>
                  )}

                  {/* Punto de Encuentro Inteligente: distancia e instrucciones a pie */}
                  {pickupMode === 'on_route' && matchingData?.walking_distance_meters > 0 && (
                    <div
                      className={`p-2.5 rounded-2xl border flex items-start gap-2 ${
                        isDark ? 'bg-lochmara-500/10 border-lochmara-500/30' : 'bg-lochmara-50 border-lochmara-200'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-lochmara-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-lochmara-600 dark:text-lochmara-400">
                          Camina {Math.round(matchingData.walking_distance_meters)} m
                          {matchingData.walking_time_minutes
                            ? ` (${Math.round(matchingData.walking_time_minutes)} min)`
                            : ''}{' '}
                          hasta el punto de encuentro
                        </p>
                        {matchingData.walking_instructions && (
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            {matchingData.walking_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selector Rápido de Método de Pago */}
                  <div
                    onClick={() => setShowPaymentModal(true)}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 hover:bg-slate-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-bold">
                          {selectedPaymentMethod === 'nequi_direct' ? 'Nequi Directo' : selectedPaymentMethod === 'cash' ? 'Efectivo al abordar' : 'Tarjeta Débito/Crédito'}
                        </p>
                        <p className="text-[10px] text-slate-400">Método de pago seleccionado</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-lochmara-500 hover:underline">
                      Cambiar
                    </span>
                  </div>

                  {/* Botón de Confirmación */}
                  <button
                    type="button"
                    onClick={manejarReserva}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Reserva (${activeFare.toLocaleString('es-CO')} COP)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOTÓN RÁPIDO EN MODO COLAPSADO */}
            {!expanded && (
              <button
                type="button"
                onClick={() => toggleExpanded(true)}
                className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-lochmara-600/30 cursor-pointer"
              >
                <span>Ver Opciones y Reservar</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* MODAL SELECTOR DE MÉTODO DE PAGO */}
      <PaymentMethodSelectorModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={(method) => {
          setSelectedPaymentMethod(method);
          setShowPaymentModal(false);
        }}
        fareAmount={activeFare}
      />

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN Y REEMBOLSO */}
      <CancelTripModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          if (cancelPassengerBooking) {
            cancelPassengerBooking();
          }
          setShowCancelModal(false);
        }}
        tripInfo={{
          driverName: activePassengerBooking?.driverName || 'Carlos Mendoza',
          vehicle: activePassengerBooking?.vehicle || 'Mazda 3 (Rojo)',
          plate: activePassengerBooking?.plate || 'KLU-492',
          etaMinutes: 4,
          fare: activePassengerBooking?.fare || activeFare || 4500,
          paymentMethod: activePassengerBooking?.paymentMethod || selectedPaymentMethod || 'nequi_direct',
        }}
      />
    </>
  );
};
