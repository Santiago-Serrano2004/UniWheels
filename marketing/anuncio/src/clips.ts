// Grabaciones reales de la app (iPhone: Centro de Control > Grabar pantalla).
// Guía de qué grabar en cada una: marketing/anuncio/GUION_GRABACION.md
// Copia cada video a public/clips/ y pon aquí el nombre del archivo.
// Mientras una entrada sea null, el anuncio muestra una pantalla de muestra.
export const CLIPS = {
  conductor_publicar: null as string | null, // p. ej. 'conductor_publicar.mp4'
  pasajero_buscar: null as string | null,
  pasajero_reservar: null as string | null,
  conductor_reserva_recibida: null as string | null,
  pasajero_viaje_activo: null as string | null,
  conductor_navegacion: null as string | null,
  pasajero_pin: null as string | null,
  conductor_pin: null as string | null,
  pasajero_en_viaje: null as string | null,
  conductor_completar: null as string | null,
  pasajero_calificar: null as string | null,
};

export type ClaveClip = keyof typeof CLIPS;
