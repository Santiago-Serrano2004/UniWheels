import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminTripService } from '../services/api';
import { formatCOP, formatDateTime } from '../utils/formatters';
import {
  Car,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Info,
} from 'lucide-react';

const TRIP_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'completado', label: 'Completados' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'esperando_pasajero', label: 'Esperando pasajero' },
  { value: 'en_camino_a_recoger', label: 'En camino' },
  { value: 'programado', label: 'Programados' },
  { value: 'cancelado_conductor', label: 'Cancelado Conductor' },
  { value: 'cancelado_pasajero', label: 'Cancelado Pasajero' },
  { value: 'no_show_pasajero', label: 'No show' },
];

export const TripsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'todos';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Estados de datos
  const [trips, setTrips] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros locales para fechas
  const [fromDateInput, setFromDateInput] = useState(currentFrom);
  const [toDateInput, setToDateInput] = useState(currentTo);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminTripService.getTrips({
        status: currentStatus,
        from: currentFrom,
        to: currentTo,
        page: currentPage,
        per_page: 15,
      });
      setTrips(res?.data || []);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total: (res?.data || []).length, per_page: 15 });
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los datos de viajes.');
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentFrom, currentTo, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (status) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('status', status);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleApplyDates = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (fromDateInput) newParams.set('from', fromDateInput);
    else newParams.delete('from');

    if (toDateInput) newParams.set('to', toDateInput);
    else newParams.delete('to');

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearDates = () => {
    setFromDateInput('');
    setToDateInput('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('from');
    newParams.delete('to');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Car className="w-6 h-6 text-lochmara-600" />
            <span>Viajes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta histórica de viajes realizados en la plataforma.
          </p>
        </div>
      </div>

      {/* Barra de Filtros (Estado y Fechas) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <form onSubmit={handleApplyDates} className="flex flex-wrap items-center gap-4 text-xs">
          {/* Filtro de Estado */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Estado:</span>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="font-semibold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lochmara-500"
            >
              {TRIP_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Desde:</span>
            <input
              type="date"
              value={fromDateInput}
              onChange={(e) => setFromDateInput(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Hasta:</span>
            <input
              type="date"
              value={toDateInput}
              onChange={(e) => setToDateInput(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-700 text-white font-bold transition-colors cursor-pointer"
            >
              Filtrar
            </button>
            {(currentFrom || currentTo) && (
              <button
                type="button"
                onClick={handleClearDates}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
          <p className="text-xs font-semibold">Cargando registros...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        trips.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
            <Car className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se encontraron viajes registrados
            </p>
            <p className="text-xs text-slate-400">
              Ajusta los filtros de fecha o estado para ampliar el rango de búsqueda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Los aportes se pagan directamente entre usuarios; UniWheels no procesa pagos.</span>
            </p>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Conductor & Vehículo</th>
                      <th className="py-3 px-4">Pasajero</th>
                      <th className="py-3 px-4">Ruta (Origen / Destino)</th>
                      <th className="py-3 px-4">Aporte acordado</th>
                      <th className="py-3 px-4 text-center">PIN</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {trips.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatDateTime(t.created_at)}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.id.slice(0, 8)}...
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {t.driver_name || `ID: ${t.driver_id?.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-mono font-bold text-[10px] uppercase">
                              {t.vehicle_plate || '—'}
                            </span>
                            <span className="text-[11px] text-slate-500">{t.vehicle_model}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.passenger_name || `ID: ${t.passenger_id?.slice(0, 8)}`}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-0.5 text-[11px]">
                            <p className="text-slate-700 dark:text-slate-300 truncate" title={t.pickup_address}>
                              <strong className="text-slate-400">Origen:</strong> {t.pickup_address}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 truncate" title={t.dropoff_address}>
                              <strong className="text-slate-400">Destino:</strong> {t.dropoff_address}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-black text-slate-900 dark:text-white">
                            {Number(t.total_fare_cop) === 0 ? 'Gratis' : formatCOP(t.total_fare_cop)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {t.is_pin_verified ? (
                            <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" title="PIN Verificado">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800" title="Sin verificación de PIN">
                              <Clock className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* Paginación */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Página {meta.current_page} de {meta.last_page} ({meta.total} registros)
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
  );
};
