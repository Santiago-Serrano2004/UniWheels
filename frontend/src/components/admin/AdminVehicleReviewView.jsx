import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { vehicleService } from '../../services/api';
import {
  ShieldCheck,
  Car,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

const ETIQUETAS_DOCUMENTO = {
  licencia_conduccion: 'Licencia de Conducción',
  soat: 'SOAT',
  tarjeta_propiedad: 'Tarjeta de Propiedad',
  revision_tecnico_mecanica: 'Revisión Técnico-Mecánica',
};

const ETIQUETAS_ESTADO = {
  pendiente_revision: { label: 'Pendiente de Revisión', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  aprobado: { label: 'Aprobado', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  rechazado: { label: 'Rechazado', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  documento_vencido: { label: 'Documento Vencido', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  inactivo: { label: 'Inactivo', className: 'bg-slate-500/10 text-slate-500 border-slate-500/30' },
};

const DocumentoAdminCard = ({ documento, vehicleId, isDark, onRevisado }) => {
  const [procesando, setProcesando] = useState(false);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [error, setError] = useState('');

  const verDocumento = async () => {
    if (!documento.secure_download_url) return;
    try {
      const blobUrl = await vehicleService.fetchDocumentBlob(documento.secure_download_url);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('No se pudo abrir el documento (el enlace firmado pudo haber expirado).');
    }
  };

  const aprobar = async () => {
    setProcesando(true);
    setError('');
    try {
      await vehicleService.verifyDocument(vehicleId, documento.id, true);
      onRevisado();
    } catch (err) {
      setError(err?.message || 'No se pudo aprobar el documento.');
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async () => {
    if (!motivoRechazo.trim()) {
      setError('Escribe un motivo de rechazo para notificar al conductor.');
      return;
    }
    setProcesando(true);
    setError('');
    try {
      await vehicleService.verifyDocument(vehicleId, documento.id, false, motivoRechazo.trim());
      onRevisado();
    } catch (err) {
      setError(err?.message || 'No se pudo rechazar el documento.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-3 border space-y-2 ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-lochmara-500 shrink-0" />
          <div className="min-w-0">
            <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {ETIQUETAS_DOCUMENTO[documento.document_type] || documento.document_type}
            </p>
            {documento.expires_at && (
              <p className={`text-[10px] ${documento.is_expired ? 'text-rose-500 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Vence: {documento.expires_at}{documento.is_expired ? ' (vencido)' : ''}
              </p>
            )}
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
            documento.is_verified
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
        >
          {documento.is_verified ? 'Verificado' : 'Sin verificar'}
        </span>
      </div>

      {documento.rejection_notes && !documento.is_verified && (
        <p className="text-[10px] text-rose-500 font-medium">Motivo de rechazo previo: {documento.rejection_notes}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={verDocumento}
          disabled={!documento.secure_download_url}
          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 ${
            isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
          }`}
        >
          <ExternalLink className="w-3 h-3" />
          <span>Ver Documento</span>
        </button>

        {!documento.is_verified && (
          <>
            <button
              type="button"
              onClick={aprobar}
              disabled={procesando}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
            >
              {procesando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>Aprobar</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarRechazo((v) => !v)}
              disabled={procesando}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
            >
              <XCircle className="w-3 h-3" />
              <span>Rechazar</span>
            </button>
          </>
        )}
      </div>

      {mostrarRechazo && !documento.is_verified && (
        <div className="space-y-1.5 pt-1">
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Ej: La foto del SOAT está borrosa, vuelve a subirla."
            rows={2}
            className={`w-full text-[11px] rounded-xl p-2 border resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />
          <button
            type="button"
            onClick={rechazar}
            disabled={procesando}
            className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-60"
          >
            {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
          </button>
        </div>
      )}

      {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
    </div>
  );
};

export const AdminVehicleReviewView = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState(null);

  const cargarVehiculos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await vehicleService.getAllVehiclesForAdmin();
      setVehiculos(data);
      setExpandido((prev) => prev ?? data.find((v) => v.status === 'pendiente_revision')?.id ?? null);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de vehículos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  const pendientes = vehiculos.filter((v) => v.status === 'pendiente_revision');
  const revisados = vehiculos.filter((v) => v.status !== 'pendiente_revision');

  const renderVehiculo = (vehiculo) => {
    const estado = ETIQUETAS_ESTADO[vehiculo.status] || ETIQUETAS_ESTADO.pendiente_revision;
    const abierto = expandido === vehiculo.id;

    return (
      <div
        key={vehiculo.id}
        className={`rounded-3xl border overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <button
          type="button"
          onClick={() => setExpandido(abierto ? null : vehiculo.id)}
          className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-slate-800 border-slate-700 text-lochmara-400' : 'bg-lochmara-50 border-lochmara-200 text-lochmara-600'
            }`}>
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {vehiculo.brand} {vehiculo.model_line} · {vehiculo.plate_number}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {vehiculo.year} • {vehiculo.color} • {vehiculo.available_seats} cupos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${estado.className}`}>
              {estado.label}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
        </button>

        {abierto && (
          <div className={`px-4 pb-4 space-y-2.5 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            {vehiculo.legal_compliance?.requires_rtm && (
              <p className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Este vehículo requiere Revisión Técnico-Mecánica por su antigüedad.
              </p>
            )}

            {(vehiculo.documents || []).length === 0 ? (
              <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                El conductor aún no ha subido documentos.
              </p>
            ) : (
              vehiculo.documents.map((doc) => (
                <DocumentoAdminCard
                  key={doc.id}
                  documento={doc}
                  vehicleId={vehiculo.id}
                  isDark={isDark}
                  onRevisado={cargarVehiculos}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 select-none pb-8">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-lochmara-500" />
          <span>Verificación de Conductores</span>
        </h2>
        <span className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400 bg-lochmara-500/10 px-2 py-0.5 rounded-full border border-lochmara-500/20">
          {pendientes.length} pendientes
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-lochmara-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl p-4 border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 text-center space-y-2">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={cargarVehiculos}
            className="text-xs font-bold text-lochmara-600 hover:underline cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : vehiculos.length === 0 ? (
        <p className={`text-xs text-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No hay vehículos registrados en el sistema todavía.
        </p>
      ) : (
        <>
          {pendientes.length > 0 && (
            <div className="space-y-2.5">
              {pendientes.map(renderVehiculo)}
            </div>
          )}
          {revisados.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Ya revisados
              </p>
              {revisados.map(renderVehiculo)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
