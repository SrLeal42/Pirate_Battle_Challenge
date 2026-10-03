import { Application, Container, Sprite, Graphics } from 'pixi.js';

import type { GameState } from '../core/types';
import type { GameEvent } from '../core/types';

import type { ArenaMap } from '../core/arena';
import { GAME_CONFIG } from '../core/config';
import { createOBB } from '../core/geometry';
import { getTexture } from './assets';

import { HealthBar, PLAYER_HEALTH_SKIN, ENEMY_HEALTH_SKIN } from './healthBar';

const ROTATION_OFFSET = -Math.PI / 2; // Sprites point down, our 0 = -X

const PLAYER_BAR = { width: 90, offsetY: 50 } as const;
const ENEMY_BAR = { width: 64, offsetY: 45 } as const;


export class GameRenderer {
    private app: Application;
    private arenaContainer!: Container;
    private entityContainer!: Container;
    private effectContainer!: Container;

    // Sprite pools
    private playerSprite!: Sprite;
    private enemySprites: Map<string, Sprite> = new Map();
    private projectileSprites: Map<string, Sprite> = new Map();
    private barContainer!: Container;
    private healthBars: Map<string, HealthBar> = new Map();
    private playerHealthBar!: HealthBar;


    private arenaMap: ArenaMap;
    private debugGraphics: Graphics | null = null;
    private showDebug = false;

    constructor(app: Application, arenaMap: ArenaMap) {
        this.app = app;
        this.arenaMap = arenaMap;
        this.setup();
    }

    private setup(): void {
        // Layer order: arena (tiles) → entities (ships, projectiles) → effects
        this.arenaContainer = new Container();
        this.entityContainer = new Container();
        this.barContainer = new Container();
        this.effectContainer = new Container();

        this.app.stage.addChild(this.arenaContainer, this.entityContainer, this.barContainer, this.effectContainer);

        this.buildArena();
        this.createPlayerSprite();

        this.playerHealthBar = new HealthBar(PLAYER_HEALTH_SKIN, PLAYER_BAR.width);
        this.barContainer.addChild(this.playerHealthBar);
    }

    private buildArena(): void {
        const ts = GAME_CONFIG.tileSize;
        for (const tile of this.arenaMap.tiles) {
            const alias = `tile_${tile.type}`;
            const tex = getTexture(alias);
            if (!tex) continue;

            const sprite = new Sprite(tex);
            sprite.x = tile.col * ts;
            sprite.y = tile.row * ts;
            sprite.width = ts;
            sprite.height = ts;
            this.arenaContainer.addChild(sprite);
        }
    }

    private createPlayerSprite(): void {
        const tex = getTexture('ship_player');
        this.playerSprite = new Sprite(tex);
        this.playerSprite.anchor.set(0.5);
        this.entityContainer.addChild(this.playerSprite);
    }

    // Called every frame with latest state
    update(state: Readonly<GameState>): void {
        this.updatePlayer(state);
        this.updateEnemies(state);
        this.updateProjectiles(state);
        this.updateHealthBars(state);
    }

    private updatePlayer(state: Readonly<GameState>): void {
        const p = state.player;
        this.playerSprite.x = p.position.x;
        this.playerSprite.y = p.position.y;
        this.playerSprite.rotation = p.rotation + ROTATION_OFFSET;
        this.playerSprite.visible = !p.isDead;

        const healthRatio = p.health / GAME_CONFIG.playerMaxHealth;
        let texAlias = 'ship_player';

        if (healthRatio <= 0.25) {
            texAlias = 'ship_player_damage_2';
        } else if (healthRatio <= 0.5) {
            texAlias = 'ship_player_damage_1';
        }

        const tex = getTexture(texAlias);
        if (tex && this.playerSprite.texture !== tex) {
            this.playerSprite.texture = tex;
        }
    }

    private updateEnemies(state: Readonly<GameState>): void {
        const activeIds = new Set<string>();
        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;
            activeIds.add(enemy.id);

            const maxHp = enemy.type === 'chaser' ? GAME_CONFIG.chaserHealth : GAME_CONFIG.shooterHealth;
            const healthRatio = enemy.health / maxHp;

            let texAlias = enemy.type === 'chaser' ? 'ship_chaser' : 'ship_shooter';
            if (healthRatio <= 0.25) {
                texAlias = enemy.type === 'chaser' ? 'ship_chaser_damage_2' : 'ship_shooter_damage_2';
            } else if (healthRatio <= 0.5) {
                texAlias = enemy.type === 'chaser' ? 'ship_chaser_damage_1' : 'ship_shooter_damage_1';
            }

            let sprite = this.enemySprites.get(enemy.id);
            if (!sprite) {
                sprite = new Sprite(getTexture(texAlias));
                sprite.anchor.set(0.5);
                this.entityContainer.addChild(sprite);
                this.enemySprites.set(enemy.id, sprite);
            }

            const currentTex = getTexture(texAlias);
            if (currentTex && sprite.texture !== currentTex) {
                sprite.texture = currentTex;
            }

            sprite.x = enemy.position.x;
            sprite.y = enemy.position.y;
            sprite.rotation = enemy.rotation + ROTATION_OFFSET;
        }

        // Remove sprites for dead/removed enemies
        for (const [id, sprite] of this.enemySprites) {
            if (!activeIds.has(id)) {
                this.entityContainer.removeChild(sprite);
                sprite.destroy();
                this.enemySprites.delete(id);
                this.healthBars.get(id)?.destroy();
                this.healthBars.delete(id);
            }
        }
    }

    private updateProjectiles(state: Readonly<GameState>): void {
        const activeIds = new Set<string>();

        for (const proj of state.projectiles) {
            activeIds.add(proj.id);

            let sprite = this.projectileSprites.get(proj.id);
            if (!sprite) {
                sprite = new Sprite(getTexture('cannon_ball'));
                sprite.anchor.set(0.5);
                this.entityContainer.addChild(sprite);
                this.projectileSprites.set(proj.id, sprite);
            }

            sprite.x = proj.position.x;
            sprite.y = proj.position.y;

            if (Math.random() < 0.3) {
                this.spawnTrailParticle(proj.position.x, proj.position.y);
            }
        }

        // Remove expired projectiles
        for (const [id, sprite] of this.projectileSprites) {
            if (!activeIds.has(id)) {
                this.entityContainer.removeChild(sprite);
                sprite.destroy();
                this.projectileSprites.delete(id);
            }
        }
    }

    private spawnTrailParticle(x: number, y: number): void {
        const smoke = new Graphics();

        smoke.circle(0, 0, 3);
        smoke.fill({ color: 0xcccccc, alpha: 0.5 });
        smoke.x = x;
        smoke.y = y;

        this.effectContainer.addChild(smoke);
        let life = 300;
        const ticker = this.app.ticker;

        const onTick = () => {
            life -= ticker.deltaMS;
            smoke.alpha = Math.max(0, (life / 200) * 0.5);
            smoke.scale.set(1 + (1 - life / 200) * 1.5);

            if (life <= 0) {
                ticker.remove(onTick);
                this.effectContainer.removeChild(smoke);
                smoke.destroy();
            }
        };

        ticker.add(onTick);
    }

    private updateHealthBars(state: Readonly<GameState>): void {
        const p = state.player;

        this.playerHealthBar.visible = !p.isDead;
        this.playerHealthBar.position.set(p.position.x, p.position.y - PLAYER_BAR.offsetY);
        this.playerHealthBar.setRatio(p.health / GAME_CONFIG.playerMaxHealth);

        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;

            let bar = this.healthBars.get(enemy.id);
            if (!bar) {
                bar = new HealthBar(ENEMY_HEALTH_SKIN, ENEMY_BAR.width);
                this.barContainer.addChild(bar);
                this.healthBars.set(enemy.id, bar);
            }

            const maxHp = enemy.type === 'chaser' ? GAME_CONFIG.chaserHealth : GAME_CONFIG.shooterHealth;

            bar.position.set(enemy.position.x, enemy.position.y - ENEMY_BAR.offsetY);
            bar.setRatio(enemy.health / maxHp);
        }
    }

    // Handle events for visual effects
    handleEvents(events: GameEvent[]): void {
        for (const event of events) {
            if (event.type === 'shipDestroyed') {
                this.spawnExplosion(event.shipId);
            }
        }
    }

    private spawnExplosion(shipId: string): void {
        // Get position of destroyed ship
        const sprite = shipId === 'player'
            ? this.playerSprite
            : this.enemySprites.get(shipId);
        if (!sprite) return;

        const tex = getTexture('effect_explosion1');
        if (!tex) return;

        const explosion = new Sprite(tex);
        explosion.anchor.set(0.5);
        explosion.x = sprite.x;
        explosion.y = sprite.y;
        explosion.scale.set(1.5);
        this.effectContainer.addChild(explosion);

        // Simple fade out and remove
        let life = 500; // ms
        const ticker = this.app.ticker;
        const onTick = () => {
            life -= ticker.deltaMS;
            explosion.alpha = Math.max(0, life / 500);
            if (life <= 0) {
                ticker.remove(onTick);
                this.effectContainer.removeChild(explosion);
                explosion.destroy();
            }
        };
        ticker.add(onTick);
    }

    // Debug overlay: draw collision hitboxes
    toggleDebug(): void {
        this.showDebug = !this.showDebug;
        if (!this.showDebug && this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    drawDebugOverlay(state: Readonly<GameState>): void {
        if (!this.showDebug) return;
        if (!this.debugGraphics) {
            this.debugGraphics = new Graphics();
            this.effectContainer.addChild(this.debugGraphics);
        }

        const g = this.debugGraphics;
        g.clear();

        // Island polygons
        for (const island of this.arenaMap.arenaDef.islands) {
            const poly = island.polygon;
            const points = poly.vertices.map(v => [poly.pos.x + v.x, poly.pos.y + v.y]).flat();
            g.poly(points);
            g.stroke({ color: 0xff0000, alpha: 0.5, width: 2 });
        }

        // Player hitbox (rotated OBB)
        const p = state.player;
        if (!p.isDead) {
            const obb = createOBB(p.position, GAME_CONFIG.playerHitboxWidth, GAME_CONFIG.playerHitboxHeight, p.rotation);
            const pts = obb.vertices.map(v => [obb.pos.x + v.x, obb.pos.y + v.y]).flat();
            g.poly(pts);
            g.stroke({ color: 0x00ff00, alpha: 0.5, width: 1 });
        }

        // Enemy hitboxes (rotated OBB)
        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;
            const obb = createOBB(enemy.position, GAME_CONFIG.enemyHitboxWidth, GAME_CONFIG.enemyHitboxHeight, enemy.rotation);
            const pts = obb.vertices.map(v => [obb.pos.x + v.x, obb.pos.y + v.y]).flat();
            g.poly(pts);
            g.stroke({ color: 0xffaa00, alpha: 0.5, width: 1 });
        }

        // Projectile hitboxes (circles)
        for (const proj of state.projectiles) {
            g.circle(proj.position.x, proj.position.y, GAME_CONFIG.projectileRadius);
            g.stroke({ color: 0x00ffff, alpha: 0.5, width: 1 });
        }

    }

    destroy(): void {
        // Cleanup all sprites
        for (const [, sprite] of this.enemySprites) sprite.destroy();
        for (const [, sprite] of this.projectileSprites) sprite.destroy();
        for (const [, bar] of this.healthBars) bar.destroy();
        this.enemySprites.clear();
        this.projectileSprites.clear();
        this.healthBars.clear();

        this.debugGraphics?.destroy();
        this.arenaContainer.destroy({ children: true });
        this.entityContainer.destroy({ children: true });
        this.effectContainer.destroy({ children: true });
        this.barContainer.destroy({ children: true });
    }

}
