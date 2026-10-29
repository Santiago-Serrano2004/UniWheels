import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// Pantallas ilustrativas de la app para cada paso de "Así funciona".
const Encabezado = ({ titulo, subtitulo }) => (
  <div className="px-4 pt-3 pb-2">
    <p className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--color-tinta)]">{titulo}</p>
    {subtitulo && <p className="text-[11px] text-[var(--color-cuerpo)]">{subtitulo}</p>}
  </div>
);

const PantallaCodigo = () => {
  const reducir = useReducedMotion();
  return (
    <div>
      <Encabezado titulo="Revisa tu correo" subtitulo="Te enviamos un código de 6 dígitos" />
      <div className="mt-6 flex justify-center gap-1.5 px-4">
        {['4', '1', '7', '9', '0', '3'].map((d, i) => (
          <motion.span
            key={i}
            initial={reducir ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.18 }}
            className="flex h-10 w-8 items-center justify-center rounded-lg border-2 border-lochmara-500 bg-lochmara-50 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-tinta)]"
          >
            {d}
          </motion.span>
        ))}
      </div>
      <motion.div
        initial={reducir ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mx-4 mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] font-semibold text-emerald-700"
      >
        Cuenta verificada
      </motion.div>
    </div>
  );
};

const RUTAS = [
  { nombre: 'Andrés R.', hora: '6:40 a. m.', cupos: 2, desde: 'Cañaveral' },
  { nombre: 'Valentina S.', hora: '6:55 a. m.', cupos: 1, desde: 'Cabecera' },
  { nombre: 'Julián M.', hora: '7:10 a. m.', cupos: 3, desde: 'Provenza' },
];

const PantallaRutas = () => {
  const reducir = useReducedMotion();
  return (
    <div>
      <Encabezado titulo="Rutas hacia tu campus" subtitulo="Mañana, 6:30 a 7:30 a. m." />
      <div className="mt-1 flex flex-col gap-2 px-3">
        {RUTAS.map((r, i) => (
          <motion.div
            key={r.nombre}
            initial={reducir ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.15 }}
            className={`rounded-xl border px-3 py-2.5 ${i === 0 ? 'border-lochmara-500 bg-lochmara-50' : 'border-[var(--color-linea)] bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-[var(--color-tinta)]">{r.nombre}</p>
              <p className="flex items-center gap-1 text-[11px] text-[var(--color-cuerpo)]">
                {r.hora}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--color-cuerpo)]">
              <span className="flex items-center gap-1">
                Desde {r.desde}
              </span>
              <span className="flex items-center gap-1">
                {r.cupos} {r.cupos === 1 ? 'cupo' : 'cupos'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={reducir ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mx-3 mt-3 rounded-xl bg-[var(--color-tinta)] py-2.5 text-center text-[12px] font-semibold text-white"
      >
        Reservar cupo con Andrés
      </motion.div>
    </div>
  );
};

const PantallaPin = ({ conductor }) => {
  const reducir = useReducedMotion();
  const digitos = ['4', '8', '2', '9'];
  return (
    <div>
      <Encabezado
        titulo={conductor ? 'Confirma el PIN' : 'Tu PIN de abordaje'}
        subtitulo={conductor ? 'Pídeselo al pasajero al subir' : 'Díctaselo al conductor al subir'}
      />
      <div className="mt-6 flex justify-center gap-2">
        {digitos.map((d, i) => (
          <motion.span
            key={i}
            initial={reducir ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * (conductor ? 0.35 : 0.12), type: 'spring', stiffness: 420, damping: 16 }}
            className="flex h-14 w-11 items-center justify-center rounded-xl bg-[var(--color-tinta)] font-[family-name:var(--font-display)] text-2xl font-extrabold text-white"
          >
            {d}
          </motion.span>
        ))}
      </div>
      <motion.div
        initial={reducir ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: conductor ? 1.9 : 1 }}
        className="mx-4 mt-7 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-[12px] font-semibold text-emerald-700"
      >
        {conductor ? 'Viaje iniciado' : 'Tu conductor llega en 3 min'}
      </motion.div>
    </div>
  );
};

const DOCUMENTOS = ['SOAT', 'Licencia de conducción', 'Tecnomecánica'];

const PantallaDocumentos = () => {
  const reducir = useReducedMotion();
  return (
    <div>
      <Encabezado titulo="Tus documentos" subtitulo="Foto o PDF" />
      <div className="mt-2 flex flex-col gap-2 px-3">
        {DOCUMENTOS.map((doc, i) => (
          <div key={doc} className="flex items-center justify-between rounded-xl border border-[var(--color-linea)] bg-white px-3 py-2.5">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-tinta)]">
              {doc}
            </span>
            <motion.span
              initial={reducir ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.4, type: 'spring', stiffness: 450, damping: 15 }}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
            >
              Listo
            </motion.span>
          </div>
        ))}
      </div>
      <motion.p
        initial={reducir ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mx-3 mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] font-semibold text-amber-700"
      >
        En revisión por Bienestar Universitario
      </motion.p>
    </div>
  );
};

const PantallaPublicar = () => {
  const reducir = useReducedMotion();
  return (
    <div>
      <Encabezado titulo="Publicar ruta" />
      <div className="mt-1 flex flex-col gap-2 px-3 text-[12px]">
        {[
          ['Salgo desde', 'Cañaveral'],
          ['Voy a', 'Tu campus'],
          ['Hora de salida', '6:40 a. m.'],
        ].map(([k, v], i) => (
          <motion.div
            key={k}
            initial={reducir ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.15 }}
            className="rounded-xl border border-[var(--color-linea)] bg-white px-3 py-2"
          >
            <p className="text-[10px] text-[var(--color-cuerpo)]">{k}</p>
            <p className="font-semibold text-[var(--color-tinta)]">{v}</p>
          </motion.div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-linea)] bg-white px-3 py-2">
          <span className="font-semibold text-[var(--color-tinta)]">Cupos</span>
          <span className="flex items-center gap-2.5">
            <span className="text-base font-bold text-[var(--color-cuerpo)]">−</span>
            <motion.span
              key="cupos"
              initial={reducir ? false : { scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
              className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-tinta)]"
            >
              3
            </motion.span>
            <span className="text-base font-bold text-lochmara-600">+</span>
          </span>
        </div>
      </div>
      <div className="mx-3 mt-3 rounded-xl bg-[var(--color-tinta)] py-2.5 text-center text-[12px] font-semibold text-white">
        Publicar ruta
      </div>
    </div>
  );
};

const PANTALLAS = {
  pasajero: [PantallaCodigo, PantallaRutas, () => <PantallaPin conductor={false} />],
  conductor: [PantallaDocumentos, PantallaPublicar, () => <PantallaPin conductor />],
};

export const PhoneMockup = ({ rol, paso }) => {
  const Pantalla = PANTALLAS[rol][paso];
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]" aria-hidden="true">
      <div className="rounded-[2.6rem] bg-[var(--color-tinta)] p-2.5 shadow-[0_40px_80px_-30px_rgba(8,47,73,0.55)]">
        <div className="relative h-[480px] overflow-hidden rounded-[2.1rem] bg-[var(--color-niebla)]">
          <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-[var(--color-tinta)]">
            <span>6:32</span>
            <span className="h-5 w-20 rounded-full bg-[var(--color-tinta)]" />
            <span>100%</span>
          </div>
          <div className="mt-2 flex items-center gap-2 px-4">
            <img src="/emblem.svg" alt="" className="h-5 w-5" />
            <span className="font-[family-name:var(--font-display)] text-[13px] font-bold text-[var(--color-tinta)]">UniWheels</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${rol}-${paso}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              <Pantalla />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-[var(--color-linea)] bg-white px-2 pb-4 pt-2.5">
            {[
              ['Inicio', true],
              ['Mapa', false],
              ['Viajes', false],
              ['Perfil', false],
            ].map(([etiqueta, activo]) => (
              <span key={etiqueta} className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activo ? 'text-lochmara-600' : 'text-slate-400'}`}>
                {etiqueta}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
