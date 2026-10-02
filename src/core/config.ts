export const GAME_CONFIG = {
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
  playerHitboxWidth: 40, // hull only
  playerHitboxHeight: 80,

  // Weapons / Projectiles
  cooldownFront: 1000, // ms
  cooldownSide: 2000, // ms
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

  enemyHitboxWidth: 36,
  enemyHitboxHeight: 72,
};
