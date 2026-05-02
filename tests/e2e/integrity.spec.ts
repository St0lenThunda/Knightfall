import { test, expect } from '@playwright/test';

/**
 * Integrity E2E: Finalizes the test suite by purging any generated ghost games.
 * This ensures the training environment remains clean for actual users.
 */
test.describe('Vault Integrity Maintenance', () => {
  test('should purge test pollution from the cloud', async ({ page }) => {
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
