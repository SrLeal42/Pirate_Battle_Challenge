import { API_CONFIG } from '../core/config';

export type Endpoint = 'submit' | 'history' | 'leaderboard';
export type Latency = number | { min: number; max: number } | 'out-of-order';

export type ConcreteBehavior =
    | { kind: 'ok'; latency?: Latency }
    | { kind: 'empty'; latency?: Latency }
    | { kind: 'status'; status: number; latency?: Latency }
    | { kind: 'network-error' }
    | { kind: 'timeout' }
    | { kind: 'save-then-timeout' };

export type Behavior =
    | ConcreteBehavior
    | { kind: 'fail-first'; count: number; failure: ConcreteBehavior; then: ConcreteBehavior };

export interface ScenarioDef {
    label: string;
    description: string;
    behaviors: Partial<Record<Endpoint, Behavior>>;
    historyFixtures?: number;
}

const all = (b: Behavior) => ({ submit: b, history: b, leaderboard: b });
const reads = (b: Behavior) => ({ history: b, leaderboard: b });

const SCENARIO_DEFS = {
    success: { label: 'Success', description: 'Default behavior with short latency.', behaviors: {} },
    empty: { label: 'Empty lists', description: 'Ranking and history return no records.', behaviors: reads({ kind: 'empty' }) },
    'many-pages': { label: 'Many pages', description: 'Seeds 35 history records for the current player.', behaviors: {}, historyFixtures: 35 },
    slow: { label: 'Slow network', description: 'Every request takes 3 seconds.', behaviors: all({ kind: 'ok', latency: 3000 }) },
    'variable-latency': { label: 'Variable latency', description: 'Seeded latency between 150ms and 2.5s.', behaviors: all({ kind: 'ok', latency: { min: 150, max: 2500 } }) },
    'out-of-order': { label: 'Out-of-order responses', description: 'Alternates slow/fast reads so older responses arrive last.', behaviors: reads({ kind: 'ok', latency: 'out-of-order' }) },
    timeout: { label: 'Timeout', description: 'Every request exceeds the client timeout.', behaviors: all({ kind: 'timeout' }) },
    'network-error': { label: 'Connection failure', description: 'Every request fails at network level.', behaviors: all({ kind: 'network-error' }) },
    'server-error': { label: 'HTTP 500', description: 'Every request returns 500.', behaviors: all({ kind: 'status', status: 500 }) },
    'client-error': { label: 'HTTP 400', description: 'Every request returns 400 (not retried).', behaviors: all({ kind: 'status', status: 400 }) },
    'leaderboard-error': { label: 'Ranking failure', description: 'Only the ranking query fails (503).', behaviors: { leaderboard: { kind: 'status', status: 503 } } },
    'history-error': { label: 'History failure', description: 'Only the history query fails (503).', behaviors: { history: { kind: 'status', status: 503 } } },
    'submit-timeout-after-save': {
        label: 'Timeout after save',
        description: 'First submit is stored but times out; the retry recovers it without duplicates.',
        behaviors: { submit: { kind: 'fail-first', count: 1, failure: { kind: 'save-then-timeout' }, then: { kind: 'ok' } } },
    },
    'submit-unavailable': {
        label: 'Unavailable on match end',
        description: 'Submit fails for one full retry cycle, then recovers. Use Retry or refresh.',
        behaviors: {
            submit: { kind: 'fail-first', count: API_CONFIG.submitRetries + 1, failure: { kind: 'status', status: 503 }, then: { kind: 'ok' } },
        },
    },
} satisfies Record<string, ScenarioDef>;

export type ScenarioId = keyof typeof SCENARIO_DEFS;
export const SCENARIOS: Readonly<Record<ScenarioId, ScenarioDef>> = SCENARIO_DEFS;
export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];
export const DEFAULT_SCENARIO: ScenarioId = 'success';

export const isScenarioId = (value: unknown): value is ScenarioId =>
    typeof value === 'string' && Object.hasOwn(SCENARIOS, value);
