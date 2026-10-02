import React, { useEffect, useRef } from 'react';
import { GameRuntime } from '../../runtime/gameRuntime';
import { useGameStore } from '../../stores/gameStore';

import { StartScreen } from './StartScreen';
import { HUD } from './HUD';
import { GameOverScreen } from './GameOverScreen';
import { PauseScreen } from './PauseScreen';

import styles from './GameCanvas.module.css';

interface GameCanvasProps {
    sessionTime?: number;
    spawnInterval?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
    sessionTime,
    spawnInterval,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const runtimeRef = useRef<GameRuntime | null>(null);

    const runtimeState = useGameStore((state) => state.runtimeState);

    useEffect(() => {
        if (!containerRef.current) return;

        const runtime = new GameRuntime(containerRef.current);
        runtimeRef.current = runtime;

        runtime.init().catch(console.error);

        return () => {
            runtime.destroy();
            runtimeRef.current = null;
        };
    }, []);

    return (
        <div className={styles.container}>
            <div ref={containerRef} className={styles.canvasWrapper} />

            {runtimeState === 'ready' && (
                <StartScreen
                    onStart={() => runtimeRef.current?.start(sessionTime, spawnInterval)}
                />
            )}

            {runtimeState === 'playing' && <HUD />}

            {runtimeState === 'ended' && (
                <GameOverScreen
                    onRestart={() => runtimeRef.current?.restart()}
                    onQuit={() => runtimeRef.current?.quitToMenu()}
                />
            )}

            {runtimeState === 'paused' && (
                <PauseScreen
                    onResume={() => runtimeRef.current?.resume()}
                    onQuit={() => runtimeRef.current?.quitToMenu()}
                />
            )}

        </div>
    );
};
