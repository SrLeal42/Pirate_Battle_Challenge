import { create } from 'zustand';

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
    username: string;
    sessionTime: number;
    spawnInterval: number;
    score: number;
    timeRemaining: number;  // ms
    playerHealth: number;
    endReason: 'time_up' | 'player_died' | null;
    loadProgress: number;
    errorMessage: string | null;
}

export const useGameStore = create<GameStoreState>(() => ({
    runtimeState: 'idle',
    username: '',
    sessionTime: parseInt(localStorage.getItem('sessionTime') || '120', 10),
    spawnInterval: parseInt(localStorage.getItem('spawnInterval') || '3', 10),
    score: 0,
    timeRemaining: 0,
    playerHealth: 100,
    endReason: null,
    loadProgress: 0,
    errorMessage: null,
}));
