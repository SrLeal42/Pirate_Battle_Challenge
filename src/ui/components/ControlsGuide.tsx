import React, { useId } from 'react';
import { CONTROLS, PAUSE_KEYS, CONTROL_ICON_PATH, formatKey } from '../../input/controls';

import { useDialog } from '../hooks/useDialog';

import styles from './ControlsGuide.module.css';

interface ControlsGuideProps {
    onClose: () => void;
}

const Keys: React.FC<{ codes: readonly string[] }> = ({ codes }) => (
    <>
        {codes.map((code) => <kbd key={code} className={styles.key}>{formatKey(code)}</kbd>)}
    </>
);

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onClose }) => {
    const titleId = useId();
    const dialogRef = useDialog(true, onClose);

    return (
        <section
            className={`${styles.card} responsive-card`}
            aria-labelledby={titleId}
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            tabIndex={-1}
        >
            <h2 id={titleId} className={styles.title}>Controls</h2>

            <table className={styles.table}>
                <caption className="sr-only">Keyboard and touch controls</caption>
                <thead>
                    <tr>
                        <th scope="col">Action</th>
                        <th scope="col">Keyboard</th>
                        <th scope="col">Touch</th>
                    </tr>
                </thead>
                <tbody>
                    {CONTROLS.map((c) => (
                        <tr key={c.action}>
                            <th scope="row">{c.label}</th>
                            <td><Keys codes={c.keys} /></td>
                            <td><img src={`${CONTROL_ICON_PATH}${c.icon}`} alt={`${c.label} button`} className={styles.icon} /></td>
                        </tr>
                    ))}
                    <tr>
                        <th scope="row">Pause / resume</th>
                        <td><Keys codes={PAUSE_KEYS} /></td>
                        <td><img src={`${CONTROL_ICON_PATH}icon_pause.png`} alt="Pause button" className={styles.icon} /></td>
                    </tr>
                </tbody>
            </table>

            <p className={styles.hint}>Move and fire at the same time. The game pauses automatically when the tab loses focus.</p>

            <button type="button" className={styles.closeButton} onClick={onClose}>
                Back
            </button>
        </section>
    );

};
