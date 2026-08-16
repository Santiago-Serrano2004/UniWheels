import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CancelTripPenaltyModal } from './CancelTripPenaltyModal';
import { DriverHistoryView } from './DriverHistoryView';
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Plus,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DriverCockpitCard = () => {
  const {
    activeDriverTrip,
    cancelDriverTrip,
    driverWalletBalance,
    addPassengerToActiveTrip,
    setActiveTab,
  } = useAppStore();

  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);

  if (!activeDriverTrip) {
    return (
      <div className="space-y-4 pb-6 select-none">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-lochmara-50 border border-lochmara-200 text-lochmara-600 flex items-center justify-center mx-auto shadow-2xs">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No tienes un viaje publicado</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
              Publica tu trayecto diario hacia o desde la universidad para compartir gastos con tu comunidad.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('driver')}
            className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all shadow-md shadow-lochmara-600/20 cursor-pointer"
          >
            Publicar Nuevo Trayecto
          </button>
        </div>

        {/* Acceso Rápido al Historial */}
        <button
          onClick={() => setActiveTab('history')}
          className="w-full p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-left transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lochmara-50 text-lochmara-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Historial de Conducción</p>
              <p className="text-[11px] text-slate-500">Consulta tus viajes completados y califica a tus pasajeros</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    );
  }

  const pasajeros = activeDriverTrip.passengers || [];
  const cuposTotales = activeDriverTrip.seats || 3;
  const cuposDisponibles = Math.max(0, cuposTotales - pasajeros.length);

  // Simular un pasajero universitario para pruebas didácticas
  const simularPasajero = () => {
    if (cuposDisponibles <= 0) return;
    const listaSimulada = [
      { id: 'p1', name: 'Laura Gómez', studentCode: 'U00294812', program: 'Medicina', pickup: 'Parque San Pío' },
      { id: 'p2', name: 'Mateo Cárdenas', studentCode: 'U00381920', program: 'Ingeniería de Sistemas', pickup: 'Estación Provenza' },
      { id: 'p3', name: 'Camila Duarte', studentCode: 'U00194820', program: 'Derecho', pickup: 'Centro Comercial Cañaveral' },
    ];
    const siguiente = listaSimulada[pasajeros.length % listaSimulada.length];
    addPassengerToActiveTrip({
      id: 'p_' + Date.now(),
      name: siguiente.name,
      studentCode: siguiente.studentCode,
      program: siguiente.program,
      pickup: siguiente.pickup,
      confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. TARJETA PRINCIPAL DEL VIAJE ACTIVO */}
      <section className="bg-gradient-to-br from-slate-900 via-[#082f49] to-slate-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Viaje Activo Publicado</span>
          </div>

          <span className="text-xs font-mono font-bold text-lochmara-300">
            {activeDriverTrip.departureTime || '06:45 AM'}
          </span>
        </div>

        {/* Resumen de Ruta */}
        <div className="space-y-2 bg-white/5 rounded-2xl p-3.5 border border-white/10">
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-lochmara-400 mt-1 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block">Punto de Origen</span>
              <p className="text-xs font-bold text-white truncate">{activeDriverTrip.origin}</p>
            </div>
          </div>

          <div className="h-4 border-l-2 border-dashed border-slate-600 ml-1.5" />

          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block">Punto de Destino</span>
              <p className="text-xs font-bold text-white truncate">{activeDriverTrip.destination}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas: Cupos y Tarifa */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] text-slate-300 font-medium block">Cupos Disponibles</span>
            <p className="text-sm font-extrabold text-lochmara-300">
              {cuposDisponibles} de {cuposTotales} libres
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] text-slate-300 font-medium block">Aporte por Asiento</span>
            <p className="text-sm font-extrabold text-emerald-300">
              $ {Number(activeDriverTrip.price || 4500).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. LISTA DE PASAJEROS ASIGNADOS AL VIAJE */}
      <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-lochmara-100 text-lochmara-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Estudiantes Confirmados</h3>
              <p className="text-[10px] text-slate-500">{pasajeros.length} de {cuposTotales} cupos ocupados</p>
            </div>
          </div>

          {cuposDisponibles > 0 && (
            <button
              type="button"
              onClick={simularPasajero}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-lochmara-600 bg-lochmara-50 border border-lochmara-200 px-2.5 py-1 rounded-xl hover:bg-lochmara-100 transition-colors cursor-pointer"
              title="Simular solicitud de estudiante para probar penalización"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Simular Pasajero</span>
            </button>
          )}
        </div>

        {pasajeros.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Esperando reservas de tu corredor...</p>
            <p className="text-[11px]">Los estudiantes verán tu ruta y podrán solicitar cupos.</p>
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-slate-100">
            {pasajeros.map((p, idx) => (
              <div key={p.id || idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center justify-center text-[10px]">
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {p.program} • {p.pickup}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Confirmado
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. BOTÓN DE CANCELAR VIAJE CON VALIDACIÓN DE PENALIZACIÓN */}
      <button
        type="button"
        onClick={() => setModalCancelarAbierto(true)}
        className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <AlertTriangle className="w-4 h-4 text-rose-600" />
        <span>Cancelar Publicación de Viaje</span>
      </button>

      {/* MODAL DE PENALIZACIÓN SI HAY PASAJEROS */}
      <CancelTripPenaltyModal
        isOpen={modalCancelarAbierto}
        onClose={() => setModalCancelarAbierto(false)}
        onConfirmCancel={(applyPenalty) => cancelDriverTrip(applyPenalty, 3000)}
        passengersCount={pasajeros.length}
        currentBalance={driverWalletBalance}
        penaltyAmount={3000}
      />
    </div>
  );
};
