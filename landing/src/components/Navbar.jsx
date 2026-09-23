import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, ShieldCheck, Car } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Cómo funciona', href: '#como-funciona' },
    { name: 'Modalidades', href: '#modalidades' },
    { name: 'Seguridad', href: '#seguridad' },
    { name: 'Para conductores', href: '#conductores' },
    { name: 'Preguntas', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo y Nombre de Marca */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-lochmara-600 flex items-center justify-center text-white shadow-md shadow-lochmara-600/20 group-hover:bg-lochmara-700 transition-colors">
              <Car className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                UniWheels
              </span>
              <span className="text-[11px] font-medium text-lochmara-600 dark:text-lochmara-400 leading-tight">
                Comunidad UNAB
              </span>
            </div>
          </a>

          {/* Enlaces de Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-lochmara-600 dark:hover:text-lochmara-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Acciones: Alternar Tema y Botón de Descarga */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Alternar modo claro y oscuro"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <a
              href="#descargar"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-lochmara-600 hover:bg-lochmara-700 rounded-xl transition-all shadow-sm shadow-lochmara-600/30"
            >
              Descargar app
            </a>
          </div>

          {/* Botones Móvil */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Alternar modo claro y oscuro"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Abrir menú de navegación"
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 mt-3 space-y-3 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-2">
            <a
              href="#descargar"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-lochmara-600 hover:bg-lochmara-700 rounded-xl transition-colors shadow-md shadow-lochmara-600/20"
            >
              Descargar app
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
