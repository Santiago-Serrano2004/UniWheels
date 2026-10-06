import React, { useState, useEffect, useCallback } from 'react';
import { waitlistService, parseBackendError } from '../services/api';
import { ClipboardList, Download, Loader2, ShieldAlert } from 'lucide-react';

const ROLE_LABELS = { pasajero: 'Pasajero', conductor: 'Conductor', ambos: 'Ambos' };
const DIRECTION_LABELS = { hacia_campus: 'Hacia la universidad', desde_campus: 'Desde la universidad', ambas: 'Ambos sentidos' };

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';

const timeLabel = (slot) => `${slot.slice(0, 2)}:00 a ${slot.slice(3)}:00`;

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
  </div>
);

const TopTable = ({ title, rows, label }) => (
  <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
    <h2 className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
      {title}
    </h2>
    <table className="w-full text-left text-xs">
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.length === 0 ? (
          <tr><td className="py-3 px-4 text-slate-400">Sin inscritos todavía.</td></tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} className="text-slate-700 dark:text-slate-300">
              <td className="py-2.5 px-4 font-semibold capitalize">{label(r)}</td>
              <td className="py-2.5 px-4 text-right font-bold">{r.total}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </section>
);

const selectCls =
  'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300';

export const WaitlistPage = () => {
  const [filters, setFilters] = useState({ role: '', campus_id: '', direction: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await waitlistService.getWaitlist({ ...filters, page }));
    } catch (err) {
      setError(parseBackendError(err));
      setResult(null);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setFilter = (name) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [name]: e.target.value }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await waitlistService.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lista-espera-uniwheels-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(parseBackendError(err));
    }
    setExporting(false);
  };

  const totals = result?.totals;
  const entries = result?.data ?? [];
  const meta = result?.meta;
  // Las sedes del filtro salen de los totales por sede (las 10 con más inscritos).
  const campusOptions = (totals?.by_campus ?? []).filter((c) => c.campus_id);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-lochmara-600" />
            <span>Lista de espera</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inscritos antes del lanzamiento. Meta: 150 en 3 semanas, al menos 30 conductores en un mismo corredor.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading || exporting || !meta?.total}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-lochmara-600 hover:bg-lochmara-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {loading && !result ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
          <p className="text-xs font-semibold">Cargando lista de espera...</p>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total" value={totals.total} />
            <StatCard title="Conductores" value={totals.by_role.conductor} />
            <StatCard title="Pasajeros" value={totals.by_role.pasajero} />
            <StatCard title="Ambos" value={totals.by_role.ambos} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopTable title="Sedes con más inscritos" rows={totals.by_campus} label={(r) => r.campus_name} />
            <TopTable title="Barrios con más inscritos" rows={totals.by_neighborhood} label={(r) => r.neighborhood} />
            <TopTable title="Franjas con más inscritos" rows={[...totals.by_usual_time].sort((a, b) => b.total - a.total).slice(0, 10)} label={(r) => timeLabel(r.usual_time)} />
          </div>

          <div className="flex flex-wrap gap-3">
            <select aria-label="Filtrar por rol" value={filters.role} onChange={setFilter('role')} className={selectCls}>
              <option value="">Todos los roles</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select aria-label="Filtrar por sede" value={filters.campus_id} onChange={setFilter('campus_id')} className={selectCls}>
              <option value="">Todas las sedes</option>
              {campusOptions.map((c) => <option key={c.campus_id} value={c.campus_id}>{c.campus_name}</option>)}
            </select>
            <select aria-label="Filtrar por sentido" value={filters.direction} onChange={setFilter('direction')} className={selectCls}>
              <option value="">Ambos sentidos</option>
              {Object.entries(DIRECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Barrio</th>
                    <th className="py-3 px-4">Sede</th>
                    <th className="py-3 px-4">Franja</th>
                    <th className="py-3 px-4">Sentido</th>
                    <th className="py-3 px-4">Inscrito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 px-4 text-center text-slate-400">No hay inscritos con estos filtros.</td></tr>
                  ) : (
                    entries.map((e) => (
                      <tr key={e.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-3 px-4 font-semibold">{e.email}</td>
                        <td className="py-3 px-4">{ROLE_LABELS[e.role] ?? e.role}</td>
                        <td className="py-3 px-4">{e.neighborhood}</td>
                        <td className="py-3 px-4">{e.campus_name ?? '—'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{timeLabel(e.usual_time)}</td>
                        <td className="py-3 px-4">{DIRECTION_LABELS[e.direction] ?? e.direction}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDate(e.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>Página {meta.current_page} de {meta.last_page} ({meta.total} inscritos)</span>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer">Anterior</button>
                  <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer">Siguiente</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
