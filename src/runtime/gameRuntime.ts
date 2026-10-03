import { Application } from 'pixi.js';

import { Simulation } from '../core/simulation';
import { GAME_CONFIG } from '../core/config';
import { createDefaultArena, type ArenaMap } from '../core/arena';
import type { GameConfig, GameEvent, GameState } from '../core/types';

import { GameRenderer } from '../render/gameRenderer';
import { loadGameAssets } from '../render/assets';

import { InputHandler } from '../input/inputHandler';

import { useGameStore, RuntimeStateEnum, type RuntimeState } from '../stores/gameStore';

import type { MatchResult } from '../features/matches/types';

import { getTestConfig, type GameTestApi, type TestConfig } from '../testing/testHooks';


interface MatchSettings {
    sessionTime: number;
    spawnInterval: number;
}


const STEP_MS = 1000 / 60; // Fixed 60Hz
const MAX_DELTA = 100;      // Clamp to prevent spiral of death
const MAX_STEPS_PER_FRAME = Math.round(MAX_DELTA / STEP_MS);

export class GameRuntime {
    private app: Application | null = null;
    private simulation: Simulation | null = null;
    private renderer: GameRenderer | null = null;
    private input: InputHandler;
    private arenaMap: ArenaMap;

    private accumulator = 0;
    private destroyed = false;
    private initPromise: Promise<void> | null = null;
    private disposables: (() => void)[] = [];

    private container: HTMLElement;

    /** Fired once when a match finishes (not on quit/abandon). */
    public onMatchEnd: ((result: MatchResult) => void) | null = null;
    private settings: MatchSettings | null = null;

    // Test instrumentation (inactive in normal sessions)
    private readonly testConfig: TestConfig | null = getTestConfig();
    private eventLog: GameEvent[] = [];


    constructor(container: HTMLElement) {
        this.container = container;
        this.arenaMap = createDefaultArena();
        this.input = new InputHandler();

        // Conecta o evento discreto do InputHandler com o Runtime
        this.input.onPauseToggle = () => {
            const state = useGameStore.getState().runtimeState;
            if (state === 'playing') this.pause();
            else if (state === 'paused') this.resume();
        };

        this.disposables.push(() => this.input.destroy());

        if (this.testConfig) this.exposeTestApi();
    }

    // --- Init ---

    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        const attempt = this._init();
        this.initPromise = attempt;

        await attempt;

        // _init handles errors in-state; release the lock so retry() can run again
        if (this.initPromise === attempt && useGameStore.getState().runtimeState === RuntimeStateEnum.Error) {
            this.initPromise = null;
        }
    }

    private async _init(): Promise<void> {

        this.setState(RuntimeStateEnum.Loading);
        useGameStore.setState({ loadProgress: 0, errorMessage: null });

        try {

            if (!this.app) await this.createApp();

            if (this.destroyed) return;

            await loadGameAssets((progress) => {
                if (!this.destroyed) useGameStore.setState({ loadProgress: progress });
            });

            if (this.destroyed) return;

            this.setState(RuntimeStateEnum.Ready);
        } catch (err) {
            this.initPromise = null; // allow retry()
            if (this.destroyed) return;
            useGameStore.setState({
                runtimeState: RuntimeStateEnum.Error,
                errorMessage: err instanceof Error ? err.message : 'Failed to load game assets',
            });
        }
    }

    /** Re-runs initialization after a failure, reusing the Pixi app when it exists. */
    retry(): Promise<void> {
        if (useGameStore.getState().runtimeState !== RuntimeStateEnum.Error) return Promise.resolve();
        return this.init();
    }

    private async createApp(): Promise<void> {
        const app = new Application();
        await app.init({
            width: GAME_CONFIG.arenaWidth,
            height: GAME_CONFIG.arenaHeight,
            backgroundAlpha: 0,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio, 2),
            autoDensity: true,
        });
        // Strict Mode: destroyed during async init
        if (this.destroyed) {
            app.destroy(true);
            return;
        }
        this.app = app;
        this.container.appendChild(app.canvas);
        this.disposables.push(() => {
            app.canvas.parentElement?.removeChild(app.canvas);
            app.destroy(true);
        });
        this.setupResize();
        this.setupPauseListeners();
    }

    // --- Game lifecycle ---

    start(sessionTimeSec?: number, spawnIntervalSec?: number): void {
        if (!this.app || this.destroyed) return;

        const sessionTime = sessionTimeSec ?? GAME_CONFIG.defaultSessionTime;
        const spawnInterval = spawnIntervalSec ?? GAME_CONFIG.defaultSpawnInterval;
        this.settings = { sessionTime, spawnInterval }; // snapshot reused by restart()

        const config: GameConfig = this.testConfig?.config
            ? { ...GAME_CONFIG, ...this.testConfig.config }
            : GAME_CONFIG;

        this.simulation = new Simulation(
            config,
            this.arenaMap.arenaDef,
            this.testConfig?.seed ?? Date.now(),
            sessionTime,
            spawnInterval,
        );
        this.eventLog = [];

        if (this.renderer) this.renderer.destroy();
        this.renderer = new GameRenderer(this.app, this.arenaMap);

        this.accumulator = 0;
        this.input.reset();
        this.input.enable();

        this.app.ticker.add(this.gameLoop);

        this.setState(RuntimeStateEnum.Playing);
        useGameStore.setState({
            score: 0,
            timeRemaining: sessionTime * 1000,
            playerHealth: GAME_CONFIG.playerMaxHealth,
            endReason: null,
        });
    }

    pause(): void {
        if (useGameStore.getState().runtimeState !== RuntimeStateEnum.Playing) return;
        this.input.disable();
        this.input.reset();
        this.setState(RuntimeStateEnum.Paused);
    }

    resume(): void {
        if (useGameStore.getState().runtimeState !== RuntimeStateEnum.Paused) return;
        this.accumulator = 0;
        this.input.reset();
        this.input.enable();
        this.setState(RuntimeStateEnum.Playing);
    }

    restart(): void {
        if (!this.settings) return;
        const { sessionTime, spawnInterval } = this.settings;

        this.app?.ticker.remove(this.gameLoop);
        this.renderer?.destroy();
        this.renderer = null;
        this.simulation = null;
        this.start(sessionTime, spawnInterval);
    }

    quitToMenu(): void {

        this.app?.ticker.remove(this.gameLoop);

        this.input.disable();
        this.input.reset();

        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        this.simulation = null;

        this.setState(RuntimeStateEnum.Ready);
    }

    // --- Game loop (fixed timestep) ---

    private gameLoop = (): void => {
        if (!this.simulation || !this.renderer || !this.app) return;
        if (useGameStore.getState().runtimeState !== 'playing') return;
        if (this.testConfig?.manualClock) return; // advanced by the test API only

        this.accumulator += Math.min(this.app.ticker.deltaMS, MAX_DELTA);

        // Fixed step: consume accumulator
        let steps = 0;
        while (this.accumulator >= STEP_MS) {
            steps++;
            this.accumulator -= STEP_MS;
        }

        this.advanceFrame(steps);
    };

    /** Runs `steps` fixed simulation steps, then renders and syncs once (one visual frame). */
    private advanceFrame(steps: number): void {
        if (!this.simulation || !this.renderer) return;

        const input = this.input.getState();
        for (let i = 0; i < steps; i++) this.simulation.step(STEP_MS, input);

        // Process events → effects
        const events = this.simulation.drainEvents();
        if (this.testConfig) this.eventLog.push(...events);
        this.renderer.handleEvents(events);

        // Render current state
        const gameState = this.simulation.getState();
        this.renderer.update(gameState);
        this.renderer.drawDebugOverlay(gameState);

        // Sync to React (throttled)
        this.syncToStore(gameState);

        // Check game over
        if (gameState.isGameOver) this.endMatch(gameState);
    }

    /** Manual clock: same frame pipeline as the ticker, capped like MAX_DELTA per frame. */
    private advanceManually(ms: number): void {
        let remaining = Math.round(ms / STEP_MS);
        while (remaining > 0 && useGameStore.getState().runtimeState === RuntimeStateEnum.Playing) {
            const steps = Math.min(remaining, MAX_STEPS_PER_FRAME);
            this.advanceFrame(steps);
            remaining -= steps;
        }
    }

    // --- Test instrumentation ---

    private exposeTestApi(): void {
        const manualClock = this.testConfig?.manualClock ?? false;

        const api: GameTestApi = {
            manualClock,
            getRuntimeState: () => useGameStore.getState().runtimeState,
            getState: () => this.simulation
                ? {
                    ...structuredClone(this.simulation.getState()),
                    runtimeState: useGameStore.getState().runtimeState,
                    settings: this.settings ? { ...this.settings } : null,
                }
                : null,
            getEvents: () => structuredClone(this.eventLog),
            advance: (ms) => {
                if (!manualClock) throw new Error('advance() requires manualClock');
                this.advanceManually(ms);
            },
            getRenderStats: () => this.app
                ? {
                    tickerListeners: this.app.ticker.count,
                    stageChildren: this.app.stage.children.length,
                    ...(this.renderer?.getStats() ?? { enemySprites: 0, projectileSprites: 0, healthBars: 0, activeEffects: 0 }),
                }
                : null,
        };

        window.__game = api;
        // Strict Mode: only the runtime that owns the handle may remove it
        this.disposables.push(() => { if (window.__game === api) delete window.__game; });
    }


    private endMatch(state: Readonly<GameState>): void {
        this.input.disable();
        this.app?.ticker.remove(this.gameLoop);

        const endReason = state.endReason ?? 'player_died';
        const timeRemaining = Math.max(0, state.timeRemaining);

        // Final sync: the throttled sync may have skipped the last <100ms
        useGameStore.setState({ score: state.score, timeRemaining, endReason });
        if (this.settings) {
            this.onMatchEnd?.({
                score: state.score,
                durationMs: this.settings.sessionTime * 1000 - timeRemaining,
                endReason,
                ...this.settings,
            });
        }

        // Must run after onMatchEnd so the result screen mounts with the record ready
        this.setState(RuntimeStateEnum.Ended);
    }

    private syncToStore(state: Readonly<GameState>): void {
        const store = useGameStore.getState();
        // Update only when values meaningfully change
        if (store.score !== state.score ||
            Math.abs(store.timeRemaining - state.timeRemaining) > 100 ||
            store.playerHealth !== state.player.health) {
            useGameStore.setState({
                score: state.score,
                timeRemaining: Math.max(0, state.timeRemaining),
                playerHealth: Math.max(0, state.player.health),
            });
        }
    }

    // --- Pause listeners ---

    private setupPauseListeners(): void {
        const onVisChange = () => { if (document.hidden) this.pause(); };
        const onBlur = () => this.pause();

        document.addEventListener('visibilitychange', onVisChange);
        window.addEventListener('blur', onBlur);

        this.disposables.push(() => {
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('blur', onBlur);
        });
    }

    // --- Resize (letterbox) ---

    private setupResize(): void {
        if (!this.app) return;

        const resize = () => {
            if (!this.app || !this.container) return;
            const { clientWidth: w, clientHeight: h } = this.container;
            const scale = Math.min(w / GAME_CONFIG.arenaWidth, h / GAME_CONFIG.arenaHeight);
            this.app.canvas.style.width = `${GAME_CONFIG.arenaWidth * scale}px`;
            this.app.canvas.style.height = `${GAME_CONFIG.arenaHeight * scale}px`;
        };

        const observer = new ResizeObserver(resize);
        observer.observe(this.container);
        resize();

        this.disposables.push(() => observer.disconnect());
    }

    // --- State ---

    private setState(state: RuntimeState): void {
        useGameStore.setState({ runtimeState: state });
    }

    // --- Destroy (idempotent, safe during init) ---

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        this.input.disable();
        this.app?.ticker.remove(this.gameLoop);
        this.renderer?.destroy();

        // Run disposables in reverse
        for (let i = this.disposables.length - 1; i >= 0; i--) {
            this.disposables[i]();
        }
        this.disposables = [];

        this.simulation = null;
        this.renderer = null;
        this.app = null;
        this.setState(RuntimeStateEnum.Idle);
    }
}
