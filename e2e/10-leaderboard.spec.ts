import { test, expect } from '@playwright/test';

test.describe('10. Consulta e paginação das abas Ranking e Match History', () => {

    test('should handle loading, empty state, and pagination', async ({ page }) => {
        test.setTimeout(60000);
        // Force empty response via MSW mock settings
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = { manualClock: true, config: { maxAliveEnemies: 0 } };
            if (!window.localStorage.getItem('pirate_mock_settings')) {
                window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'empty' }));
            }
        });
        await page.goto('/');
        
        await page.getByRole('button', { name: 'Ranking' }).click();
        
        // Wait for empty state
        await expect(page.getByText('No records found.')).toBeVisible();

        // Switch to history tab
        await page.getByRole('button', { name: 'History' }).click();
        await expect(page.getByText('No records found.')).toBeVisible();

        await page.getByRole('button', { name: 'Back to Menu' }).click();

        // Now set to standard scenario which has multiple pages
        await page.evaluate(() => {
            window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'many-pages' }));
        });
        await page.reload();

        await page.getByRole('button', { name: 'Ranking' }).click();
        
        // Wait for records to load, we should see rows
        await expect(page.locator('tbody tr')).toHaveCount(10); // Page size is 10
        
        // Next page
        await page.locator('.pageIcon').nth(1).click(); // Click next
        
        // Ensure new rows loaded
        await expect(page.locator('tbody tr')).toHaveCount(10); 
    });
    
    test('should handle network errors gracefully', async ({ page }) => {
        test.setTimeout(60000);
        await page.addInitScript(() => {
            window.localStorage.setItem('pirate_mock_settings', JSON.stringify({ scenario: 'leaderboard-error' }));
        });
        await page.goto('/');
        
        await page.getByRole('button', { name: 'Ranking' }).click();
        await expect(page.getByText('Failed to load ranking')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });
});
