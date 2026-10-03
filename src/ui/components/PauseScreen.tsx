import React from 'react';
import styles from './PauseScreen.module.css';

interface PauseScreenProps {
    onResume: () => void;
    onQuit: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onQuit }) => {
    return (
        <div className={styles.overlay}>
            <div className={`${styles.card} responsive-card`}>
                <h1 className={styles.title}>Paused</h1>

                <div className={styles.buttonGroup}>
                    <button className={styles.button} onClick={onResume}>
                        Resume
                    </button>
                    <button className={styles.secondaryButton} onClick={onQuit}>
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
};
