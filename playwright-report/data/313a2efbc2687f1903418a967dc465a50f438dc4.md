# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-submit.spec.ts >> 11. Registro da partida, atualização e recuperação >> should keep pending match on error and recover it after refresh
- Location: e2e\11-submit.spec.ts:34:5

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Retry' })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - generic [ref=f1e8]:
      - img "Pirate Battle" [ref=f1e9]
      - generic [ref=f1e10]:
        - generic [ref=f1e11]:
          - generic [ref=f1e12]: Captain's Name
          - textbox "Captain's Name" [active] [ref=f1e13]:
            - /placeholder: Type your name...
            - text: Pending Player
        - generic [ref=f1e14]:
          - button "Play" [ref=f1e15] [cursor=pointer]
          - button "Options" [ref=f1e16] [cursor=pointer]
      - generic [ref=f1e17]:
        - button "Controls" [ref=f1e18] [cursor=pointer]
        - button "Ranking" [ref=f1e19] [cursor=pointer]
        - button "History" [ref=f1e20] [cursor=pointer]
      - region [ref=f1e21]:
        - heading "Last match" [level=2] [ref=f1e22]
        - generic [ref=f1e23]:
          - generic [ref=f1e24]:
            - term [ref=f1e25]: Score
            - definition [ref=f1e26]: "0"
          - generic [ref=f1e27]:
            - term [ref=f1e28]: Time played
            - definition [ref=f1e29]: 2:00
          - generic [ref=f1e30]:
            - term [ref=f1e31]: Reason
            - definition [ref=f1e32]: Time is up
    - status [ref=f1e33]
  - button "Network scenarios" [ref=f1e35] [cursor=pointer]: ⚙
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import type { GameTestApi } from '../src/testing/testHooks';
  3  | import '../src/testing/testHooks';
  4  | 
  5  | test.describe('11. Registro da partida, atualização e recuperação', () => {
  6  | 
  7  |     test('should register match and update leaderboards', async ({ page }) => {
  8  |         test.setTimeout(60000);
  9  |         await page.addInitScript(() => {
  10 |             window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
  11 |             window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ submitMatch: 'success' }));
  12 |         });
  13 |         await page.goto('/');
  14 | 
  15 |         await page.getByLabel("Captain's Name").fill('Champion');
  16 |         await page.getByRole('button', { name: 'Play' }).click();
  17 |         await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  18 | 
  19 |         // End match by time up
  20 |         await page.evaluate(() => {
  21 |             for (let i = 0; i < 125; i++) window.__game!.advance(1000);
  22 |         });
  23 | 
  24 |         await expect(page.getByText('Time is up', { exact: true })).toBeVisible();
  25 |         await expect(page.getByText('Score saved to Leaderboard!')).toBeVisible();
  26 | 
  27 |         await page.getByRole('button', { name: 'Main Menu' }).click();
  28 | 
  29 |         // Check history
  30 |         await page.getByRole('button', { name: 'History' }).click();
  31 |         await expect(page.locator('tbody tr').first()).toContainText('Champion');
  32 |     });
  33 | 
  34 |     test('should keep pending match on error and recover it after refresh', async ({ page }) => {
  35 |         test.setTimeout(60000);
  36 |         await page.addInitScript(() => {
  37 |             window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
  38 |             if (!window.localStorage.getItem('pirate_mock_settings')) {
  39 |                 window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'server-error' }));
  40 |             }
  41 |         });
  42 |         await page.goto('/');
  43 | 
  44 |         await page.getByLabel("Captain's Name").fill('Pending Player');
  45 |         await page.getByRole('button', { name: 'Play' }).click();
  46 |         await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  47 | 
  48 |         // End match by time up
  49 |         await page.evaluate(() => {
  50 |             for (let i = 0; i < 125; i++) window.__game!.advance(1000);
  51 |         });
  52 | 
  53 |         await expect(page.getByText(/Couldn't save your score/)).toBeVisible({ timeout: 20000 });
  54 |         
  55 |         await page.getByRole('button', { name: 'Main Menu' }).click();
  56 | 
  57 |         // Pending notice should be visible
  58 |         await expect(page.getByText('waiting to sync')).toBeVisible();
  59 | 
  60 |         // Fix the MSW setting so it succeeds next time
  61 |         await page.evaluate(() => {
  62 |             window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'success' }));
  63 |         });
  64 | 
  65 |         // Refresh and click Retry on the sync banner
  66 |         await page.reload();
  67 |         await expect(page.getByText('waiting to sync')).toBeVisible();
> 68 |         await page.getByRole('button', { name: 'Retry' }).click();
     |                                                           ^ Error: locator.click: Test timeout of 60000ms exceeded.
  69 | 
  70 |         // Should disappear eventually
  71 |         await expect(page.getByText('waiting to sync')).not.toBeVisible();
  72 |     });
  73 | });
  74 | 
```