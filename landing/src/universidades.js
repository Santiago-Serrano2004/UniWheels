// Universidades de Bucaramanga y su área metropolitana. El backend valida contra la misma
// lista (services/auth-service/config/landing.php): si cambias una, cambia la otra.
export const UNIVERSIDADES = [
  'Universidad Autónoma de Bucaramanga (UNAB)',
  'Universidad Industrial de Santander (UIS)',
  'Universidad Pontificia Bolivariana (UPB)',
  'Universidad Santo Tomás (USTA)',
  'Universidad de Santander (UDES)',
  'Unidades Tecnológicas de Santander (UTS)',
  'Universidad de Investigación y Desarrollo (UDI)',
  'Universidad Manuela Beltrán (UMB)',
  'Universidad Cooperativa de Colombia',
  'Universidad Antonio Nariño (UAN)',
  'Universidad Nacional Abierta y a Distancia (UNAD)',
  'Corporación Universitaria Remington',
  'Fundación Universitaria Comfenalco Santander (UNC)',
  'Escuela Superior de Administración Pública (ESAP)',
  'Otra',
];

// La lista muestra "Nombre (SIGLA)"; la API de instituciones usa solo el nombre.
export const nombreSinSigla = (u) => u.replace(/\s*\([^)]*\)$/, '').trim();
