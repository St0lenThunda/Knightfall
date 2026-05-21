import { test, expect } from '@playwright/test';

test.describe('Onboarding Gauntlet Funnel', () => {
  test.beforeEach(async ({ context }) => {
    // Clear localStorage to simulate a fresh guest user
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.close();
  });

  test('should redirect unauthenticated guest with no DNA to assessment landing', async ({ page }) => {
    // Navigating to root / should intercept and redirect to /assessment
    await page.goto('/');
    await expect(page).toHaveURL(/.*assessment/);

    // Verify Screen 1 contents
    await expect(page.locator('.hero-title')).toContainText('Forge Your Chess DNA');
    await expect(page.locator('.oracle-notice')).toBeVisible();
    await expect(page.locator('.oracle-notice')).toContainText('platform-specific skill benchmarks');

    // Skill declaration buttons should be interactive
    const casualBtn = page.locator('button:has-text("Casual")');
    await expect(casualBtn).toBeVisible();
    
    // Begin button should be disabled until a skill level is selected
    const beginBtn = page.locator('button:has-text("Begin Assessment →")');
    await expect(beginBtn).toBeDisabled();

    // Select "Casual" and verify the button becomes enabled
    await casualBtn.click();
    await expect(casualBtn).toHaveClass(/active/);
    await expect(beginBtn).toBeEnabled();
  });

  test('should progress from self-declaration to the quick win puzzle', async ({ page }) => {
    await page.goto('/assessment');

    // Select skill level and proceed
    await page.click('button:has-text("Casual")');
    await page.click('button:has-text("Begin Assessment →")');

    // Should transition to Screen 2 (Quick Win)
    await expect(page.locator('.gauntlet-header h2')).toContainText('First Battle');
    await expect(page.locator('.board-overlay-banner')).toContainText('White to Move');
    await expect(page.locator('.sidebar h3')).toContainText('Deliver the Strike');

    // Telemetry and board should be fully loaded
    await expect(page.locator('.chess-board')).toBeVisible();
    const attempts = page.locator('.telemetry-item:has-text("ATTEMPTS") .val');
    await expect(attempts).toHaveText('0');
  });

  test('should trigger confirmation modal when clicking exit', async ({ page }) => {
    await page.goto('/assessment');

    // Click exit button
    await page.click('.btn-exit');

    // UI Store Modal confirmation should pop up
    // Let's assert that confirmation modal/overlay is visible
    await expect(page.locator('.confirm-overlay')).toBeVisible();
    await expect(page.locator('.confirm-overlay h3')).toContainText('Exit Assessment?');

    // Click Cancel in the confirmation modal to return to assessment
    await page.click('.confirm-overlay button:has-text("Cancel")');
    await expect(page.locator('.confirm-overlay')).not.toBeVisible();
  });
});
