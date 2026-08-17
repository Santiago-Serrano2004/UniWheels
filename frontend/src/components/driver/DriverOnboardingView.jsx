import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DriverRegistrationWizard } from './DriverRegistrationWizard';
import {
  Car,
  ShieldCheck,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Users,
} from 'lucide-react';

export const DriverOnboardingView = ({ onBack }) => {
  const { user, setActiveTab, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [mostrarAsistente, setMostrarAsistente] = useState(false);

  if (mostrarAsistente) {
    return (
      <DriverRegistrationWizard
        onBack={() => setMostrarAsistente(false)}
        onComplete={() => {
          setMostrarAsistente(false);
          setActiveTab('driver');
        }}
      />
    );
  }

  const requisitos = [
    {
      titulo: '1. Datos de tu Vehículo',
      descripcion: 'Placa colombiana, marca, línea/modelo, color y cupos disponibles.',
      icono: Car,
      color: isDark ? 'bg-slate-800 text-lochmara-400 border border-slate-700' : 'bg-lochmara-50 text-lochmara-600 border border-lochmara-100',
    },
    {
      titulo: '2. SOAT y Tecnomecánica',
      descripcion: 'Documentos vigentes para garantizar la seguridad de la comunidad.',
      icono: FileCheck,
      color: isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      titulo: '3. Licencia de Conducción',
      descripcion: 'Categoría vigente apta para conducir en territorio nacional.',
      icono: CreditCard,
      color: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      titulo: '4. Protección Ley 1581',
      descripcion: 'Tus documentos se cifran y custodian con firma temporal de seguridad.',
      icono: ShieldCheck,
      color: isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
  ];

  const institutionCode = user?.institution?.code || 'Universitarios';
  const institutionName = user?.institution?.name || 'tu universidad';

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Barra de Encabezado */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack || (() => setActiveTab('home'))}
          className={`w-9 h-9 rounded-full border shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Portal de Conductor
        </span>
        <div className="w-9" />
      </div>

      {/* Hero Banner */}
      <section
        className={`rounded-3xl p-5 border shadow-md relative overflow-hidden space-y-3 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-gradient-to-br from-[#082f49] to-slate-900 text-white border-slate-800'
        }`}
      >
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lochmara-400/20 border border-lochmara-400/30 text-lochmara-200 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-lochmara-300" />
            <span>Conductores Verificados {institutionCode}</span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            Comparte tu ruta, ahorra y viaja seguro
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Publica tus recorridos hacia o desde {institutionName}, divide los gastos de gasolina y ayuda a otros miembros de tu comunidad.
          </p>
        </div>
      </section>

      {/* Ventajas para el Conductor */}
      <section className="grid grid-cols-2 gap-2.5">
        <div
          className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-md'
              : 'bg-white border-slate-200/80 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className={`text-xs font-bold pt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ahorro Diario</p>
          <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Compensa hasta el 70% de tus gastos mensuales de combustible.
          </p>
        </div>

        <div
          className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-md'
              : 'bg-white border-slate-200/80 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-lochmara-500/10 text-lochmara-400 border border-lochmara-500/20 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <p className={`text-xs font-bold pt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>100% {institutionCode}</p>
          <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Solo viajas con estudiantes y docentes universitarios verificados.
          </p>
        </div>
      </section>

      {/* Requisitos y Proceso de Validación */}
      <section className="space-y-2">
        <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          ¿Qué necesitas para registrarte?
        </h3>

        <div
          className={`rounded-3xl border p-4 divide-y shadow-2xs transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 divide-slate-800 text-white'
              : 'bg-white border-slate-200/80 divide-slate-100 text-slate-900'
          }`}
        >
          {requisitos.map((req, idx) => {
            const Icon = req.icono;
            return (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl ${req.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{req.titulo}</p>
                  <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{req.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botón Principal para Iniciar Registro */}
      <button
        onClick={() => setMostrarAsistente(true)}
        className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
      >
        <span>Registrarme como Conductor</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Sello de Seguridad */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
        <span>Validación y Auditoría Digital por Bienestar Universitario</span>
      </div>
    </div>
  );
};
