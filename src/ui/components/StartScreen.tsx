import React, { useState } from 'react';
import styles from './StartScreen.module.css';

import { useGameStore } from '../../stores/gameStore';

interface StartScreenProps {
    onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim().length > 0) {
            useGameStore.setState({ username: username.trim() });
            onStart();
        }
    };

    return (

        <div className={styles.overlay}>
            <div className={styles.card}>
                <img
                    src="/assets/png/default/ui/menu/title_pirate_battle.png"
                    alt="Pirate Battle"
                    className={styles.titleImage}
                />

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }}>
                    <div className={styles.inputWrapper}>
                        <label className={styles.label}>Captain's Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Type your name..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={username.trim().length === 0}
                    >
                        Start
                    </button>
                </form>
            </div>
        </div>

    );

};
