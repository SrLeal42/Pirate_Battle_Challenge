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


export type EndReason = MatchRecord['endReason'];

/** Raw outcome emitted by the runtime; converted into a MatchRecord. */
export interface MatchResult {
    score: number;
    durationMs: number;
    endReason: EndReason;
    sessionTime: number;
    spawnInterval: number;
}
