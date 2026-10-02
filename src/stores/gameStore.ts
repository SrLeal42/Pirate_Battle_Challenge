import { create } from 'zustand';

export type RuntimeState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export interface GameStoreState {
    runtimeState: RuntimeState;
    score: number;
    timeRemaining: number;  // ms
    playerHealth: number;
    endReason: 'time_up' | 'player_died' | null;
    loadProgress: number;
    errorMessage: string | null;
}

export const useGameStore = create<GameStoreState>(() => ({
    runtimeState: 'idle',
    score: 0,
    timeRemaining: 0,
    playerHealth: 100,
    endReason: null,
    loadProgress: 0,
    errorMessage: null,
}));
