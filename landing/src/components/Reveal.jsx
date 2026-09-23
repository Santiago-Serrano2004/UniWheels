import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Entrada suave al aparecer en pantalla (una sola vez). Sin movimiento si el
// usuario pidió reducirlo.
export const Reveal = ({ as = 'div', delay = 0, y = 24, className, children }) => {
  const reducir = useReducedMotion();
  const Componente = motion[as];
  return (
    <Componente
      initial={reducir ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Componente>
  );
};
