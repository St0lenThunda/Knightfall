# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Gameplay Mechanics >> should start a vs-computer game and make a move
- Location: tests/e2e/gameplay.spec.ts:12:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('#diag-selected')
Expected: "e2"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" with timeout 10000ms
  - waiting for locator('#diag-selected')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ♞
      - generic [ref=e7]: Knightfall
      - button "‹" [ref=e8] [cursor=pointer]
    - generic [ref=e10]:
      - button "Login" [ref=e11] [cursor=pointer]
      - button "Sign Up" [ref=e12] [cursor=pointer]
    - text: Login
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15] [cursor=pointer]:
          - generic [ref=e16]: The Grand Arena
          - generic [ref=e17]: ⌄
        - generic [ref=e18]:
          - link "♟ Direct Combat LIVE" [ref=e19] [cursor=pointer]:
            - /url: /play
            - generic [ref=e20]: ♟
            - generic [ref=e21]: Direct Combat
            - generic [ref=e22]: LIVE
          - link "⚡ Siege Trials NEW" [ref=e23] [cursor=pointer]:
            - /url: /puzzles
            - generic [ref=e24]: ⚡
            - generic [ref=e25]: Siege Trials
            - generic [ref=e26]: NEW
      - generic [ref=e28] [cursor=pointer]:
        - generic [ref=e29]: The Apothecary
        - generic [ref=e30]: ⌄
      - generic [ref=e31]:
        - generic [ref=e32] [cursor=pointer]:
          - generic [ref=e33]: The High Keep
          - generic [ref=e34]: ⌄
        - link "⚙️ Codex of Rites" [ref=e36] [cursor=pointer]:
          - /url: /settings
          - generic [ref=e37]: ⚙️
          - generic [ref=e38]: Codex of Rites
    - generic [ref=e40]: v0.29.1 prototype
  - main [ref=e41]:
    - generic [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]:
          - heading "Direct Combat" [level=2] [ref=e45]
          - paragraph [ref=e46]: You vs Computer · 10m | 5s
        - generic [ref=e47]:
          - button "📋 Show Intel" [ref=e48] [cursor=pointer]
          - button "↩ Undo" [disabled] [ref=e49] [cursor=pointer]
          - button "⇄ Flip" [ref=e50] [cursor=pointer]
          - button "✕ Resign" [ref=e51] [cursor=pointer]
      - generic [ref=e53]:
        - generic [ref=e54]:
          - img [ref=e56]
          - generic [ref=e57]:
            - generic [ref=e58]: Tactical Tanya
            - generic [ref=e60]: "800"
          - generic [ref=e61]: 10:00
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - generic [ref=e67]: "8"
              - generic [ref=e68]: "7"
              - generic [ref=e69]: "6"
              - generic [ref=e70]: "5"
              - generic [ref=e71]: "4"
              - generic [ref=e72]: "3"
              - generic [ref=e73]: "2"
              - generic [ref=e74]: "1"
            - generic [ref=e76]:
              - generic:
                - img "r" [ref=e150]
                - img "n" [ref=e152]
                - img "b" [ref=e154]
                - img "q" [ref=e156]
                - img "k" [ref=e158]
                - img "b" [ref=e160]
                - img "n" [ref=e162]
                - img "r" [ref=e164]
                - img "p" [ref=e166]
                - img "p" [ref=e168]
                - img "p" [ref=e170]
                - img "p" [ref=e172]
                - img "p" [ref=e174]
                - img "p" [ref=e176]
                - img "p" [ref=e178]
                - img "p" [ref=e180]
                - img "p" [ref=e182]
                - img "p" [ref=e184]
                - img "p" [ref=e186]
                - img "p" [ref=e188]
                - img "p" [ref=e190]
                - img "p" [ref=e192]
                - img "p" [ref=e194]
                - img "p" [ref=e196]
                - img "r" [ref=e198]
                - img "n" [ref=e200]
                - img "b" [ref=e202]
                - img "q" [ref=e204]
                - img "k" [ref=e206]
                - img "b" [ref=e208]
                - img "n" [ref=e210]
                - img "r" [ref=e212]
              - img
              - button "🛠️" [ref=e213] [cursor=pointer]:
                - generic [ref=e214]: 🛠️
          - generic [ref=e215]:
            - generic [ref=e216]: a
            - generic [ref=e217]: b
            - generic [ref=e218]: c
            - generic [ref=e219]: d
            - generic [ref=e220]: e
            - generic [ref=e221]: f
            - generic [ref=e222]: g
            - generic [ref=e223]: h
        - generic [ref=e224]:
          - generic [ref=e226]: "?"
          - generic [ref=e227]:
            - generic [ref=e228]: Guest
            - generic [ref=e230]: "1200"
          - generic [ref=e231]: 9:49
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Gameplay Mechanics', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Capture browser logs
  6  |     page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
  7  |     
  8  |     await page.setViewportSize({ width: 1440, height: 900 });
  9  |     await page.goto('/play');
  10 |   });
  11 | 
  12 |   test('should start a vs-computer game and make a move', async ({ page }) => {
  13 |     await page.click('.mode-btn:has-text("vs Computer")');
  14 |     await page.click('#start-game-btn');
  15 |     await expect(page.locator('.setup-panel')).toBeHidden();
  16 |     
  17 |     const board = page.locator('.chess-board');
  18 |     await expect(board).toBeVisible();
  19 | 
  20 |     console.log('Clicking e2...');
  21 |     await page.locator('[data-square="e2"]').click({ force: true });
  22 |     
  23 |     // Verify selection via diagnostic element
  24 |     const diag = page.locator('#diag-selected');
> 25 |     await expect(diag).toHaveText('e2', { timeout: 10000 });
     |                        ^ Error: expect(locator).toHaveText(expected) failed
  26 |     
  27 |     console.log('Clicking e4...');
  28 |     await page.locator('[data-square="e4"]').click({ force: true });
  29 | 
  30 |     const firstMove = page.locator('.move-btn').first();
  31 |     await expect(firstMove).toBeVisible({ timeout: 15000 });
  32 |     await expect(firstMove).toContainText('e4');
  33 | 
  34 |     // Computer should respond
  35 |     await expect(page.locator('.move-btn')).toHaveCount(2, { timeout: 15000 });
  36 |   });
  37 | 
  38 |   test('should allow undoing a move', async ({ page }) => {
  39 |     await page.click('.mode-btn:has-text("Pass & Play")');
  40 |     await page.click('#start-game-btn');
  41 |     await expect(page.locator('.setup-panel')).toBeHidden();
  42 |     
  43 |     await page.locator('[data-square="e2"]').click({ force: true });
  44 |     await expect(page.locator('#diag-selected')).toHaveText('e2');
  45 |     
  46 |     await page.locator('[data-square="e4"]').click({ force: true });
  47 |     await expect(page.locator('.move-btn')).toHaveCount(1, { timeout: 15000 });
  48 | 
  49 |     await page.click('button:has-text("Undo")');
  50 |     await expect(page.locator('.move-btn')).toHaveCount(0);
  51 |   });
  52 | 
  53 |   test('should detect resignation', async ({ page }) => {
  54 |     await page.click('.mode-btn:has-text("Pass & Play")');
  55 |     await page.click('#start-game-btn');
  56 |     await expect(page.locator('.setup-panel')).toBeHidden();
  57 | 
  58 |     await page.click('button:has-text("Resign")');
  59 |     
  60 |     const overlay = page.locator('.game-over-overlay');
  61 |     await expect(overlay).toBeVisible();
  62 |     await expect(overlay).toContainText('Resignation');
  63 |   });
  64 | });
  65 | 
```