import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAME_CONFIG } from '../../core/config';
import styles from './HUD.module.css';

const emitTouch = (action: string, state: boolean) => {
    window.dispatchEvent(new CustomEvent('touchInput', { detail: { action, state } }));
};

const TouchButton = ({ action, icon, area }: { action: string, icon: string, area: string }) => (
    <button
        className={styles.touchButton}
        style={{ gridArea: area }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); emitTouch(action, true); }}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); emitTouch(action, false); }}
        onPointerCancel={() => emitTouch(action, false)}
    >
        <img src={`/assets/png/default/ui/controls/${icon}`} className={styles.touchIcon} alt={action} />
    </button>
);


export const HUD: React.FC = () => {
    const health = useGameStore(s => s.playerHealth);
    const timeRemaining = useGameStore(s => s.timeRemaining);
    const score = useGameStore(s => s.score);

    const healthPercent = Math.max(0, health / GAME_CONFIG.playerMaxHealth);
    const isLowHealth = healthPercent <= 0.3;
    const secondsLeft = Math.ceil(timeRemaining / 1000);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const missingPercent = (1 - healthPercent) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.healthWrapper}>
                <div
                    className={`${styles.healthFill} ${isLowHealth ? styles.healthFillLow : ''}`}
                    style={{ clipPath: `inset(0 ${missingPercent}% 0 0)`, transition: 'clip-path 0.2s ease-out' }}
                />
                <div className={styles.healthFrame} />
            </div>

            <div className={styles.statsWrapper}>
                <div className={styles.counter}>
                    <img src="/assets/png/default/ui/hud/icon_score.png" alt="Score" className={styles.icon} />
                    <span className={styles.value}>{score}</span>
                </div>

                <div className={styles.counter}>
                    <img src="/assets/png/default/ui/hud/icon_time.png" alt="Time" className={styles.icon} />
                    <span className={styles.value}>{timeString}</span>
                </div>
            </div>

            <div className={styles.pauseContainer}>
                <button className={styles.pauseButton} onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }))}>
                    <img src="/assets/png/default/ui/controls/icon_pause.png" className={styles.pauseIcon} alt="Pause" />
                </button>
            </div>

            <div className={styles.touchControls}>
                <div className={styles.leftControls}>
                    <TouchButton action="thrust" icon="icon_forward.png" area="up" />
                    <TouchButton action="turnLeft" icon="icon_turn_left.png" area="left" />
                    <TouchButton action="turnRight" icon="icon_turn_right.png" area="right" />
                </div>

                <div className={styles.rightControls}>
                    <TouchButton action="fireFront" icon="icon_fire_front.png" area="front" />
                    <TouchButton action="fireLeft" icon="icon_fire_left.png" area="left" />
                    <TouchButton action="fireRight" icon="icon_fire_right.png" area="right" />
                </div>
            </div>

        </div>
    );

};
