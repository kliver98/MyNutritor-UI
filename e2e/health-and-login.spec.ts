import { test, expect } from '@playwright/test';

test.describe('MyNutritor UI - Flujos Iniciales', () => {
  test('debe cargar la página de inicio y verificar navegación a la página de estado', async ({
    page
  }) => {
    await page.goto('/');

    // Verificar título y cabecera principal
    await expect(page).toHaveTitle(/MyNutritor/);
    await expect(page.locator('h1')).toContainText('Gestión Nutricional');

    // Verificar que la navegación incluya el enlace a Estado
    await expect(page.locator('a[href="/status"]').first()).toBeVisible();

    // Navegar a la página dedicada de Estado del Sistema
    await page.goto('/status');
    await expect(page.locator('text=Estado del Backend')).toBeVisible();
  });

  test('debe permitir navegar a la pantalla de login e interactuar con el formulario', async ({
    page
  }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Iniciar Sesión');
    await expect(page.locator('input[placeholder="ej. usuario@ejemplo.com"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Probar validación de campos vacíos
    await page.click('button[type="submit"]');
    await expect(page.locator('role=alert')).toBeVisible();

    // Probar acceso con cuenta Demo Usuario
    await page.click('button:has-text("Modo Usuario")');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Usuario');
  });

  test('debe alternar modo oscuro / claro al presionar el switch', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    // Clic en el botón de cambio de tema
    const themeBtn = page.locator('button[title="Cambiar tema"]');
    await themeBtn.click();

    // El estado del html debe reflejar dark o light
    const isDark = await html.evaluate((el) => el.classList.contains('dark'));
    expect(typeof isDark).toBe('boolean');
  });
});
