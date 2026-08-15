import React from 'react';
import { Sparkles, Shield, Compass, Car, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export const ColorPaletteShowcase = () => {
  const escalaLochmara = [
    { paso: '50', hex: '#f0f9ff', uso: 'Fondo muy claro / Superficie sutil', textoOscuro: true },
    { paso: '100', hex: '#e0f2fe', uso: 'Hover suave / Badge fondos', textoOscuro: true },
    { paso: '200', hex: '#bae6fd', uso: 'Bordes destacados / Chips activos', textoOscuro: true },
    { paso: '300', hex: '#7dd3fc', uso: 'Líneas secundarias / Indicadores', textoOscuro: true },
    { paso: '400', hex: '#38bdf8', uso: 'Acento brillante / Resplandor GPS', textoOscuro: false },
    { paso: '500', hex: '#0ea5e9', uso: 'Primario vibrante / Botones', textoOscuro: false },
    { paso: '600', hex: '#0284c7', uso: 'Color de Marca Principal / Trazado de Ruta', textoOscuro: false },
    { paso: '700', hex: '#0369a1', uso: 'Estado Hover / Iconos principales', textoOscuro: false },
    { paso: '800', hex: '#075985', uso: 'Textos de marca / Encabezados', textoOscuro: false },
    { paso: '900', hex: '#0c4a6e', uso: 'Fondos profundos / Barras de navegación', textoOscuro: false },
    { paso: '950', hex: '#082f49', uso: 'Superficie de contraste máxima / Dark base', textoOscuro: false },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
      {/* Encabezado del Sistema de Diseño */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-lochmara-100">
        <div>
          <div className="flex items-center gap-2 text-lochmara-600 font-semibold text-sm tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            Sistema de Diseño UniWheels
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Paleta Cromática Oficial: Lochmara
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Identidad visual exclusiva para movilidad compartida, navegación espacial y confianza comunitaria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-lochmara-100 text-lochmara-800 border border-lochmara-200">
            Escala HSL 11 Pasos
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            WCAG AAA Accesible
          </span>
        </div>
      </div>

      {/* Cuadrícula de la Escala de Color */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Gradiente Completo de la Escala
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {escalaLochmara.map((color) => (
            <div
              key={color.paso}
              className="p-4 rounded-xl border border-slate-200/80 shadow-xs transition-all hover:shadow-md hover:scale-[1.01] flex flex-col justify-between h-28"
              style={{ backgroundColor: color.hex }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    color.textoOscuro ? 'bg-black/10 text-slate-900' : 'bg-white/20 text-white'
                  }`}
                >
                  Lochmara-{color.paso}
                </span>
                <span
                  className={`text-xs font-mono font-medium ${
                    color.textoOscuro ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {color.hex}
                </span>
              </div>
              <p
                className={`text-xs leading-snug ${
                  color.textoOscuro ? 'text-slate-700' : 'text-white/90'
                }`}
              >
                {color.uso}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Demostracion de Componentes UI con la Paleta */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Aplicación Práctica en Componentes de Movilidad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Boton y Accion Primaria */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lochmara-100 text-lochmara-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Botones y Acciones</h3>
                <p className="text-xs text-slate-500">Lochmara-600 con hover en 700</p>
              </div>
            </div>
            <button className="w-full py-3 px-4 rounded-xl bg-lochmara-600 hover:bg-lochmara-700 active:bg-lochmara-800 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>Solicitar Cupo en Ruta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full py-2.5 px-4 rounded-xl bg-lochmara-50 hover:bg-lochmara-100 text-lochmara-700 font-semibold text-sm border border-lochmara-200 transition-all cursor-pointer">
              Ver Detalles del Conductor
            </button>
          </div>

          {/* Tarjeta 2: Trazado de Ruta y Navegacion */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lochmara-950 text-lochmara-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Navegación Espacial</h3>
                <p className="text-xs text-slate-500">Contraste sobre mapas y satélite</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-lochmara-950 text-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-lochmara-300 font-medium">Corredor Activo</span>
                <span className="px-2 py-0.5 rounded-full bg-lochmara-500/20 text-lochmara-300 font-bold">
                  En Vivo
                </span>
              </div>
              <div className="text-base font-extrabold text-white">Campus El Jardín UNAB</div>
              <div className="text-xs text-lochmara-200">Salida estimada: 7:15 AM (ETA 18 min)</div>
            </div>
          </div>

          {/* Tarjeta 3: Seguridad y Confianza */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lochmara-50 text-lochmara-600 border border-lochmara-200 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Comunidad UNAB</h3>
                <p className="text-xs text-slate-500">Insignias y validación de perfiles</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-lochmara-50 border border-lochmara-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-lochmara-600 text-white flex items-center justify-center font-bold text-xs">
                  UN
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Verificado UNAB</div>
                  <div className="text-[11px] text-lochmara-700">@unab.edu.co activo</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-lochmara-800">4.9 ★</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
