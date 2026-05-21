import { test, expect } from '@playwright/test';

test.describe('Gameplay Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser logs
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/play');
  });

  test('should start a vs-computer game and make a move', async ({ page }) => {
    await page.click('button:has-text("START NEW GAME")');
    await page.click('.mode-card:has-text("vs Computer")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("READY FOR BATTLE")');
    await expect(page.locator('.setup-overlay')).toBeHidden();
    
    // Show Intel to see move list
    await page.getByRole('button', { name: /Show Intel/ }).click();
    await expect(page.locator('.side-panel')).toBeVisible();

    await page.locator('.piece-wrapper[data-square="e2"]').click();
    await page.waitForTimeout(500);
    await page.locator('.board-square[data-square="e4"]').click();
    await page.waitForTimeout(500);

    // Verify move was made by checking move history
    const firstMove = page.locator('.move-btn').first();
    await expect(firstMove).toBeVisible({ timeout: 15000 });
    await expect(firstMove).toContainText('e4');

    // Computer should respond
    await expect(page.locator('.move-btn')).toHaveCount(2, { timeout: 15000 });
  });

  test('should allow undoing a move', async ({ page }) => {
    await page.click('button:has-text("START NEW GAME")');
    await page.click('.mode-card:has-text("Pass & Play")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("READY FOR BATTLE")');
    await expect(page.locator('.setup-overlay')).toBeHidden();

    // Show Intel to see move list
    await page.getByRole('button', { name: /Show Intel/ }).click();
    await expect(page.locator('.side-panel')).toBeVisible();
    
    await page.locator('.piece-wrapper[data-square="e2"]').click();
    await page.waitForTimeout(500);
    await page.locator('.board-square[data-square="e4"]').click();
    // The bot might respond instantly, so we check for >= 1 move
    const moveCount = await page.locator('.move-btn').count();
    expect(moveCount).toBeGreaterThanOrEqual(1);

    await page.click('button:has-text("Undo")');
    await expect(page.locator('.move-btn')).toHaveCount(0);
  });

  test('should detect resignation', async ({ page }) => {
    await page.click('button:has-text("START NEW GAME")');
    await page.click('.mode-card:has-text("Pass & Play")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("READY FOR BATTLE")');
    await expect(page.locator('.setup-overlay')).toBeHidden();

    // The Resign button should be visible now
    await page.click('button:has-text("Resign")');
    
    const overlay = page.locator('.game-over-overlay');
    await expect(overlay).toBeVisible({ timeout: 15000 });
    await expect(overlay).toContainText('Resignation', { ignoreCase: true });
  });
});
