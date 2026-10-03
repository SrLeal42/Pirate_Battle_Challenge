import { test, expect } from '@playwright/test';
import type { GameTestApi } from '../src/testing/testHooks';
import '../src/testing/testHooks';

test.describe('11. Registro da partida, atualização e recuperação', () => {

    test('should register match and update leaderboards', async ({ page }) => {
        test.setTimeout(60000);
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
            window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ submitMatch: 'success' }));
        });
        await page.goto('/');

        await page.getByLabel("Captain's Name").fill('Champion');
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

        // End match by time up
        await page.evaluate(() => {
            for (let i = 0; i < 125; i++) window.__game!.advance(1000);
        });

        await expect(page.getByText('Time is up', { exact: true })).toBeVisible();
        await expect(page.getByText('Score saved to Leaderboard!')).toBeVisible();

        await page.getByRole('button', { name: 'Main Menu' }).click();

        // Check history
        await page.getByRole('button', { name: 'History' }).click();
        await expect(page.locator('tbody tr').first()).toContainText('Champion');
    });

    test('should keep pending match on error and recover it after refresh', async ({ page }) => {
        test.setTimeout(60000);
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
            if (!window.localStorage.getItem('pirate_mock_settings')) {
                window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'server-error' }));
            }
        });
        await page.goto('/');

        await page.getByLabel("Captain's Name").fill('Pending Player');
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

        // End match by time up
        await page.evaluate(() => {
            for (let i = 0; i < 125; i++) window.__game!.advance(1000);
        });

        await expect(page.getByText(/Couldn't save your score/)).toBeVisible({ timeout: 20000 });
        
        await page.getByRole('button', { name: 'Main Menu' }).click();

        // Pending notice should be visible
        await expect(page.getByText('waiting to sync')).toBeVisible();

        // Fix the MSW setting so it succeeds next time
        await page.evaluate(() => {
            window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'success' }));
        });

        // Refresh and click Retry on the sync banner
        await page.reload();
        await expect(page.getByText('waiting to sync')).toBeVisible();
        await page.getByRole('button', { name: 'Retry' }).click();

        // Should disappear eventually
        await expect(page.getByText('waiting to sync')).not.toBeVisible();
    });
});
