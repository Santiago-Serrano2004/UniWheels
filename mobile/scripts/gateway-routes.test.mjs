// SIM-014: toda ruta que usa packages/shared/src/api.js tiene un `location` en
// gateway/api-locations.conf, y apunta al servicio que la define.
// nginx evalúa los `location ~` en orden y gana el primero que coincide.
// Ejecutar: node --test mobile/scripts/gateway-routes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (ruta) => readFileSync(join(raiz, ruta), 'utf8');

const locations = [...leer('gateway/api-locations.conf').matchAll(/location ~ (\S+) \{[^}]*?proxy_pass http:\/\/(\w+);/g)].map(
  ([, regex, upstream]) => ({ regex: new RegExp(regex), upstream })
);

const upstreamDe = (ruta) => locations.find((l) => l.regex.test(`/api/v1${ruta}`))?.upstream;

const rutasDeLaApp = [
  ...new Set(
    [...leer('packages/shared/src/api.js').matchAll(/(?:Client|apiClient)\.(?:get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)/g)].map(([, ruta]) =>
      ruta.replace(/^\$\{[^}]+\}/, '').replace(/\$\{[^}]+\}/g, 'abc')
    )
  ),
];

test('el parser encuentra los location del gateway y las rutas de la app', () => {
  assert.ok(locations.length >= 10);
  assert.ok(rutasDeLaApp.length >= 30);
});

test('todas las rutas de api.js llegan a algún servicio (ninguna cae en la SPA)', () => {
  const sinRuta = rutasDeLaApp.filter((r) => !upstreamDe(r));
  assert.deepEqual(sinRuta, []);
});

test('/driver/history va a trip-service y /ratings a notification-service', () => {
  assert.equal(upstreamDe('/driver/history'), 'trip_service');
  assert.equal(upstreamDe('/passenger/history'), 'trip_service');
  assert.equal(upstreamDe('/ratings'), 'notification_service');
  assert.equal(upstreamDe('/ratings/received'), 'notification_service');
});
