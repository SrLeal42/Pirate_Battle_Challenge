import { http, HttpResponse, delay } from 'msw';
import { db } from './db';
import { API_CONFIG } from '../core/config';
import { resolveBehavior, resolveLatency, getHistoryFixtureCount } from './control';
import type { Endpoint } from './scenarios';
import type { MatchRecord, PaginatedResponse } from '../features/matches/types';

const TIMEOUT_DELAY_MS = API_CONFIG.timeoutMs + 1000;

type Mode = 'ok' | 'empty';

async function withScenario(endpoint: Endpoint, produce: (mode: Mode) => Response): Promise<Response> {
    const { behavior, requestIndex } = resolveBehavior(endpoint);

    switch (behavior.kind) {
        case 'ok':
        case 'empty':
            await delay(resolveLatency(behavior.latency, requestIndex));
            return produce(behavior.kind);
        case 'status':
            await delay(resolveLatency(behavior.latency, requestIndex));
            return HttpResponse.json({ message: `Simulated HTTP ${behavior.status}` }, { status: behavior.status });
        case 'network-error':
            await delay(resolveLatency(undefined, requestIndex));
            return HttpResponse.error();
        case 'timeout':
            await delay(TIMEOUT_DELAY_MS);
            return HttpResponse.json({ message: 'Simulated timeout' }, { status: 504 });
        case 'save-then-timeout':
            produce('ok'); // persist first, then answer too late
            await delay(TIMEOUT_DELAY_MS);
            return HttpResponse.json({ message: 'Simulated timeout' }, { status: 504 });
    }
}

function parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const emptyPage = (page: number, pageSize: number): PaginatedResponse<MatchRecord> =>
    ({ data: [], page, pageSize, total: 0 });

function isMatchRecord(value: unknown): value is MatchRecord {
    if (typeof value !== 'object' || value === null) return false;
    const r = value as Record<string, unknown>;
    return typeof r.id === 'string'
        && typeof r.playerId === 'string'
        && typeof r.playerName === 'string'
        && typeof r.createdAt === 'string'
        && typeof r.configKey === 'string'
        && Number.isFinite(r.score)
        && Number.isFinite(r.durationMs)
        && (r.endReason === 'time_up' || r.endReason === 'player_died');
}

export const handlers = [
    http.post('/api/matches', async ({ request }) => {
        const body: unknown = await request.json().catch(() => null);
        if (!isMatchRecord(body)) {
            return HttpResponse.json({ message: 'Invalid match record' }, { status: 400 });
        }

        return withScenario('submit', () => {
            const { record, created } = db.addMatch(body);
            return HttpResponse.json(record, { status: created ? 201 : 200 });
        });
    }),

    http.get('/api/matches/history', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const playerId = params.get('playerId');
        const page = parsePositiveInt(params.get('page'), 1);
        const pageSize = parsePositiveInt(params.get('pageSize'), 10);

        if (!playerId) return HttpResponse.json({ message: 'playerId is required' }, { status: 400 });

        return withScenario('history', (mode) => HttpResponse.json(
            mode === 'empty' ? emptyPage(page, pageSize) : db.getHistory(playerId, page, pageSize, getHistoryFixtureCount()),
        ));
    }),

    http.get('/api/leaderboard', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const configKey = params.get('configKey');
        const page = parsePositiveInt(params.get('page'), 1);
        const pageSize = parsePositiveInt(params.get('pageSize'), 10);

        if (!configKey) return HttpResponse.json({ message: 'configKey is required' }, { status: 400 });

        return withScenario('leaderboard', (mode) => HttpResponse.json(
            mode === 'empty' ? emptyPage(page, pageSize) : db.getLeaderboard(configKey, page, pageSize),
        ));
    }),
];
