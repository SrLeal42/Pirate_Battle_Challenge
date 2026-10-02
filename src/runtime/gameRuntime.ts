import { Application } from 'pixi.js';
import { Simulation } from '../core/simulation';
import { GAME_CONFIG } from '../core/config';
import { createDefaultArena, type ArenaMap } from '../core/arena';
import { GameRenderer } from '../render/gameRenderer';
import { loadGameAssets } from '../render/assets';
import { InputHandler } from '../input/inputHandler';
import { useGameStore, type RuntimeState } from '../stores/gameStore';
import type { GameState } from '../core/types';

const STEP_MS = 1000 / 60; // Fixed 60Hz
const MAX_DELTA = 100;      // Clamp to prevent spiral of death

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
    }

    // --- Init ---

    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this._init();
        return this.initPromise;
    }

    private async _init(): Promise<void> {
        this.setState('loading');

        try {
            const app = new Application();
            await app.init({
                width: GAME_CONFIG.arenaWidth,
                height: GAME_CONFIG.arenaHeight,
                backgroundColor: 0x1a6ea0,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio, 2),
                autoDensity: true,
            });

            // Strict Mode: if destroyed during async init, cleanup and bail
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

            // Load assets with progress
            await loadGameAssets((progress) => {
                useGameStore.setState({ loadProgress: progress });
            });

            if (this.destroyed) return;

            this.setState('ready');
        } catch (err) {
            if (!this.destroyed) {
                this.setState('error');
                useGameStore.setState({
                    errorMessage: err instanceof Error ? err.message : 'Failed to load',
                });
            }
            throw err;
        }
    }

    // --- Game lifecycle ---

    start(sessionTimeSec?: number, spawnIntervalSec?: number): void {
        if (!this.app || this.destroyed) return;

        const sessionTime = sessionTimeSec ?? GAME_CONFIG.defaultSessionTime;
        const spawnInterval = spawnIntervalSec ?? GAME_CONFIG.defaultSpawnInterval;

        this.simulation = new Simulation(
            GAME_CONFIG,
            this.arenaMap.arenaDef,
            Date.now(),
            sessionTime,
            spawnInterval,
        );

        if (this.renderer) this.renderer.destroy();
        this.renderer = new GameRenderer(this.app, this.arenaMap);

        this.accumulator = 0;
        this.input.reset();
        this.input.enable();

        this.app.ticker.add(this.gameLoop);

        this.setState('playing');
        useGameStore.setState({
            score: 0,
            timeRemaining: sessionTime * 1000,
            playerHealth: GAME_CONFIG.playerMaxHealth,
            endReason: null,
        });
    }

    pause(): void {
        if (useGameStore.getState().runtimeState !== 'playing') return;
        this.input.disable();
        this.input.reset();
        this.setState('paused');
    }

    resume(): void {
        if (useGameStore.getState().runtimeState !== 'paused') return;
        this.accumulator = 0;
        this.input.reset();
        this.input.enable();
        this.setState('playing');
    }

    restart(): void {
        this.app?.ticker.remove(this.gameLoop);
        this.renderer?.destroy();
        this.renderer = null;
        this.simulation = null;
        this.start();
    }

    quitToMenu(): void {
        this.app?.ticker.remove(this.gameLoop);
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        this.simulation = null;

        this.setState('ready');
    }

    // --- Game loop (fixed timestep) ---

    private gameLoop = (): void => {
        if (!this.simulation || !this.renderer || !this.app) return;
        if (useGameStore.getState().runtimeState !== 'playing') return;

        const dt = Math.min(this.app.ticker.deltaMS, MAX_DELTA);
        this.accumulator += dt;

        const input = this.input.getState();

        // Fixed step: consume accumulator
        while (this.accumulator >= STEP_MS) {
            this.simulation.step(STEP_MS, input);
            this.accumulator -= STEP_MS;
        }

        // Process events → effects
        const events = this.simulation.drainEvents();
        this.renderer.handleEvents(events);

        // Render current state
        const gameState = this.simulation.getState();
        this.renderer.update(gameState);
        this.renderer.drawDebugOverlay(gameState);

        // Sync to React (throttled)
        this.syncToStore(gameState);

        // Check game over
        if (gameState.isGameOver) {
            this.input.disable();
            this.app.ticker.remove(this.gameLoop);
            this.setState('ended');
            useGameStore.setState({ endReason: gameState.endReason });
        }
    };

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
        this.setState('idle');
    }
}
