# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Gameplay Mechanics >> should allow undoing a move
- Location: tests/e2e/gameplay.spec.ts:38:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#diag-selected')
Expected: "e2"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('#diag-selected')
    8 × locator resolved to <div data-v-41886935="" id="diag-selected"></div>
      - unexpected value ""

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
      - generic [ref=e40]: v0.16.0 prototype
    - main [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - heading "Direct Combat" [level=2] [ref=e45]
            - paragraph [ref=e46]: Local · Pass & Play · 10m | 5s
          - generic [ref=e47]:
            - button "↩ Undo" [disabled] [ref=e48] [cursor=pointer]
            - button "⇄ Flip" [ref=e49] [cursor=pointer]
            - button "✕ Resign" [ref=e50] [cursor=pointer]
        - generic [ref=e51]:
          - generic:
            - generic [ref=e52]:
              - generic [ref=e54]: 👤
              - generic [ref=e55]:
                - generic [ref=e56]: Player 2
                - generic [ref=e58]: "1500"
              - generic [ref=e59]: 10:00
            - generic [ref=e61]:
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]: "8"
                  - generic [ref=e65]: "7"
                  - generic [ref=e66]: "6"
                  - generic [ref=e67]: "5"
                  - generic [ref=e68]: "4"
                  - generic [ref=e69]: "3"
                  - generic [ref=e70]: "2"
                  - generic [ref=e71]: "1"
                - generic [ref=e73]:
                  - generic [ref=e74]:
                    - generic [ref=e75] [cursor=pointer]:
                      - generic: ♜
                    - generic [ref=e76] [cursor=pointer]:
                      - generic: ♞
                    - generic [ref=e77] [cursor=pointer]:
                      - generic: ♝
                    - generic [ref=e78] [cursor=pointer]:
                      - generic: ♛
                    - generic [ref=e79] [cursor=pointer]:
                      - generic: ♚
                    - generic [ref=e80] [cursor=pointer]:
                      - generic: ♝
                    - generic [ref=e81] [cursor=pointer]:
                      - generic: ♞
                    - generic [ref=e82] [cursor=pointer]:
                      - generic: ♜
                  - generic [ref=e83]:
                    - generic [ref=e84] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e85] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e86] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e87] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e88] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e89] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e90] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e91] [cursor=pointer]:
                      - generic: ♟
                  - generic [ref=e128]:
                    - generic [ref=e129] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e130] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e131] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e132] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e133] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e134] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e135] [cursor=pointer]:
                      - generic: ♟
                    - generic [ref=e136] [cursor=pointer]:
                      - generic: ♟
                  - generic [ref=e137]:
                    - generic [ref=e138] [cursor=pointer]:
                      - generic: ♜
                    - generic [ref=e139] [cursor=pointer]:
                      - generic: ♞
                    - generic [ref=e140] [cursor=pointer]:
                      - generic: ♝
                    - generic [ref=e141] [cursor=pointer]:
                      - generic: ♛
                    - generic [ref=e142] [cursor=pointer]:
                      - generic: ♚
                    - generic [ref=e143] [cursor=pointer]:
                      - generic: ♝
                    - generic [ref=e144] [cursor=pointer]:
                      - generic: ♞
                    - generic [ref=e145] [cursor=pointer]:
                      - generic: ♜
              - generic [ref=e146]:
                - generic [ref=e147]: a
                - generic [ref=e148]: b
                - generic [ref=e149]: c
                - generic [ref=e150]: d
                - generic [ref=e151]: e
                - generic [ref=e152]: f
                - generic [ref=e153]: g
                - generic [ref=e154]: h
            - generic [ref=e155]:
              - generic [ref=e157]: "?"
              - generic [ref=e158]:
                - generic [ref=e159]: Guest
                - generic [ref=e161]: "1200"
              - generic [ref=e162]: 9:55
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e166]: Move History
              - generic [ref=e167]:
                - button "⏮" [disabled] [ref=e168] [cursor=pointer]
                - button "◀" [disabled] [ref=e169] [cursor=pointer]
                - button "▶" [disabled] [ref=e170] [cursor=pointer]
                - button "⏭" [disabled] [ref=e171] [cursor=pointer]
            - generic [ref=e173]: No moves yet. Make your first move!
    - button "Open Diagnostics" [ref=e175] [cursor=pointer]
  - button "❤️ REFILL" [ref=e178] [cursor=pointer]
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
  25 |     await expect(diag).toHaveText('e2', { timeout: 10000 });
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
> 44 |     await expect(page.locator('#diag-selected')).toHaveText('e2');
     |                                                  ^ Error: expect(locator).toHaveText(expected) failed
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