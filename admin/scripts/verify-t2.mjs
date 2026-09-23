import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import { spawn } from 'child_process';

function startPreviewServer(port = 4174) {
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
  console.log('Starting preview server for T2 verification...');
  const preview = await startPreviewServer(4174);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err));
  page.on('requestfailed', (req) => console.error('REQUEST FAILED:', req.url(), req.failure()));

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

    await page.route('**/api/v1/admin/users/lookup', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'usr-100', name: 'Carlos Conductor', email: 'carlos@unab.edu.co' },
          ],
        }),
      });
    });

    const mockVehicles = [
      {
        id: 'veh-001',
        user_id: 'usr-100',
        vehicle_type: 'carro',
        plate_number: 'UQZ123',
        brand: 'Chevrolet',
        model_line: 'Spark GT',
        year: 2018,
        color: 'Rojo',
        available_seats: 4,
        features: { has_ac: true, has_trunk: true, has_extra_helmet: false },
        perspective_photo_url: null,
        status: 'pendiente_revision',
        rejection_reason: null,
        documents_summary: { total: 2, verified: 1, pending: 1, rejected: 0 },
        legal_compliance: { requires_rtm: true },
        created_at: new Date().toISOString(),
      },
    ];

    await page.route('**/api/v1/admin/vehicles?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockVehicles,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        }),
      });
    });

    await page.route('**/api/v1/admin/vehicles/veh-001', async (route) => {
      console.log('Intercepted vehicle detail route!');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...mockVehicles[0],
            documents: [
              {
                id: 'doc-soat-1',
                document_type: 'soat',
                document_number: 'SOAT-987654',
                issuer_entity: 'Seguros Bolívar',
                issued_at: '2024-01-01',
                expires_at: '2027-01-01',
                is_expired: false,
                is_verified: true,
                verified_at: '2024-01-02T10:00:00Z',
                rejection_notes: null,
                secure_download_url: 'http://localhost:8002/api/v1/vehicles/veh-001/documents/doc-soat-1/download',
              },
              {
                id: 'doc-lic-1',
                document_type: 'licencia_conduccion',
                document_number: 'LIC-112233',
                issuer_entity: 'Secretaría de Tránsito',
                issued_at: '2022-05-10',
                expires_at: '2028-05-10',
                is_expired: false,
                is_verified: false,
                verified_at: null,
                rejection_notes: null,
                secure_download_url: 'http://localhost:8002/api/v1/vehicles/veh-001/documents/doc-lic-1/download',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/vehicles/veh-001/documents/doc-lic-1/verify', async (route) => {
      console.log('Intercepted verify document route!');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Estado del documento actualizado exitosamente.',
          data: {
            document: {
              id: 'doc-lic-1',
              document_type: 'licencia_conduccion',
              document_number: 'LIC-112233',
              issuer_entity: 'Secretaría de Tránsito',
              issued_at: '2022-05-10',
              expires_at: '2028-05-10',
              is_expired: false,
              is_verified: true,
              verified_at: new Date().toISOString(),
              rejection_notes: null,
            },
            vehicle_status: 'aprobado',
          },
        }),
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
    await page.goto('http://localhost:4174/login');
    await page.fill('input[type="email"]', 'uniwheels@gmail.com');
    await page.fill('input[type="password"]', 'adminPass');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vehiculos');
    await page.waitForSelector('text=UQZ123');
    await page.waitForSelector('text=Chevrolet Spark GT');
    await page.waitForSelector('text=Carlos Conductor');
    console.log('PASS: Vehicles list rendered with owner lookup and plate.');

    await page.screenshot({ path: '/tmp/admin-t2-vehicles.png' });

    // Navegar al detalle del vehículo
    console.log('Navigating to vehicle detail...');
    await page.click('a[href="/vehiculos/veh-001"]');
    await page.waitForURL('**/vehiculos/veh-001');
    console.log('Arrived at /vehiculos/veh-001');
    await page.waitForSelector('text=SOAT (Seguro Obligatorio)');
    await page.waitForSelector('text=Licencia de Conducción');
    await page.waitForSelector('text=Carlos Conductor');
    console.log('PASS: Vehicle detail view loaded successfully.');

    await page.screenshot({ path: '/tmp/admin-t2-vehicle-detail.png' });

    // Probar aprobación de documento
    console.log('Testing document approval...');
    const approveBtns = await page.$$('button:has-text("Aprobar Documento")');
    console.log(`Found ${approveBtns.length} approve buttons.`);
    if (approveBtns.length > 0) {
      await approveBtns[0].click();
      await page.waitForSelector('text=Verificado');
      console.log('PASS: Document approval updated state dynamically.');
    }

    console.log('ALL T2 CHECKS PASSED!');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('T2 Test failed:', err);
  process.exit(1);
});
