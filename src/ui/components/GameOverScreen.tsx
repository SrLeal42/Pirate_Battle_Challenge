import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
    onRestart: () => void;
    onQuit: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onQuit }) => {
    const score = useGameStore(s => s.score);
    const endReason = useGameStore(s => s.endReason);

    const isVictory = endReason === 'time_up';
    const title = isVictory ? 'Victory!' : 'Game Over';
    const subtitle = isVictory ? 'You survived the challenge!' : 'Your ship was destroyed!';
    const scoreColor = isVictory ? '#4ade80' : '#f87171';

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <h1 className={styles.title}>{title}</h1>
                <span className={styles.subtitle}>{subtitle}</span>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className={styles.scoreLabel}>Final Score</span>
                    <span className={styles.scoreValue} style={{ color: scoreColor }}>
                        {score}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
