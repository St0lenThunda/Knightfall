import { test, expect } from '@playwright/test';

/**
 * The Warrior's Path & Rite of Oblivion
 * 
 * This suite verifies the end-to-end journey of a user:
 * 1. Entering the Cathedral (Login)
 * 2. Personalizing the Codex (Settings Persistence)
 * 3. The Rite of Oblivion (Data Deletion)
 */
test.describe("The Warrior's Path & Rite of Oblivion", () => {
  // CREDENTIALS PROVIDED BY USER
  const TEST_USER = {
    email: 'antonio.moses79@gmail.com',
    password: 'password'
  };

  test('should complete the pilgrimage and perform the rite of oblivion', async ({ page }) => {
    // --- 1. ENTERING THE CATHEDRAL ---
    await page.goto('/');
    
    // Open Auth Modal
    const loginTrigger = page.locator('button:has-text("Login")');
    await expect(loginTrigger).toBeVisible();
    await loginTrigger.click();

    // Fill credentials using data-testids
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    
    // Submit login
    await page.click('[data-testid="auth-submit-btn"]');

    // Wait for login success (modal should close)
    await expect(page.locator('.modal-card')).toBeHidden({ timeout: 15000 });
    
    // Verify War Room (Profile) link exists in SideNav
    const warRoomLink = page.locator('nav.sidenav a:has-text("War Room")');
    await expect(warRoomLink).toBeVisible({ timeout: 10000 });

    // --- 2. PERSONALIZING THE CODEX ---
    // Navigate to Settings
    const settingsLink = page.locator('nav.sidenav a[href="/settings"]');
    await settingsLink.click();
    await expect(page).toHaveURL(/.*settings/);

    // Switch to Board Settings Tab
    await page.click('button:has-text("Board")');
    
    // Change Piece Set Theme
    const themeSelect = page.locator('select').first();
    const originalTheme = await themeSelect.inputValue();
    const targetTheme = originalTheme === 'classic' ? 'glass' : 'classic';
    
    await themeSelect.selectOption(targetTheme);
    
    // Verify persistence via reload
    await page.reload();
    await page.click('button:has-text("Board")');
    await expect(page.locator('select').first()).toHaveValue(targetTheme);

    // --- 3. THE RITE OF OBLIVION ---
    // Switch to Identity Tab
    await page.click('button:has-text("Identity")');
    
    // Click Purge Identity (The Rite of Oblivion)
    const purgeBtn = page.locator('button:has-text("Purge Identity")');
    await expect(purgeBtn).toBeVisible();
    
    // Trigger the Confirmation Modal
    await purgeBtn.click();
    
    // Verify the Confirm Modal appeared
    const confirmModal = page.locator('.confirm-modal');
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.locator('h3')).toContainText('The Rite of Oblivion');

    // EXECUTING OBLIVION
    const confirmPurgeBtn = confirmModal.locator('button:has-text("Purge Identity")');
    await confirmPurgeBtn.click();

    // Verify Redirect to Assessment Landing Page (as user is now logged out with no DNA)
    await expect(page).toHaveURL(/.*\/assessment\/?$/);
    
    // Verify session is cleared (Login button should be visible again)
    await expect(page.locator('button:has-text("Login")')).toBeVisible({ timeout: 10000 });
  });
});
