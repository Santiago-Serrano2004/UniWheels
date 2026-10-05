// SIM-013: eliminar cuenta usa el endpoint real y solo cierra sesión si el backend responde éxito.
// Ejecutar: node --test mobile/scripts/sim-013-contract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (ruta) => readFileSync(join(raiz, ruta), 'utf8');

function cuerpo(texto, firma) {
  const i = texto.indexOf(firma);
  assert.notEqual(i, -1, `no se encontró ${firma}`);
  const fin = texto.indexOf('\n  },', i);
  return texto.slice(i, fin);
}

test('deleteAccount llama a DELETE /auth/account (existe en auth-service)', () => {
  const rutas = leer('services/auth-service/routes/api.php');
  assert.match(rutas, /Route::delete\('\/auth\/account'/);
  const fn = cuerpo(leer('packages/shared/src/api.js'), 'async deleteAccount(');
  assert.match(fn, /apiClient\.delete\('\/auth\/account'/);
  assert.doesNotMatch(fn, /delete-account-direct/);
});

test('profile.tsx: logout solo tras éxito, nunca en finally', () => {
  const t = leer('mobile/src/app/(tabs)/profile.tsx');
  const fn = t.slice(t.indexOf('const confirmarEliminarCuenta'), t.indexOf('return (', t.indexOf('const confirmarEliminarCuenta')));
  assert.doesNotMatch(fn, /finally/);
  const catchIdx = fn.indexOf('catch');
  const logoutIdx = fn.indexOf('logout()');
  assert.ok(catchIdx !== -1 && logoutIdx > catchIdx, 'logout() debe ir después del catch');
  assert.match(fn.slice(catchIdx, logoutIdx), /return;/, 'el catch debe salir antes del logout');
  assert.match(fn, /Tu cuenta fue eliminada\./);
});
