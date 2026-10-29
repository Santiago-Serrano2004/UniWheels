// SIM-027: sin respaldos falsos (PIN 4829, tarifa $ 4.500, id de viaje = route.id),
// getAllVehiclesForAdmin usa /admin/vehicles y checkApprovedVehicle no manda parámetros ignorados.
// Ejecutar: node --test mobile/scripts/sim-027-contract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (r) => readFileSync(join(raiz, r), 'utf8');

const sinRespaldos = [
  'mobile/src/components/LiveTripIslandWidget.tsx',
  'mobile/src/components/PassengerActiveTripCard.tsx',
  'frontend/src/components/trips/PassengerActiveTripCard.jsx',
  'frontend/src/components/trips/PassengerTripsView.jsx',
  'frontend/src/components/common/LiveTripIslandWidget.jsx',
];

for (const ruta of sinRespaldos) {
  test(`${ruta} no inventa PIN ni tarifa`, () => {
    const src = leer(ruta);
    assert.doesNotMatch(src, /\|\|\s*'4829'/);
    assert.doesNotMatch(src, /\|\|\s*'\$ 4\.500'|:\s*'\$ 4\.500'/);
  });
}

test('map.tsx no usa route.id como id de viaje', () => {
  const src = leer('mobile/src/app/(tabs)/map.tsx');
  assert.doesNotMatch(src, /trip_id\s*\|\|\s*route\.id/);
});

for (const ruta of ['packages/shared/src/api.js', 'frontend/src/services/api.js']) {
  const src = leer(ruta);
  const cuerpo = (n) => {
    const i = src.indexOf(`async ${n}(`);
    assert.notEqual(i, -1, `no se encontró ${n} en ${ruta}`);
    return src.slice(i, i + 400);
  };
  test(`${ruta}: getAllVehiclesForAdmin usa el endpoint de admin`, () => {
    assert.match(cuerpo('getAllVehiclesForAdmin'), /get\('\/admin\/vehicles'\)/);
  });
  test(`${ruta}: checkApprovedVehicle no envía parámetros que el backend ignora`, () => {
    const c = cuerpo('checkApprovedVehicle');
    assert.match(c, /checkApprovedVehicle\(\)/);
    assert.doesNotMatch(c, /user_id|plate_number/);
  });
}
