import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import {
  authService,
  vehicleService,
  parseBackendError,
  useAppStore,
  validarPlacaColombiana,
  requiereTecnomecanica,
  haExpiradoFecha,
} from '@uniwheels/shared';
import { PhotoPickerModal } from '@/components/PhotoPickerModal';
import { AlertBanner } from '@/components/AlertBanner';
import { VehicleSpecsStep } from './wizard-steps/VehicleSpecsStep';
import { LegalDocumentsStep } from './wizard-steps/LegalDocumentsStep';
import { DriverLicenseStep } from './wizard-steps/DriverLicenseStep';
import {
  HabeasDataSignatureStep,
  RegistrationSuccessStep,
} from './wizard-steps/HabeasDataSignatureStep';

export interface DriverRegistrationWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

export function DriverRegistrationWizard({ onBack, onComplete }: DriverRegistrationWizardProps) {
  const { updateDriverStatus } = useAppStore();

  const [pasoActual, setPasoActual] = useState(1);

  // Paso 1: Vehículo
  const [tipoVehiculo, setTipoVehiculo] = useState<'car' | 'motorcycle'>('car');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('Chevrolet');
  const [marcaPersonalizada, setMarcaPersonalizada] = useState('');
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [modelo, setModelo] = useState('');
  const [modeloPersonalizado, setModeloPersonalizado] = useState('');
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [ano, setAno] = useState('2022');
  const [color, setColor] = useState('Gris / Plata');
  const [tipoPropulsion, setTipoPropulsion] = useState('gasolina');
  const [cupos, setCupos] = useState(3);
  const [hasExtraHelmet, setHasExtraHelmet] = useState(true);

  // Paso 2: SOAT & Tecno
  const [numeroSoat, setNumeroSoat] = useState('');
  const [vencimientoSoat, setVencimientoSoat] = useState('');
  const [fotoSoat, setFotoSoat] = useState<string | null>(null);
  const [numeroTecno, setNumeroTecno] = useState('');
  const [vencimientoTecno, setVencimientoTecno] = useState('');
  const [fotoTecno, setFotoTecno] = useState<string | null>(null);

  // Paso 3: Licencia
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [categoriaLicencia, setCategoriaLicencia] = useState('B1');
  const [vencimientoLicencia, setVencimientoLicencia] = useState('');
  const [fotoLicencia, setFotoLicencia] = useState<string | null>(null);

  // Paso 4: Firma y Aceptación
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [signatureSvgPath, setSignatureSvgPath] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [estaEnviando, setEstaEnviando] = useState(false);

  // Modal para captura de fotos de documentos
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [configFotoActual, setConfigFotoActual] = useState({
    tipo: 'soat' as 'soat' | 'tecno' | 'licencia',
    titulo: 'Póliza SOAT',
    subtitulo: 'Asegúrate de que el número y la fecha de vencimiento sean legibles',
  });

  const requiereTecno = requiereTecnomecanica(tipoVehiculo, ano);

  // Cargar marcas del catálogo si están disponibles en backend
  useEffect(() => {
    let activo = true;
    setCargandoMarcas(true);
    vehicleService.getCatalogBrands(tipoVehiculo).then((marcas: any) => {
      if (!activo) return;
      setCargandoMarcas(false);
      if (Array.isArray(marcas) && marcas.length > 0) {
        const nombresMarcas = marcas.map((m: any) => (typeof m === 'string' ? m : m.name || m.brand));
        setMarcasDisponibles(nombresMarcas);
        const marcaDefault = tipoVehiculo === 'motorcycle' ? 'Yamaha' : 'Chevrolet';
        const marcaEncontrada = nombresMarcas.find(
          (m: string) => m.toLowerCase() === marcaDefault.toLowerCase()
        );
        if (marcaEncontrada) {
          setMarca(marcaEncontrada);
        } else {
          setMarca(nombresMarcas[0]);
        }
      } else {
        setMarcasDisponibles([]);
      }
    }).catch(() => {
      if (activo) {
        setCargandoMarcas(false);
        setMarcasDisponibles([]);
      }
    });
    return () => {
      activo = false;
    };
  }, [tipoVehiculo]);

  // Cargar modelos según la marca seleccionada
  useEffect(() => {
    let activo = true;
    const esPersonalizada = marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca';
    if (esPersonalizada || !marca) {
      setModelosDisponibles([]);
      setModelo('');
      setCargandoModelos(false);
      return;
    }

    setCargandoModelos(true);
    vehicleService.getCatalogModels(marca).then((modelos: any) => {
      if (!activo) return;
      setCargandoModelos(false);
      if (Array.isArray(modelos) && modelos.length > 0) {
        const nombresModelos = modelos.map((mod: any) => (typeof mod === 'string' ? mod : mod.name || mod.model));
        setModelosDisponibles(nombresModelos);
        setModelo(nombresModelos[0] || '');
      } else {
        setModelosDisponibles([]);
        setModelo('');
      }
    }).catch(() => {
      if (activo) {
        setCargandoModelos(false);
        setModelosDisponibles([]);
        setModelo('');
      }
    });
    return () => {
      activo = false;
    };
  }, [marca]);

  useEffect(() => {
    setCategoriaLicencia(tipoVehiculo === 'motorcycle' ? 'A2' : 'B1');
    setCupos(tipoVehiculo === 'motorcycle' ? 1 : 3);
  }, [tipoVehiculo]);

  const abrirSelectorFoto = (tipo: 'soat' | 'tecno' | 'licencia') => {
    if (tipo === 'soat') {
      setConfigFotoActual({
        tipo: 'soat',
        titulo: 'Póliza SOAT',
        subtitulo: 'Asegúrate de que el número y la fecha de vencimiento sean legibles',
      });
    } else if (tipo === 'tecno') {
      setConfigFotoActual({
        tipo: 'tecno',
        titulo: 'Revisión Técnico-Mecánica (RTM)',
        subtitulo: 'Sube la foto del certificado expedido por el CDA autorizado',
      });
    } else if (tipo === 'licencia') {
      setConfigFotoActual({
        tipo: 'licencia',
        titulo: 'Licencia de Conducción',
        subtitulo: 'Fotografía legible del frente de tu licencia',
      });
    }
    setModalFotoAbierto(true);
  };

  const handleFotoSeleccionada = (dataUrl: string) => {
    if (configFotoActual.tipo === 'soat') setFotoSoat(dataUrl);
    if (configFotoActual.tipo === 'tecno') setFotoTecno(dataUrl);
    if (configFotoActual.tipo === 'licencia') setFotoLicencia(dataUrl);
    setModalFotoAbierto(false);
  };

  const validarPaso = () => {
    setMensajeError('');
    if (pasoActual === 1) {
      const validacionPlaca = validarPlacaColombiana(placa, tipoVehiculo);
      if (!validacionPlaca.valida) {
        setMensajeError(validacionPlaca.error || 'Por favor ingresa una placa vehicular colombiana válida.');
        return false;
      }
      if ((marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca') && !marcaPersonalizada.trim()) {
        setMensajeError('Por favor escribe la marca de tu vehículo.');
        return false;
      }
      if (!modelo || (modelo.startsWith('Otro') && !modeloPersonalizado.trim())) {
        setMensajeError('Por favor selecciona o escribe el modelo de tu vehículo.');
        return false;
      }
      if (tipoVehiculo === 'motorcycle' && !hasExtraHelmet) {
        setMensajeError('Para registrar una motocicleta debes contar con un casco adicional reglamentario.');
        return false;
      }
    }

    if (pasoActual === 2) {
      if (!numeroSoat || numeroSoat.trim().length < 3) {
        setMensajeError('Debes ingresar el número de tu póliza SOAT.');
        return false;
      }
      if (!vencimientoSoat) {
        setMensajeError('Debes seleccionar la fecha de vencimiento de tu póliza SOAT.');
        return false;
      }
      if (haExpiradoFecha(vencimientoSoat)) {
        setMensajeError('La póliza SOAT ingresada se encuentra vencida. Debe tener fecha futura.');
        return false;
      }
      if (requiereTecno) {
        if (!numeroTecno || numeroTecno.trim().length < 3) {
          setMensajeError('Debes ingresar el número de certificado de la Revisión Técnico-Mecánica (RTM).');
          return false;
        }
        if (!vencimientoTecno) {
          setMensajeError('Debes seleccionar la fecha de vencimiento de la Revisión Técnico-Mecánica (RTM).');
          return false;
        }
        if (haExpiradoFecha(vencimientoTecno)) {
          setMensajeError('El certificado de Revisión Técnico-Mecánica (RTM) se encuentra vencido.');
          return false;
        }
      }
    }

    if (pasoActual === 3) {
      if (!numeroLicencia || numeroLicencia.trim().length < 3) {
        setMensajeError('Debes ingresar el número de tu licencia de conducción.');
        return false;
      }
      if (!vencimientoLicencia) {
        setMensajeError('Debes seleccionar la fecha de vencimiento de tu licencia de conducción.');
        return false;
      }
      if (haExpiradoFecha(vencimientoLicencia)) {
        setMensajeError('Tu licencia de conducción se encuentra vencida. Debe tener vigencia activa.');
        return false;
      }
    }

    return true;
  };

  const avanzarPaso = () => {
    if (validarPaso()) {
      setPasoActual((prev) => prev + 1);
    }
  };

  const retrocederPaso = () => {
    setMensajeError('');
    if (pasoActual > 1) {
      setPasoActual((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const enviarRegistroConductor = async () => {
    if (!aceptaTerminos) {
      setMensajeError('Debes aceptar los términos y política de tratamiento de datos.');
      return;
    }

    setEstaEnviando(true);
    setMensajeError('');

    const marcaFinal = (marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca')
      ? (marcaPersonalizada.trim() || 'Marca Particular')
      : marca;
    const modeloFinal = (typeof modelo === 'string' && (modelo.startsWith('Otro') || modelo === 'Otro Modelo'))
      ? (modeloPersonalizado.trim() || 'Modelo Particular')
      : (modelo || 'Línea Estándar');

    const datosPayload = {
      vehicle_type: tipoVehiculo === 'motorcycle' ? 'moto' : 'carro',
      plate_number: placa.toUpperCase(),
      brand: marcaFinal,
      model_line: modeloFinal,
      year: parseInt(ano, 10),
      color,
      propulsion_type: tipoPropulsion,
      available_seats: cupos,
      soat_number: numeroSoat,
      soat_expires_at: vencimientoSoat,
      rtm_number: requiereTecno ? numeroTecno : null,
      rtm_expires_at: requiereTecno ? vencimientoTecno : null,
      driver_license_number: numeroLicencia,
      driver_license_category: categoriaLicencia,
      driver_license_expires_at: vencimientoLicencia,
      has_extra_helmet: tipoVehiculo === 'motorcycle' ? hasExtraHelmet : true,
    };

    try {
      try {
        await authService.registerDriver(datosPayload);
      } catch (authErr) {
        console.warn('Notice from authService registerDriver:', authErr);
      }

      const respuestaVehiculo = await vehicleService.registerVehicle({
        vehicle_type: tipoVehiculo === 'motorcycle' ? 'moto' : 'carro',
        plate_number: placa.toUpperCase(),
        brand: marcaFinal,
        model_line: modeloFinal,
        year: parseInt(ano, 10),
        color,
        propulsion_type: tipoPropulsion,
        available_seats: cupos,
      });

      const vehiculoId = respuestaVehiculo?.data?.id || respuestaVehiculo?.id;

      if (vehiculoId) {
        if (fotoSoat) {
          try {
            await vehicleService.uploadVehicleDocument(vehiculoId, 'soat', fotoSoat, 'soat.jpg', 'image/jpeg');
          } catch (docErr) {
            console.warn('Error subiendo foto SOAT:', docErr);
          }
        }

        if (requiereTecno && fotoTecno) {
          try {
            await vehicleService.uploadVehicleDocument(
              vehiculoId,
              'revision_tecnico_mecanica',
              fotoTecno,
              'rtm.jpg',
              'image/jpeg'
            );
          } catch (docErr) {
            console.warn('Error subiendo foto RTM:', docErr);
          }
        }

        if (fotoLicencia) {
          try {
            await vehicleService.uploadVehicleDocument(
              vehiculoId,
              'licencia_conduccion',
              fotoLicencia,
              'licencia.jpg',
              'image/jpeg'
            );
          } catch (docErr) {
            console.warn('Error subiendo foto Licencia:', docErr);
          }
        }
      }

      updateDriverStatus('pending', datosPayload);
      setPasoActual(5);
    } catch (err: any) {
      setMensajeError(parseBackendError(err));
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 1. BARRA SUPERIOR DE NAVEGACIÓN Y PROGRESO */}
        <View className="pt-2 px-4 pb-3 flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={retrocederPaso}
            className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center active:scale-95"
          >
            <ArrowLeft size={18} color="#64748b" />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Paso {Math.min(pasoActual, 4)} de 4
            </Text>
            <View className="flex-row items-center gap-1.5">
              {[1, 2, 3, 4].map((p) => (
                <View
                  key={p}
                  className={`h-1.5 rounded-full ${
                    pasoActual === p
                      ? 'w-6 bg-lochmara-600'
                      : pasoActual > p
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-800'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 2. CUERPO DEL ASISTENTE */}
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900 dark:text-white">
              {pasoActual === 1 && 'Ficha de tu Vehículo'}
              {pasoActual === 2 && 'Pólizas y Normativa'}
              {pasoActual === 3 && 'Licencia de Conducción'}
              {pasoActual === 4 && 'Confirmación y Firma'}
              {pasoActual === 5 && '¡Solicitud Registrada!'}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pasoActual === 1 && 'Información básica de tu carro o moto'}
              {pasoActual === 2 && 'Validación de SOAT y Revisión Técnico-Mecánica'}
              {pasoActual === 3 && 'Documento de identidad de conducción vigente'}
              {pasoActual === 4 && 'Aceptación de protocolo de seguridad universitaria'}
            </Text>
          </View>

          {mensajeError ? (
            <View className="mb-4">
              <AlertBanner
                type="error"
                message={mensajeError}
                onClose={() => setMensajeError('')}
              />
            </View>
          ) : null}

          {pasoActual === 1 && (
            <VehicleSpecsStep
              tipoVehiculo={tipoVehiculo}
              setTipoVehiculo={setTipoVehiculo}
              placa={placa}
              setPlaca={setPlaca}
              marca={marca}
              setMarca={setMarca}
              marcaPersonalizada={marcaPersonalizada}
              setMarcaPersonalizada={setMarcaPersonalizada}
              marcasDisponibles={marcasDisponibles}
              cargandoMarcas={cargandoMarcas}
              modelo={modelo}
              setModelo={setModelo}
              modeloPersonalizado={modeloPersonalizado}
              setModeloPersonalizado={setModeloPersonalizado}
              modelosDisponibles={modelosDisponibles}
              cargandoModelos={cargandoModelos}
              ano={ano}
              setAno={setAno}
              color={color}
              setColor={setColor}
              tipoPropulsion={tipoPropulsion}
              setTipoPropulsion={setTipoPropulsion}
              cupos={cupos}
              setCupos={setCupos}
              hasExtraHelmet={hasExtraHelmet}
              setHasExtraHelmet={setHasExtraHelmet}
            />
          )}

          {pasoActual === 2 && (
            <LegalDocumentsStep
              numeroSoat={numeroSoat}
              setNumeroSoat={setNumeroSoat}
              vencimientoSoat={vencimientoSoat}
              setVencimientoSoat={setVencimientoSoat}
              fotoSoat={fotoSoat}
              numeroTecno={numeroTecno}
              setNumeroTecno={setNumeroTecno}
              vencimientoTecno={vencimientoTecno}
              setVencimientoTecno={setVencimientoTecno}
              fotoTecno={fotoTecno}
              requiereTecno={requiereTecno}
              ano={ano}
              tipoVehiculo={tipoVehiculo}
              abrirSelectorFoto={abrirSelectorFoto}
            />
          )}

          {pasoActual === 3 && (
            <DriverLicenseStep
              numeroLicencia={numeroLicencia}
              setNumeroLicencia={setNumeroLicencia}
              categoriaLicencia={categoriaLicencia}
              setCategoriaLicencia={setCategoriaLicencia}
              vencimientoLicencia={vencimientoLicencia}
              setVencimientoLicencia={setVencimientoLicencia}
              fotoLicencia={fotoLicencia}
              tipoVehiculo={tipoVehiculo}
              abrirSelectorFoto={abrirSelectorFoto}
            />
          )}

          {pasoActual === 4 && (
            <HabeasDataSignatureStep
              tipoVehiculo={tipoVehiculo}
              placa={placa}
              marca={marca}
              marcaPersonalizada={marcaPersonalizada}
              modelo={modelo}
              modeloPersonalizado={modeloPersonalizado}
              ano={ano}
              color={color}
              tipoPropulsion={tipoPropulsion}
              cupos={cupos}
              numeroSoat={numeroSoat}
              vencimientoSoat={vencimientoSoat}
              numeroTecno={numeroTecno}
              vencimientoTecno={vencimientoTecno}
              requiereTecno={requiereTecno}
              numeroLicencia={numeroLicencia}
              categoriaLicencia={categoriaLicencia}
              vencimientoLicencia={vencimientoLicencia}
              aceptaTerminos={aceptaTerminos}
              setAceptaTerminos={setAceptaTerminos}
              signatureSvgPath={signatureSvgPath}
              setSignatureSvgPath={setSignatureSvgPath}
            />
          )}

          {pasoActual === 5 && (
            <RegistrationSuccessStep placa={placa} onComplete={onComplete} />
          )}
        </ScrollView>

        {/* 3. BOTONES DE ACCIÓN INFERIOR */}
        {pasoActual < 5 && (
          <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {pasoActual < 4 ? (
              <Pressable
                onPress={avanzarPaso}
                className="w-full py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2 active:bg-lochmara-700 shadow-md shadow-lochmara-600/30"
              >
                <Text className="text-xs font-bold text-white">Continuar</Text>
                <ArrowRight size={16} color="#ffffff" />
              </Pressable>
            ) : (
              <Pressable
                disabled={estaEnviando || !aceptaTerminos}
                onPress={enviarRegistroConductor}
                className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md ${
                  estaEnviando || !aceptaTerminos
                    ? 'bg-emerald-600/50'
                    : 'bg-emerald-600 active:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {estaEnviando ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Enviando Solicitud...</Text>
                  </>
                ) : (
                  <Text className="text-xs font-bold text-white">Enviar para Validación</Text>
                )}
              </Pressable>
            )}
          </View>
        )}

        {/* Modal de Cámara / Galería para fotos */}
        <PhotoPickerModal
          isOpen={modalFotoAbierto}
          onClose={() => setModalFotoAbierto(false)}
          title={configFotoActual.titulo}
          subtitle={configFotoActual.subtitulo}
          onPhotoSelected={handleFotoSeleccionada}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
