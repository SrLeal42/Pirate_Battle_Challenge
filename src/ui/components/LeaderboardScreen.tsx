import React, { useState } from 'react';
import { useLeaderboard, useMatchHistory } from '../../features/matches/hooks';
import { useGameStore } from '../../stores/gameStore';

import { useDialog } from '../hooks/useDialog';

import styles from './LeaderboardScreen.module.css';

interface LeaderboardScreenProps {
    initialTab: 'ranking' | 'history';
    onClose: () => void;
}

function formatDate(isoString: string) {
    const d = new Date(isoString);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} - ${hours}:${mins}`;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ initialTab, onClose }) => {
    const [activeTab, setActiveTab] = useState<'ranking' | 'history'>(initialTab);
    const [page, setPage] = useState(1);

    const sessionTime = useGameStore(s => s.sessionTime);
    const spawnInterval = useGameStore(s => s.spawnInterval);
    const configKey = `${sessionTime}-${spawnInterval}`;
    const playerId = useGameStore(s => s.playerId);

    const dialogRef = useDialog(true, onClose);

    const { data: rankingData, isLoading: loadingRanking } = useLeaderboard(configKey, page);
    const { data: historyData, isLoading: loadingHistory } = useMatchHistory(playerId, page);

    const isLoading = activeTab === 'ranking' ? loadingRanking : loadingHistory;
    const currentData = activeTab === 'ranking' ? rankingData : historyData;

    const totalPages = Math.max(1, Math.ceil((currentData?.total || 0) / 10));

    const handleTabSwitch = (tab: 'ranking' | 'history') => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setPage(1);
        }
    };

    return (
        <div
            className={`${styles.card} responsive-card`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-title"
            ref={dialogRef}
            tabIndex={-1}
        >
            <h1 className={styles.title}>{activeTab === 'ranking' ? 'Leaderboard' : 'Match History'}</h1>

            <div className={styles.tabButtons}>
                <button
                    className={activeTab === 'ranking' ? styles.tabActive : styles.tabInactive}
                    onClick={() => handleTabSwitch('ranking')}
                >
                    Ranking
                </button>
                <button
                    className={activeTab === 'history' ? styles.tabActive : styles.tabInactive}
                    onClick={() => handleTabSwitch('history')}
                >
                    History
                </button>
            </div>

            {activeTab === 'ranking' ? (
                <p className={styles.categoryInfo}>
                    {sessionTime}s Battle - {spawnInterval}s Spawn Interval
                </p>
            ) : (<></>)}

            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className={styles.loading}>Loading records...</div>
                ) : currentData?.data.length === 0 ? (
                    <div className={styles.empty}>No records found.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {activeTab === 'ranking' ? (
                                    <><th>Rank</th><th>Player</th><th>Score</th><th>Time</th><th>Date</th></>
                                ) : (
                                    <><th>Date</th><th>Result</th><th>Score</th><th>Time</th></>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData?.data.map((record, index) => {
                                const rank = (page - 1) * 10 + index + 1;
                                const isFirstPlace = activeTab === 'ranking' && rank === 1;

                                return (
                                    <tr key={record.id} className={record.playerId === playerId ? styles.highlightRow : ''}>
                                        {activeTab === 'ranking' ? (
                                            <>
                                                <td>{rank}</td>
                                                <td>
                                                    {isFirstPlace && (
                                                        <img
                                                            src="/assets/png/default/ui/hud/icon_score.png"
                                                            alt="Star"
                                                            style={{ width: 20, verticalAlign: 'middle', marginRight: 6 }}
                                                        />
                                                    )}
                                                    {record.playerName}
                                                </td>
                                                <td>{record.score}</td>
                                                <td>{Math.floor(record.durationMs / 1000)}s</td>
                                                <td>{formatDate(record.createdAt)}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{formatDate(record.createdAt)}</td>
                                                <td className={record.endReason === 'time_up' ? styles.textGreen : styles.textRed}>
                                                    {record.endReason === 'time_up' ? 'Victory' : 'Defeated'}
                                                </td>
                                                <td>{record.score}</td>
                                                <td>{Math.floor(record.durationMs / 1000)}s</td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className={styles.pagination}>
                <button
                    className={styles.pageButton}
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage(p => p - 1)}
                >
                    <img src="/assets/png/default/ui/controls/icon_play.png" className={`${styles.pageIcon} ${styles.iconFlipped}`} alt="Prev" />
                </button>

                <span style={{ color: 'white', fontWeight: 'bold' }}>Page {page} of {totalPages}</span>

                <button
                    className={styles.pageButton}
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage(p => p + 1)}
                >
                    <img src="/assets/png/default/ui/controls/icon_play.png" className={styles.pageIcon} alt="Next" />
                </button>
            </div>

            <button className={styles.closeButton} onClick={onClose}>
                Back to Menu
            </button>
        </div>
    );

};
