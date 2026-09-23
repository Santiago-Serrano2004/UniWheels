import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicleService, userLookupService } from '../services/api';
import { formatDate } from '../utils/formatters';
import { getStatusBadge } from './VehiclesPage';
import {
  ArrowLeft,
  Car,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
  User,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  X,
  Clock,
} from 'lucide-react';

const DOC_TYPE_LABELS = {
  soat: 'SOAT (Seguro Obligatorio)',
  licencia_conduccion: 'Licencia de Conducción',
  tarjeta_propiedad: 'Tarjeta de Propiedad',
  revision_tecnico_mecanica: 'Revisión Técnico-Mecánica (RTM)',
};

const DocumentCard = ({ doc, vehicleId, onStatusUpdated }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [blobError, setBlobError] = useState('');
  const [isPdf, setIsPdf] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionError, setActionError] = useState('');

  // Cargar el documento cuando el usuario lo solicita o de inmediato
  const handleLoadDocument = async () => {
    if (blobUrl) return;
    if (!doc.secure_download_url) {
      setBlobError('No hay URL de descarga firmada disponible.');
      return;
    }

    setLoadingBlob(true);
    setBlobError('');
    try {
      const url = await vehicleService.fetchDocumentBlob(doc.secure_download_url);
      setBlobUrl(url);
      // Heurística simple para saber si es PDF
      if (doc.secure_download_url.includes('.pdf') || doc.document_type.includes('pdf')) {
        setIsPdf(true);
      }
    } catch {
      setBlobError('No se pudo cargar el archivo del documento.');
    } finally {
      setLoadingBlob(false);
    }
  };

  const handleApprove = async () => {
    setVerifying(true);
    setActionError('');
    try {
      const res = await vehicleService.verifyDocument(vehicleId, doc.id, true);
      onStatusUpdated(res.data?.document, res.data?.vehicle_status);
      setShowRejectBox(false);
    } catch (err) {
      setActionError(err?.message || 'Error al aprobar el documento.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      setActionError('Debes ingresar un motivo de rechazo.');
      return;
    }
    setVerifying(true);
    setActionError('');
    try {
      const res = await vehicleService.verifyDocument(vehicleId, doc.id, false, rejectionNotes.trim());
      onStatusUpdated(res.data?.document, res.data?.vehicle_status);
      setShowRejectBox(false);
    } catch (err) {
      setActionError(err?.message || 'Error al rechazar el documento.');
    } finally {
      setVerifying(false);
    }
  };

  const isExpired = doc.is_expired;
  const isVerified = doc.is_verified;
  const isRejected = !doc.is_verified && Boolean(doc.rejection_notes);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
      {/* Header Documento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-lochmara-50 dark:bg-lochmara-950/60 text-lochmara-600 dark:text-lochmara-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Nº {doc.document_number || 'Sin número'} · Entidad: {doc.issuer_entity || 'No especificada'}
            </p>
          </div>
        </div>

        {/* Badge Estado */}
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verificado</span>
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Sin verificar</span>
            </span>
          )}
        </div>
      </div>

      {/* Alertas de Vencimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Expedición: {formatDate(doc.issued_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
            Vencimiento: {formatDate(doc.expires_at)}
          </span>
          {isExpired && (
            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-[10px] border border-rose-300 dark:border-rose-800">
              ¡VENCIDO!
            </span>
          )}
        </div>
      </div>

      {/* Notas de Rechazo Previo */}
      {doc.rejection_notes && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
          <span className="font-bold text-rose-700 dark:text-rose-300 block">
            Motivo de rechazo actual:
          </span>
          <p className="text-rose-600 dark:text-rose-400">{doc.rejection_notes}</p>
        </div>
      )}

      {/* Visor de Documento */}
      <div className="space-y-3 pt-1">
        {!blobUrl ? (
          <button
            type="button"
            onClick={handleLoadDocument}
            disabled={loadingBlob || !doc.secure_download_url}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingBlob ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando visor...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-lochmara-600" />
                <span>Visualizar Documento</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Archivo adjunto
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={blobUrl}
                  download={`documento-${doc.document_type}-${doc.id}`}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Nueva pestaña</span>
                </a>
              </div>
            </div>

            {/* Vista Previa Embebida */}
            <div className="flex justify-center max-h-96 overflow-auto rounded-lg bg-black/5 dark:bg-black/30 p-2">
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full h-80 rounded-md"
              >
                <img
                  src={blobUrl}
                  alt={`Documento ${doc.document_type}`}
                  className="max-h-80 max-w-full object-contain rounded-md shadow-xs"
                />
              </object>
            </div>
          </div>
        )}

        {blobError && <p className="text-xs text-rose-500 font-semibold">{blobError}</p>}
      </div>

      {/* Botones de Acción (Aprobar / Rechazar) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-semibold">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleApprove}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Aprobar Documento</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRejectBox((v) => !v)}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Rechazar...</span>
          </button>
        </div>

        {/* Cuadro de texto para motivo de rechazo */}
        {showRejectBox && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Motivo del rechazo (obligatorio):
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Ej: La foto del documento no es legible o la fecha de vigencia está vencida."
              rows={2}
              className="w-full p-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={verifying || !rejectionNotes.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirmar Rechazo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRejectBox(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const VehicleDetailPage = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVehicleData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehicleService.getVehicleById(id);
      setVehicle(data);

      if (data?.user_id) {
        const users = await userLookupService.lookupUsers([data.user_id]);
        setOwner(users[data.user_id] || null);
      }
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el detalle del vehículo.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  // Manejar actualización en vivo de un documento y del estado del vehículo
  const handleDocumentUpdated = (updatedDoc, newVehicleStatus) => {
    setVehicle((prev) => {
      if (!prev) return prev;
      const updatedDocs = (prev.documents || []).map((d) =>
        d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d
      );
      return {
        ...prev,
        status: newVehicleStatus || prev.status,
        documents: updatedDocs,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-lochmara-600" />
        <p className="text-xs font-semibold">Cargando expediente del vehículo...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4 text-center">
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold text-rose-700 dark:text-rose-300">
            {error || 'Vehículo no encontrado'}
          </h2>
          <Link
            to="/vehiculos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lochmara-600 text-white text-xs font-bold hover:bg-lochmara-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al listado de vehículos</span>
          </Link>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(vehicle.status);
  const BadgeIcon = badge.icon;
  const docs = vehicle.documents || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto pb-16">
      {/* Navegación de regreso */}
      <Link
        to="/vehiculos"
        className="inline-flex items-center gap-2 text-xs font-bold text-lochmara-600 dark:text-lochmara-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la lista de vehículos</span>
      </Link>

      {/* Tarjeta Principal del Vehículo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-mono font-black text-lg tracking-widest uppercase border border-slate-700 dark:border-amber-300 shadow-2xs">
              {vehicle.plate_number}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {vehicle.brand} {vehicle.model_line}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Año {vehicle.year} · Color {vehicle.color} · Tipo: {vehicle.vehicle_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.className}`}>
              <BadgeIcon className="w-4 h-4" />
              <span>{badge.label}</span>
            </span>
          </div>
        </div>

        {/* Motivo de Rechazo Global */}
        {vehicle.rejection_reason && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              <span>Motivo de rechazo del vehículo</span>
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              {vehicle.rejection_reason}
            </p>
          </div>
        )}

        {/* Grilla de Datos del Vehículo y Dueño */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dueño Propietario */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-lochmara-600" />
              <span>Datos del Conductor</span>
            </h3>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {owner?.name || 'Cargando nombre...'}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Correo: {owner?.email || '—'}
              </p>
              <p className="text-slate-400 text-[11px] font-mono">
                ID de Usuario: {vehicle.user_id}
              </p>
            </div>
          </div>

          {/* Especificaciones y Requisitos */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Car className="w-4 h-4 text-lochmara-600" />
              <span>Capacidad y Características</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Puestos disponibles:</span>
                <span className="font-bold text-slate-900 dark:text-white">{vehicle.available_seats}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {vehicle.features?.has_ac && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[11px] border border-blue-200 dark:border-blue-900">
                    Aire Acondicionado
                  </span>
                )}
                {vehicle.features?.has_trunk && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-900">
                    Baúl amplio
                  </span>
                )}
                {vehicle.features?.has_extra_helmet && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-200 dark:border-amber-900">
                    Casco extra
                  </span>
                )}
                {vehicle.legal_compliance?.requires_rtm && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold text-[11px] border border-purple-200 dark:border-purple-900 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Requiere Técnico-Mecánica
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Foto de perspectiva si existe */}
        {vehicle.perspective_photo_url && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fotografía del Vehículo
            </h3>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 max-h-64 flex items-center justify-center">
              <img
                src={vehicle.perspective_photo_url}
                alt={`${vehicle.brand} ${vehicle.model_line}`}
                className="max-h-64 object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sección de Documentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-lochmara-600" />
            <span>Documentos Obligatorios ({docs.length})</span>
          </h2>
        </div>

        {docs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-2xs">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay documentos cargados
            </p>
            <p className="text-xs text-slate-400">
              El conductor todavía no ha subido los documentos de este vehículo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                vehicleId={vehicle.id}
                onStatusUpdated={handleDocumentUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
