import React, { useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '../../mocks/scenarios';
import { getMockSettings, setScenario, resetMocks } from '../../mocks/control';
import { usePendingMatches } from '../../features/matches/hooks';

import styles from './MockDevPanel.module.css';

export const MockDevPanel: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [scenario, setScenarioState] = useState<ScenarioId>(() => getMockSettings().scenario);
    const queryClient = useQueryClient();
    const pending = usePendingMatches();
    const panelId = useId();
    const selectId = useId();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value as ScenarioId;
        setScenario(next);
        setScenarioState(next);
        void queryClient.invalidateQueries();
    };

    const handleReset = () => {
        resetMocks();
        window.location.reload(); // also clears the query cache
    };

    return (
        <div className={styles.root}>
            <button
                type="button"
                className={styles.toggle}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label="Network scenarios"
                title="Network scenarios"
                onClick={() => setOpen((o) => !o)}
            >
                ⚙
            </button>

            {open && (
                <section id={panelId} className={styles.panel} aria-label="Network scenario controls">
                    <label htmlFor={selectId}>Scenario</label>
                    <select id={selectId} value={scenario} onChange={handleChange}>
                        {SCENARIO_IDS.map((id) => (
                            <option key={id} value={id}>{SCENARIOS[id].label}</option>
                        ))}
                    </select>
                    <p className={styles.description}>{SCENARIOS[scenario].description}</p>
                    <p className={styles.meta}>Pending matches: {pending.length}</p>
                    <button type="button" onClick={handleReset}>Reset mock state</button>
                </section>
            )}
        </div>
    );

};
