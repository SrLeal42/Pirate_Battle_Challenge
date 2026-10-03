import { RNG } from '../core/rng';
import { STORAGE_KEYS } from '../core/config';
import { db } from './db';
import { pendingQueue, lastResultStorage } from '../features/matches/storage';
import {
    SCENARIOS, DEFAULT_SCENARIO, isScenarioId,
    type Behavior, type ConcreteBehavior, type Endpoint, type Latency, type ScenarioId,
} from './scenarios';

export interface MockSettings {
    scenario: ScenarioId;
    seed: number;
    latencyOverride: number | null; // forces fixed latency (tests)
}

const DEFAULT_SETTINGS: MockSettings = { scenario: DEFAULT_SCENARIO, seed: 1, latencyOverride: null };
const DEFAULT_LATENCY_MS = 400;
const OUT_OF_ORDER_MS = { slow: 2500, fast: 150 } as const;
const EMPTY_COUNTERS: Record<Endpoint, number> = { submit: 0, history: 0, leaderboard: 0 };

function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch {
        return { ...fallback };
    }
}

let settings = load(STORAGE_KEYS.mockSettings, DEFAULT_SETTINGS);
if (!isScenarioId(settings.scenario)) settings = { ...DEFAULT_SETTINGS };

// Persisted so "fail-first" scenarios survive a refresh
let counters = load(STORAGE_KEYS.mockCounters, EMPTY_COUNTERS);
let rng = new RNG(settings.seed);

function saveSettings(): void {
    localStorage.setItem(STORAGE_KEYS.mockSettings, JSON.stringify(settings));
}

function resetCounters(): void {
    counters = { ...EMPTY_COUNTERS };
    localStorage.removeItem(STORAGE_KEYS.mockCounters);
}

export const getMockSettings = (): Readonly<MockSettings> => settings;

export function setScenario(scenario: ScenarioId): void {
    settings = { ...settings, scenario };
    saveSettings();
    resetCounters();
}

export function setSeed(seed: number): void {
    settings = { ...settings, seed };
    rng = new RNG(seed);
    saveSettings();
}

export function setLatencyOverride(ms: number | null): void {
    settings = { ...settings, latencyOverride: ms };
    saveSettings();
}

/** Restores initial mock state: data, pending queue, scenario and counters. */
export function resetMocks(): void {
    db.reset();
    pendingQueue.clear();
    lastResultStorage.clear();
    localStorage.removeItem(STORAGE_KEYS.mockSettings);
    settings = { ...DEFAULT_SETTINGS };
    rng = new RNG(settings.seed);
    resetCounters();
}

export function resolveBehavior(endpoint: Endpoint): { behavior: ConcreteBehavior; requestIndex: number } {
    const requestIndex = counters[endpoint]++;
    localStorage.setItem(STORAGE_KEYS.mockCounters, JSON.stringify(counters));

    const configured: Behavior = SCENARIOS[settings.scenario].behaviors[endpoint] ?? { kind: 'ok' };
    const behavior = configured.kind === 'fail-first'
        ? (requestIndex < configured.count ? configured.failure : configured.then)
        : configured;

    return { behavior, requestIndex };
}

export function resolveLatency(latency: Latency | undefined, requestIndex: number): number {
    if (settings.latencyOverride !== null) return settings.latencyOverride;
    if (latency === undefined) return DEFAULT_LATENCY_MS;
    if (typeof latency === 'number') return latency;
    if (latency === 'out-of-order') return requestIndex % 2 === 0 ? OUT_OF_ORDER_MS.slow : OUT_OF_ORDER_MS.fast;
    return Math.round(rng.range(latency.min, latency.max));
}

export const getHistoryFixtureCount = (): number => SCENARIOS[settings.scenario].historyFixtures ?? 0;

const URL_PARAMS = ['scenario', 'mockSeed', 'mockLatency', 'resetMocks'] as const;

/** Supports ?scenario=timeout&mockSeed=42&mockLatency=0&resetMocks=1 */
export function applyUrlOverrides(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    if (!URL_PARAMS.some((p) => params.has(p))) return;

    if (params.has('resetMocks')) resetMocks();

    const scenario = params.get('scenario');
    if (isScenarioId(scenario)) setScenario(scenario);

    const seed = Number(params.get('mockSeed'));
    if (params.has('mockSeed') && Number.isInteger(seed)) setSeed(seed);

    const latency = Number(params.get('mockLatency'));
    if (params.has('mockLatency') && Number.isFinite(latency) && latency >= 0) setLatencyOverride(latency);

    // Settings are persisted; clean the URL so a refresh doesn't reset again
    URL_PARAMS.forEach((p) => params.delete(p));
    window.history.replaceState(window.history.state, '', url);
}

declare global {
    interface Window {
        __mocks?: {
            setScenario: typeof setScenario;
            setSeed: typeof setSeed;
            setLatencyOverride: typeof setLatencyOverride;
            reset: typeof resetMocks;
            getSettings: typeof getMockSettings;
        };
    }
}

export function exposeMockControls(): void {
    window.__mocks = { setScenario, setSeed, setLatencyOverride, reset: resetMocks, getSettings: getMockSettings };
}
