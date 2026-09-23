import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import { spawn } from 'child_process';

function startPreviewServer(port = 4176) {
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
  console.log('Starting preview server for T4 verification...');
  const preview = await startPreviewServer(4176);

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

    let mockUsers = [
      {
        id: 'usr-student-1',
        name: 'Mateo Morales',
        email: 'mmorales@unab.edu.co',
        student_code: 'U00088990',
        role: 'estudiante',
        roles: ['estudiante'],
        is_active: true,
        is_driver: true,
        created_at: '2026-02-15T10:30:00.000000Z',
      },
      {
        id: 'usr-admin-2',
        name: 'Coordinador Bienestar',
        email: 'bienestar@unab.edu.co',
        student_code: null,
        role: 'administrador',
        roles: ['administrador'],
        is_active: true,
        is_driver: false,
        created_at: '2026-01-01T08:00:00.000000Z',
      },
    ];

    await page.route('**/api/v1/admin/users?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockUsers,
          meta: { current_page: 1, last_page: 1, total: mockUsers.length, per_page: 15 },
        }),
      });
    });

    await page.route('**/api/v1/admin/users/usr-student-1', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...mockUsers[0],
            id_document_number: '1098765432',
            id_document_type: 'CC',
            phone_number: '+573151234567',
            institution: { id: 'inst-1', name: 'UNAB Bucaramanga', code: 'UNAB' },
            campus: { id: 'cmp-1', name: 'Campus El Jardín', code: 'JARDIN' },
            academic_profile: {
              member_type: 'estudiante',
              student_code: 'U00088990',
              academic_program_or_department: 'Medicina',
              semester: 6,
            },
            reputation: {
              total_trips_as_driver: 28,
              total_trips_as_passenger: 5,
              average_rating_as_driver: 4.9,
              average_rating_as_passenger: 5.0,
              has_public_rating: true,
            },
            wallet: {
              id: 'wal-1',
              balance_cop: 52000,
              is_locked: false,
            },
            suspension_logs: [],
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/users/usr-student-1/suspension', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      mockUsers[0].is_active = !body.suspended;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: body.suspended ? 'Usuario suspendido exitosamente.' : 'Usuario reactivado exitosamente.',
          data: {
            id: 'usr-student-1',
            name: 'Mateo Morales',
            email: 'mmorales@unab.edu.co',
            is_active: !body.suspended,
          },
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
    await page.goto('http://localhost:4176/login');
    await page.fill('input[type="email"]', 'uniwheels@gmail.com');
    await page.fill('input[type="password"]', 'adminPass');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vehiculos');

    // Navegar a Usuarios
    console.log('Navigating to Usuarios...');
    await page.click('a[href="/usuarios"]');
    await page.waitForURL('**/usuarios');

    await page.waitForSelector('text=Mateo Morales');
    await page.waitForSelector('text=Coordinador Bienestar');
    await page.waitForSelector('text=U00088990');
    console.log('PASS: Users list rendered with roles and codes.');

    await page.screenshot({ path: '/tmp/admin-t4-users.png' });

    // Abrir detalle del usuario Mateo
    console.log('Opening user detail...');
    await page.click('button[title="Ver expediente completo"]');
    await page.waitForSelector('text=Expediente de Usuario');
    await page.waitForSelector('text=UNAB Bucaramanga');
    await page.waitForSelector('text=Campus El Jardín');
    await page.waitForSelector('text=$ 52.000');
    console.log('PASS: User detail modal rendered with wallet and academic info.');

    await page.screenshot({ path: '/tmp/admin-t4-user-detail.png' });

    // Suspender al usuario desde el modal de detalle
    console.log('Testing user suspension from modal...');
    await page.click('button:has-text("Suspender Usuario")');
    await page.waitForSelector('text=Motivo obligatorio de la sanción:');
    await page.fill('textarea', 'Reporte de cobro indebido en efectivo.');
    await page.click('button:has-text("Confirmar Suspensión")');

    await page.waitForSelector('text=Reactivar Usuario');
    console.log('PASS: User suspension completed and modal reflects new state.');

    await page.screenshot({ path: '/tmp/admin-t4-user-suspended.png' });

    console.log('ALL T4 CHECKS PASSED!');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('T4 Test failed:', err);
  process.exit(1);
});
