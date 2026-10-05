// Recorrido del panel de administración con Playwright (Chromium headless).
// Requiere: proxy_local.mjs (8090) y `VITE_API_URL=http://127.0.0.1:8090 npm run dev` en admin/ (5174).
// Uso: node ui_admin.mjs <carpeta_salida>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../../../frontend/node_modules/playwright');

const BASE = process.env.ADMIN_URL || 'http://localhost:5174';
const OUT = process.argv[2] || './capturas';
fs.mkdirSync(OUT, { recursive: true });
const EMAIL = 'sim_admin@unab.edu.co';
const PASS = 'Sim_Admin#2026';

const resultado = { pasos: [], consola: [], respuestas_http_error: [] };
const log = (paso, ok, detalle = '') => {
  resultado.pasos.push({ paso, ok, detalle });
  console.log(`${ok ? 'OK ' : 'ERR'} ${paso} ${detalle}`);
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
let pantalla = 'inicio';
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) resultado.consola.push({ pantalla, tipo: m.type(), texto: m.text().slice(0, 400) });
});
page.on('pageerror', (e) => resultado.consola.push({ pantalla, tipo: 'pageerror', texto: String(e).slice(0, 400) }));
page.on('response', (r) => {
  if (r.status() >= 400 && r.url().includes('/api/')) resultado.respuestas_http_error.push({ pantalla, status: r.status(), url: r.url().replace(/[0-9a-f-]{36}/g, '{id}') });
});

const captura = async (nombre) => {
  pantalla = nombre;
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${nombre}.png`), fullPage: true });
};

async function paso(nombre, fn) {
  try {
    await fn();
    log(nombre, true);
  } catch (e) {
    log(nombre, false, String(e.message || e).split('\n')[0]);
    try { await page.screenshot({ path: path.join(OUT, `error_${nombre.replace(/\W+/g, '_')}.png`) }); } catch {}
  }
}

await paso('login', async () => {
  pantalla = 'login';
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await captura('01_login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASS);
  await page.click('button[type=submit]');
  await page.waitForURL('**/vehiculos', { timeout: 15000 });
});

await paso('vehiculos_lista', async () => {
  await page.goto(`${BASE}/vehiculos`, { waitUntil: 'networkidle' });
  await captura('02_vehiculos');
  const filas = await page.locator('tbody tr, a[href^="/vehiculos/"]').count();
  resultado.vehiculos_visibles = filas;
});

await paso('vehiculo_detalle_con_documentos', async () => {
  const enlace = page.locator('a[href^="/vehiculos/"]').first();
  if (await enlace.count()) {
    await enlace.click();
  } else {
    await page.locator('tbody tr').first().click();
  }
  await page.waitForURL('**/vehiculos/*', { timeout: 10000 });
  await captura('03_vehiculo_detalle');
});

await paso('usuarios_lista', async () => {
  await page.goto(`${BASE}/usuarios`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder^="Buscar"]', 'sim_');
  await page.click('button:has-text("Buscar")');
  await page.waitForTimeout(800);
  await captura('04_usuarios');
});

await paso('usuario_detalle', async () => {
  await page.locator('button[title="Ver expediente completo"]').first().click();
  await captura('05_usuario_detalle');
  await page.keyboard.press('Escape');
});

await paso('usuario_suspender_y_reactivar', async () => {
  await page.goto(`${BASE}/usuarios`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder^="Buscar"]', 'sim_p14');
  await page.click('button:has-text("Buscar")');
  await page.waitForTimeout(800);
  if (!(await page.locator('button:has-text("Suspender")').count())) {
    // quedó suspendido por un intento previo: reactivar primero para partir de un estado conocido
    await page.locator('button:has-text("Reactivar")').first().click();
    await page.locator('button:has-text("Confirmar Reactivación")').click();
    await page.waitForTimeout(1200);
  }
  await page.locator('button:has-text("Suspender")').first().click();
  await page.locator('textarea').fill('Suspensión de prueba desde la UI (simulación)');
  await captura('06_usuario_modal_suspension');
  await page.locator('button:has-text("Confirmar Suspensión")').click();
  await page.waitForTimeout(1200);
  await captura('07_usuario_suspendido');
  await page.locator('button:has-text("Reactivar")').first().click();
  if (await page.locator('textarea').count()) await page.locator('textarea').fill('Reactivación de prueba desde la UI (simulación)');
  else resultado.reactivar_sin_campo_de_motivo = true; // la reactivación no pide motivo en el modal
  await page.locator('button:has-text("Confirmar Reactivación")').click();
  await page.waitForTimeout(1200);
  await captura('08_usuario_reactivado');
});

await paso('viajes', async () => {
  await page.goto(`${BASE}/viajes`, { waitUntil: 'networkidle' });
  await captura('09_viajes');
});

await paso('sos_lista_y_atender', async () => {
  await page.goto(`${BASE}/alertas-sos`, { waitUntil: 'networkidle' });
  await captura('10_sos');
  const boton = page.locator('button:has-text("Marcar como Atendida")').first();
  if (await boton.count()) {
    await boton.click();
    await page.locator('textarea').first().fill('Atendida desde la UI (simulación)');
    await captura('11_sos_atender');
    await page.locator('button:has-text("Confirmar")').first().click();
    await page.waitForTimeout(1200);
    await captura('12_sos_atendida');
  } else {
    resultado.sos_pendiente_en_ui = false;
  }
});

await paso('responsive_movil_usuarios', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/usuarios`, { waitUntil: 'networkidle' });
  await captura('13_usuarios_movil');
});

await browser.close();
fs.writeFileSync(path.join(OUT, 'ui_admin.json'), JSON.stringify(resultado, null, 2));
console.log(`consola: ${resultado.consola.length} mensajes; http>=400: ${resultado.respuestas_http_error.length}`);
