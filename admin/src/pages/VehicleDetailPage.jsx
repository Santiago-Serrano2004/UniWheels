import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';

export const VehicleDetailPage = () => {
  const { id } = useParams();
  return (
    <div className="p-6 space-y-6">
      <Link to="/vehiculos" className="inline-flex items-center gap-2 text-sm font-bold text-lochmara-600 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a vehículos</span>
      </Link>
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-lochmara-600" />
        <h1 className="text-xl font-black">Detalle de Vehículo: {id}</h1>
      </div>
    </div>
  );
};
