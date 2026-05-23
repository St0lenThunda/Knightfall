import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Capture Specific Screenshots for README', () => {
  
  test.beforeEach(async ({ page }) => {
    const dir = path.join(process.cwd(), 'public/screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    // Mock API for Analysis only (so we don't spend money on LLM calls)
    await page.route('https://generativelanguage.googleapis.com/v1beta/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{ content: { parts: [{ text: "The Oracle: A solid opening choice following established theory. The Cathedral approves." }] } }]
        })
      });
    });

    // NO SUPABASE MOCKS - HITTING THE REAL REMOTE SUPABASE DATABASE
  });

  test('capture all views with specific requirements', async ({ page }) => {
    // --- 0. ONBOARDING ---
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/assessment');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'public/screenshots/00-onboarding.png', fullPage: false });

    // --- 1. HOME: Authenticated Strategic Briefing ---
    await page.goto('/');
    const loginTrigger = page.locator('button:has-text("Login")');
    await expect(loginTrigger).toBeVisible();
    await loginTrigger.click();
    
    // Login with the REAL username (case-sensitive to match the database!)
    await page.fill('[data-testid="email-input"]', 'Chesswizard99');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="auth-submit-btn"]');
    
    // Wait for login success
    await expect(page.locator('.modal-card')).toBeHidden({ timeout: 15000 });
    
    // Navigate BACK to the Home Page (Cathedral) because the router redirected us to /assessment when we first loaded!
    await page.goto('/');
    
    // Give the real Cathedral plenty of time to load the REAL DNA and Strategic Briefing from Supabase
    await page.waitForTimeout(6000); 
    await page.screenshot({ path: 'public/screenshots/01-cathedral.png', fullPage: false });

    // --- 2. PLAY: Bot Selection Page ---
    await page.goto('/play');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("START NEW GAME")');
    await page.click('.mode-card:has-text("vs Computer")');
    await page.click('button:has-text("NEXT STEP")');
    
    // We are now on Bot Selection
    await page.waitForTimeout(1000);
    await page.click('.nav-arrow.right'); 
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/screenshots/02-play.png', fullPage: false });

    // --- 3. ANALYSIS: Game in Analysis Mode ---
    await page.click('button:has-text("NEXT STEP")');
    await page.click('.color-btn:has-text("White side")');
    await page.click('button:has-text("READY FOR BATTLE")');
    
    await expect(page.locator('.chess-board')).toBeVisible({ timeout: 10000 });

    // Show Intel to see move list
    await page.getByRole('button', { name: /Show Intel/ }).click();
    await expect(page.locator('.side-panel')).toBeVisible();
    
    // Make move e4
    await page.locator('.piece-wrapper[data-square="e2"]').click();
    await page.waitForTimeout(300);
    await page.locator('.board-square[data-square="e4"]').click();
    
    await expect(page.locator('.moves-list .move-btn')).toHaveCount(2, { timeout: 15000 });
    
    await page.click('button:has-text("Resign")');
    await expect(page.locator('.game-over-overlay')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Review Game")');
    
    await expect(page).toHaveURL(/\/analysis\?id=.+/, { timeout: 30000 });
    await expect(page.locator('.analysis-sidebar')).toBeVisible();
    
    const analysisMoves = page.locator('.analysis-page .moves-list .move-btn');
    await expect(analysisMoves).toHaveCount(2, { timeout: 30000 });
    await analysisMoves.last().click({ force: true });
    
    await expect(page.locator('.coach-markdown')).toContainText('Oracle', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'public/screenshots/03-analysis.png', fullPage: false });

    // --- 4. PUZZLES ---
    await page.goto('/puzzles');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'public/screenshots/04-puzzles.png', fullPage: false });

    console.log("✅ Custom authenticated screenshots successfully captured!");
  });
});
