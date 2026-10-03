import React, { useEffect, useId, useState } from 'react';
import styles from './StartScreen.module.css';

import { useGameStore } from '../../stores/gameStore';
import { STORAGE_KEYS } from '../../core/config';

import { OptionsScreen } from './OptionsScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ControlsGuide } from './ControlsGuide';
import { END_REASON_LABEL, formatDuration } from '../format';

import { usePendingMatches } from '../../features/matches/hooks';
import { pendingQueue } from '../../features/matches/storage';

export const MenuViewEnum = {
    Main: 'main',
    Options: 'options',
    Controls: 'controls',
    Ranking: 'ranking',
    History: 'history',
} as const;


export type MenuView = typeof MenuViewEnum[keyof typeof MenuViewEnum];


interface StartScreenProps {
    onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEYS.playerName) ?? '');
    const [view, setView] = useState<MenuView>(MenuViewEnum.Main);

    const pending = usePendingMatches();
    const lastMatch = useGameStore((s) => s.lastMatch);
    const nameInputId = useId();
    const lastMatchTitleId = useId();

    useEffect(() => {
        pendingQueue.requestSync(); // retry when returning to the menu
    }, []);

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

            {view === MenuViewEnum.Options && (
                <OptionsScreen onClose={() => setView(MenuViewEnum.Main)} />
            )}

            {view === MenuViewEnum.Controls && (
                <ControlsGuide onClose={() => setView(MenuViewEnum.Main)} />
            )}

            {(view === MenuViewEnum.Ranking || view === MenuViewEnum.History) && (
                <LeaderboardScreen
                    initialTab={view === MenuViewEnum.Ranking ? 'ranking' : 'history'}
                    onClose={() => setView(MenuViewEnum.Main)}
                />
            )}

            {view === MenuViewEnum.Main && (
                <div className={`${styles.card} responsive-card`} >
                    <img
                        src="/assets/png/default/ui/menu/title_pirate_battle.png"
                        alt="Pirate Battle"
                        className={styles.titleImage}
                    />

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputWrapper}>
                            <label className={styles.label} htmlFor={nameInputId}>Captain's Name</label>
                            <input
                                id={nameInputId}
                                type="text"
                                className={styles.input}
                                placeholder="Type your name..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                maxLength={24}
                                required
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

                    <div className={styles.footerButtons}>
                        <button type="button" className={styles.smallButton} onClick={() => setView(MenuViewEnum.Controls)}>
                            Controls
                        </button>
                        <button type="button" className={styles.smallButton} onClick={() => setView(MenuViewEnum.Ranking)}>
                            Ranking
                        </button>
                        <button type="button" className={styles.smallButton} onClick={() => setView(MenuViewEnum.History)}>
                            History
                        </button>
                    </div>

                    {lastMatch && (
                        <section className={styles.lastMatch} aria-labelledby={lastMatchTitleId}>
                            <h2 id={lastMatchTitleId} className={styles.lastMatchTitle}>Last match</h2>
                            <dl className={styles.lastMatchDetails}>
                                <div>
                                    <dt>Score</dt>
                                    <dd>{lastMatch.score}</dd>
                                </div>
                                <div>
                                    <dt>Time played</dt>
                                    <dd>{formatDuration(lastMatch.durationMs)}</dd>
                                </div>
                                <div>
                                    <dt>Reason</dt>
                                    <dd>{END_REASON_LABEL[lastMatch.endReason]}</dd>
                                </div>
                            </dl>
                        </section>
                    )}

                    {pending.length > 0 && (
                        <div className={styles.pendingNotice} role="status">
                            <span>
                                {pending.length} match{pending.length > 1 ? 'es' : ''} waiting to sync
                            </span>
                            <button type="button" className={styles.smallButton} onClick={pendingQueue.requestSync}>
                                Retry
                            </button>
                        </div>
                    )}

                </div>
            )}

        </div>

    );

};
