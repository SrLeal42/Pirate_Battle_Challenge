import { http, HttpResponse, delay } from 'msw';
import { db } from './db';
import type { MatchRecord } from '../features/matches/types';

export const handlers = [
    // POST /api/matches
    http.post('/api/matches', async ({ request }) => {
        const record = await request.json() as MatchRecord;

        await delay(500); // Simulating latency

        const saved = db.addMatch(record);
        return HttpResponse.json(saved, { status: 201 });
    }),

    // GET /api/matches/history
    http.get('/api/matches/history', async ({ request }) => {
        const url = new URL(request.url);
        const playerId = url.searchParams.get('playerId');
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

        await delay(500);

        if (!playerId) {
            return new HttpResponse(null, { status: 400 });
        }

        const response = db.getHistory(playerId, page, pageSize);
        return HttpResponse.json(response);
    }),

    // GET /api/leaderboard
    http.get('/api/leaderboard', async ({ request }) => {
        const url = new URL(request.url);
        const configKey = url.searchParams.get('configKey');
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

        await delay(500);

        if (!configKey) {
            return new HttpResponse(null, { status: 400 });
        }

        const response = db.getLeaderboard(configKey, page, pageSize);
        return HttpResponse.json(response);
    }),

];
