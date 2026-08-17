/**
 * Servicio de Síntesis de Voz para Navegación GPS Asistida (Web Speech API)
 * Proporciona indicaciones habladas paso a paso en español para el conductor sin salir de la app.
 */

let lastSpokenText = '';
let isMuted = false;

export const speechGuidanceService = {
  /**
   * Verificar si el navegador soporta síntesis de voz
   */
  isSupported() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  },

  /**
   * Alternar silencio / voz
   */
  toggleMute() {
    isMuted = !isMuted;
    if (isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return isMuted;
  },

  isMuted() {
    return isMuted;
  },

  setMuted(muted) {
    isMuted = muted;
    if (isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * Pronunciar indicación de maniobra
   */
  speak(text, force = false) {
    if (isMuted || !this.isSupported()) return;

    // Evitar repetir la misma frase consecutivamente
    if (!force && text === lastSpokenText) return;
    lastSpokenText = text;

    try {
      window.speechSynthesis.cancel(); // Cancelar locución anterior para no generar retrasos

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CO'; // Español Colombia
      utterance.rate = 1.05; // Velocidad de locución natural y ágil
      utterance.pitch = 1.0;

      // Buscar voz en español disponible
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(
        (v) => v.lang.startsWith('es') || v.lang.includes('Spanish')
      );
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Error en síntesis de voz de navegación:', e);
    }
  },

  /**
   * Detener cualquier voz en curso
   */
  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  },
};
