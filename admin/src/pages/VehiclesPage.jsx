import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { vehicleService, userLookupService } from '../services/api';
import { formatDate } from '../utils/formatters';
import {
  Car,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  ShieldAlert,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pendiente_revision', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'documento_vencido', label: 'Doc. Vencido' },
  { value: 'inactivo', label: 'Inactivos' },
  { value: 'todos', label: 'Todos' },
];

export const getStatusBadge = (status) => {
  switch (status) {
    case 'aprobado':
      return {
        label: 'Aprobado',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      };
    case 'rechazado':
      return {
        label: 'Rechazado',
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: XCircle,
      };
    case 'documento_vencido':
      return {
        label: 'Doc. Vencido',
        className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
        icon: AlertTriangle,
      };
    case 'inactivo':
      return {
        label: 'Inactivo',
        className: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30',
        icon: Clock,
      };
    case 'pendiente_revision':
    default:
      return {
        label: 'Pendiente de Revisión',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Clock,
      };
  }
};

export const VehiclesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'pendiente_revision';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [vehicles, setVehicles] = useState([]);
  const [ownersMap, setOwnersMap] = useState({});
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleService.getVehicles({
        status: currentStatus,
        search: currentSearch,
        page: currentPage,
        per_page: 15,
      });

      const items = res?.data || [];
      setVehicles(items);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total: items.length, per_page: 15 });

      // Cargar nombres de los dueños
      const userIds = items.map((v) => v.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const users = await userLookupService.lookupUsers(userIds);
        setOwnersMap((prev) => ({ ...prev, ...users }));
      }
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la lista de vehículos.');
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentSearch, currentPage]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleStatusChange = (status) => {
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Car className="w-6 h-6 text-lochmara-600" />
            <span>Revisión y Gestión de Vehículos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verificación de documentos legales para habilitación de conductores en la plataforma.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por placa o modelo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lochmara-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-lochmara-600 hover:bg-lochmara-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Pestañas de Estado */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-lochmara-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
          <p className="text-xs font-semibold">Cargando vehículos...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchVehicles}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
          <Car className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No se encontraron vehículos
          </p>
          <p className="text-xs text-slate-400">
            {currentSearch
              ? `No hay resultados para la búsqueda "${currentSearch}".`
              : `No hay vehículos con el estado "${STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => {
              const badge = getStatusBadge(v.status);
              const BadgeIcon = badge.icon;
              const owner = ownersMap[v.user_id];
              const docsSummary = v.documents_summary || { total: 0, verified: 0, pending: 0, rejected: 0 };

              return (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-lochmara-300 dark:hover:border-lochmara-700 transition-all"
                >
                  <div className="space-y-3">
                    {/* Top: Placa y Estado */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-mono font-black text-xs tracking-wider uppercase border border-slate-700 dark:border-amber-300">
                          {v.plate_number}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {v.vehicle_type}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Modelo y Datos */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {v.brand} {v.model_line}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {v.year} · {v.color} · {v.available_seats} puestos
                      </p>
                    </div>

                    {/* Dueño */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Conductor Propietario
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {owner?.name || `Usuario (${v.user_id.slice(0, 8)}...)`}
                      </p>
                      {owner?.email && (
                        <p className="text-[11px] text-slate-500 truncate">{owner.email}</p>
                      )}
                    </div>

                    {/* Resumen de Documentos */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Documentos</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {docsSummary.verified}/{docsSummary.total} verificados
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {docsSummary.pending > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {docsSummary.pending} pendientes
                          </span>
                        )}
                        {docsSummary.rejected > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {docsSummary.rejected} rechazados
                          </span>
                        )}
                        {v.legal_compliance?.requires_rtm && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Requiere RTM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Detalle */}
                  <Link
                    to={`/vehiculos/${v.id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-lochmara-50 hover:bg-lochmara-100 dark:bg-lochmara-950/40 dark:hover:bg-lochmara-900/60 text-lochmara-600 dark:text-lochmara-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-lochmara-200 dark:border-lochmara-800/50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Revisar Documentación</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Página {meta.current_page} de {meta.last_page} ({meta.total} vehículos)
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
