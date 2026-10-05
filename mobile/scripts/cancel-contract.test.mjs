// SIM-004: trip-service solo acepta `conductor|pasajero` en cancelled_by.
// Ejecutar: node --test mobile/scripts/cancel-contract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : [];
  });
}

test('ninguna llamada a cancelTrip manda passenger/driver', () => {
  const malos = [];
  for (const f of archivos(src)) {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/cancelTrip\(([^)]*)\)/gs)) {
      if (/['"](passenger|driver)['"]/.test(m[1])) malos.push(f);
    }
  }
  assert.deepEqual(malos, []);
});
