import React from 'react';
import { CreditCard, Camera, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-lochmara-500" />
            <h4 className="text-xs font-black">Licencia de Conducción</h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Categoría {tipoVehiculo === 'moto' ? 'A2' : 'B1 / C1'}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block">Número de Licencia:</label>
            <input
              type="text"
              value={numeroLicencia}
              onChange={(e) => setNumeroLicencia(e.target.value.toUpperCase())}
              placeholder="Ej: 1098765432"
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
              label="Fecha de Vencimiento:"
              value={vencimientoLicencia}
              onChange={(val) => setVencimientoLicencia(val)}
            />
          </div>
        </div>

        {/* Carga de Foto Licencia */}
        <button
          type="button"
          onClick={() => abrirSelectorFoto('licencia')}
          className={`w-full py-2.5 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            fotoLicencia
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : isDark
              ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-lochmara-500'
              : 'bg-white border-slate-300 text-slate-700 hover:border-lochmara-500'
          }`}
        >
          {fotoLicencia ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Foto de la Licencia Cargada</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-lochmara-500" />
              <span>Tomar / Subir Foto de la Licencia</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
