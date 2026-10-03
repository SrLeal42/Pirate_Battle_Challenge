import { GameCanvas } from './ui/components/GameCanvas';
import { MockDevPanel } from './ui/components/MockDevPanel';
import { usePendingSync } from './features/matches/hooks';
import { useGameStore, RuntimeStateEnum } from './stores/gameStore';

import './App.css';

export function App() {
  usePendingSync();

  const runtimeState = useGameStore((s) => s.runtimeState);
  const inCombat = runtimeState === RuntimeStateEnum.Playing || runtimeState === RuntimeStateEnum.Paused;

  return (
    <div className="app-container">
      <GameCanvas />
      {!inCombat && <MockDevPanel />}
    </div>
  );
}
