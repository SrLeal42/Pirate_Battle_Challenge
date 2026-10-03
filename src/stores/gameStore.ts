import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import { STORAGE_KEYS, GAME_CONFIG, SESSION_STEPS, SPAWN_STEPS } from '../core/config';

import { lastResultStorage } from '../features/matches/storage';
import type { MatchRecord } from '../features/matches/types';

export const RuntimeStateEnum = {
    Idle: 'idle',
    Loading: 'loading',
    Ready: 'ready',
    Playing: 'playing',
    Paused: 'paused',
    Ended: 'ended',
    Error: 'error'
} as const;

export type RuntimeState = typeof RuntimeStateEnum[keyof typeof RuntimeStateEnum];

export interface GameStoreState {
    runtimeState: RuntimeState;
    playerId: string;
    username: string;
    sessionTime: number;
    spawnInterval: number;
    score: number;
    timeRemaining: number;  // ms
    playerHealth: number;
    endReason: 'time_up' | 'player_died' | null;
    loadProgress: number;
    errorMessage: string | null;
    lastMatch: MatchRecord | null;
}

let localPlayerId = localStorage.getItem(STORAGE_KEYS.playerId);
if (!localPlayerId) {
    localPlayerId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.playerId, localPlayerId);
}

/** Reads a persisted option, accepting only values exposed by the Options screen. */
function readOption(key: string, allowed: readonly number[], fallback: number): number {
    const value = Number(localStorage.getItem(key));
    return allowed.includes(value) ? value : fallback;
}

export const useGameStore = create<GameStoreState>(() => ({
    runtimeState: RuntimeStateEnum.Idle,
    playerId: localPlayerId as string,
    username: '',
    sessionTime: readOption(STORAGE_KEYS.sessionTime, SESSION_STEPS, GAME_CONFIG.defaultSessionTime),
    spawnInterval: readOption(STORAGE_KEYS.spawnInterval, SPAWN_STEPS, GAME_CONFIG.defaultSpawnInterval),
    score: 0,
    timeRemaining: 0,
    playerHealth: 100,
    endReason: null,
    loadProgress: 0,
    errorMessage: null,
    lastMatch: lastResultStorage.load(),
}));
