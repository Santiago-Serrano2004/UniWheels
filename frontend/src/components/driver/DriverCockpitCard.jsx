import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService, tripLifecycleService, routesService } from '../../services/api';
import { getPlaceCoordinates } from '../../hooks/useOsrmRoute';
import { CancelTripPenaltyModal } from './CancelTripPenaltyModal';
import {
  Car,
  Users,
  AlertTriangle,
  ChevronRight,
  History,
  Navigation,
  Sparkles,
} from 'lucide-react';

export const DriverCockpitCard = () => {
  const {
    activeDriverTrip,
    cancelDriverTrip,
    driverWalletBalance,
    currentRoutePassengerTrips,
    setCurrentRoutePassengerTrips,
    setActiveTab,
    theme,
  } = useAppStore();

  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [ordenOptimizado, setOrdenOptimizado] = useState(false);
  const isDark = theme === 'dark';

  const refrescarPasajeros = useCallback(async () => {
    if (!activeDriverTrip?.id) {
      setCurrentRoutePassengerTrips([]);
      return;
    }
    const trips = await tripsService.getActiveTripsForRoute(activeDriverTrip.id);

    // Con 2+ pasajeros activos, se pide a ai-route-service (ALNS) el orden óptimo
    // de recogida en vez de mostrarlos en orden de llegada de la reserva.
    if (trips.length >= 2) {
      const candidatos = trips.map((t) => {
        const [lat, lng] = getPlaceCoordinates(t.pickup_address, false);
        return { id: t.id, name: t.passenger_name, pickup_address: t.pickup_address, pickup_lat: lat, pickup_lng: lng };
      });

      const optimizacion = await routesService.optimizePassengers(activeDriverTrip.id, candidatos);
      const stops = optimizacion?.data?.ordered_stops;
      if (optimizacion?.ai_powered && Array.isArray(stops) && stops.length > 0) {
        const idsEnOrden = stops.map((s) => s.user_id || s.id).filter(Boolean);
        const porId = Object.fromEntries(trips.map((t) => [t.id, t]));
        const ordenados = idsEnOrden.map((id) => porId[id]).filter(Boolean);
        // Completar con cualquier trip que no haya venido en la respuesta (defensivo).
        const faltantes = trips.filter((t) => !idsEnOrden.includes(t.id));
        setCurrentRoutePassengerTrips([...ordenados, ...faltantes]);
        setOrdenOptimizado(true);
        return;
      }
    }

    setOrdenOptimizado(false);
    setCurrentRoutePassengerTrips(trips);
  }, [activeDriverTrip?.id, setCurrentRoutePassengerTrips]);

  useEffect(() => {
    refrescarPasajeros();
  }, [refrescarPasajeros]);

  if (!activeDriverTrip) {
    return (
      <div className="space-y-4 pb-6 select-none">
        <div
          className={`rounded-3xl p-5 border space-y-3 text-center transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-lg'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-lochmara-400'
                : 'bg-lochmara-50 border-lochmara-200 text-lochmara-600'
            }`}
          >
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No tienes un viaje publicado
            </h3>
            <p className={`text-xs max-w-xs mx-auto mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Publica tu trayecto diario hacia o desde la universidad para compartir gastos con tu comunidad.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('driver')}
            className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all shadow-md shadow-lochmara-600/20 cursor-pointer"
          >
            Publicar Nuevo Trayecto
          </button>
        </div>

        {/* Acceso Rápido al Historial */}
        <button
          onClick={() => setActiveTab('history')}
          className={`w-full p-4 rounded-3xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-white shadow-md'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${
                isDark
                  ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                  : 'bg-lochmara-50 text-lochmara-600 border-lochmara-200'
              }`}
            >
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Historial de Conducción
              </p>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Consulta tus viajes completados y califica a tus pasajeros
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    );
  }

  const pasajeros = currentRoutePassengerTrips;
  const cuposTotales = activeDriverTrip.available_seats || activeDriverTrip.availableSeats || 3;
  const cuposDisponibles = Math.max(0, cuposTotales - pasajeros.length);

  // Cancela cada trip activo asociado a la ruta y luego cierra la ruta publicada.
  const manejarCancelarPublicacion = async (aplicarPenalizacion) => {
    setCancelando(true);
    await Promise.all(
      pasajeros.map((t) =>
        tripLifecycleService
          .cancelTrip(t.id, 'conductor', 'Publicación cancelada por el conductor.')
          .catch(() => {})
      )
    );
    setCancelando(false);
    cancelDriverTrip(aplicarPenalizacion, 3000);
  };

  return (
    <div className="space-y-4">
      {/* 1. TARJETA PRINCIPAL DEL VIAJE ACTIVO */}
      <section
        className={`rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4 border transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Viaje Activo Publicado</span>
          </div>

          <span className={`text-xs font-mono font-bold ${isDark ? 'text-lochmara-300' : 'text-lochmara-600'}`}>
            {activeDriverTrip.departureTime || '06:45 AM'}
          </span>
        </div>

        {/* Resumen de Ruta */}
        <div
          className={`space-y-2 rounded-2xl p-3.5 border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-lochmara-400 mt-1 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block">Punto de Origen</span>
              <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDriverTrip.origin}
              </p>
            </div>
          </div>

          <div className={`h-4 border-l-2 border-dashed ml-1.5 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} />

          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block">Punto de Destino</span>
              <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDriverTrip.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas: Cupos y Tarifa */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            className={`rounded-2xl p-3 border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className={`text-[10px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cupos Disponibles
            </span>
            <p className={`text-sm font-extrabold ${isDark ? 'text-lochmara-300' : 'text-lochmara-600'}`}>
              {cuposDisponibles} de {cuposTotales} libres
            </p>
          </div>

          <div
            className={`rounded-2xl p-3 border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className={`text-[10px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Aporte por Asiento
            </span>
            <p className="text-sm font-extrabold text-emerald-500">
              $ {Number(activeDriverTrip.price || 4500).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. LISTA DE PASAJEROS ASIGNADOS AL VIAJE */}
      <section
        className={`rounded-3xl p-4 border space-y-3 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-lg'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-lochmara-400'
                  : 'bg-lochmara-50 border-lochmara-200 text-lochmara-600'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Estudiantes Confirmados
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {pasajeros.length} de {cuposTotales} cupos ocupados
              </p>
            </div>
          </div>

          {ordenOptimizado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Orden de recogida optimizado</span>
            </span>
          )}
        </div>

        {pasajeros.length === 0 ? (
          <div
            className={`p-4 rounded-2xl border text-center text-xs space-y-1 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-400'
                : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}
          >
            <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Esperando reservas de tu corredor...
            </p>
            <p className="text-[11px]">Los estudiantes verán tu ruta y podrán solicitar cupos.</p>
          </div>
        ) : (
          <div className={`space-y-2 divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {pasajeros.map((p, idx) => (
              <div key={p.id || idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-[10px] border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {(p.passenger_name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {p.passenger_name || 'Pasajero'}
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.pickup_address}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {p.is_pin_verified ? 'A bordo' : 'Confirmado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. IR A LA CABINA DE NAVEGACIÓN */}
      <button
        type="button"
        onClick={() => setActiveTab('driver')}
        className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
      >
        <Navigation className="w-4 h-4" />
        <span>Ir a la Cabina de Navegación</span>
      </button>

      {/* 4. BOTÓN DE CANCELAR VIAJE CON VALIDACIÓN DE PENALIZACIÓN */}
      <button
        type="button"
        onClick={() => setModalCancelarAbierto(true)}
        disabled={cancelando}
        className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
      >
        <AlertTriangle className="w-4 h-4 text-rose-500" />
        <span>{cancelando ? 'Cancelando...' : 'Cancelar Publicación de Viaje'}</span>
      </button>

      {/* MODAL DE PENALIZACIÓN SI HAY PASAJEROS */}
      <CancelTripPenaltyModal
        isOpen={modalCancelarAbierto}
        onClose={() => setModalCancelarAbierto(false)}
        onConfirmCancel={manejarCancelarPublicacion}
        passengersCount={pasajeros.length}
        currentBalance={driverWalletBalance}
        penaltyAmount={3000}
      />
    </div>
  );
};
