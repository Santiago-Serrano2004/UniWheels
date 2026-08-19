import React from 'react';
import { ShieldCheck, CheckCircle2, Car, Bike, FileCheck, CreditCard, Shield } from 'lucide-react';

export const HabeasDataSignatureStep = ({
  tipoVehiculo = 'carro',
  placa = '',
  marca = '',
  marcaPersonalizada = '',
  modelo = '',
  modeloPersonalizado = '',
  ano = '',
  color = '',
  tipoPropulsion = 'gasolina',
  cupos = 3,
  numeroSoat = '',
  vencimientoSoat = '',
  numeroTecno = '',
  vencimientoTecno = '',
  requiereTecno = false,
  numeroLicencia = '',
  categoriaLicencia = 'B1',
  vencimientoLicencia = '',
  aceptaTerminos = false,
  setAceptaTerminos,
  isDark,
}) => {
  const marcaFinal = (marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca')
    ? (marcaPersonalizada?.trim() || 'Marca Particular')
    : marca;

  const modeloFinal = (typeof modelo === 'string' && modelo.startsWith('Otro'))
    ? (modeloPersonalizado?.trim() || 'Modelo Particular')
    : modelo;

  return (
    <div className="space-y-3.5">
      {/* 1. FICHA COMPLETA DEL VEHÍCULO */}
      <section
        className={`p-4 rounded-3xl border shadow-xs transition-colors space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-lochmara-500/10 border border-lochmara-500/25 flex items-center justify-center text-lochmara-500 shrink-0">
              {tipoVehiculo === 'moto' ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
            </div>
            <div>
              <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ficha del Vehículo
              </h4>
              <p className="text-[10px] text-slate-400 capitalize">
                {tipoVehiculo === 'moto' ? 'Motocicleta' : 'Automóvil'} • {tipoPropulsion}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-lochmara-500/10 border border-lochmara-500/30 text-lochmara-600 dark:text-lochmara-400">
            {placa ? placa.toUpperCase() : 'SIN PLACA'}
          </span>
        </div>

        {/* Rejilla de Especificaciones */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Marca y Línea:</span>
            <strong className="font-extrabold text-[11px] block truncate">
              {marcaFinal} {modeloFinal}
            </strong>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Año y Color:</span>
            <strong className="font-extrabold text-[11px] block truncate">
              {ano} • {color}
            </strong>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Cupos Ofertados:</span>
            <strong className="font-extrabold text-[11px] block">
              {cupos} {cupos === 1 ? 'Cupo disponible' : 'Cupos disponibles'}
            </strong>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Propulsión:</span>
            <strong className="font-extrabold text-[11px] block capitalize">
              {tipoPropulsion}
            </strong>
          </div>
        </div>
      </section>

      {/* 2. RESUMEN DE PÓLIZAS Y DOCUMENTACIÓN LEGAL */}
      <section
        className={`p-4 rounded-3xl border shadow-xs transition-colors space-y-2.5 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          Documentación y Pólizas
        </h4>

        <div className="space-y-2 text-xs">
          {/* Fila SOAT */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Póliza SOAT:</span>
                <span className="font-extrabold text-[11px]">No. {numeroSoat || 'N/A'}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Vence: {vencimientoSoat || 'N/A'}
            </span>
          </div>

          {/* Fila RTM (si aplica) */}
          {requiereTecno ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Revisión Técnico-Mecánica:</span>
                  <span className="font-extrabold text-[11px]">No. {numeroTecno || 'N/A'}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Vence: {vencimientoTecno || 'N/A'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Revisión Técnico-Mecánica:</span>
                  <span className="font-extrabold text-[11px]">Exento por Ley</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Modelo {ano}
              </span>
            </div>
          )}

          {/* Fila Licencia */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Licencia de Conducción ({categoriaLicencia}):</span>
                <span className="font-extrabold text-[11px]">No. {numeroLicencia || 'N/A'}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Vence: {vencimientoLicencia || 'N/A'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. CLÁUSULA DE HABEAS DATA Y PROTOCOLO UNIVERSITARIO */}
      <section
        className={`p-3.5 rounded-3xl border text-xs space-y-2.5 transition-colors ${
          aceptaTerminos
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 text-lochmara-600 dark:text-lochmara-400 font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="text-xs">Tratamiento de Datos Personales (Ley 1581 de 2012)</span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Autorizo de manera libre y voluntaria a <strong>UniWheels</strong> y a mi institución universitaria para validar la autenticidad de los documentos vehiculares aportados en el RUNT y entidades de tránsito.
        </p>

        <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none border-t border-slate-100 dark:border-slate-800/60">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-lochmara-600 focus:ring-lochmara-500 mt-0.5 cursor-pointer"
          />
          <span className={`text-xs font-bold transition-colors ${
            aceptaTerminos ? 'text-emerald-600 dark:text-emerald-400' : isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            He leído y acepto los Términos de Convivencia y Política de Tratamiento de Datos.
          </span>
        </label>
      </section>
    </div>
  );
};

export const RegistrationSuccessStep = ({
  placa,
  onComplete,
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
          Tu vehículo con placa <strong className="font-mono text-lochmara-500">{placa ? placa.toUpperCase() : ''}</strong> ha sido registrado. El equipo administrativo revisará tus documentos y te notificará por correo.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-left">
        <strong>Notificación al Administrador:</strong> Hemos enviado una ficha técnica detallada al correo administrativo para la validación de tus pólizas.
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
