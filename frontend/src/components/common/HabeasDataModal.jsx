import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, X, FileText, Check } from 'lucide-react';

export const HabeasDataModal = ({ isOpen, onClose, onAccept }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25 }}
          className={`relative w-full max-w-[340px] max-h-[78vh] rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden border mx-auto transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera del Modal */}
          <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                    : 'bg-lochmara-50 text-lochmara-600 border-lochmara-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Tratamiento de Datos
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ley 1581 de 2012 — UniWheels
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo con Scroll de la Politica */}
          <div className={`flex-1 overflow-y-auto py-3 space-y-3 text-[11px] leading-relaxed pr-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <div
              className={`p-2.5 rounded-2xl border font-medium ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-lochmara-50/70 border-lochmara-100 text-lochmara-900'
              }`}
            >
              En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, te informamos sobre el tratamiento de tus datos personales.
            </div>

            <div>
              <h4 className={`font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <FileText className="w-3.5 h-3.5 text-lochmara-500" />
                1. Finalidad del Tratamiento
              </h4>
              <p>
                Los datos suministrados (nombre, código institucional, correo universitario, sede y coordenadas de ruta) serán utilizados exclusivamente para:
              </p>
              <ul className={`list-disc pl-4 mt-1 space-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <li>Validar tu pertenencia activa a la comunidad universitaria.</li>
                <li>Calcular emparejamientos y optimización de rutas compartidas (carpooling).</li>
                <li>Monitorear la seguridad y telemetría de los recorridos universitarios.</li>
              </ul>
            </div>

            <div>
              <h4 className={`font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
                2. Protección y Cero Comercialización
              </h4>
              <p>
                UniWheels no comercializa, transfiere ni comparte tu información con terceros con fines publicitarios. Tus trayectorias se procesan bajo cifrado y anonimización geoespacial.
              </p>
            </div>

            <div>
              <h4 className={`font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <FileText className="w-3.5 h-3.5 text-lochmara-500" />
                3. Derechos del Titular (Habeas Data)
              </h4>
              <p>
                Como titular tienes derecho a conocer, actualizar, rectificar y revocar la autorización de tus datos en cualquier momento desde la sección de Perfil o mediante solicitud a Bienestar Universitario.
              </p>
            </div>
          </div>

          {/* Pie de Accion */}
          <div className={`pt-3 border-t flex gap-2 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Autorizar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
