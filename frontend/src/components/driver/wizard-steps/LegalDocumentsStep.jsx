import React from 'react';
import { FileCheck, Camera, CheckCircle2, ShieldCheck, Info, Calendar, Hash } from 'lucide-react';
import { FormDatePicker } from '../../common/FormDatePicker';

export const LegalDocumentsStep = ({
  numeroSoat,
  setNumeroSoat,
  vencimientoSoat,
  setVencimientoSoat,
  fotoSoat,
  numeroTecno,
  setNumeroTecno,
  vencimientoTecno,
  setVencimientoTecno,
  fotoTecno,
  requiereTecno,
  ano,
  tipoVehiculo,
  abrirSelectorFoto,
  isDark,
}) => {
  return (
    <div className="space-y-3.5">
      {/* 1. TARJETA PÓLIZA SOAT */}
      <section
        className={`p-4 rounded-3xl border shadow-xs transition-colors space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera SOAT */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lochmara-500/10 border border-lochmara-500/25 flex items-center justify-center text-lochmara-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Póliza SOAT Vigente
              </h4>
              <p className="text-[10px] text-slate-400">Seguro obligatorio de accidentes</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
            Obligatorio
          </span>
        </div>

        {/* Campos SOAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Hash className="w-3 h-3 text-lochmara-500" />
              <span>Número de Póliza:</span>
            </label>
            <input
              type="text"
              value={numeroSoat}
              onChange={(e) => setNumeroSoat(e.target.value.toUpperCase())}
              placeholder="Ej: 9820491024"
              className={`w-full py-2 px-3 rounded-2xl text-xs font-bold border transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <FormDatePicker
            label="Vencimiento SOAT:"
            value={vencimientoSoat}
            onChange={(val) => setVencimientoSoat(val)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Botón de Carga Foto SOAT */}
        <button
          type="button"
          onClick={() => abrirSelectorFoto('soat')}
          className={`w-full py-2.5 px-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            fotoSoat
              ? isDark
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-400 text-emerald-800'
              : isDark
              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-lochmara-500 hover:bg-slate-800/40'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-lochmara-500 hover:bg-lochmara-50/40'
          }`}
        >
          {fotoSoat ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Camera className="w-4 h-4 text-lochmara-500" />
          )}
          <span>{fotoSoat ? 'Foto de póliza SOAT cargada' : 'Subir foto o PDF del SOAT'}</span>
        </button>
      </section>

      {/* 2. TARJETA REVISIÓN TÉCNICO-MECÁNICA (RTM) - SOLO SI EL VEHÍCULO LA REQUIERE */}
      {requiereTecno && (
        <section
          className={`p-4 rounded-3xl border shadow-xs transition-colors space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera RTM */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/10 border-amber-500/25 text-amber-500">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Revisión Técnico-Mecánica
                </h4>
                <p className="text-[10px] text-slate-400">Certificado CDA autorizado</p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
              Por Ley
            </span>
          </div>

          {/* Campos RTM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Hash className="w-3 h-3 text-amber-500" />
                <span>Número de Certificado:</span>
              </label>
              <input
                type="text"
                value={numeroTecno}
                onChange={(e) => setNumeroTecno(e.target.value.toUpperCase())}
                placeholder="Ej: CDA-89210"
                className={`w-full py-2 px-3 rounded-2xl text-xs font-bold border transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <FormDatePicker
              label="Vencimiento RTM:"
              value={vencimientoTecno}
              onChange={(val) => setVencimientoTecno(val)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Botón de Carga Foto RTM */}
          <button
            type="button"
            onClick={() => abrirSelectorFoto('tecno')}
            className={`w-full py-2.5 px-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              fotoTecno
                ? isDark
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500 hover:bg-slate-800/40'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-500 hover:bg-amber-50/40'
            }`}
          >
            {fotoTecno ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Camera className="w-4 h-4 text-amber-500" />
            )}
            <span>{fotoTecno ? 'Certificado RTM cargado' : 'Subir foto del certificado RTM'}</span>
          </button>
        </section>
      )}
    </div>
  );
};
