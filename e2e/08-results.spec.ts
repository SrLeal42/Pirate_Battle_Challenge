import { test, expect } from '@playwright/test';
import { STORAGE_KEYS } from '../src/core/config';

test.describe('8. Exibição do resultado e sua persistência após refresh', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
                config: { maxAliveEnemies: 0 } // no enemies to avoid unexpected death
            };
        });
        await page.goto('/');
    });

    test('should show results and persist them in start screen after refresh', async ({ page }) => {
        await page.getByLabel("Captain's Name").fill('Result Tester');
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

        // Force death
        await page.evaluate(() => {
            const s = window.__game!.getState()!;
            s.player!.health = 0;
            window.__game!.advance(16);
        });

        await expect(page.getByText('Your ship was destroyed')).toBeVisible();
        await expect(page.getByText('Score:')).toBeVisible();

        // Return to main menu
        await page.getByRole('button', { name: 'Main Menu' }).click();

        // Check if Last match section is visible
        await expect(page.getByRole('heading', { name: 'Last match' })).toBeVisible();

        // Refresh page
        await page.reload();

        // Last match should still be visible because it was persisted in localStorage
        await expect(page.getByRole('heading', { name: 'Last match' })).toBeVisible();
        
        // Ensure that clicking play starts a new game
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible();
    });
});
