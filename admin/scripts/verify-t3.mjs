import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import { spawn } from 'child_process';

function startPreviewServer(port = 4175) {
  return new Promise((resolve, reject) => {
    const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--host'], {
      cwd: '/home/santiago/Desktop/proyecto_backend/UniWheels/admin',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    preview.stdout.on('data', (data) => {
      const out = data.toString();
      if (out.includes('http://') || out.includes(`:${port}`)) {
        if (!started) {
          started = true;
          resolve(preview);
        }
      }
    });

    preview.stderr.on('data', (data) => {
      console.error('Preview stderr:', data.toString());
    });

    preview.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(preview);
      }
    }, 2000);
  });
}

async function run() {
  console.log('Starting preview server for T3 verification...');
  const preview = await startPreviewServer(4175);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route('**/api/v1/auth/login', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            access_token: 'mock-admin-token',
            token_type: 'Bearer',
            user: {
              id: 'admin-1',
              name: 'Bienestar Admin',
              email: 'uniwheels@gmail.com',
              roles: ['administrador'],
            },
          },
        }),
      });
    });

    let mockSosEvents = [
      {
        id: 'sos-999',
        trip_id: 'trip-100',
        triggered_by_user_id: 'usr-pasajero-1',
        latitude: 7.1193,
        longitude: -73.1227,
        emergency_type: 'sos_panic',
        triggered_at: '2026-09-23T08:15:00.000000Z',
        attended_at: null,
        attended_by_user_id: null,
        attention_notes: null,
        is_attended: false,
        trip: {
          id: 'trip-100',
          driver_id: 'usr-cond-1',
          driver_name: 'Felipe Conductor',
          passenger_id: 'usr-pasajero-1',
          passenger_name: 'Ana Pasajera',
          vehicle_plate: 'KLO987',
          vehicle_model: 'Mazda 3',
          pickup_address: 'Parque San Pío, Bucaramanga',
          dropoff_address: 'UNAB Campus El Bosque',
          status: 'en_curso',
          payment_method: 'wompi',
          total_fare_cop: 14000,
        },
      },
    ];

    await page.route('**/api/v1/admin/sos-events*', async (route) => {
      const url = route.request().url();
      let filtered = mockSosEvents;
      if (url.includes('status=pending')) {
        filtered = mockSosEvents.filter((e) => !e.is_attended);
      } else if (url.includes('status=attended')) {
        filtered = mockSosEvents.filter((e) => e.is_attended);
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filtered,
          meta: { current_page: 1, last_page: 1, total: filtered.length, per_page: 15 },
        }),
      });
    });

    await page.route('**/api/v1/admin/sos-events/sos-999/attend', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      mockSosEvents[0] = {
        ...mockSosEvents[0],
        is_attended: true,
        attended_at: new Date().toISOString(),
        attended_by_user_id: 'admin-1',
        attention_notes: body.notes,
      };

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Alerta SOS atendida y documentada exitosamente.',
          data: mockSosEvents[0],
        }),
      });
    });

    await page.route('**/api/v1/admin/vehicles*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: { total: 0 } }),
      });
    });

    console.log('Navigating to login...');
    await page.goto('http://localhost:4175/login');
    await page.fill('input[type="email"]', 'uniwheels@gmail.com');
    await page.fill('input[type="password"]', 'adminPass');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vehiculos');

    // Navegar a Alertas SOS
    console.log('Navigating to Alertas SOS...');
    await page.click('a[href="/alertas-sos"]');
    await page.waitForURL('**/alertas-sos');

    await page.waitForSelector('text=Alertas SOS de Emergencia');
    await page.waitForSelector('text=KLO987');
    await page.waitForSelector('text=Felipe Conductor');
    await page.waitForSelector('text=Ana Pasajera');
    await page.waitForSelector('text=Parque San Pío, Bucaramanga');
    console.log('PASS: SOS event displayed with trip route and driver info.');

    await page.screenshot({ path: '/tmp/admin-t3-sos.png' });

    // Marcar como atendida
    console.log('Testing attend action...');
    await page.click('button:has-text("Marcar como Atendida")');
    await page.waitForSelector('textarea');
    await page.fill('textarea', 'Se contactó a la conductora y al cuadrante policial de San Pío.');
    await page.click('button:has-text("Confirmar Atención")');

    await page.waitForSelector('text=Atendida');
    console.log('PASS: SOS event marked as attended successfully.');

    await page.screenshot({ path: '/tmp/admin-t3-sos-attended.png' });

    console.log('ALL T3 CHECKS PASSED!');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('T3 Test failed:', err);
  process.exit(1);
});
