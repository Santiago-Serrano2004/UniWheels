import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ShieldCheck,
  CheckCircle2,
  Car,
  Bike,
  FileCheck,
  CreditCard,
  Shield,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  PenTool,
  X,
  Check,
} from 'lucide-react-native';
import type { PhotoPickerAsset } from '@/components/PhotoPickerModal';

export interface HabeasDataSignatureStepProps {
  tipoVehiculo?: 'car' | 'motorcycle' | string;
  placa?: string;
  marca?: string;
  marcaPersonalizada?: string;
  modelo?: string;
  modeloPersonalizado?: string;
  ano?: string;
  color?: string;
  tipoPropulsion?: string;
  cupos?: number;
  numeroSoat?: string;
  vencimientoSoat?: string;
  fotoSoat?: string | null;
  assetSoat?: PhotoPickerAsset | null;
  numeroTecno?: string;
  vencimientoTecno?: string;
  fotoTecno?: string | null;
  assetTecno?: PhotoPickerAsset | null;
  requiereTecno?: boolean;
  numeroLicencia?: string;
  categoriaLicencia?: string;
  vencimientoLicencia?: string;
  fotoLicencia?: string | null;
  assetLicencia?: PhotoPickerAsset | null;
  aceptaTerminos: boolean;
  setAceptaTerminos: (acepta: boolean) => void;
  signatureSvgPath?: string;
  setSignatureSvgPath?: (svgPath: string) => void;
}

export function HabeasDataSignatureStep({
  tipoVehiculo = 'car',
  placa = '',
  marca = '',
  marcaPersonalizada = '',
  modelo = '',
  modeloPersonalizado = '',
  ano = '',
  color = '',
  tipoPropulsion = 'gasolina',
  cupos = 3,
  numeroSoat = '',
  vencimientoSoat = '',
  fotoSoat,
  assetSoat,
  numeroTecno = '',
  vencimientoTecno = '',
  fotoTecno,
  assetTecno,
  requiereTecno = false,
  numeroLicencia = '',
  categoriaLicencia = 'B1',
  vencimientoLicencia = '',
  fotoLicencia,
  assetLicencia,
  aceptaTerminos = false,
  setAceptaTerminos,
  signatureSvgPath = '',
  setSignatureSvgPath,
}: HabeasDataSignatureStepProps) {
  const isMoto = tipoVehiculo === 'motorcycle' || tipoVehiculo === 'moto';
  const marcaFinal = (marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca')
    ? (marcaPersonalizada?.trim() || 'Marca Particular')
    : marca;

  const modeloFinal = (typeof modelo === 'string' && (modelo.startsWith('Otro') || modelo === 'Otro Modelo'))
    ? (modeloPersonalizado?.trim() || 'Modelo Particular')
    : modelo;

  const insets = useSafeAreaInsets();

  // Estado del modal de firma
  const [modalFirmaAbierto, setModalFirmaAbierto] = useState(false);
  const [tempPaths, setTempPaths] = useState<string[]>([]);
  const tempCurrentPathRef = useRef<string>('');

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          tempCurrentPathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setTempPaths((prev) => [...prev, tempCurrentPathRef.current]);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          tempCurrentPathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setTempPaths((prev) => {
            const next = [...prev];
            next[next.length - 1] = tempCurrentPathRef.current;
            return next;
          });
        },
      }),
    []
  );

  const abrirModalFirma = () => {
    setTempPaths(signatureSvgPath ? [signatureSvgPath] : []);
    tempCurrentPathRef.current = '';
    setModalFirmaAbierto(true);
  };

  const cerrarModalFirma = () => {
    setModalFirmaAbierto(false);
  };

  const limpiarLienzoModal = () => {
    setTempPaths([]);
    tempCurrentPathRef.current = '';
  };

  const guardarFirmaModal = () => {
    if (setSignatureSvgPath) {
      setSignatureSvgPath(tempPaths.join(' '));
    }
    setModalFirmaAbierto(false);
  };

  const borrarFirma = () => {
    if (setSignatureSvgPath) {
      setSignatureSvgPath('');
    }
  };

  return (
    <View className="gap-3.5">
      {/* 1. FICHA COMPLETA DEL VEHÍCULO */}
      <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
        <View className="flex-row items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
              {isMoto ? <Bike size={18} color="#0284c7" /> : <Car size={18} color="#0284c7" />}
            </View>
            <View>
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Ficha del Vehículo
              </Text>
              <Text className="text-[10px] text-slate-400 capitalize">
                {isMoto ? 'Motocicleta' : 'Automóvil'} • {tipoPropulsion}
              </Text>
            </View>
          </View>

          <View className="px-2.5 py-1 rounded-xl bg-lochmara-50 dark:bg-slate-800 border border-lochmara-200 dark:border-slate-700">
            <Text className="text-xs font-mono font-black text-lochmara-700 dark:text-lochmara-300">
              {placa ? placa.toUpperCase() : 'SIN PLACA'}
            </Text>
          </View>
        </View>

        {/* Resumen en 2 columnas */}
        <View className="flex-row gap-2">
          <View className="flex-1 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400">Marca y Línea:</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white mt-0.5" numberOfLines={1}>
              {marcaFinal} {modeloFinal}
            </Text>
          </View>

          <View className="flex-1 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400">Año y Color:</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white mt-0.5" numberOfLines={1}>
              {ano} • {color}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400">Cupos Ofertados:</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
              {cupos} {cupos === 1 ? 'Cupo' : 'Cupos'}
            </Text>
          </View>

          <View className="flex-1 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400">Propulsión:</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white mt-0.5 capitalize">
              {tipoPropulsion}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. RESUMEN DE PÓLIZAS */}
      <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-2.5 shadow-xs">
        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          Pólizas y Documentación
        </Text>

        <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <Shield size={14} color="#0284c7" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[10px] font-bold text-slate-400">Póliza SOAT</Text>
                {assetSoat?.mimeType === 'application/pdf' ? (
                  <Text className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">PDF</Text>
                ) : (fotoSoat || assetSoat) ? (
                  <Text className="text-[9px] font-bold text-lochmara-500 bg-lochmara-50 dark:bg-lochmara-950/40 px-1.5 py-0.5 rounded">Foto</Text>
                ) : null}
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                No. {numeroSoat || 'N/A'}
              </Text>
            </View>
          </View>
          <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Vence: {vencimientoSoat || 'N/A'}
          </Text>
        </View>

        {requiereTecno ? (
          <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <FileCheck size={14} color="#f59e0b" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[10px] font-bold text-slate-400">Certificado RTM</Text>
                  {assetTecno?.mimeType === 'application/pdf' ? (
                    <Text className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">PDF</Text>
                  ) : (fotoTecno || assetTecno) ? (
                    <Text className="text-[9px] font-bold text-lochmara-500 bg-lochmara-50 dark:bg-lochmara-950/40 px-1.5 py-0.5 rounded">Foto</Text>
                  ) : null}
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  No. {numeroTecno || 'N/A'}
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Vence: {vencimientoTecno || 'N/A'}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <FileCheck size={14} color="#10b981" />
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                RTM Exenta por antigüedad
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Modelo {ano}
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <CreditCard size={14} color="#0284c7" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[10px] font-bold text-slate-400">
                  Licencia ({categoriaLicencia})
                </Text>
                {assetLicencia?.mimeType === 'application/pdf' ? (
                  <Text className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">PDF</Text>
                ) : (fotoLicencia || assetLicencia) ? (
                  <Text className="text-[9px] font-bold text-lochmara-500 bg-lochmara-50 dark:bg-lochmara-950/40 px-1.5 py-0.5 rounded">Foto</Text>
                ) : null}
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                No. {numeroLicencia || 'N/A'}
              </Text>
            </View>
          </View>
          <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Vence: {vencimientoLicencia || 'N/A'}
          </Text>
        </View>
      </View>

      {/* 3. FIRMA DIGITAL TÁCTIL */}
      <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color="#0284c7" />
            <Text className="text-xs font-black text-slate-900 dark:text-white">
              Firma Digital de Autorización
            </Text>
          </View>
          {signatureSvgPath ? (
            <View className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                Firmado
              </Text>
            </View>
          ) : (
            <View className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <Text className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                Pendiente
              </Text>
            </View>
          )}
        </View>

        <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Para autorizar la consulta de antecedentes y validación ante el RUNT, debes registrar tu firma digital.
        </Text>

        {/* Vista previa de firma o aviso de sin firma */}
        <View className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden justify-center items-center relative">
          {signatureSvgPath ? (
            <Svg height="100%" width="100%" className="absolute inset-0">
              <Path
                d={signatureSvgPath}
                stroke="#0284c7"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <View className="items-center gap-1">
              <PenTool size={20} color="#94a3b8" />
              <Text className="text-xs font-medium text-slate-400">
                Sin firma registrada
              </Text>
            </View>
          )}
        </View>

        {/* Botones de acción para firma */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={abrirModalFirma}
            className="flex-1 py-3 px-4 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-sm shadow-lochmara-600/30"
          >
            <PenTool size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">
              {signatureSvgPath ? 'Cambiar Firma' : 'Firmar'}
            </Text>
          </Pressable>

          {signatureSvgPath ? (
            <Pressable
              onPress={borrarFirma}
              hitSlop={8}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center"
            >
              <RotateCcw size={15} color="#64748b" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 4. CLÁUSULA DE HABEAS DATA Y CONSENTIMIENTO */}
      <View
        className={`p-4 rounded-3xl border gap-3 ${
          aceptaTerminos
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={16} color="#0284c7" />
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Tratamiento de Datos Personales (Ley 1581 de 2012)
          </Text>
        </View>

        <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Autorizo de manera voluntaria a UniWheels y a la institución educativa para validar la autenticidad de los documentos vehiculares en el RUNT, SIMIT y entidades de tránsito correspondientes.
        </Text>

        <Pressable
          onPress={() => setAceptaTerminos(!aceptaTerminos)}
          className="flex-row items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800"
        >
          {aceptaTerminos ? (
            <CheckSquare size={18} color="#10b981" />
          ) : (
            <Square size={18} color="#94a3b8" />
          )}
          <Text
            className={`text-xs font-bold flex-1 ${
              aceptaTerminos
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            He leído y acepto los Términos de Convivencia y Política de Tratamiento de Datos.
          </Text>
        </Pressable>
      </View>

      {/* Modal de firma: tarjeta centrada, mismo patrón que SosEmergencyModal. El
          lienzo vive fuera del ScrollView del wizard, así que el scroll no le roba
          el gesto. */}
      <Modal visible={modalFirmaAbierto} transparent animationType="fade" onRequestClose={cerrarModalFirma}>
        <View
          className="flex-1 bg-slate-950/80 items-center justify-center px-4"
          style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        >
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-4 shadow-2xl">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                <View className="w-9 h-9 rounded-2xl bg-lochmara-50 dark:bg-slate-800 border border-lochmara-200 dark:border-slate-700 items-center justify-center">
                  <PenTool size={16} color="#0284c7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    Firma Digital
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    Dibuja tu firma con el dedo dentro del recuadro
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={cerrarModalFirma}
                hitSlop={8}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <X size={15} color="#94a3b8" />
              </Pressable>
            </View>

            <View
              {...panResponder.panHandlers}
              style={{ height: 220 }}
              className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 items-center justify-center overflow-hidden"
            >
              {tempPaths.length === 0 && (
                <View pointerEvents="none" className="items-center gap-1.5 opacity-50">
                  <PenTool size={24} color="#64748b" />
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">Firma aquí</Text>
                </View>
              )}
              <Svg
                pointerEvents="none"
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                {tempPaths.map((d, index) => (
                  <Path
                    key={index}
                    d={d}
                    stroke="#0284c7"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={limpiarLienzoModal}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw size={14} color="#64748b" />
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Limpiar</Text>
              </Pressable>
              <Pressable
                onPress={guardarFirmaModal}
                disabled={tempPaths.length === 0}
                className={`flex-1 py-3 px-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                  tempPaths.length > 0 ? 'bg-lochmara-600 active:bg-lochmara-700' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <Check size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Guardar firma</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function RegistrationSuccessStep({
  placa,
  onComplete,
}: {
  placa?: string;
  onComplete: () => void;
}) {
  return (
    <View className="items-center py-6 gap-4">
      <View className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 items-center justify-center shadow-lg shadow-emerald-500/10">
        <CheckCircle2 size={32} color="#10b981" />
      </View>

      <View className="items-center gap-1">
        <Text className="text-lg font-black text-slate-900 dark:text-white text-center">
          ¡Solicitud Enviada para Aprobación!
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">
          Tu vehículo con placa{' '}
          <Text className="font-mono font-bold text-lochmara-600 dark:text-lochmara-400">
            {placa ? placa.toUpperCase() : ''}
          </Text>{' '}
          ha sido registrado. El equipo de Bienestar Universitario revisará tus documentos y te notificará en la app.
        </Text>
      </View>

      <View className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 w-full">
        <Text className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-0.5">
          Notificación Institucional
        </Text>
        <Text className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          Tus datos y pólizas han sido remitidos de forma segura al panel administrativo para la verificación oficial.
        </Text>
      </View>

      <Pressable
        onPress={onComplete}
        className="w-full py-3.5 rounded-2xl bg-lochmara-600 items-center justify-center shadow-md shadow-lochmara-600/30"
      >
        <Text className="text-xs font-bold text-white">Entendido, Volver al Inicio</Text>
      </Pressable>
    </View>
  );
}
