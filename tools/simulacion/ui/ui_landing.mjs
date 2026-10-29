// Recorrido de la landing con Playwright: carga, ancla #universidades, modal de privacidad, FAQ,
// errores de consola y capturas en escritorio y móvil (390 px).
// Requiere `npm run dev` en landing/ (5173). Uso: node ui_landing.mjs <carpeta_salida>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../../../frontend/node_modules/playwright');

const BASE = process.env.LANDING_URL || 'http://localhost:5173';
const OUT = process.argv[2] || './capturas_landing';
fs.mkdirSync(OUT, { recursive: true });
const resultado = { vistas: {} };

const browser = await chromium.launch({ headless: true });

for (const [nombre, viewport] of [['escritorio', { width: 1440, height: 900 }], ['movil_390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const r = { pasos: [], consola: [], http_error: [], desbordamiento_horizontal: null };
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) r.consola.push({ tipo: m.type(), texto: m.text().slice(0, 400) });
  });
  page.on('pageerror', (e) => r.consola.push({ tipo: 'pageerror', texto: String(e).slice(0, 400) }));
  page.on('response', (x) => {
    if (x.status() >= 400) r.http_error.push({ status: x.status(), url: x.url() });
  });
  const paso = async (n, fn) => {
    try { await fn(); r.pasos.push({ paso: n, ok: true }); console.log(`OK  ${nombre} ${n}`); }
    catch (e) { r.pasos.push({ paso: n, ok: false, detalle: String(e.message || e).split('\n')[0] }); console.log(`ERR ${nombre} ${n}: ${String(e.message).split('\n')[0]}`); }
  };

  await paso('carga', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, `${nombre}_01_carga.png`), fullPage: true });
    r.titulo = await page.title();
    r.desbordamiento_horizontal = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  });
  await paso('ancla_universidades', async () => {
    if (nombre === 'movil_390') {
      const menu = page.locator('button[aria-expanded]').first();
      if (await menu.count()) await menu.click();
    }
    await page.locator('a[href="#universidades"]:visible').first().click();
    await page.waitForTimeout(900);
    const arriba = await page.evaluate(() => document.getElementById('universidades')?.getBoundingClientRect().top);
    r.universidades_top_px = arriba;
    await page.screenshot({ path: path.join(OUT, `${nombre}_02_universidades.png`) });
    if (arriba === undefined || arriba < -50 || arriba > 300) throw new Error(`la sección #universidades quedó en top=${arriba}`);
  });
  await paso('modal_privacidad', async () => {
    const abrir = page.locator('footer button:visible', { hasText: /rivacidad|datos/i }).first();
    await abrir.scrollIntoViewIfNeeded();
    await abrir.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${nombre}_03_privacidad.png`) });
    await page.locator('[aria-label="Cerrar modal de privacidad"]').click();
    await page.waitForTimeout(400);
    const aunAbierto = await page.locator('[aria-label="Cerrar modal de privacidad"]').count();
    if (aunAbierto) throw new Error('el modal de privacidad no se cerró');
  });
  await paso('faq', async () => {
    await page.locator('#faq').scrollIntoViewIfNeeded();
    const botones = page.locator('#faq button[aria-expanded]');
    const n = await botones.count();
    r.faq_preguntas = n;
    if (!n) throw new Error('no se encontraron preguntas en #faq');
    for (const i of [0, Math.min(2, n - 1)]) {
      const b = botones.nth(i);
      if ((await b.getAttribute('aria-expanded')) === 'true') await b.click(); // cerrar y volver a abrir
      await b.click();
      await page.waitForTimeout(300);
      if ((await b.getAttribute('aria-expanded')) !== 'true') throw new Error(`la pregunta ${i} no se expandió`);
      if (!(await page.locator(`#faq-panel-${i}`).isVisible())) throw new Error(`el panel de la pregunta ${i} sigue oculto`);
    }
    await page.screenshot({ path: path.join(OUT, `${nombre}_04_faq.png`) });
  });
  r.pasos_ok = r.pasos.filter((p) => p.ok).length;
  resultado.vistas[nombre] = r;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'ui_landing.json'), JSON.stringify(resultado, null, 2));
for (const [n, v] of Object.entries(resultado.vistas)) console.log(`${n}: pasos ok ${v.pasos_ok}/${v.pasos.length}, consola ${v.consola.length}, http>=400 ${v.http_error.length}, overflow-x ${v.desbordamiento_horizontal}`);
