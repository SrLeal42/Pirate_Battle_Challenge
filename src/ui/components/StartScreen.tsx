import React, { useState } from 'react';
import styles from './StartScreen.module.css';

import { useGameStore } from '../../stores/gameStore';
import { STORAGE_KEYS } from '../../core/config';
import { OptionsScreen } from './OptionsScreen';



export const MenuViewEnum = {
    Main: 'main',
    Options: 'options',
} as const;

export type MenuView = typeof MenuViewEnum[keyof typeof MenuViewEnum];


interface StartScreenProps {
    onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEYS.playerName) ?? '');
    const [view, setView] = useState<MenuView>(MenuViewEnum.Main);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const usernameTrim = username.trim();

        if (usernameTrim.length > 0) {
            localStorage.setItem(STORAGE_KEYS.playerName, usernameTrim);
            useGameStore.setState({ username: usernameTrim });
            onStart();
        }

    };

    return (

        <div className={styles.overlay}>
            {view === 'options' ? (
                <OptionsScreen onClose={() => setView(MenuViewEnum.Main)} />
            ) : (
                <div className={styles.card}>
                    <img
                        src="/assets/png/default/ui/menu/title_pirate_battle.png"
                        alt="Pirate Battle"
                        className={styles.titleImage}
                    />

                    <form onSubmit={handleSubmit} className={styles.form}>
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

                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.button}>
                                Play
                            </button>
                            <button type="button" className={styles.buttonSecondary} onClick={() => setView(MenuViewEnum.Options)}>
                                Options
                            </button>
                        </div>
                    </form>

                </div>
            )}

        </div>

    );

};
