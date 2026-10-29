// SIM-026: las secciones con ancla de la landing llevan scroll-margin-top igual a la altura
// de la navbar (h-16 = 4rem), para que `#universidades` no quede tapada a 390 px.
// Ejecutar: node --test mobile/scripts/sim-026-landing-anchors.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(raiz, 'landing/src/index.css'), 'utf8');
const navbar = readFileSync(join(raiz, 'landing/src/components/Navbar.jsx'), 'utf8');

test('la navbar mide h-16 (4rem)', () => {
  assert.match(navbar, /<nav[^>]*\bh-16\b/);
});

test('section[id] y #descargar tienen scroll-margin-top: 4rem', () => {
  const regla = css.match(/section\[id\][^{]*\{([^}]*)\}/);
  assert.ok(regla, 'falta la regla para section[id]');
  assert.match(regla[0], /#descargar/);
  assert.match(regla[1], /scroll-margin-top:\s*4rem/);
});
