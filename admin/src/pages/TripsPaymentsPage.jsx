import React from 'react';
import { CreditCard } from 'lucide-react';

export const TripsPaymentsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-lochmara-600" />
        <h1 className="text-xl font-black">Consulta de Viajes y Pagos</h1>
      </div>
      <p className="text-sm text-slate-500">Módulo de viajes y pagos en carga...</p>
    </div>
  );
};
