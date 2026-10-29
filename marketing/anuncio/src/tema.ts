import { loadFont as cargarDisplay } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as cargarTexto } from '@remotion/google-fonts/PlusJakartaSans';

// Misma identidad visual que uniwheels.org (landing/src/styles/tokens.css).
export const fuenteDisplay = cargarDisplay('normal', { weights: ['600', '700', '800'] }).fontFamily;
export const fuenteTexto = cargarTexto('normal', { weights: ['400', '500', '600', '700'] }).fontFamily;

export const color = {
  papel: '#ffffff',
  niebla: '#f2f7fa',
  linea: '#d9e6ee',
  tinta: '#082f49',
  cuerpo: '#3b4d5c',
  recogida: '#f59e0b',
  lochmara50: '#f0f9ff',
  lochmara100: '#e0f2fe',
  lochmara500: '#0ea5e9',
  lochmara600: '#0284c7',
  lochmara700: '#0369a1',
  exito: '#10b981',
  peligro: '#ef4444',
};

export const FPS = 30;
