import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Camera, Image, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export const PhotoPickerModal = ({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Foto de Perfil',
  subtitle = 'Usa la cámara o sube desde tus archivos',
  cameraLabel = 'Tomar Foto con Cámara',
  galleryLabel = 'Subir desde Galería o Archivos',
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [modoCamara, setModoCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');
  const [fotoCapturada, setFotoCapturada] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Iniciar stream de cámara
  const iniciarCamara = async () => {
    setErrorCamara('');
    setFotoCapturada(null);
    setModoCamara(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (_err) {
      setErrorCamara('No se pudo acceder a la cámara del dispositivo. Puedes subir el documento desde tus archivos.');
    }
  };

  // Detener cámara al cerrar o cambiar modo
  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setModoCamara(false);
    setFotoCapturada(null);
  };

  useEffect(() => {
    if (!isOpen) {
      detenerCamara();
    }
  }, [isOpen]);

  // Tomar captura instantánea desde el video
  const capturarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    // Centrar y recortar cuadrado
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFotoCapturada(dataUrl);
  };

  // Confirmar foto tomada con cámara
  const confirmarFotoCamara = () => {
    if (fotoCapturada) {
      onPhotoSelected(fotoCapturada);
      detenerCamara();
      onClose();
    }
  };

  // Subir desde archivos
  const manejarArchivoGaleria = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (evento) => {
      onPhotoSelected(evento.target?.result);
      onClose();
    };
    lector.readAsDataURL(archivo);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          className={`w-full max-w-[340px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border overflow-hidden mx-auto transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {modoCamara ? `Capturar ${title}` : title}
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
            </div>
            <button
              onClick={() => {
                detenerCamara();
                onClose();
              }}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!modoCamara ? (
            /* Menú de 2 Opciones: Cámara o Galería */
            <div className="space-y-3 pb-2">
              <button
                type="button"
                onClick={iniciarCamara}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left cursor-pointer shadow-2xs group ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-white'
                    : 'bg-lochmara-50/80 hover:bg-lochmara-100 border-lochmara-200/80 text-slate-900'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center shadow-md shadow-lochmara-600/20 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cameraLabel}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Usa la cámara de tu dispositivo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left cursor-pointer shadow-2xs group ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-900'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{galleryLabel}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selecciona una imagen en JPG o PNG</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarArchivoGaleria}
                className="hidden"
              />
            </div>
          ) : (
            /* Vista de Cámara en Vivo con Captura y Reintento */
            <div className="space-y-3">
              {errorCamara ? (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorCamara}</span>
                </div>
              ) : (
                <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-lochmara-500 shadow-lg bg-black flex items-center justify-center">
                  {!fotoCapturada ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <img
                      src={fotoCapturada}
                      alt="Captura"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Controles de la cámara */}
              {!errorCamara && (
                <div className="flex gap-2 pt-2">
                  {!fotoCapturada ? (
                    <button
                      type="button"
                      onClick={capturarFoto}
                      className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/25"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capturar</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setFotoCapturada(null)}
                        className={`flex-1 py-3 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Repetir</span>
                      </button>
                      <button
                        type="button"
                        onClick={confirmarFotoCamara}
                        className="flex-1 py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Usar Foto</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
