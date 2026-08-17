import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { wompiService } from '../../services/wompiService';
import {
  CreditCard,
  X,
  Lock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// Motor de Detección de Franquicia y Banco por BIN
const detectarDatosTarjeta = (numeroLimpio) => {
  if (!numeroLimpio) {
    return {
      franquicia: 'desconocida',
      nombreFranquicia: 'Tarjeta de Crédito / Débito',
      banco: 'Entidad Bancaria',
      colorGradiente: 'from-slate-800 via-slate-900 to-slate-950',
      longitudMax: 16,
      bloques: [4, 4, 4, 4],
      cvvLen: 3,
    };
  }

  // 1. American Express (34, 37)
  if (/^3[47]/.test(numeroLimpio)) {
    return {
      franquicia: 'amex',
      nombreFranquicia: 'American Express',
      banco: 'Bancolombia Amex',
      colorGradiente: 'from-cyan-700 via-blue-900 to-slate-950',
      longitudMax: 15,
      bloques: [4, 6, 5],
      cvvLen: 4,
    };
  }

  // 2. Visa (4...)
  if (/^4/.test(numeroLimpio)) {
    let banco = 'Bancolombia Visa';
    let gradiente = 'from-blue-600 via-indigo-800 to-slate-950';

    if (/^4916|^4098/.test(numeroLimpio)) {
      banco = 'Nu Colombia (Visa)';
      gradiente = 'from-purple-700 via-purple-900 to-slate-950';
    } else if (/^4025|^4502/.test(numeroLimpio)) {
      banco = 'Davivienda (Visa)';
      gradiente = 'from-red-600 via-rose-900 to-slate-950';
    }

    return {
      franquicia: 'visa',
      nombreFranquicia: 'Visa',
      banco,
      colorGradiente: gradiente,
      longitudMax: 16,
      bloques: [4, 4, 4, 4],
      cvvLen: 3,
    };
  }

  // 3. Mastercard (51-55, 22-27)
  if (/^(5[1-5]|2[2-7])/.test(numeroLimpio)) {
    let banco = 'Mastercard';
    let gradiente = 'from-orange-600 via-amber-800 to-slate-950';

    if (/^5306|^5282/.test(numeroLimpio)) {
      banco = 'Nu Colombia (Mastercard)';
      gradiente = 'from-purple-700 via-purple-900 to-slate-950';
    } else if (/^5406/.test(numeroLimpio)) {
      banco = 'Tarjeta Nequi Visa/Mastercard';
      gradiente = 'from-fuchsia-700 via-purple-950 to-slate-950';
    }

    return {
      franquicia: 'mastercard',
      nombreFranquicia: 'Mastercard',
      banco,
      colorGradiente: gradiente,
      longitudMax: 16,
      bloques: [4, 4, 4, 4],
      cvvLen: 3,
    };
  }

  // 4. Diners Club (300-305, 36, 38)
  if (/^(30[0-5]|36|38)/.test(numeroLimpio)) {
    return {
      franquicia: 'diners',
      nombreFranquicia: 'Diners Club International',
      banco: 'Davivienda Diners',
      colorGradiente: 'from-sky-700 via-slate-800 to-slate-950',
      longitudMax: 14,
      bloques: [4, 6, 4],
      cvvLen: 3,
    };
  }

  // 5. Discover (6011, 65)
  if (/^(6011|65)/.test(numeroLimpio)) {
    return {
      franquicia: 'discover',
      nombreFranquicia: 'Discover Network',
      banco: 'Discover Global',
      colorGradiente: 'from-amber-600 via-orange-900 to-slate-950',
      longitudMax: 16,
      bloques: [4, 4, 4, 4],
      cvvLen: 3,
    };
  }

  return {
    franquicia: 'desconocida',
    nombreFranquicia: 'Tarjeta de Crédito / Débito',
    banco: 'Entidad Bancaria',
    colorGradiente: 'from-slate-800 via-slate-900 to-slate-950',
    longitudMax: 16,
    bloques: [4, 4, 4, 4],
    cvvLen: 3,
  };
};

// Algoritmo de Luhn para validación matemática de tarjetas
const validarAlgoritmoLuhn = (num) => {
  const clean = num.replace(/\D/g, '');
  if (clean.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

export const AddCardModal = ({ isOpen, onClose, onSuccess }) => {
  const { addCard, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [estaTokenizando, setEstaTokenizando] = useState(false);

  if (!isOpen) return null;

  const numeroLimpio = cardNumber.replace(/\s+/g, '');
  const infoTarjeta = detectarDatosTarjeta(numeroLimpio);
  const esValida = validarAlgoritmoLuhn(numeroLimpio);

  // Formatear según los bloques de la franquicia
  const manejarCambioNumero = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    let formatted = '';
    let currIdx = 0;

    for (const blockSize of infoTarjeta.bloques) {
      if (currIdx >= rawVal.length) break;
      const chunk = rawVal.slice(currIdx, currIdx + blockSize);
      formatted += (formatted ? ' ' : '') + chunk;
      currIdx += blockSize;
    }

    if (rawVal.length <= infoTarjeta.longitudMax) {
      setCardNumber(formatted);
    }
  };

  const manejarCambioFecha = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (rawVal.length <= 4) {
      if (rawVal.length >= 3) {
        setExpDate(`${rawVal.slice(0, 2)}/${rawVal.slice(2)}`);
      } else {
        setExpDate(rawVal);
      }
    }
  };

  const guardarTarjeta = async (e) => {
    e.preventDefault();

    if (!esValida && numeroLimpio.length >= 13) {
      alert('El número de tarjeta no es válido (Fallo en algoritmo Luhn). Por favor verifica los dígitos.');
      return;
    }

    setEstaTokenizando(true);

    const [month, year] = expDate.split('/');

    // Tokenizar directamente con la API Oficial de Wompi Bancolombia
    const tokenRes = await wompiService.tokenizeCard({
      number: numeroLimpio,
      cvc: cvv,
      expMonth: month || '12',
      expYear: year || '28',
      cardHolder: cardHolder || 'SANTIAGO SERRANO',
    });

    const last4 = tokenRes.last4 || numeroLimpio.slice(-4) || '4829';
    const brand = tokenRes.brand || (infoTarjeta.franquicia === 'desconocida' ? 'visa' : infoTarjeta.franquicia);

    addCard({
      brand: brand,
      last4: last4,
      expMonth: month || '12',
      expYear: year || '28',
      holderName: cardHolder.toUpperCase() || 'SANTIAGO SERRANO',
      bank: infoTarjeta.banco,
      tokenId: tokenRes.tokenId,
      isDefault: isDefault,
      color: infoTarjeta.colorGradiente,
    });

    setEstaTokenizando(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  // Renderizar Logotipos Vectoriales Oficiales de Franquicia
  const renderLogoFranquicia = (franquicia) => {
    switch (franquicia) {
      case 'visa':
        return (
          <span className="text-xl font-black italic tracking-wider text-white drop-shadow-md">
            VISA
          </span>
        );
      case 'mastercard':
        return (
          <div className="flex items-center -space-x-2.5 drop-shadow-md">
            <div className="w-6 h-6 rounded-full bg-red-600/90" />
            <div className="w-6 h-6 rounded-full bg-amber-500/90" />
          </div>
        );
      case 'amex':
        return (
          <div className="bg-sky-500 text-white px-2 py-0.5 rounded font-black text-[11px] tracking-tighter">
            AMEX
          </div>
        );
      case 'diners':
        return (
          <span className="text-xs font-black tracking-widest text-sky-200 uppercase">
            DINERS
          </span>
        );
      default:
        return (
          <CreditCard className="w-6 h-6 text-white/70" />
        );
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`relative w-full max-w-[340px] max-h-[90vh] rounded-3xl p-5 shadow-2xl border flex flex-col mx-auto space-y-3 overflow-y-auto transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  isDark
                    ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                    : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Agregar Nueva Tarjeta</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Detección de Franquicia y Banco en Tiempo Real</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* VISTA PREVIA INTERACTIVA DE LA TARJETA EN 3D */}
          <motion.div
            key={infoTarjeta.franquicia}
            initial={{ scale: 0.97, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-44 rounded-2xl bg-gradient-to-tr ${infoTarjeta.colorGradiente} text-white p-4 shadow-xl border border-white/20 flex flex-col justify-between relative overflow-hidden transition-all duration-500`}
          >
            {/* Brillo dinámico */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              {/* Chip EMV Dorado */}
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs flex items-center justify-center">
                <div className="w-6 h-4 border border-amber-800/40 rounded-xs" />
              </div>

              {/* Logo de Franquicia Detectada */}
              <div className="text-right flex items-center gap-2">
                {renderLogoFranquicia(infoTarjeta.franquicia)}
              </div>
            </div>

            {/* Número de Tarjeta con espaciado inteligente */}
            <div className="relative z-10">
              <p className="text-sm sm:text-base font-mono font-black tracking-widest text-white drop-shadow-sm">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[9px] font-bold text-white/80 uppercase">
                  {infoTarjeta.banco}
                </span>
                {esValida && (
                  <span className="text-[9px] text-emerald-300 font-extrabold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Válida</span>
                  </span>
                )}
              </div>
            </div>

            {/* Titular y Expiración */}
            <div className="flex items-center justify-between text-xs relative z-10">
              <div>
                <span className="text-[8px] uppercase tracking-widest text-white/60 block">Titular</span>
                <span className="font-bold text-[11px] uppercase truncate max-w-[170px] block">
                  {cardHolder || 'NOMBRE Y APELLIDO'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[8px] uppercase tracking-widest text-white/60 block">Vence</span>
                <span className="font-mono font-bold text-[11px]">
                  {expDate || 'MM/AA'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Insignia de Franquicia Reconocida */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Franquicia Reconocida:</span>
            <span className={`text-[11px] font-black capitalize flex items-center gap-1 ${isDark ? 'text-lochmara-400' : 'text-lochmara-700'}`}>
              <span>{infoTarjeta.nombreFranquicia}</span>
              <span className={`text-[9px] font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({infoTarjeta.banco})</span>
            </span>
          </div>

          {/* FORMULARIO DE INGRESO */}
          <form onSubmit={guardarTarjeta} className="space-y-2.5 text-xs">
            {/* Número */}
            <div className="space-y-1">
              <label className={`text-[11px] font-bold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>Número de Tarjeta</span>
                <span className="text-[9px] text-slate-400">4=Visa, 5=MC, 3=Amex</span>
              </label>
              <input
                type="text"
                required
                maxLength={infoTarjeta.longitudMax + 3}
                placeholder={infoTarjeta.franquicia === 'amex' ? '3700 123456 78901' : '4500 1234 5678 9012'}
                value={cardNumber}
                onChange={manejarCambioNumero}
                className={`w-full text-xs font-mono font-bold rounded-xl px-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Nombre Titular */}
            <div className="space-y-1">
              <label className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nombre del Titular</label>
              <input
                type="text"
                required
                placeholder="Como aparece en el plástico"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className={`w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Fecha y CVV */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Vencimiento</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="MM/AA"
                  value={expDate}
                  onChange={manejarCambioFecha}
                  className={`w-full text-xs font-mono font-bold rounded-xl px-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 text-center ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>CVV ({infoTarjeta.cvvLen} d.)</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="password"
                  required
                  maxLength={infoTarjeta.cvvLen}
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  className={`w-full text-xs font-mono font-bold rounded-xl px-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 text-center tracking-widest ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Checkbox: Predeterminada */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-lochmara-600 focus:ring-lochmara-500 border-slate-300"
              />
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Establecer como método de pago predeterminado
              </span>
            </label>

            {/* Botón Guardar */}
            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="submit"
                disabled={estaTokenizando}
                className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/20 disabled:opacity-60"
              >
                {estaTokenizando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Cifrando en Wompi Bancolombia...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>Guardar Tarjeta Segura (PCI-DSS)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
