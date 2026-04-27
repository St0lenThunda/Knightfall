import { test, expect } from '@playwright/test';

test.describe('Puzzle Trials', () => {
  test('should load a puzzle and show hints', async ({ page }) => {
    await page.goto('/puzzles');

    // Wait for puzzle to load
    await expect(page.locator('.puzzle-card')).toBeVisible();
    await expect(page.locator('.chess-board')).toBeVisible();

    // Check hint functionality
    const hintBtn = page.locator('button:has-text("Hint")');
    await expect(hintBtn).toBeEnabled();
    
    await hintBtn.click();
    // Check if toast appears or highlight is shown
    // In ChessBoard.vue, highlights are rendered as .sq-highlight
    // But since it's async and we don't know the puzzle solution, we just check button text change
    await expect(page.locator('button:has-text("Show Move")')).toBeVisible();
  });

  test('should allow skipping a puzzle', async ({ page }) => {
    await page.goto('/puzzles');
    
    const initialId = await page.locator('.label:has-text("Puzzle #")').textContent();
    
    await page.click('button:has-text("Skip")');
    
    // Wait for next puzzle
    await page.waitForTimeout(1000);
    const nextId = await page.locator('.label:has-text("Puzzle #")').textContent();
    
    expect(initialId).not.toBe(nextId);
  });
});
