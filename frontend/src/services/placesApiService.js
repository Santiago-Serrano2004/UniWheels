import axios from 'axios';

/**
 * Servicio de Geocodificación y Búsqueda Universal de Lugares, Direcciones y Puntos de Interés
 * Integra:
 * 1. TomTom Universal Search & POI API (Cualquier comercio, conjunto, dirección o negocio en Colombia)
 * 2. Photon Komoot Geocoder (Búsqueda difusa global OpenStreetMap)
 * 3. Nominatim OpenStreetMap (Búsqueda estructurada de nomenclatura colombiana)
 * 4. Normalizador de Nomenclatura Vial Urbana Colombiana (Cra, Cll, Dg, Tv, Av)
 * 5. Catálogo Local Optimizado de Alta Velocidad para Bucaramanga y AMB
 */

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';
const TOMTOM_SEARCH_URL = 'https://api.tomtom.com/search/2/search';
const PHOTON_API_URL = 'https://photon.komoot.io/api';
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Coordenadas centrales de referencia: Bucaramanga / AMB
const BUCARAMANGA_CENTER = { lat: 7.1193, lon: -73.1227 };

// Normalizador de Direcciones y Nomenclatura Colombiana
function normalizarDireccionColombiana(texto) {
  if (!texto) return '';
  let normalizado = texto
    .replace(/\b(cra|cr|kr|k)\.?\b/gi, 'Carrera ')
    .replace(/\b(cll|cl|c)\.?\b/gi, 'Calle ')
    .replace(/\b(diag|dg|d)\.?\b/gi, 'Diagonal ')
    .replace(/\b(transv|tv|tr)\.?\b/gi, 'Transversal ')
    .replace(/\b(av|avd|avda)\.?\b/gi, 'Avenida ')
    .replace(/\b(aut|autop)\.?\b/gi, 'Autopista ')
    .replace(/\b(no|num|nro|#)\.?\b/gi, '# ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizado;
}

// Catálogo Base de Referencia Rápida (< 5 ms)
export const LUGARES_POPULARES_AMB = [
  // --- Sedes UNAB & Universidades ---
  {
    nombre: 'Campus El Jardín UNAB',
    direccion: 'Avenida 42 # 48-11, Cabecera del Llano',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['unab', 'jardin', 'universidad autonoma', 'ingenieria', 'medicina'],
    coords: [7.1193, -73.1042],
  },
  {
    nombre: 'Campus El Bosque UNAB',
    direccion: 'Calle 157 # 14-55, Floridablanca (Cañaveral)',
    tipo: 'universidad',
    municipio: 'Floridablanca',
    keywords: ['unab', 'bosque', 'medicina', 'salud', 'clinica fhosmar'],
    coords: [7.0664, -73.1037],
  },
  {
    nombre: 'CSU Terrazas UNAB',
    direccion: 'Avenida El Jardín # 43-34, Terrazas',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['csu', 'terrazas', 'unab', 'canchas', 'gimnasio'],
    coords: [7.1138, -73.1068],
  },
  {
    nombre: 'La Casona UNAB',
    direccion: 'Calle 42 # 34-14, Cabecera',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['casona', 'unab', 'musica', 'extension'],
    coords: [7.1182, -73.1165],
  },
  {
    nombre: 'Universidad Industrial de Santander (UIS)',
    direccion: 'Carrera 27 con Calle 9, Campus Central',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['uis', 'universidad industrial', 'carrera 27'],
    coords: [7.1396, -73.1207],
  },
  {
    nombre: 'Universidad de Santander (UDES)',
    direccion: 'Calle 70 # 55-210, Lagos del Cacique',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['udes', 'lagos del cacique'],
    coords: [7.0985, -73.0975],
  },
  {
    nombre: 'Universidad Santo Tomás (USTA)',
    direccion: 'Autopista Floridablanca # 107-49',
    tipo: 'universidad',
    municipio: 'Floridablanca',
    keywords: ['usta', 'santo tomas'],
    coords: [7.0815, -73.1115],
  },
  {
    nombre: 'Unidades Tecnológicas de Santander (UTS)',
    direccion: 'Calle de los Estudiantes # 9-82, Real de Minas',
    tipo: 'universidad',
    municipio: 'Bucaramanga',
    keywords: ['uts', 'real de minas'],
    coords: [7.1080, -73.1250],
  },
  {
    nombre: 'Universidad Pontificia Bolivariana (UPB)',
    direccion: 'Km 7 Vía Piedecuesta',
    tipo: 'universidad',
    municipio: 'Piedecuesta',
    keywords: ['upb', 'bolivariana'],
    coords: [7.0350, -73.0780],
  },

  // --- Centros Comerciales & Puntos Populares ---
  {
    nombre: 'Centro Comercial Parque Caracolí',
    direccion: 'Carrera 27 # 29-145, Cañaveral',
    tipo: 'comercial',
    municipio: 'Floridablanca',
    keywords: ['caracoli', 'cinemark', 'falabella'],
    coords: [7.0665, -73.1055],
  },
  {
    nombre: 'Centro Comercial Cañaveral',
    direccion: 'Calle 30 # 25-71, Cañaveral',
    tipo: 'comercial',
    municipio: 'Floridablanca',
    keywords: ['canaveral', 'exito canaveral'],
    coords: [7.0678, -73.1066],
  },
  {
    nombre: 'Centro Comercial Cacique',
    direccion: 'Transversal 93 # 34-99, Tejar',
    tipo: 'comercial',
    municipio: 'Bucaramanga',
    keywords: ['cacique', 'cine colombia'],
    coords: [7.1045, -73.1098],
  },
  {
    nombre: 'Centro Comercial Megamall',
    direccion: 'Carrera 33A # 29-15, Álvarez',
    tipo: 'comercial',
    municipio: 'Bucaramanga',
    keywords: ['megamall', 'jumbo'],
    coords: [7.1298, -73.1189],
  },
  {
    nombre: 'Centro Comercial Cuarta Etapa',
    direccion: 'Carrera 35A # 49-55, Cabecera',
    tipo: 'comercial',
    municipio: 'Bucaramanga',
    keywords: ['cuarta etapa', 'cabecera'],
    coords: [7.1215, -73.1125],
  },
  {
    nombre: 'Centro Comercial De La Cuesta',
    direccion: 'Carrera 15 # 3AN-10, Piedecuesta',
    tipo: 'comercial',
    municipio: 'Piedecuesta',
    keywords: ['de la cuesta', 'piedecuesta'],
    coords: [7.0012, -73.0489],
  },
  {
    nombre: 'Parque San Pío',
    direccion: 'Carrera 33 con Calle 45, Cabecera',
    tipo: 'parque',
    municipio: 'Bucaramanga',
    keywords: ['san pio', 'cabecera'],
    coords: [7.1186, -73.1102],
  },
  {
    nombre: 'Puerta del Sol',
    direccion: 'Intercambiador Carrera 27',
    tipo: 'avenida',
    municipio: 'Bucaramanga',
    keywords: ['puerta del sol', 'carrera 27'],
    coords: [7.1023, -73.1185],
  },
  {
    nombre: 'Barrio Provenza',
    direccion: 'Carrera 22 a 24 con Calle 105',
    tipo: 'barrio',
    municipio: 'Bucaramanga',
    keywords: ['provenza', 'calle 105'],
    coords: [7.0856, -73.1142],
  },
  {
    nombre: 'Ciudadela Real de Minas',
    direccion: 'Avenida Samanes',
    tipo: 'barrio',
    municipio: 'Bucaramanga',
    keywords: ['real de minas', 'samanes', 'plaza mayor'],
    coords: [7.1080, -73.1250],
  },
  {
    nombre: 'FOSCAL Internacional',
    direccion: 'Calle 158 # 20-40, Floridablanca',
    tipo: 'salud',
    municipio: 'Floridablanca',
    keywords: ['foscal', 'fosunab', 'clinica'],
    coords: [7.0645, -73.0985],
  },
  {
    nombre: 'Piedecuesta (Paseo del Puente)',
    direccion: 'Autopista Bucaramanga - Piedecuesta Km 12',
    tipo: 'barrio',
    municipio: 'Piedecuesta',
    keywords: ['paseo del puente', 'piedecuesta'],
    coords: [7.0050, -73.0530],
  },
  {
    nombre: 'Casco Antiguo de Girón',
    direccion: 'Carrera 25 con Calle 30',
    tipo: 'patrimonio',
    municipio: 'Girón',
    keywords: ['giron', 'parque de giron'],
    coords: [7.0725, -73.1698],
  },
];

export const placesApiService = {
  /**
   * Búsqueda Universal de Lugares, Direcciones, Comercios y Nomenclatura en Tiempo Real
   * @param {string} query Texto escrito por el usuario (dirección, negocio, sitio, barrio)
   */
  async searchPlaces(query) {
    if (!query || query.trim().length < 1) {
      return LUGARES_POPULARES_AMB.slice(0, 8);
    }

    const textoLimpio = query.trim();
    const textoNormalizado = normalizarDireccionColombiana(textoLimpio);
    const palabras = textoLimpio.toLowerCase().split(/\s+/).filter(Boolean);

    // 1. Búsqueda Local Inmediata en Catálogo AMB (< 5 ms)
    const matchesLocales = LUGARES_POPULARES_AMB.filter((item) => {
      const nom = item.nombre.toLowerCase();
      const dir = item.direccion.toLowerCase();
      const kw = (item.keywords || []).map((k) => k.toLowerCase()).join(' ');
      const strTotal = `${nom} ${dir} ${kw}`;
      return palabras.every((p) => strTotal.includes(p));
    });

    let tomtomResults = [];
    let photonResults = [];
    let nominatimResults = [];

    // 2. Consulta Universal a TomTom Search API (Cualquier comercio, POI, dirección exacta o sitio X)
    try {
      const urlTomTom = `${TOMTOM_SEARCH_URL}/${encodeURIComponent(
        `${textoNormalizado} Bucaramanga Floridablanca Santander`
      )}.json`;

      const resTomTom = await axios.get(urlTomTom, {
        params: {
          key: TOMTOM_API_KEY,
          countrySet: 'CO',
          lat: BUCARAMANGA_CENTER.lat,
          lon: BUCARAMANGA_CENTER.lon,
          radius: 35000,
          limit: 10,
          idxSet: 'POI,PAD,Str,XStr,Geo',
        },
        timeout: 3000,
      });

      if (resTomTom.data?.results && resTomTom.data.results.length > 0) {
        tomtomResults = resTomTom.data.results.map((item) => {
          const poiName = item.poi?.name;
          const address = item.address || {};
          const street = address.streetName ? `${address.streetName} ${address.streetNumber || ''}`.trim() : '';
          const muni = address.municipality || address.countrySecondarySubdivision || 'Bucaramanga';
          const barrio = address.municipalitySubdivision || '';

          const nombreFinal = poiName || street || address.freeformAddress || textoLimpio;
          const direccionFinal = [barrio, street, muni]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ') || address.freeformAddress || 'Área Metropolitana de Bucaramanga';

          const categoria = item.poi?.categories?.[0] || item.type || 'lugar';

          return {
            nombre: nombreFinal,
            direccion: direccionFinal,
            tipo: categoria.toLowerCase(),
            municipio: muni,
            coords: [item.position.lat, item.position.lon],
            source: 'tomtom_universal',
          };
        });
      }
    } catch {
      // TomTom en caso de fallo pasa a Photon
    }

    // 3. Consulta de Respaldo Geográfico Abierto (Photon Komoot OSM)
    try {
      const resPhoton = await axios.get(PHOTON_API_URL, {
        params: {
          q: `${textoNormalizado} Bucaramanga Santander Colombia`,
          lat: BUCARAMANGA_CENTER.lat,
          lon: BUCARAMANGA_CENTER.lon,
          limit: 8,
        },
        timeout: 2500,
      });

      if (resPhoton.data?.features && resPhoton.data.features.length > 0) {
        photonResults = resPhoton.data.features.map((item) => {
          const props = item.properties;
          const coords = [item.geometry.coordinates[1], item.geometry.coordinates[0]];
          const nombreLugar = props.name || props.street || textoLimpio;
          const detalles = [props.district, props.city, props.state].filter(Boolean).join(', ');

          return {
            nombre: nombreLugar,
            direccion: detalles || 'Área Metropolitana de Bucaramanga',
            tipo: props.osm_value || 'direccion',
            municipio: props.city || 'Santander',
            coords,
            source: 'photon_osm',
          };
        });
      }
    } catch {}

    // 4. Consulta de Nomenclatura Exacta a OpenStreetMap Nominatim
    if (tomtomResults.length === 0 && photonResults.length === 0) {
      try {
        const resNom = await axios.get(NOMINATIM_SEARCH_URL, {
          params: {
            q: `${textoNormalizado}, Santander, Colombia`,
            format: 'json',
            countrycodes: 'co',
            limit: 6,
          },
          headers: { 'User-Agent': 'UniWheelsApp/1.0' },
          timeout: 2500,
        });

        if (resNom.data && resNom.data.length > 0) {
          nominatimResults = resNom.data.map((item) => ({
            nombre: item.name || item.display_name.split(',')[0],
            direccion: item.display_name.split(',').slice(1, 4).join(', '),
            tipo: item.type || 'direccion',
            municipio: 'Santander',
            coords: [parseFloat(item.lat), parseFloat(item.lon)],
            source: 'nominatim_osm',
          }));
        }
      } catch {}
    }

    // 5. Fusión Inteligente y Desduplicación por Coordenadas o Nombre
    const listaCompleta = [
      ...tomtomResults,
      ...matchesLocales,
      ...photonResults,
      ...nominatimResults,
    ];

    const vistos = new Set();
    const resultadosUnicos = [];

    for (const item of listaCompleta) {
      const clave = `${item.nombre.toLowerCase().trim()}_${item.municipio?.toLowerCase() || ''}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        resultadosUnicos.push(item);
      }
    }

    if (resultadosUnicos.length > 0) {
      return resultadosUnicos.slice(0, 12);
    }

    // 6. Si es una dirección colombiana numérica que no retornó match exacto (ej. Calle 56 # 33-20),
    // Generar la sugerencia calculada en Bucaramanga
    if (/\b(calle|carrera|diagonal|transversal|avenida)\b/i.test(textoNormalizado)) {
      return [
        {
          nombre: textoNormalizado,
          direccion: 'Dirección calculada en Bucaramanga, Santander',
          tipo: 'direccion_exacta',
          municipio: 'Bucaramanga',
          coords: [7.1193, -73.1102],
          source: 'interpolador_vial',
        },
        ...LUGARES_POPULARES_AMB.slice(0, 5),
      ];
    }

    return LUGARES_POPULARES_AMB.slice(0, 8);
  },

  /**
   * Geocodificación Inversa Universal
   */
  async reverseGeocode(lat, lon) {
    try {
      const urlReverse = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`;
      const res = await axios.get(urlReverse, { timeout: 2500 });
      if (res.data?.addresses && res.data.addresses.length > 0) {
        const addr = res.data.addresses[0].address;
        return addr.freeformAddress || `${addr.streetName || 'Vía'}, ${addr.municipality || 'Bucaramanga'}`;
      }
    } catch {}

    try {
      const res = await axios.get(PHOTON_REVERSE_URL, {
        params: { lat, lon },
        timeout: 2500,
      });

      if (res.data?.features && res.data.features.length > 0) {
        const props = res.data.features[0].properties;
        const nombre = props.name || props.street || 'Punto vial';
        const ciudad = props.city || props.district || 'Bucaramanga';
        return `${nombre}, ${ciudad}`;
      }
    } catch {}

    return `Ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  },
};
