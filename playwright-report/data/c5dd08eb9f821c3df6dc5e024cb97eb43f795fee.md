# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-leaderboard.spec.ts >> 10. Consulta e paginação das abas Ranking e Match History >> should handle loading, empty state, and pagination
- Location: e2e\10-leaderboard.spec.ts:5:5

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('.pageIcon').nth(1)

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - dialog [active] [ref=f1e8]:
      - heading "Leaderboard" [level=1] [ref=f1e9]
      - generic [ref=f1e10]:
        - button "Ranking" [ref=f1e11]
        - button "History" [ref=f1e12] [cursor=pointer]
      - paragraph [ref=f1e13]: 120s Battle - 3s Spawn Interval
      - table [ref=f1e15]:
        - rowgroup [ref=f1e16]:
          - row [ref=f1e17]:
            - columnheader "Rank" [ref=f1e18]
            - columnheader "Player" [ref=f1e19]
            - columnheader "Score" [ref=f1e20]
            - columnheader "Time" [ref=f1e21]
            - columnheader "Date" [ref=f1e22]
        - rowgroup [ref=f1e23]:
          - row [ref=f1e24]:
            - cell "1" [ref=f1e25]
            - cell [ref=f1e26]:
              - img "Star" [ref=f1e27]
              - text: Calico Bonny
            - cell "49" [ref=f1e28]
            - cell "62s" [ref=f1e29]
            - cell "08 OCT - 20:54" [ref=f1e30]
          - row [ref=f1e31]:
            - cell "2" [ref=f1e32]
            - cell "Anne Teach" [ref=f1e33]
            - cell "48" [ref=f1e34]
            - cell "69s" [ref=f1e35]
            - cell "13 OCT - 05:47" [ref=f1e36]
          - row [ref=f1e37]:
            - cell "3" [ref=f1e38]
            - cell "Blackbeard Kidd" [ref=f1e39]
            - cell "47" [ref=f1e40]
            - cell "57s" [ref=f1e41]
            - cell "15 NOV - 07:41" [ref=f1e42]
          - row [ref=f1e43]:
            - cell "4" [ref=f1e44]
            - cell "Blackbeard Bonny" [ref=f1e45]
            - cell "47" [ref=f1e46]
            - cell "31s" [ref=f1e47]
            - cell "31 DEC - 20:54" [ref=f1e48]
          - row [ref=f1e49]:
            - cell "5" [ref=f1e50]
            - cell "Blackbeard Jack" [ref=f1e51]
            - cell "46" [ref=f1e52]
            - cell "101s" [ref=f1e53]
            - cell "21 SEP - 20:36" [ref=f1e54]
          - row [ref=f1e55]:
            - cell "6" [ref=f1e56]
            - cell "Charles Read" [ref=f1e57]
            - cell "43" [ref=f1e58]
            - cell "70s" [ref=f1e59]
            - cell "21 SEP - 21:32" [ref=f1e60]
          - row [ref=f1e61]:
            - cell "7" [ref=f1e62]
            - cell "Charles Vane" [ref=f1e63]
            - cell "41" [ref=f1e64]
            - cell "83s" [ref=f1e65]
            - cell "24 SEP - 16:20" [ref=f1e66]
          - row [ref=f1e67]:
            - cell "8" [ref=f1e68]
            - cell "William Teach" [ref=f1e69]
            - cell "41" [ref=f1e70]
            - cell "72s" [ref=f1e71]
            - cell "12 SEP - 22:50" [ref=f1e72]
          - row [ref=f1e73]:
            - cell "9" [ref=f1e74]
            - cell "Calico Bonny" [ref=f1e75]
            - cell "39" [ref=f1e76]
            - cell "16s" [ref=f1e77]
            - cell "03 OCT - 13:10" [ref=f1e78]
          - row [ref=f1e79]:
            - cell "10" [ref=f1e80]
            - cell "Anne Teach" [ref=f1e81]
            - cell "39" [ref=f1e82]
            - cell "9s" [ref=f1e83]
            - cell "26 NOV - 08:57" [ref=f1e84]
      - generic [ref=f1e85]:
        - button [disabled] [ref=f1e86]:
          - img "Prev" [ref=f1e87]
        - generic [ref=f1e88]: Page 1 of 5
        - button [ref=f1e89] [cursor=pointer]:
          - img "Next" [ref=f1e90]
      - button "Back to Menu" [ref=f1e91] [cursor=pointer]
    - status [ref=f1e92]
  - button "Network scenarios" [ref=f1e94] [cursor=pointer]: ⚙
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('10. Consulta e paginação das abas Ranking e Match History', () => {
  4  | 
  5  |     test('should handle loading, empty state, and pagination', async ({ page }) => {
  6  |         test.setTimeout(60000);
  7  |         // Force empty response via MSW mock settings
  8  |         await page.addInitScript(() => {
  9  |             window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
  10 |             if (!window.localStorage.getItem('pirate_mock_settings')) {
  11 |                 window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'empty' }));
  12 |             }
  13 |         });
  14 |         await page.goto('/');
  15 |         
  16 |         await page.getByRole('button', { name: 'Ranking' }).click();
  17 |         
  18 |         // Wait for empty state
  19 |         await expect(page.getByText('No records found.')).toBeVisible();
  20 | 
  21 |         // Switch to history tab
  22 |         await page.getByRole('button', { name: 'History' }).click();
  23 |         await expect(page.getByText('No records found.')).toBeVisible();
  24 | 
  25 |         await page.getByRole('button', { name: 'Back to Menu' }).click();
  26 | 
  27 |         // Now set to standard scenario which has multiple pages
  28 |         await page.evaluate(() => {
  29 |             window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'many-pages' }));
  30 |         });
  31 |         await page.reload();
  32 | 
  33 |         await page.getByRole('button', { name: 'Ranking' }).click();
  34 |         
  35 |         // Wait for records to load, we should see rows
  36 |         await expect(page.locator('tbody tr')).toHaveCount(10); // Page size is 10
  37 |         
  38 |         // Next page
> 39 |         await page.locator('.pageIcon').nth(1).click(); // Click next
     |                                                ^ Error: locator.click: Test timeout of 60000ms exceeded.
  40 |         
  41 |         // Ensure new rows loaded
  42 |         await expect(page.locator('tbody tr')).toHaveCount(10); 
  43 |     });
  44 |     
  45 |     test('should handle network errors gracefully', async ({ page }) => {
  46 |         test.setTimeout(60000);
  47 |         await page.addInitScript(() => {
  48 |             window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'leaderboard-error' }));
  49 |         });
  50 |         await page.goto('/');
  51 |         
  52 |         await page.getByRole('button', { name: 'Ranking' }).click();
  53 |         await expect(page.getByText('Failed to load ranking')).toBeVisible();
  54 |         await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  55 |     });
  56 | });
  57 | 
```