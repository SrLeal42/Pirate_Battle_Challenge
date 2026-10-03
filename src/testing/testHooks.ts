import type { GameConfig, GameEvent, GameState } from '../core/types';
import type { RuntimeState } from '../stores/gameStore';

/**
 * Test instrumentation contract.
 *
 * Inactive unless `window.__PIRATE_TEST__` is defined before the app boots
 * (Playwright injects it with `page.addInitScript`). It only observes state and
 * controls the clock: inputs, rules, collisions and rendering run unchanged.
 */
export interface TestConfig {
    /** Fixed simulation seed (default: Date.now()). */
    seed?: number;
    /** When true the ticker no longer advances the simulation; use `__game.advance(ms)`. */
    manualClock?: boolean;
    /** Simulation-only balancing overrides (e.g. spawn weights, max alive enemies). */
    config?: Partial<GameConfig>;
}

export interface MatchSettingsSnapshot {
    sessionTime: number;
    spawnInterval: number;
}

export interface GameSnapshot extends GameState {
    runtimeState: RuntimeState;
    settings: MatchSettingsSnapshot | null;
}

export interface RenderStats {
    tickerListeners: number;
    stageChildren: number;
    enemySprites: number;
    projectileSprites: number;
    healthBars: number;
    activeEffects: number;
}

export interface GameTestApi {
    readonly manualClock: boolean;
    getRuntimeState(): RuntimeState;
    /** Deep copy of the simulation state, or null when no match exists. */
    getState(): GameSnapshot | null;
    /** Every simulation event since the current match started. */
    getEvents(): GameEvent[];
    /** Advances the simulation by `ms` of game time (manual clock only). */
    advance(ms: number): void;
    getRenderStats(): RenderStats | null;
}

declare global {
    interface Window {
        __PIRATE_TEST__?: TestConfig;
        __game?: GameTestApi;
    }
}

export function getTestConfig(): TestConfig | null {
    return typeof window !== 'undefined' ? window.__PIRATE_TEST__ ?? null : null;
}
