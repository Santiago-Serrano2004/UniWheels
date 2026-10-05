import React, { useState, useEffect, useCallback } from 'react';
import { pilotService, parseBackendError } from '../services/api';
import {
  PILOT_THRESHOLDS,
  mergeWeeklyMetrics,
  isOnTarget,
  buildPilotCsv,
  downloadCsv,
} from '../utils/pilotMetrics';
import { Activity, Download, Loader2, ShieldAlert, Info } from 'lucide-react';

// 'YYYY-MM-DD' como fecha local: new Date('2026-10-05') se lee en UTC y mostraría el día anterior.
const formatDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
};

const dash = (value, suffix = '') => (value === null || value === undefined ? '—' : `${value}${suffix}`);
const pctText = (value) => (value === null || value === undefined ? '—' : `${value.toFixed(1)} %`);

const MetricCard = ({ title, value, display, threshold, thresholdText, note }) => {
  const onTarget = isOnTarget(value, threshold);
  const badge =
    onTarget === null
      ? { text: 'Sin datos', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
      : onTarget
      ? { text: 'En meta', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
      : { text: 'Bajo el umbral', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{display}</p>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400">Umbral: {thresholdText}</span>
        <span className={`px-2 py-0.5 rounded-full font-bold ${badge.cls}`}>{badge.text}</span>
      </div>
      {note && <p className="text-[11px] text-slate-400">{note}</p>}
    </div>
  );
};

export const PilotPage = () => {
  const [rows, setRows] = useState([]);
  const [partial, setPartial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [trip, matching] = await Promise.allSettled([
      pilotService.getTripMetrics(12),
      pilotService.getMatchingMetrics(12),
    ]);

    if (trip.status === 'rejected') {
      // Sin trip-service no hay semanas que mostrar.
      setError(parseBackendError(trip.reason));
      setRows([]);
    } else {
      const merged = mergeWeeklyMetrics(trip.value, matching.status === 'fulfilled' ? matching.value : null);
      setRows(merged.rows);
      setPartial(merged.partial);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const current = rows[rows.length - 1];
  const history = [...rows].reverse();

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`piloto-uniwheels-${today}.csv`, buildPilotCsv(history));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-lochmara-600" />
            <span>Piloto</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas semanales agregadas (semanas de lunes a domingo, hora de Colombia).
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-lochmara-600 hover:bg-lochmara-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {partial && !loading && !error && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Algunos datos están incompletos: una de las fuentes no respondió. Las cifras afectadas pueden verse bajas o vacías.
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
          <p className="text-xs font-semibold">Cargando métricas...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {current && (
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Semana actual (desde el {formatDate(current.week_start)})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Usuarios activos"
                  value={current.weekly_active_users}
                  display={dash(current.weekly_active_users)}
                  threshold={PILOT_THRESHOLDS.activeUsers}
                  thresholdText={`mínimo ${PILOT_THRESHOLDS.activeUsers}`}
                />
                <MetricCard
                  title="Conductores que publican"
                  value={current.publishing_drivers}
                  display={dash(current.publishing_drivers)}
                  threshold={PILOT_THRESHOLDS.publishingDrivers}
                  thresholdText={`mínimo ${PILOT_THRESHOLDS.publishingDrivers}`}
                />
                <MetricCard
                  title="Búsquedas con resultado"
                  value={current.hit_rate_pct}
                  display={pctText(current.hit_rate_pct)}
                  threshold={PILOT_THRESHOLDS.hitRatePct}
                  thresholdText={`mínimo ${PILOT_THRESHOLDS.hitRatePct} %`}
                />
                <MetricCard
                  title="Repetición a 14 días"
                  value={current.repeat_14d_pct}
                  display={pctText(current.repeat_14d_pct)}
                  threshold={PILOT_THRESHOLDS.repeat14dPct}
                  thresholdText={`mínimo ${PILOT_THRESHOLDS.repeat14dPct} %`}
                  note={current.repeat_14d_immature ? 'Cohorte en curso: la ventana de 14 días aún no cierra.' : null}
                />
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-3 px-4">Semana</th>
                    <th className="py-3 px-4">Usuarios activos</th>
                    <th className="py-3 px-4">Conductores que publican</th>
                    <th className="py-3 px-4">Búsquedas</th>
                    <th className="py-3 px-4">% con resultado</th>
                    <th className="py-3 px-4">Viajes completados</th>
                    <th className="py-3 px-4">Cancelaciones tardías</th>
                    <th className="py-3 px-4">Repetición a 14 días</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((r) => (
                    <tr key={r.week_start} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 px-4 font-semibold whitespace-nowrap">{formatDate(r.week_start)}</td>
                      <td className="py-3 px-4">{dash(r.weekly_active_users)}</td>
                      <td className="py-3 px-4">{dash(r.publishing_drivers)}</td>
                      <td className="py-3 px-4">{dash(r.searches)}</td>
                      <td className="py-3 px-4">{pctText(r.hit_rate_pct)}</td>
                      <td className="py-3 px-4">{dash(r.completed_trips)}</td>
                      <td className="py-3 px-4">{dash(r.late_cancellations)}</td>
                      <td className="py-3 px-4">
                        {pctText(r.repeat_14d_pct)}
                        {r.repeat_14d_cohort > 0 && (
                          <span className="text-slate-400"> (n={r.repeat_14d_cohort})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
