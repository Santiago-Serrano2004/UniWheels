import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLogo } from './AnimatedLogo';

export const SplashScreen = ({ onFinish, durationMs = 3600 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. Activar la animacion de salida hacia la derecha una vez el logo ya se dibujo y se aprecio
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, durationMs - 600);

    // 2. Finalizar splash screen y dar paso a la pantalla siguiente
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            x: 100,
            filter: 'blur(8px)',
            transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] },
          }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-[#082f49] to-slate-950 px-6 select-none overflow-hidden"
        >
          {/* Resplandor con estela de aceleracion hacia la derecha */}
          <motion.div
            animate={
              isExiting
                ? { x: 380, opacity: 0, scaleX: 2.2 }
                : { scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }
            }
            transition={
              isExiting
                ? { duration: 0.5, ease: [0.7, 0, 0.84, 0] }
                : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
            }
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-lochmara-500/25 rounded-full blur-3xl pointer-events-none"
          />

          {/* Contenedor Central del Logo */}
          <div className="w-full flex flex-col items-center justify-center relative z-10 px-2">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full max-w-[280px] drop-shadow-[0_12px_28px_rgba(14,165,233,0.35)]"
            >
              <AnimatedLogo className="w-full h-auto" isExiting={isExiting} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
