import React from 'react';
import { FileCheck, Camera, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
    <div className="space-y-4">
      {/* SECCIÓN 1: PÓLIZA SOAT */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-lochmara-500" />
            <h4 className="text-xs font-black">Póliza SOAT Vigente</h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Obligatorio
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block">Número de Póliza:</label>
            <input
              type="text"
              value={numeroSoat}
              onChange={(e) => setNumeroSoat(e.target.value.toUpperCase())}
              placeholder="Ej: 9820491024"
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <FormDatePicker
            label="Fecha de Vencimiento:"
            value={vencimientoSoat}
            onChange={(val) => setVencimientoSoat(val)}
          />
        </div>

        {/* Botón de Carga de Foto SOAT */}
        <button
          type="button"
          onClick={() => abrirSelectorFoto('soat')}
          className={`w-full py-2.5 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            fotoSoat
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : isDark
              ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-lochmara-500'
              : 'bg-white border-slate-300 text-slate-700 hover:border-lochmara-500'
          }`}
        >
          {fotoSoat ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Foto del SOAT Cargada</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-lochmara-500" />
              <span>Tomar / Subir Foto del SOAT</span>
            </>
          )}
        </button>
      </div>

      {/* SECCIÓN 2: REVISIÓN TÉCNICO-MECÁNICA (RTM) */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black">Revisión Técnico-Mecánica (RTM)</h4>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              requiereTecno
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {requiereTecno ? 'Exigible por Ley' : 'Exento por Modelo Reciente'}
          </span>
        </div>

        {requiereTecno ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Número de Certificado:</label>
                <input
                  type="text"
                  value={numeroTecno}
                  onChange={(e) => setNumeroTecno(e.target.value.toUpperCase())}
                  placeholder="Ej: CDA-89210"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <FormDatePicker
                label="Fecha de Vencimiento:"
                value={vencimientoTecno}
                onChange={(val) => setVencimientoTecno(val)}
              />
            </div>

            <button
              type="button"
              onClick={() => abrirSelectorFoto('tecno')}
              className={`w-full py-2.5 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                fotoTecno
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-500'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-amber-500'
              }`}
            >
              {fotoTecno ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Certificado RTM Cargado</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Tomar / Subir Foto de la RTM</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Tu vehículo modelo <strong>{ano}</strong> ({tipoVehiculo === 'carro' ? 'menor a 5 años' : 'menor a 2 años'}) está legalmente <strong>exento de Revisión Técnico-Mecánica</strong> según la Ley 2294 de 2023.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
