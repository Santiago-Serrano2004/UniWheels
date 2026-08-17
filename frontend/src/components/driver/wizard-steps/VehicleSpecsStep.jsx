import React from 'react';
import { Car, Bike, Loader2 } from 'lucide-react';
import { ColombianPlateInput } from '../ColombianPlateInput';
import { FormSelect } from '../../common/FormSelect';
import { MARCAS_COLOMBIA_CARROS, MARCAS_COLOMBIA_MOTOS } from '../../../services/vehicleApiService';
import { COLORES_VEHICULOS, ANOS_VEHICULOS } from '../../../utils/colombianVehicleRules';

export const VehicleSpecsStep = ({
  tipoVehiculo,
  setTipoVehiculo,
  placa,
  setPlaca,
  marca,
  setMarca,
  modelo,
  setModelo,
  modelosDisponibles,
  cargandoModelos,
  ano,
  setAno,
  color,
  setColor,
  tipoPropulsion,
  setTipoPropulsion,
  cupos,
  setCupos,
  isDark,
}) => {
  const marcas = tipoVehiculo === 'carro' ? MARCAS_COLOMBIA_CARROS : MARCAS_COLOMBIA_MOTOS;

  return (
    <div className="space-y-4">
      {/* Selector de Tipo: Carro vs Moto */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setTipoVehiculo('carro');
            setMarca('Chevrolet');
            setCupos(3);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tipoVehiculo === 'carro'
              ? 'bg-lochmara-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Automóvil / Camioneta</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTipoVehiculo('moto');
            setMarca('Yamaha');
            setCupos(1);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tipoVehiculo === 'moto'
              ? 'bg-amber-500 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Motocicleta</span>
        </button>
      </div>

      {/* Input de Placa Colombiana Oficial */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          Placa Oficial (RUNT / Tránsito):
        </label>
        <ColombianPlateInput
          value={placa}
          onChange={(val) => setPlaca(val)}
          tipoVehiculo={tipoVehiculo}
        />
      </div>

      {/* Marca y Modelo */}
      <div className="grid grid-cols-2 gap-2.5">
        <FormSelect
          label="Marca:"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          options={marcas.map((m) => ({ value: m, label: m }))}
        />

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block flex items-center justify-between">
            <span>Línea / Modelo:</span>
            {cargandoModelos && <Loader2 className="w-3 h-3 animate-spin text-lochmara-500" />}
          </label>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            disabled={cargandoModelos || modelosDisponibles.length === 0}
            className={`w-full py-2 px-3 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {modelosDisponibles.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Año, Color y Propulsión */}
      <div className="grid grid-cols-3 gap-2">
        <FormSelect
          label="Año:"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          options={ANOS_VEHICULOS.map((a) => ({ value: a, label: a }))}
        />

        <FormSelect
          label="Color:"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          options={COLORES_VEHICULOS.map((c) => ({ value: c, label: c }))}
        />

        <FormSelect
          label="Propulsión:"
          value={tipoPropulsion}
          onChange={(e) => setTipoPropulsion(e.target.value)}
          options={[
            { value: 'gasolina', label: 'Gasolina' },
            { value: 'hibrido', label: 'Híbrido' },
            { value: 'electrico', label: 'Eléctrico' },
            { value: 'diesel', label: 'Diésel' },
          ]}
        />
      </div>

      {/* Cupos Disponibles para Compartir */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          Cupos Disponibles para Pasajeros:
        </label>
        <div className="flex gap-2">
          {(tipoVehiculo === 'moto' ? [1] : [1, 2, 3, 4]).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCupos(num)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                cupos === num
                  ? 'bg-lochmara-600 text-white border-lochmara-500 shadow-xs'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {num} {num === 1 ? 'Cupo' : 'Cupos'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
