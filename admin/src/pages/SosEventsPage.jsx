import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sosService, userLookupService } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { AdminMiniMap } from '../components/map/AdminMiniMap';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Car,
  User,
  Navigation,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const SosEventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'pending';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [events, setEvents] = useState([]);
  const [adminsMap, setAdminsMap] = useState({});
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Estado para modal/caja de atención
  const [attendingId, setAttendingId] = useState(null);
  const [attentionNotes, setAttentionNotes] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendError, setAttendError] = useState('');

  const fetchEvents = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const res = await sosService.getSosEvents({
        status: currentStatus,
        page: currentPage,
        per_page: 15,
      });

      const items = res?.data || [];
      setEvents(items);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total: items.length, per_page: 15 });

      // Lookup de administradores que atendieron eventos
      const adminIds = items.map((e) => e.attended_by_user_id).filter(Boolean);
      if (adminIds.length > 0) {
        const users = await userLookupService.lookupUsers(adminIds);
        setAdminsMap((prev) => ({ ...prev, ...users }));
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las alertas SOS.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStatus, currentPage]);

  // Carga inicial y cambio de filtros
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Polling cada 30 segundos mientras la vista está abierta
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleStatusFilterChange = (status) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('status', status);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleOpenAttendBox = (eventId) => {
    setAttendingId(eventId);
    setAttentionNotes('');
    setAttendError('');
  };

  const handleConfirmAttend = async (eventId) => {
    setSavingAttendance(true);
    setAttendError('');

    try {
      const res = await sosService.attendSosEvent(eventId, attentionNotes.trim());
      const updated = res?.data;

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...updated, is_attended: true } : e))
      );
      setAttendingId(null);
      setAttentionNotes('');
    } catch (err) {
      setAttendError(err?.message || 'Error al registrar la atención de la alerta.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const pendingCount = currentStatus === 'pending' ? meta.total : events.filter((e) => !e.is_attended).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto pb-16">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Alertas SOS de Emergencia</span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                    {pendingCount} pendientes
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoreo en tiempo real de activaciones de botón de pánico en viajes. Consulta activa cada 30s.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchEvents(false)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-lochmara-600' : ''}`} />
          <span>Actualizar ahora</span>
        </button>
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => handleStatusFilterChange('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            currentStatus === 'pending'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Pendientes</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('attended')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            currentStatus === 'attended'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Atendidas</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentStatus === 'todos'
              ? 'bg-lochmara-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <p className="text-xs font-semibold">Cargando eventos SOS...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={() => fetchEvents(false)}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No hay alertas SOS en esta sección
          </p>
          <p className="text-xs text-slate-400">
            {currentStatus === 'pending'
              ? 'Excelente: no existen alertas de emergencia pendientes de atención.'
              : 'No se encontraron eventos SOS registrados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const isPending = !event.is_attended;
            const trip = event.trip;
            const isAttendingThis = attendingId === event.id;
            const adminAttendant = adminsMap[event.attended_by_user_id];
            const mapsUrl = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;

            return (
              <div
                key={event.id}
                className={`rounded-3xl border transition-all p-5 sm:p-6 space-y-5 ${
                  isPending
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-400 dark:border-rose-700/80 shadow-md ring-1 ring-rose-400/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                {/* Header de la Tarjeta SOS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-rose-600 text-white font-black text-xs uppercase flex items-center gap-1.5 shadow-2xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{event.emergency_type || 'EMERGENCIA SOS'}</span>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Activada el {formatDateTime(event.triggered_at)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        ID Alerta: {event.id}
                      </p>
                    </div>
                  </div>

                  {/* Estado de Atención */}
                  <div>
                    {event.is_attended ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Atendida el {formatDateTime(event.attended_at)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse shadow-2xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>PENDIENTE DE ATENCIÓN</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid: Datos del Viaje + Mapa */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna Izquierda: Información del Viaje */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-lochmara-600" />
                        <span>Detalles del Viaje</span>
                      </h4>

                      {trip ? (
                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-mono font-bold text-xs uppercase">
                                {trip.vehicle_plate || 'SIN PLACA'}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {trip.vehicle_model || 'Vehículo'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                              Estado: {trip.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Conductor
                              </span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {trip.driver_name || `ID: ${trip.driver_id?.slice(0, 8)}...`}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Pasajero
                              </span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {trip.passenger_name || `ID: ${trip.passenger_id?.slice(0, 8)}...`}
                              </p>
                            </div>
                          </div>

                          {/* Ruta del viaje */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 dark:text-slate-300">
                                <strong className="font-semibold">Recogida:</strong> {trip.pickup_address || 'No registrada'}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Navigation className="w-3.5 h-3.5 text-lochmara-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 dark:text-slate-300">
                                <strong className="font-semibold">Destino:</strong> {trip.dropoff_address || 'No registrado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Información del viaje no asociada o eliminada (Trip ID: {event.trip_id}).
                        </p>
                      )}
                    </div>

                    {/* Notas de Atención si ya fue atendida */}
                    {event.is_attended && (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Atendido por: {adminAttendant?.name || 'Administrador de Bienestar'}</span>
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                          {event.attention_notes || 'Sin notas adicionales de seguimiento.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Columna Derecha: Mapa de Ubicación */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span>Ubicación GPS al momento de la alerta</span>
                      </span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-bold text-lochmara-600 dark:text-lochmara-400 hover:underline"
                      >
                        <span>Abrir en Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <AdminMiniMap
                      latitude={event.latitude}
                      longitude={event.longitude}
                      label={`Alerta SOS: ${trip?.vehicle_plate || 'Viaje'}`}
                      isAttended={event.is_attended}
                    />

                    <p className="text-[11px] text-slate-400 font-mono text-right">
                      Lat: {event.latitude}, Lng: {event.longitude}
                    </p>
                  </div>
                </div>

                {/* Acciones de Atención */}
                {!event.is_attended && (
                  <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50 space-y-3">
                    {attendError && isAttendingThis && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{attendError}</p>
                    )}

                    {!isAttendingThis ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAttendBox(event.id)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Marcar como Atendida</span>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-3">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Notas de atención y seguimiento (opcional):
                        </label>
                        <textarea
                          value={attentionNotes}
                          onChange={(e) => setAttentionNotes(e.target.value)}
                          placeholder="Ej: Se contactó al conductor vía telefónica; se confirmó falsa alarma o se dio aviso a seguridad del campus."
                          rows={2}
                          className="w-full p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmAttend(event.id)}
                            disabled={savingAttendance}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {savingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Confirmar Atención</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendingId(null)}
                            disabled={savingAttendance}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Paginación */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Página {meta.current_page} de {meta.last_page} ({meta.total} alertas)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
