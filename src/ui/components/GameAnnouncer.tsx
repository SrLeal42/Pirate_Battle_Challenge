import React, { useEffect, useState } from 'react';
import { useGameStore, RuntimeStateEnum, type GameStoreState } from '../../stores/gameStore';
import { GAME_CONFIG } from '../../core/config';
import { HEALTH_TIER_THRESHOLDS } from '../../core/health';

const TIME_MARKS_S = [60, 30, 10] as const;
const END_REASON_TEXT = { time_up: 'Time is up', player_died: 'Your ship was destroyed' } as const;
const LOW_HEALTH = GAME_CONFIG.playerMaxHealth * HEALTH_TIER_THRESHOLDS.low;

function describe(state: GameStoreState, prev: GameStoreState): string | null {
    if (state.runtimeState !== prev.runtimeState) {
        switch (state.runtimeState) {
            case RuntimeStateEnum.Playing:
                return prev.runtimeState === RuntimeStateEnum.Paused
                    ? 'Game resumed.'
                    : `Match started. ${state.sessionTime} seconds on the clock.`;
            case RuntimeStateEnum.Paused:
                return 'Game paused.';
            case RuntimeStateEnum.Ended:
                return `Match over. ${state.endReason ? END_REASON_TEXT[state.endReason] : ''}. Final score: ${state.score}.`;
            default:
                return null;
        }
    }

    if (state.runtimeState !== RuntimeStateEnum.Playing) return null;

    if (state.playerHealth > 0 && state.playerHealth <= LOW_HEALTH && prev.playerHealth > LOW_HEALTH) {
        return `Warning: low health, ${Math.ceil(state.playerHealth)} left.`;
    }

    const mark = TIME_MARKS_S.find((s) => prev.timeRemaining > s * 1000 && state.timeRemaining <= s * 1000);
    return mark ? `${mark} seconds remaining.` : null;
}

/** Polite live region for discrete game events. */
export const GameAnnouncer: React.FC = () => {
    const [announcement, setAnnouncement] = useState({ id: 0, text: '' });

    useEffect(() => useGameStore.subscribe((state, prev) => {
        const text = describe(state, prev);
        if (text) setAnnouncement((a) => ({ id: a.id + 1, text }));
    }), []);

    return (
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {/* New key forces re-announcement of repeated messages */}
            <span key={announcement.id}>{announcement.text}</span>
        </div>
    );
};
