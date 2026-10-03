import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAME_CONFIG } from '../../core/config';
import { getHealthTier, type HealthTier } from '../../core/health';
import {
    CONTROLS_BY_ACTION, CONTROL_ICON_PATH, TOUCH_INPUT_EVENT,
    type GameAction, type TouchInputDetail,
} from '../../input/controls';
import { AssetBar, type BarColor } from './AssetBar';
import styles from './HUD.module.css';

const TIER_COLOR: Record<HealthTier, BarColor> = { high: 'green', medium: 'amber', low: 'red' };

const emitTouch = (action: GameAction, state: boolean): void => {
    window.dispatchEvent(new CustomEvent<TouchInputDetail>(TOUCH_INPUT_EVENT, { detail: { action, state } }));
};

const TouchButton: React.FC<{ action: GameAction; area: string }> = ({ action, area }) => {
    const { label, icon } = CONTROLS_BY_ACTION[action];

    return (
        <button
            type="button"
            className={styles.touchButton}
            style={{ gridArea: area }}
            aria-label={label}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                emitTouch(action, true);
            }}
            // Fires on pointerup, pointercancel and implicit capture loss
            onLostPointerCapture={() => emitTouch(action, false)}
            onContextMenu={(e) => e.preventDefault()}
        >
            <img src={`${CONTROL_ICON_PATH}${icon}`} className={styles.touchIcon} alt="" aria-hidden="true" draggable={false} />
        </button>
    );
};

const formatTime = (ms: number): string => {
    const total = Math.ceil(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

interface HUDProps {
    onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ onPause }) => {
    const health = useGameStore((s) => s.playerHealth);
    const timeRemaining = useGameStore((s) => s.timeRemaining);
    const score = useGameStore((s) => s.score);

    const maxHealth = GAME_CONFIG.playerMaxHealth;
    const currentHealth = Math.max(0, Math.ceil(health));
    const healthRatio = currentHealth / maxHealth;

    return (
        <div className={styles.container}>
            <div className={styles.healthWrapper}>
                <AssetBar
                    ratio={healthRatio}
                    color={TIER_COLOR[getHealthTier(healthRatio)]}
                    label={`${currentHealth} / ${maxHealth}`}
                    role="meter"
                    aria-label="Health"
                    aria-valuemin={0}
                    aria-valuemax={maxHealth}
                    aria-valuenow={currentHealth}
                    aria-valuetext={`${currentHealth} of ${maxHealth}`}
                />
            </div>

            <div className={styles.statsWrapper}>
                <div className={styles.counter}>
                    <img src="/assets/png/default/ui/hud/icon_score.png" alt="Score" className={styles.icon} />
                    <span className={styles.value}>{score}</span>
                </div>

                <div className={styles.counter}>
                    <img src="/assets/png/default/ui/hud/icon_time.png" alt="Time remaining" className={styles.icon} />
                    <span className={styles.value}>{formatTime(timeRemaining)}</span>
                </div>
            </div>

            <div className={styles.pauseContainer}>
                <button type="button" className={styles.pauseButton} onClick={onPause} aria-label="Pause game">
                    <img src={`${CONTROL_ICON_PATH}icon_pause.png`} className={styles.pauseIcon} alt="" aria-hidden="true" />
                </button>
            </div>

            <div className={styles.touchControls}>
                <div className={styles.leftControls}>
                    <TouchButton action="thrust" area="up" />
                    <TouchButton action="turnLeft" area="left" />
                    <TouchButton action="turnRight" area="right" />
                </div>

                <div className={styles.rightControls}>
                    <TouchButton action="fireFront" area="front" />
                    <TouchButton action="fireLeft" area="left" />
                    <TouchButton action="fireRight" area="right" />
                </div>
            </div>

        </div>
    );

};
