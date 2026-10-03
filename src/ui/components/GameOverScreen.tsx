import React from 'react';

import { useGameStore } from '../../stores/gameStore';
import { useMatchSyncStatus, type MatchSyncStatus } from '../../features/matches/hooks';
import { pendingQueue } from '../../features/matches/storage';
import { API_CONFIG } from '../../core/config';

import { useDialog } from '../hooks/useDialog';
import { END_REASON_LABEL, formatDuration } from '../format';

import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
    onRestart: () => void;
    onQuit: () => void;
}

function syncMessage(status: MatchSyncStatus): string {
    switch (status.kind) {
        case 'saving':
            return status.retry > 0
                ? `Saving your score... (retry ${status.retry}/${API_CONFIG.submitRetries})`
                : 'Saving your score...';
        case 'saved':
            return 'Score saved to Leaderboard!';
        case 'pending':
            return `Couldn't save your score (${status.lastError ?? 'unknown error'}). It's stored locally and will be sent automatically.`;
        case 'idle':
            return '';
    }
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onQuit }) => {
    const lastMatch = useGameStore((s) => s.lastMatch);
    const sync = useMatchSyncStatus(lastMatch?.id ?? null);

    const dialogRef = useDialog(true);

    if (!lastMatch) return null;

    const isVictory = lastMatch.endReason === 'time_up';
    const title = isVictory ? 'Victory!' : 'Game Over';
    const subtitle = isVictory ? 'You survived the challenge!' : 'Your ship was destroyed!';
    const scoreClass = isVictory ? styles.scoreVictory : styles.scoreDefeat;

    return (
        <div className={styles.overlay}>
            <div
                className={`${styles.card} responsive-card`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="gameover-title"
                ref={dialogRef}
                tabIndex={-1}
            >
                <h1 id="gameover-title" className={styles.title}>{title}</h1>
                <span className={styles.subtitle}>{subtitle}</span>

                <div className={styles.scoreWrapper}>
                    <span className={styles.scoreLabel}>Final Score</span>
                    <span className={`${styles.scoreValue} ${scoreClass}`}>{lastMatch.score}</span>
                </div>

                <dl className={styles.details}>
                    <dt>Time played</dt>
                    <dd>{formatDuration(lastMatch.durationMs)}</dd>
                    <dt>Reason</dt>
                    <dd>{END_REASON_LABEL[lastMatch.endReason]}</dd>
                </dl>

                <div className={styles.statusMessage} role="status" aria-live="polite">
                    {syncMessage(sync)}
                </div>

                <div className={styles.buttonGroup}>
                    <button className={styles.button} onClick={onRestart}>Play Again</button>
                    {sync.kind === 'pending' && (
                        <button className={styles.secondaryButton} onClick={pendingQueue.requestSync}>
                            Retry Save
                        </button>
                    )}
                    <button className={styles.secondaryButton} onClick={onQuit}>Main Menu</button>
                </div>

            </div>
        </div>
    );

};
