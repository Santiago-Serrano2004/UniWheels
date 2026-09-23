import React from 'react';
import { Mail, ShieldCheck, Car, ExternalLink, Heart } from 'lucide-react';

export const Footer = ({ onOpenPrivacy }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Columna Marca */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-lochmara-600 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                UniWheels
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Plataforma oficial de carpooling universitario para estudiantes, docentes y personal de la Universidad Autónoma de Bucaramanga (UNAB).
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span>Bucaramanga, Santander, Colombia</span>
            </div>
          </div>

          {/* Columna Enlaces Rápidos */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-200 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#como-funciona" className="hover:text-lochmara-400 transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#modalidades" className="hover:text-lochmara-400 transition-colors">
                  Modalidades
                </a>
              </li>
              <li>
                <a href="#seguridad" className="hover:text-lochmara-400 transition-colors">
                  Seguridad
                </a>
              </li>
              <li>
                <a href="#conductores" className="hover:text-lochmara-400 transition-colors">
                  Para conductores
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-lochmara-400 transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Contacto y Legal */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-200 mb-4">
              Contacto y Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:uniwheelscontact@gmail.com"
                  className="flex items-center gap-2 text-slate-300 hover:text-lochmara-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-lochmara-400 shrink-0" />
                  <span className="break-all">uniwheelscontact@gmail.com</span>
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="flex items-center gap-2 text-slate-300 hover:text-lochmara-400 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tratamiento de Datos (Habeas Data)</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 UniWheels. Todos los derechos reservados.
          </div>
          <div>
            Comunidad Universitaria UNAB — Movilidad Sostenible
          </div>
        </div>
      </div>
    </footer>
  );
};
