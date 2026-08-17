import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Car, Bike, CheckCircle2, Hash } from 'lucide-react';

export const ColombianPlateInput = ({
  value = '',
  onChange,
  vehicleType = 'carro', // 'carro' | 'moto'
  municipality = 'BUCARAMANGA',
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const formatearPlaca = (texto) => {
    return texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  };

  const manejarCambio = (e) => {
    const formateado = formatearPlaca(e.target.value);
    onChange(formateado);
  };

  // Representación visual formateada (ej. KLU · 492 para carro, WYX 81D para moto)
  const textoPlacaFormateado = () => {
    if (!value) {
      return vehicleType === 'carro' ? 'ABC · 123' : 'ABC 12D';
    }
    if (vehicleType === 'carro' && value.length >= 4) {
      return `${value.slice(0, 3)} · ${value.slice(3)}`;
    }
    if (vehicleType === 'moto' && value.length >= 4) {
      return `${value.slice(0, 3)} ${value.slice(3)}`;
    }
    return value;
  };

  const esValida = value.length === 6;

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <Hash className="w-3.5 h-3.5 text-lochmara-500" />
          <span>Placa Vehicular Oficial</span>
        </label>
        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
          esValida
            ? 'text-emerald-500'
            : isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {esValida && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          <span>{esValida ? 'Formato Válido RUNT' : '6 caracteres alfanuméricos'}</span>
        </span>
      </div>

      {/* Chasis Visual de la Placa Oficial Colombiana */}
      <div
        className={`relative mx-auto w-full max-w-[280px] h-[108px] rounded-2xl p-2 flex flex-col items-center justify-between border-4 border-slate-900 shadow-md transition-transform ${
          value ? 'scale-[1.01]' : 'opacity-95'
        }`}
        style={{
          background: 'linear-gradient(180deg, #FAD02C 0%, #F5B800 50%, #E5A800 100%)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Remaches / Tornillos en las esquinas */}
        <div className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
        <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
        <div className="absolute bottom-1.5 left-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
        <div className="absolute bottom-1.5 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />

        {/* Encabezado: COLOMBIA */}
        <div className="text-[10px] font-black tracking-[0.22em] text-slate-900 uppercase pt-0.5">
          COLOMBIA
        </div>

        {/* Centro: Caracteres Alfanuméricos con tipografía vehicular */}
        <div className="font-mono font-black text-2xl tracking-[0.2em] text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] select-none">
          {textoPlacaFormateado()}
        </div>

        {/* Pie: Municipio de Matrícula */}
        <div className="text-[9px] font-black tracking-[0.18em] text-slate-800 uppercase pb-0.5">
          {municipality}
        </div>
      </div>

      {/* Input de Entrada de Texto Estandarizado */}
      <div className="pt-0.5">
        <input
          type="text"
          required
          maxLength={6}
          value={value}
          onChange={manejarCambio}
          placeholder={vehicleType === 'carro' ? 'Ingresa placa (ej: KLU492)' : 'Ingresa placa (ej: WYX81D)'}
          className={`w-full text-center font-mono font-bold text-xs rounded-2xl px-4 py-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 uppercase tracking-widest transition-all shadow-2xs ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
      </div>
    </div>
  );
};
