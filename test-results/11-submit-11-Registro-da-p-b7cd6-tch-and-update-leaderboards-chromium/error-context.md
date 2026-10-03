# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-submit.spec.ts >> 11. Registro da partida, atualização e recuperação >> should register match and update leaderboards
- Location: e2e\11-submit.spec.ts:7:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('tbody tr').first()
Expected substring: "Champion"
Received string:    "03 OCT - 16:45Victory0120s"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('tbody tr').first() with timeout 5000ms
  - waiting for locator('tbody tr').first()
    10 × locator resolved to <tr class="_highlightRow_1veag_181">…</tr>
       - unexpected value "03 OCT - 16:45Victory0120s"

```

```yaml
- row "03 OCT - 16:45 Victory 0 120s":
  - cell "03 OCT - 16:45"
  - cell "Victory"
  - cell "0"
  - cell "120s"
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
> 31 |         await expect(page.locator('tbody tr').first()).toContainText('Champion');
     |                                                        ^ Error: expect(locator).toContainText(expected) failed
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
  68 |         await page.getByRole('button', { name: 'Retry' }).click();
  69 | 
  70 |         // Should disappear eventually
  71 |         await expect(page.getByText('waiting to sync')).not.toBeVisible();
  72 |     });
  73 | });
  74 | 
```