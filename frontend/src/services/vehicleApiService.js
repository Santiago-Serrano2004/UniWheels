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

/**
 * Formatear nombres en Title Case limpio (ej. "MERCEDES-BENZ" -> "Mercedes-Benz")
 */
const formatearNombreMarca = (str) => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.length <= 3 && !trimmed.includes(' ')) {
    return trimmed.toUpperCase(); // BYD, BMW, GMC, JAC, MG, JMC, NIU, KTM, TVS, AKT
  }
  return trimmed
    .toLowerCase()
    .split(/([ -/])/)
    .map((word) =>
      word.length > 0 && !['-', ' ', '/'].includes(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join('');
};

// Marcas populares en Colombia para ordenarlas al inicio
export const MARCAS_POPULARES_CARROS = [
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
  'Changan',
  'DFSK',
  'Great Wall',
  'Haval',
  'Seat',
  'Cupra',
  'JMC',
  'Baic',
  'Dongfeng',
  'Geely',
  'SsangYong',
  'Porsche',
  'Mini',
  'Land Rover',
  'Tesla',
];

export const MARCAS_POPULARES_MOTOS = [
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
  'Victory',
  'Auteco',
  'Kymco',
  'Sym',
  'Aprilia',
  'Vespa',
  'Piaggio',
  'Vento',
  'Super Soco',
  'NIU',
  'Starker',
  'Harley-Davidson',
  'Triumph',
  'CFMoto',
  'Zontes',
  'Ayco',
  'UM',
];

export const MARCAS_COLOMBIA_CARROS = MARCAS_POPULARES_CARROS;
export const MARCAS_COLOMBIA_MOTOS = MARCAS_POPULARES_MOTOS;

/**
 * Catálogo exhaustivo de respaldo para marcas colombianas / regionales
 */
const MODELOS_FALLBACK = {
  Chevrolet: [
    'Onix', 'Spark GT', 'Spark', 'Tracker', 'Sail', 'Joy', 'Captiva', 'Aveo', 'Cruze',
    'D-Max', 'Blazer', 'Equinox', 'Bolt EV', 'Traverse', 'Tahoe', 'Suburban', 'Optra',
    'Corsa', 'Luv', 'Monza', 'Sprint', 'Camaro', 'Silverado', 'Colorado', 'Montana',
  ],
  Renault: [
    'Sandero', 'Logan', 'Duster', 'Kwid', 'Stepway', 'Kwid E-Tech', 'Zoe', 'Megane E-Tech',
    'Captur', 'Koleos', 'Clio', 'Twingo', 'Symbol', 'Kangoo', 'Master', 'Oroch', 'Arkana',
    'Fluence', 'Scenic', 'R19', 'R9', 'Megane', 'Trafic',
  ],
  Mazda: [
    'Mazda 2', 'Mazda 3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-60', 'CX-90', 'CX-3',
    'Mazda 6', 'MX-5', 'BT-50', 'Allegro', 'Matsuda 323', 'Mazda 626',
  ],
  Kia: [
    'Picanto', 'Rio', 'Sportage', 'Seltos', 'Sonet', 'Niro', 'EV6', 'EV9', 'Cerato',
    'Stonic', 'K3', 'K5', 'Carnival', 'Carens', 'Sorento', 'Soul', 'Mohave',
  ],
  Toyota: [
    'Corolla', 'Corolla Cross', 'Yaris', 'Yaris Cross', 'Hilux', 'Fortuner', 'RAV4',
    'Prado', 'Land Cruiser', 'bZ4X', '4Runner', 'Tundra', 'Tacoma', 'Camry', 'Prius',
    'Avanza', 'Rush', 'Sequoia', 'Highlander',
  ],
  Nissan: [
    'March', 'Versa', 'Kicks', 'Frontier', 'Sentra', 'Qashqai', 'X-Trail', 'Leaf EV',
    'Ariya', 'Pathfinder', 'Patrol', 'Tiida', 'Navara', 'Murano', 'Juke',
  ],
  Suzuki: [
    'Swift', 'Vitara', 'S-Cross', 'Jimny', 'Baleno', 'Alto', 'S-Presso', 'Grand Vitara',
    'Ciaz', 'Ertiga', 'Forenza', 'Ignis', 'XL7', 'Celerio', 'Samurai',
  ],
  Volkswagen: [
    'Gol', 'Polo', 'Virtus', 'T-Cross', 'Taos', 'Nivus', 'Tiguan', 'Jetta', 'Golf',
    'ID.4', 'Amarok', 'Saveiro', 'Voyage', 'Fox', 'Passat', 'Touareg', 'Beetle',
  ],
  Hyundai: [
    'HB20', 'Grand i10', 'Tucson', 'Creta', 'Kona', 'Ioniq', 'Ioniq 5', 'Ioniq 6',
    'Santa Fe', 'Palisade', 'Elantra', 'Accent', 'Getz', 'Atos', 'Staria', 'Venue',
  ],
  Ford: [
    'Fiesta', 'EcoSport', 'Escape', 'Ranger', 'Explorer', 'Bronco', 'Bronco Sport',
    'Mustang', 'Mustang Mach-E', 'F-150', 'Edge', 'Expedition', 'Fusion', 'Focus',
  ],
  BYD: [
    'Dolphin', 'Song Plus', 'Yuan Plus', 'Seagull', 'Seal', 'Han EV', 'Tang EV',
    'Qin Plus', 'Dolphin Mini', 'Yuan Pro', 'Shark',
  ],
  BMW: [
    'Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3',
    'X4', 'X5', 'X6', 'X7', 'iX', 'iX1', 'iX3', 'i4', 'i7', 'M2', 'M3', 'M4',
  ],
  'Mercedes-Benz': [
    'Clase A', 'Clase C', 'Clase E', 'Clase S', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE',
    'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT',
  ],
  Audi: [
    'A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'e-tron GT',
  ],
  Chery: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'QQ', 'Arrizo 5', 'Fulwin'],
  JAC: ['JS2', 'JS4', 'JS8', 'T6', 'T8', 'E10X', 'E-J7', 'S2', 'S3'],
  Changan: ['CS15', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-T', 'UNI-K', 'Alsvin'],
  DFSK: ['Glory 560', 'Glory 580', 'Glory IX5', 'Seres 3', 'K01S', 'C37'],
  Haval: ['Jolion', 'H6', 'Dargo', 'H2', 'H9'],
  Cupra: ['Formentor', 'Leon', 'Ateca', 'Born', 'Tavascan'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  // Motos
  Yamaha: [
    'FZ-25', 'FZ 2.0', 'FZ 3.0', 'NMAX 155', 'Crypton FI', 'MT-03', 'MT-07', 'MT-09', 'MT-10',
    'XTZ 125', 'XTZ 150', 'XTZ 250 Lander', 'XTZ 250 Tenere', 'R15', 'R3', 'R6', 'R1',
    'Aerox 155', 'BWS FI 125', 'TMAX 560', 'XSR 155', 'XSR 700', 'XSR 900', 'Tenere 700',
  ],
  Bajaj: [
    'Pulsar NS 200', 'Pulsar NS 160', 'Pulsar NS 125', 'Pulsar N250', 'Pulsar N160',
    'Pulsar 180', 'Pulsar 220F', 'Boxer CT 100', 'Boxer 125', 'Dominar 400', 'Dominar 250',
    'Platina 100', 'Discover 125', 'Avenger 220', 'Chetak Electric',
  ],
  Honda: [
    'CB 125F', 'CB 160F', 'CB 190R', 'CB 250 Twister', 'CB 300F Twister', 'CB 500X', 'CB 500F',
    'XR 150L', 'XR 190L', 'XRE 190', 'XRE 300', 'XR 250 Tornado', 'Dio 110', 'PCX 160',
    'Navi', 'Elite 125', 'CBR 250R', 'CBR 600RR', 'CBR 1000RR', 'Transalp 750', 'Africa Twin',
  ],
  Suzuki: [
    'GN 125', 'Gixxer 150', 'Gixxer 250', 'Gixxer SF 250', 'GSX-S 150', 'GSX-R 150',
    'DR 150', 'DR 200', 'DR 650', 'V-Strom 250', 'V-Strom 650', 'V-Strom 800', 'V-Strom 1050',
    'Burgman 125', 'Avenis 125', 'Access 125', 'AX 100', 'Hayabusa',
  ],
  KTM: [
    'Duke 200', 'Duke 250', 'Duke 390', 'Duke 790', 'Duke 890', 'Duke 1290 Super Duke',
    'RC 200', 'RC 390', 'Adventure 250', 'Adventure 390', 'Adventure 790', 'Adventure 890', 'Adventure 1290',
  ],
  TVS: [
    'Apache RTR 160 4V', 'Apache RTR 180', 'Apache RTR 200 4V', 'Apache RR 310',
    'Raider 125', 'NTorq 125', 'Sport 100', 'Neo NX', 'Dazz 110', 'Ronin 225',
  ],
  AKT: [
    'NKD 125', 'CR4 125', 'CR4 162', 'TT Dual Sport 200', 'TTR 125', 'TTR 200',
    'Dynamic Pro 125', 'Dynamic FI 125', 'Special 110', 'Jet 5', 'Flex 125', 'Vogé 300',
  ],
  Hero: [
    'Splendor Pro', 'Eco 100', 'Ignitor 125', 'Hunk 150', 'Hunk 160R', 'XPulse 200 4V',
    'XPulse 200T', 'Xoom 110', 'Dash 125', 'Glamour 125', 'Karizma XMR',
  ],
  Kawasaki: [
    'Ninja 300', 'Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650',
    'Z900', 'Z1000', 'Versys 300', 'Versys 650', 'Versys 1000', 'KLX 150', 'KLX 300', 'KLR 650',
  ],
  'Royal Enfield': [
    'Classic 350', 'Meteor 350', 'Hunter 350', 'Bullet 350', 'Himalayan 411', 'Himalayan 450',
    'Scram 411', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650',
  ],
  Victory: [
    'MRX 125', 'MRX 150', 'MRX 200', 'Black 125', 'Nitro 125', 'Venom 250', 'Switch 150',
    'Life 125', 'Advance 110', 'Zontes 310', 'Zontes 350',
  ],
  'BMW Motorrad': [
    'G 310 R', 'G 310 GS', 'F 750 GS', 'F 850 GS', 'F 900 R', 'F 900 XR', 'R 1250 GS',
    'R 1300 GS', 'S 1000 RR', 'S 1000 XR', 'CE 04 Electric',
  ],
  Ducati: [
    'Monster', 'Scrambler 800', 'Scrambler 1100', 'Hypermotard 950', 'Multistrada V2',
    'Multistrada V4', 'Panigale V2', 'Panigale V4', 'Diavel V4', 'DesertX',
  ],
  Benelli: [
    'TNT 150', 'TNT 25', '180S', '302S', 'TRK 251', 'TRK 502', 'TRK 502X', 'TRK 702',
    'Leoncino 250', 'Leoncino 500', 'Imperiale 400', '502C Cruiser',
  ],
};

export const vehicleApiService = {
  /**
   * Obtener la lista completa de TODAS las marcas disponibles (en vivo desde NHTSA con soporte offline y caché)
   */
  async getAllMakes(tipoVehiculo = 'carro') {
    const isMoto = tipoVehiculo === 'moto';
    const claveCache = `all_makes_${isMoto ? 'moto' : 'car'}`;
    const cacheado = obtenerCache(claveCache);
    if (cacheado && Array.isArray(cacheado) && cacheado.length > 0) {
      return cacheado;
    }

    const marcasPopulares = isMoto ? MARCAS_POPULARES_MOTOS : MARCAS_POPULARES_CARROS;

    try {
      let resultadosApi = [];
      if (isMoto) {
        const res = await axios.get(
          `${NHTSA_BASE_URL}/GetMakesForVehicleType/motorcycle?format=json`,
          { timeout: 7000 }
        );
        resultadosApi = res.data?.Results || [];
      } else {
        // Para carros, consultar tipos de autos y camionetas
        const [resCars, resTrucks, resMpv] = await Promise.allSettled([
          axios.get(`${NHTSA_BASE_URL}/GetMakesForVehicleType/car?format=json`, { timeout: 6000 }),
          axios.get(`${NHTSA_BASE_URL}/GetMakesForVehicleType/truck?format=json`, { timeout: 6000 }),
          axios.get(`${NHTSA_BASE_URL}/GetMakesForVehicleType/multipurpose%20passenger%20vehicle%20(mpv)?format=json`, { timeout: 6000 }),
        ]);

        const cars = resCars.status === 'fulfilled' ? resCars.value.data?.Results || [] : [];
        const trucks = resTrucks.status === 'fulfilled' ? resTrucks.value.data?.Results || [] : [];
        const mpvs = resMpv.status === 'fulfilled' ? resMpv.value.data?.Results || [] : [];
        resultadosApi = [...cars, ...trucks, ...mpvs];
      }

      // Normalizar nombres y eliminar duplicados
      const marcasDesdeApi = resultadosApi
        .map((r) => formatearNombreMarca(r.MakeName || r.Make_Name))
        .filter((nombre) => nombre && nombre.length >= 2 && !/^\d+$/.test(nombre));

      // Combinar con marcas populares de Colombia garantizando presencia
      const todasLasMarcasSet = new Set([...marcasPopulares, ...marcasDesdeApi]);
      const todasLasMarcas = Array.from(todasLasMarcasSet);

      // Separar populares y el resto ordenado alfabéticamente
      const popularesPresentes = marcasPopulares.filter((m) => todasLasMarcasSet.has(m));
      const otrasMarcas = todasLasMarcas
        .filter((m) => !marcasPopulares.includes(m))
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

      const listaFinal = [...popularesPresentes, ...otrasMarcas, 'Otra Marca / Personalizada'];

      guardarCache(claveCache, listaFinal);
      return listaFinal;
    } catch (err) {
      // Fallback a las marcas principales si falla la red
      const fallback = [...marcasPopulares, 'Otra Marca / Personalizada'];
      guardarCache(claveCache, fallback);
      return fallback;
    }
  },

  /**
   * Obtener TODOS los modelos de una marca en vivo desde NHTSA vPIC API
   */
  async getModelsForMake(marca, tipoVehiculo = 'carro') {
    if (!marca || marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca') {
      return ['Modelo Estándar', 'Otro modelo / Escribir manualmente...'];
    }

    const claveCache = `models_${marca.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const cacheado = obtenerCache(claveCache);
    if (cacheado && Array.isArray(cacheado) && cacheado.length > 0) {
      return cacheado;
    }

    const fallbackLocal = MODELOS_FALLBACK[marca] || [];

    try {
      // Normalizar query para NHTSA
      const marcaQuery = encodeURIComponent(marca.split(' ')[0]);
      const res = await axios.get(
        `${NHTSA_BASE_URL}/getmodelsformake/${marcaQuery}?format=json`,
        { timeout: 7000 }
      );

      let modelosApi = [];
      if (res.data && res.data.Results && res.data.Results.length > 0) {
        modelosApi = res.data.Results
          .map((r) => r.Model_Name?.trim())
          .filter((m) => m && m.length > 1 && !m.toLowerCase().includes('unknown'));
      }

      // Unir modelos de la API de NHTSA con los modelos colombianos conocidos
      const modelosUnificados = Array.from(new Set([...fallbackLocal, ...modelosApi]))
        .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));

      if (modelosUnificados.length > 0) {
        modelosUnificados.push('Otro modelo / Escribir manualmente...');
        guardarCache(claveCache, modelosUnificados);
        return modelosUnificados;
      }

      const defaultFallback = fallbackLocal.length > 0
        ? [...fallbackLocal, 'Otro modelo / Escribir manualmente...']
        : ['Línea Estándar', 'Otro modelo / Escribir manualmente...'];

      guardarCache(claveCache, defaultFallback);
      return defaultFallback;
    } catch (err) {
      const defaultFallback = fallbackLocal.length > 0
        ? [...fallbackLocal, 'Otro modelo / Escribir manualmente...']
        : ['Línea Estándar', 'Otro modelo / Escribir manualmente...'];

      return defaultFallback;
    }
  },
};
