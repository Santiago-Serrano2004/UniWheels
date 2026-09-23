import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Clock,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useAppStore, vehicleService } from '@uniwheels/shared';
import { DriverRegistrationWizard } from './DriverRegistrationWizard';
import { DriverApprovedCelebrationModal } from '../common/DriverApprovedCelebrationModal';

export interface DriverOnboardingViewProps {
  onBack?: () => void;
  onRegistered?: () => void;
}

export function DriverOnboardingView({ onBack, onRegistered }: DriverOnboardingViewProps) {
  const { user, updateDriverStatus } = useAppStore();
  const [mostrarAsistente, setMostrarAsistente] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
  const [modalCelebracionAbierto, setModalCelebracionAbierto] = useState(false);

  const driverStatus = user?.driverStatus || (user?.isDriver ? 'approved' : 'unregistered');
  const isPending = driverStatus === 'pending';

  const verificarAprobacion = React.useCallback(async () => {
    setComprobando(true);
    setMensajeEstado(null);
    try {
      const plate = user?.driverApplication?.plate_number || user?.driverInfo?.plate_number;
      const res = await vehicleService.checkApprovedVehicle(user?.id, plate);
      if (res?.has_approved_vehicle || res?.status === 'approved' || res?.is_approved) {
        updateDriverStatus('approved', res?.vehicle || user?.driverApplication);
        setModalCelebracionAbierto(true);
      } else {
        setMensajeEstado('Tu solicitud continúa en proceso de validación por Bienestar Universitario.');
      }
    } catch {
      setMensajeEstado('No se pudo verificar el estado en este momento. Intenta de nuevo.');
    } finally {
      setComprobando(false);
    }
  }, [user?.id, user?.driverApplication, user?.driverInfo, updateDriverStatus]);

  // Polling automático al montar si está pendiente
  useEffect(() => {
    if (isPending) {
      verificarAprobacion();
    }
  }, [isPending, verificarAprobacion]);

  if (mostrarAsistente) {
    return (
      <DriverRegistrationWizard
        onBack={() => setMostrarAsistente(false)}
        onComplete={() => {
          setMostrarAsistente(false);
          if (onRegistered) {
            onRegistered();
          }
        }}
      />
    );
  }

  const requisitos = [
    {
      titulo: '1. Datos de tu Vehículo',
      descripcion: 'Placa colombiana, marca, línea/modelo, color y cupos disponibles.',
      icono: Car,
      colorBg: 'bg-lochmara-50 dark:bg-slate-800',
      colorIcon: '#0284c7',
    },
    {
      titulo: '2. SOAT y Tecnomecánica',
      descripcion: 'Pólizas y certificados vigentes para la seguridad de la comunidad.',
      icono: FileCheck,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      colorIcon: '#10b981',
    },
    {
      titulo: '3. Licencia de Conducción',
      descripcion: 'Categoría vigente (A2 / B1 / C1) validada ante el RUNT.',
      icono: CreditCard,
      colorBg: 'bg-amber-50 dark:bg-amber-950/40',
      colorIcon: '#f59e0b',
    },
    {
      titulo: '4. Protección Ley 1581',
      descripcion: 'Custodia segura de documentos con autorización de Habeas Data.',
      icono: ShieldCheck,
      colorBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      colorIcon: '#6366f1',
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-4"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {onBack && (
        <Pressable onPress={onBack} hitSlop={8} className="flex-row items-center gap-1.5 self-start mb-3 py-1">
          <ArrowLeft size={16} color="#64748b" />
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Volver a modo pasajero</Text>
        </Pressable>
      )}
      {/* 1. ESTADO: PENDIENTE DE REVISIÓN */}
      {isPending ? (
        <View className="gap-4">
          <View className="p-5 rounded-3xl border bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-amber-500 items-center justify-center shadow-md shadow-amber-500/20">
                <Clock size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-amber-950 dark:text-amber-100">
                  Solicitud en Revisión
                </Text>
                <Text className="text-xs text-amber-800 dark:text-amber-300">
                  Bienestar Universitario está validando tus documentos
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-amber-900/80 dark:text-amber-200 leading-relaxed">
              Hemos recibido tu registro vehicular. Una vez verificadas las pólizas ante el RUNT y autoridades de tránsito, tu rol de conductor se habilitará automáticamente.
            </Text>

            {mensajeEstado ? (
              <View className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-700">
                <Text className="text-xs font-medium text-amber-900 dark:text-amber-200">
                  {mensajeEstado}
                </Text>
              </View>
            ) : null}

            <Pressable
              disabled={comprobando}
              onPress={verificarAprobacion}
              className="py-3 px-4 rounded-2xl bg-amber-600 active:bg-amber-700 flex-row items-center justify-center gap-2"
            >
              {comprobando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <RefreshCw size={16} color="#ffffff" />
              )}
              <Text className="text-xs font-bold text-white">
                {comprobando ? 'Consultando...' : 'Comprobar Estado de Aprobación'}
              </Text>
            </Pressable>
          </View>

          {/* Checklist de Documentos en Validación */}
          <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
              Checklist de Validación Institucional
            </Text>

            <View className="gap-2.5">
              <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <View className="flex-row items-center gap-2">
                  <Car size={16} color="#0284c7" />
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ficha Vehicular y Placa
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Enviado
                </Text>
              </View>

              <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={16} color="#10b981" />
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Póliza SOAT y RTM
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  En Auditoría
                </Text>
              </View>

              <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <View className="flex-row items-center gap-2">
                  <CreditCard size={16} color="#6366f1" />
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Licencia de Conducción
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  En Auditoría
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* 2. ESTADO: NO REGISTRADO (PRESENTACIÓN Y BENEFICIOS) */
        <View className="gap-4">
          {/* Hero Banner */}
          <View className="rounded-3xl p-5 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-2.5 shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
                <Sparkles size={18} color="#0284c7" />
              </View>
              <Text className="text-xs font-bold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                Portal de Conductor UniWheels
              </Text>
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              Comparte tu ruta universitaria, ahorra combustible y viaja seguro
            </Text>

            <Text className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Publica tus recorridos diarios hacia o desde el campus, comparte gastos de transporte con compañeros de confianza y ayuda a reducir la congestión vehicular.
            </Text>
          </View>

          {/* Tarjetas de Beneficios */}
          <View className="flex-row gap-2.5">
            <View className="flex-1 p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1 shadow-2xs">
              <View className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center">
                <CheckCircle2 size={16} color="#10b981" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                Ahorro Mensual
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Compensa hasta el 70% de tus gastos mensuales de gasolina.
              </Text>
            </View>

            <View className="flex-1 p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1 shadow-2xs">
              <View className="w-7 h-7 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
                <Users size={16} color="#0284c7" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                100% Universitario
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Solo compartes con estudiantes y docentes institucionales validados.
              </Text>
            </View>
          </View>

          {/* Requisitos */}
          <View className="gap-2">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              ¿Qué necesitas para registrarte?
            </Text>

            <View className="rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 gap-3 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
              {requisitos.map((req, idx) => {
                const Icon = req.icono;
                return (
                  <View key={idx} className="flex-row items-start gap-3 pt-2.5 first:pt-0">
                    <View className={`w-8 h-8 rounded-xl ${req.colorBg} items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={16} color={req.colorIcon} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.titulo}
                      </Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {req.descripcion}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Botón Principal */}
          <Pressable
            onPress={() => setMostrarAsistente(true)}
            className="w-full py-3.5 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-lg shadow-lochmara-600/30"
          >
            <Text className="text-xs font-bold text-white">Iniciar Solicitud de Conductor</Text>
            <ArrowRight size={16} color="#ffffff" />
          </Pressable>

          {/* Sello Institucional */}
          <View className="flex-row items-center justify-center gap-1.5 pt-1">
            <ShieldCheck size={14} color="#0284c7" />
            <Text className="text-[11px] text-slate-400">
              Validación y Auditoría Digital por Bienestar Universitario
            </Text>
          </View>
        </View>
      )}

      {/* Modal de Celebración */}
      <DriverApprovedCelebrationModal
        isOpen={modalCelebracionAbierto}
        onClose={() => setModalCelebracionAbierto(false)}
      />
    </ScrollView>
  );
}
