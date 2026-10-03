import type { MatchRecord, PaginatedResponse } from '../features/matches/types';
import { RNG } from '../core/rng';
import { STORAGE_KEYS } from '../core/config';

const FIXTURE_EPOCH = Date.UTC(2026, 0, 1); // fixed for reproducible fixtures

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) || 1;
}

function getDb(): MatchRecord[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.mockDb);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveDb(records: MatchRecord[]) {
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(records));
}

function getFixtures(configKey: string): MatchRecord[] {
    let seed = 0;
    for (let i = 0; i < configKey.length; i++) {
        seed = (seed << 5) - seed + configKey.charCodeAt(i);
        seed |= 0;
    }

    const rng = new RNG(Math.abs(seed) || 1);
    const fixtures: MatchRecord[] = [];

    const firstNames = ["Blackbeard", "Calico", "Anne", "Mary", "Jack", "William", "Charles"];
    const lastNames = ["Teach", "Jack", "Bonny", "Read", "Sparrow", "Kidd", "Vane"];

    const [timeStr, spawnStr] = configKey.split('-');
    const maxTime = parseInt(timeStr) || 120;
    const spawnInt = parseInt(spawnStr) || 3;
    const maxScore = Math.floor(maxTime / spawnInt) + 10;

    for (let i = 0; i < 45; i++) {
        const fName = firstNames[Math.floor(rng.random() * firstNames.length)];
        const lName = lastNames[Math.floor(rng.random() * lastNames.length)];

        fixtures.push({
            id: `fixture-${i}`,
            playerId: `npc-${i}`,
            playerName: `${fName} ${lName}`,
            createdAt: new Date(FIXTURE_EPOCH - rng.random() * 10_000_000_000).toISOString(),
            score: Math.floor(rng.random() * maxScore),
            durationMs: Math.floor(rng.random() * maxTime * 1000),
            endReason: rng.random() > 0.5 ? 'time_up' : 'player_died',
            configKey: configKey
        });
    }

    return fixtures;
}

function getHistoryFixtures(playerId: string, count: number): MatchRecord[] {
    if (count <= 0) return [];

    const rng = new RNG(hashString(playerId));

    return Array.from({ length: count }, (_, i): MatchRecord => ({
        id: `history-fixture-${i}`,
        playerId,
        playerName: 'Captain',
        createdAt: new Date(FIXTURE_EPOCH - i * 3_600_000).toISOString(),
        score: rng.rangeInt(0, 40),
        durationMs: rng.rangeInt(20, 180) * 1000,
        endReason: rng.random() > 0.5 ? 'time_up' : 'player_died',
        configKey: '120-3',
    }));

}


export const db = {
    /** Idempotent by id: resubmissions return the stored record. */
    addMatch: (record: MatchRecord): { record: MatchRecord; created: boolean } => {
        const records = getDb();
        const existing = records.find((r) => r.id === record.id);
        if (existing) return { record: existing, created: false };
        records.push(record);
        saveDb(records);
        return { record, created: true };
    },

    getHistory: (playerId: string, page: number, pageSize: number, extraFixtures = 0): PaginatedResponse<MatchRecord> => {
        const records = [...getDb().filter((r) => r.playerId === playerId), ...getHistoryFixtures(playerId, extraFixtures)]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const total = records.length;
        const data = records.slice((page - 1) * pageSize, page * pageSize);

        return { data, page, pageSize, total };
    },

    getLeaderboard: (configKey: string, page: number, pageSize: number): PaginatedResponse<MatchRecord> => {
        const local = getDb().filter(r => r.configKey === configKey);
        const fixtures = getFixtures(configKey);

        const combined = [...local, ...fixtures];

        combined.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.durationMs !== a.durationMs) return b.durationMs - a.durationMs;
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            if (timeA !== timeB) return timeA - timeB;
            return a.id.localeCompare(b.id);
        });

        const total = combined.length;
        const data = combined.slice((page - 1) * pageSize, page * pageSize);

        return { data, page, pageSize, total };
    },

    reset: () => {
        localStorage.removeItem(STORAGE_KEYS.mockDb);
    }

};
