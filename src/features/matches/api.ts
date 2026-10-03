import axios from 'axios';
import type { MatchRecord, PaginatedResponse } from './types';

export const api = axios.create({
    baseURL: '/api',
    timeout: 5000,
});

export async function submitMatch(record: MatchRecord, signal?: AbortSignal): Promise<MatchRecord> {
    const response = await api.post<MatchRecord>('/matches', record, { signal });
    return response.data;
}

export async function fetchHistory(playerId: string, page: number, pageSize: number = 10, signal?: AbortSignal): Promise<PaginatedResponse<MatchRecord>> {
    const response = await api.get<PaginatedResponse<MatchRecord>>('/matches/history', {
        params: { playerId, page, pageSize },
        signal,
    });
    return response.data;
}

export async function fetchLeaderboard(configKey: string, page: number, pageSize: number = 10, signal?: AbortSignal): Promise<PaginatedResponse<MatchRecord>> {
    const response = await api.get<PaginatedResponse<MatchRecord>>('/leaderboard', {
        params: { configKey, page, pageSize },
        signal,
    });
    return response.data;
}
