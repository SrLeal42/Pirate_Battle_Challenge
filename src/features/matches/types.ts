export interface MatchRecord {
    id: string;
    playerId: string;
    playerName: string;
    createdAt: string; // ISO timestamp
    score: number;
    durationMs: number;
    endReason: 'time_up' | 'player_died';
    configKey: string; // ex: "120-3" (sessionTime-spawnInterval)
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
}
