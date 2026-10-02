import React, { useEffect, useRef } from 'react';
import { GameRuntime } from '../../runtime/gameRuntime';
import { useGameStore } from '../../stores/gameStore';

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

    useEffect(() => {
        if (!containerRef.current) return;

        const runtime = new GameRuntime(containerRef.current);
        runtimeRef.current = runtime;

        runtime.init().then(() => {
            runtime.start(sessionTime, spawnInterval);
        }).catch(console.error);

        return () => {
            runtime.destroy();
            runtimeRef.current = null;
        };
    }, [sessionTime, spawnInterval]);

    const isPaused = useGameStore((state) => state.runtimeState === 'paused');

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            />

            {isPaused && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                }}>
                    PAUSED
                </div>
            )}
        </div>
    );


};

