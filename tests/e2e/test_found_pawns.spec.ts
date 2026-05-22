import { test, expect } from '@playwright/test';

test.describe('Found Pawns Lesson E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser console logs
    page.on('console', msg => {
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    });
    
    await page.setViewportSize({ width: 1440, height: 900 });
    // Navigate directly to the foundations pawn lesson
    await page.goto('/learn/found-pawns');
  });

  test('should complete the Pawn lesson slides successfully', async ({ page }) => {
    // Wait for the slide narrative container to be visible
    await expect(page.locator('.narrative-panel')).toBeVisible({ timeout: 10000 });
    
    // --- Slide 1: The Infantry — Your Front Line ---
    console.log('Slide 1: Infantry');
    await expect(page.locator('.narrative-title')).toContainText('The Infantry');
    await page.locator('.narrative-next-btn').click();
    
    // --- Slide 2: The Diagonal Attack (En Passant Challenge) ---
    console.log('Slide 2: Diagonal Attack');
    await expect(page.locator('.narrative-title')).toContainText('The Diagonal Attack');
    
    // Button should be "Try the Challenge →"
    await expect(page.locator('.narrative-next-btn')).toContainText('Try the Challenge');
    await page.locator('.narrative-next-btn').click();
    
    // Perform en passant capture: move white pawn from d5 to e6
    // White selects d5
    await page.locator('.piece-wrapper[data-square="d5"]').click();
    await page.waitForTimeout(300);
    // White clicks e6 to capture
    await page.locator('.board-square[data-square="e6"]').click();
    
    // Wait for auto-advance to Slide 3 (1200ms delay + buffer)
    await page.waitForTimeout(2000);

    // --- Slide 3: Promotion — The Ultimate Reward ---
    console.log('Slide 3: Promotion');
    await expect(page.locator('.narrative-title')).toContainText('Promotion');
    
    // Button should be "Try the Challenge →"
    await expect(page.locator('.narrative-next-btn')).toContainText('Try the Challenge');
    await page.locator('.narrative-next-btn').click();
    
    // Perform promotion: move pawn e7 to e8
    // White selects e7
    await page.locator('.piece-wrapper[data-square="e7"]').click();
    await page.waitForTimeout(300);
    // White clicks e8 to promote
    await page.locator('.board-square[data-square="e8"]').click();
    
    // Wait for results
    await page.waitForTimeout(3000);
  });
});
