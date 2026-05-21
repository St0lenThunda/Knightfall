import { test, expect } from '@playwright/test';

/**
 * Bot Matrix Test Suite
 * 
 * Automates the verification of various bot/color combinations to ensure
 * the engine synchronization logic remains stable.
 */
test.describe('Bot Gameplay Matrix', () => {
  const bots = [
    { name: 'Leo the Apprentice', index: 0 },
    { name: 'Tanya of the Whispering Blade', index: 1 },
    { name: 'The Celestial Event', index: 8 }
  ];

  const colors = [
    { label: 'White side', value: 'w' },
    { label: 'Black side', value: 'b' }
  ];

  for (const bot of bots) {
    for (const color of colors) {
      test(`Match: ${bot.name} as ${color.label}`, async ({ page }) => {
        // 1. Setup Phase
        await page.goto('/play');
        
        // Wait for engine to be ready (look for initialized state in logs or just wait)
        await page.waitForTimeout(2000);

        await page.click('button:has-text("START NEW GAME")');
        
        // Step 1: Mode
        await page.click('.mode-card:has-text("vs Computer")');
        await page.click('button:has-text("NEXT STEP")');

        // Step 2: Bot Selection
        // We cycle to the target bot. 
        for (let i = 0; i < bot.index; i++) {
          await page.click('.nav-arrow.right'); 
          await page.waitForTimeout(100);
        }
        await expect(page.locator('.bot-details h3')).toContainText(bot.name);
        await page.click('button:has-text("NEXT STEP")');

        // Step 3: Parameters (Color)
        await page.click(`.color-btn:has-text("${color.label}")`);
        await page.click('button:has-text("READY FOR BATTLE")');

        // 2. Gameplay Verification
        await expect(page.locator('.setup-overlay')).toBeHidden();
        
        // Show Intel to see move list
        await page.getByRole('button', { name: /Show Intel/ }).click();
        await expect(page.locator('.side-panel')).toBeVisible();
        
        if (color.value === 'b') {
          // If player is Black, Bot (White) must move first.
          
          // Wait for first move to appear in history
          const firstMove = page.locator('.move-btn').first();
          await expect(firstMove).toBeVisible({ timeout: 15000 });
          
          // Thinking indicator should be gone/hidden after move
          await expect(page.locator('.thinking-indicator')).toBeHidden();
        } else {
          // If player is White, Player moves first.
          // Make e4 move
          // Make e4 move
          await page.locator('.piece-wrapper[data-square="e2"]').click();
          await page.locator('.board-square[data-square="e4"]').click();

          // History should eventually have 2 moves (Player e4 + Bot response)
          await expect(page.locator('.move-btn')).toHaveCount(2, { timeout: 15000 });
          await expect(page.locator('.thinking-indicator')).toBeHidden();
        }

        // Final Health Check: Clock should be running for the current turn
        const activeClock = page.locator('.clock.clock-active');
        await expect(activeClock).toBeVisible();
      });
    }
  }
});
