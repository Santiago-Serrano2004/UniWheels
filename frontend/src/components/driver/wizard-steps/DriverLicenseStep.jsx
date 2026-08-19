import React from 'react';
import { CreditCard, Camera, CheckCircle2, ShieldCheck, Hash } from 'lucide-react';
import { FormDatePicker } from '../../common/FormDatePicker';
import { FormSelect } from '../../common/FormSelect';

export const DriverLicenseStep = ({
  numeroLicencia,
  setNumeroLicencia,
  categoriaLicencia,
  setCategoriaLicencia,
  vencimientoLicencia,
  setVencimientoLicencia,
  fotoLicencia,
  tipoVehiculo,
  abrirSelectorFoto,
  isDark,
}) => {
  return (
    <div className="space-y-3.5">
      <section
        className={`p-4 rounded-3xl border shadow-xs transition-colors space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera Licencia */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lochmara-500/10 border border-lochmara-500/25 flex items-center justify-center text-lochmara-500 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Licencia de Conducción
              </h4>
              <p className="text-[10px] text-slate-400">Documento RUNT oficial</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
            Categoría {tipoVehiculo === 'moto' ? 'A2' : 'B1 / C1'}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Hash className="w-3 h-3 text-lochmara-500" />
              <span>Número de Licencia:</span>
            </label>
            <input
              type="text"
              value={numeroLicencia}
              onChange={(e) => setNumeroLicencia(e.target.value.toUpperCase())}
              placeholder="Ej: 1098765432"
              className={`w-full py-2 px-3 rounded-2xl text-xs font-bold border transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormSelect
              label="Categoría:"
              value={categoriaLicencia}
              onChange={(e) => setCategoriaLicencia(e.target.value)}
              options={
                tipoVehiculo === 'moto'
                  ? [{ value: 'A1', label: 'A1 (Hasta 125cc)' }, { value: 'A2', label: 'A2 (Cualquier cilindraje)' }]
                  : [
                      { value: 'B1', label: 'B1 (Particular)' },
                      { value: 'B2', label: 'B2 (Camión/Buseta)' },
                      { value: 'C1', label: 'C1 (Público Ligero)' },
                    ]
              }
            />

            <FormDatePicker
              label="Vencimiento Licencia:"
              value={vencimientoLicencia}
              onChange={(val) => setVencimientoLicencia(val)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Carga de Foto Licencia */}
        <button
          type="button"
          onClick={() => abrirSelectorFoto('licencia')}
          className={`w-full py-2.5 px-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            fotoLicencia
              ? isDark
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-400 text-emerald-800'
              : isDark
              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-lochmara-500 hover:bg-slate-800/40'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-lochmara-500 hover:bg-lochmara-50/40'
          }`}
        >
          {fotoLicencia ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Camera className="w-4 h-4 text-lochmara-500" />
          )}
          <span>{fotoLicencia ? 'Foto de la licencia cargada' : 'Subir foto frontal de la licencia'}</span>
        </button>
      </section>
    </div>
  );
};
