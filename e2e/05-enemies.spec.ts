import { test, expect } from '@playwright/test';

test.describe('5. Comportamentos de Chaser e Shooter e intervalo de spawn', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
                config: {
                    defaultSpawnInterval: 2,
                    chaserWeight: 1,
                    shooterWeight: 1,
                    defaultSessionTime: 300,
                }
            };
        });
        await page.goto('/');
        await page.getByLabel("Captain's Name").fill('Observer');
        await page.getByRole('button', { name: 'Play' }).click();
        
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });

    test('enemies should spawn, move towards player, and attack/collide', async ({ page }) => {
        // Advance clock by 10 seconds to allow spawns (1 spawn every 2s -> ~5 spawns)
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => window.__game!.advance(1000));
        }

        const enemies = await page.evaluate(() => window.__game!.getState()!.enemies);
        expect(enemies.length).toBeGreaterThan(0);
        
        const initialPlayerHealth = await page.evaluate(() => window.__game!.getState()!.player!.health);

        // Advance 20 more seconds, enough for them to reach and damage the player
        for (let i = 0; i < 20; i++) {
            await page.evaluate(() => window.__game!.advance(1000));
        }

        const finalPlayerHealth = await page.evaluate(() => window.__game!.getState()!.player!.health);
        
        // Either from collision or shooting, the player should take damage if they stand still
        expect(finalPlayerHealth).toBeLessThan(initialPlayerHealth);
    });
});
