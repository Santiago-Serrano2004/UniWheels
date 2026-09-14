import { defineConfig, devices } from '@playwright/test';

// Los flujos E2E ejercitan de punta a punta contra el backend real (auth,
// vehicle, route-matching, trip-service) — requieren el ecosistema levantado
// vía `./uniwheels start`. No se usa el navegador que descarga Playwright por
// defecto: se reutiliza el Google Chrome ya instalado en la máquina.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
