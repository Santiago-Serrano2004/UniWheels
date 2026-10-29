// SIM-022: api.js no finge éxito. forgotPassword, resetPassword, triggerEmergencySos y
// searchMatches lanzan el error en el catch (como el resto) en vez de devolver
// `{ success: true }`, `{ fallback: true }` o `[]`.
// Ejecutar: node --test mobile/scripts/sim-022-contract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const api = readFileSync(join(raiz, 'packages/shared/src/api.js'), 'utf8');

// Cuerpo de un método `async nombre(...) {` hasta el siguiente método del mismo nivel.
function cuerpo(nombre) {
  const inicio = api.search(new RegExp(`^  async ${nombre}\\(`, 'm'));
  assert.notEqual(inicio, -1, `no se encontró ${nombre}`);
  const resto = api.slice(inicio + 1);
  const fin = resto.search(/^  (?:async )?\w+\(.*\) \{$|^\};?$/m);
  return fin === -1 ? resto : resto.slice(0, fin);
}

const catchDe = (nombre) => {
  const c = cuerpo(nombre);
  return c.slice(c.indexOf('catch'));
};

for (const nombre of ['forgotPassword', 'resetPassword', 'triggerEmergencySos', 'searchMatches']) {
  test(`${nombre} lanza el error en vez de fingir éxito`, () => {
    const bloque = catchDe(nombre);
    assert.match(bloque, /throw /, `${nombre} debe lanzar en el catch`);
    assert.doesNotMatch(bloque, /return\s*(\{|\[)/, `${nombre} no debe devolver un valor falso en el catch`);
  });
}

test('el SOS fallido se muestra en la app con la opción de llamar al 123', () => {
  const modal = readFileSync(join(raiz, 'mobile/src/components/SosEmergencyModal.tsx'), 'utf8');
  assert.match(modal, /sosReportError/);
  assert.match(modal, /Llamar al 123/);
  assert.doesNotMatch(modal, /\.catch\(\(\) => \{\}\)/);
});
