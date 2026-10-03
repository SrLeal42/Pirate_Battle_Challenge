import { useEffect, useSyncExternalStore } from 'react';
import { useQuery, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { submitMatch, fetchHistory, fetchLeaderboard, isRetryableError, describeApiError } from './api';
import { pendingQueue, type PendingMatch } from './storage';
import { API_CONFIG } from '../../core/config';

import type { MatchRecord } from './types';

export const SUBMIT_MATCH_KEY = ['submitMatch'] as const;

const inFlight = new Set<string>();

export function useLeaderboard(configKey: string, page: number) {
    return useQuery({
        queryKey: ['leaderboard', configKey, page],
        queryFn: ({ signal }) => fetchLeaderboard(configKey, page, 10, signal),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });
}

export function useMatchHistory(playerId: string, page: number) {
    return useQuery({
        queryKey: ['history', playerId, page],
        queryFn: ({ signal }) => fetchHistory(playerId, page, 10, signal),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });
}

export function useSubmitMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: SUBMIT_MATCH_KEY,
        scope: { id: 'submitMatch' }, // serialize submissions
        mutationFn: (record: MatchRecord) => submitMatch(record),
        retry: (failureCount, error) => failureCount < API_CONFIG.submitRetries && isRetryableError(error),
        retryDelay: (attempt) => Math.min(API_CONFIG.retryBaseDelayMs * 2 ** attempt, API_CONFIG.retryMaxDelayMs),
        onSuccess: (_saved, record) => {
            pendingQueue.remove(record.id);
            void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            void queryClient.invalidateQueries({ queryKey: ['history'] });
        },
        onError: (error, record) => pendingQueue.markFailed(record.id, describeApiError(error)),
    });

}

export function usePendingMatches(): readonly PendingMatch[] {
    return useSyncExternalStore(pendingQueue.subscribe, pendingQueue.getSnapshot);
}


/** Mount once at app root. Flushes the queue on boot, on 'online' and on demand. */
export function usePendingSync(): void {
    const { mutateAsync } = useSubmitMatch();
    useEffect(() => {
        let disposed = false;
        const flush = async () => {
            for (const { record } of pendingQueue.getSnapshot()) {
                if (disposed) return;
                if (inFlight.has(record.id)) continue;
                inFlight.add(record.id);
                try {
                    await mutateAsync(record);
                } catch {
                    /* Already recorded by onError */
                } finally {
                    inFlight.delete(record.id);
                }
            }
        };
        const run = () => { void flush(); };
        const unsubscribe = pendingQueue.onSyncRequested(run);
        window.addEventListener('online', run);
        run(); // recover records left pending before a refresh
        return () => {
            disposed = true;
            unsubscribe();
            window.removeEventListener('online', run);
        };
    }, [mutateAsync]);
}

export type MatchSyncStatus =
    | { kind: 'idle' }
    | { kind: 'saving'; retry: number }
    | { kind: 'saved' }
    | { kind: 'pending'; attempts: number; lastError: string | null };

export function useMatchSyncStatus(matchId: string | null): MatchSyncStatus {
    const queue = usePendingMatches();

    const active = useMutationState({
        filters: {
            mutationKey: SUBMIT_MATCH_KEY,
            status: 'pending',
            predicate: (m) => (m.state.variables as MatchRecord | undefined)?.id === matchId,
        },
        select: (m) => m.state.failureCount,
    });

    if (!matchId) return { kind: 'idle' };

    const entry = queue.find((p) => p.record.id === matchId);
    if (!entry) return { kind: 'saved' };

    if (active.length > 0) return { kind: 'saving', retry: active[0] };

    if (entry.attempts === 0) return { kind: 'saving', retry: 0 };

    return { kind: 'pending', attempts: entry.attempts, lastError: entry.lastError };

}
