import { test, expect } from '@playwright/test';

/**
 * E2E Test: Gameplay to Analysis Pipeline
 * 
 * Verifies the full flow from playing a game against the computer,
 * resigning, and transitioning to the analysis view with automated
 * deep synthesis and AI coaching.
 */
test.describe('Gameplay to Analysis Pipeline', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 120 seconds to be safe in CI-like environments

    // 1. MOCK GEMINI API (Generative Language)
    await page.route('https://generativelanguage.googleapis.com/v1beta/**', async route => {
      console.log('[E2E] Intercepted Gemini API call');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: "Mocked AI Coach: That was a solid opening choice. You're following established theory." }]
            }
          }]
        })
      });
    });

    // 2. MOCK SUPABASE REST API (Coaching Cache)
    await page.route('**/rest/v1/coaching_cache*', async route => {
      console.log('[E2E] Intercepted Supabase cache check');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // 3. MOCK SUPABASE REST API (Game Analytics/Library)
    await page.route('**/rest/v1/games*', async route => {
      console.log('[E2E] Intercepted Supabase games push');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mocked-game-id' })
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Go to /play
    await page.goto('/play');
    
    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.reload();
  });

  test('should complete a vs-Computer game and transition to analysis with mocked AI coaching', async ({ page }) => {
    // --- STEP 1: START VS COMPUTER GAME ---
    // The page might still be loading, wait for the CTA or board
    await page.waitForSelector('button:has-text("START NEW GAME")', { timeout: 30000 });
    await page.click('button:has-text("START NEW GAME")');
    
    // Select "vs Computer" and progress through steps
    await page.click('.mode-card:has-text("vs Computer")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("NEXT STEP")');
    await page.click('button:has-text("READY FOR BATTLE")');
    
    // Ensure the setup overlay disappears and the board is ready
    await expect(page.locator('.setup-overlay')).toBeHidden();
    await expect(page.locator('.chess-board')).toBeVisible();

    // Show Intel to see move list
    await page.getByRole('button', { name: /Show Intel/ }).click();
    await expect(page.locator('.side-panel')).toBeVisible();

    console.log('[E2E] Game started. Making moves...');

    // --- STEP 2: PLAY A FEW MOVES (Ruy Lopez) ---
    // Move 1: e4
    await page.locator('.piece-wrapper[data-square="e2"]').click();
    await page.waitForTimeout(300);
    await page.locator('.board-square[data-square="e4"]').click();

    // Wait for move 1 (White e4) and move 2 (Black response)
    await expect(page.locator('.moves-list .move-btn')).toHaveCount(2, { timeout: 30000 });

    // Move 2: Nf3
    await page.locator('.piece-wrapper[data-square="g1"]').click();
    await page.waitForTimeout(300);
    await page.locator('.board-square[data-square="f3"]').click();
    
    // Wait for computer response (total 4 moves)
    await expect(page.locator('.moves-list .move-btn')).toHaveCount(4, { timeout: 30000 });

    // Move 3: Bb5
    await page.locator('.piece-wrapper[data-square="f1"]').click();
    await page.waitForTimeout(300);
    await page.locator('.board-square[data-square="b5"]').click();
    
    // Wait for computer response (total 6 moves)
    await expect(page.locator('.moves-list .move-btn')).toHaveCount(6, { timeout: 30000 });

    console.log('[E2E] Moves completed. Resigning...');

    // --- STEP 3: RESIGN AND REVIEW ---
    await page.click('button:has-text("Resign")');
    
    const overlay = page.locator('.game-over-overlay');
    await expect(overlay).toBeVisible({ timeout: 15000 });
    
    // Transition to Analysis View
    await page.click('button:has-text("Review Game")');

    console.log('[E2E] Clicked Review Game. Waiting for Analysis transition...');

    // --- STEP 4: VERIFY ANALYSIS TRANSITION ---
    // URL should contain the game ID
    await expect(page).toHaveURL(/\/analysis\?id=.+/, { timeout: 30000 });
    
    // Verify analysis sidebar is active
    await expect(page.locator('.analysis-sidebar')).toBeVisible();
    
    // Verify that the moves from the game are present in the history
    // Note: analysis-page might have slightly different classes if it's a different MoveHistory instance
    const analysisMoves = page.locator('.analysis-page .moves-list .move-btn');
    await expect(analysisMoves).toHaveCount(6, { timeout: 30000 });

    console.log('[E2E] In Analysis view. Checking AI coach...');

    // --- STEP 5: VERIFY AI COACHING PIPELINE ---
    // Select the last move in the history to trigger the coach
    await analysisMoves.last().click();
    
    // Wait for the mocked AI coach response to appear in the CoachPanel
    const coachText = page.locator('.coach-markdown');
    await expect(coachText).toContainText('Mocked AI Coach', { timeout: 30000 });

    console.log('[E2E] Test passed successfully!');
  });
});
