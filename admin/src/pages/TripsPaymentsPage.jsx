import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminTripService, userLookupService } from '../services/api';
import { formatCOP, formatDate, formatDateTime } from '../utils/formatters';
import {
  Car,
  CreditCard,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Receipt,
  User,
  MapPin,
  Navigation,
  ShieldCheck,
  Wallet,
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

const PAYMENT_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'APPROVED', label: 'Aprobados (APPROVED)' },
  { value: 'DECLINED', label: 'Rechazados (DECLINED)' },
  { value: 'ERROR', label: 'Con error (ERROR)' },
  { value: 'PENDING', label: 'Pendientes (PENDING)' },
];

export const TripsPaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = searchParams.get('tab') || 'viajes'; // 'viajes' | 'pagos'
  const paymentsSubTab = searchParams.get('subtab') || 'viajes'; // 'viajes' | 'recargas'

  const currentStatus = searchParams.get('status') || 'todos';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Estados de datos
  const [trips, setTrips] = useState([]);
  const [tripPayments, setTripPayments] = useState([]);
  const [topupPayments, setTopupPayments] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState({
    total_collected_cop: 0,
    platform_commission_cop: 0,
    pending_commission_cop: 0,
  });

  const [topupUsersMap, setTopupUsersMap] = useState({});
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
      if (mainTab === 'viajes') {
        const res = await adminTripService.getTrips({
          status: currentStatus,
          from: currentFrom,
          to: currentTo,
          page: currentPage,
          per_page: 15,
        });
        setTrips(res?.data || []);
        setMeta(res?.meta || { current_page: 1, last_page: 1, total: (res?.data || []).length, per_page: 15 });
      } else if (mainTab === 'pagos' && paymentsSubTab === 'viajes') {
        const res = await adminTripService.getTripPayments({
          status: currentStatus,
          from: currentFrom,
          to: currentTo,
          page: currentPage,
          per_page: 15,
        });
        setTripPayments(res?.data || []);
        setPaymentsSummary(res?.summary || {
          total_collected_cop: 0,
          platform_commission_cop: 0,
          pending_commission_cop: 0,
        });
        setMeta(res?.meta || { current_page: 1, last_page: 1, total: (res?.data || []).length, per_page: 15 });
      } else if (mainTab === 'pagos' && paymentsSubTab === 'recargas') {
        const res = await adminTripService.getTopupPayments({
          status: currentStatus,
          from: currentFrom,
          to: currentTo,
          page: currentPage,
          per_page: 15,
        });
        const items = res?.data || [];
        setTopupPayments(items);
        setMeta(res?.meta || { current_page: 1, last_page: 1, total: items.length, per_page: 15 });

        // Lookup de usuarios de las recargas
        const userIds = items.map((t) => t.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const users = await userLookupService.lookupUsers(userIds);
          setTopupUsersMap((prev) => ({ ...prev, ...users }));
        }
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los datos de viajes y pagos.');
    } finally {
      setLoading(false);
    }
  }, [mainTab, paymentsSubTab, currentStatus, currentFrom, currentTo, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMainTabChange = (tab) => {
    const newParams = new URLSearchParams();
    newParams.set('tab', tab);
    if (tab === 'pagos') {
      newParams.set('subtab', paymentsSubTab);
    }
    newParams.set('status', 'todos');
    newParams.set('page', '1');
    setSearchParams(newParams);
    setFromDateInput('');
    setToDateInput('');
  };

  const handlePaymentsSubTabChange = (subtab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subtab', subtab);
    newParams.set('status', 'todos');
    newParams.set('page', '1');
    setSearchParams(newParams);
    setFromDateInput('');
    setToDateInput('');
  };

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
            <CreditCard className="w-6 h-6 text-lochmara-600" />
            <span>Auditoría de Viajes y Conciliación de Pagos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta histórica de viajes realizados, eventos de pago de pasajes vía Wompi y recargas de saldo.
          </p>
        </div>
      </div>

      {/* Pestañas Principales (Viajes vs Pagos) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => handleMainTabChange('viajes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'viajes'
              ? 'bg-lochmara-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Historial de Viajes</span>
        </button>

        <button
          type="button"
          onClick={() => handleMainTabChange('pagos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'pagos'
              ? 'bg-lochmara-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gestión de Pagos</span>
        </button>
      </div>

      {/* Sub-pestañas si estamos en Pagos */}
      {mainTab === 'pagos' && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => handlePaymentsSubTabChange('viajes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              paymentsSubTab === 'viajes'
                ? 'bg-white dark:bg-slate-900 text-lochmara-600 dark:text-lochmara-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pagos de Viajes
          </button>
          <button
            type="button"
            onClick={() => handlePaymentsSubTabChange('recargas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              paymentsSubTab === 'recargas'
                ? 'bg-white dark:bg-slate-900 text-lochmara-600 dark:text-lochmara-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Recargas de Billetera
          </button>
        </div>
      )}

      {/* Totales del Período (Solo en Pagos de Viajes) */}
      {mainTab === 'pagos' && paymentsSubTab === 'viajes' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Total Recaudado en Viajes</span>
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCOP(paymentsSummary.total_collected_cop)}
            </p>
            <p className="text-[11px] text-slate-400">Tarifa bruta de viajes completados</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-lochmara-500" />
              <span>Comisión de la Plataforma</span>
            </span>
            <p className="text-2xl font-black text-lochmara-600 dark:text-lochmara-400">
              {formatCOP(paymentsSummary.platform_commission_cop)}
            </p>
            <p className="text-[11px] text-slate-400">Margen operativo recaudado</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Comisiones Pendientes</span>
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCOP(paymentsSummary.pending_commission_cop)}
            </p>
            <p className="text-[11px] text-slate-400">Pendiente de débito en billetera</p>
          </div>
        </div>
      )}

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
              {(mainTab === 'viajes' ? TRIP_STATUS_OPTIONS : PAYMENT_STATUS_OPTIONS).map((opt) => (
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
      ) : mainTab === 'viajes' ? (
        /* TAB 1: TABLA DE VIAJES */
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Conductor & Vehículo</th>
                      <th className="py-3 px-4">Pasajero</th>
                      <th className="py-3 px-4">Ruta (Origen / Destino)</th>
                      <th className="py-3 px-4">Tarifa (COP)</th>
                      <th className="py-3 px-4">Comisión</th>
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
                            {formatCOP(t.total_fare_cop)}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Conductor: {formatCOP(t.driver_amount_cop)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-lochmara-600 dark:text-lochmara-400">
                            {formatCOP(t.platform_commission_cop)}
                          </p>
                          <span className="text-[10px] text-slate-400 block capitalize">
                            {t.commission_status?.replace('_', ' ') || '—'}
                          </span>
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
      ) : paymentsSubTab === 'viajes' ? (
        /* TAB 2A: PAGOS DE VIAJES (Wompi TP-) */
        tripPayments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se registran eventos de pago de viajes
            </p>
            <p className="text-xs text-slate-400">
              No hay transacciones registradas con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Fecha Evento</th>
                      <th className="py-3 px-4">Referencia / Wompi ID</th>
                      <th className="py-3 px-4">Monto (COP)</th>
                      <th className="py-3 px-4">Viaje Asociado</th>
                      <th className="py-3 px-4">Firma & Proceso</th>
                      <th className="py-3 px-4 text-right">Estado Wompi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tripPayments.map((p) => {
                      const trip = p.trip;
                      const isApproved = p.status === 'APPROVED';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatDateTime(p.created_at)}
                            </p>
                            <span className="text-[10px] text-slate-400">{p.event_type}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{p.reference}</p>
                            <span className="text-[10px] text-slate-500">{p.transaction_id || '—'}</span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-black text-slate-900 dark:text-white">
                              {formatCOP(p.amount_cop)}
                            </p>
                            <span className="text-[10px] text-slate-400">{p.currency}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {trip ? (
                              <div className="space-y-0.5 text-[11px]">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {trip.driver_name} · <span className="font-mono">{trip.vehicle_plate}</span>
                                </p>
                                <p className="text-slate-500">Pasajero: {trip.passenger_name}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sin viaje asociado</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {p.signature_valid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Firma válida
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Firma inválida
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isApproved
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* TAB 2B: RECARGAS DE BILLETERA (Wompi WR-) */
        topupPayments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
            <Wallet className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se registran recargas de billetera
            </p>
            <p className="text-xs text-slate-400">
              No hay recargas de saldo registradas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Referencia / Transacción</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Monto Recargado (COP)</th>
                      <th className="py-3 px-4">Impacto en Billetera</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topupPayments.map((topup) => {
                      const user = topupUsersMap[topup.user_id];
                      const tx = topup.transaction;
                      const isApproved = topup.status === 'APPROVED';

                      return (
                        <tr
                          key={topup.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatDateTime(topup.created_at)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{topup.reference}</p>
                            <span className="text-[10px] text-slate-500">{topup.transaction_id || '—'}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {user?.name || (topup.user_id ? `ID: ${topup.user_id.slice(0, 8)}...` : 'Usuario')}
                            </p>
                            {user?.email && <p className="text-[11px] text-slate-500">{user.email}</p>}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-black text-slate-900 dark:text-white">
                              {formatCOP(topup.amount_cop)}
                            </p>
                            <span className="text-[10px] text-slate-400">{topup.currency}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {tx ? (
                              <div className="text-[11px] space-y-0.5">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {formatCOP(tx.balance_before_cop)} → <strong className="text-emerald-600">{formatCOP(tx.balance_after_cop)}</strong>
                                </span>
                                <p className="text-slate-400 text-[10px]">{tx.notes || 'Recarga aprobada'}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sin tx de billetera</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isApproved
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {topup.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
