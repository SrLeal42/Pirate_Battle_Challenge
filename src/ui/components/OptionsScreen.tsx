import React, { useState } from 'react';

import { useGameStore } from '../../stores/gameStore';
import { SPAWN_STEPS, SESSION_STEPS, STORAGE_KEYS } from '../../core/config';

import styles from './OptionsScreen.module.css';

interface OptionsScreenProps {
    onClose: () => void;
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onClose }) => {
    const initialSession = useGameStore(s => s.sessionTime);
    const initialSpawn = useGameStore(s => s.spawnInterval);

    const [sessionIdx, setSessionIdx] = useState(() =>
        Math.max(0, (SESSION_STEPS as readonly number[]).indexOf(initialSession))
    );

    const [spawnIdx, setSpawnIdx] = useState(() =>
        Math.max(0, (SPAWN_STEPS as readonly number[]).indexOf(initialSpawn))
    );

    const handleSave = () => {
        const finalSession = SESSION_STEPS[sessionIdx];
        const finalSpawn = SPAWN_STEPS[spawnIdx];

        localStorage.setItem(STORAGE_KEYS.sessionTime, finalSession.toString());
        localStorage.setItem(STORAGE_KEYS.spawnInterval, finalSpawn.toString());

        useGameStore.setState({ sessionTime: finalSession, spawnInterval: finalSpawn });

        onClose();
    };

    return (
        <div className={styles.card}>
            <h1 className={styles.title}>Options</h1>

            <div className={styles.optionGroup}>

                <label className={styles.label}>Match Duration</label>

                <div className={styles.selector}>
                    <button className={styles.stepButton} onClick={() => setSessionIdx(Math.max(0, sessionIdx - 1))}>
                        <img src="/assets/png/default/ui/controls/icon_minus.png" alt="-" className={styles.stepIcon} />
                    </button>
                    <span className={styles.valueDisplay}>{SESSION_STEPS[sessionIdx]}s</span>
                    <button className={styles.stepButton} onClick={() => setSessionIdx(Math.min(SESSION_STEPS.length - 1, sessionIdx + 1))}>
                        <img src="/assets/png/default/ui/controls/icon_plus.png" alt="+" className={styles.stepIcon} />
                    </button>
                </div>

            </div>

            <div className={styles.optionGroup}>

                <label className={styles.label}>Enemy Spawn</label>
                <div className={styles.selector}>
                    <button className={styles.stepButton} onClick={() => setSpawnIdx(Math.max(0, spawnIdx - 1))}>
                        <img src="/assets/png/default/ui/controls/icon_minus.png" alt="-" className={styles.stepIcon} />
                    </button>
                    <span className={styles.valueDisplay}>{SPAWN_STEPS[spawnIdx]}s</span>
                    <button className={styles.stepButton} onClick={() => setSpawnIdx(Math.min(SPAWN_STEPS.length - 1, spawnIdx + 1))}>
                        <img src="/assets/png/default/ui/controls/icon_plus.png" alt="+" className={styles.stepIcon} />
                    </button>
                </div>

            </div>

            <button className={styles.saveButton} onClick={handleSave}>
                Save & Close
            </button>
        </div>
    );

};
