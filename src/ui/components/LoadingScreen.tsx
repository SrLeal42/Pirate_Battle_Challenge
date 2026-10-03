import React, { useId } from 'react';
import { useGameStore, RuntimeStateEnum } from '../../stores/gameStore';
import { AssetBar } from './AssetBar';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
    onRetry: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onRetry }) => {
    const runtimeState = useGameStore((s) => s.runtimeState);
    const progress = useGameStore((s) => s.loadProgress);
    const errorMessage = useGameStore((s) => s.errorMessage);
    const labelId = useId();

    const failed = runtimeState === RuntimeStateEnum.Error;
    const percent = Math.round(progress * 100);

    return (
        <div className={styles.overlay}>
            <div className={`${styles.card} responsive-card`} aria-busy={!failed}>
                <img src="/assets/png/default/ui/menu/title_pirate_battle.png" alt="Pirate Battle" className={styles.title} />

                {failed ? (
                    <div className={styles.error} role="alert">
                        <p className={styles.errorTitle}>Couldn't load the game assets</p>
                        {errorMessage && <p className={styles.errorDetail}>{errorMessage}</p>}
                        <button type="button" className={styles.retryButton} onClick={onRetry} autoFocus>
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className={styles.progress}>
                        <span id={labelId} className={styles.label}>Loading assets</span>
                        <AssetBar
                            ratio={progress}
                            color="green"
                            label={`${percent}%`}
                            role="progressbar"
                            aria-labelledby={labelId}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                        />
                    </div>
                )}
            </div>
        </div>
    );

};
