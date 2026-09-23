import React from 'react';
import { Car } from 'lucide-react';

export const VehiclesPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Car className="w-5 h-5 text-lochmara-600" />
          <span>Gestión y Revisión de Vehículos</span>
        </h1>
      </div>
      <p className="text-sm text-slate-500">Módulo de vehículos en carga...</p>
    </div>
  );
};
