import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../stores/gameStore';
import { pendingQueue, lastResultStorage } from './storage';
import type { MatchRecord, MatchResult } from './types';

export const toConfigKey = (sessionTime: number, spawnInterval: number): string =>
    `${sessionTime}-${spawnInterval}`;

export function buildMatchRecord(result: MatchResult, playerId: string, playerName: string): MatchRecord {
    return {
        id: uuidv4(),
        playerId,
        playerName: playerName.trim() || 'Player',
        createdAt: new Date().toISOString(),
        score: result.score,
        durationMs: Math.max(0, Math.round(result.durationMs)),
        endReason: result.endReason,
        configKey: toConfigKey(result.sessionTime, result.spawnInterval),
    };
}

/** Called once per finished match: persists it and queues it for submission. */
export function completeMatch(result: MatchResult): MatchRecord {
    const { playerId, username } = useGameStore.getState();
    const record = buildMatchRecord(result, playerId, username);

    lastResultStorage.save(record);
    useGameStore.setState({ lastMatch: record });
    pendingQueue.enqueue(record); // triggers background sync

    return record;
}
