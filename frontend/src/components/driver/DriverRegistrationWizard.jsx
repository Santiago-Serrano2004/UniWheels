import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  vehicleApiService,
  MARCAS_COLOMBIA_CARROS,
  MARCAS_COLOMBIA_MOTOS,
} from '../../services/vehicleApiService';
import { ColombianPlateInput } from './ColombianPlateInput';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import {
  Car,
  Bike,
  FileCheck,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  Calendar,
  FileText,
  Trash2,
  Loader2,
  Info,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DriverRegistrationWizard = ({ onBack, onComplete }) => {
  const { user, updateDriverStatus } = useAppStore();

  // Fecha actual en formato YYYY-MM-DD para validación de vigencias
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Paso del asistente: 1 (Vehículo) | 2 (SOAT & Tecno) | 3 (Licencia) | 4 (Revisión & Firma) | 5 (Éxito)
  const [pasoActual, setPasoActual] = useState(1);

  // Paso 1: Vehículo
  const [tipoVehiculo, setTipoVehiculo] = useState('carro'); // 'carro' | 'moto'
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('Chevrolet');
  const [modelo, setModelo] = useState('');
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [ano, setAno] = useState('2022');
  const [color, setColor] = useState('Gris / Plata');
  const [tipoPropulsion, setTipoPropulsion] = useState('gasolina'); // 'gasolina' | 'hibrido' | 'electrico' | 'diesel'
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

  const colores = ['Gris / Plata', 'Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Otro'];
  const anos = Array.from({ length: 15 }, (_, i) => String(2026 - i));

  const institutionLabel = user?.institution?.code || user?.institution || 'Institución Universitaria';

  /**
   * Lógica Legal de Revisión Técnico-Mecánica (RTM) en Colombia
   * (Ley 2294 de 2023 / Ley 769 de 2002 / Ley 1964 de 2019):
   * - Carros particulares (Gasolina, Diésel, Híbridos y Eléctricos):
   *   Primera RTM a los 5 años desde matrícula. Año 2026: Años <= 2021 requieren RTM OBLIGATORIA.
   *   Años >= 2022 están exentos por ley.
   * - Motocicletas:
   *   Primera RTM a los 2 años. Año 2026: Años <= 2024 requieren RTM OBLIGATORIA.
   *   Años 2025 y 2026 están exentas.
   */
  const requiereTecnomecanica = () => {
    const anioActual = 2026;
    const anioVehiculo = Number(ano);
    if (isNaN(anioVehiculo)) return false;

    if (tipoVehiculo === 'carro') {
      return anioActual - anioVehiculo >= 5;
    } else {
      return anioActual - anioVehiculo >= 2;
    }
  };

  // Cargar modelos de la marca desde NHTSA API con caché diaria de 24h
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

  // Al cambiar tipo de vehículo, actualizar categoría de licencia sugerida
  useEffect(() => {
    if (tipoVehiculo === 'moto') {
      setCategoriaLicencia('A2');
    } else {
      setCategoriaLicencia('B1');
    }
  }, [tipoVehiculo]);

  // Abrir selector de foto para documento específico
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
        titulo: 'Certificado Técnico-Mecánico (RTM)',
        subtitulo: 'Fotografía el certificado de revisión preventiva emitido por el CDA',
        cameraLabel: 'Tomar Foto de la Tecno',
        galleryLabel: 'Subir Certificado RTM',
      });
    } else if (tipo === 'licencia') {
      setConfigFotoActual({
        tipo: 'licencia',
        titulo: 'Licencia de Conducción',
        subtitulo: 'Captura el frente de tu licencia de conducción vigente',
        cameraLabel: 'Tomar Foto de la Licencia',
        galleryLabel: 'Subir Foto de la Licencia',
      });
    }
    setModalFotoAbierto(true);
  };

  const guardarFotoDocumento = (fotoDataUrl) => {
    if (configFotoActual.tipo === 'soat') setFotoSoat(fotoDataUrl);
    if (configFotoActual.tipo === 'tecno') setFotoTecno(fotoDataUrl);
    if (configFotoActual.tipo === 'licencia') setFotoLicencia(fotoDataUrl);
  };

  // VALIDACIONES PASO 1 (Vehículo)
  const validarPaso1 = (e) => {
    e.preventDefault();
    setMensajeError('');
    const placaLimpia = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (tipoVehiculo === 'carro') {
      const regexCarro = /^[A-Z]{3}\d{3}$/;
      if (!regexCarro.test(placaLimpia)) {
        setMensajeError('La placa de automóvil debe tener exactamente 3 letras y 3 números (Ej: KLU492).');
        return;
      }
    } else {
      const regexMoto = /^[A-Z]{3}\d{2}[A-Z]$|^[A-Z]{3}\d{3}$/;
      if (!regexMoto.test(placaLimpia)) {
        setMensajeError('La placa de motocicleta debe tener 3 letras, 2 números y 1 letra (Ej: WYX81D).');
        return;
      }
    }

    if (!modelo || !modelo.trim()) {
      setMensajeError('Por favor selecciona el modelo de tu vehículo.');
      return;
    }

    setPasoActual(2);
  };

  // VALIDACIONES PASO 2 (SOAT & Tecnomecánica)
  const validarPaso2 = (e) => {
    e.preventDefault();
    setMensajeError('');

    // Validación número SOAT (6 a 20 alfanumérico)
    const regexSoat = /^[A-Z0-9-]{6,20}$/i;
    const soatLimpio = numeroSoat.trim();
    if (!regexSoat.test(soatLimpio)) {
      setMensajeError('El número de póliza SOAT debe contener entre 6 y 20 caracteres alfanuméricos.');
      return;
    }

    // Validación fecha vencimiento SOAT (Debe ser estrictamente futura)
    if (!vencimientoSoat) {
      setMensajeError('Por favor ingresa la fecha de vencimiento de la póliza SOAT.');
      return;
    }

    if (vencimientoSoat <= fechaHoy) {
      setMensajeError('La póliza SOAT se encuentra vencida. Debe estar vigente para poder registrarte como conductor.');
      return;
    }

    if (!fotoSoat) {
      setMensajeError('Debes adjuntar la foto o captura digital de tu póliza SOAT.');
      return;
    }

    // Si el vehículo supera la antigüedad legal, la RTM es obligatoria
    if (requiereTecnomecanica()) {
      const tecnoLimpia = numeroTecno.trim();
      if (!regexSoat.test(tecnoLimpia)) {
        setMensajeError('El número de certificado de Tecnomecánica (RTM) debe contener entre 6 y 20 caracteres.');
        return;
      }

      if (!vencimientoTecno) {
        setMensajeError('Debes ingresar la fecha de vencimiento de la Revisión Técnico-Mecánica.');
        return;
      }

      if (vencimientoTecno <= fechaHoy) {
        setMensajeError('El certificado de Revisión Técnico-Mecánica se encuentra vencido. Debe estar vigente.');
        return;
      }

      if (!fotoTecno) {
        setMensajeError('Debes adjuntar la foto del Certificado de Revisión Técnico-Mecánica (RTM).');
        return;
      }
    }

    setPasoActual(3);
  };

  // VALIDACIONES PASO 3 (Licencia de Conducción)
  const validarPaso3 = (e) => {
    e.preventDefault();
    setMensajeError('');

    // Validación número de licencia (6 a 12 dígitos numéricos)
    const regexLicencia = /^\d{6,12}$/;
    const licenciaLimpia = numeroLicencia.trim();
    if (!regexLicencia.test(licenciaLimpia)) {
      setMensajeError('El número de licencia de conducción debe tener entre 6 y 12 dígitos numéricos (tu número de documento).');
      return;
    }

    // Validación categoría coherente
    if (tipoVehiculo === 'moto' && !['A1', 'A2'].includes(categoriaLicencia)) {
      setMensajeError('Para conducir motocicleta se requiere licencia de categoría A1 o A2.');
      return;
    }

    if (tipoVehiculo === 'carro' && ['A1', 'A2'].includes(categoriaLicencia)) {
      setMensajeError('Para conducir automóvil se requiere licencia de categoría B1, B2, C1, C2 o C3.');
      return;
    }

    // Validación fecha vencimiento Licencia (Debe ser estrictamente futura)
    if (!vencimientoLicencia) {
      setMensajeError('Por favor indica la fecha de vencimiento de tu licencia de conducción.');
      return;
    }

    if (vencimientoLicencia <= fechaHoy) {
      setMensajeError('Tu licencia de conducción se encuentra vencida. Renuévala ante el organismo de tránsito para registrarte.');
      return;
    }

    if (!fotoLicencia) {
      setMensajeError('Debes adjuntar la foto frontal de tu licencia de conducción.');
      return;
    }

    setPasoActual(4);
  };

  // FINALIZAR Y ENVIAR REGISTRO
  const finalizarRegistroConductor = (e) => {
    e.preventDefault();
    setMensajeError('');

    if (!aceptaTerminos) {
      setMensajeError('Debes aceptar la declaración jurada y autorización de tratamiento de datos bajo la Ley 1581.');
      return;
    }

    setEstaEnviando(true);

    setTimeout(() => {
      setEstaEnviando(false);
      updateDriverStatus('approved', {
        vehicle: {
          type: tipoVehiculo,
          plate: placa.trim().toUpperCase(),
          brand: marca,
          model: modelo.trim(),
          year: ano,
          color: color,
          propulsion: tipoPropulsion,
          seats: cupos,
        },
        soat: { number: numeroSoat.trim(), expiresAt: vencimientoSoat },
        technicalInspection: requiereTecnomecanica()
          ? { number: numeroTecno.trim(), expiresAt: vencimientoTecno }
          : { status: 'exempt_by_law' },
        license: { number: numeroLicencia.trim(), category: categoriaLicencia, expiresAt: vencimientoLicencia },
        status: 'approved',
      });
      setPasoActual(5);
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. BARRA SUPERIOR CON PROGRESO */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            if (pasoActual > 1 && pasoActual < 5) {
              setPasoActual(pasoActual - 1);
              setMensajeError('');
            } else {
              onBack();
            }
          }}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Indicador de Pasos 1 a 4 */}
        {pasoActual < 5 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Paso {pasoActual} de 4</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((p) => (
                <span
                  key={p}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    pasoActual === p
                      ? 'w-5 bg-lochmara-600'
                      : pasoActual > p
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="w-9" />
      </div>

      {/* 2. MENSAJE DE ERROR DESTACADO */}
      {mensajeError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="leading-snug">{mensajeError}</span>
        </motion.div>
      )}

      {/* 3. VISTAS DEL ASISTENTE */}
      <AnimatePresence mode="wait">
        {/* PASO 1: DATOS DEL VEHÍCULO */}
        {pasoActual === 1 && (
          <motion.form
            key="conductor-paso-1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            onSubmit={validarPaso1}
            className="space-y-4"
          >
            <div className="text-center space-y-0.5">
              <h2 className="text-xl font-extrabold text-slate-900">Datos de tu Vehículo</h2>
              <p className="text-xs text-slate-500">Catálogo oficial NHTSA y especificaciones de tu transporte</p>
            </div>

            {/* Selector de Tipo: Carro o Moto con Iconos Vectoriales Congruentes */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTipoVehiculo('carro');
                  setMarca('Chevrolet');
                  setCupos(3);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tipoVehiculo === 'carro'
                    ? 'bg-white text-lochmara-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Automóvil</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoVehiculo('moto');
                  setMarca('Yamaha');
                  setCupos(1);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tipoVehiculo === 'moto'
                    ? 'bg-white text-lochmara-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Motocicleta</span>
              </button>
            </div>

            {/* Componente de Placa Colombiana Realista */}
            <ColombianPlateInput
              value={placa}
              onChange={setPlaca}
              vehicleType={tipoVehiculo}
              municipality="BUCARAMANGA"
            />

            {/* Marca y Modelo Desplegable desde NHTSA API */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Marca</label>
                <select
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer"
                >
                  {(tipoVehiculo === 'carro' ? MARCAS_COLOMBIA_CARROS : MARCAS_COLOMBIA_MOTOS).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Modelo / Línea</span>
                  {cargandoModelos && <Loader2 className="w-3 h-3 text-lochmara-600 animate-spin" />}
                </label>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  disabled={cargandoModelos}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {modelosDisponibles.map((mod, idx) => (
                    <option key={idx} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Año y Tipo de Propulsión */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Año Modelo</label>
                <select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer"
                >
                  {anos.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Propulsión</label>
                <select
                  value={tipoPropulsion}
                  onChange={(e) => setTipoPropulsion(e.target.value)}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer"
                >
                  <option value="gasolina">Gasolina</option>
                  <option value="hibrido">Híbrido (HEV/PHEV)</option>
                  <option value="electrico">100% Eléctrico (EV)</option>
                  <option value="diesel">Diésel</option>
                </select>
              </div>
            </div>

            {/* Color y Cupos */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Color</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer"
                >
                  {colores.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cupos Libres</label>
                <select
                  value={cupos}
                  onChange={(e) => setCupos(Number(e.target.value))}
                  className="w-full bg-white text-xs rounded-2xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium shadow-2xs cursor-pointer"
                >
                  {(tipoVehiculo === 'carro' ? [1, 2, 3, 4] : [1]).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'pasajero' : 'pasajeros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
            >
              <span>Continuar a Documentos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* PASO 2: SOAT & TECNOMECÁNICA CON VALIDACIONES COLOMBIANAS */}
        {pasoActual === 2 && (
          <motion.form
            key="conductor-paso-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={validarPaso2}
            className="space-y-4"
          >
            <div className="text-center space-y-0.5">
              <h2 className="text-xl font-extrabold text-slate-900">Documentos del Vehículo</h2>
              <p className="text-xs text-slate-500">Validación de vigencia de pólizas de seguridad</p>
            </div>

            {/* Póliza SOAT (Siempre Obligatoria) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">Póliza SOAT Vigente</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Obligatorio
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">N° de Póliza (6-20 dígitos)</label>
                  <input
                    type="text"
                    required
                    value={numeroSoat}
                    onChange={(e) => setNumeroSoat(e.target.value.toUpperCase())}
                    placeholder="ej: 1002948201"
                    className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Vencimiento (&gt; Hoy)</label>
                  <input
                    type="date"
                    required
                    min={fechaHoy}
                    value={vencimientoSoat}
                    onChange={(e) => setVencimientoSoat(e.target.value)}
                    className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
                  />
                </div>
              </div>

              <div>
                {!fotoSoat ? (
                  <button
                    type="button"
                    onClick={() => abrirSelectorFoto('soat')}
                    className="w-full py-2.5 rounded-xl border border-dashed border-lochmara-300 hover:border-lochmara-500 bg-lochmara-50/50 text-lochmara-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar o Subir Foto de la Póliza SOAT</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">Foto de SOAT adjuntada exitosamente</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFotoSoat(null)}
                      className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Revisión Técnico-Mecánica (Solo si cumple antigüedad por ley) */}
            {requiereTecnomecanica() ? (
              <div className="bg-white rounded-3xl p-4 border border-amber-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900">Revisión Técnico-Mecánica (RTM)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Obligatoria por Ley (&gt; 5 años)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">N° Certificado RTM</label>
                    <input
                      type="text"
                      required
                      value={numeroTecno}
                      onChange={(e) => setNumeroTecno(e.target.value.toUpperCase())}
                      placeholder="ej: TM-982341"
                      className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Vencimiento RTM (&gt; Hoy)</label>
                    <input
                      type="date"
                      required
                      min={fechaHoy}
                      value={vencimientoTecno}
                      onChange={(e) => setVencimientoTecno(e.target.value)}
                      className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
                    />
                  </div>
                </div>

                <div>
                  {!fotoTecno ? (
                    <button
                      type="button"
                      onClick={() => abrirSelectorFoto('tecno')}
                      className="w-full py-2.5 rounded-xl border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Tomar o Subir Certificado RTM</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold truncate">Certificado RTM adjuntado exitosamente</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFotoTecno(null)}
                        className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-lochmara-50/80 border border-lochmara-200/80 text-lochmara-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-lochmara-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Vehículo Exento de Técnico-Mecánica</p>
                  <p className="text-[11px] text-lochmara-700 leading-snug">
                    Según la <strong>Ley 2294 de 2023</strong> de Colombia, los vehículos particulares año modelo {ano} (con menos de 5 años de matrícula) están exentos de revisión técnico-mecánica.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
            >
              <span>Continuar a Licencia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* PASO 3: LICENCIA DE CONDUCCIÓN CON VALIDACIONES */}
        {pasoActual === 3 && (
          <motion.form
            key="conductor-paso-3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={validarPaso3}
            className="space-y-4"
          >
            <div className="text-center space-y-0.5">
              <h2 className="text-xl font-extrabold text-slate-900">Licencia de Conducción</h2>
              <p className="text-xs text-slate-500">Valida tu autorización legal para conducir en Colombia</p>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-lochmara-600" />
                <h3 className="text-xs font-bold text-slate-900">Datos de la Licencia</h3>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Número de Licencia / Documento (6 a 12 dígitos)
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={numeroLicencia}
                  onChange={(e) => setNumeroLicencia(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej: 1098123456"
                  className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Categoría</label>
                  <select
                    value={categoriaLicencia}
                    onChange={(e) => setCategoriaLicencia(e.target.value)}
                    className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 font-medium cursor-pointer"
                  >
                    {tipoVehiculo === 'moto' ? (
                      <>
                        <option value="A2">A2 (Motos de cualquier cilindraje)</option>
                        <option value="A1">A1 (Motos hasta 125 c.c.)</option>
                      </>
                    ) : (
                      <>
                        <option value="B1">B1 (Automóviles particulares)</option>
                        <option value="B2">B2 (Camionetas / Camperos)</option>
                        <option value="C1">C1 (Servicio público)</option>
                        <option value="C2">C2 (Camiones rígidos)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Vencimiento (&gt; Hoy)</label>
                  <input
                    type="date"
                    required
                    min={fechaHoy}
                    value={vencimientoLicencia}
                    onChange={(e) => setVencimientoLicencia(e.target.value)}
                    className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
                  />
                </div>
              </div>

              <div>
                {!fotoLicencia ? (
                  <button
                    type="button"
                    onClick={() => abrirSelectorFoto('licencia')}
                    className="w-full py-2.5 rounded-xl border border-dashed border-lochmara-300 hover:border-lochmara-500 bg-lochmara-50/50 text-lochmara-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar o Subir Foto de la Licencia (Frente)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">Foto de Licencia adjuntada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFotoLicencia(null)}
                      className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
            >
              <span>Revisar y Autorizar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* PASO 4: REVISIÓN Y DECLARACIÓN HABEAS DATA */}
        {pasoActual === 4 && (
          <motion.form
            key="conductor-paso-4"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={finalizarRegistroConductor}
            className="space-y-4"
          >
            <div className="text-center space-y-0.5">
              <h2 className="text-xl font-extrabold text-slate-900">Resumen y Autorización</h2>
              <p className="text-xs text-slate-500">Confirma tus datos antes de enviar la solicitud</p>
            </div>

            {/* Resumen de Datos Registrados */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Vehículo</span>
                <span className="font-bold text-slate-900">{marca} {modelo} ({ano}) • Placa {placa.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Propulsión</span>
                <span className="font-bold text-lochmara-700 capitalize">{tipoPropulsion}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Cupos Ofrecidos</span>
                <span className="font-bold text-slate-900">{cupos} {cupos === 1 ? 'asiento' : 'asientos'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Póliza SOAT</span>
                <span className="font-bold text-emerald-700">Vigente ({vencimientoSoat})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Tecnomecánica (RTM)</span>
                <span className="font-bold text-slate-900">
                  {requiereTecnomecanica() ? `Vigente (${vencimientoTecno})` : 'Exento por Ley (< 5 años)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Licencia ({categoriaLicencia})</span>
                <span className="font-bold text-slate-900">Vence: {vencimientoLicencia}</span>
              </div>
            </div>

            {/* Checkbox de Declaración y Firma Ley 1581 */}
            <div className="bg-lochmara-50/70 rounded-2xl p-3.5 border border-lochmara-100 space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lochmara-600 focus:ring-lochmara-500 border-slate-300 cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">
                  Declaro que los documentos adjuntos son auténticos y autorizo a{' '}
                  <strong>{institutionLabel}</strong> y UniWheels a validar la vigencia de mi SOAT y Licencia bajo la{' '}
                  <strong>Ley 1581 de 2012</strong>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={estaEnviando}
              className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
            >
              {estaEnviando ? (
                <span>Enviando documentos a validación...</span>
              ) : (
                <span>Completar Registro de Conductor</span>
              )}
            </button>
          </motion.form>
        )}

        {/* PASO 5: ÉXITO Y ACTIVACIÓN DE ROL DE CONDUCTOR */}
        {pasoActual === 5 && (
          <motion.div
            key="conductor-paso-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">¡Registro Completado!</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tu vehículo <strong>{marca} {modelo} ({placa.toUpperCase()})</strong> ha sido registrado en la comunidad de {institutionLabel}.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Modo Conductor Activado</p>
                <p className="text-[11px] text-emerald-700 leading-snug">
                  Ya puedes publicar rutas diarias, gestionar tus cupos y recibir aportes directos en tu billetera digital.
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
            >
              <span>Ir a mi Panel de Conductor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Dinámico para Captura o Carga de Foto de Documentos */}
      <PhotoPickerModal
        isOpen={modalFotoAbierto}
        onClose={() => setModalFotoAbierto(false)}
        onPhotoSelected={guardarFotoDocumento}
        title={configFotoActual.titulo}
        subtitle={configFotoActual.subtitulo}
        cameraLabel={configFotoActual.cameraLabel}
        galleryLabel={configFotoActual.galleryLabel}
      />
    </div>
  );
};
