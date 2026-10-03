import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import { STORAGE_KEYS, GAME_CONFIG } from '../core/config';

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

export const useGameStore = create<GameStoreState>(() => ({
    runtimeState: RuntimeStateEnum.Idle,
    playerId: localPlayerId as string,
    username: '',
    sessionTime: parseInt(localStorage.getItem(STORAGE_KEYS.sessionTime) || String(GAME_CONFIG.defaultSessionTime), 10),
    spawnInterval: parseInt(localStorage.getItem(STORAGE_KEYS.spawnInterval) || String(GAME_CONFIG.defaultSpawnInterval), 10),
    score: 0,
    timeRemaining: 0,
    playerHealth: 100,
    endReason: null,
    loadProgress: 0,
    errorMessage: null,
    lastMatch: lastResultStorage.load(),
}));
