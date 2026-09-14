import { test, expect } from '@playwright/test';
import { createDriverWithApprovedVehicle, deleteTestDriver, deletePublishedRoutes } from './backend-fixtures.js';

const PLATE = 'E2EPW1';
const EMAIL_PREFIX = 'e2e_pw_driver';

let driver;

test.beforeAll(() => {
  driver = createDriverWithApprovedVehicle({ emailPrefix: EMAIL_PREFIX, plate: PLATE });
});

test.afterEach(() => {
  deletePublishedRoutes(driver.userId);
});

test.afterAll(() => {
  deleteTestDriver({ email: driver.email, plate: PLATE });
});

async function loginAsDriver(page) {
  await page.goto('/');
  await page.evaluate((session) => {
    localStorage.setItem('uniwheels_session', JSON.stringify(session));
    localStorage.setItem('uniwheels_app_theme', 'light');
  }, {
    id: driver.userId,
    name: `E2E Driver ${EMAIL_PREFIX}`,
    email: driver.email,
    isDriver: true,
    driverStatus: 'approved',
    role: 'driver',
    institution: 'Universidad Autónoma de Bucaramanga',
    campus: 'Campus El Jardín',
    rating: 5.0,
    tripsCount: 0,
    walletBalance: 50000,
    token: driver.token,
  });
  await page.reload();
  // Splash screen de bienvenida se retira sola tras un momento.
  await expect(page.getByText('Mi Panel')).toBeVisible({ timeout: 8000 });

  const modal = page.getByText('Entendido');
  if (await modal.isVisible().catch(() => false)) {
    await modal.click();
  }
}

test.describe('Conductor: publicar → cabina → navegación', () => {
  test('publicar un trayecto lleva a la cabina y los botones de navegación abren con coordenadas reales', async ({ page, context }) => {
    await loginAsDriver(page);

    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(page.getByText('Publicar Nuevo Trayecto')).toBeVisible();

    await page.getByRole('button', { name: 'Publicar Trayecto Universitario' }).click();

    // manejarPublicarTrayecto navega a "Viajes" (Gestión de Viajes) tras publicar.
    await expect(page.getByText('Gestión de Viajes')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Iniciar en Cabina GPS').first()).toBeVisible();

    await page.getByText('Iniciar en Cabina GPS').first().click();
    // Primero aterriza en el resumen (DriverCockpitCard) con acceso a la cabina real.
    await expect(page.getByText('Viaje Activo Publicado')).toBeVisible({ timeout: 8000 });

    await page.getByText('Ir a la Cabina de Navegación').click();
    await expect(page.getByText('Iniciar Navegador Asistido en la App')).toBeVisible({ timeout: 8000 });

    // Verificar que Waze/Google Maps abren una pestaña nueva con coordenadas reales
    // (no las coordenadas hardcodeadas del bug corregido anteriormente).
    const [wazePage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Waze' }).click(),
    ]);
    await wazePage.waitForLoadState('domcontentloaded').catch(() => {});
    expect(wazePage.url()).toContain('waze.com');
    await wazePage.close();

    const [gmapsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Google Maps' }).click(),
    ]);
    await gmapsPage.waitForLoadState('domcontentloaded').catch(() => {});
    expect(gmapsPage.url()).toContain('google.com/maps');
    await gmapsPage.close();
  });

  test('el modal de SOS se muestra por encima del navegador de pantalla completa (regresión z-index)', async ({ page }) => {
    await loginAsDriver(page);

    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await page.getByRole('button', { name: 'Publicar Trayecto Universitario' }).click();
    await expect(page.getByText('Iniciar en Cabina GPS').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('Iniciar en Cabina GPS').first().click();
    await page.getByText('Ir a la Cabina de Navegación').click();
    await expect(page.getByText('Iniciar Navegador Asistido en la App')).toBeVisible({ timeout: 8000 });

    // Entrar al navegador GPS de pantalla completa (InAppGpsNavigator, z-index alto)
    // y disparar el SOS desde ahí — es el escenario exacto del bug original.
    await page.getByRole('button', { name: 'Iniciar Navegador Asistido en la App' }).click();
    // Hay dos botones con este título: el del header (siempre visible) y el del
    // navegador de pantalla completa — este test dispara específicamente el
    // segundo, que es el escenario real del bug original.
    const sosButtonEnNavegador = page.getByTitle('Botón de Pánico SOS').last();
    await expect(sosButtonEnNavegador).toBeVisible({ timeout: 8000 });
    await sosButtonEnNavegador.click();

    const modalHeading = page.getByText('Botón de Pánico SOS').last();
    await expect(modalHeading).toBeVisible();

    // El modal debe estar realmente interactuable (por encima de todo), no solo
    // presente en el DOM detrás del mapa — si el z-index se rompe de nuevo, el
    // click de Playwright fallaría por "elemento no recibe eventos de puntero".
    await expect(page.getByRole('button', { name: 'Enviar WhatsApp' })).toBeVisible();
    await page.getByRole('button', { name: 'Enviar WhatsApp' }).click({ trial: true });
  });
});
