import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { placesApiService } from '../../services/placesApiService';
import { LocationPickerModal } from '../map/LocationPickerModal';
import {
  Home,
  MapPin,
  Search,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SetHomeLocationModal = ({
  isOpen,
  onClose,
  onLocationSaved,
  initialAddress = '',
}) => {
  const { theme, setSavedHomeLocation } = useAppStore();
  const isDark = theme === 'dark';

  const [direccionTexto, setDireccionTexto] = useState(initialAddress);
  const [coords, setCoords] = useState([7.1193, -73.1227]);
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDireccionTexto(initialAddress);
    }
  }, [isOpen, initialAddress]);

  // Autocompletado de dirección
  useEffect(() => {
    if (!direccionTexto || direccionTexto.trim().length < 2) {
      setSugerencias([]);
      setBuscando(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await placesApiService.buscarLugares(direccionTexto.trim());
        setSugerencias(res || []);
      } catch (err) {
        console.error('Error buscando dirección:', err);
      } finally {
        setBuscando(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [direccionTexto]);

  const seleccionarSugerencia = (sug) => {
    const dir = sug.direccion || sug.nombre;
    setDireccionTexto(dir);
    if (sug.coords) setCoords(sug.coords);
    setSugerencias([]);
  };

  const handleConfirmarMapa = (loc, placeName) => {
    const dir = loc?.address || loc?.title || loc?.name || placeName || (typeof loc === 'string' ? loc : '');
    if (dir) {
      setDireccionTexto(dir);
    }
    const resolvedCoords = loc?.coords || (loc?.lat && loc?.lng ? [loc.lat, loc.lng] : null);
    if (resolvedCoords) {
      setCoords(resolvedCoords);
    }
    setModalMapaAbierto(false);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!direccionTexto.trim()) return;

    const nuevaCasa = {
      name: 'Casa',
      address: direccionTexto.trim(),
      coords: coords || [7.1193, -73.1227],
    };

    setSavedHomeLocation(nuevaCasa);
    if (onLocationSaved) {
      onLocationSaved(nuevaCasa);
    }
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Configura tu Casa</h3>
                    <p className="text-[10px] text-slate-400">
                      Guarda tu dirección habitual para usarla en 1 clic
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGuardar} className="space-y-3">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Dirección de tu Casa o Residencia:
                  </label>
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={direccionTexto}
                      onChange={(e) => setDireccionTexto(e.target.value)}
                      placeholder="Ej: Cra 27 # 45-12, Provenza, Bucaramanga..."
                      className={`w-full py-2 pl-8 pr-7 rounded-xl text-xs font-bold border transition-all focus:outline-hidden ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-2xs'
                      }`}
                    />
                    {buscando ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 absolute right-2" />
                    ) : direccionTexto ? (
                      <button
                        type="button"
                        onClick={() => setDireccionTexto('')}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>

                  {/* Botón para ajustar o seleccionar directamente en el mapa */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">¿Prefieres fijar el pin?</span>
                    <button
                      type="button"
                      onClick={() => setModalMapaAbierto(true)}
                      className="px-2.5 py-1 rounded-xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-black transition-colors cursor-pointer flex items-center gap-1 border border-lochmara-500/20"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Elegir en el Mapa</span>
                    </button>
                  </div>

                  {/* Sugerencias de autocompletado */}
                  {sugerencias.length > 0 && (
                    <div
                      className={`absolute left-0 right-0 top-full mt-1 rounded-2xl border shadow-xl z-30 max-h-40 overflow-y-auto p-1 space-y-0.5 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      {sugerencias.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => seleccionarSugerencia(sug)}
                          className={`w-full p-2 text-left rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{sug.nombre}</p>
                            <p className="text-[10px] text-slate-400 truncate">{sug.direccion}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardar y Usar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LocationPickerModal
        isOpen={modalMapaAbierto}
        onClose={() => setModalMapaAbierto(false)}
        onConfirm={handleConfirmarMapa}
        onConfirmLocation={(c, dir) => handleConfirmarMapa({ coords: [c.lat, c.lng], address: dir }, dir)}
        initialCoords={coords}
        initialPlaceName={direccionTexto}
        initialAddress={direccionTexto}
        title="Fijar Ubicación de Casa en el Mapa"
      />
    </>
  );
};
