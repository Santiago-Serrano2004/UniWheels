import axios from 'axios';

/**
 * Servicio de Geocodificación y Búsqueda de Lugares y Direcciones
 * Utiliza los estándares abiertos de OpenStreetMap / Photon API y Nominatim
 * con cobertura detallada para Bucaramanga y su Área Metropolitana (Floridablanca, Girón, Piedecuesta).
 */

const PHOTON_API_URL = 'https://photon.komoot.io/api';
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Coordenadas centrales de referencia: Bucaramanga / AMB
const BUCARAMANGA_CENTER = { lat: 7.1193, lon: -73.1227 };

// Puntos de encuentro y barrios populares en Bucaramanga y AMB para sugerencias instantáneas
export const LUGARES_POPULARES_AMB = [
  { nombre: 'Parque San Pío', direccion: 'Carrera 33 con Calle 45, Cabecera', coords: [7.1186, -73.1102] },
  { nombre: 'Centro Comercial Cañaveral', direccion: 'Calle 30 # 25-71, Floridablanca', coords: [7.0678, -73.1066] },
  { nombre: 'Centro Comercial Cacique', direccion: 'Transversal 93 # 34-99, Bucaramanga', coords: [7.1045, -73.1098] },
  { nombre: 'Centro Comercial Megamall', direccion: 'Carrera 33A # 29-15, Bucaramanga', coords: [7.1298, -73.1189] },
  { nombre: 'Parque de las Palmas', direccion: 'Calle 44 con Carrera 29, Bucaramanga', coords: [7.1205, -73.1145] },
  { nombre: 'Puerta del Sol', direccion: 'Autopista Bucaramanga - Floridablanca', coords: [7.1023, -73.1185] },
  { nombre: 'Estación Provenza (Metrolínea)', direccion: 'Autopista Sur con Calle 105', coords: [7.0856, -73.1142] },
  { nombre: 'Parque Principal de Piedecuesta', direccion: 'Carrera 6 con Calle 9, Piedecuesta', coords: [6.9875, -73.0498] },
  { nombre: 'Parque Principal de Girón', direccion: 'Carrera 25 con Calle 30, Girón', coords: [7.0725, -73.1698] },
  { nombre: 'Parque Santander (Centro)', direccion: 'Calle 35 con Carrera 19, Bucaramanga', coords: [7.1225, -73.1285] },
];

export const placesApiService = {
  /**
   * Buscar sugerencias de lugares o direcciones en tiempo real (Autocomplete)
   */
  async searchPlaces(query) {
    if (!query || query.trim().length < 2) {
      return LUGARES_POPULARES_AMB.slice(0, 5);
    }

    const terminoLimpio = query.trim();

    try {
      // 1. Intentar con Photon API (Fuzzy search rápido georreferenciado en Santander)
      const res = await axios.get(PHOTON_API_URL, {
        params: {
          q: `${terminoLimpio} Bucaramanga Santander Colombia`,
          lat: BUCARAMANGA_CENTER.lat,
          lon: BUCARAMANGA_CENTER.lon,
          limit: 6,
        },
        timeout: 4000,
      });

      if (res.data?.features && res.data.features.length > 0) {
        return res.data.features.map((item) => {
          const props = item.properties;
          const coords = [item.geometry.coordinates[1], item.geometry.coordinates[0]]; // [lat, lon]
          const nombreLugar = props.name || props.street || terminoLimpio;
          const detalles = [props.district, props.city, props.state]
            .filter(Boolean)
            .join(', ');

          return {
            nombre: nombreLugar,
            direccion: detalles || 'Área Metropolitana de Bucaramanga',
            coords,
          };
        });
      }
    } catch {
      // Si falla Photon, intentar con Nominatim
    }

    try {
      // 2. Respaldo con Nominatim OpenStreetMap
      const resNominatim = await axios.get(NOMINATIM_SEARCH_URL, {
        params: {
          q: `${terminoLimpio}, Santander, Colombia`,
          format: 'json',
          countrycodes: 'co',
          limit: 5,
        },
        headers: { 'User-Agent': 'UniWheelsApp/1.0' },
        timeout: 4000,
      });

      if (resNominatim.data && resNominatim.data.length > 0) {
        return resNominatim.data.map((item) => ({
          nombre: item.name || item.display_name.split(',')[0],
          direccion: item.display_name,
          coords: [parseFloat(item.lat), parseFloat(item.lon)],
        }));
      }
    } catch {}

    // 3. Respaldo local de concordancia con LUGARES_POPULARES_AMB
    const filtrados = LUGARES_POPULARES_AMB.filter((l) =>
      l.nombre.toLowerCase().includes(terminoLimpio.toLowerCase()) ||
      l.direccion.toLowerCase().includes(terminoLimpio.toLowerCase())
    );

    return filtrados.length > 0 ? filtrados : LUGARES_POPULARES_AMB.slice(0, 4);
  },

  /**
   * Geocodificación Inversa: Obtener nombre de dirección a partir de coordenadas [lat, lon]
   */
  async reverseGeocode(lat, lon) {
    try {
      const res = await axios.get(PHOTON_REVERSE_URL, {
        params: { lat, lon },
        timeout: 3500,
      });

      if (res.data?.features && res.data.features.length > 0) {
        const props = res.data.features[0].properties;
        const nombre = props.name || props.street || 'Ubicación seleccionada';
        const ciudad = props.city || props.district || 'Bucaramanga';
        return `${nombre}, ${ciudad}`;
      }
    } catch {}

    try {
      const res = await axios.get(NOMINATIM_REVERSE_URL, {
        params: {
          lat,
          lon,
          format: 'json',
        },
        headers: { 'User-Agent': 'UniWheelsApp/1.0' },
        timeout: 3500,
      });

      if (res.data?.display_name) {
        return res.data.display_name.split(',').slice(0, 3).join(', ');
      }
    } catch {}

    return `Ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  },
};
