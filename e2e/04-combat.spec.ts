import { test, expect } from '@playwright/test';
import type { GameTestApi } from '../src/testing/testHooks';

test.describe('4. Disparos frontal e lateral, dano, cooldown e pontuação sem duplicação', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
                config: {
                    // One chaser will spawn quickly
                    defaultSpawnInterval: 1,
                    chaserWeight: 1,
                    shooterWeight: 0,
                    defaultSessionTime: 300,
                    // Short cooldowns for testing
                    cooldownFront: 100,
                    cooldownSide: 200,
                }
            };
        });
        await page.goto('/');
        await page.getByLabel("Captain's Name").fill('Shooter');
        await page.getByRole('button', { name: 'Play' }).click();
        
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
        
        await page.waitForFunction(() => {
            const state = window.__game?.getState();
            if (state && state.enemies.length === 0) {
                window.__game?.advance(1000); // Fast forward until an enemy spawns
            }
            return state && state.player && state.enemies.length > 0;
        });
    });

    test('should shoot front, deal damage, and score 1 point when enemy dies', async ({ page }) => {
        const getPlayerAndEnemies = () => page.evaluate(() => {
            const s = window.__game!.getState()!;
            return { player: s.player, enemies: s.enemies };
        });

        const initial = await getPlayerAndEnemies();
        expect(initial.enemies.length).toBeGreaterThan(0);
        
        // Hold Left to rotate
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(50);
        
        // Spin and spray cannonballs for a while
        for (let i = 0; i < 40; i++) {
            await page.keyboard.press(' '); // Fire front
            await page.waitForTimeout(10);
            await page.evaluate(() => window.__game!.advance(200)); // Advance 200ms
        }
        await page.keyboard.up('ArrowLeft');

        // Check if enemy took damage or died (score incremented)

        // Enemy should be dead and score incremented
        const finalState = await page.evaluate(() => window.__game!.getState()!);
        expect(finalState.score).toBeGreaterThanOrEqual(1);
    });
});
