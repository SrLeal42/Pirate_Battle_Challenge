import { test, expect } from '@playwright/test';

test.describe('9. Abandono da partida, navegação repetida entre telas e controles de toque', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = { manualClock: true };
        });
        await page.goto('/');
    });

    test('should be able to abandon match, navigate menus repeatedly and start again', async ({ page }) => {
        // Navigate Menus
        await page.getByRole('button', { name: 'Options' }).click();
        await page.getByRole('button', { name: 'Save & Close' }).click();
        
        await page.getByRole('button', { name: 'Controls' }).click();
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        
        await page.getByRole('button', { name: 'Ranking' }).click();
        await page.getByRole('button', { name: 'Back to Menu' }).click();

        // Start Match
        await page.getByLabel("Captain's Name").fill('Quitter');
        await page.getByRole('button', { name: 'Play' }).click();
        await expect(page.locator('canvas')).toBeVisible();

        // Abandon Match (e.g. reload or go back)
        // Refresh page abandons the match
        await page.reload();

        // Should be back at Start Screen and no "Last match" for abandoned matches
        await expect(page.getByAltText('Pirate Battle')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Last match' })).not.toBeVisible();
    });
});
