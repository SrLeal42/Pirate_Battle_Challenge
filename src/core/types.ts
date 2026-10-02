export interface Vector2 {
  x: number;
  y: number;
}

export interface InputState {
  thrust: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  fireFront: boolean;
  fireLeft: boolean;
  fireRight: boolean;
}

export interface PlayerState {
  id: string;
  position: Vector2;
  rotation: number; // em radianos, 0 = +X
  health: number;
  cooldowns: {
    front: number;
    left: number;
    right: number;
  };
  isDead: boolean;
}

export type EnemyType = 'chaser' | 'shooter';

export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector2;
  rotation: number;
  health: number;
  cooldown: number; // usado pelo shooter
  isDead: boolean;
}

export interface ProjectileState {
  id: string;
  ownerId: string; // 'player' ou id do inimigo
  position: Vector2;
  velocity: Vector2;
  damage: number;
  lifeTime: number;
}

export interface GameState {
  timeRemaining: number; // em milissegundos
  score: number;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  isGameOver: boolean;
  endReason: 'time_up' | 'player_died' | null;
}

export type GameEvent =
  | { type: 'shotFired', projectileId: string, ownerId: string }
  | { type: 'projectileHit', projectileId: string, targetId: string }
  | { type: 'shipDestroyed', shipId: string, isPlayer: boolean }
  | { type: 'playerDamaged', amount: number }
  | { type: 'scoreChanged', newScore: number }
  | { type: 'matchEnded', reason: 'time_up' | 'player_died' };


export type TileType =
  | 'water'
  | 'island_nw' | 'island_n' | 'island_ne'
  | 'island_w' | 'island_center' | 'island_e'
  | 'island_sw' | 'island_s' | 'island_se';