import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HabeasDataSignatureStep = ({
  placa,
  marca,
  modelo,
  ano,
  color,
  cupos,
  vencimientoSoat,
  vencimientoLicencia,
  aceptaTerminos,
  setAceptaTerminos,
  isDark,
}) => {
  return (
    <div className="space-y-4">
      {/* RESUMEN DE LA FICHA TÉCNICA */}
      <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
          <h4 className="text-xs font-black">Ficha del Vehículo</h4>
          <span className="text-xs font-mono font-black text-lochmara-500">{placa}</span>
        </div>

        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Vehículo:</span>
            <strong>{marca} {modelo} ({ano})</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Color / Cupos:</span>
            <strong>{color} • {cupos} cupo(s)</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Póliza SOAT:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">Vence: {vencimientoSoat || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Licencia:</span>
            <strong>Vence: {vencimientoLicencia || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* CLÁUSULA DE HABEAS DATA Y PROTOCOLO UNIVERSITARIO */}
      <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 text-lochmara-500 font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Tratamiento de Datos Personales (Ley 1581 de 2012)</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Autorizo de manera libre y voluntaria a <strong>UniWheels</strong> y mi institución universitaria para validar la autenticidad de los documentos vehiculares aportados en el RUNT y autoridades de tránsito colombianas.
        </p>

        <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-lochmara-600 focus:ring-lochmara-500 mt-0.5"
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            He leído y acepto los Términos de Convivencia y Política de Tratamiento de Datos.
          </span>
        </label>
      </div>
    </div>
  );
};

export const RegistrationSuccessStep = ({
  placa,
  onComplete,
  isDark,
}) => {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          ¡Solicitud Enviada para Aprobación!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Tu vehículo con placa <strong className="font-mono text-lochmara-500">{placa}</strong> ha sido registrado. El equipo administrativo revisará tus documentos y te notificará por correo.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-left">
        <strong>⏳ Notificación al Administrador:</strong> Hemos enviado una ficha técnica detallada al correo administrativo para la validación de tus pólizas.
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all shadow-md shadow-lochmara-600/30 cursor-pointer"
      >
        Entendido, Volver al Inicio
      </button>
    </div>
  );
};
