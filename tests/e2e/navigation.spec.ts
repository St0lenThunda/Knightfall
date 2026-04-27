import { test, expect } from '@playwright/test';

test.describe('Navigation & Accessibility', () => {
  test('should navigate through public views via side nav', async ({ page }) => {
    await page.goto('/');

    // Check for login button since we are guest
    const loginBtn = page.locator('button:has-text("Login")');
    await expect(loginBtn).toBeVisible();

    // Direct Combat
    await page.click('nav.sidenav a:has-text("Direct Combat")');
    await expect(page).toHaveURL(/.*play/);
    await expect(page.locator('h2')).toContainText('Direct Combat');

    // Siege Trials
    await page.click('nav.sidenav a:has-text("Siege Trials")');
    await expect(page).toHaveURL(/.*puzzles/);
    await expect(page.locator('h2')).toContainText('Siege Trials');

    // Codex of Rites (Settings)
    await page.click('nav.sidenav a:has-text("Codex of Rites")');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should handle responsive sidebar', async ({ page }) => {
    // On mobile (< 900px), the sidenav is translated out of view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const nav = page.locator('nav.sidenav');
    // It should be present in DOM but not visible (due to transform)
    // Or we can check for a mobile menu toggle if we had one
    // Let's just check it has the right styles
    const box = await nav.boundingBox();
    // If it's translateX(-100%), it should be off-screen
    if (box) {
      expect(box.x).toBeLessThan(0);
    }
  });
});
