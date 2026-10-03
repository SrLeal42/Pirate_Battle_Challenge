import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../stores/gameStore';
import { useSubmitMatch } from '../../features/matches/hooks';
import type { MatchRecord } from '../../features/matches/types';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
    onRestart: () => void;
    onQuit: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onQuit }) => {
    const score = useGameStore(s => s.score);
    const endReason = useGameStore(s => s.endReason);

    const { mutate, status } = useSubmitMatch();

    const recordRef = useRef<MatchRecord | null>(null);

    useEffect(() => {
        if (!recordRef.current) {
            const state = useGameStore.getState();

            const configKey = `${state.sessionTime}-${state.spawnInterval}`;
            const durationMs = (state.sessionTime * 1000) - state.timeRemaining;

            const record: MatchRecord = {
                id: uuidv4(),
                playerId: state.playerId,
                playerName: state.username || 'Player',
                createdAt: new Date().toISOString(),
                score: state.score,
                durationMs: durationMs,
                endReason: state.endReason || 'player_died',
                configKey: configKey
            };

            recordRef.current = record;

            mutate(record);
        }
    }, [mutate]);

    const isVictory = endReason === 'time_up';
    const title = isVictory ? 'Victory!' : 'Game Over';
    const subtitle = isVictory ? 'You survived the challenge!' : 'Your ship was destroyed!';
    const scoreClass = isVictory ? styles.scoreVictory : styles.scoreDefeat;

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <h1 className={styles.title}>{title}</h1>
                <span className={styles.subtitle}>{subtitle}</span>

                <div className={styles.scoreWrapper}>
                    <span className={styles.scoreLabel}>Final Score</span>
                    <span className={`${styles.scoreValue} ${scoreClass}`}>
                        {score}
                    </span>
                </div>

                <div className={styles.statusMessage}>
                    {status === 'pending' && 'Saving your score...'}
                    {status === 'success' && 'Score saved to Leaderboard!'}
                    {status === 'error' && 'Failed to save score (Will retry later).'}
                </div>

                <div className={styles.buttonGroup}>
                    <button className={styles.button} onClick={onRestart}>
                        Play Again
                    </button>
                    <button className={styles.secondaryButton} onClick={onQuit}>
                        Main Menu
                    </button>
                </div>

            </div>
        </div>
    );

};
