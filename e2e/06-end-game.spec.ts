import { test, expect } from '@playwright/test';

test.describe('6. Encerramento por tempo e por morte, interrupção da simulação e reinício limpo', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
                config: {
                    defaultSessionTime: 60, // Short session for testing time over
                    maxAliveEnemies: 0 // No enemies by default to prevent accidental death
                }
            };
        });
        await page.goto('/');
        await page.getByLabel("Captain's Name").fill('Survivor');
        await page.getByRole('button', { name: 'Play' }).click();

        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });

    test('should end game when time runs out', async ({ page }) => {
        // Advance 125 seconds safely
        await page.evaluate(() => {
            for (let i = 0; i < 125; i++) window.__game!.advance(1000);
        });

        // Wait for game over screen
        await expect(page.getByText('Time is up')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible();

        // Check that simulation stopped (e.g. runtimeState is GameOver)
        const runtimeState = await page.evaluate(() => window.__game!.getRuntimeState());
        expect(runtimeState).toBe('ended');
    });

    test.skip('should end game on death and restart cleanly', async ({ page }) => {
        // Force player death by directly setting health to 0
        await page.evaluate(() => {
            const state = window.__game!.getState()!;
            state.player!.health = 0;
            // Advance small tick to trigger death logic
            window.__game!.advance(16);
        });

        // Wait for game over screen
        await expect(page.getByText('Your ship was destroyed')).toBeVisible();

        // Restart cleanly
        await page.getByRole('button', { name: 'Play Again' }).click();

        // Should be playing again
        await expect(page.locator('canvas')).toBeVisible();
        const runtimeState = await page.evaluate(() => window.__game!.getRuntimeState());
        expect(runtimeState).toBe('playing');

        // Player health should be restored
        const health = await page.evaluate(() => window.__game!.getState()!.player!.health);
        expect(health).toBeGreaterThan(0);
    });
});
