import type { InputState } from '../core/types';

export type GameAction = keyof InputState;

export interface ControlDef {
    action: GameAction;
    label: string;
    keys: readonly string[]; // KeyboardEvent.code
    icon: string;
}

export const CONTROL_ICON_PATH = '/assets/png/default/ui/controls/';
export const PAUSE_KEYS = ['Escape', 'KeyP'] as const;
export const TOUCH_INPUT_EVENT = 'touchInput';

export interface TouchInputDetail {
    action: GameAction;
    state: boolean;
}

export const CONTROLS: readonly ControlDef[] = [
    { action: 'thrust', label: 'Move forward', keys: ['KeyW', 'ArrowUp'], icon: 'icon_forward.png' },
    { action: 'turnLeft', label: 'Turn left', keys: ['KeyA', 'ArrowLeft'], icon: 'icon_turn_left.png' },
    { action: 'turnRight', label: 'Turn right', keys: ['KeyD', 'ArrowRight'], icon: 'icon_turn_right.png' },
    { action: 'fireFront', label: 'Fire front cannon', keys: ['Space'], icon: 'icon_fire_front.png' },
    { action: 'fireLeft', label: 'Fire left broadside', keys: ['KeyQ'], icon: 'icon_fire_left.png' },
    { action: 'fireRight', label: 'Fire right broadside', keys: ['KeyE'], icon: 'icon_fire_right.png' },
];

export const KEY_TO_ACTION: ReadonlyMap<string, GameAction> = new Map(
    CONTROLS.flatMap((c) => c.keys.map((key) => [key, c.action] as const)),
);

export const CONTROLS_BY_ACTION = Object.fromEntries(
    CONTROLS.map((c) => [c.action, c]),
) as Readonly<Record<GameAction, ControlDef>>;

export const isPauseKey = (code: string): boolean => (PAUSE_KEYS as readonly string[]).includes(code);

const KEY_LABELS: Record<string, string> = {
    ArrowUp: '↑',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'Space',
    Escape: 'Esc',
};

export const formatKey = (code: string): string => KEY_LABELS[code] ?? code.replace(/^Key/, '');
