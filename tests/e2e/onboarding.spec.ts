import { test, expect } from '@playwright/test';

/**
 * Onboarding E2E Tests
 * 
 * Verifies the cinematic "New Game" step-based modal flow.
 * Covers mode selection, bot carousel, parameter setup, and game initialization.
 */
test.describe('New Game Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the play view
    await page.goto('/play');
    
    // Clear local storage but mock DNA to bypass onboarding redirect
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('knightfall_pending_dna', JSON.stringify({ rating: 1200, archetype: 'balanced' }));
    });
    
    // Reload so the route guard picks up the DNA
    await page.reload();
    
    // The "New Game" modal is triggered by the setup CTA
    await page.click('button:has-text("START NEW GAME")');
  });

  test('should complete the full setup flow for vs Computer', async ({ page }) => {
    // Step 1: Mode Selection
    // We expect the modal header to announce the mode phase
    await expect(page.locator('.step-modal h2')).toContainText('CHOOSE YOUR BATTLE');
    
    // Select "vs Computer" (default)
    await page.click('.mode-card:has-text("vs Computer")');
    await page.click('button:has-text("NEXT STEP")');

    // Step 2: Opponent Selection
    await expect(page.locator('.step-modal h2')).toContainText('SELECT ADVERSARY');
    
    // Verify bot details are visible
    const botName = page.locator('.bot-header h3');
    await expect(botName).toBeVisible();
    const initialBotName = await botName.textContent();
    
    // Test Carousel Navigation
    await page.click('button.nav-arrow.right');
    // Give it a moment for the transition
    await page.waitForTimeout(500); 
    const nextBotName = await botName.textContent();
    expect(initialBotName).not.toBe(nextBotName);

    // Test Educational Tooltips
    // Hover the 'ⓘ' next to DEPTH
    await page.hover('.stat-info-trigger >> nth=0');
    // Tooltips use [data-tooltip] attribute-driven ::after content in CSS, 
    // so we just verify the trigger exists and is interactive
    const depthTrigger = page.locator('.stat-info-trigger >> nth=0');
    await expect(depthTrigger).toBeVisible();

    await page.click('button:has-text("NEXT STEP")');

    // Step 3: Parameter Selection
    await expect(page.locator('.step-modal h2')).toContainText('SET PARAMETERS');
    
    // Select Side and Time Control
    await page.click('.color-btn:has-text("Black side")');
    await page.click('.tc-btn:has-text("10m | 5s")'); // 10m | 5s is default active, but let's click it anyway

    // Finalize: Start the Battle
    await page.click('button:has-text("READY FOR BATTLE")');

    // Verify Modal Closure and Game Start
    // The modal should disappear and the board should no longer be blurred
    await expect(page.locator('.step-modal')).not.toBeVisible();
    await expect(page.locator('.chess-board')).toBeVisible();
    await expect(page.locator('.board-main-container')).not.toHaveClass(/blurred/);
  });

  test('should skip bot selection for Local Pass & Play', async ({ page }) => {
    // Step 1: Mode Selection
    await page.click('.mode-card:has-text("Pass & Play")');
    await page.click('button:has-text("NEXT STEP")');

    // Verification: Should jump directly to Step 3 (Parameters)
    await expect(page.locator('.step-modal h2')).toContainText('SET PARAMETERS');
    
    // Ensure "SELECT ADVERSARY" was bypassed
    await expect(page.locator('text=SELECT ADVERSARY')).not.toBeVisible();
    
    // Step indicator should show only 2 dots total for local mode
    const dots = page.locator('.step-dot');
    await expect(dots).toHaveCount(2);
  });
});
