import type { InputState } from '../core/types';

const KEY_MAP: Record<string, keyof InputState> = {
    'KeyW': 'thrust',
    'ArrowUp': 'thrust',
    'KeyA': 'turnLeft',
    'ArrowLeft': 'turnLeft',
    'KeyD': 'turnRight',
    'ArrowRight': 'turnRight',
    'Space': 'fireFront',
    'KeyQ': 'fireLeft',
    'KeyE': 'fireRight',
};

export class InputHandler {
    private state: InputState = {
        thrust: false,
        turnLeft: false,
        turnRight: false,
        fireFront: false,
        fireLeft: false,
        fireRight: false,
    };

    private active = false;
    private onKeyDown: (e: KeyboardEvent) => void;
    private onKeyUp: (e: KeyboardEvent) => void;

    public onPauseToggle?: () => void;

    constructor() {
        this.onKeyDown = (e: KeyboardEvent) => {

            if (e.code === 'Escape') {
                if (this.onPauseToggle) this.onPauseToggle();
                return;
            }

            if (!this.active) return;

            const action = KEY_MAP[e.code];
            if (action) {
                e.preventDefault();
                this.state[action] = true;
            }
        };

        this.onKeyUp = (e: KeyboardEvent) => {
            const action = KEY_MAP[e.code];
            if (action) {
                this.state[action] = false;
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    enable(): void { this.active = true; }
    disable(): void { this.active = false; }

    getState(): Readonly<InputState> {
        return this.state;
    }

    reset(): void {
        this.state.thrust = false;
        this.state.turnLeft = false;
        this.state.turnRight = false;
        this.state.fireFront = false;
        this.state.fireLeft = false;
        this.state.fireRight = false;
    }

    destroy(): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.reset();
    }

}
