import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import { spawn } from 'child_process';

function startPreviewServer(port = 4177) {
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
  console.log('Starting preview server for T5 verification...');
  const preview = await startPreviewServer(4177);

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

    const mockTrips = [
      {
        id: 'trip-abc-123',
        route_id: 'rt-1',
        driver_id: 'usr-drv-1',
        passenger_id: 'usr-pas-1',
        vehicle_id: 'veh-1',
        driver_name: 'Santiago Conductor',
        passenger_name: 'Camila Pasajera',
        vehicle_plate: 'WER456',
        vehicle_model: 'Renault Sandero',
        pickup_address: 'Cabecera del Llano, Cra 33',
        dropoff_address: 'UNAB Campus Terrazas',
        status: 'completado',
        payment_method: 'tarjeta',
        total_fare_cop: 18000,
        driver_amount_cop: 16200,
        platform_commission_cop: 1800,
        commission_status: 'debitado_exitoso',
        is_pin_verified: true,
        created_at: '2026-09-23T07:30:00.000000Z',
      },
    ];

    await page.route('**/api/v1/admin/trips?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockTrips,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        }),
      });
    });

    const mockTripPayments = [
      {
        id: 'pay-ev-1',
        event_type: 'transaction.updated',
        transaction_id: 'tx-wompi-8899',
        reference: 'TP-trip-abc-123',
        status: 'APPROVED',
        amount_in_cents: 1800000,
        amount_cop: 18000,
        currency: 'COP',
        signature_valid: true,
        processed: true,
        created_at: '2026-09-23T07:31:00.000000Z',
        trip: {
          id: 'trip-abc-123',
          driver_name: 'Santiago Conductor',
          passenger_name: 'Camila Pasajera',
          vehicle_plate: 'WER456',
          status: 'completado',
          total_fare_cop: 18000,
          platform_commission_cop: 1800,
        },
      },
    ];

    await page.route('**/api/v1/admin/payments/trips?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          summary: {
            total_collected_cop: 180000,
            platform_commission_cop: 18000,
            pending_commission_cop: 3600,
          },
          data: mockTripPayments,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        }),
      });
    });

    const mockTopups = [
      {
        id: 'topup-ev-1',
        event_type: 'transaction.updated',
        transaction_id: 'tx-wompi-topup-001',
        reference: 'WR-usr-pas-1-20260923-xyz',
        user_id: 'usr-pas-1',
        status: 'APPROVED',
        amount_in_cents: 5000000,
        amount_cop: 50000,
        currency: 'COP',
        signature_valid: true,
        processed: true,
        created_at: '2026-09-23T06:00:00.000000Z',
        transaction: {
          id: 'tx-wal-1',
          amount_cop: 50000,
          balance_before_cop: 5000,
          balance_after_cop: 55000,
          status: 'completada',
          notes: 'Recarga Wompi Nequi',
        },
      },
    ];

    await page.route('**/api/v1/admin/payments/topups?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockTopups,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        }),
      });
    });

    await page.route('**/api/v1/admin/users/lookup', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'usr-pas-1', name: 'Camila Pasajera', email: 'cpasajera@unab.edu.co' }],
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

    await page.route('**/api/v1/admin/sos-events*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: { total: 0 } }),
      });
    });

    console.log('Navigating to login...');
    await page.goto('http://localhost:4177/login');
    await page.fill('input[type="email"]', 'uniwheels@gmail.com');
    await page.fill('input[type="password"]', 'adminPass');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vehiculos');

    // Navegar a Viajes y Pagos
    console.log('Navigating to Viajes y Pagos...');
    await page.click('a[href="/viajes-pagos"]');
    await page.waitForURL('**/viajes-pagos');

    await page.waitForSelector('text=Santiago Conductor');
    await page.waitForSelector('text=WER456');
    await page.waitForSelector('text=$ 18.000');
    console.log('PASS: Trips table rendered with COP fare and driver/passenger info.');

    await page.screenshot({ path: '/tmp/admin-t5-trips.png' });

    // Cambiar a pestaña Pagos
    console.log('Navigating to Pagos tab...');
    await page.click('button:has-text("Gestión de Pagos")');
    await page.waitForSelector('text=Total Recaudado en Viajes');
    await page.waitForSelector('text=$ 180.000');
    await page.waitForSelector('text=$ 18.000');
    await page.waitForSelector('text=$ 3.600');
    await page.waitForSelector('text=TP-trip-abc-123');
    console.log('PASS: Trip payments rendered with period summary totals.');

    await page.screenshot({ path: '/tmp/admin-t5-payments.png' });

    // Cambiar a subpestaña Recargas
    console.log('Navigating to Recargas de Billetera sub-tab...');
    await page.click('button:has-text("Recargas de Billetera")');
    await page.waitForSelector('text=$ 50.000');
    await page.waitForSelector('text=Camila Pasajera');
    await page.waitForSelector('text=$ 5.000 → $ 55.000');
    console.log('PASS: Top-ups table rendered with wallet impact.');

    await page.screenshot({ path: '/tmp/admin-t5-topups.png' });

    console.log('ALL T5 CHECKS PASSED!');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('T5 Test failed:', err);
  process.exit(1);
});
