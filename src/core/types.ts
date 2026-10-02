import type { Polygon } from './geometry';

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

export interface IslandDef {
  polygon: Polygon;
}

export interface ArenaDef {
  width: number;
  height: number;
  islands: IslandDef[];
}

export interface SessionConfig {
  sessionTimeMs: number;
  spawnIntervalMs: number;
}


export type EnemyType = 'chaser' | 'shooter';

export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector2;
  rotation: number;
  health: number;
  cooldown: number;
  isDead: boolean;
  killedByCollision?: boolean; // Chaser self-destruct: no score
}

export interface ProjectileState {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  lifeTime: number;
}

export interface GameState {
  timeRemaining: number;
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


export interface GameConfig {
  // Arena
  arenaWidth: number;
  arenaHeight: number;
  tileSize: number;

  // Game Session
  defaultSessionTime: number;
  minSessionTime: number;
  maxSessionTime: number;

  // Spawns
  defaultSpawnInterval: number;
  minSpawnInterval: number;
  maxSpawnInterval: number;
  maxAliveEnemies: number;
  minSpawnDistance: number;
  spawnEdgeMargin: number;
  spawnCheckRadius: number;
  spawnMaxAttempts: number;
  spawnGracePeriod: number;
  chaserWeight: number;
  shooterWeight: number;

  // Player
  playerMaxHealth: number;
  playerMoveSpeed: number;
  playerTurnSpeed: number;
  playerHitboxWidth: number;
  playerHitboxHeight: number;

  // Weapons / Projectiles
  cooldownFront: number;
  cooldownSide: number;
  projectileSpeed: number;
  projectileLifeTime: number;
  projectileDamage: number;
  projectileRadius: number;
  broadsideOffsets: readonly number[];

  // Enemies
  chaserHealth: number;
  chaserSpeed: number;
  chaserTurnSpeed: number;
  chaserCollisionDamage: number;
  shooterHealth: number;
  shooterSpeed: number;
  shooterTurnSpeed: number;
  shooterAttackRange: number;
  shooterCooldown: number;
  shooterAimTolerance: number;
  enemyHitboxWidth: number;
  enemyHitboxHeight: number;
}
