import { test, expect } from '@playwright/test';

test.describe('2. Carregamento dos assets, falhas e nova tentativa', () => {

    test('should show loading, fail due to query param, and retry successfully', async ({ page }) => {
        // Navigate with failAssets=1 to force a simulated load failure
        await page.goto('/?failAssets=1');

        // Wait for the failure message
        await expect(page.getByText('Failed to load assets')).toBeVisible();

        // Click retry
        await page.getByRole('button', { name: 'Retry' }).click();

        // Give a username so we can play
        await page.getByLabel("Captain's Name").fill('Test Player');

        // Click play to start loading assets
        await page.getByRole('button', { name: 'Play' }).click();

        // The loading should succeed now because assetFail=once is consumed
        // We expect the canvas to appear (meaning the game started)
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
        
        // And HUD element (e.g. Score or Time)
        await expect(page.getByText('Score: 0')).toBeVisible();
    });

});
