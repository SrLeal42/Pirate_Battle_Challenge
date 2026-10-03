// src/features/matches/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitMatch, fetchHistory, fetchLeaderboard } from './api';
import type { MatchRecord } from './types';

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
        mutationFn: (record: MatchRecord) => submitMatch(record),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}
