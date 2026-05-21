import { test, expect } from '@playwright/test';

/**
 * Integrity E2E: Finalizes the test suite by purging any generated ghost games.
 * This ensures the training environment remains clean for actual users.
 */
test.describe('Vault Integrity Maintenance', () => {
  test('should purge test pollution from the cloud', async ({ page }) => {
    // INTERCEPT: Mock Supabase Auth for CI
    await page.route('**/auth/v1/token*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'fake-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: { id: 'fake-user-id', email: 'test@example.com', user_metadata: { username: 'TestUser' }, aud: 'authenticated', role: 'authenticated' }
          })
        });
      } else await route.continue();
    });

    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'fake-user-id', username: 'TestUser', rating: 1200, hearts: 5, xp: 100, bot_progression: { 'bot-1': { status: 'unlocked' } } }])
      });
    });

    // We must mock the RPC call that deletes test pollution
    await page.route('**/rest/v1/rpc/purge_test_ghosts*', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    
    // We also need to log in first so we have the session
    await page.goto('/');
    const loginTrigger = page.locator('button:has-text("Login")');
    if (await loginTrigger.isVisible()) {
      await loginTrigger.click();
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="auth-submit-btn"]');
      await page.locator('.modal-card').waitFor({ state: 'hidden', timeout: 15000 });
    }

    // Navigate to the War Room (located on the Profile page)
    await page.goto('/profile');
    
    // Locate the maintenance tool
    const sanitizeBtn = page.locator('button:has-text("Sanitize Test Data")');
    
    // Ensure the button is present (might be below fold)
    await sanitizeBtn.scrollIntoViewIfNeeded();
    await expect(sanitizeBtn).toBeVisible();
    
    // Execute the purge
    await sanitizeBtn.click();
    
    // Verify the high-fidelity progress overlay appears
    const overlay = page.locator('.integrity-overlay');
    await expect(overlay).toBeVisible();
    
    // Wait for the system to process the records and the overlay to clear
    // We give it a generous timeout for large test batches
    await expect(overlay).toBeHidden({ timeout: 30000 });
    
    // Confirm success via the global toast system
    const toast = page.locator('.toast-container .toast');
    await expect(toast).toContainText(/sanitized/i);
  });
});
