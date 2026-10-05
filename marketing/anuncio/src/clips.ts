// Grabaciones reales de la app (iPhone, Centro de Control > Grabar pantalla).
// Copia cada video a public/clips/ y pon aquí el nombre del archivo.
// Mientras una entrada sea null, el anuncio usa una pantalla de muestra.
export const CLIPS: Record<'buscar' | 'reservar' | 'pin' | 'publicar' | 'sos', string | null> = {
  buscar: null, // p. ej. 'buscar.mp4'
  reservar: null,
  pin: null,
  publicar: null,
  sos: null,
};
