import { test, expect } from '@playwright/test';
import type { GameTestApi } from '../src/testing/testHooks';

test.describe('3. Início de partida, movimento, rotação, limites da arena e colisão com ilhas', () => {

    test.beforeEach(async ({ page }) => {
        // We inject test config to take control of the simulation clock.
        // Also remove enemy spawns completely so we can test player movement in peace.
        await page.addInitScript(() => {
            window.__PIRATE_TEST__ = {
                manualClock: true,
                config: {
                    maxAliveEnemies: 0,
                    defaultSessionTime: 300 // long enough
                }
            };
        });
        await page.goto('/');
        await page.getByLabel("Captain's Name").fill('Tester');
        await page.getByRole('button', { name: 'Play' }).click();
        
        // Wait for game to load
        await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
        
        // Wait for player to be spawned
        await page.waitForFunction(() => {
            const state = window.__game?.getState();
            return state && state.player && state.player.id;
        });
    });

    test('should rotate and move forwards', async ({ page }) => {
        const getPlayerState = () => page.evaluate(() => window.__game!.getState()!.player);

        const initial = await getPlayerState();
        
        // Press Left to rotate
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(50); // Give React time to update state
        // Advance clock by 1 second (1000ms)
        await page.evaluate(() => window.__game!.advance(1000));
        await page.keyboard.up('ArrowLeft');

        let current = await getPlayerState();
        // Turning left (negative radians)
        expect(current!.rotation).toBeLessThan(initial!.rotation);

        // Press Up to move forward
        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(50);
        await page.evaluate(() => window.__game!.advance(1000));
        await page.keyboard.up('ArrowUp');

        current = await getPlayerState();
        const dist = Math.hypot(current!.position.x - initial!.position.x, current!.position.y - initial!.position.y);
        expect(dist).toBeGreaterThan(10);
    });

    test('should respect arena boundaries', async ({ page }) => {
        // Advance large amounts of time while holding 'Up' to hit the top border.
        // Initially player faces North (rotation = -PI/2) or similar.
        // Let's force rotation to North (just up)
        await page.evaluate(() => {
            const state = window.__game!.getState()!;
            state.player!.rotation = -Math.PI / 2; // North
        });

        await page.keyboard.down('ArrowUp');
        // Advance 10 seconds, which at 150px/s is 1500px, enough to hit the top boundary 
        // since arena is 1088 height and we spawn in the center.
        await page.evaluate(() => window.__game!.advance(10000));
        await page.keyboard.up('ArrowUp');

        const state = await page.evaluate(() => window.__game!.getState()!);
        
        // Should not exceed top boundary (y > 0)
        // With hitbox height 40, top border is around y = 20
        expect(state.player!.position.y).toBeGreaterThanOrEqual(0);
    });
});
