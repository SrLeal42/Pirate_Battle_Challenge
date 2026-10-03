import axios from 'axios';
import { API_CONFIG } from '../../core/config';
import type { MatchRecord, PaginatedResponse } from './types';

export const api = axios.create({
    baseURL: '/api',
    timeout: API_CONFIG.timeoutMs,
});

export async function submitMatch(record: MatchRecord, signal?: AbortSignal): Promise<MatchRecord> {
    const response = await api.post<MatchRecord>('/matches', record, {
        signal,
        headers: { 'Idempotency-Key': record.id },
    });
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

/** Timeouts, network failures, 5xx, 408 and 429 are worth retrying. */
export function isRetryableError(error: unknown): boolean {
    if (!axios.isAxiosError(error) || error.code === 'ERR_CANCELED') return false;

    if (!error.response) return true;

    const { status } = error.response;

    return status >= 500 || status === 408 || status === 429;
}

export function describeApiError(error: unknown): string {
    if (!axios.isAxiosError(error)) return 'Unexpected error';

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Request timed out';

    if (!error.response) return 'Network unavailable';

    return `Server responded with ${error.response.status}`;
}
