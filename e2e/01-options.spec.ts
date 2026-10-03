import { test, expect } from '@playwright/test';
import { STORAGE_KEYS } from '../src/core/config';

test.describe('1. Navegação, validação e persistência das opções', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should open options, change values and save them', async ({ page }) => {
        // Open options menu
        await page.getByRole('button', { name: 'Options' }).click();
        
        // Ensure options title is visible
        await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();

        // Check defaults (120s session, 3s spawn)
        await expect(page.locator('.responsive-card').getByText('120s')).toBeVisible();
        await expect(page.locator('.responsive-card').getByText('3s')).toBeVisible();

        // Increase session time (e.g. click +)
        const increaseSessionBtn = page.locator('div').filter({ hasText: /^Match Duration120s$/ }).getByRole('button').nth(1);
        await increaseSessionBtn.click();
        await expect(page.locator('.responsive-card').getByText('150s')).toBeVisible(); // Next step should be 150s

        // Decrease spawn interval (e.g. click -)
        const decreaseSpawnBtn = page.locator('div').filter({ hasText: /^Enemy Spawn3s$/ }).getByRole('button').first();
        await decreaseSpawnBtn.click();
        await expect(page.locator('.responsive-card').getByText('2s')).toBeVisible(); // Previous step should be 2s

        // Save & Close
        await page.getByRole('button', { name: 'Save & Close' }).click();

        // Ensure we are back in Main Menu
        await expect(page.getByAltText('Pirate Battle')).toBeVisible();

        // Check persistence in localStorage
        const sessionTime = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.sessionTime);
        const spawnInterval = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.spawnInterval);
        
        expect(sessionTime).toBe('150');
        expect(spawnInterval).toBe('2');
    });

    test('should persist options after refresh', async ({ page }) => {
        // Set some values in localStorage directly
        await page.evaluate((keys) => {
            localStorage.setItem(keys.sessionTime, '180');
            localStorage.setItem(keys.spawnInterval, '1');
        }, STORAGE_KEYS);

        // Reload page to simulate return visit
        await page.reload();

        // Open options menu
        await page.getByRole('button', { name: 'Options' }).click();

        // Check that the UI matches the persisted values
        await expect(page.locator('.responsive-card').getByText('180s')).toBeVisible();
        await expect(page.locator('.responsive-card').getByText('1s')).toBeVisible();
    });

});
