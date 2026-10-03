import { test, expect } from '@playwright/test';

test.describe('7. Pausa, perda de foco e retomada sem avanço indevido do cronômetro', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
            };
        });
        await page.goto('/');
        await page.getByLabel("Captain's Name").fill('Pauser');
        await page.getByRole('button', { name: 'Play' }).click();

        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });

    test('should pause when pressing Esc or losing focus and resume manually', async ({ page }) => {
        // Press Escape to pause
        await page.keyboard.press('Escape');

        // Check if paused
        await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

        // Check runtime state
        let runtimeState = await page.evaluate(() => window.__game!.getRuntimeState());
        expect(runtimeState).toBe('paused');

        // Resume
        await page.getByRole('button', { name: 'Resume' }).click();

        // Wait for pause menu to disappear
        await expect(page.getByText('Paused')).not.toBeVisible();

        runtimeState = await page.evaluate(() => window.__game!.getRuntimeState());
        expect(runtimeState).toBe('playing');
    });
});
