import axios from 'axios';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas (recarga diaria)

/**
 * Gestor de almacenamiento en caché con expiración diaria (24h)
 */
const obtenerCache = (clave) => {
  try {
    const raw = localStorage.getItem(`uniwheels_nhtsa_${clave}`);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`uniwheels_nhtsa_${clave}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const guardarCache = (clave, data) => {
  try {
    localStorage.setItem(
      `uniwheels_nhtsa_${clave}`,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {}
};

// Marcas populares y oficiales en el mercado colombiano
export const MARCAS_COLOMBIA_CARROS = [
  'Chevrolet',
  'Renault',
  'Mazda',
  'Kia',
  'Toyota',
  'Nissan',
  'Suzuki',
  'Volkswagen',
  'Hyundai',
  'Ford',
  'BYD',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Peugeot',
  'Honda',
  'Subaru',
  'Mitsubishi',
  'Fiat',
  'Jeep',
  'Chery',
  'JAC',
  'MG',
  'Volvo',
  'Foton',
  'Otra Marca',
];

export const MARCAS_COLOMBIA_MOTOS = [
  'Yamaha',
  'Bajaj',
  'Honda',
  'Suzuki',
  'KTM',
  'TVS',
  'AKT',
  'Hero',
  'Kawasaki',
  'BMW Motorrad',
  'Royal Enfield',
  'Husqvarna',
  'Ducati',
  'Benelli',
  'Super Soco',
  'NIU',
  'Starker',
  'Otra Marca',
];

/**
 * Modelos de respaldo en caso de desconexión o fallo de red con NHTSA
 */
const MODELOS_FALLBACK = {
  Chevrolet: ['Onix', 'Spark GT', 'Spark', 'Tracker', 'Sail', 'Joy', 'Captiva', 'Aveo', 'Cruze', 'D-Max', 'Blazer', 'Equinox', 'Bolt EV'],
  Renault: ['Sandero', 'Logan', 'Duster', 'Kwid', 'Stepway', 'Kwid E-Tech', 'Zoe', 'Megane E-Tech', 'Captur', 'Koleos', 'Clio', 'Twingo'],
  Mazda: ['Mazda 2', 'Mazda 3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-60', 'Mazda 6', 'MX-5'],
  Kia: ['Picanto', 'Rio', 'Sportage', 'Seltos', 'Sonet', 'Niro', 'EV6', 'Cerato', 'Stonic', 'K3'],
  Toyota: ['Corolla', 'Corolla Cross', 'Yaris', 'Yaris Cross', 'Hilux', 'Fortuner', 'RAV4', 'Prado', 'Land Cruiser', 'bZ4X'],
  Nissan: ['March', 'Versa', 'Kicks', 'Frontier', 'Sentra', 'Qashqai', 'X-Trail', 'Leaf EV'],
  Suzuki: ['Swift', 'Vitara', 'S-Cross', 'Jimny', 'Baleno', 'Alto', 'S-Presso', 'Grand Vitara'],
  Volkswagen: ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Taos', 'Nivus', 'Tiguan', 'Jetta', 'Golf', 'ID.4'],
  Hyundai: ['HB20', 'Grand i10', 'Tucson', 'Creta', 'Kona', 'Ioniq', 'Ioniq 5', 'Santa Fe'],
  Ford: ['Fiesta', 'EcoSport', 'Escape', 'Ranger', 'Explorer', 'Bronco Sport', 'Mustang Mach-E'],
  BYD: ['Dolphin', 'Song Plus', 'Yuan Plus', 'Seagull', 'Seal', 'Han EV', 'Tang EV'],
  Yamaha: ['FZ-25', 'FZ 2.0', 'NMAX 155', 'Crypton FI', 'MT-03', 'MT-07', 'XTZ 125', 'XTZ 150', 'XTZ 250', 'R15'],
  Bajaj: ['Pulsar NS 200', 'Pulsar NS 160', 'Pulsar N250', 'Pulsar 180', 'Boxer CT 100', 'Dominar 400', 'Dominar 250'],
  Honda: ['CB 125F', 'CB 160F', 'CB 190R', 'CB 300F', 'XR 150L', 'XR 190L', 'XRE 300', 'Dio 110', 'PCX 160', 'Navi'],
  KTM: ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 250', 'Adventure 390'],
  AKT: ['NKD 125', 'CR4 125', 'CR4 162', 'TT Dual Sport 200', 'TTR 125', 'Dynamic Pro 125'],
};

export const vehicleApiService = {
  /**
   * Obtiene la lista de modelos de una marca en vivo desde NHTSA vPIC API con caché diaria de 24h.
   */
  async getModelsForMake(marca) {
    if (!marca || marca === 'Otra Marca') {
      return ['Modelo Estándar', 'Otro'];
    }

    const claveCache = `models_${marca.toLowerCase().replace(/\s+/g, '_')}`;
    const cacheado = obtenerCache(claveCache);
    if (cacheado && Array.isArray(cacheado) && cacheado.length > 0) {
      return cacheado;
    }

    try {
      // Normalizar nombre de marca para NHTSA
      const marcaQuery = encodeURIComponent(marca.split(' ')[0]);
      const res = await axios.get(
        `${NHTSA_BASE_URL}/getmodelsformake/${marcaQuery}?format=json`,
        { timeout: 6000 }
      );

      if (res.data && res.data.Results && res.data.Results.length > 0) {
        // Filtrar y ordenar nombres únicos de modelos
        const nombresModelos = [
          ...new Set(
            res.data.Results.map((r) => r.Model_Name.trim()).filter((m) => m && m.length > 1)
          ),
        ].sort((a, b) => a.localeCompare(b));

        // Añadir opción "Otro modelo" al final
        nombresModelos.push('Otro modelo...');

        guardarCache(claveCache, nombresModelos);
        return nombresModelos;
      }

      // Si no hay resultados de la API, usar fallback
      const fallback = MODELOS_FALLBACK[marca] || ['Modelo Estándar', 'Otro'];
      guardarCache(claveCache, fallback);
      return fallback;
    } catch (err) {
      // Fallback ante fallo de red
      const fallback = MODELOS_FALLBACK[marca] || ['Modelo Estándar', 'Otro'];
      return fallback;
    }
  },
};
