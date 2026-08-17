import React from 'react';
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
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PaymentMethodSelectorModal } from '../trips/PaymentMethodSelectorModal';

export const TripMapOverlayControls = ({
  isDark,
  isBooked,
  activePassengerBooking,
  setActiveTab,
  cancelPassengerBooking,
  selectedSearchRoute,
  clearSelectedSearchRoute,
  vehicleType,
  setVehicleType,
  quickPoints,
  pickupName,
  handleSelectPickup,
  isSimulatingGps,
  toggleGpsSimulation,
  activeFare,
  baseFare,
  detourFare,
  pickupMode,
  setPickupMode,
  matchingData,
  campusName,
  isTowardsCampus,
  showPaymentModal,
  setShowPaymentModal,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  manejarReserva,
  isLoadingEvaluation,
}) => {
  return (
    <>
      {/* Barra de Controles Superiores Flotantes */}
      <div className="absolute top-3 left-3 right-3 z-10 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Badge del Estado de la Ruta */}
          <div
            className={`px-3 py-1.5 rounded-full shadow-md backdrop-blur-md text-xs font-bold flex items-center gap-2 border ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-white shadow-black/40'
                : 'bg-white/95 border-slate-200/80 text-slate-800 shadow-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[200px]">
              {selectedSearchRoute
                ? `${selectedSearchRoute.origin} → ${selectedSearchRoute.destination}`
                : isTowardsCampus
                ? `Hacia ${campusName}`
                : `Desde ${campusName}`}
            </span>
          </div>

          {/* Toggle de Tipo de Vehículo */}
          <div
            className={`flex items-center p-0.5 rounded-full shadow-md backdrop-blur-md border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setVehicleType('car')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === 'car'
                  ? 'bg-lochmara-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Carro</span>
            </button>

            <button
              type="button"
              onClick={() => setVehicleType('motorcycle')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === 'motorcycle'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Moto</span>
            </button>
          </div>
        </div>

        {/* Barra de Acciones del Mapa: Puntos Rápidos + GPS */}
        <div className="flex items-center justify-between gap-2">
          {/* Puntos Rápidos de Abordaje */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                      : isDark
                      ? 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                      : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pt.name}
                </button>
              );
            })}
          </div>

          {/* Botón Simulación GPS Ultra Fluida */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleGpsSimulation}
              className={`px-2.5 py-1 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isSimulatingGps
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : isDark
                  ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSimulatingGps ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isSimulatingGps ? 'Pausar' : 'GPS en Vivo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Inferior Flotante */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative z-10 m-3 rounded-3xl p-4 border shadow-xl space-y-3 pointer-events-auto transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-2xl'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {isBooked ? (
          /* ESTADO: YA TIENE UN VIAJE RESERVADO */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tienes una solicitud activa</span>
              </div>

              <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                PIN: {activePassengerBooking.boardingPin || '4829'}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                className="py-2.5 px-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* ESTADO: DISPONIBLE PARA RESERVAR CON EVALUACIÓN DE IA O RUTA SELECCIONADA */
          <>
            {/* Si viene de una ruta seleccionada desde el menú, mostrar banner informativo */}
            {selectedSearchRoute && (
              <div
                className={`rounded-2xl p-2.5 flex items-center justify-between shadow-2xs border ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-lochmara-50 border-lochmara-200 text-lochmara-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-lochmara-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold truncate">
                    Ruta Solicitada: {selectedSearchRoute.origin} → {selectedSearchRoute.destination}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => clearSelectedSearchRoute()}
                  className="text-lochmara-500 hover:text-lochmara-400 text-xs font-extrabold px-1.5 py-0.5 rounded-md cursor-pointer shrink-0"
                  title="Cambiar ruta"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Cabecera del Conductor y Tarifa Dinámica */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl ${
                    vehicleType === 'motorcycle'
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                      : isDark
                      ? 'bg-lochmara-500/20 text-lochmara-300 border-lochmara-400/30'
                      : 'bg-lochmara-100 text-lochmara-800 border-lochmara-200'
                  } font-extrabold text-sm flex items-center justify-center border`}
                >
                  {selectedSearchRoute
                    ? selectedSearchRoute.driverName.charAt(0)
                    : vehicleType === 'motorcycle'
                    ? 'MS'
                    : 'CM'}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSearchRoute
                        ? selectedSearchRoute.driverName
                        : vehicleType === 'motorcycle'
                        ? 'Mateo Silva'
                        : 'Carlos Mendoza'}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {selectedSearchRoute
                      ? selectedSearchRoute.vehicle
                      : vehicleType === 'motorcycle'
                      ? 'Yamaha MT-03'
                      : 'Mazda 3'}{' '}
                    •{' '}
                    <span className="font-bold">
                      {selectedSearchRoute
                        ? selectedSearchRoute.plate
                        : vehicleType === 'motorcycle'
                        ? 'WTR-82F'
                        : 'KLU-492'}
                    </span>
                    <span className="text-slate-400">
                      {' '}
                      (
                      {selectedSearchRoute
                        ? `${selectedSearchRoute.availableSeats} cupos libres`
                        : vehicleType === 'motorcycle'
                        ? '1 cupo libre'
                        : '3 cupos libres'}
                      )
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${isDark ? 'text-lochmara-400' : 'text-lochmara-700'}`}>
                  $ {activeFare.toLocaleString('es-CO')}
                </span>
                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {pickupMode === 'on_route' ? 'Tarifa en ruta' : 'Incluye recargo por desvío'}
                </p>
              </div>
            </div>

            {/* Selector de Modalidad: Encontrar en la Ruta vs Solicitar Desvío */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-extrabold uppercase tracking-wider block px-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Modalidad de abordaje:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Opción 1: Encontrar en la Ruta */}
                <button
                  type="button"
                  onClick={() => setPickupMode('on_route')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    pickupMode === 'on_route'
                      ? isDark
                        ? 'border-lochmara-500 bg-slate-800 text-white ring-1 ring-lochmara-500/40'
                        : 'border-lochmara-500 bg-lochmara-50/80 text-lochmara-950 ring-1 ring-lochmara-400/40'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wide ${isDark ? 'text-lochmara-400' : 'text-lochmara-700'}`}>
                      En la Ruta
                    </span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      $ {baseFare.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Encuentras al conductor en su corredor oficial (0 min desvío).
                  </p>
                  {pickupMode === 'on_route' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-lochmara-500 animate-pulse" />
                  )}
                </button>

                {/* Opción 2: Solicitar Desvío (Validada con IA) */}
                <button
                  type="button"
                  disabled={selectedSearchRoute?.isEligibleForDetour === false}
                  onClick={() => setPickupMode('with_detour')}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative ${
                    selectedSearchRoute?.isEligibleForDetour === false
                      ? isDark
                        ? 'border-slate-800 bg-slate-950 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : pickupMode === 'with_detour'
                      ? isDark
                        ? 'border-amber-500 bg-slate-800 text-white ring-1 ring-amber-500/40 cursor-pointer'
                        : 'border-amber-500 bg-amber-50/80 text-amber-950 ring-1 ring-amber-400/40 cursor-pointer'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wide ${
                        selectedSearchRoute?.isEligibleForDetour === false
                          ? 'text-slate-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {selectedSearchRoute?.isEligibleForDetour === false
                        ? 'Desvío No Viable'
                        : 'Con Desvío IA'}
                    </span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSearchRoute?.isEligibleForDetour === false
                        ? 'N/A'
                        : `$ ${detourFare.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedSearchRoute?.isEligibleForDetour === false
                      ? 'Punto alejado del corredor de este conductor.'
                      : `El conductor se desvía hasta tu punto (+${matchingData.detour_minutes || 3.5} min).`}
                  </p>
                  {pickupMode === 'with_detour' && selectedSearchRoute?.isEligibleForDetour !== false && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Tarjeta de Desglose de Itinerario */}
            <div
              className={`rounded-2xl p-3 border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1.5 font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <MapPin className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                  <span className="truncate">
                    {pickupMode === 'on_route'
                      ? selectedSearchRoute
                        ? `${selectedSearchRoute.origin} (Corredor oficial)`
                        : `${pickupName} (En ruta)`
                      : `${pickupName} (Desvío solicitado)`}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    pickupMode === 'on_route'
                      ? isDark
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-emerald-100 text-emerald-800'
                      : isDark
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pickupMode === 'on_route' ? 'En Ruta (0 min)' : '+4.5 min desvío'}
                </span>
              </div>

              <div
                className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200/60 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Salida:{' '}
                  <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                    {selectedSearchRoute ? selectedSearchRoute.departureTime : '06:45 AM'}
                  </strong>{' '}
                  • Llegada:{' '}
                  <strong className="text-emerald-500">
                    {selectedSearchRoute
                      ? selectedSearchRoute.arrivalTime
                      : isTowardsCampus
                      ? '~ 07:15 AM'
                      : '~ 06:30 PM'}
                  </strong>
                </span>
                <span className={`truncate max-w-[140px] text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Destino:{' '}
                  <strong>
                    {selectedSearchRoute
                      ? selectedSearchRoute.destination
                      : isTowardsCampus
                      ? campusName
                      : 'Cañaveral / Florida'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div
              onClick={() => setShowPaymentModal(true)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedPaymentMethod === 'card_instant' ? (
                  <CreditCard className="w-4 h-4 text-lochmara-500" />
                ) : selectedPaymentMethod === 'wallet_balance' ? (
                  <Wallet className="w-4 h-4 text-emerald-500" />
                ) : selectedPaymentMethod === 'cash_direct' ? (
                  <Banknote className="w-4 h-4 text-amber-500" />
                ) : (
                  <Smartphone className="w-4 h-4 text-purple-500" />
                )}
                <span className="font-semibold">
                  {selectedPaymentMethod === 'card_instant'
                    ? 'Tarjeta (Cobro Inmediato)'
                    : selectedPaymentMethod === 'wallet_balance'
                    ? 'Billetera UniWheels (Saldo)'
                    : selectedPaymentMethod === 'cash_direct'
                    ? 'Efectivo Exacto'
                    : 'Nequi / Daviplata (Al llegar)'}
                </span>
              </div>

              <span className={`text-[11px] font-bold ${isDark ? 'text-lochmara-400 hover:text-lochmara-300' : 'text-lochmara-600 hover:text-lochmara-800'}`}>
                Cambiar
              </span>
            </div>

            {/* Botón de Acción de Reserva */}
            <button
              onClick={manejarReserva}
              disabled={isLoadingEvaluation}
              className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/30 disabled:opacity-50"
            >
              {vehicleType === 'motorcycle' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              <span>
                {isLoadingEvaluation
                  ? 'Calculando con IA...'
                  : `Confirmar Reserva • $ ${activeFare.toLocaleString('es-CO')}`}
              </span>
            </button>
          </>
        )}
      </motion.div>

      {/* Modal Selector de Método de Pago */}
      <PaymentMethodSelectorModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tripPrice={activeFare}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={(method) => setSelectedPaymentMethod(method)}
      />
    </>
  );
};
