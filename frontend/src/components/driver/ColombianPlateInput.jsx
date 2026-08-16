import React from 'react';

export const ColombianPlateInput = ({
  value,
  onChange,
  vehicleType = 'carro', // 'carro' | 'moto'
  municipality = 'BUCARAMANGA',
}) => {
  const formatearPlaca = (texto) => {
    // Solo letras y números en mayúscula
    const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (vehicleType === 'carro') {
      return limpio.slice(0, 6);
    }
    return limpio.slice(0, 6);
  };

  const manejarCambio = (e) => {
    const formateado = formatearPlaca(e.target.value);
    onChange(formateado);
  };

  // Representación visual con punto central para carros (ABC · 123)
  const renderTextoPlaca = () => {
    if (!value) return vehicleType === 'carro' ? 'ABC · 123' : 'ABC 12D';
    if (vehicleType === 'carro' && value.length >= 4) {
      return `${value.slice(0, 3)} · ${value.slice(3)}`;
    }
    return value;
  };

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Placa Vehicular Oficial</label>
        <span className="text-[10px] text-slate-500 font-medium">Formato RUNT Colombia</span>
      </div>

      {/* Tarjeta de Placa Colombiana Realista */}
      <div className="relative mx-auto w-full max-w-[280px] h-[105px] rounded-2xl bg-gradient-to-b from-[#ffcf00] via-[#ffd61f] to-[#e6b000] border-4 border-slate-900 shadow-md flex flex-col items-center justify-between p-1.5 overflow-hidden">
        {/* Tornillos / Remaches en las 4 esquinas */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 shadow-inner flex items-center justify-center">
          <div className="w-1 h-0.5 bg-slate-600 rotate-45" />
        </div>
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 shadow-inner flex items-center justify-center">
          <div className="w-1 h-0.5 bg-slate-600 -rotate-45" />
        </div>
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 shadow-inner flex items-center justify-center">
          <div className="w-1 h-0.5 bg-slate-600 -rotate-45" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 shadow-inner flex items-center justify-center">
          <div className="w-1 h-0.5 bg-slate-600 rotate-45" />
        </div>

        {/* Encabezado: COLOMBIA */}
        <div className="text-[10px] font-black tracking-widest text-slate-950 uppercase pt-0.5">
          COLOMBIA
        </div>

        {/* Centro: Texto de la Placa con Efecto Repujado */}
        <div className="font-mono font-black text-2xl tracking-widest text-slate-950 drop-shadow-xs select-none">
          {renderTextoPlaca()}
        </div>

        {/* Pie: Municipio */}
        <div className="text-[9px] font-extrabold tracking-wider text-slate-900 uppercase pb-0.5">
          {municipality}
        </div>
      </div>

      {/* Campo de Entrada de Texto Conectado */}
      <div className="pt-1">
        <input
          type="text"
          required
          maxLength={6}
          value={value}
          onChange={manejarCambio}
          placeholder={vehicleType === 'carro' ? 'Escribe tu placa (ej: KLU492)' : 'Escribe tu placa (ej: WYX81D)'}
          className="w-full bg-white text-center font-mono font-bold text-xs rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 text-slate-900 uppercase shadow-2xs"
        />
      </div>
    </div>
  );
};
