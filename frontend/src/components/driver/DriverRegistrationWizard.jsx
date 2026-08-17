import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService, vehicleService, parseBackendError } from '../../services/api';
import { vehicleApiService } from '../../services/vehicleApiService';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import { AlertBanner } from '../common/AlertBanner';
import { VehicleSpecsStep } from './wizard-steps/VehicleSpecsStep';
import { LegalDocumentsStep } from './wizard-steps/LegalDocumentsStep';
import { DriverLicenseStep } from './wizard-steps/DriverLicenseStep';
import { HabeasDataSignatureStep, RegistrationSuccessStep } from './wizard-steps/HabeasDataSignatureStep';
import { requiereTecnomecanica, haExpiradoFecha } from '../../utils/colombianVehicleRules';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const DriverRegistrationWizard = ({ onBack, onComplete }) => {
  const { user, updateDriverStatus, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [pasoActual, setPasoActual] = useState(1);

  // Paso 1: Vehículo
  const [tipoVehiculo, setTipoVehiculo] = useState('carro');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('Chevrolet');
  const [modelo, setModelo] = useState('');
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [ano, setAno] = useState('2022');
  const [color, setColor] = useState('Gris / Plata');
  const [tipoPropulsion, setTipoPropulsion] = useState('gasolina');
  const [cupos, setCupos] = useState(3);

  // Paso 2: SOAT & Tecno
  const [numeroSoat, setNumeroSoat] = useState('');
  const [vencimientoSoat, setVencimientoSoat] = useState('');
  const [fotoSoat, setFotoSoat] = useState(null);
  const [numeroTecno, setNumeroTecno] = useState('');
  const [vencimientoTecno, setVencimientoTecno] = useState('');
  const [fotoTecno, setFotoTecno] = useState(null);

  // Paso 3: Licencia
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [categoriaLicencia, setCategoriaLicencia] = useState('B1');
  const [vencimientoLicencia, setVencimientoLicencia] = useState('');
  const [fotoLicencia, setFotoLicencia] = useState(null);

  // Paso 4: Aceptación
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [estaEnviando, setEstaEnviando] = useState(false);

  // Modal para captura de fotos de documentos
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [configFotoActual, setConfigFotoActual] = useState({
    tipo: 'soat',
    titulo: 'Póliza SOAT',
    subtitulo: 'Asegúrate de que el número y la fecha de vencimiento sean legibles',
    cameraLabel: 'Tomar Foto del SOAT',
    galleryLabel: 'Subir Póliza SOAT',
  });

  const requiereTecno = requiereTecnomecanica(tipoVehiculo, ano);

  useEffect(() => {
    let activo = true;
    setCargandoModelos(true);
    vehicleApiService.getModelsForMake(marca).then((modelos) => {
      if (!activo) return;
      setCargandoModelos(false);
      if (modelos && modelos.length > 0) {
        setModelosDisponibles(modelos);
        setModelo(modelos[0]);
      }
    });
    return () => {
      activo = false;
    };
  }, [marca]);

  useEffect(() => {
    setCategoriaLicencia(tipoVehiculo === 'moto' ? 'A2' : 'B1');
  }, [tipoVehiculo]);

  const abrirSelectorFoto = (tipo) => {
    if (tipo === 'soat') {
      setConfigFotoActual({
        tipo: 'soat',
        titulo: 'Póliza SOAT',
        subtitulo: 'Asegúrate de que el número y la fecha de vencimiento sean legibles',
        cameraLabel: 'Tomar Foto del SOAT',
        galleryLabel: 'Subir Póliza SOAT',
      });
    } else if (tipo === 'tecno') {
      setConfigFotoActual({
        tipo: 'tecno',
        titulo: 'Revisión Técnico-Mecánica (RTM)',
        subtitulo: 'Sube la foto del certificado expedido por el CDA autorizado',
        cameraLabel: 'Tomar Foto del CDA',
        galleryLabel: 'Subir Certificado RTM',
      });
    } else if (tipo === 'licencia') {
      setConfigFotoActual({
        tipo: 'licencia',
        titulo: 'Licencia de Conducción',
        subtitulo: 'Fotografía legible del frente de tu licencia',
        cameraLabel: 'Tomar Foto de Licencia',
        galleryLabel: 'Subir Foto de Licencia',
      });
    }
    setModalFotoAbierto(true);
  };

  const handleFotoSeleccionada = (dataUrl) => {
    if (configFotoActual.tipo === 'soat') setFotoSoat(dataUrl);
    if (configFotoActual.tipo === 'tecno') setFotoTecno(dataUrl);
    if (configFotoActual.tipo === 'licencia') setFotoLicencia(dataUrl);
    setModalFotoAbierto(false);
  };

  const validarPaso = () => {
    setMensajeError('');
    if (pasoActual === 1) {
      if (!placa || placa.length < 5) {
        setMensajeError('Por favor ingresa una placa válida.');
        return false;
      }
      if (!modelo) {
        setMensajeError('Por favor selecciona la línea o modelo de tu vehículo.');
        return false;
      }
    }
    if (pasoActual === 2) {
      if (!numeroSoat || !vencimientoSoat) {
        setMensajeError('Debes ingresar el número y la fecha de vencimiento del SOAT.');
        return false;
      }
      if (haExpiradoFecha(vencimientoSoat)) {
        setMensajeError('La póliza SOAT ingresada se encuentra vencida.');
        return false;
      }
      if (requiereTecno && (!numeroTecno || !vencimientoTecno)) {
        setMensajeError('Tu vehículo requiere Revisión Técnico-Mecánica obligatoria.');
        return false;
      }
    }
    if (pasoActual === 3) {
      if (!numeroLicencia || !vencimientoLicencia) {
        setMensajeError('Debes ingresar el número y fecha de vencimiento de tu licencia.');
        return false;
      }
      if (haExpiradoFecha(vencimientoLicencia)) {
        setMensajeError('Tu licencia de conducción se encuentra vencida.');
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

    try {
      await authService.registerDriver({
        vehicle_type: tipoVehiculo,
        plate_number: placa.toUpperCase(),
        brand: marca,
        model_line: modelo,
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
      });

      await vehicleService.registerVehicle({
        user_id: user?.id,
        vehicle_type: tipoVehiculo,
        plate_number: placa.toUpperCase(),
        brand: marca,
        model_line: modelo,
        year: parseInt(ano, 10),
        color,
        propulsion_type: tipoPropulsion,
        available_seats: cupos,
      });

      updateDriverStatus(true);
      setPasoActual(5);
    } catch (err) {
      setMensajeError(parseBackendError(err));
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <div className={`flex-1 h-full flex flex-col justify-between select-none overflow-hidden transition-colors ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. BARRA SUPERIOR */}
      <div className="pt-4 px-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={retrocederPaso}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Paso {pasoActual} de 4</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((p) => (
              <span
                key={p}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  pasoActual === p ? 'w-6 bg-lochmara-600' : isDark ? 'w-2 bg-slate-800' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. CUERPO DEL ASISTENTE */}
      <div className="px-6 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-2 overflow-y-auto">
        <div className="space-y-3.5">
          <div className="space-y-0.5 text-center sm:text-left">
            <h2 className="text-xl font-black tracking-tight">
              {pasoActual === 1 && 'Ficha de tu Vehículo'}
              {pasoActual === 2 && 'Pólizas y Normativa'}
              {pasoActual === 3 && 'Licencia de Conducción'}
              {pasoActual === 4 && 'Confirmación y Firma'}
              {pasoActual === 5 && '¡Solicitud Registrada!'}
            </h2>
            <p className="text-xs text-slate-400">
              {pasoActual === 1 && 'Información básica de tu carro o motocicleta'}
              {pasoActual === 2 && 'Validación de SOAT y Revisión Técnico-Mecánica'}
              {pasoActual === 3 && 'Documento de identidad de conducción vigente'}
              {pasoActual === 4 && 'Aceptación de protocolo de seguridad universitaria'}
            </p>
          </div>

          <AlertBanner
            type="error"
            message={mensajeError}
            isOpen={!!mensajeError}
            onClose={() => setMensajeError('')}
          />

          {pasoActual === 1 && (
            <VehicleSpecsStep
              tipoVehiculo={tipoVehiculo}
              setTipoVehiculo={setTipoVehiculo}
              placa={placa}
              setPlaca={setPlaca}
              marca={marca}
              setMarca={setMarca}
              modelo={modelo}
              setModelo={setModelo}
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
              isDark={isDark}
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
              isDark={isDark}
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
              isDark={isDark}
            />
          )}

          {pasoActual === 4 && (
            <HabeasDataSignatureStep
              placa={placa}
              marca={marca}
              modelo={modelo}
              ano={ano}
              color={color}
              cupos={cupos}
              vencimientoSoat={vencimientoSoat}
              vencimientoLicencia={vencimientoLicencia}
              aceptaTerminos={aceptaTerminos}
              setAceptaTerminos={setAceptaTerminos}
              isDark={isDark}
            />
          )}

          {pasoActual === 5 && (
            <RegistrationSuccessStep
              placa={placa}
              onComplete={onComplete}
            />
          )}
        </div>
      </div>

      {/* 3. BOTONES DE NAVEGACIÓN INFERIOR */}
      {pasoActual < 5 && (
        <div className="p-4 px-6 max-w-sm mx-auto w-full">
          {pasoActual < 4 ? (
            <button
              type="button"
              onClick={avanzarPaso}
              className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-lochmara-600/30 cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={estaEnviando || !aceptaTerminos}
              onClick={enviarRegistroConductor}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {estaEnviando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Solicitud...</span>
                </>
              ) : (
                <span>Enviar para Validación</span>
              )}
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CAPTURA DE FOTOS */}
      <PhotoPickerModal
        isOpen={modalFotoAbierto}
        onClose={() => setModalFotoAbierto(false)}
        title={configFotoActual.titulo}
        subtitle={configFotoActual.subtitulo}
        cameraLabel={configFotoActual.cameraLabel}
        galleryLabel={configFotoActual.galleryLabel}
        onPhotoSelected={handleFotoSeleccionada}
      />
    </div>
  );
};
