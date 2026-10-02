import type { GameConfig } from './types';

export const SESSION_STEPS = [60, 90, 120, 150, 180] as const;
export const SPAWN_STEPS = [1, 2, 3, 5, 7, 10] as const;

export const STORAGE_KEYS = {
  playerName: 'pirate_playerName',
  sessionTime: 'pirate_sessionTime',
  spawnInterval: 'pirate_spawnInterval',
} as const;


export const GAME_CONFIG: GameConfig = {
  // Arena
  arenaWidth: 1280, // 20 tiles 64px
  arenaHeight: 704, // 11 tiles 64px
  tileSize: 64,

  // Game Session
  defaultSessionTime: 120, // seconds
  minSessionTime: 60,
  maxSessionTime: 180,

  // Spawns
  defaultSpawnInterval: 3, // seconds
  minSpawnInterval: 1,
  maxSpawnInterval: 10,
  maxAliveEnemies: 20,
  minSpawnDistance: 300, // player spawn min distance
  spawnEdgeMargin: 40, // px from arena border
  spawnCheckRadius: 30, // collision check vs islands
  spawnMaxAttempts: 20,
  spawnGracePeriod: 500, // ms before enemy can act

  // Spawn weights (Playwright can override to 1/0 for deterministic tests)
  chaserWeight: 1,
  shooterWeight: 1,

  // Player
  playerMaxHealth: 100,
  playerMoveSpeed: 150, // px/s
  playerTurnSpeed: Math.PI, // rads/s
  playerHitboxWidth: 80, // hull only
  playerHitboxHeight: 40,

  // Weapons / Projectiles
  cooldownFront: 500, // ms
  cooldownSide: 1500, // ms
  projectileSpeed: 400, // px/s
  projectileLifeTime: 2000, // ms
  projectileDamage: 25,
  projectileRadius: 4,
  broadsideOffsets: [-25, 0, 25], // offset along hull

  // Enemies
  chaserHealth: 50,
  chaserSpeed: 100,
  chaserTurnSpeed: Math.PI * 0.8,
  chaserCollisionDamage: 20,

  shooterHealth: 50,
  shooterSpeed: 80,
  shooterTurnSpeed: Math.PI * 0.8,
  shooterAttackRange: 400,
  shooterCooldown: 2000,
  shooterAimTolerance: 0.2, // rads

  enemyHitboxWidth: 72,
  enemyHitboxHeight: 36,

} as const;
