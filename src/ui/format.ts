import type { EndReason } from '../features/matches/types';

export const END_REASON_LABEL: Readonly<Record<EndReason, string>> = {
    time_up: 'Time is up',
    player_died: 'Ship destroyed',
};

/** Formats milliseconds as m:ss (rounded to the nearest second). */
export const formatDuration = (ms: number): string => {
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
