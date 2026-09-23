import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SosEventsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-rose-600" />
        <h1 className="text-xl font-black">Alertas SOS</h1>
      </div>
      <p className="text-sm text-slate-500">Módulo de alertas SOS en carga...</p>
    </div>
  );
};
