import type {
    GameState, GameEvent, InputState, PlayerState,
    EnemyState, EnemyType, Vector2, GameConfig,
    ArenaDef, SessionConfig,
} from './types';
import { RNG } from './rng';
import {
    vAdd, vSub, vScale, vNorm, vLen, vDist,
    createOBB, polyVsPoly, circleVsPoly,
    type Circle,
} from './geometry';


// --- Simulation ---

export class Simulation {

    private state: GameState;

    private events: GameEvent[] = [];
    private rng: RNG;

    private arena: ArenaDef;

    private config: GameConfig;

    private session: SessionConfig;
    private spawnTimer: number;
    private nextId = 0;

    constructor(
        config: GameConfig,
        arena: ArenaDef,
        seed: number,
        sessionTimeSec: number,
        spawnIntervalSec: number,
    ) {
        this.config = config;
        this.arena = arena;
        this.rng = new RNG(seed);
        this.session = {
            sessionTimeMs: sessionTimeSec * 1000,
            spawnIntervalMs: spawnIntervalSec * 1000,
        };
        this.spawnTimer = this.session.spawnIntervalMs;

        this.state = {
            timeRemaining: this.session.sessionTimeMs,
            score: 0,
            player: {
                id: 'player',
                position: { x: arena.width / 2, y: arena.height / 2 },
                rotation: 0,
                health: config.playerMaxHealth,
                cooldowns: { front: 0, left: 0, right: 0 },
                isDead: false,
            },
            enemies: [],
            projectiles: [],
            isGameOver: false,
            endReason: null,
        };
    }

    private genId(): string {
        return `e${this.nextId++}`;
    }

    // ========== Public API ==========

    step(dt: number, input: InputState): void {
        if (this.state.isGameOver) return;

        this.advanceTimers(dt);
        this.applyPlayerInput(dt, input);
        this.spawnEnemies();
        this.updateAI(dt);
        this.fireWeapons(input);
        this.integrateMovement(dt);
        this.resolveCollisions();
        this.processDeathsAndScoring();
        this.cleanup();
        this.checkMatchEnd();
    }

    getState(): Readonly<GameState> {
        return this.state;
    }

    drainEvents(): GameEvent[] {
        const drained = this.events;
        this.events = [];
        return drained;
    }

    // ========== Systems ==========

    private advanceTimers(dt: number): void {
        this.state.timeRemaining -= dt;

        const cd = this.state.player.cooldowns;
        cd.front = Math.max(0, cd.front - dt);
        cd.left = Math.max(0, cd.left - dt);
        cd.right = Math.max(0, cd.right - dt);

        for (const enemy of this.state.enemies) {
            if (!enemy.isDead) {
                enemy.cooldown = Math.max(0, enemy.cooldown - dt);
            }
        }

        this.spawnTimer = Math.max(0, this.spawnTimer - dt);
    }

    private applyPlayerInput(dt: number, input: InputState): void {
        const p = this.state.player;
        if (p.isDead) return;

        const dtSec = dt / 1000;
        if (input.turnLeft) p.rotation -= this.config.playerTurnSpeed * dtSec;
        if (input.turnRight) p.rotation += this.config.playerTurnSpeed * dtSec;

        if (input.thrust) {
            p.position.x += Math.cos(p.rotation) * this.config.playerMoveSpeed * dtSec;
            p.position.y += Math.sin(p.rotation) * this.config.playerMoveSpeed * dtSec;
        }
    }

    private spawnEnemies(): void {
        if (this.spawnTimer > 0) return;

        const aliveCount = this.state.enemies.filter(e => !e.isDead).length;
        if (aliveCount >= this.config.maxAliveEnemies) return;

        this.spawnTimer = this.session.spawnIntervalMs;

        const pos = this.findSpawnPosition();
        if (!pos) return;

        const totalWeight = this.config.chaserWeight + this.config.shooterWeight;
        const type: EnemyType = this.rng.random() * totalWeight < this.config.chaserWeight ? 'chaser' : 'shooter';
        const isChaser = type === 'chaser';

        const enemy: EnemyState = {
            id: this.genId(),
            type,
            position: pos,
            rotation: Math.atan2(
                this.state.player.position.y - pos.y,
                this.state.player.position.x - pos.x,
            ),
            health: isChaser ? this.config.chaserHealth : this.config.shooterHealth,
            cooldown: this.config.spawnGracePeriod, // Grace period on spawn
            isDead: false,
        };

        this.state.enemies.push(enemy);
    }

    private findSpawnPosition(): Vector2 | null {
        const margin = this.config.spawnEdgeMargin;
        const { width, height } = this.arena;

        for (let i = 0; i < this.config.spawnMaxAttempts; i++) {
            let x: number, y: number;
            const side = Math.floor(this.rng.random() * 4);
            switch (side) {
                case 0: x = this.rng.range(margin, width - margin); y = margin; break;
                case 1: x = this.rng.range(margin, width - margin); y = height - margin; break;
                case 2: x = margin; y = this.rng.range(margin, height - margin); break;
                default: x = width - margin; y = this.rng.range(margin, height - margin); break;
            }

            const pos = { x, y };
            if (vDist(pos, this.state.player.position) < this.config.minSpawnDistance) continue;

            const spawnCircle: Circle = { pos, radius: this.config.spawnCheckRadius };
            let blocked = false;
            for (const island of this.arena.islands) {
                if (circleVsPoly(spawnCircle, island.polygon).collided) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) continue;

            return pos;
        }
        return null;
    }

    private updateAI(dt: number): void {
        const dtSec = dt / 1000;
        const playerPos = this.state.player.position;

        for (const enemy of this.state.enemies) {
            if (enemy.isDead) continue;

            const toPlayer = vSub(playerPos, enemy.position);
            const targetAngle = Math.atan2(toPlayer.y, toPlayer.x);
            const turnSpeed = enemy.type === 'chaser'
                ? this.config.chaserTurnSpeed
                : this.config.shooterTurnSpeed;

            enemy.rotation = this.rotateToward(enemy.rotation, targetAngle, turnSpeed * dtSec);

            const dist = vLen(toPlayer);
            const speed = enemy.type === 'chaser' ? this.config.chaserSpeed : this.config.shooterSpeed;

            if (enemy.type === 'shooter' && dist <= this.config.shooterAttackRange) {
                // In range: stop moving, fire if aligned
                const angleDiff = Math.abs(this.normalizeAngle(targetAngle - enemy.rotation));
                if (angleDiff < this.config.shooterAimTolerance && enemy.cooldown <= 0) {
                    this.fireEnemyProjectile(enemy);
                }
            } else {
                // Move forward
                enemy.position.x += Math.cos(enemy.rotation) * speed * dtSec;
                enemy.position.y += Math.sin(enemy.rotation) * speed * dtSec;
            }

        }

    }

    private rotateToward(current: number, target: number, maxStep: number): number {
        const diff = this.normalizeAngle(target - current);
        if (Math.abs(diff) <= maxStep) return target;
        return current + Math.sign(diff) * maxStep;
    }

    private normalizeAngle(a: number): number {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    private fireWeapons(input: InputState): void {
        const p = this.state.player;
        if (p.isDead) return;

        // Front: 1 projectile
        if (input.fireFront && p.cooldowns.front <= 0) {
            const dir = { x: Math.cos(p.rotation), y: Math.sin(p.rotation) };
            this.createProjectile(p.id, p.position, dir);
            p.cooldowns.front = this.config.cooldownFront;
            this.events.push({ type: 'shotFired', projectileId: `p${this.nextId}`, ownerId: p.id });
        }

        // Left broadside: 3 projectiles
        if (input.fireLeft && p.cooldowns.left <= 0) {
            const leftDir = { x: Math.cos(p.rotation - Math.PI / 2), y: Math.sin(p.rotation - Math.PI / 2) };
            this.fireBroadside(p, leftDir);
            p.cooldowns.left = this.config.cooldownSide;
        }

        // Right broadside: 3 projectiles
        if (input.fireRight && p.cooldowns.right <= 0) {
            const rightDir = { x: Math.cos(p.rotation + Math.PI / 2), y: Math.sin(p.rotation + Math.PI / 2) };
            this.fireBroadside(p, rightDir);
            p.cooldowns.right = this.config.cooldownSide;
        }

    }

    private fireBroadside(player: PlayerState, dir: Vector2): void {
        const forward = { x: Math.cos(player.rotation), y: Math.sin(player.rotation) };
        const offsets = this.config.broadsideOffsets; // Offset along hull length

        for (const offset of offsets) {
            const origin = vAdd(player.position, vScale(forward, offset));
            this.createProjectile(player.id, origin, dir);
        }

        this.events.push({ type: 'shotFired', projectileId: 'broadside', ownerId: player.id });
    }

    private fireEnemyProjectile(enemy: EnemyState): void {
        const dir = { x: Math.cos(enemy.rotation), y: Math.sin(enemy.rotation) };
        this.createProjectile(enemy.id, enemy.position, dir);
        enemy.cooldown = this.config.shooterCooldown;
        this.events.push({ type: 'shotFired', projectileId: `p${this.nextId}`, ownerId: enemy.id });
    }

    private createProjectile(ownerId: string, origin: Vector2, dir: Vector2): void {
        const normalized = vNorm(dir);
        this.state.projectiles.push({
            id: this.genId(),
            ownerId,
            position: { ...origin },
            velocity: vScale(normalized, this.config.projectileSpeed),
            damage: this.config.projectileDamage,
            lifeTime: this.config.projectileLifeTime,
        });
    }

    private integrateMovement(dt: number): void {
        const dtSec = dt / 1000;
        for (const proj of this.state.projectiles) {
            proj.position.x += proj.velocity.x * dtSec;
            proj.position.y += proj.velocity.y * dtSec;
            proj.lifeTime -= dt;
        }
    }

    private resolveCollisions(): void {
        const s = this.state;

        // --- Ships vs arena bounds ---
        this.clampToArena(s.player.position, this.config.playerHitboxWidth / 2);
        for (const enemy of s.enemies) {
            if (!enemy.isDead) this.clampToArena(enemy.position, this.config.enemyHitboxWidth / 2);
        }

        // --- Player vs islands (OBB slide) ---
        const playerOBB = createOBB(s.player.position, this.config.playerHitboxWidth, this.config.playerHitboxHeight, s.player.rotation)
        for (const island of this.arena.islands) {
            const r = polyVsPoly(playerOBB, island.polygon);
            if (r.collided && r.mtv) {
                s.player.position.x -= r.mtv.x;
                s.player.position.y -= r.mtv.y;
            }
        }

        // --- Enemies vs islands ---
        for (const enemy of s.enemies) {
            if (enemy.isDead) continue;
            const obb = createOBB(enemy.position, this.config.enemyHitboxWidth, this.config.enemyHitboxHeight, enemy.rotation);
            for (const island of this.arena.islands) {
                const r = polyVsPoly(obb, island.polygon);
                if (r.collided && r.mtv) {
                    enemy.position.x -= r.mtv.x;
                    enemy.position.y -= r.mtv.y;
                }
            }
        }

        // --- Projectiles vs bounds + islands ---
        for (const proj of s.projectiles) {
            if (proj.lifeTime <= 0) continue;
            if (proj.position.x < 0 || proj.position.x > this.arena.width ||
                proj.position.y < 0 || proj.position.y > this.arena.height) {
                proj.lifeTime = 0;
                continue;
            }
            const circle: Circle = { pos: proj.position, radius: this.config.projectileRadius };
            for (const island of this.arena.islands) {
                if (circleVsPoly(circle, island.polygon).collided) {
                    proj.lifeTime = 0;
                    break;
                }
            }
        }

        // --- Player projectiles vs enemies ---
        for (const proj of s.projectiles) {
            if (proj.lifeTime <= 0 || proj.ownerId !== 'player') continue;
            const pc: Circle = { pos: proj.position, radius: this.config.projectileRadius };
            for (const enemy of s.enemies) {
                if (enemy.isDead) continue;
                const obb = createOBB(enemy.position, this.config.enemyHitboxWidth, this.config.enemyHitboxHeight, enemy.rotation);
                if (circleVsPoly(pc, obb).collided) {
                    enemy.health -= proj.damage;
                    proj.lifeTime = 0;
                    this.events.push({ type: 'projectileHit', projectileId: proj.id, targetId: enemy.id });
                    break;
                }
            }
        }

        // --- Enemy projectiles vs player ---
        if (!s.player.isDead) {

            const pOBB = createOBB(s.player.position, this.config.playerHitboxWidth, this.config.playerHitboxHeight, s.player.rotation);
            for (const proj of s.projectiles) {
                if (proj.lifeTime <= 0 || proj.ownerId === 'player') continue;
                const pc: Circle = { pos: proj.position, radius: this.config.projectileRadius };
                if (circleVsPoly(pc, pOBB).collided) {
                    s.player.health -= proj.damage;
                    proj.lifeTime = 0;
                    this.events.push({ type: 'playerDamaged', amount: proj.damage });
                    this.events.push({ type: 'projectileHit', projectileId: proj.id, targetId: 'player' });
                }
            }

        }

        // --- Chaser collision with player ---
        if (!s.player.isDead) {

            const pOBB = createOBB(s.player.position, this.config.playerHitboxWidth, this.config.playerHitboxHeight, s.player.rotation);
            for (const enemy of s.enemies) {
                if (enemy.isDead || enemy.type !== 'chaser' || enemy.health <= 0) continue;
                const obb = createOBB(enemy.position, this.config.enemyHitboxWidth, this.config.enemyHitboxHeight, enemy.rotation);
                if (polyVsPoly(pOBB, obb).collided) {
                    s.player.health -= this.config.chaserCollisionDamage;
                    enemy.health = 0; // Will be processed in processDeathsAndScoring
                    enemy.killedByCollision = true; // No score for self-destruct
                    this.events.push({ type: 'playerDamaged', amount: this.config.chaserCollisionDamage });
                }
            }

        }

    }

    private clampToArena(pos: Vector2, margin: number): void {
        pos.x = Math.max(margin, Math.min(this.arena.width - margin, pos.x));
        pos.y = Math.max(margin, Math.min(this.arena.height - margin, pos.y));
    }

    private processDeathsAndScoring(): void {
        const s = this.state;

        if (!s.player.isDead && s.player.health <= 0) {
            s.player.isDead = true;
            s.player.health = 0;
            this.events.push({ type: 'shipDestroyed', shipId: 'player', isPlayer: true });
        }

        // Enemies killed by projectiles (chasers killed by collision already handled)
        for (const enemy of s.enemies) {
            if (!enemy.isDead && enemy.health <= 0) {
                enemy.isDead = true;
                enemy.health = 0;
                this.events.push({ type: 'shipDestroyed', shipId: enemy.id, isPlayer: false });
                // Only score kills from player projectiles, not chaser self-destruct
                if (!enemy.killedByCollision) {
                    s.score += 1;
                    this.events.push({ type: 'scoreChanged', newScore: s.score });
                }
            }
        }

    }

    private cleanup(): void {
        this.state.projectiles = this.state.projectiles.filter(p => p.lifeTime > 0);
        this.state.enemies = this.state.enemies.filter(e => !e.isDead);
    }

    private checkMatchEnd(): void {
        const s = this.state;
        // player_died takes precedence over time_up in the same tick
        if (s.player.isDead) {
            s.isGameOver = true;
            s.endReason = 'player_died';
            this.events.push({ type: 'matchEnded', reason: 'player_died' });
        } else if (s.timeRemaining <= 0) {
            s.timeRemaining = 0;
            s.isGameOver = true;
            s.endReason = 'time_up';
            this.events.push({ type: 'matchEnded', reason: 'time_up' });
        }
    }

}
