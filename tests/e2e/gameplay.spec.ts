import { test, expect } from '@playwright/test';

test.describe('Gameplay Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser logs
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/play');
  });

  test('should start a vs-computer game and make a move', async ({ page }) => {
    await page.click('.mode-btn:has-text("vs Computer")');
    await page.click('#start-game-btn');
    await expect(page.locator('.setup-panel')).toBeHidden();
    
    await page.locator('[data-square="e2"]').click({ force: true });
    await page.locator('[data-square="e4"]').click({ force: true });

    // Verify move was made by checking move history
    const firstMove = page.locator('.move-btn').first();
    await expect(firstMove).toBeVisible({ timeout: 15000 });
    await expect(firstMove).toContainText('e4');

    // Computer should respond
    await expect(page.locator('.move-btn')).toHaveCount(2, { timeout: 15000 });
  });

  test('should allow undoing a move', async ({ page }) => {
    await page.click('.mode-btn:has-text("Pass & Play")');
    await page.click('#start-game-btn');
    await expect(page.locator('.setup-panel')).toBeHidden();
    
    await page.locator('[data-square="e2"]').click({ force: true });
    await page.locator('[data-square="e4"]').click({ force: true });
    await expect(page.locator('.move-btn')).toHaveCount(1, { timeout: 15000 });

    await page.click('button:has-text("Undo")');
    await expect(page.locator('.move-btn')).toHaveCount(0);
  });

  test('should detect resignation', async ({ page }) => {
    await page.click('.mode-btn:has-text("Pass & Play")');
    await page.click('#start-game-btn');
    await expect(page.locator('.setup-panel')).toBeHidden();

    await page.click('button:has-text("Resign")');
    
    const overlay = page.locator('.game-over-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('Resignation');
  });
});
