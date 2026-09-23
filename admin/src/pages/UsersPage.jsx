import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminUserService, vehicleService } from '../services/api';
import { formatCOP, formatDate, formatDateTime } from '../utils/formatters';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Car,
  User,
  CreditCard,
  Star,
  Building2,
  GraduationCap,
  History,
  X,
  Lock,
  Unlock,
  Eye,
  Shield,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'todos', label: 'Todos los roles' },
  { value: 'estudiante', label: 'Estudiantes' },
  { value: 'docente', label: 'Docentes' },
  { value: 'administrativo', label: 'Administrativos' },
  { value: 'administrador', label: 'Administradores' },
];

const ACTIVE_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'true', label: 'Solo Activos' },
  { value: 'false', label: 'Solo Suspendidos' },
];

export const UsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const currentRole = searchParams.get('role') || 'todos';
  const currentActive = searchParams.get('active') || 'todos';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado del usuario seleccionado para ver detalle
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Estado del modal de suspensión/reactivación
  const [suspensionModal, setSuspensionModal] = useState({
    isOpen: false,
    user: null,
    action: 'suspend', // 'suspend' | 'reactivate'
    reason: '',
    error: '',
    processing: false,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminUserService.getUsers({
        search: currentSearch,
        role: currentRole,
        active: currentActive === 'todos' ? '' : currentActive,
        page: currentPage,
        per_page: 15,
      });

      setUsers(res?.data || []);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total: (res?.data || []).length, per_page: 15 });
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, [currentSearch, currentRole, currentActive, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cargar detalle del usuario
  const handleOpenDetail = async (userId) => {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setDetailError('');
    setSelectedUserDetail(null);
    setUserVehicles([]);

    try {
      const data = await adminUserService.getUserById(userId);
      setSelectedUserDetail(data);

      // Intentar cargar vehículos del usuario
      try {
        const vehRes = await vehicleService.getVehicles({ search: userId, per_page: 10 });
        setUserVehicles(vehRes?.data || []);
      } catch {
        // Omitir si no se puede
      }
    } catch (err) {
      setDetailError(err?.message || 'No se pudo cargar el detalle del usuario.');
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'todos') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  // Abrir modal de suspensión o reactivación
  const handleOpenSuspensionModal = (user, action) => {
    setSuspensionModal({
      isOpen: true,
      user,
      action,
      reason: '',
      error: '',
      processing: false,
    });
  };

  const handleConfirmSuspension = async () => {
    const { user, action, reason } = suspensionModal;
    if (action === 'suspend' && !reason.trim()) {
      setSuspensionModal((prev) => ({
        ...prev,
        error: 'El motivo de la suspensión es obligatorio.',
      }));
      return;
    }

    setSuspensionModal((prev) => ({ ...prev, processing: true, error: '' }));

    try {
      const isSuspending = action === 'suspend';
      const res = await adminUserService.updateSuspension(user.id, {
        suspended: isSuspending,
        reason: reason.trim(),
      });

      const updatedActive = !isSuspending;

      // Actualizar en lista
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: updatedActive } : u))
      );

      // Actualizar en detalle si está abierto
      if (selectedUserDetail && selectedUserDetail.id === user.id) {
        setSelectedUserDetail((prev) => ({
          ...prev,
          is_active: updatedActive,
          suspension_logs: [
            {
              id: `temp-${Date.now()}`,
              action: isSuspending ? 'suspended' : 'reactivated',
              reason: isSuspending ? reason.trim() : null,
              admin_name: 'Bienestar Universitario',
              created_at: new Date().toISOString(),
            },
            ...(prev.suspension_logs || []),
          ],
        }));
      }

      setSuspensionModal({ isOpen: false, user: null, action: 'suspend', reason: '', error: '', processing: false });
    } catch (err) {
      setSuspensionModal((prev) => ({
        ...prev,
        processing: false,
        error: err?.message || 'Error al actualizar el estado de suspensión.',
      }));
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-lochmara-600" />
            <span>Gestión y Control de Usuarios</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta de perfiles universitarios, reputación, saldo de billetera y aplicación de suspensiones.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, correo o código..."
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

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Rol:</span>
          <select
            value={currentRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lochmara-500"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Estado:</span>
          <select
            value={currentActive}
            onChange={(e) => handleFilterChange('active', e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lochmara-500"
          >
            {ACTIVE_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
          <p className="text-xs font-semibold">Cargando directorio de usuarios...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No se encontraron usuarios
          </p>
          <p className="text-xs text-slate-400">
            Intenta cambiar los parámetros de búsqueda o los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Código / Rol</th>
                    <th className="py-3 px-4">Perfil</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Registro</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const roles = Array.isArray(u.roles) ? u.roles : [u.role || 'estudiante'];
                    const isAdmin = roles.includes('administrador');

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                              {u.student_code || '—'}
                            </span>
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                {u.role || roles[0]}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_driver ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lochmara-50 dark:bg-lochmara-950/40 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-200 dark:border-lochmara-800">
                              <Car className="w-3 h-3" />
                              <span>Conductor</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              <User className="w-3 h-3" />
                              <span>Pasajero</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Suspendido</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(u.created_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(u.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Ver expediente completo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {!isAdmin && (
                              u.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspensionModal(u, 'suspend')}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                                >
                                  Suspender
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspensionModal(u, 'reactivate')}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50 transition-colors cursor-pointer"
                                >
                                  Reactivar
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Página {meta.current_page} de {meta.last_page} ({meta.total} usuarios)
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

      {/* Modal / Drawer de Detalle de Usuario */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-lochmara-50 dark:bg-lochmara-950/60 text-lochmara-600 dark:text-lochmara-400">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Expediente de Usuario
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
                <p className="text-xs font-semibold">Cargando expediente...</p>
              </div>
            ) : detailError || !selectedUserDetail ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold text-center">
                {detailError || 'Error al obtener la información.'}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Perfil básico */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-lochmara-600 text-white font-black text-base flex items-center justify-center shrink-0">
                      {selectedUserDetail.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedUserDetail.name}
                      </h3>
                      <p className="text-xs text-slate-500">{selectedUserDetail.email}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {selectedUserDetail.id_document_type}: {selectedUserDetail.id_document_number || '—'} · Tel: {selectedUserDetail.phone_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {selectedUserDetail.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Suspendido</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grilla: Académico & Billetera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Datos Académicos */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-lochmara-600" />
                      <span>Perfil Académico</span>
                    </h4>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedUserDetail.institution?.name || 'UNAB'}
                    </p>
                    <p className="text-slate-500">
                      Campus: {selectedUserDetail.campus?.name || 'Principal'}
                    </p>
                    <p className="text-slate-500">
                      Programa: {selectedUserDetail.academic_profile?.academic_program_or_department || '—'}
                    </p>
                    <p className="text-slate-500">
                      Código: {selectedUserDetail.academic_profile?.student_code || '—'} · Semestre: {selectedUserDetail.academic_profile?.semester || '—'}
                    </p>
                  </div>

                  {/* Billetera */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-lochmara-600" />
                      <span>Billetera Digital</span>
                    </h4>
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo disponible</span>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {formatCOP(selectedUserDetail.wallet?.balance_cop ?? 0)}
                      </p>
                    </div>
                    <div className="pt-1">
                      {selectedUserDetail.wallet?.is_locked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                          <Lock className="w-3 h-3" /> Bloqueada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Unlock className="w-3 h-3" /> Operativa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reputación y Calificaciones */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-slate-500 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Estadísticas de Reputación</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Como Conductor</span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {selectedUserDetail.reputation?.average_rating_as_driver ? `${selectedUserDetail.reputation.average_rating_as_driver} ★` : 'Sin calificación'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedUserDetail.reputation?.total_trips_as_driver ?? 0} viajes realizados
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Como Pasajero</span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {selectedUserDetail.reputation?.average_rating_as_passenger ? `${selectedUserDetail.reputation.average_rating_as_passenger} ★` : 'Sin calificación'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedUserDetail.reputation?.total_trips_as_passenger ?? 0} viajes tomados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehículos Registrados */}
                {userVehicles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold uppercase tracking-wider text-xs text-slate-500 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-lochmara-600" />
                      <span>Vehículos Registrados ({userVehicles.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userVehicles.map((veh) => (
                        <Link
                          key={veh.id}
                          to={`/vehiculos/${veh.id}`}
                          onClick={() => setSelectedUserId(null)}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-lochmara-500 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold">{veh.plate_number}</span>
                            <p className="text-slate-500 text-[11px]">{veh.brand} {veh.model_line}</p>
                          </div>
                          <span className="text-[10px] font-bold text-lochmara-600">Ver ficha →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historial de Suspensiones */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-slate-500 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Historial de Suspensiones y Sanciones</span>
                  </h4>

                  {(selectedUserDetail.suspension_logs || []).length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      El usuario no registra sanciones ni suspensiones previas.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUserDetail.suspension_logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${log.action === 'suspended' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {log.action === 'suspended' ? 'Cuenta Suspendida' : 'Cuenta Reactivada'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateTime(log.created_at)}
                            </span>
                          </div>
                          {log.reason && (
                            <p className="text-slate-600 dark:text-slate-300">
                              <strong className="font-semibold">Motivo:</strong> {log.reason}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Por: {log.admin_name || 'Administrador'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones del Modal de Detalle */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cerrar
                  </button>

                  {!selectedUserDetail.roles?.includes('administrador') && (
                    selectedUserDetail.is_active ? (
                      <button
                        type="button"
                        onClick={() => handleOpenSuspensionModal(selectedUserDetail, 'suspend')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Suspender Usuario
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSuspensionModal(selectedUserDetail, 'reactivate')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reactivar Usuario
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Suspensión / Reactivación */}
      {suspensionModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  suspensionModal.action === 'suspend'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {suspensionModal.action === 'suspend' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {suspensionModal.action === 'suspend'
                    ? 'Suspender Usuario'
                    : 'Reactivar Cuenta de Usuario'}
                </h3>
                <p className="text-xs text-slate-500 truncate">{suspensionModal.user?.name}</p>
              </div>
            </div>

            {suspensionModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                {suspensionModal.error}
              </div>
            )}

            {suspensionModal.action === 'suspend' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Al suspender la cuenta, el usuario perderá el acceso inmediato a todos los servicios de UniWheels en tiempo real.
                </p>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Motivo obligatorio de la sanción:
                  </label>
                  <textarea
                    value={suspensionModal.reason}
                    onChange={(e) =>
                      setSuspensionModal((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Ej: Incumplimiento de términos y condiciones de viaje o reporte reiterado de mala conducta."
                    rows={3}
                    className="w-full p-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ¿Estás seguro de reactivar la cuenta de <strong className="font-bold text-slate-900 dark:text-white">{suspensionModal.user?.name}</strong>? Se restablecerán sus permisos para publicar y reservar viajes.
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setSuspensionModal({
                    isOpen: false,
                    user: null,
                    action: 'suspend',
                    reason: '',
                    error: '',
                    processing: false,
                  })
                }
                disabled={suspensionModal.processing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSuspension}
                disabled={suspensionModal.processing}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                  suspensionModal.action === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {suspensionModal.processing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {suspensionModal.action === 'suspend' ? 'Confirmar Suspensión' : 'Confirmar Reactivación'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
