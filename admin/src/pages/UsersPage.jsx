import React from 'react';
import { Users } from 'lucide-react';

export const UsersPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-lochmara-600" />
        <h1 className="text-xl font-black">Gestión de Usuarios</h1>
      </div>
      <p className="text-sm text-slate-500">Módulo de usuarios en carga...</p>
    </div>
  );
};
