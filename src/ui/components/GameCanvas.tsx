import React, { useEffect, useRef } from 'react';
import { GameRuntime } from '../../runtime/gameRuntime';
import { useGameStore, RuntimeStateEnum } from '../../stores/gameStore';

import { StartScreen } from './StartScreen';
import { HUD } from './HUD';
import { GameOverScreen } from './GameOverScreen';
import { PauseScreen } from './PauseScreen';

import styles from './GameCanvas.module.css';

interface GameCanvasProps {
    sessionTime?: number;
    spawnInterval?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = () => {
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

            {runtimeState === RuntimeStateEnum.Ready && (
                <StartScreen
                    onStart={() => {
                        const s = useGameStore.getState();
                        runtimeRef.current?.start(s.sessionTime, s.spawnInterval);
                    }}
                />
            )}

            {runtimeState === RuntimeStateEnum.Playing && <HUD />}

            {runtimeState === RuntimeStateEnum.Ended && (
                <GameOverScreen
                    onRestart={() => runtimeRef.current?.restart()}
                    onQuit={() => runtimeRef.current?.quitToMenu()}
                />
            )}

            {runtimeState === RuntimeStateEnum.Paused && (
                <PauseScreen
                    onResume={() => runtimeRef.current?.resume()}
                    onQuit={() => runtimeRef.current?.quitToMenu()}
                />
            )}

        </div>
    );
};
