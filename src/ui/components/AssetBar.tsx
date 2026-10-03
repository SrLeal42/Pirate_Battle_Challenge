import React from 'react';
import styles from './AssetBar.module.css';

// From ui_sheet.json → "player_health" layout (logical px)
const FRAME = { w: 256, h: 48 } as const;
const FILL = { x: 30, y: 15, w: 196, h: 20 } as const;
const HUD_PATH = '/assets/png/default/ui/hud/';

export type BarColor = 'green' | 'amber' | 'red';

type AssetBarProps = React.HTMLAttributes<HTMLDivElement> & {
    ratio: number;
    color: BarColor;
    label?: React.ReactNode;
};

const pct = (value: number, total: number): string => `${(value / total) * 100}%`;

const LABEL_BOX: React.CSSProperties = {
    left: pct(FILL.x, FRAME.w),
    top: pct(FILL.y, FRAME.h),
    width: pct(FILL.w, FRAME.w),
    height: pct(FILL.h, FRAME.h),
};

export const AssetBar: React.FC<AssetBarProps> = ({ ratio, color, label, className, ...rest }) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    const rightInset = FRAME.w - FILL.x - FILL.w * clamped;

    return (
        <div {...rest} className={`${styles.bar} ${className ?? ''}`}>
            {/* Draw order from atlas metadata: frame → fill */}
            <img src={`${HUD_PATH}health_frame.png`} className={styles.layer} alt="" aria-hidden="true" draggable={false} />
            <img
                src={`${HUD_PATH}health_fill_${color}.png`}
                className={`${styles.layer} ${styles.fill}`}
                style={{ clipPath: `inset(0 ${pct(rightInset, FRAME.w)} 0 0)` }}
                alt=""
                aria-hidden="true"
                draggable={false}
            />
            {label !== undefined && (
                <span className={styles.label} style={LABEL_BOX} aria-hidden="true">{label}</span>
            )}
        </div>
    );
};
