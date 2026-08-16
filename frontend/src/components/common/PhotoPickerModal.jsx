import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    } catch (err) {
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
          className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-hidden text-slate-900 mx-auto"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {modoCamara ? `Capturar ${title}` : title}
              </h3>
              <p className="text-[10px] text-slate-500">{subtitle}</p>
            </div>
            <button
              onClick={() => {
                detenerCamara();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
                className="w-full p-4 rounded-2xl bg-lochmara-50/80 hover:bg-lochmara-100 border border-lochmara-200/80 flex items-center gap-3.5 transition-all text-left cursor-pointer shadow-2xs group"
              >
                <div className="w-11 h-11 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center shadow-md shadow-lochmara-600/20 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{cameraLabel}</p>
                  <p className="text-[10px] text-slate-500">Usa la cámara de tu dispositivo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-3.5 transition-all text-left cursor-pointer shadow-2xs group"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{galleryLabel}</p>
                  <p className="text-[10px] text-slate-500">Selecciona una imagen en JPG o PNG</p>
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
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
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
                        className="flex-1 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
