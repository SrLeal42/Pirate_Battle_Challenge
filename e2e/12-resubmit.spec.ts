import { test, expect } from '@playwright/test';
import type { GameTestApi } from '../src/testing/testHooks';
import '../src/testing/testHooks';

test.describe('12. Reenvio após timeout sem duplicação e respostas atrasadas', () => {

    test('should retry on timeout and avoid duplication', async ({ page }) => {
        test.setTimeout(60000);
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
            // Simulate a timeout, which means the client retries but doesn't duplicate
            // We can use a slow_success scenario where it takes a long time, triggering timeout and retries,
            // but eventually succeeds. Or we simulate timeout then success.
            window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'submit-timeout-after-save' }));
        });
        await page.goto('/');

        await page.getByLabel("Captain's Name").fill('Timeout Tester');
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

        // End match by time out
        await page.evaluate(() => {
            for (let i = 0; i < 125; i++) window.__game!.advance(1000);
        });

        // Eventually it should say Match recorded successfully because the mock recovers
        await expect(page.getByText('Score saved to Leaderboard!')).toBeVisible({ timeout: 15000 });

        // Go back and check history
        await page.getByRole('button', { name: 'Main Menu' }).click();
        await page.getByRole('button', { name: 'History' }).click();

        // Ensure there is only 1 entry for this match (no duplication)
        // We can check how many rows are there
        await expect(page.locator('tbody tr')).toHaveCount(1);
    });
});
