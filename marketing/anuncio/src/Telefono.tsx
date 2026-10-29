import React from 'react';
import { color } from './tema';

// Marco de teléfono genérico (sin marca), proporción 9:19.5.
export const Telefono: React.FC<{ ancho: number; children: React.ReactNode }> = ({ ancho, children }) => {
  const alto = ancho * (19.5 / 9);
  const borde = ancho * 0.035;
  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: ancho * 0.16,
        background: color.tinta,
        padding: borde,
        boxShadow: `0 ${ancho * 0.12}px ${ancho * 0.25}px -${ancho * 0.08}px rgba(8,47,73,0.55)`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: ancho * 0.13,
          overflow: 'hidden',
          background: color.niebla,
        }}
      >
        {children}
        {/* Isla dinámica */}
        <div
          style={{
            position: 'absolute',
            top: ancho * 0.03,
            left: '50%',
            transform: 'translateX(-50%)',
            width: ancho * 0.3,
            height: ancho * 0.085,
            borderRadius: ancho,
            background: color.tinta,
          }}
        />
      </div>
    </div>
  );
};
