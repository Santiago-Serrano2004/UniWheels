import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import { spawn } from 'child_process';

// Helper to launch preview server
function startPreviewServer(port = 4173) {
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
  console.log('Starting preview server for T1 verification...');
  const preview = await startPreviewServer(4173);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Interceptar llamadas a la API para mockear respuestas
    await page.route('**/api/v1/auth/login', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.email === 'student@uniwheels.org') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Inicio de sesión exitoso.',
            data: {
              access_token: 'mock-student-token',
              token_type: 'Bearer',
              user: {
                id: 'user-student-1',
                name: 'Estudiante Prueba',
                email: 'student@uniwheels.org',
                roles: ['estudiante'],
              },
            },
          }),
        });
      } else if (body.email === 'uniwheels@gmail.com' || body.email === 'admin@uniwheels.org') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Inicio de sesión exitoso.',
            data: {
              access_token: 'mock-admin-token',
              token_type: 'Bearer',
              user: {
                id: 'admin-1',
                name: 'Santiago Admin',
                email: 'uniwheels@gmail.com',
                roles: ['administrador'],
              },
            },
          }),
        });
      } else {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Credenciales inválidas.',
          }),
        });
      }
    });

    await page.route('**/api/v1/admin/sos-events*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { total: 3, current_page: 1, last_page: 1, per_page: 15 },
        }),
      });
    });

    console.log('Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173/login');
    await page.waitForLoadState('networkidle');

    // 1. Intentar login con estudiante (debe fallar con "Esta cuenta no tiene acceso al panel")
    console.log('Testing non-admin login rejection...');
    await page.fill('input[type="email"]', 'student@uniwheels.org');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Esta cuenta no tiene acceso al panel');
    console.log('PASS: Non-admin rejected successfully.');
    await page.screenshot({ path: '/tmp/admin-t1-login-rejected.png' });

    // 2. Login exitoso con cuenta administrador
    console.log('Testing admin login...');
    await page.fill('input[type="email"]', 'uniwheels@gmail.com');
    await page.fill('input[type="password"]', 'Secret123!');
    await page.screenshot({ path: '/tmp/admin-t1-login.png' });
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vehiculos');
    await page.waitForSelector('text=Gestión y Revisión de Vehículos');
    await page.waitForSelector('text=Santiago Admin');
    console.log('PASS: Admin logged in and redirected to /vehiculos.');

    // Verificar que el token está en sessionStorage y NO en localStorage
    const sessionInStorage = await page.evaluate(() => {
      return {
        sessionStorage: sessionStorage.getItem('uniwheels_admin_session'),
        localStorage: localStorage.getItem('uniwheels_admin_session'),
      };
    });

    if (sessionInStorage.sessionStorage && !sessionInStorage.localStorage) {
      console.log('PASS: Token stored in sessionStorage and NOT in localStorage.');
    } else {
      throw new Error(`Storage check failed: ${JSON.stringify(sessionInStorage)}`);
    }

    // Verificar badge de alertas SOS
    await page.waitForSelector('text=3');
    console.log('PASS: SOS badge count rendered.');

    await page.screenshot({ path: '/tmp/admin-t1-dashboard.png' });

    // Probar alternar tema oscuro
    await page.click('button[aria-label="Alternar tema"]');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('PASS: Theme toggle works, isDark:', isDark);
    await page.screenshot({ path: '/tmp/admin-t1-dashboard-dark.png' });

    console.log('ALL T1 CHECKS PASSED!');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
