import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileText, Lock, UserCheck } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden border mx-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
        >
          {/* Cabecera del Modal */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-lochmara-50 dark:bg-lochmara-950 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-200 dark:border-lochmara-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                  Tratamiento de Datos Personales
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ley 1581 de 2012 — UniWheels
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal de privacidad"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo con Scroll de la Política Legal Reutilizada */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm leading-relaxed pr-1 text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-2xl bg-lochmara-50/70 dark:bg-slate-950 border border-lochmara-100 dark:border-slate-800 text-lochmara-900 dark:text-slate-300 font-medium">
              En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, te informamos sobre el tratamiento de tus datos personales.
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-lochmara-500" />
                1. Finalidad del Tratamiento
              </h4>
              <p>
                Los datos suministrados (nombre, código institucional, correo universitario, sede y coordenadas de ruta) serán utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Validar tu pertenencia activa a la comunidad universitaria.</li>
                <li>Calcular emparejamientos y optimización de rutas compartidas (carpooling).</li>
                <li>Monitorear la seguridad y telemetría de los recorridos universitarios.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-lochmara-500" />
                2. Protección y Cero Comercialización
              </h4>
              <p>
                UniWheels no comercializa, transfiere ni comparte tu información con terceros con fines publicitarios. Tus trayectorias se procesan bajo cifrado y anonimización geoespacial.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <UserCheck className="w-4 h-4 text-lochmara-500" />
                3. Derechos del Titular (Habeas Data)
              </h4>
              <p>
                Como titular tienes derecho a conocer, actualizar, rectificar y revocar la autorización de tus datos en cualquier momento desde la sección de Perfil o mediante solicitud a Bienestar Universitario.
              </p>
            </div>
          </div>

          {/* Pie de Acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
